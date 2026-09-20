import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dataService } from "@/lib/services/dataService";
import { PlanItemSlot } from "@prisma/client";
import { assertRateLimits } from "@/lib/credits/rateLimitService";
import { logAiUsage } from "@/lib/credits/creditService";
import { ANALYTICS_SESSION_COOKIE, getAnalyticsLocation, parseUserAgent, recordAnalyticsEvent } from "@/lib/analytics-server";
import { createRouteClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/access/canUseAi";
import { openai } from "@/lib/openai/server";

type Body = {
  dayIndex: number;
  mode?: "balanced" | "relaxed" | "adventure";
};

const SLOTS: { slot: PlanItemSlot; start: string; end: string }[] = [
  { slot: PlanItemSlot.MORNING, start: "09:00", end: "11:00" },
  { slot: PlanItemSlot.MIDDAY, start: "11:30", end: "14:00" },
  { slot: PlanItemSlot.AFTERNOON, start: "15:00", end: "17:00" },
  { slot: PlanItemSlot.EVENING, start: "18:00", end: "20:00" },
];

function safeJson<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createRouteClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const requesterUserId = data.user.id;
    const requesterIsAdmin = await isAdmin(requesterUserId);
    const planId = params.id;
    const body = (await req.json()) as Body;

    if (typeof body.dayIndex !== "number") {
      return NextResponse.json({ error: "Missing dayIndex" }, { status: 400 });
    }

    const plan = await prisma.plan.findFirst({
      where: requesterIsAdmin ? { id: planId } : { id: planId, userId: requesterUserId },
      include: { days: { include: { items: true } } },
    });

    if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

    const day = plan.days.find((d: any) => d.dayIndex === body.dayIndex);
    if (!day) return NextResponse.json({ error: "Day not found" }, { status: 404 });

    const limitCheck = await assertRateLimits(requesterUserId, "GENERATE_DAY_PLAN");
    if (!limitCheck.ok) {
      return NextResponse.json({ error: limitCheck.message, code: limitCheck.code }, { status: 429 });
    }

    // delete existing items in this day
    await prisma.planItem.deleteMany({ where: { planDayId: day.id } });

    // safe date string
    const dayDateISO =
      typeof (day as any).date === "string"
        ? (day as any).date
        : typeof (day as any).date?.toISOString === "function"
        ? (day as any).date.toISOString()
        : undefined;

    const activities = await dataService.searchActivities({
      destination: plan.destination,
      date: dayDateISO,
    });

    if (!activities.length) {
      return NextResponse.json({ error: "No activities available" }, { status: 500 });
    }

    const sorted = [...activities].sort((a, b) => {
      if (body.mode === "relaxed") return Number(a.fatigueImpact ?? 0) - Number(b.fatigueImpact ?? 0);
      if (body.mode === "adventure") return Number(b.preferenceScore ?? 0) - Number(a.preferenceScore ?? 0);
      return Number(b.preferenceScore ?? 0.5) - Number(a.preferenceScore ?? 0.5);
    });

    let selected = sorted.slice(0, SLOTS.length);

    try {
      const ai = await openai.responses.create({
        model: "gpt-5",
        reasoning: { effort: "low" },
        input: [
          {
            role: "user",
            content: `You are Gene Travel day-rebuild AI.

Choose the best activity for each slot using ONLY the provided candidates.
Do not invent new activities.
Return strict JSON only in this shape:
{
  "selections": [
    { "slot": "MORNING", "activityId": "string", "why": "short reason" },
    { "slot": "MIDDAY", "activityId": "string", "why": "short reason" },
    { "slot": "AFTERNOON", "activityId": "string", "why": "short reason" },
    { "slot": "EVENING", "activityId": "string", "why": "short reason" }
  ]
}

Trip context:
${JSON.stringify({
  destination: plan.destination,
  mode: body.mode ?? "balanced",
  dayIndex: body.dayIndex,
  candidates: sorted.map((activity) => ({
    id: activity.id,
    title: activity.title,
    subtitle: activity.subtitle,
    fatigueImpact: activity.fatigueImpact,
    safetyScore: activity.safetyScore,
    seasonScore: activity.seasonScore,
    preferenceScore: activity.preferenceScore,
    priceAmount: activity.priceAmount,
    priceCurrency: activity.priceCurrency,
  })),
})}`,
          },
        ],
      });

      const parsed = safeJson<{ selections?: Array<{ slot: keyof typeof PlanItemSlot | string; activityId: string; why?: string }> }>(ai.output_text ?? "");
      const picked = (parsed?.selections ?? [])
        .map((selection) => sorted.find((activity) => activity.id === selection.activityId || activity.providerRef === selection.activityId))
        .filter(Boolean) as typeof sorted;

      if (picked.length) {
        const deduped: typeof sorted = [];
        for (const activity of picked) {
          if (!deduped.some((item) => item.id === activity.id)) deduped.push(activity);
          if (deduped.length >= SLOTS.length) break;
        }

        if (deduped.length < SLOTS.length) {
          for (const activity of sorted) {
            if (!deduped.some((item) => item.id === activity.id)) deduped.push(activity);
            if (deduped.length >= SLOTS.length) break;
          }
        }

        selected = deduped.slice(0, SLOTS.length);
      }

      await logAiUsage(requesterUserId, plan.passId ?? null, "GENERATE_DAY_PLAN", {
        inputTokens: (ai as any)?.usage?.input_tokens ?? null,
        outputTokens: (ai as any)?.usage?.output_tokens ?? null,
        totalTokens: (ai as any)?.usage?.total_tokens ?? null,
        model: "gpt-5",
      });
    } catch (aiError) {
      console.warn("rebuild-day ai fallback:", aiError);
    }

    await prisma.$transaction(
      selected.map((activity, i) => {
        const slot = SLOTS[i];

        return prisma.planItem.create({
          data: {
            planDayId: day.id,

            slot: slot.slot,
            startTime: slot.start,
            endTime: slot.end,

            kind: "ACTIVITY",
            provider: activity.provider,
            providerId: activity.providerRef,

            imageUrl: activity.imageUrl ?? null,
            deeplink: activity.affiliateUrl ?? null,

            meta: {
              title: activity.title,
              subtitle: activity.subtitle ?? null,
              priceAmount: activity.priceAmount ?? null,
              priceCurrency: activity.priceCurrency ?? null,
              fatigueImpact: activity.fatigueImpact ?? null,
              safetyScore: activity.safetyScore ?? null,
              seasonScore: activity.seasonScore ?? null,
              preferenceScore: activity.preferenceScore ?? null,
            },
          },
        });
      })
    );
    const freshPlan = await prisma.plan.findUnique({
      where: { id: planId },
      include: { days: { include: { items: true }, orderBy: { dayIndex: "asc" } } },
    });

    const sessionId = req.cookies.get(ANALYTICS_SESSION_COOKIE)?.value || crypto.randomUUID();
    const location = getAnalyticsLocation(req.headers);
    const agent = parseUserAgent(req.headers.get("user-agent"));
    await recordAnalyticsEvent({
      userId: requesterUserId,
      sessionId,
      eventName: "recommendation_regenerated",
      eventCategory: "ai",
      pagePath: `/api/plan/${planId}/rebuild-day`,
      referrer: req.headers.get("referer"),
      country: location.country,
      city: location.city,
      deviceType: agent.deviceType,
      browser: agent.browser,
      os: agent.os,
      metadata: {
        planId,
        planOwnerId: plan.userId,
        dayIndex: body.dayIndex,
        mode: body.mode ?? "balanced",
        adminBypass: requesterIsAdmin,
      },
    });

    return NextResponse.json({ ok: true, plan: freshPlan });
  } catch (e: any) {
    console.error("rebuild-day error:", e);
    return NextResponse.json({ error: "Failed to rebuild day" }, { status: 500 });
  }
}
