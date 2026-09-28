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
    select: {
      id: true,
      slug: true,
      title: true,
      destination: true,
      heroImage: true,
      coverImage: true,
      daysCount: true,
      dayRecords: {
        orderBy: [{ sortOrder: "asc" }, { dayNumber: "asc" }],
        select: {
          id: true,
          dayNumber: true,
          title: true,
          city: true,
          country: true,
          description: true,
          mainImageUrl: true,
          itemRecords: {
            orderBy: { sortOrder: "asc" },
            select: {
              id: true,
              type: true,
              title: true,
              description: true,
              imageUrl: true,
              price: true,
              peopleCount: true,
              categoryLabel: true,
              affiliateUrl: true,
              sortOrder: true,
            },
          },
        },
      },
    },
  });
  if (!readyPlan) return NextResponse.json({ ok: false, code: "NOT_FOUND" }, { status: 404 });

  if (input.action === "ADD_READY_PLAN") {
    const creationKey = `ready-plan:${userId}:${readyPlan.id}`;
    const startDate = new Date();
    startDate.setUTCHours(12, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setUTCDate(endDate.getUTCDate() + Math.max(0, readyPlan.daysCount - 1));

    const result = await prisma.$transaction(async (tx) => {
      const existingPlans = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        select id::text from public.customer_plans
        where user_id=${userId}::uuid and creation_key=${creationKey}
        limit 1
      `);
      let customerPlanId = existingPlans[0]?.id ?? null;

      if (!customerPlanId) {
        const createdPlans = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
          insert into public.customer_plans (
            user_id, creation_key, status, planning_stage, title, destination,
            start_date, end_date, inputs_json, summary_json
          ) values (
            ${userId}::uuid, ${creationKey}, 'RECOMMENDED', 'TIMELINE_READY',
            ${readyPlan.title}, ${readyPlan.destination}, ${startDate}, ${endDate},
            ${JSON.stringify({ sourceType: "READY_PLAN", sourceReadyPlanId: readyPlan.id, sourceReadyPlanSlug: readyPlan.slug, datesSelected: false })}::jsonb,
            ${JSON.stringify({ coverImage: readyPlan.coverImage || readyPlan.heroImage, sourceReadyPlanId: readyPlan.id })}::jsonb
          )
          returning id::text as id
        `);
        customerPlanId = createdPlans[0].id;

        if (readyPlan.dayRecords.length) {
          const dayValues = readyPlan.dayRecords.map((_, dayIndex) =>
            Prisma.sql`(${customerPlanId}::uuid, ${dayIndex}, null)`,
          );
          await tx.$executeRaw(Prisma.sql`
            insert into public.customer_plan_days (plan_id, day_index, day_date)
            values ${Prisma.join(dayValues)}
            on conflict (plan_id, day_index) do nothing
          `);

          const customerDays = await tx.$queryRaw<Array<{ id: string; dayIndex: number }>>(Prisma.sql`
            select id::text as id, day_index as "dayIndex"
            from public.customer_plan_days
            where plan_id=${customerPlanId}::uuid
          `);
          const customerDayByIndex = new Map(customerDays.map((day) => [day.dayIndex, day.id]));
          const itemValues = readyPlan.dayRecords.flatMap((day, dayIndex) => {
            const customerDayId = customerDayByIndex.get(dayIndex);
            if (!customerDayId) return [];
            return day.itemRecords.map((item) => Prisma.sql`(
              ${customerDayId}::uuid, ${`day-${day.dayNumber}`}, ${item.type || "activity"},
              ${item.title}, ${item.description}, null, ${item.id}, ${item.imageUrl},
              ${item.affiliateUrl},
              ${JSON.stringify({
                readyPlanDayId: day.id,
                readyPlanItemId: item.id,
                dayTitle: day.title,
                city: day.city,
                country: day.country,
                dayDescription: day.description,
                dayImage: day.mainImageUrl,
                price: item.price,
                peopleCount: item.peopleCount,
                categoryLabel: item.categoryLabel,
                sortOrder: item.sortOrder,
              })}::jsonb
            )`);
          });
          if (itemValues.length) {
            await tx.$executeRaw(Prisma.sql`
              insert into public.customer_plan_items (
                plan_day_id, slot, kind, title, description, provider,
                provider_id, image_url, deeplink, metadata
              ) values ${Prisma.join(itemValues)}
            `);
          }
        }
      }

      const existing = await tx.savedItem.findFirst({ where: { userId, kind: "READY_PLAN", refId: readyPlan.id } });
      const meta = {
        source: "MY_TRIPS",
        title: readyPlan.title,
        slug: readyPlan.slug,
        coverImage: readyPlan.coverImage || readyPlan.heroImage,
        customerPlanId,
      } as Prisma.InputJsonValue;
      const saved = existing
        ? await tx.savedItem.update({ where: { id: existing.id }, data: { meta } })
        : await tx.savedItem.create({ data: { userId, kind: "READY_PLAN", refId: readyPlan.id, meta } });
      return { saved, customerPlanId, existing: Boolean(existingPlans[0]) };
    }, { maxWait: 10_000, timeout: 30_000 });
    await recordUserActivity({ userId, event: "TRIP_ADDED_FROM_READY_PLAN", entityType: "READY_PLAN", entityId: readyPlan.id });
    return NextResponse.json({ ok: true, savedItemId: result.saved.id, customerPlanId: result.customerPlanId, existing: result.existing });
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
