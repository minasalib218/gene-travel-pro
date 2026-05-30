import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin/requireAdmin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return NextResponse.json({ ok: false, code: admin.code }, { status: 403 });

    const [events, successfulPayments] = await Promise.all([
      prisma.trafficEvent.findMany({ orderBy: { createdAt: "desc" }, take: 500 }),
      prisma.payment.findMany({ where: { status: "PAID" }, select: { amount: true, currency: true, userId: true } }),
    ]);

    const bySource = new Map<string, number>();
    const byCountry = new Map<string, number>();
    const byPath = new Map<string, number>();
    for (const event of events) {
      bySource.set(event.source || "Direct", (bySource.get(event.source || "Direct") || 0) + 1);
      byCountry.set(event.country || "Unknown", (byCountry.get(event.country || "Unknown") || 0) + 1);
      byPath.set(event.path || "/", (byPath.get(event.path || "/") || 0) + 1);
    }

    return NextResponse.json({
      ok: true,
      totals: {
        pageViews: events.filter((event) => event.eventType === "PAGE_VIEW").length,
        pricingClicks: events.filter((event) => event.eventType === "PRICING_CLICK").length,
        checkoutClicks: events.filter((event) => event.eventType === "CHECKOUT_CLICK").length,
        plannerStarts: events.filter((event) => event.eventType === "PLANNER_START").length,
        plannerCompletions: events.filter((event) => event.eventType === "PLANNER_COMPLETE").length,
        bookingClicks: events.filter((event) => event.eventType === "AFFILIATE_BOOKING_CLICK").length,
        revenue: successfulPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0),
      },
      bySource: Array.from(bySource.entries()).map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count),
      byCountry: Array.from(byCountry.entries()).map(([country, count]) => ({ country, count })).sort((a, b) => b.count - a.count),
      byPath: Array.from(byPath.entries()).map(([path, count]) => ({ path, count })).sort((a, b) => b.count - a.count),
      events,
    });
  } catch (error) {
    console.error("admin traffic error:", error);
    return NextResponse.json({ ok: true, totals: { pageViews: 0, pricingClicks: 0, checkoutClicks: 0, plannerStarts: 0, plannerCompletions: 0, bookingClicks: 0, revenue: 0 }, bySource: [], byCountry: [], byPath: [], events: [] });
  }
}
