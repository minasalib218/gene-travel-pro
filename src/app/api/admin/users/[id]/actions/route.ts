import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { getBlockedUserIds, setBlockedUserIds } from "@/lib/admin/settings";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) {
      return NextResponse.json({ ok: false, code: admin.code }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action ?? "").trim().toUpperCase();
    const amount = Math.max(Number(body?.amount ?? 0) || 0, 0);
    const days = Math.max(Number(body?.days ?? 0) || 0, 0);
    const reason = String(body?.reason ?? "").trim() || "Admin adjustment";

    const profile = await prisma.profile.findUnique({ where: { id: params.id } });
    if (!profile) {
      return NextResponse.json({ ok: false, code: "NOT_FOUND" }, { status: 404 });
    }

    if (action === "BLOCK" || action === "UNBLOCK") {
      const blocked = new Set(await getBlockedUserIds());
      if (action === "BLOCK") blocked.add(params.id);
      if (action === "UNBLOCK") blocked.delete(params.id);
      await setBlockedUserIds(Array.from(blocked));
      return NextResponse.json({ ok: true });
    }

    const pass = await prisma.pass.findFirst({
      where: { userId: params.id },
      orderBy: [{ expiresAt: "desc" }, { createdAt: "desc" }],
    });

    if (!pass) {
      return NextResponse.json({ ok: false, code: "NO_PASS" }, { status: 400 });
    }

    if (action === "ADD_CREDITS") {
      if (amount < 1) {
        return NextResponse.json({ ok: false, code: "INVALID_AMOUNT" }, { status: 400 });
      }

      const updated = await prisma.pass.update({
        where: { id: pass.id },
        data: {
          mainCreditsTotal: { increment: amount },
          tierActionsTotal: { increment: amount },
        },
      });

      const before = Math.max((pass.mainCreditsTotal || pass.tierActionsTotal) - (pass.mainCreditsUsed || pass.tierActionsUsed), 0);
      await prisma.creditLedger.create({
        data: {
          userId: params.id,
          customerEmail: pass.customerEmail ?? profile.email ?? null,
          passId: pass.id,
          type: "CREDIT_ADDED",
          actionType: "ADMIN_ADD_CREDITS",
          creditType: "MAIN",
          amount,
          balanceBefore: before,
          balanceAfter: before + amount,
          reason,
          metadata: {
            adminUserId: admin.userId,
          },
        },
      });

      return NextResponse.json({ ok: true, pass: updated });
    }

    if (action === "EXTEND_PASS") {
      if (days < 1) {
        return NextResponse.json({ ok: false, code: "INVALID_DAYS" }, { status: 400 });
      }

      const baseDate = pass.expiresAt && pass.expiresAt > new Date() ? pass.expiresAt : new Date();
      const nextExpiry = new Date(baseDate);
      nextExpiry.setDate(nextExpiry.getDate() + days);

      const updated = await prisma.pass.update({
        where: { id: pass.id },
        data: { expiresAt: nextExpiry, status: "ACTIVE" as any },
      });

      await prisma.creditLedger.create({
        data: {
          userId: params.id,
          customerEmail: pass.customerEmail ?? profile.email ?? null,
          passId: pass.id,
          type: "CREDIT_ADDED",
          actionType: "ADMIN_EXTEND_PASS",
          creditType: "MAIN",
          amount: 0,
          reason,
          metadata: {
            adminUserId: admin.userId,
            days,
            previousExpiresAt: pass.expiresAt?.toISOString() ?? null,
            nextExpiresAt: nextExpiry.toISOString(),
          },
        },
      });

      return NextResponse.json({ ok: true, pass: updated });
    }

    return NextResponse.json({ ok: false, code: "INVALID_ACTION" }, { status: 400 });
  } catch (error) {
    console.error("admin user action error:", error);
    return NextResponse.json({ ok: false, code: "SERVER_ERROR" }, { status: 500 });
  }
}
