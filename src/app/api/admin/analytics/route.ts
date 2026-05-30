import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { getAdminAnalyticsSnapshot } from "@/lib/analytics-server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return NextResponse.json({ ok: false, code: admin.code }, { status: 403 });

    const now = new Date();
    const last30 = new Date(now);
    last30.setDate(last30.getDate() - 30);
    const snapshot = await getAdminAnalyticsSnapshot({
      dateFrom: last30,
      dateTo: now,
    });

    return NextResponse.json({
      ok: true,
      totals: {
        totalVisitors: snapshot.metrics.totalVisitors,
        pricingPageVisits: snapshot.topPages.find((item) => item.label === "/pricing")?.value ?? 0,
        checkoutClicks: snapshot.metrics.checkouts,
        successfulPayments: snapshot.metrics.purchases,
        failedPayments: snapshot.metrics.paymentFailures,
        conversionRate: snapshot.metrics.conversionRate,
        revenue: snapshot.metrics.revenue,
        cac: 0,
        aiUsageCount: snapshot.userBehavior
          .filter((item) => item.label.startsWith("GENERATE_") || item.label.startsWith("REPLACE_"))
          .reduce((sum, item) => sum + item.value, 0),
        averageTokensPerPlan: 0,
      },
      topCountries: snapshot.visitorsByCountry.map((item) => ({ country: item.label, _count: { country: item.value } })),
      topSources: snapshot.topReferrers.map((item) => ({ source: item.label, _count: { source: item.value } })),
    });
  } catch (error) {
    console.error("admin analytics error:", error);
    return NextResponse.json({
      ok: true,
      totals: {
        totalVisitors: 0,
        pricingPageVisits: 0,
        checkoutClicks: 0,
        successfulPayments: 0,
        failedPayments: 0,
        conversionRate: 0,
        revenue: 0,
        cac: 0,
        aiUsageCount: 0,
        averageTokensPerPlan: 0,
      },
      topCountries: [],
      topSources: [],
    });
  }
}
