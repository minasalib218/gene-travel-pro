import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { requireUser } from "@/lib/auth/requireUser";
import { prisma } from "@/lib/prisma";
import { getControlCentreWorkspace, updateCustomerBooking } from "@/lib/control-centre/repository";

export const dynamic = "force-dynamic";

const planId = z.string().uuid();
const mutation = z.discriminatedUnion("action", [
  z.object({ action: z.literal("toggle-task"), planId, id: z.string().uuid(), completed: z.boolean() }),
  z.object({ action: z.literal("toggle-packing"), planId, id: z.string().uuid(), packed: z.boolean() }),
  z.object({ action: z.literal("set-budget"), planId, amount: z.number().nonnegative().finite(), currency: z.string().regex(/^[A-Za-z]{3}$/) }),
  z.object({ action: z.literal("add-expense"), planId, label: z.string().trim().min(1).max(120), category: z.string().trim().min(1).max(60), amount: z.number().positive().finite(), currency: z.string().regex(/^[A-Za-z]{3}$/) }),
  z.object({ action: z.literal("confirm-booking"), planId, itemId: z.string().uuid(), finalPrice: z.number().nonnegative().finite().optional(), currency: z.string().regex(/^[A-Za-z]{3}$/).optional() }),
]);

async function authUser() {
  const auth = await requireUser();
  return auth.ok ? auth.user : null;
}

export async function GET(request: NextRequest) {
  const user = await authUser();
  if (!user) return NextResponse.json({ ok: false, code: "NOT_AUTHED" }, { status: 401 });
  const parsed = planId.safeParse(request.nextUrl.searchParams.get("planId"));
  if (!parsed.success) return NextResponse.json({ ok: false, code: "INVALID_INPUT" }, { status: 400 });
  const workspace = await getControlCentreWorkspace(user.id, parsed.data);
  if (!workspace) return NextResponse.json({ ok: false, code: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ ok: true, workspace });
}

export async function POST(request: NextRequest) {
  const user = await authUser();
  if (!user) return NextResponse.json({ ok: false, code: "NOT_AUTHED" }, { status: 401 });
  const parsed = mutation.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, code: "INVALID_INPUT" }, { status: 400 });
  const input = parsed.data;
  const owns = await prisma.$queryRaw<Array<{ ok: boolean }>>(Prisma.sql`select true as ok from public.customer_plans where id=${input.planId}::uuid and user_id=${user.id}::uuid and status <> 'ARCHIVED' limit 1`);
  if (!owns[0]) return NextResponse.json({ ok: false, code: "NOT_FOUND" }, { status: 404 });

  if (input.action === "toggle-task") {
    await prisma.$executeRaw(Prisma.sql`update public.trip_tasks set status=${input.completed ? "COMPLETED" : "OPEN"},completed_at=${input.completed ? new Date() : null},updated_at=now() where id=${input.id}::uuid and plan_id=${input.planId}::uuid and user_id=${user.id}::uuid`);
  } else if (input.action === "toggle-packing") {
    await prisma.$executeRaw(Prisma.sql`update public.trip_packing_items i set packed=${input.packed},updated_at=now() from public.trip_packing_lists l where i.id=${input.id}::uuid and i.list_id=l.id and l.plan_id=${input.planId}::uuid and i.user_id=${user.id}::uuid`);
  } else if (input.action === "set-budget") {
    await prisma.$executeRaw(Prisma.sql`insert into public.trip_budgets (user_id,plan_id,planned_total,currency) values (${user.id}::uuid,${input.planId}::uuid,${input.amount},${input.currency.toUpperCase()}) on conflict (user_id,plan_id) do update set planned_total=excluded.planned_total,currency=excluded.currency,updated_at=now()`);
  } else if (input.action === "add-expense") {
    await prisma.$executeRaw(Prisma.sql`insert into public.trip_expenses (user_id,plan_id,category,label,amount,currency,expense_type,occurred_at) values (${user.id}::uuid,${input.planId}::uuid,${input.category},${input.label},${input.amount},${input.currency.toUpperCase()},'ACTUAL',now())`);
  } else if (input.action === "confirm-booking") {
    const existing = await prisma.$queryRaw<Array<{ status: string }>>(Prisma.sql`select status from public.trip_booking_records where user_id=${user.id}::uuid and plan_id=${input.planId}::uuid and item_id=${input.itemId}::uuid limit 1`);
    if (!existing[0]) {
      await prisma.$executeRaw(Prisma.sql`insert into public.trip_booking_records (user_id,plan_id,item_id,status,final_price,currency,booked_at,provider_evidence) select ${user.id}::uuid,${input.planId}::uuid,${input.itemId}::uuid,'CUSTOMER_CONFIRMED',${input.finalPrice ?? null},${input.currency?.toUpperCase() ?? null},now(),${JSON.stringify({ confirmationSource: "CUSTOMER" })}::jsonb from public.customer_plan_items i join public.customer_plan_days d on d.id=i.plan_day_id where i.id=${input.itemId}::uuid and d.plan_id=${input.planId}::uuid`);
    } else {
      await updateCustomerBooking({ userId: user.id, planId: input.planId, itemId: input.itemId, status: "CUSTOMER_CONFIRMED", finalPrice: input.finalPrice, currency: input.currency, bookedAt: new Date(), providerEvidence: { confirmationSource: "CUSTOMER" } });
    }
  }
  const workspace = await getControlCentreWorkspace(user.id, input.planId);
  return NextResponse.json({ ok: true, workspace });
}
