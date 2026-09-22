import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/access/canUseAi";
import { requireActivePass } from "@/lib/require-pass";
import {
  ANALYTICS_ANONYMOUS_COOKIE,
  ANALYTICS_SESSION_COOKIE,
  getAnalyticsLocation,
  parseUserAgent,
  recordAnalyticsEvent,
} from "@/lib/analytics-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function buildPath(pathname: string, search: URLSearchParams) {
  const query = search.toString();
  return `${pathname}${query ? `?${query}` : ""}`;
}

async function trackReadyPlanUseAsBase(req: NextRequest, userId: string | null) {
  const readyPlanSlug = req.nextUrl.searchParams.get("readyPlan");
  if (!readyPlanSlug) return;

  const sessionId = req.cookies.get(ANALYTICS_SESSION_COOKIE)?.value || crypto.randomUUID();
  const anonymousId = req.cookies.get(ANALYTICS_ANONYMOUS_COOKIE)?.value || null;
  const { country, city } = getAnalyticsLocation(req.headers);
  const { deviceType, browser, os } = parseUserAgent(req.headers.get("user-agent"));

  await recordAnalyticsEvent({
    userId,
    anonymousId,
    sessionId,
    eventName: "ready_plan_used_as_base",
    eventCategory: "planner",
    pagePath: "/start-planning",
    referrer: req.headers.get("referer"),
    country,
    city,
    deviceType,
    browser,
    os,
    metadata: { readyPlanSlug },
  }).catch(() => null);
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const plannerPath = buildPath("/ai-planner", url.searchParams);
  const returnPath = buildPath("/start-planning", url.searchParams);

  const supabase = createRouteClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    return NextResponse.redirect(
      new URL(`/signin?next=${encodeURIComponent(returnPath)}`, url.origin),
    );
  }

  if (await isAdmin(data.user.id)) {
    await trackReadyPlanUseAsBase(req, data.user.id);
    return NextResponse.redirect(new URL(plannerPath, url.origin));
  }

  const access = await requireActivePass(data.user.id);
  if (!access.ok) {
    const fallback =
      access.code === "PASS_EXHAUSTED"
        ? "/profile?access=exhausted"
        : "/pricing?access=required";
    return NextResponse.redirect(new URL(fallback, url.origin));
  }

  await trackReadyPlanUseAsBase(req, data.user.id);
  return NextResponse.redirect(new URL(plannerPath, url.origin));
}
