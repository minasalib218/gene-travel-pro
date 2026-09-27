import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { getAdminAnalyticsSnapshot } from "@/lib/analytics-server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return NextResponse.json({ ok: false, code: admin.code }, { status: 403 });

    const dateTo = new Date();
    const dateFrom = new Date(dateTo.getTime() - 30 * 24 * 60 * 60 * 1000);
    const [snapshot, events, successfulPayments, sourceRows] = await Promise.all([
      getAdminAnalyticsSnapshot({ dateFrom, dateTo }),
      prisma.analyticsEvent.findMany({
        where: { createdAt: { gte: dateFrom, lt: dateTo } },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.payment.findMany({
        where: { status: "PAID", createdAt: { gte: dateFrom, lt: dateTo } },
        select: { amount: true, currency: true, userId: true },
      }),
      prisma.analyticsSession.groupBy({
        by: ["utmSource"],
        where: { startedAt: { gte: dateFrom, lt: dateTo } },
        _count: { _all: true },
      }),
    ]);

    const metrics = snapshot.metrics;
    const currencies = Array.from(new Set(successfulPayments.map((payment) => payment.currency || "USD")));

    return NextResponse.json({
      ok: true,
      window: { from: dateFrom.toISOString(), to: dateTo.toISOString(), label: "Last 30 days" },
      totals: {
        uniqueVisitors: metrics.totalVisitors,
        uniqueSessions: metrics.uniqueSessions,
        pageViews: metrics.pageViews,
        pricingClicks: snapshot.userBehavior.find((row) => row.label === "pricing_view")?.value || 0,
        checkoutClicks: metrics.checkouts,
        plannerStarts: metrics.plannerStarts,
        plannerCompletions: metrics.plannerCompletions,
        bookingClicks: metrics.bookingClicks,
        revenue: successfulPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0),
        revenueCurrency: currencies.length === 1 ? currencies[0] : currencies.length ? "MULTI" : "USD",
      },
      bySource: sourceRows
        .map((row) => ({ source: row.utmSource || "Direct", count: row._count._all }))
        .sort((a, b) => b.count - a.count),
      byCountry: snapshot.visitorsByCountry.map((row) => ({ country: row.label, count: Number(row.value) })),
      byPath: snapshot.topPages.map((row) => ({ path: row.label, count: Number(row.value) })),
      events,
    });
  } catch (error) {
    console.error("admin traffic error:", error);
    return NextResponse.json({ ok: false, code: "ANALYTICS_UNAVAILABLE" }, { status: 503 });
  }
}
