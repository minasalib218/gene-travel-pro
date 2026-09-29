import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { recordAnalyticsEvent } from "@/lib/analytics-server";
import { tableExists } from "@/lib/prisma-safe";
import {
  mapTravelpayoutsBookingStatus,
  normalizeTravelpayoutsSubId,
} from "./travelpayouts-booking-rules";

const STATISTICS_ENDPOINT = "https://api.travelpayouts.com/statistics/v1/execute_query";

type ProviderRow = Record<string, unknown>;

function textValue(row: ProviderRow, ...keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function numberValue(row: ProviderRow, ...keys: string[]) {
  for (const key of keys) {
    const value = Number(row[key]);
    if (Number.isFinite(value)) return value;
  }
  return null;
}

function dateValue(row: ProviderRow, ...keys: string[]) {
  const value = textValue(row, ...keys);
  if (!value) return null;
  const parsed = new Date(value.includes("T") ? value : value.replace(" ", "T") + "Z");
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function providerRows(payload: unknown): ProviderRow[] {
  if (!payload || typeof payload !== "object") return [];
  const root = payload as Record<string, unknown>;
  for (const value of [root.data, root.rows, root.result, root.results]) {
    if (Array.isArray(value)) return value.filter((row): row is ProviderRow => Boolean(row) && typeof row === "object");
    if (value && typeof value === "object") {
      const nested = value as Record<string, unknown>;
      for (const candidate of [nested.data, nested.rows, nested.results]) {
        if (Array.isArray(candidate)) return candidate.filter((row): row is ProviderRow => Boolean(row) && typeof row === "object");
      }
    }
  }
  return [];
}

async function addConfirmedReminder(args: {
  userId: string;
  planId: string;
  providerBookingId: string;
  travelDate: Date | null;
  title: string;
}) {
  if (!args.travelDate) return;
  if (!(await tableExists("travel_reminders").catch(() => false))) return;
  await prisma.$executeRaw(Prisma.sql`
    insert into public.travel_reminders (
      id, "userId", title, "tripName", "reminderType", "reminderDate",
      status, metadata, "createdAt", "updatedAt"
    )
    select
      ${crypto.randomUUID()}, ${args.userId}, ${args.title}, p.title,
      'provider_booking', ${args.travelDate}, 'UPCOMING',
      ${JSON.stringify({ planId: args.planId, providerBookingId: args.providerBookingId, source: "TRAVELPAYOUTS" })}::jsonb,
      now(), now()
    from public.customer_plans p
    where p.id = ${args.planId}::uuid and p.user_id = ${args.userId}::uuid
      and not exists (
        select 1 from public.travel_reminders r
        where r."userId" = ${args.userId}
          and r.metadata->>'providerBookingId' = ${args.providerBookingId}
      )
  `).catch(() => undefined);
}

export async function syncTravelpayoutsBookings(args?: { days?: number }) {
  const token = process.env.TRAVELPAYOUTS_API_TOKEN || process.env.TRAVELPAYOUTS_TOKEN;
  if (!token) return { ok: false as const, code: "TRAVELPAYOUTS_API_TOKEN_MISSING", fetched: 0, matched: 0, updated: 0 };

  const days = Math.min(Math.max(args?.days ?? Number(process.env.TRAVELPAYOUTS_SYNC_DAYS || 45), 1), 180);
  const since = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
  const response = await fetch(STATISTICS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Access-Token": token },
    body: JSON.stringify({
      fields: [
        "action_id", "external_click_id", "sub_id", "campaign_id", "price_usd",
        "paid_profit_usd", "state", "date", "updated_at", "created_at",
      ],
      filters: [
        { field: "type", op: "eq", value: "action" },
        { field: "date", op: "ge", value: since },
      ],
      sort: [{ field: "updated_at", order: "asc" }],
      offset: 0,
      limit: 10_000,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    return { ok: false as const, code: `TRAVELPAYOUTS_HTTP_${response.status}`, fetched: 0, matched: 0, updated: 0 };
  }

  const rows = providerRows(await response.json());
  let matched = 0;
  let updated = 0;

  for (const row of rows) {
    const subId = normalizeTravelpayoutsSubId(textValue(row, "sub_id"));
    const providerBookingId = textValue(row, "action_id");
    if (!subId || !providerBookingId) continue;

    const status = mapTravelpayoutsBookingStatus(textValue(row, "state", "action_state"));
    const price = numberValue(row, "price_usd");
    const commission = numberValue(row, "paid_profit_usd");
    const bookingDate = dateValue(row, "date", "created_at");
    const travelStart = dateValue(row, "check_in_date", "departure_at", "travel_date");
    const travelEnd = dateValue(row, "check_out_date", "return_at");
    const campaignId = textValue(row, "campaign_id");

    const result = await prisma.$transaction(async (tx) => {
      const clicks = await tx.$queryRaw<Array<{ id: string; userId: string; planId: string; itemId: string | null }>>(Prisma.sql`
        select id::text, user_id::text as "userId", plan_id::text as "planId", item_id::text as "itemId"
        from public.trip_affiliate_clicks
        where opaque_click_id = ${subId} and user_id is not null and plan_id is not null
        limit 1
      `);
      const click = clicks[0];
      if (!click) return null;

      await tx.$executeRaw(Prisma.sql`
        update public.trip_affiliate_clicks
        set status = ${status === "PROVIDER_CONFIRMED" ? "CONVERTED" : status === "CANCELLED" ? "CANCELLED" : "CHECKED"},
            last_checked_at = now(), updated_at = now()
        where id = ${click.id}::uuid
      `);

      const bookingRows = await tx.$queryRaw<Array<{ id: string; changed: boolean }>>(Prisma.sql`
        update public.trip_booking_records
        set provider = 'travelpayouts',
            affiliate_program = ${campaignId},
            provider_booking_id = ${providerBookingId},
            provider_status = ${textValue(row, "state", "action_state")},
            status = ${status},
            final_price = coalesce(${price}, final_price),
            currency = case when ${price}::numeric is not null then 'USD' else currency end,
            commission = ${commission},
            booked_at = coalesce(${bookingDate}, booked_at),
            travel_start_at = coalesce(${travelStart}, travel_start_at),
            travel_end_at = coalesce(${travelEnd}, travel_end_at),
            confirmed_at = case when ${status} = 'PROVIDER_CONFIRMED' then coalesce(confirmed_at, now()) else confirmed_at end,
            cancelled_at = case when ${status} = 'CANCELLED' then coalesce(cancelled_at, now()) else cancelled_at end,
            last_synced_at = now(),
            raw_provider_reference = ${JSON.stringify({
              source: "TRAVELPAYOUTS_STATISTICS",
              externalClickId: textValue(row, "external_click_id"),
              updatedAt: textValue(row, "updated_at"),
            })}::jsonb,
            version = version + 1,
            updated_at = now()
        where user_id = ${click.userId}::uuid
          and plan_id = ${click.planId}::uuid
          and item_id is not distinct from ${click.itemId}::uuid
        returning id::text, true as changed
      `);
      return { ...click, changed: Boolean(bookingRows[0]?.changed) };
    });

    if (!result) continue;
    matched += 1;
    if (result.changed) updated += 1;

    if (status === "PROVIDER_CONFIRMED") {
      await addConfirmedReminder({
        userId: result.userId,
        planId: result.planId,
        providerBookingId,
        travelDate: travelStart,
        title: "Confirmed travel booking",
      });
    }

    await recordAnalyticsEvent({
      userId: result.userId,
      sessionId: `provider_sync_${providerBookingId}`,
      eventName:
        status === "PROVIDER_CONFIRMED" ? "affiliate_booking_confirmed" :
        status === "CANCELLED" ? "affiliate_booking_cancelled" :
        status === "BOOKING_PENDING" ? "affiliate_booking_pending" :
        "affiliate_booking_detected",
      eventCategory: "commerce",
      pagePath: "/api/admin/affiliate-bookings",
      planId: result.planId,
      itemId: result.itemId,
      provider: "travelpayouts",
      metadata: { providerBookingId, affiliateProgram: campaignId },
    });
  }

  return { ok: true as const, code: "SYNC_COMPLETED", fetched: rows.length, matched, updated };
}
