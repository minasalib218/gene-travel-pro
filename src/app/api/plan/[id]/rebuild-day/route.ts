import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dataService } from "@/lib/services/dataService";
import { PassStatus, PlanItemSlot } from "@prisma/client";
import { assertRateLimits } from "@/lib/credits/rateLimitService";
import { consumeCredit, refundConsumedCredit } from "@/lib/credits/creditService";
import { ANALYTICS_SESSION_COOKIE, getAnalyticsLocation, parseUserAgent, recordAnalyticsEvent } from "@/lib/analytics-server";

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

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  let consumedUserId: string | null = null;
  let consumedPlanId: string | null = null;
  try {
    const planId = params.id;
    const body = (await req.json()) as Body;

    if (typeof body.dayIndex !== "number") {
      return NextResponse.json({ error: "Missing dayIndex" }, { status: 400 });
    }

    const plan = await prisma.plan.findUnique({
      where: { id: planId },
      include: { days: { include: { items: true } } },
    });

    if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

    const day = plan.days.find((d: any) => d.dayIndex === body.dayIndex);
    if (!day) return NextResponse.json({ error: "Day not found" }, { status: 404 });

    // PASS enforcement (main credits)
    const now = new Date();
    const pass = plan.passId
      ? await prisma.pass.findUnique({ where: { id: plan.passId } })
      : await prisma.pass.findFirst({
          where: {
            userId: plan.userId,
            status: PassStatus.ACTIVE,
            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
          },
          orderBy: { createdAt: "desc" },
        });

    if (!pass) return NextResponse.json({ error: "No active pass" }, { status: 402 });

    const limitCheck = await assertRateLimits(plan.userId, "GENERATE_DAY_PLAN");
    if (!limitCheck.ok) {
      return NextResponse.json({ error: limitCheck.message, code: limitCheck.code }, { status: 429 });
    }

    await consumeCredit(plan.userId, "GENERATE_DAY_PLAN", { planId, dayIndex: body.dayIndex, mode: body.mode ?? "balanced" });
    consumedUserId = plan.userId;
    consumedPlanId = planId;

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

    const selected = sorted.slice(0, SLOTS.length);

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
      userId: plan.userId,
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
        dayIndex: body.dayIndex,
        mode: body.mode ?? "balanced",
      },
    });

    return NextResponse.json({ ok: true, plan: freshPlan });
  } catch (e: any) {
    console.error("rebuild-day error:", e);
    try {
      if (consumedUserId && consumedPlanId) {
        await refundConsumedCredit(consumedUserId, "GENERATE_DAY_PLAN", { reason: "AI_FAILED", planId: consumedPlanId });
      }
    } catch {
      // preserve original response
    }
    return NextResponse.json({ error: e?.message ?? "Failed to rebuild day" }, { status: 500 });
  }
}
