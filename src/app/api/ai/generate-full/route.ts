import { NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { requireActivePass } from "@/lib/require-pass";
import { prisma } from "@/lib/prisma";
import { openai } from "@/lib/openai/server";
import { aggregateProviderData } from "@/lib/providers/aggregate";
import { isAdmin } from "@/lib/access/canUseAi";
import { assertRateLimits } from "@/lib/credits/rateLimitService";
import { consumeCredit, logAiUsage, refundConsumedCredit } from "@/lib/credits/creditService";
import { Prisma } from "@prisma/client";
import { ensureUserProfile } from "@/lib/profile/ensureUserProfile";
import { recordUserActivity } from "@/lib/customer-activity";
import { getAnalyticsLocation, parseUserAgent, recordAnalyticsEvent } from "@/lib/analytics-server";

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

function safeGenerationMessage(code: string) {
  if (code === "NO_ACTIVE_PASS") return "Please choose a plan to generate a new AI trip.";
  if (code === "NO_MAIN_CREDITS") return "You have used all your main AI credits. Upgrade or add credits to generate another plan.";
  if (code === "AI_BAD_JSON") return "We could not finish this AI plan cleanly. Please try generating it again.";
  if (code === "GENERATION_ALREADY_PROCESSING") return "This plan generation is already processing. Please wait a moment.";
  if (code === "NO_PROVIDER_RESULTS") return "We could not load real travel options for this trip yet. Please try another destination or date.";
  return "We could not generate your plan right now. Please try again.";
}

function generationError(code: string, message: string, status = 500) {
  const error = new Error(message) as Error & { code: string; status: number };
  error.code = code;
  error.status = status;
  return error;
}

function providerCounts(providerData: Awaited<ReturnType<typeof aggregateProviderData>>) {
  return {
    hotels: providerData.hotels.length,
    activities: providerData.activities.length,
    transports: providerData.transports.length,
    flights: providerData.flights.length,
  };
}

async function recordGenerationEvent(args: {
  req: Request;
  userId: string;
  eventName: "ai_generation_started" | "ai_generation_completed" | "ai_generation_failed" | "credit_consumed";
  destination?: string | null;
  planId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const ua = parseUserAgent(args.req.headers.get("user-agent"));
  const location = getAnalyticsLocation(args.req.headers);
  await recordAnalyticsEvent({
    userId: args.userId,
    sessionId: String(args.metadata?.generationRequestId ?? crypto.randomUUID()),
    eventName: args.eventName,
    eventCategory: "ai",
    pagePath: "/ai-planner",
    destination: args.destination ?? null,
    planId: args.planId ?? null,
    country: location.country,
    city: location.city,
    deviceType: ua.deviceType,
    browser: ua.browser,
    os: ua.os,
    metadata: args.metadata ?? {},
  });
}

async function findExistingGeneration(userId: string, generationRequestId: string) {
  return prisma.plan.findFirst({
    where: {
      userId,
      summaryJson: {
        path: ["generationRequestId"],
        equals: generationRequestId,
      } as any,
    },
    select: { id: true },
  });
}

async function hasExistingCreditCharge(userId: string, generationRequestId: string) {
  const existing = await prisma.creditLedger.findFirst({
    where: {
      userId,
      actionType: "GENERATE_DAY_PLAN",
      amount: -1,
      metadata: {
        path: ["idempotencyKey"],
        equals: generationRequestId,
      } as any,
    },
    select: { id: true },
  });
  return Boolean(existing);
}

export async function POST(req: Request) {
  let consumedUserId: string | null = null;
  let generationRequestId: string | null = null;
  let analyticsUserId: string | null = null;
  let analyticsDestination: string | null = null;

  try {
    const body = await req.json().catch(() => null);

    if (!body?.idempotencyKey) {
      return NextResponse.json({ ok: false, code: "MISSING_IDEMPOTENCY_KEY" }, { status: 400 });
    }
    generationRequestId = String(body.idempotencyKey || uuidFallback()).trim();
    if (!generationRequestId) {
      return NextResponse.json({ ok: false, code: "MISSING_IDEMPOTENCY_KEY" }, { status: 400 });
    }

    const supabase = createRouteClient();
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      return NextResponse.json({ ok: false, code: "SUPABASE_AUTH_ERROR" }, { status: 401 });
    }
    if (!data?.user) {
      return NextResponse.json({ ok: false, code: "NOT_AUTHED" }, { status: 401 });
    }

    const userId = data.user.id;
    await ensureUserProfile(data.user, "AI_GENERATION_STARTED");
    const admin = await isAdmin(userId);

    analyticsUserId = userId;

    const destination = String(body.destination ?? "Unknown");
    analyticsDestination = destination;
    const startDate = String(body.startDate ?? new Date().toISOString());
    const endDate = String(body.endDate ?? new Date().toISOString());
    const inputs = body.inputs ?? body;

    let passId: string | null = null;
    let remainingActions: number | null = null;

    const existingPlan = await findExistingGeneration(userId, generationRequestId);
    if (existingPlan) {
      return NextResponse.json({
        ok: true,
        planId: existingPlan.id,
        remainingActions,
        idempotent: true,
      });
    }

    if (!admin) {
      const passCheck = await requireActivePass(userId);
      if (!passCheck.ok || !passCheck.pass) {
        return NextResponse.json({ ok: false, code: "NO_ACTIVE_PASS" }, { status: 402 });
      }

      passId = passCheck.pass.id;

      const limitCheck = await assertRateLimits(userId, "GENERATE_DAY_PLAN");
      if (!limitCheck.ok) {
        return NextResponse.json({ ok: false, code: limitCheck.code, message: limitCheck.message }, { status: 429 });
      }

      if (await hasExistingCreditCharge(userId, generationRequestId)) {
        return NextResponse.json(
          { ok: false, code: "GENERATION_ALREADY_PROCESSING", message: safeGenerationMessage("GENERATION_ALREADY_PROCESSING") },
          { status: 409 },
        );
      }

      await recordGenerationEvent({
        req,
        userId,
        eventName: "ai_generation_started",
        destination,
        metadata: {
          generationRequestId,
          adminBypass: false,
        },
      });

      const consumed = await consumeCredit(userId, "GENERATE_DAY_PLAN", {
        planId: body.planId ?? null,
        idempotencyKey: generationRequestId,
        billableTimelineGeneration: true,
      });
      consumedUserId = userId;
      remainingActions = "status" in consumed ? consumed.status.mainCreditsRemaining : null;

      await recordGenerationEvent({
        req,
        userId,
        eventName: "credit_consumed",
        destination,
        metadata: {
          generationRequestId,
          actionType: "GENERATE_DAY_PLAN",
          remainingActions,
        },
      });
    } else {
      await recordGenerationEvent({
        req,
        userId,
        eventName: "ai_generation_started",
        destination,
        metadata: {
          generationRequestId,
          adminBypass: true,
        },
      });
    }

    const providerData = await aggregateProviderData({
      destination,
      startDate,
      endDate,
      budget: Number(body.budget ?? 0),
      currency: String(body.currency ?? "USD"),
    });
    const counts = providerCounts(providerData);
    if (!counts.hotels && !counts.activities && !counts.transports && !counts.flights) {
      throw generationError("NO_PROVIDER_RESULTS", "No provider-backed travel options were returned.", 503);
    }

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
${JSON.stringify(prompt)}`,
        },
      ],
    });

    if (!admin && passId) {
      const usage = (ai as any)?.usage;
      await logAiUsage(userId, passId, "GENERATE_DAY_PLAN", {
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
      throw generationError("AI_BAD_JSON", "OpenAI did not return valid generation JSON.", 500);
    }

    const validationWarnings: string[] = [];
    const hotel = providerData.hotels.find((h) => h.id === ranked.hotelId) ?? providerData.hotels[0];
    if (ranked.hotelId && hotel?.id !== ranked.hotelId) validationWarnings.push("hotel_id_not_found_used_provider_fallback");
    const activity =
      providerData.activities.find((a) => a.id === ranked.activityId) ?? providerData.activities[0];
    if (ranked.activityId && activity?.id !== ranked.activityId) validationWarnings.push("activity_id_not_found_used_provider_fallback");
    const flight = providerData.flights.find((f) => f.id === ranked.flightId) ?? providerData.flights[0];
    if (ranked.flightId && flight?.id !== ranked.flightId) validationWarnings.push("flight_id_not_found_used_provider_fallback");
    const transport =
      providerData.transports.find((t) => t.id === ranked.transportId) ?? providerData.transports[0];
    if (ranked.transportId && transport?.id !== ranked.transportId) validationWarnings.push("transport_id_not_found_used_provider_fallback");

    const summaryJson = JSON.parse(
      JSON.stringify({
        generationRequestId,
        inputs,
        picks: { hotel, activity, flight, transport, reasons: ranked.reasons },
        featureAnalysis: ranked.featureAnalysis,
        providerCounts: counts,
        validationWarnings,
        adminBypass: admin ? true : undefined,
      }),
    ) as Prisma.InputJsonValue;

    const plan = await prisma.plan.create({
      data: {
        userId,
        passId,
        title: body.title ?? "My Gene Smart Plan",
        destination,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        summaryJson,
      },
      select: { id: true },
    });

    await recordUserActivity({
      userId,
      event: "AI_PLAN_GENERATED",
      entityType: "PLAN",
      entityId: plan.id,
      metadata: {
        destination,
        startDate,
        endDate,
        adminBypass: admin,
      },
    });

    await recordGenerationEvent({
      req,
      userId,
      eventName: "ai_generation_completed",
      destination,
      planId: plan.id,
      metadata: {
        generationRequestId,
        adminBypass: admin,
        providerCounts: counts,
        validationWarnings,
      },
    });

    return NextResponse.json({
      ok: true,
      planId: plan.id,
      remainingActions,
    });
  } catch (e: any) {
    try {
      if (consumedUserId) {
        await refundConsumedCredit(consumedUserId, "GENERATE_DAY_PLAN", {
          reason: "AI_FAILED",
          idempotencyKey: generationRequestId,
        });
      }
    } catch {
      // keep original error response stable even if refund logging fails
    }

    if (analyticsUserId) {
      await recordGenerationEvent({
        req,
        userId: analyticsUserId,
        eventName: "ai_generation_failed",
        destination: analyticsDestination,
        metadata: {
          generationRequestId,
          errorName: e?.name ?? "Error",
          errorCode: e?.code ?? e?.errorCode ?? null,
          refunded: Boolean(consumedUserId),
        },
      }).catch(() => undefined);
    }

    const code = e?.code ?? e?.errorCode ?? "INTERNAL_ERROR";
    const status = typeof e?.status === "number" ? e.status : 500;
    console.error("AI generate-full error:", {
      code,
      message: e?.message,
      generationRequestId,
    });

    return NextResponse.json(
      { ok: false, code, message: safeGenerationMessage(code) },
      { status },
    );
  }
}
