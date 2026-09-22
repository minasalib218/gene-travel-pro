import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { recordUserActivity } from "@/lib/customer-activity";
import { tableExists } from "@/lib/prisma-safe";
import { ensureUserProfile } from "@/lib/profile/ensureUserProfile";
import { createRouteClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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
  if (!(await tableExists("offers"))) return NextResponse.json({ ok: true, offers: [] });

  const offers = await prisma.offer.findMany({
    where: {
      status: "published",
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
    take: 24,
    select: {
      id: true,
      title: true,
      slug: true,
      imageUrl: true,
      iconUrl: true,
      location: true,
      country: true,
      duration: true,
      startingPrice: true,
      discountBadge: true,
      featured: true,
      expiresAt: true,
    },
  });

  await recordUserActivity({
    userId: user.id,
    event: "PROFILE_OFFERS_VIEWED",
    entityType: "PROFILE",
    metadata: { count: offers.length },
  });

  return NextResponse.json({
    ok: true,
    offers: offers.map((offer) => ({
      ...offer,
      bookingHref: `/api/affiliate/redirect?type=offer&id=${offer.id}`,
    })),
  });
}
