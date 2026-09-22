import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { createRouteClient } from "@/lib/supabase/server";
import { ensureUserProfile } from "@/lib/profile/ensureUserProfile";
import { mergeGeneTripMeta, objectValue } from "@/lib/profile/trip-utils";
import { recordUserActivity } from "@/lib/customer-activity";

export const dynamic = "force-dynamic";

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("ARCHIVE"), planId: z.string().uuid() }),
  z.object({ action: z.literal("RESTORE"), planId: z.string().uuid() }),
  z.object({ action: z.literal("DUPLICATE"), planId: z.string().uuid() }),
  z.object({ action: z.literal("ADD_READY_PLAN"), readyPlanId: z.string().uuid() }),
  z.object({ action: z.literal("CUSTOMIZE_READY_PLAN"), readyPlanId: z.string().uuid() }),
]);

async function authenticatedUserId() {
  const supabase = createRouteClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  await ensureUserProfile(data.user);
  return data.user.id;
}

export async function POST(request: NextRequest) {
  const userId = await authenticatedUserId();
  if (!userId) return NextResponse.json({ ok: false, code: "NOT_AUTHED" }, { status: 401 });

  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, code: "INVALID_INPUT" }, { status: 400 });
  const input = parsed.data;

  if (input.action === "ARCHIVE" || input.action === "RESTORE") {
    const plan = await prisma.plan.findFirst({ where: { id: input.planId, userId }, select: { id: true, inputsJson: true } });
    if (!plan) return NextResponse.json({ ok: false, code: "NOT_FOUND" }, { status: 404 });
    await prisma.plan.update({
      where: { id: plan.id },
      data: { inputsJson: mergeGeneTripMeta(plan.inputsJson, { archivedAt: input.action === "ARCHIVE" ? new Date().toISOString() : null }) },
    });
    await recordUserActivity({ userId, event: input.action === "ARCHIVE" ? "TRIP_ARCHIVED" : "TRIP_RESTORED", entityType: "PLAN", entityId: plan.id });
    return NextResponse.json({ ok: true });
  }

  if (input.action === "DUPLICATE") {
    const source = await prisma.plan.findFirst({
      where: { id: input.planId, userId },
      include: { days: { orderBy: { dayIndex: "asc" }, include: { items: true } } },
    });
    if (!source) return NextResponse.json({ ok: false, code: "NOT_FOUND" }, { status: 404 });

    const copy = await prisma.$transaction(async (tx) => {
      const created = await tx.plan.create({
        data: {
          userId,
          passId: source.passId,
          status: "DRAFT",
          title: `${source.title} Copy`,
          destination: source.destination,
          startDate: source.startDate,
          endDate: source.endDate,
          inputsJson: mergeGeneTripMeta(source.inputsJson, { archivedAt: null, planningStage: "DAY_BY_DAY" }),
          recommendationJson: source.recommendationJson ?? Prisma.JsonNull,
          analysisJson: source.analysisJson ?? Prisma.JsonNull,
          summaryJson: source.summaryJson ?? Prisma.JsonNull,
        },
      });
      for (const day of source.days) {
        const createdDay = await tx.planDay.create({ data: { planId: created.id, dayIndex: day.dayIndex, date: day.date } });
        if (day.items.length) {
          await tx.planItem.createMany({
            data: day.items.map((item) => ({
              planDayId: createdDay.id,
              slot: item.slot,
              kind: item.kind,
              startTime: item.startTime,
              endTime: item.endTime,
              provider: item.provider,
              providerId: item.providerId,
              imageUrl: item.imageUrl,
              deeplink: item.deeplink,
              meta: item.meta ?? Prisma.JsonNull,
            })),
          });
        }
      }
      return created;
    });
    await recordUserActivity({ userId, event: "TRIP_DUPLICATED", entityType: "PLAN", entityId: copy.id, metadata: { sourcePlanId: source.id } });
    return NextResponse.json({ ok: true, planId: copy.id });
  }

  const readyPlan = await prisma.readyPlan.findFirst({
    where: { id: input.readyPlanId, status: "PUBLISHED" },
    select: { id: true, slug: true, title: true, destination: true, heroImage: true, coverImage: true, daysCount: true },
  });
  if (!readyPlan) return NextResponse.json({ ok: false, code: "NOT_FOUND" }, { status: 404 });

  if (input.action === "ADD_READY_PLAN") {
    const existing = await prisma.savedItem.findFirst({ where: { userId, kind: "READY_PLAN", refId: readyPlan.id } });
    const saved = existing || await prisma.savedItem.create({
      data: {
        userId,
        kind: "READY_PLAN",
        refId: readyPlan.id,
        meta: { source: "MY_TRIPS", title: readyPlan.title, slug: readyPlan.slug, coverImage: readyPlan.coverImage || readyPlan.heroImage } as Prisma.InputJsonValue,
      },
    });
    await recordUserActivity({ userId, event: "TRIP_ADDED_FROM_READY_PLAN", entityType: "READY_PLAN", entityId: readyPlan.id });
    return NextResponse.json({ ok: true, savedItemId: saved.id, existing: Boolean(existing) });
  }

  const existingCustomized = await prisma.plan.findMany({ where: { userId }, select: { id: true, inputsJson: true } }).then((plans) =>
    plans.find((plan) => {
      const geneTrip = objectValue(objectValue(plan.inputsJson).geneTrip as Prisma.JsonValue);
      return geneTrip.sourceReadyPlanId === readyPlan.id && geneTrip.sourceType === "READY_PLAN_CUSTOMIZED";
    }),
  );
  if (existingCustomized) return NextResponse.json({ ok: true, planId: existingCustomized.id, existing: true });

  const placeholderDate = new Date();
  placeholderDate.setUTCHours(12, 0, 0, 0);
  const plan = await prisma.plan.create({
    data: {
      userId,
      status: "DRAFT",
      title: readyPlan.title,
      destination: readyPlan.destination,
      startDate: placeholderDate,
      endDate: placeholderDate,
      inputsJson: mergeGeneTripMeta({}, {
        sourceType: "READY_PLAN_CUSTOMIZED",
        accessType: "FREE",
        planningStage: "INPUT",
        sourceReadyPlanId: readyPlan.id,
        sourceReadyPlanSlug: readyPlan.slug,
        coverImage: readyPlan.coverImage || readyPlan.heroImage || undefined,
        datesSelected: false,
      }),
    },
  });
  await recordUserActivity({ userId, event: "TRIP_CUSTOMIZATION_STARTED", entityType: "PLAN", entityId: plan.id, metadata: { sourceReadyPlanId: readyPlan.id } });
  return NextResponse.json({ ok: true, planId: plan.id });
}
