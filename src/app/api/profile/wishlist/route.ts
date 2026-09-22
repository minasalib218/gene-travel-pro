import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { tableExists } from "@/lib/prisma-safe";
import { createRouteClient } from "@/lib/supabase/server";
import { recordUserActivity } from "@/lib/customer-activity";
import { ensureUserProfile } from "@/lib/profile/ensureUserProfile";

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

const deleteSchema = z.object({
  id: z.string().min(1).optional(),
  itemType: z.string().min(1).optional(),
  href: z.string().max(500).optional().nullable(),
  title: z.string().min(1).max(160).optional(),
  sourceId: z.string().min(1).optional(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

async function getUserId() {
  const supabase = createRouteClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;
  await ensureUserProfile(data.user);
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
  const metadata = (parsed.data.metadata ?? {}) as Record<string, unknown>;
  const sourceId = typeof metadata.sourceId === "string" && metadata.sourceId.trim() ? metadata.sourceId.trim() : null;

  const item = await prisma.wishlistItem
    .findFirst({
      where: {
        userId,
        itemType: parsed.data.itemType,
        status: { not: "REMOVED" },
        OR: [
          sourceId ? { metadata: { path: ["sourceId"], equals: sourceId } } : undefined,
          parsed.data.href ? { href: parsed.data.href } : undefined,
          { title: parsed.data.title, href: parsed.data.href || null },
        ].filter(Boolean) as any,
      },
    })
    .then((existing) =>
      existing
        ? prisma.wishlistItem.update({
            where: { id: existing.id },
            data: {
              tripName: parsed.data.tripName || existing.tripName,
              provider: parsed.data.provider || existing.provider,
              destination: parsed.data.destination || existing.destination,
              imageUrl: parsed.data.imageUrl || existing.imageUrl,
              metadata: parsed.data.metadata ? (parsed.data.metadata as Prisma.InputJsonValue) : existing.metadata,
              status: "SAVED",
            },
          })
        : prisma.wishlistItem.create({
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
          }),
    );

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
  const metadata = (parsed.data.metadata ?? {}) as Record<string, unknown>;
  const sourceId =
    parsed.data.sourceId ||
    (typeof metadata.sourceId === "string" && metadata.sourceId.trim() ? metadata.sourceId.trim() : null);

  if (!parsed.data.id && !sourceId && (!parsed.data.itemType || !parsed.data.title)) {
    return NextResponse.json({ ok: false, code: "INVALID_INPUT" }, { status: 400 });
  }

  await prisma.wishlistItem.deleteMany({
    where: parsed.data.id
      ? { id: parsed.data.id, userId }
      : sourceId
        ? {
            userId,
            status: { not: "REMOVED" },
            metadata: { path: ["sourceId"], equals: sourceId },
          }
        : {
            userId,
            itemType: parsed.data.itemType,
            title: parsed.data.title,
            href: parsed.data.href || null,
          },
  });
  await recordUserActivity({
    userId,
    event: "WISHLIST_ITEM_REMOVED",
    entityType: "WISHLIST_ITEM",
    entityId: parsed.data.id || parsed.data.title || "wishlist-item",
  });

  return NextResponse.json({ ok: true });
}
