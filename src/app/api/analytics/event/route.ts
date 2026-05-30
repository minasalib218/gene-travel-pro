import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import {
  ANALYTICS_SESSION_COOKIE,
  getAnalyticsLocation,
  parseUserAgent,
  recordAnalyticsEvent,
  recordConversionEvent,
  recordPurchaseTracking,
} from "@/lib/analytics-server";
import { getAdminSetting } from "@/lib/admin/settings";

export const dynamic = "force-dynamic";

type EventBody = {
  eventName?: string;
  category?: string;
  pagePath?: string;
  metadata?: Record<string, unknown>;
  sessionId?: string;
};

function ensureSessionId(candidate?: string | null) {
  return candidate?.trim() || crypto.randomUUID();
}

export async function POST(req: NextRequest) {
  let sessionId = ensureSessionId(req.cookies.get(ANALYTICS_SESSION_COOKIE)?.value);

  try {
    const settings = await getAdminSetting("analytics-settings", {
      enableInternalAnalytics: true,
    });

    const body = (await req.json().catch(() => ({}))) as EventBody;
    sessionId = ensureSessionId(body.sessionId || sessionId);

    if (!body.eventName) {
      const response = NextResponse.json({ ok: true });
      response.cookies.set(ANALYTICS_SESSION_COOKIE, sessionId, {
        path: "/",
        maxAge: 60 * 60 * 24 * 180,
        sameSite: "lax",
      });
      return response;
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(ANALYTICS_SESSION_COOKIE, sessionId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 180,
      sameSite: "lax",
    });

    if (settings?.enableInternalAnalytics === false) {
      return response;
    }

    const supabase = createRouteClient();
    const { data } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
    const metadata = body.metadata ?? {};
    const { country, city } = getAnalyticsLocation(req.headers);
    const { deviceType, browser, os } = parseUserAgent(req.headers.get("user-agent"));

    await recordAnalyticsEvent({
      userId: data?.user?.id ?? null,
      sessionId,
      eventName: body.eventName,
      eventCategory: body.category ?? null,
      pagePath: body.pagePath || req.nextUrl.searchParams.get("pagePath") || null,
      referrer: typeof metadata.referrer === "string" ? metadata.referrer : req.headers.get("referer"),
      country,
      city,
      deviceType,
      browser,
      os,
      metadata,
    });

    const source = typeof metadata.utm_source === "string" ? metadata.utm_source : typeof metadata.source === "string" ? metadata.source : null;
    const campaign = typeof metadata.utm_campaign === "string" ? metadata.utm_campaign : typeof metadata.campaign === "string" ? metadata.campaign : null;
    const value = typeof metadata.value === "number" ? metadata.value : Number(metadata.value ?? 0);
    const currency = typeof metadata.currency === "string" ? metadata.currency : "USD";

    if (["checkout_started", "payment_success", "payment_failed", "signup_completed", "ai_input_completed", "booking_button_clicked"].includes(body.eventName)) {
      await recordConversionEvent({
        userId: data?.user?.id ?? null,
        sessionId,
        conversionType: body.eventName,
        value: Number.isFinite(value) ? value : null,
        currency,
        source,
        campaign,
        metadata,
      });
    }

    if (body.eventName === "payment_success") {
      await recordPurchaseTracking({
        userId: data?.user?.id ?? null,
        paymentId: typeof metadata.paymentId === "string" ? metadata.paymentId : null,
        sessionId,
        packageName:
          typeof metadata.packageName === "string"
            ? metadata.packageName
            : typeof metadata.planType === "string"
              ? metadata.planType
              : "Gene Travel",
        amount: Number.isFinite(value) ? value : 0,
        currency,
        provider: typeof metadata.provider === "string" ? metadata.provider : null,
        status: "completed",
        source,
        campaign,
        metaEventId: typeof metadata.transactionId === "string" ? metadata.transactionId : null,
        gaClientId: typeof metadata.gaClientId === "string" ? metadata.gaClientId : null,
      });
    }

    return response;
  } catch (error) {
    console.error("analytics event route error:", error);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(ANALYTICS_SESSION_COOKIE, sessionId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 180,
      sameSite: "lax",
    });
    return response;
  }
}
