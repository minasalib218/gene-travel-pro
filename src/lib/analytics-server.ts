import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const ANALYTICS_SESSION_COOKIE = "gene_analytics_sid";

type AnalyticsInsertInput = {
  userId?: string | null;
  sessionId: string;
  eventName: string;
  eventCategory?: string | null;
  pagePath?: string | null;
  referrer?: string | null;
  country?: string | null;
  city?: string | null;
  deviceType?: string | null;
  browser?: string | null;
  os?: string | null;
  metadata?: Record<string, unknown> | null;
};

type PurchaseTrackingInput = {
  userId?: string | null;
  paymentId?: string | null;
  sessionId: string;
  packageName: string;
  amount: number;
  currency: string;
  provider?: string | null;
  status?: string | null;
  source?: string | null;
  campaign?: string | null;
  metaEventId?: string | null;
  gaClientId?: string | null;
};

const FUNNEL_STEP_MAP: Record<string, { stepName: string; stepOrder: number }> = {
  page_view: { stepName: "Homepage visit", stepOrder: 1 },
  ready_plan_clicked: { stepName: "Ready plan click", stepOrder: 2 },
  destination_clicked: { stepName: "Destination click", stepOrder: 2 },
  offer_clicked: { stepName: "Offer click", stepOrder: 2 },
  pricing_view: { stepName: "Pricing page visit", stepOrder: 3 },
  package_selected: { stepName: "Package selected", stepOrder: 4 },
  checkout_started: { stepName: "Checkout started", stepOrder: 5 },
  payment_success: { stepName: "Payment success", stepOrder: 6 },
  signup_completed: { stepName: "Signup complete", stepOrder: 7 },
  login_completed: { stepName: "Login complete", stepOrder: 7 },
  ai_planner_started: { stepName: "AI planner started", stepOrder: 8 },
  ai_input_completed: { stepName: "AI input completed", stepOrder: 9 },
  recommendation_viewed: { stepName: "Recommendation viewed", stepOrder: 10 },
  analysis_completed: { stepName: "Analysis completed", stepOrder: 11 },
  booking_button_clicked: { stepName: "Booking clicked", stepOrder: 12 },
  summary_viewed: { stepName: "Summary viewed", stepOrder: 13 },
};

function isMissingTableError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (((error as any).code === "P2021") || ((error as any).code === "P2022"))
  );
}

export function parseUserAgent(userAgent: string | null | undefined) {
  const ua = (userAgent || "").toLowerCase();
  const deviceType =
    /ipad|tablet/.test(ua) ? "tablet" : /mobile|iphone|android/.test(ua) ? "mobile" : "desktop";

  const browser =
    ua.includes("edg/")
      ? "Edge"
      : ua.includes("chrome/")
        ? "Chrome"
        : ua.includes("safari/") && !ua.includes("chrome/")
          ? "Safari"
          : ua.includes("firefox/")
            ? "Firefox"
            : ua.includes("opr/")
              ? "Opera"
              : "Unknown";

  const os =
    ua.includes("windows")
      ? "Windows"
      : ua.includes("mac os")
        ? "macOS"
        : ua.includes("android")
          ? "Android"
          : ua.includes("iphone") || ua.includes("ipad")
            ? "iOS"
            : ua.includes("linux")
              ? "Linux"
              : "Unknown";

  return { deviceType, browser, os };
}

export function getAnalyticsLocation(headers: Headers) {
  return {
    country: headers.get("x-vercel-ip-country"),
    city: headers.get("x-vercel-ip-city"),
  };
}

export async function recordAnalyticsEvent(input: AnalyticsInsertInput) {
  const payload = JSON.stringify(input.metadata ?? {});
  try {
    await prisma.$executeRaw(
      Prisma.sql`
        INSERT INTO analytics_events (
          id, "userId", "sessionId", "eventName", "eventCategory", "pagePath", referrer,
          country, city, "deviceType", browser, os, metadata, "createdAt"
        )
        VALUES (
          ${crypto.randomUUID()},
          ${input.userId ?? null},
          ${input.sessionId},
          ${input.eventName},
          ${input.eventCategory ?? null},
          ${input.pagePath ?? null},
          ${input.referrer ?? null},
          ${input.country ?? null},
          ${input.city ?? null},
          ${input.deviceType ?? null},
          ${input.browser ?? null},
          ${input.os ?? null},
          ${payload}::jsonb,
          NOW()
        )
      `,
    );
  } catch (error) {
    if (!isMissingTableError(error)) {
      console.error("analytics event insert error:", error);
    }
  }

  const funnel = FUNNEL_STEP_MAP[input.eventName];
  if (funnel) {
    await recordFunnelEvent({
      userId: input.userId ?? null,
      sessionId: input.sessionId,
      stepName: funnel.stepName,
      stepOrder: funnel.stepOrder,
      pagePath: input.pagePath ?? null,
      metadata: input.metadata ?? {},
    });
  }
}

export async function recordFunnelEvent(input: {
  userId?: string | null;
  sessionId: string;
  stepName: string;
  stepOrder: number;
  pagePath?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  const payload = JSON.stringify(input.metadata ?? {});
  try {
    await prisma.$executeRaw(
      Prisma.sql`
        INSERT INTO funnel_events (
          id, "userId", "sessionId", "stepName", "stepOrder", "pagePath", metadata, "createdAt"
        )
        VALUES (
          ${crypto.randomUUID()},
          ${input.userId ?? null},
          ${input.sessionId},
          ${input.stepName},
          ${input.stepOrder},
          ${input.pagePath ?? null},
          ${payload}::jsonb,
          NOW()
        )
      `,
    );
  } catch (error) {
    if (!isMissingTableError(error)) {
      console.error("funnel event insert error:", error);
    }
  }
}

export async function recordConversionEvent(input: {
  userId?: string | null;
  sessionId: string;
  conversionType: string;
  value?: number | null;
  currency?: string | null;
  source?: string | null;
  campaign?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  const payload = JSON.stringify(input.metadata ?? {});
  try {
    await prisma.$executeRaw(
      Prisma.sql`
        INSERT INTO conversion_events (
          id, "userId", "sessionId", "conversionType", value, currency, source, campaign, metadata, "createdAt"
        )
        VALUES (
          ${crypto.randomUUID()},
          ${input.userId ?? null},
          ${input.sessionId},
          ${input.conversionType},
          ${input.value ?? null},
          ${input.currency ?? null},
          ${input.source ?? null},
          ${input.campaign ?? null},
          ${payload}::jsonb,
          NOW()
        )
      `,
    );
  } catch (error) {
    if (!isMissingTableError(error)) {
      console.error("conversion event insert error:", error);
    }
  }
}

export async function recordPurchaseTracking(input: PurchaseTrackingInput) {
  try {
    await prisma.$executeRaw(
      Prisma.sql`
        INSERT INTO purchase_tracking (
          id, "userId", "paymentId", "sessionId", "packageName", amount, currency, provider, status,
          source, campaign, "metaEventId", "gaClientId", "createdAt"
        )
        VALUES (
          ${crypto.randomUUID()},
          ${input.userId ?? null},
          ${input.paymentId ?? null},
          ${input.sessionId},
          ${input.packageName},
          ${input.amount},
          ${input.currency},
          ${input.provider ?? null},
          ${input.status ?? "completed"},
          ${input.source ?? null},
          ${input.campaign ?? null},
          ${input.metaEventId ?? null},
          ${input.gaClientId ?? null},
          NOW()
        )
      `,
    );
  } catch (error) {
    if (!isMissingTableError(error)) {
      console.error("purchase tracking insert error:", error);
    }
  }
}

export async function getAdminAnalyticsSnapshot(args: {
  dateFrom: Date;
  dateTo: Date;
  country?: string | null;
  source?: string | null;
  device?: string | null;
}) {
  const source = args.source?.trim() || null;
  const country = args.country?.trim() || null;
  const device = args.device?.trim() || null;

  const rows = await prisma.$queryRaw<Array<Record<string, any>>>(
    Prisma.sql`
      WITH filtered_events AS (
        SELECT *
        FROM analytics_events
        WHERE "createdAt" >= ${args.dateFrom}
          AND "createdAt" < ${args.dateTo}
          AND (${country}::text IS NULL OR country = ${country})
          AND (${device}::text IS NULL OR "deviceType" = ${device})
          AND (${source}::text IS NULL OR metadata->>'utm_source' = ${source} OR metadata->>'source' = ${source})
      ),
      filtered_conversions AS (
        SELECT *
        FROM conversion_events
        WHERE "createdAt" >= ${args.dateFrom}
          AND "createdAt" < ${args.dateTo}
          AND (${source}::text IS NULL OR source = ${source})
      ),
      filtered_purchases AS (
        SELECT *
        FROM purchase_tracking
        WHERE "createdAt" >= ${args.dateFrom}
          AND "createdAt" < ${args.dateTo}
          AND (${source}::text IS NULL OR source = ${source})
      )
      SELECT
        (SELECT COUNT(*)::int FROM filtered_events) AS "totalVisitors",
        (SELECT COUNT(DISTINCT "sessionId")::int FROM filtered_events) AS "uniqueSessions",
        (SELECT COUNT(DISTINCT COALESCE(country, 'unknown'))::int FROM filtered_events) AS "countries",
        (SELECT COUNT(*)::int FROM filtered_events WHERE "eventName" = 'page_view') AS "pageViews",
        (SELECT COUNT(*)::int FROM filtered_purchases) AS "purchases",
        (SELECT COALESCE(SUM(amount), 0)::float FROM filtered_purchases WHERE status IN ('completed', 'paid', 'PAID')) AS revenue,
        (SELECT COUNT(*)::int FROM filtered_events WHERE "eventName" = 'checkout_started') AS "checkouts",
        (SELECT COUNT(*)::int FROM filtered_events WHERE "eventName" = 'ai_planner_started') AS "plannerStarts",
        (SELECT COUNT(*)::int FROM filtered_events WHERE "eventName" = 'ai_input_completed') AS "plannerCompletions",
        (SELECT COUNT(*)::int FROM filtered_events WHERE "eventName" = 'booking_button_clicked') AS "bookingClicks",
        (SELECT COUNT(*)::int FROM filtered_events WHERE "eventName" = 'affiliate_redirect_clicked') AS "affiliateClicks",
        (SELECT COUNT(*)::int FROM filtered_events WHERE "eventName" = 'payment_failed') AS "paymentFailures"
    `,
  ).catch((error) => {
    if (isMissingTableError(error)) return [];
    throw error;
  });

  const base = rows[0] ?? {
    totalVisitors: 0,
    uniqueSessions: 0,
    countries: 0,
    pageViews: 0,
    purchases: 0,
    revenue: 0,
    checkouts: 0,
    plannerStarts: 0,
    plannerCompletions: 0,
    bookingClicks: 0,
    affiliateClicks: 0,
    paymentFailures: 0,
  };

  const [visitorsByDay, visitorsByCountry, topPages, topReferrers, funnelDropoff, purchasesByPackage, topReadyPlans, topDestinations, topOffers, topEvents, topAffiliateClicks, deviceBreakdown, userBehavior] =
    await Promise.all([
      prisma.$queryRaw<Array<{ day: string; value: number }>>(
        Prisma.sql`
          SELECT TO_CHAR(DATE_TRUNC('day', "createdAt"), 'YYYY-MM-DD') AS day, COUNT(*)::int AS value
          FROM analytics_events
          WHERE "createdAt" >= ${args.dateFrom} AND "createdAt" < ${args.dateTo} AND "eventName" = 'page_view'
          GROUP BY 1
          ORDER BY 1 ASC
        `,
      ).catch((error) => (isMissingTableError(error) ? [] : Promise.reject(error))),
      prisma.$queryRaw<Array<{ label: string; value: number }>>(
        Prisma.sql`
          SELECT COALESCE(country, 'Unknown') AS label, COUNT(*)::int AS value
          FROM analytics_events
          WHERE "createdAt" >= ${args.dateFrom} AND "createdAt" < ${args.dateTo}
          GROUP BY 1
          ORDER BY value DESC
          LIMIT 10
        `,
      ).catch((error) => (isMissingTableError(error) ? [] : Promise.reject(error))),
      prisma.$queryRaw<Array<{ label: string; value: number }>>(
        Prisma.sql`
          SELECT COALESCE("pagePath", '/') AS label, COUNT(*)::int AS value
          FROM analytics_events
          WHERE "createdAt" >= ${args.dateFrom} AND "createdAt" < ${args.dateTo}
          GROUP BY 1
          ORDER BY value DESC
          LIMIT 10
        `,
      ).catch((error) => (isMissingTableError(error) ? [] : Promise.reject(error))),
      prisma.$queryRaw<Array<{ label: string; value: number }>>(
        Prisma.sql`
          SELECT COALESCE(NULLIF(referrer, ''), 'Direct') AS label, COUNT(*)::int AS value
          FROM analytics_events
          WHERE "createdAt" >= ${args.dateFrom} AND "createdAt" < ${args.dateTo}
          GROUP BY 1
          ORDER BY value DESC
          LIMIT 10
        `,
      ).catch((error) => (isMissingTableError(error) ? [] : Promise.reject(error))),
      prisma.$queryRaw<Array<{ label: string; value: number }>>(
        Prisma.sql`
          SELECT "stepName" AS label, COUNT(*)::int AS value
          FROM funnel_events
          WHERE "createdAt" >= ${args.dateFrom} AND "createdAt" < ${args.dateTo}
          GROUP BY "stepOrder", "stepName"
          ORDER BY "stepOrder" ASC
        `,
      ).catch((error) => (isMissingTableError(error) ? [] : Promise.reject(error))),
      prisma.$queryRaw<Array<{ label: string; value: number }>>(
        Prisma.sql`
          SELECT COALESCE("packageName", 'Unknown') AS label, COUNT(*)::int AS value
          FROM purchase_tracking
          WHERE "createdAt" >= ${args.dateFrom} AND "createdAt" < ${args.dateTo}
          GROUP BY 1
          ORDER BY value DESC
        `,
      ).catch((error) => (isMissingTableError(error) ? [] : Promise.reject(error))),
      prisma.$queryRaw<Array<{ label: string; value: number }>>(
        Prisma.sql`
          SELECT COALESCE(metadata->>'contentName', metadata->>'title', 'Ready Plan') AS label, COUNT(*)::int AS value
          FROM analytics_events
          WHERE "createdAt" >= ${args.dateFrom} AND "createdAt" < ${args.dateTo} AND "eventName" = 'ready_plan_clicked'
          GROUP BY 1
          ORDER BY value DESC
          LIMIT 10
        `,
      ).catch((error) => (isMissingTableError(error) ? [] : Promise.reject(error))),
      prisma.$queryRaw<Array<{ label: string; value: number }>>(
        Prisma.sql`
          SELECT COALESCE(metadata->>'contentName', metadata->>'title', 'Destination') AS label, COUNT(*)::int AS value
          FROM analytics_events
          WHERE "createdAt" >= ${args.dateFrom} AND "createdAt" < ${args.dateTo} AND "eventName" = 'destination_clicked'
          GROUP BY 1
          ORDER BY value DESC
          LIMIT 10
        `,
      ).catch((error) => (isMissingTableError(error) ? [] : Promise.reject(error))),
      prisma.$queryRaw<Array<{ label: string; value: number }>>(
        Prisma.sql`
          SELECT COALESCE(metadata->>'contentName', metadata->>'title', 'Offer') AS label, COUNT(*)::int AS value
          FROM analytics_events
          WHERE "createdAt" >= ${args.dateFrom} AND "createdAt" < ${args.dateTo} AND "eventName" = 'offer_clicked'
          GROUP BY 1
          ORDER BY value DESC
          LIMIT 10
        `,
      ).catch((error) => (isMissingTableError(error) ? [] : Promise.reject(error))),
      prisma.$queryRaw<Array<{ label: string; value: number }>>(
        Prisma.sql`
          SELECT COALESCE(metadata->>'contentName', metadata->>'title', 'Event') AS label, COUNT(*)::int AS value
          FROM analytics_events
          WHERE "createdAt" >= ${args.dateFrom} AND "createdAt" < ${args.dateTo} AND "eventName" = 'event_clicked'
          GROUP BY 1
          ORDER BY value DESC
          LIMIT 10
        `,
      ).catch((error) => (isMissingTableError(error) ? [] : Promise.reject(error))),
      prisma.$queryRaw<Array<{ label: string; value: number }>>(
        Prisma.sql`
          SELECT COALESCE(metadata->>'affiliateLinkId', metadata->>'provider', 'Affiliate') AS label, COUNT(*)::int AS value
          FROM analytics_events
          WHERE "createdAt" >= ${args.dateFrom} AND "createdAt" < ${args.dateTo} AND "eventName" = 'affiliate_redirect_clicked'
          GROUP BY 1
          ORDER BY value DESC
          LIMIT 10
        `,
      ).catch((error) => (isMissingTableError(error) ? [] : Promise.reject(error))),
      prisma.$queryRaw<Array<{ label: string; value: number }>>(
        Prisma.sql`
          SELECT COALESCE("deviceType", 'unknown') AS label, COUNT(*)::int AS value
          FROM analytics_events
          WHERE "createdAt" >= ${args.dateFrom} AND "createdAt" < ${args.dateTo}
          GROUP BY 1
          ORDER BY value DESC
        `,
      ).catch((error) => (isMissingTableError(error) ? [] : Promise.reject(error))),
      prisma.$queryRaw<Array<{ label: string; value: number }>>(
        Prisma.sql`
          SELECT "eventName" AS label, COUNT(*)::int AS value
          FROM analytics_events
          WHERE "createdAt" >= ${args.dateFrom} AND "createdAt" < ${args.dateTo}
          GROUP BY 1
          ORDER BY value DESC
          LIMIT 20
        `,
      ).catch((error) => (isMissingTableError(error) ? [] : Promise.reject(error))),
    ]);

  const conversionRate = base.uniqueSessions > 0 ? (base.purchases / base.uniqueSessions) * 100 : 0;
  const checkoutConversionRate = base.checkouts > 0 ? (base.purchases / base.checkouts) * 100 : 0;
  const plannerCompletionRate = base.plannerStarts > 0 ? (base.plannerCompletions / base.plannerStarts) * 100 : 0;
  const bookingClickRate = base.uniqueSessions > 0 ? (base.bookingClicks / base.uniqueSessions) * 100 : 0;
  const bounceRateEstimate = base.uniqueSessions > 0 ? Math.max(0, ((base.uniqueSessions - base.plannerStarts) / base.uniqueSessions) * 100) : 0;
  const averageSessionTimeEstimate = base.uniqueSessions > 0 ? Math.max(18, Math.round((base.pageViews / Math.max(base.uniqueSessions, 1)) * 47)) : 0;

  return {
    metrics: {
      ...base,
      conversionRate,
      checkoutConversionRate,
      plannerCompletionRate,
      bookingClickRate,
      bounceRateEstimate,
      averageSessionTimeEstimate,
    },
    visitorsByDay,
    visitorsByCountry,
    topPages,
    topReferrers,
    funnelDropoff,
    purchasesByPackage,
    topReadyPlans,
    topDestinations,
    topOffers,
    topEvents,
    topAffiliateClicks,
    deviceBreakdown,
    userBehavior,
  };
}
