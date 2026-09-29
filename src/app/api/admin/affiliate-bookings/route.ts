import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { syncTravelpayoutsBookings } from "@/lib/affiliates/travelpayouts-sync";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ ok: false, code: admin.code }, { status: 403 });

  const rows = await prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
    select b.id::text, b.status, b.provider, b.affiliate_program as "affiliateProgram",
      b.provider_booking_id as "providerBookingId", b.final_price::float8 as "bookingValue",
      b.currency, b.commission::float8, b.booked_at as "bookingDate",
      b.last_synced_at as "lastSyncedAt", c.opaque_click_id as "subId",
      i.title as "itemTitle", p.title as "planTitle"
    from public.trip_booking_records b
    left join public.trip_affiliate_clicks c on c.id=b.click_id
    left join public.customer_plan_items i on i.id=b.item_id
    join public.customer_plans p on p.id=b.plan_id
    order by b.updated_at desc
    limit 500
  `);
  return NextResponse.json({ ok: true, bookings: rows });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ ok: false, code: admin.code }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const days = Number(body?.days || 45);
  const result = await syncTravelpayoutsBookings({ days });
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
