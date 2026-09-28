import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/requireUser";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const createTripSchema = z.object({
  creationKey: z.string().uuid(),
  title: z.string().trim().min(2).max(120),
  destination: z.string().trim().min(2).max(160),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  travelers: z.number().int().min(1).max(50).default(1),
  budget: z.number().nonnegative().finite().optional(),
  currency: z.string().trim().regex(/^[A-Za-z]{3}$/).default("USD"),
  notes: z.string().trim().max(3000).optional(),
});

export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return NextResponse.json({ ok: false, code: auth.code }, { status: 401 });

  const parsed = createTripSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, code: "INVALID_INPUT" }, { status: 400 });

  const input = parsed.data;
  const startDate = new Date(input.startDate);
  const endDate = new Date(input.endDate);
  if (endDate < startDate) return NextResponse.json({ ok: false, code: "INVALID_DATES" }, { status: 400 });

  const creationKey = `manual:${auth.user.id}:${input.creationKey}`;
  const trip = await prisma.$transaction(async (tx) => {
    const existing = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      select id::text from public.customer_plans
      where user_id=${auth.user.id}::uuid and creation_key=${creationKey}
      limit 1
    `);
    if (existing[0]) return existing[0];

    const created = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      insert into public.customer_plans (
        user_id, creation_key, status, planning_stage, title, destination,
        start_date, end_date, inputs_json, summary_json
      ) values (
        ${auth.user.id}::uuid, ${creationKey}, 'DRAFT', 'DRAFT_INPUT',
        ${input.title}, ${input.destination}, ${startDate}, ${endDate},
        ${JSON.stringify({ sourceType: "MANUAL", travelersCount: input.travelers, notes: input.notes || null, datesSelected: true })}::jsonb,
        ${JSON.stringify({ sourceType: "MANUAL" })}::jsonb
      ) returning id::text as id
    `);
    const createdTrip = created[0];

    if (input.budget !== undefined) {
      await tx.$executeRaw(Prisma.sql`
        insert into public.trip_budgets (user_id, plan_id, planned_total, currency)
        values (${auth.user.id}::uuid, ${createdTrip.id}::uuid, ${input.budget}, ${input.currency.toUpperCase()})
        on conflict (user_id, plan_id) do nothing
      `);
    }
    return createdTrip;
  }, { maxWait: 10_000, timeout: 20_000 });

  return NextResponse.json({ ok: true, tripId: trip.id });
}
