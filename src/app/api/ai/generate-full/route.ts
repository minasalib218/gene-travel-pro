import { NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { requireActivePass } from "@/lib/require-pass";
import { prisma } from "@/lib/prisma";
import { openai } from "@/lib/openai/server";
import { aggregateProviderData } from "@/lib/providers/aggregate";
import { isAdmin } from "@/lib/access/canUseAi";
import { assertRateLimits } from "@/lib/credits/rateLimitService";
import { consumeCredit, logAiUsage, refundConsumedCredit } from "@/lib/credits/creditService";

function pickJson<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function uuidFallback() {
  return String(Date.now()) + "-" + Math.random().toString(16).slice(2);
}

export async function POST(req: Request) {
  let consumedUserId: string | null = null;
  try {
    // ✅ ENV admin bypass (must be inside POST)
    const cookie = req.headers.get("cookie") ?? "";
    const isEnvAdmin = cookie.includes("admin_auth=1");

    const body = await req.json().catch(() => null);

    // ✅ Trial path for ENV admin (no Supabase required)
    if (isEnvAdmin) {
      const destination = String(body?.destination ?? "Trial Destination");
      const startDate = String(body?.startDate ?? new Date().toISOString());
      const endDate = String(body?.endDate ?? new Date().toISOString());
      const inputs = body?.inputs ?? body ?? null;

      // IMPORTANT:
      // If your DB has FK from plans.userId -> profiles.id,
      // set ADMIN_USER_ID in .env.local to a real Supabase UUID.
      const adminUserId = process.env.ADMIN_USER_ID || "trial-admin";

      // try to provision profile (safe if exists)
      try {
        await prisma.profile.upsert({
          where: { id: adminUserId },
          update: {},
          create: { id: adminUserId, email: process.env.ADMIN_EMAIL ?? null },
          select: { id: true },
        });
      } catch {
        // ignore - if FK enforced and adminUserId isn't valid, this will fail later.
      }

      // ✅ Make provider-like stub so UI can render
      const providerData = {
        hotels: [
          { id: "h1", name: "Trial Hotel", deeplink: "#", imageUrl: "", meta: {} },
        ],
        activities: [
          { id: "a1", name: "Trial Activity", deeplink: "#", imageUrl: "", meta: {} },
        ],
        flights: [
          { id: "f1", name: "Trial Flight", deeplink: "#", imageUrl: "", meta: {} },
        ],
        transports: [
          { id: "t1", name: "Trial Transport", deeplink: "#", imageUrl: "", meta: {} },
        ],
      };

      const ranked = {
        hotelId: "h1",
        activityId: "a1",
        flightId: "f1",
        transportId: "t1",
        reasons: {
          hotel: "Trial pick",
          activity: "Trial pick",
          flight: "Trial pick",
          transport: "Trial pick",
        },
        featureAnalysis: [
          { key: "budget_meter", text: "Trial mode" },
          { key: "weather_awareness", text: "Trial mode" },
          { key: "route_timing", text: "Trial mode" },
          { key: "family_mode", text: "Trial mode" },
        ],
      };

      const plan = await prisma.plan.create({
        data: {
          userId: adminUserId,
          passId: null,
          title: String(body?.title ?? "Trial Gene Smart Plan"),
          destination,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          summaryJson: {
            inputs,
            picks: {
              hotel: providerData.hotels[0],
              activity: providerData.activities[0],
              flight: providerData.flights[0],
              transport: providerData.transports[0],
              reasons: ranked.reasons,
            },
            featureAnalysis: ranked.featureAnalysis,
            adminBypass: true,
            trial: true,
          },
        },
        select: { id: true },
      });

      return NextResponse.json({
        ok: true,
        planId: plan.id,
        remainingActions: 999,
        admin: true,
        trial: true,
      });
    }

    // =========================
    // Normal customer path (Supabase)
    // =========================
    const supabase = createRouteClient();
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      return NextResponse.json({ ok: false, code: "SUPABASE_AUTH_ERROR" }, { status: 401 });
    }
    if (!data?.user) {
      return NextResponse.json({ ok: false, code: "NOT_AUTHED" }, { status: 401 });
    }

    if (!body?.idempotencyKey) {
      return NextResponse.json({ ok: false, code: "MISSING_IDEMPOTENCY_KEY" }, { status: 400 });
    }

    const userId = data.user.id;
    const admin = await isAdmin(userId);

    const destination = String(body.destination ?? "Unknown");
    const startDate = String(body.startDate ?? new Date().toISOString());
    const endDate = String(body.endDate ?? new Date().toISOString());
    const inputs = body.inputs ?? body;

    let passId: string | null = null;
    let remainingActions: number | null = null;

    if (!admin) {
      const passCheck = await requireActivePass(userId);
      if (!passCheck.ok || !passCheck.pass) {
        return NextResponse.json({ ok: false, code: "NO_ACTIVE_PASS" }, { status: 402 });
      }

      passId = passCheck.pass.id;

      const limitCheck = await assertRateLimits(userId, "GENERATE_RECOMMENDATIONS");
      if (!limitCheck.ok) {
        return NextResponse.json({ ok: false, code: limitCheck.code, message: limitCheck.message }, { status: 429 });
      }

      const consumed = await consumeCredit(userId, "GENERATE_RECOMMENDATIONS", {
        planId: body.planId ?? null,
        idempotencyKey: body.idempotencyKey || uuidFallback(),
      });
      consumedUserId = userId;
      remainingActions = "status" in consumed ? consumed.status.mainCreditsRemaining : null;
    }

    const providerData = await aggregateProviderData({
      destination,
      startDate,
      endDate,
      budget: Number(body.budget ?? 0),
      currency: String(body.currency ?? "USD"),
    });

    const prompt = {
      destination,
      startDate,
      endDate,
      inputs,
      providerData,
      rules: [
        "Do NOT invent hotels/activities/flights/transports.",
        "Choose only from providerData lists.",
        "Return JSON only.",
        "Output must include selected IDs + reasons + featureAnalysis (text).",
      ],
    };

    const ai = await openai.responses.create({
      model: "gpt-5",
      reasoning: { effort: "low" },
      input: [
        {
          role: "user",
          content: `You are Gene Travel ranking engine. Using ONLY the providerData, pick the best hotel, activity, flight, and transport for the user. Return JSON in this exact shape:

{
  "hotelId": "string",
  "activityId": "string",
  "flightId": "string",
  "transportId": "string",
  "reasons": {
    "hotel": "short",
    "activity": "short",
    "flight": "short",
    "transport": "short"
  },
  "featureAnalysis": [
    { "key": "budget_meter", "text": "..." },
    { "key": "weather_awareness", "text": "..." },
    { "key": "route_timing", "text": "..." },
    { "key": "family_mode", "text": "..." }
  ]
}

Here is the input JSON:
${JSON.stringify(prompt)}`
        },
      ],
    });

    if (!admin && passId) {
      const usage = (ai as any)?.usage;
      await logAiUsage(userId, passId, "GENERATE_RECOMMENDATIONS", {
        inputTokens: usage?.input_tokens ?? null,
        outputTokens: usage?.output_tokens ?? null,
        totalTokens: usage?.total_tokens ?? null,
        model: "gpt-5",
        estimatedCost: null,
      });
    }

    const text = ai.output_text ?? "";
    const ranked = pickJson<{
      hotelId: string;
      activityId: string;
      flightId: string;
      transportId: string;
      reasons: Record<string, string>;
      featureAnalysis: Array<{ key: string; text: string }>;
    }>(text);

    if (!ranked) {
      return NextResponse.json(
        { ok: false, code: "AI_BAD_JSON", message: "OpenAI did not return valid JSON." },
        { status: 500 }
      );
    }

    const hotel = providerData.hotels.find((h) => h.id === ranked.hotelId) ?? providerData.hotels[0];
    const activity =
      providerData.activities.find((a) => a.id === ranked.activityId) ?? providerData.activities[0];
    const flight = providerData.flights.find((f) => f.id === ranked.flightId) ?? providerData.flights[0];
    const transport =
      providerData.transports.find((t) => t.id === ranked.transportId) ?? providerData.transports[0];

    const plan = await prisma.plan.create({
      data: {
        userId,
        passId,
        title: body.title ?? "My Gene Smart Plan",
        destination,
        startDate: new Date(startDate),
        endDate: new Date(endDate),

        summaryJson: {
          inputs,
          picks: { hotel, activity, flight, transport, reasons: ranked.reasons },
          featureAnalysis: ranked.featureAnalysis,
          adminBypass: admin ? true : undefined,
        },
      },
      select: { id: true },
    });

    return NextResponse.json({
      ok: true,
      planId: plan.id,
      remainingActions,
    });
  } catch (e: any) {
    try {
      const cookie = req.headers.get("cookie") ?? "";
      const isEnvAdmin = cookie.includes("admin_auth=1");
      if (!isEnvAdmin && consumedUserId) {
        await refundConsumedCredit(consumedUserId, "GENERATE_RECOMMENDATIONS", {
            reason: "AI_FAILED",
        });
      }
    } catch {
      // keep original error response stable even if refund logging fails
    }
    return NextResponse.json(
      { ok: false, code: "INTERNAL_ERROR", message: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
