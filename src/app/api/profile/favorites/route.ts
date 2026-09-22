import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { createRouteClient } from "@/lib/supabase/server";
import { tableExists } from "@/lib/prisma-safe";
import { recordUserActivity } from "@/lib/customer-activity";
import { ensureUserProfile } from "@/lib/profile/ensureUserProfile";
import {
  ANALYTICS_ANONYMOUS_COOKIE,
  ANALYTICS_SESSION_COOKIE,
  getAnalyticsLocation,
  parseUserAgent,
  recordAnalyticsEvent,
} from "@/lib/analytics-server";

const favoriteSchema = z.object({
  readyPlanId: z.string().min(1),
});

async function getUserId() {
  const supabase = createRouteClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;
  await ensureUserProfile(data.user);
  return data.user.id;
}

async function recordFavoriteAnalytics(req: NextRequest, input: {
  userId: string;
  eventName: "item_favorited" | "item_unfavorited";
  readyPlanId: string;
  slug?: string | null;
  title?: string | null;
}) {
  const sessionId = req.cookies.get(ANALYTICS_SESSION_COOKIE)?.value || crypto.randomUUID();
  const anonymousId = req.cookies.get(ANALYTICS_ANONYMOUS_COOKIE)?.value || null;
  const { country, city } = getAnalyticsLocation(req.headers);
  const { deviceType, browser, os } = parseUserAgent(req.headers.get("user-agent"));

  await recordAnalyticsEvent({
    userId: input.userId,
    anonymousId,
    sessionId,
    eventName: input.eventName,
    eventCategory: "engagement",
    pagePath: req.headers.get("referer") || "/profile/favorites",
    referrer: req.headers.get("referer"),
    country,
    city,
    deviceType,
    browser,
    os,
    readyPlanId: input.readyPlanId,
    metadata: {
      entityType: "ready_plan",
      entityId: input.readyPlanId,
      slug: input.slug ?? null,
      title: input.title ?? null,
      contentName: input.title ?? "Ready Plan",
    },
  });
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ ok: false, code: "NOT_AUTHED" }, { status: 401 });
  if (!(await tableExists("favorite_plans"))) {
    return NextResponse.json({ ok: true, favorites: [] });
  }

  const favorites = await prisma.favoritePlan.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ ok: true, favorites });
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ ok: false, code: "NOT_AUTHED" }, { status: 401 });

  const parsed = favoriteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, code: "INVALID_INPUT" }, { status: 400 });
  }

  const plan = await prisma.readyPlan.findFirst({
    where: { id: parsed.data.readyPlanId, status: "PUBLISHED" },
    select: { id: true, slug: true, title: true, destination: true, daysCount: true, heroImage: true, coverImage: true },
  });

  if (!plan) return NextResponse.json({ ok: false, code: "NOT_FOUND" }, { status: 404 });
  if (!(await tableExists("favorite_plans"))) {
    return NextResponse.json({ ok: false, code: "FAVORITES_NOT_READY" }, { status: 503 });
  }

  const favorite = await prisma.favoritePlan.upsert({
    where: {
      userId_readyPlanId: {
        userId,
        readyPlanId: plan.id,
      },
    },
    update: {},
    create: {
      userId,
      readyPlanId: plan.id,
    },
  });

  await recordUserActivity({
    userId,
    event: "READY_PLAN_FAVORITED",
    entityType: "READY_PLAN",
    entityId: plan.id,
    metadata: { slug: plan.slug, title: plan.title },
  });
  await recordFavoriteAnalytics(req, {
    userId,
    eventName: "item_favorited",
    readyPlanId: plan.id,
    slug: plan.slug,
    title: plan.title,
  });

  return NextResponse.json({ ok: true, favorite });
}

export async function DELETE(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ ok: false, code: "NOT_AUTHED" }, { status: 401 });

  const parsed = favoriteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, code: "INVALID_INPUT" }, { status: 400 });
  }

  if (!(await tableExists("favorite_plans"))) {
    return NextResponse.json({ ok: true });
  }

  await prisma.favoritePlan.deleteMany({
    where: {
      userId,
      readyPlanId: parsed.data.readyPlanId,
    },
  });

  await recordUserActivity({
    userId,
    event: "READY_PLAN_UNFAVORITED",
    entityType: "READY_PLAN",
    entityId: parsed.data.readyPlanId,
  });
  await recordFavoriteAnalytics(req, {
    userId,
    eventName: "item_unfavorited",
    readyPlanId: parsed.data.readyPlanId,
  });

  return NextResponse.json({ ok: true });
}
