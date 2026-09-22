import { Prisma, type PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type DbClient = PrismaClient | Prisma.TransactionClient;

export type CustomerPlanItem = {
  planId: string;
  itemId: string;
  provider: string | null;
  deeplink: string | null;
  title: string | null;
};

export type ControlCentreTripOverview = {
  id: string;
  title: string;
  destination: string;
  status: string;
  planningStage: string;
  startDate: Date;
  endDate: Date;
  bookingTotal: number;
  bookingConfirmed: number;
  taskTotal: number;
  taskCompleted: number;
  packingTotal: number;
  packingCompleted: number;
  plannedBudget: number | null;
  spentBudget: number;
  currency: string | null;
  readinessScore: number | null;
  nextAction: string | null;
};

export async function listCustomerControlCentreTrips(userId: string) {
  return prisma.$queryRaw<ControlCentreTripOverview[]>(Prisma.sql`
    select
      p.id::text as id,
      p.title,
      p.destination,
      p.status::text as status,
      p.planning_stage::text as "planningStage",
      p.start_date as "startDate",
      p.end_date as "endDate",
      coalesce(b.total, 0)::int as "bookingTotal",
      coalesce(b.confirmed, 0)::int as "bookingConfirmed",
      coalesce(t.total, 0)::int as "taskTotal",
      coalesce(t.completed, 0)::int as "taskCompleted",
      coalesce(k.total, 0)::int as "packingTotal",
      coalesce(k.completed, 0)::int as "packingCompleted",
      budget.planned_total::float8 as "plannedBudget",
      coalesce(expense.spent, 0)::float8 as "spentBudget",
      budget.currency,
      readiness.score::int as "readinessScore",
      readiness.next_action as "nextAction"
    from public.customer_plans p
    left join lateral (
      select count(*) as total,
        count(*) filter (where status in ('CUSTOMER_CONFIRMED','PROVIDER_CONFIRMED')) as confirmed
      from public.trip_booking_records where plan_id = p.id and user_id = ${userId}::uuid
    ) b on true
    left join lateral (
      select count(*) as total, count(*) filter (where status = 'COMPLETED') as completed
      from public.trip_tasks where plan_id = p.id and user_id = ${userId}::uuid
    ) t on true
    left join lateral (
      select count(*) as total, count(*) filter (where packed and not hidden) as completed
      from public.trip_packing_items where user_id = ${userId}::uuid
        and list_id in (select id from public.trip_packing_lists where plan_id = p.id and user_id = ${userId}::uuid)
        and not hidden
    ) k on true
    left join public.trip_budgets budget on budget.plan_id = p.id and budget.user_id = ${userId}::uuid
    left join lateral (
      select sum(amount) as spent from public.trip_expenses
      where plan_id = p.id and user_id = ${userId}::uuid
        and (budget.currency is null or currency = budget.currency)
    ) expense on true
    left join lateral (
      select score, next_action from public.trip_readiness_snapshots
      where plan_id = p.id and user_id = ${userId}::uuid
      order by created_at desc limit 1
    ) readiness on true
    where p.user_id = ${userId}::uuid and p.status <> 'ARCHIVED'
    order by p.start_date asc, p.updated_at desc
  `);
}

export async function findOwnedCustomerPlanItem(args: {
  userId: string;
  planId: string;
  itemId: string;
  db?: DbClient;
}) {
  const db = args.db ?? prisma;
  const rows = await db.$queryRaw<CustomerPlanItem[]>(Prisma.sql`
    select
      p.id::text as "planId",
      i.id::text as "itemId",
      i.provider,
      i.deeplink,
      i.title
    from public.customer_plans p
    join public.customer_plan_days d on d.plan_id = p.id
    join public.customer_plan_items i on i.plan_day_id = d.id
    where p.id = ${args.planId}::uuid
      and p.user_id = ${args.userId}::uuid
      and i.id = ${args.itemId}::uuid
    limit 1
  `);
  return rows[0] ?? null;
}

export async function recordCustomerAffiliateClick(args: {
  userId: string;
  planId: string;
  itemId: string;
  provider: string;
  sourcePage: string | null;
  amount?: number | null;
  currency?: string | null;
  priceType?: "LIVE" | "RECENTLY_CHECKED" | "ESTIMATED" | "UNAVAILABLE";
  checkedAt?: Date | null;
}) {
  return prisma.$transaction(async (tx) => {
    const item = await findOwnedCustomerPlanItem({ ...args, db: tx });
    if (!item) return null;

    let priceSnapshotId: string | null = null;
    if (args.priceType) {
      const snapshots = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        insert into public.trip_price_snapshots (
          user_id, plan_id, item_id, amount, currency, price_type,
          checked_at, provider, provider_reference
        ) values (
          ${args.userId}::uuid, ${args.planId}::uuid, ${args.itemId}::uuid,
          ${args.amount ?? null}, ${args.currency?.toUpperCase() ?? null},
          ${args.priceType}, ${args.checkedAt ?? null}, ${args.provider}, null
        ) returning id::text as id
      `);
      priceSnapshotId = snapshots[0]?.id ?? null;
    }

    const opaqueClickId = crypto.randomUUID().replaceAll("-", "");
    const clicks = await tx.$queryRaw<Array<{ id: string; opaqueClickId: string }>>(Prisma.sql`
      insert into public.trip_affiliate_clicks (
        opaque_click_id, user_id, plan_id, item_id, provider, source_page,
        price_snapshot_id, status
      ) values (
        ${opaqueClickId}, ${args.userId}::uuid, ${args.planId}::uuid,
        ${args.itemId}::uuid, ${args.provider}, ${args.sourcePage},
        ${priceSnapshotId}::uuid, 'RECORDED'
      ) returning id::text as id, opaque_click_id as "opaqueClickId"
    `);

    await tx.$executeRaw(Prisma.sql`
      insert into public.trip_booking_records (
        user_id, plan_id, item_id, click_id, status
      ) values (
        ${args.userId}::uuid, ${args.planId}::uuid, ${args.itemId}::uuid,
        ${clicks[0]?.id ?? null}::uuid, 'CLICKED'
      )
      on conflict (user_id, plan_id, item_id) do update set
        click_id = excluded.click_id,
        status = case
          when public.trip_booking_records.status in ('NOT_SELECTED','SELECTED','CLICKED','BOOKING_PENDING') then 'CLICKED'
          else public.trip_booking_records.status
        end,
        version = public.trip_booking_records.version + 1,
        updated_at = now()
    `);

    return { item, clickId: clicks[0]?.opaqueClickId ?? opaqueClickId };
  });
}

export async function updateCustomerBooking(args: {
  userId: string;
  planId: string;
  itemId: string;
  status: "BOOKING_PENDING" | "CUSTOMER_CONFIRMED" | "CANCELLED";
  finalPrice?: number | null;
  currency?: string | null;
  bookedAt?: Date | null;
  bookingReferenceCiphertext?: string | null;
  cancellationDeadline?: Date | null;
  notes?: string | null;
  providerEvidence?: Record<string, string> | null;
}) {
  const providerEvidence = args.providerEvidence ? JSON.stringify(args.providerEvidence) : null;
  const rows = await prisma.$queryRaw<Array<{ id: string; status: string; version: number }>>(Prisma.sql`
    update public.trip_booking_records b set
      status = ${args.status},
      final_price = ${args.finalPrice ?? null},
      currency = ${args.currency?.toUpperCase() ?? null},
      booked_at = ${args.bookedAt ?? null},
      booking_reference_ciphertext = ${args.bookingReferenceCiphertext ?? null},
      cancellation_deadline = ${args.cancellationDeadline ?? null},
      notes = ${args.notes ?? null},
      provider_evidence = coalesce(${providerEvidence}::jsonb, b.provider_evidence),
      version = b.version + 1,
      updated_at = now()
    from public.customer_plans p
    where b.plan_id = p.id
      and b.plan_id = ${args.planId}::uuid
      and b.item_id = ${args.itemId}::uuid
      and b.user_id = ${args.userId}::uuid
      and p.user_id = ${args.userId}::uuid
      and (
        (${args.status} = 'BOOKING_PENDING' and b.status = 'CLICKED') or
        (${args.status} = 'CUSTOMER_CONFIRMED' and b.status in ('CLICKED','BOOKING_PENDING')) or
        (${args.status} = 'CANCELLED' and b.status in ('CLICKED','BOOKING_PENDING','CUSTOMER_CONFIRMED','PROVIDER_CONFIRMED'))
      )
    returning b.id::text as id, b.status, b.version
  `);
  return rows[0] ?? null;
}
