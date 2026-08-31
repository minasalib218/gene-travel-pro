import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { tableExists } from "@/lib/prisma-safe";
import { createRouteClient } from "@/lib/supabase/server";
import { recordUserActivity } from "@/lib/customer-activity";

export const dynamic = "force-dynamic";

const reminderSchema = z.object({
  title: z.string().min(1).max(160),
  tripName: z.string().max(120).optional().nullable(),
  reminderType: z.enum(["hotel", "flight", "activity", "transportation", "trip", "passport", "visa", "custom"]),
  reminderDate: z.string().datetime(),
  reminderTime: z.string().max(20).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

const updateSchema = reminderSchema.partial().extend({
  id: z.string().min(1),
  status: z.enum(["UPCOMING", "DONE", "CANCELED"]).optional(),
});

const deleteSchema = z.object({ id: z.string().min(1) });

async function getUserId() {
  const supabase = createRouteClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;
  return data.user.id;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ ok: false, code: "NOT_AUTHED" }, { status: 401 });
  if (!(await tableExists("travel_reminders"))) {
    return NextResponse.json({ ok: true, reminders: [] });
  }

  const reminders = await prisma.travelReminder.findMany({
    where: { userId, status: { not: "CANCELED" } },
    orderBy: { reminderDate: "asc" },
    take: 100,
  });

  return NextResponse.json({ ok: true, reminders });
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ ok: false, code: "NOT_AUTHED" }, { status: 401 });
  if (!(await tableExists("travel_reminders"))) {
    return NextResponse.json({ ok: false, code: "REMINDERS_NOT_READY" }, { status: 503 });
  }

  const parsed = reminderSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, code: "INVALID_INPUT" }, { status: 400 });

  const reminder = await prisma.travelReminder.create({
    data: {
      userId,
      title: parsed.data.title,
      tripName: parsed.data.tripName || null,
      reminderType: parsed.data.reminderType,
      reminderDate: new Date(parsed.data.reminderDate),
      reminderTime: parsed.data.reminderTime || null,
      notes: parsed.data.notes || null,
      metadata: parsed.data.metadata ? (parsed.data.metadata as Prisma.InputJsonValue) : undefined,
    },
  });

  await recordUserActivity({
    userId,
    event: "REMINDER_CREATED",
    entityType: "TRAVEL_REMINDER",
    entityId: reminder.id,
    metadata: { title: reminder.title, reminderType: reminder.reminderType },
  });

  return NextResponse.json({ ok: true, reminder });
}

export async function PATCH(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ ok: false, code: "NOT_AUTHED" }, { status: 401 });
  if (!(await tableExists("travel_reminders"))) return NextResponse.json({ ok: false, code: "NOT_FOUND" }, { status: 404 });

  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, code: "INVALID_INPUT" }, { status: 400 });

  const { id, metadata, reminderDate, ...rest } = parsed.data;
  const reminder = await prisma.travelReminder.updateMany({
    where: { id, userId },
    data: {
      ...rest,
      reminderDate: reminderDate ? new Date(reminderDate) : undefined,
      metadata: metadata ? (metadata as Prisma.InputJsonValue) : undefined,
    },
  });

  await recordUserActivity({
    userId,
    event: parsed.data.status === "DONE" ? "REMINDER_COMPLETED" : "REMINDER_UPDATED",
    entityType: "TRAVEL_REMINDER",
    entityId: id,
  });

  return NextResponse.json({ ok: true, reminder });
}

export async function DELETE(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ ok: false, code: "NOT_AUTHED" }, { status: 401 });

  const parsed = deleteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, code: "INVALID_INPUT" }, { status: 400 });
  if (!(await tableExists("travel_reminders"))) return NextResponse.json({ ok: true });

  await prisma.travelReminder.updateMany({
    where: { id: parsed.data.id, userId },
    data: { status: "CANCELED" },
  });

  await recordUserActivity({
    userId,
    event: "REMINDER_CANCELED",
    entityType: "TRAVEL_REMINDER",
    entityId: parsed.data.id,
  });

  return NextResponse.json({ ok: true });
}
