import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import {
  ANALYTICS_ANONYMOUS_COOKIE,
  ANALYTICS_SESSION_COOKIE,
  getAnalyticsLocation,
  parseUserAgent,
  recordAnalyticsEvent,
  recordConversionEvent,
} from "@/lib/analytics-server";
import { getAdminSetting } from "@/lib/admin/settings";

export const dynamic = "force-dynamic";

type EventBody = {
  eventName?: string;
  category?: string;
  pagePath?: string;
  metadata?: Record<string, unknown>;
  sessionId?: string;
  anonymousId?: string;
};

function ensureSessionId(candidate?: string | null) {
  return candidate?.trim() || crypto.randomUUID();
}

function readMetadataString(metadata: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

export async function POST(req: NextRequest) {
  let sessionId = ensureSessionId(req.cookies.get(ANALYTICS_SESSION_COOKIE)?.value);
  let anonymousId = ensureSessionId(req.cookies.get(ANALYTICS_ANONYMOUS_COOKIE)?.value);

  try {
    const settings = await getAdminSetting("analytics-settings", {
      enableInternalAnalytics: true,
    });

    const body = (await req.json().catch(() => ({}))) as EventBody;
    sessionId = ensureSessionId(body.sessionId || sessionId);
    anonymousId = ensureSessionId(body.anonymousId || anonymousId);

    if (!body.eventName) {
      const response = NextResponse.json({ ok: true });
      response.cookies.set(ANALYTICS_SESSION_COOKIE, sessionId, {
        path: "/",
        maxAge: 60 * 60 * 24 * 180,
        sameSite: "lax",
      });
      response.cookies.set(ANALYTICS_ANONYMOUS_COOKIE, anonymousId, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
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
    response.cookies.set(ANALYTICS_ANONYMOUS_COOKIE, anonymousId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
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
    const source = readMetadataString(metadata, "utm_source", "utmSource", "source");
    const campaign = readMetadataString(metadata, "utm_campaign", "utmCampaign", "campaign");
    const utmMedium = readMetadataString(metadata, "utm_medium", "utmMedium", "medium");
    const utmContent = readMetadataString(metadata, "utm_content", "utmContent");
    const utmTerm = readMetadataString(metadata, "utm_term", "utmTerm");

    await recordAnalyticsEvent({
      userId: data?.user?.id ?? null,
      anonymousId,
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
      planId: readMetadataString(metadata, "planId"),
      readyPlanId: readMetadataString(metadata, "readyPlanId"),
      itemId: readMetadataString(metadata, "itemId", "readyPlanItemId", "planItemId"),
      destination: readMetadataString(metadata, "destination", "contentName"),
      provider: readMetadataString(metadata, "provider"),
      utmSource: source,
      utmMedium,
      utmCampaign: campaign,
      utmContent,
      utmTerm,
      metadata,
    });

    const value = typeof metadata.value === "number" ? metadata.value : Number(metadata.value ?? 0);
    const currency = typeof metadata.currency === "string" ? metadata.currency : "USD";

    if (["checkout_started", "payment_failed", "signup_completed", "ai_input_completed", "booking_button_clicked", "book_now_clicked"].includes(body.eventName)) {
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

    return response;
  } catch (error) {
    console.error("analytics event route error:", error);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(ANALYTICS_SESSION_COOKIE, sessionId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 180,
      sameSite: "lax",
    });
    response.cookies.set(ANALYTICS_ANONYMOUS_COOKIE, anonymousId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return response;
  }
}
