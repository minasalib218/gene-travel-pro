import { Prisma, type PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { calculateReadiness, getPriceDisplay, type ReadinessCategory } from "./rules";

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
        (${args.status} = 'CUSTOMER_CONFIRMED' and b.status in ('NOT_SELECTED','SELECTED','CLICKED','BOOKING_PENDING')) or
        (${args.status} = 'CANCELLED' and b.status in ('CLICKED','BOOKING_PENDING','CUSTOMER_CONFIRMED','PROVIDER_CONFIRMED'))
      )
    returning b.id::text as id, b.status, b.version
  `);
  return rows[0] ?? null;
}

export type ControlCentreWorkspace = {
  trip: { id: string; title: string; destination: string; startDate: Date; endDate: Date; version: number };
  items: Array<{ id: string; title: string; kind: string; provider: string | null; hasBookingLink: boolean; bookingStatus: string; price: number | null; currency: string | null; priceLabel: string }>;
  tasks: Array<{ id: string; title: string; category: string; dueAt: Date | null; status: string; critical: boolean }>;
  packing: Array<{ id: string; label: string; category: string; packed: boolean; essential: boolean }>;
  budget: { planned: number; spent: number; remaining: number; currency: string };
  readiness: { score: number; missing: ReadinessCategory[]; nextAction: string };
};

const DEFAULT_TASKS = [
  ["Confirm passport validity", "documents", true], ["Check visa requirements", "documents", true],
  ["Confirm travel insurance", "insurance", false], ["Arrange airport transfer", "airportTransfers", false],
  ["Prepare mobile data or eSIM", "connectivity", false],
] as const;
const DEFAULT_PACKING = [
  ["Passport and travel documents", "Documents", true], ["Payment cards and emergency cash", "Documents", true],
  ["Phone charger and power bank", "Electronics", true], ["Weather-ready outer layer", "Clothing", false],
  ["Comfortable walking shoes", "Clothing", true], ["Personal medication", "Health", true],
  ["Reusable water bottle", "Essentials", false], ["Travel adapter", "Electronics", false],
] as const;

export async function ensureControlCentreWorkspace(userId: string, planId: string) {
  return prisma.$transaction(async (tx) => {
    const plans = await tx.$queryRaw<Array<{ id: string; title: string; destination: string; startDate: Date; endDate: Date; version: number }>>(Prisma.sql`
      select id::text, title, destination, start_date as "startDate", end_date as "endDate", version
      from public.customer_plans where id=${planId}::uuid and user_id=${userId}::uuid and status <> 'ARCHIVED' limit 1
    `);
    const trip = plans[0];
    if (!trip) return null;

    for (const [title, category, critical] of DEFAULT_TASKS) {
      await tx.$executeRaw(Prisma.sql`
        insert into public.trip_tasks (user_id, plan_id, title, category, due_at, critical)
        select ${userId}::uuid, ${planId}::uuid, ${title}, ${category}, ${trip.startDate}, ${critical}
        where not exists (select 1 from public.trip_tasks where user_id=${userId}::uuid and plan_id=${planId}::uuid and title=${title})
      `);
    }
    const lists = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      insert into public.trip_packing_lists (user_id, plan_id) values (${userId}::uuid, ${planId}::uuid)
      on conflict (user_id, plan_id) do update set updated_at=now() returning id::text
    `);
    const listId = lists[0].id;
    for (const [label, category, essential] of DEFAULT_PACKING) {
      await tx.$executeRaw(Prisma.sql`
        insert into public.trip_packing_items (list_id,user_id,category,label,system_generated,essential)
        select ${listId}::uuid,${userId}::uuid,${category},${label},true,${essential}
        where not exists (select 1 from public.trip_packing_items where list_id=${listId}::uuid and label=${label})
      `);
    }
    await tx.$executeRaw(Prisma.sql`
      insert into public.trip_budgets (user_id,plan_id,planned_total,currency)
      values (${userId}::uuid,${planId}::uuid,0,'USD') on conflict (user_id,plan_id) do nothing
    `);
    return trip;
  });
}

export async function getControlCentreWorkspace(userId: string, planId: string): Promise<ControlCentreWorkspace | null> {
  const trip = await ensureControlCentreWorkspace(userId, planId);
  if (!trip) return null;
  const [items, tasks, packing, budgets, expenses] = await Promise.all([
    prisma.$queryRaw<ControlCentreWorkspace["items"]>(Prisma.sql`
      select i.id::text, coalesce(i.title,'Travel item') as title, i.kind, i.provider,
        (i.deeplink is not null and length(trim(i.deeplink))>0) as "hasBookingLink",
        coalesce(b.status,'NOT_SELECTED') as "bookingStatus", s.amount::float8 as price, s.currency,
        s.price_type as "priceType", s.checked_at as "checkedAt"
      from public.customer_plan_items i join public.customer_plan_days d on d.id=i.plan_day_id
      left join public.trip_booking_records b on b.item_id=i.id and b.user_id=${userId}::uuid
      left join lateral (select amount,currency,price_type,checked_at from public.trip_price_snapshots where item_id=i.id and user_id=${userId}::uuid order by created_at desc limit 1) s on true
      where d.plan_id=${planId}::uuid order by d.day_index, i.start_time nulls last, i.created_at
    `),
    prisma.$queryRaw<ControlCentreWorkspace["tasks"]>(Prisma.sql`select id::text,title,category,due_at as "dueAt",status,critical from public.trip_tasks where user_id=${userId}::uuid and plan_id=${planId}::uuid order by critical desc,due_at nulls last,created_at`),
    prisma.$queryRaw<ControlCentreWorkspace["packing"]>(Prisma.sql`select i.id::text,i.label,i.category,i.packed,i.essential from public.trip_packing_items i join public.trip_packing_lists l on l.id=i.list_id where i.user_id=${userId}::uuid and l.plan_id=${planId}::uuid and not i.hidden order by i.essential desc,i.category,i.created_at`),
    prisma.$queryRaw<Array<{ planned: number; currency: string }>>(Prisma.sql`select planned_total::float8 as planned,currency from public.trip_budgets where user_id=${userId}::uuid and plan_id=${planId}::uuid limit 1`),
    prisma.$queryRaw<Array<{ spent: number }>>(Prisma.sql`select coalesce(sum(amount),0)::float8 as spent from public.trip_expenses where user_id=${userId}::uuid and plan_id=${planId}::uuid`),
  ]);
  const normalizedItems = items.map((item: any) => ({ ...item, priceLabel: item.priceType ? getPriceDisplay({ type: item.priceType, checkedAt: item.checkedAt }).label : "Price unavailable" }));
  const confirmedKinds = new Set(normalizedItems.filter((item) => ["CUSTOMER_CONFIRMED","PROVIDER_CONFIRMED"].includes(item.bookingStatus)).map((item) => item.kind.toLowerCase()));
  const taskPercent = (category: string) => { const rows=tasks.filter((task)=>task.category===category); return rows.length ? Math.round(rows.filter((task)=>task.status==="COMPLETED").length/rows.length*100) : 0; };
  const packed = packing.length ? Math.round(packing.filter((item)=>item.packed).length/packing.length*100) : 0;
  const planned=budgets[0]?.planned || 0, spent=expenses[0]?.spent || 0;
  const readiness = calculateReadiness({ transport: confirmedKinds.has("flight")||confirmedKinds.has("transport")?100:0, accommodation: confirmedKinds.has("hotel")||confirmedKinds.has("stay")?100:0, activities: normalizedItems.some((item)=>item.bookingStatus.includes("CONFIRMED"))?100:0, documents: taskPercent("documents"), packing: packed, insurance: taskPercent("insurance"), connectivity: taskPercent("connectivity"), budget: planned>0&&spent<=planned?100:planned>0?50:0, airportTransfers: taskPercent("airportTransfers") });
  const nextAction = readiness.missing.length ? `Complete ${readiness.missing[0].replace(/([A-Z])/g," $1").toLowerCase()}` : "Your trip is ready";
  await prisma.$executeRaw(Prisma.sql`insert into public.trip_readiness_snapshots (user_id,plan_id,input_version,score,categories,missing_actions,next_action) values (${userId}::uuid,${planId}::uuid,${trip.version},${readiness.score},${JSON.stringify(readiness.categories)}::jsonb,${JSON.stringify(readiness.missing)}::jsonb,${nextAction}) on conflict (plan_id,input_version) do update set score=excluded.score,categories=excluded.categories,missing_actions=excluded.missing_actions,next_action=excluded.next_action,created_at=now()`);
  return { trip, items: normalizedItems, tasks, packing, budget: { planned, spent, remaining: planned-spent, currency: budgets[0]?.currency||"USD" }, readiness: { score: readiness.score, missing: readiness.missing, nextAction } };
}
