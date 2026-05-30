import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin/requireAdmin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return NextResponse.json({ ok: false, code: admin.code }, { status: 403 });

    const [links, events] = await Promise.all([
      prisma.affiliateLink.findMany({ orderBy: { updatedAt: "desc" } }),
      prisma.trafficEvent.findMany({
        where: { eventType: "AFFILIATE_BOOKING_CLICK" },
        select: { source: true, metadata: true },
      }),
    ]);

    const clickCounts = new Map<string, number>();
    for (const event of events) {
      const linkId = typeof (event.metadata as any)?.affiliateLinkId === "string" ? (event.metadata as any).affiliateLinkId : null;
      if (linkId) clickCounts.set(linkId, (clickCounts.get(linkId) || 0) + 1);
    }

    return NextResponse.json({
      ok: true,
      links: links.map((link) => ({
        ...link,
        internalRedirectUrl: `/api/affiliate/redirect?id=${link.id}`,
        clickCount: clickCounts.get(link.id) || 0,
        conversionCount: 0,
        estimatedCommission: 0,
      })),
    });
  } catch (error) {
    console.error("admin affiliate links error:", error);
    return NextResponse.json({ ok: true, links: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return NextResponse.json({ ok: false, code: admin.code }, { status: 403 });
    const body = await req.json().catch(() => ({}));
    const provider = String(body?.provider ?? "").trim();
    const category = String(body?.category ?? "").trim();
    const url = String(body?.url ?? "").trim();
    if (!provider || !category || !url) {
      return NextResponse.json({ ok: false, code: "INVALID_INPUT" }, { status: 400 });
    }

    const link = await prisma.affiliateLink.create({
      data: {
        provider,
        category,
        country: String(body?.country ?? "").trim() || null,
        city: String(body?.city ?? "").trim() || null,
        destination: String(body?.destination ?? "").trim() || null,
        label: String(body?.label ?? "").trim() || null,
        url,
        trackingId: String(body?.trackingId ?? "").trim() || null,
        status: String(body?.status ?? "ACTIVE").trim() || "ACTIVE",
        notes: String(body?.notes ?? "").trim() || null,
      },
    });

    return NextResponse.json({ ok: true, link });
  } catch (error) {
    console.error("admin affiliate link create error:", error);
    return NextResponse.json({ ok: false, code: "SERVER_ERROR" }, { status: 500 });
  }
}
