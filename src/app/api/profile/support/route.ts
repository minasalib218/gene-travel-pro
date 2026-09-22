import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { recordUserActivity } from "@/lib/customer-activity";
import { tableExists } from "@/lib/prisma-safe";
import { ensureUserProfile } from "@/lib/profile/ensureUserProfile";
import { createRouteClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const supportCreateSchema = z.object({
  subject: z.string().min(1).max(180),
  message: z.string().min(5).max(3000),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
});

const supportUpdateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["OPEN", "CLOSED"]).optional(),
});

async function getUser() {
  const supabase = createRouteClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;
  await ensureUserProfile(data.user);
  return data.user;
}

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ ok: false, code: "NOT_AUTHED" }, { status: 401 });
  if (!(await tableExists("support_tickets"))) {
    return NextResponse.json({ ok: true, tickets: [] });
  }

  const tickets = await prisma.supportTicket.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      subject: true,
      status: true,
      priority: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ ok: true, tickets });
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ ok: false, code: "NOT_AUTHED" }, { status: 401 });
  if (!(await tableExists("support_tickets"))) {
    return NextResponse.json({ ok: false, code: "SUPPORT_NOT_READY" }, { status: 503 });
  }

  const parsed = supportCreateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, code: "INVALID_INPUT" }, { status: 400 });

  const ticket = await prisma.supportTicket.create({
    data: {
      userId: user.id,
      email: user.email ?? "",
      subject: parsed.data.subject,
      message: parsed.data.message,
      priority: parsed.data.priority ?? "MEDIUM",
    },
    select: {
      id: true,
      subject: true,
      status: true,
      priority: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  await recordUserActivity({
    userId: user.id,
    event: "SUPPORT_TICKET_CREATED",
    entityType: "SUPPORT_TICKET",
    entityId: ticket.id,
    metadata: { priority: ticket.priority },
  });

  return NextResponse.json({ ok: true, ticket });
}

export async function PATCH(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ ok: false, code: "NOT_AUTHED" }, { status: 401 });
  if (!(await tableExists("support_tickets"))) {
    return NextResponse.json({ ok: false, code: "SUPPORT_TICKET_NOT_FOUND" }, { status: 404 });
  }

  const parsed = supportUpdateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, code: "INVALID_INPUT" }, { status: 400 });

  const result = await prisma.supportTicket.updateMany({
    where: { id: parsed.data.id, userId: user.id },
    data: { status: parsed.data.status },
  });

  if (!result.count) return NextResponse.json({ ok: false, code: "SUPPORT_TICKET_NOT_FOUND" }, { status: 404 });

  await recordUserActivity({
    userId: user.id,
    event: "SUPPORT_TICKET_UPDATED",
    entityType: "SUPPORT_TICKET",
    entityId: parsed.data.id,
  });

  return NextResponse.json({ ok: true });
}
