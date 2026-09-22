import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { recordUserActivity } from "@/lib/customer-activity";
import { tableExists } from "@/lib/prisma-safe";
import { ensureUserProfile } from "@/lib/profile/ensureUserProfile";
import { createRouteClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  id: z.string().min(1).optional(),
  all: z.boolean().optional(),
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
  if (!(await tableExists("in_app_notifications"))) {
    return NextResponse.json({ ok: true, notifications: [], unreadCount: 0 });
  }

  const notifications = await prisma.inAppNotification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      type: true,
      title: true,
      message: true,
      status: true,
      metadata: true,
      createdAt: true,
      readAt: true,
    },
  });

  return NextResponse.json({
    ok: true,
    notifications,
    unreadCount: notifications.filter((notification) => !notification.readAt && notification.status !== "READ").length,
  });
}

export async function PATCH(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ ok: false, code: "NOT_AUTHED" }, { status: 401 });
  if (!(await tableExists("in_app_notifications"))) {
    return NextResponse.json({ ok: false, code: "NOTIFICATIONS_NOT_READY" }, { status: 503 });
  }

  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success || (!parsed.data.id && !parsed.data.all)) {
    return NextResponse.json({ ok: false, code: "INVALID_INPUT" }, { status: 400 });
  }

  const result = await prisma.inAppNotification.updateMany({
    where: parsed.data.all ? { userId: user.id, readAt: null } : { id: parsed.data.id, userId: user.id },
    data: {
      status: "READ",
      readAt: new Date(),
    },
  });

  await recordUserActivity({
    userId: user.id,
    event: parsed.data.all ? "NOTIFICATIONS_MARKED_READ" : "NOTIFICATION_MARKED_READ",
    entityType: "NOTIFICATION",
    entityId: parsed.data.id ?? user.id,
    metadata: { count: result.count },
  });

  return NextResponse.json({ ok: true, updated: result.count });
}
