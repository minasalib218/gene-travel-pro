import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { tableExists } from "@/lib/prisma-safe";
import { createRouteClient } from "@/lib/supabase/server";
import { ensureUserProfile } from "@/lib/profile/ensureUserProfile";

const SUPPORTED_TYPES = new Set(["ready_plan", "destination", "offer", "event", "other"]);

async function getUserId() {
  const supabase = createRouteClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;
  await ensureUserProfile(data.user);
  return data.user.id;
}

export async function GET(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ ok: false, code: "NOT_AUTHED", saved: false }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "";
  const id = searchParams.get("id") || "";
  const title = searchParams.get("title") || "";
  const href = searchParams.get("href") || "";

  if (!SUPPORTED_TYPES.has(type) || (!id && !title && !href)) {
    return NextResponse.json({ ok: false, code: "INVALID_INPUT", saved: false }, { status: 400 });
  }

  if (type === "ready_plan") {
    if (!id || !(await tableExists("favorite_plans"))) return NextResponse.json({ ok: true, saved: false });
    const favorite = await prisma.favoritePlan.findUnique({
      where: { userId_readyPlanId: { userId, readyPlanId: id } },
      select: { id: true },
    });
    return NextResponse.json({ ok: true, saved: Boolean(favorite) });
  }

  if (type === "destination") {
    if (!id || !(await tableExists("favorite_destinations"))) return NextResponse.json({ ok: true, saved: false });
    const favorite = await prisma.favoriteDestination.findUnique({
      where: { userId_destinationId: { userId, destinationId: id } },
      select: { id: true },
    });
    return NextResponse.json({ ok: true, saved: Boolean(favorite) });
  }

  if (!(await tableExists("wishlist_items"))) return NextResponse.json({ ok: true, saved: false });

  const favorite = await prisma.wishlistItem.findFirst({
    where: {
      userId,
      status: { not: "REMOVED" },
      OR: [
        id ? { metadata: { path: ["sourceId"], equals: id } } : undefined,
        href ? { href } : undefined,
        title ? { title } : undefined,
      ].filter(Boolean) as any,
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, saved: Boolean(favorite) });
}
