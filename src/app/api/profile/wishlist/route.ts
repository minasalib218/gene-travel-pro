import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { tableExists } from "@/lib/prisma-safe";
import { createRouteClient } from "@/lib/supabase/server";
import { recordUserActivity } from "@/lib/customer-activity";

export const dynamic = "force-dynamic";

const wishlistSchema = z.object({
  tripName: z.string().max(120).optional().nullable(),
  itemType: z.enum(["flight", "hotel", "activity", "transportation", "destination", "ready_plan", "other"]),
  title: z.string().min(1).max(160),
  provider: z.string().max(80).optional().nullable(),
  destination: z.string().max(120).optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  href: z.string().max(500).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
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
  if (!(await tableExists("wishlist_items"))) {
    return NextResponse.json({ ok: true, items: [] });
  }

  const items = await prisma.wishlistItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ ok: true, items });
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ ok: false, code: "NOT_AUTHED" }, { status: 401 });
  if (!(await tableExists("wishlist_items"))) {
    return NextResponse.json({ ok: false, code: "WISHLIST_NOT_READY" }, { status: 503 });
  }

  const parsed = wishlistSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, code: "INVALID_INPUT" }, { status: 400 });

  const item = await prisma.wishlistItem.create({
    data: {
      userId,
      tripName: parsed.data.tripName || null,
      itemType: parsed.data.itemType,
      title: parsed.data.title,
      provider: parsed.data.provider || null,
      destination: parsed.data.destination || null,
      imageUrl: parsed.data.imageUrl || null,
      href: parsed.data.href || null,
      metadata: parsed.data.metadata ? (parsed.data.metadata as Prisma.InputJsonValue) : undefined,
    },
  });

  await recordUserActivity({
    userId,
    event: "WISHLIST_ITEM_SAVED",
    entityType: "WISHLIST_ITEM",
    entityId: item.id,
    metadata: { itemType: item.itemType, title: item.title },
  });

  return NextResponse.json({ ok: true, item });
}

export async function DELETE(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ ok: false, code: "NOT_AUTHED" }, { status: 401 });

  const parsed = deleteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, code: "INVALID_INPUT" }, { status: 400 });
  if (!(await tableExists("wishlist_items"))) return NextResponse.json({ ok: true });

  await prisma.wishlistItem.deleteMany({ where: { id: parsed.data.id, userId } });
  await recordUserActivity({
    userId,
    event: "WISHLIST_ITEM_REMOVED",
    entityType: "WISHLIST_ITEM",
    entityId: parsed.data.id,
  });

  return NextResponse.json({ ok: true });
}
