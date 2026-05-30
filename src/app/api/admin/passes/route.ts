import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { getPlanConfigs, setAdminSetting } from "@/lib/admin/settings";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return NextResponse.json({ ok: false, code: admin.code }, { status: 403 });

    const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
    const passes = await prisma.pass.findMany({
      where: q
        ? {
            OR: [
              { customerEmail: { contains: q, mode: "insensitive" } },
              { profile: { email: { contains: q, mode: "insensitive" } } },
            ],
          }
        : undefined,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { profile: { select: { email: true, fullName: true } } },
    });

    const planConfigs = await getPlanConfigs();
    return NextResponse.json({ ok: true, passes, planConfigs });
  } catch (error) {
    console.error("admin passes error:", error);
    return NextResponse.json({ ok: true, passes: [], planConfigs: null });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return NextResponse.json({ ok: false, code: admin.code }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action ?? "").trim();

    if (action === "SAVE_PLAN_CONFIGS") {
      const planConfigs = body?.planConfigs ?? {};
      await setAdminSetting("plan-configs", planConfigs);
      return NextResponse.json({ ok: true });
    }

    const passId = String(body?.passId ?? "").trim();
    if (!passId) return NextResponse.json({ ok: false, code: "PASS_ID_REQUIRED" }, { status: 400 });

    if (action === "EXPIRE_PASS") {
      const pass = await prisma.pass.update({
        where: { id: passId },
        data: { status: "EXPIRED" as any, expiresAt: new Date() },
      });
      return NextResponse.json({ ok: true, pass });
    }

    if (action === "REACTIVATE_PASS") {
      const days = Math.max(Number(body?.days ?? 30) || 30, 1);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + days);
      const pass = await prisma.pass.update({
        where: { id: passId },
        data: { status: "ACTIVE" as any, expiresAt },
      });
      return NextResponse.json({ ok: true, pass });
    }

    if (action === "ADD_EDIT_CREDITS") {
      const amount = Math.max(Number(body?.amount ?? 0) || 0, 0);
      if (amount < 1) return NextResponse.json({ ok: false, code: "INVALID_AMOUNT" }, { status: 400 });
      const current = await prisma.pass.findUnique({ where: { id: passId } });
      if (!current) return NextResponse.json({ ok: false, code: "NOT_FOUND" }, { status: 404 });
      const before = Math.max(current.editCreditsTotal - current.editCreditsUsed, 0);
      const pass = await prisma.pass.update({
        where: { id: passId },
        data: { editCreditsTotal: { increment: amount } },
      });
      await prisma.creditLedger.create({
        data: {
          userId: current.userId,
          customerEmail: current.customerEmail,
          passId: passId,
          type: "CREDIT_ADDED",
          actionType: "ADMIN_ADD_EDIT_CREDITS",
          creditType: "EDIT",
          amount,
          balanceBefore: before,
          balanceAfter: before + amount,
          reason: String(body?.reason ?? "Admin edit credit adjustment"),
          metadata: { adminUserId: admin.userId },
        },
      });
      return NextResponse.json({ ok: true, pass });
    }

    return NextResponse.json({ ok: false, code: "INVALID_ACTION" }, { status: 400 });
  } catch (error) {
    console.error("admin passes mutation error:", error);
    return NextResponse.json({ ok: false, code: "SERVER_ERROR" }, { status: 500 });
  }
}
