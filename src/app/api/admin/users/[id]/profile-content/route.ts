import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin/requireAdmin";

export const dynamic = "force-dynamic";

const checklistItem = z.object({
  id: z.string().min(1).max(160),
  label: z.string().trim().min(1).max(160),
  group: z.string().trim().min(1).max(100),
  done: z.boolean(),
  custom: z.boolean().optional(),
});

const inputSchema = z.object({
  checklist: z.array(checklistItem).max(250),
  hiddenOfferIds: z.array(z.string().min(1).max(100)).max(500),
  pinnedOfferIds: z.array(z.string().min(1).max(100)).max(100),
  calendarDismissed: z.array(z.string().min(1).max(200)).max(1000),
});

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ ok: false, code: admin.code }, { status: 403 });

  const profile = await prisma.profile.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!profile) return NextResponse.json({ ok: false, code: "NOT_FOUND" }, { status: 404 });

  const parsed = inputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, code: "INVALID_INPUT" }, { status: 400 });

  const existing = await prisma.travelPreference.findUnique({ where: { userId: params.id } });
  const previousMetadata = existing?.metadata && typeof existing.metadata === "object" && !Array.isArray(existing.metadata)
    ? existing.metadata as Record<string, unknown>
    : {};
  const metadata = {
    ...previousMetadata,
    checklist: parsed.data.checklist,
    checklistUpdatedAt: new Date().toISOString(),
    hiddenOfferIds: [...new Set(parsed.data.hiddenOfferIds)],
    pinnedOfferIds: [...new Set(parsed.data.pinnedOfferIds)].filter((id) => !parsed.data.hiddenOfferIds.includes(id)),
    calendarDismissed: [...new Set(parsed.data.calendarDismissed)],
    profileContentUpdatedByAdminAt: new Date().toISOString(),
  };

  await prisma.$transaction([
    prisma.travelPreference.upsert({
      where: { userId: params.id },
      update: { metadata: metadata as Prisma.InputJsonValue },
      create: { userId: params.id, metadata: metadata as Prisma.InputJsonValue },
    }),
    prisma.adminAuditLog.create({
      data: {
        adminId: admin.userId,
        action: "CUSTOMER_PROFILE_CONTENT_UPDATED",
        targetType: "PROFILE",
        targetId: params.id,
        previousState: previousMetadata as Prisma.InputJsonValue,
        nextState: metadata as Prisma.InputJsonValue,
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
