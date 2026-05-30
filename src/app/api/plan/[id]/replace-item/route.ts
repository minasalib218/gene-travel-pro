import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createRouteClient } from "@/lib/supabase/server";
import { consumeCredit, refundConsumedCredit } from "@/lib/credits/creditService";
import { ANALYTICS_SESSION_COOKIE, getAnalyticsLocation, parseUserAgent, recordAnalyticsEvent } from "@/lib/analytics-server";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  let consumedUserId: string | null = null;
  let consumedAction: string | null = null;
  try {
    const supabase = createRouteClient();
    const { data } = await supabase.auth.getUser();
    if (!data?.user) return NextResponse.json({ ok: false, code: "NOT_AUTHED" }, { status: 401 });

    const body = await req.json().catch(() => null);
    const section = body?.section as "hotels" | "tours" | "flights";
    const index = Number(body?.index);
    const newItem = body?.item;

    if (!section || Number.isNaN(index) || !newItem) {
      return NextResponse.json({ ok: false, code: "BAD_REQUEST" }, { status: 400 });
    }

    const plan = await prisma.plan.findFirst({
      where: { id: params.id, userId: data.user.id },
    });
    if (!plan) return NextResponse.json({ ok: false, code: "NOT_FOUND" }, { status: 404 });

    const summary = (plan.summaryJson ?? {}) as any;
    const rec = summary.recommendations ?? {};
    const arr = Array.isArray(rec[section]) ? rec[section] : [];

    if (!arr[index]) {
      return NextResponse.json({ ok: false, code: "INDEX_OUT_OF_RANGE" }, { status: 400 });
    }

    const actionType =
      section === "hotels"
        ? "REPLACE_HOTEL"
        : section === "flights"
          ? "REPLACE_FLIGHT"
          : "REPLACE_ACTIVITY";

    await consumeCredit(data.user.id, actionType as "REPLACE_HOTEL" | "REPLACE_FLIGHT" | "REPLACE_ACTIVITY", {
      planId: plan.id,
      section,
      index,
    });
    consumedUserId = data.user.id;
    consumedAction = actionType;

    arr[index] = newItem;
    rec[section] = arr;
    summary.recommendations = rec;

    await prisma.plan.update({
      where: { id: plan.id },
      data: { summaryJson: summary },
    });

    const sessionId =
      (req.headers.get("cookie") || "")
        .split(";")
        .map((part) => part.trim())
        .find((part) => part.startsWith(`${ANALYTICS_SESSION_COOKIE}=`))
        ?.split("=")[1] || crypto.randomUUID();
    const location = getAnalyticsLocation(req.headers);
    const agent = parseUserAgent(req.headers.get("user-agent"));
    await recordAnalyticsEvent({
      userId: data.user.id,
      sessionId,
      eventName: "item_replaced",
      eventCategory: "ai",
      pagePath: `/api/plan/${params.id}/replace-item`,
      referrer: req.headers.get("referer"),
      country: location.country,
      city: location.city,
      deviceType: agent.deviceType,
      browser: agent.browser,
      os: agent.os,
      metadata: {
        planId: plan.id,
        section,
        index,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    try {
      if (consumedUserId && consumedAction) {
        await refundConsumedCredit(consumedUserId, consumedAction, { reason: "AI_FAILED", planId: params.id });
      }
    } catch {
      // keep original failure stable
    }
    return NextResponse.json(
      { ok: false, code: "INTERNAL_ERROR", message: e?.message || "Unknown error" },
      { status: 500 },
    );
  }
}
