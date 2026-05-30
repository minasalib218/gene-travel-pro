import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { withExistingTable } from "@/lib/prisma-safe";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return NextResponse.json({ ok: false, code: admin.code }, { status: 403 });

    const status = req.nextUrl.searchParams.get("status")?.trim();
    const payments = await withExistingTable(
      "payments",
      () =>
        prisma.payment.findMany({
          where: status ? { status } : undefined,
          orderBy: { createdAt: "desc" },
          take: 200,
          include: { pass: true },
        }),
      [],
    );

    const eventKeys = payments.flatMap((payment) =>
      [payment.providerOrderId, payment.providerPaymentId, payment.providerCheckoutId].filter(Boolean) as string[],
    );
    const webhookEvents = eventKeys.length
      ? await withExistingTable(
          "webhook_events",
          () =>
            prisma.webhookEvent.findMany({
              where: {
                OR: eventKeys.map((key) => ({ payload: { path: [], string_contains: key } as any })),
              },
              take: 500,
              orderBy: { createdAt: "desc" },
            }),
          [],
        )
      : [];

    return NextResponse.json({
      ok: true,
      payments,
      webhookEvents,
    });
  } catch (error) {
    console.error("admin payments error:", error);
    return NextResponse.json({ ok: true, payments: [], webhookEvents: [] });
  }
}
