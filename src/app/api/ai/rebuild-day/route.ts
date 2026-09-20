import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { openai } from "@/lib/openai/server";
import { createRouteClient } from "@/lib/supabase/server";
import { assertRateLimits } from "@/lib/credits/rateLimitService";
import { logAiUsage } from "@/lib/credits/creditService";
import { isAdmin } from "@/lib/access/canUseAi";

function safeJson<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const supabase = createRouteClient();
    const { data } = await supabase.auth.getUser();
    if (!data?.user) {
      return NextResponse.json({ ok: false, code: "NOT_AUTHED" }, { status: 401 });
    }

    const userId = data.user.id;
    const requesterIsAdmin = await isAdmin(userId);
    const body = await req.json().catch(() => null);
    const planId = String(body?.planId ?? "");
    const dayIndex = Number(body?.dayIndex ?? 0);

    if (!planId || !dayIndex) {
      return NextResponse.json({ ok: false, code: "MISSING_FIELDS" }, { status: 400 });
    }

    const plan = await prisma.plan.findFirst({
      where: requesterIsAdmin ? { id: planId } : { id: planId, userId },
      select: {
        userId: true,
        destination: true,
        inputsJson: true,
        recommendationJson: true,
        summaryJson: true,
        startDate: true,
        endDate: true,
        passId: true,
      },
    });

    if (!plan) {
      return NextResponse.json({ ok: false, code: "PLAN_NOT_FOUND" }, { status: 404 });
    }

    const limitCheck = await assertRateLimits(userId, "GENERATE_DAY_PLAN");
    if (!limitCheck.ok) {
      return NextResponse.json({ ok: false, code: limitCheck.code, message: limitCheck.message }, { status: 429 });
    }

    const recommendation = (plan.recommendationJson as any) ?? {};
    const summary = (plan.summaryJson as any) ?? { timeline: [] };
    const timeline = Array.isArray(summary.timeline) ? summary.timeline : [];
    const targetDay = timeline.find((d: any) => d.dayIndex === dayIndex);

    if (!targetDay) {
      return NextResponse.json({ ok: false, code: "DAY_NOT_FOUND" }, { status: 404 });
    }

    const payload = {
      destination: plan.destination,
      inputs: plan.inputsJson,
      providerData: recommendation.providerData,
      currentPicks: recommendation.picks,
      rebuildDay: targetDay,
    };

    const ai = await openai.responses.create({
      model: "gpt-5",
      reasoning: { effort: "low" },
      input: [
        {
          role: "user",
          content: `
Rebuild ONLY one day of a Gene Travel plan.

Rules:
- Use ONLY providerData items.
- Return JSON only.
- Do not invent.
- Keep realistic non-overlapping timing.

Return:
{
  "dayIndex": ${dayIndex},
  "date": "${targetDay.date}",
  "blocks": [
    {
      "slot": "MORNING|MIDDAY|AFTERNOON|EVENING",
      "kind": "HOTEL|ACTIVITY|TRANSPORT|FLIGHT",
      "title": "string",
      "providerItemId": "string|null",
      "startTime": "HH:MM",
      "endTime": "HH:MM",
      "notes": "short"
    }
  ]
}

INPUT JSON:
${JSON.stringify(payload)}
          `.trim(),
        },
      ],
    });

    const parsed = safeJson<any>(ai.output_text ?? "");
    if (!parsed?.blocks || !Array.isArray(parsed.blocks)) {
      return NextResponse.json({ ok: false, code: "AI_BAD_JSON" }, { status: 500 });
    }

    await logAiUsage(userId, plan.passId ?? null, "GENERATE_DAY_PLAN", {
      inputTokens: (ai as any)?.usage?.input_tokens ?? null,
      outputTokens: (ai as any)?.usage?.output_tokens ?? null,
      totalTokens: (ai as any)?.usage?.total_tokens ?? null,
      model: "gpt-5",
    });

    const nextTimeline = timeline.map((d: any) =>
      d.dayIndex === dayIndex ? { ...d, blocks: parsed.blocks } : d
    );

    await prisma.plan.update({
      where: { id: planId },
      data: {
        summaryJson: { timeline: nextTimeline },
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, code: "INTERNAL_ERROR", message: "Unable to rebuild this day right now." },
      { status: 500 }
    );
  }
}
