import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { getBlockedUserIds } from "@/lib/admin/settings";
import { getPackageName } from "@/lib/credits/planRules";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return NextResponse.json({ ok: false, code: admin.code }, { status: 403 });

    const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
    const blockedUserIds = await getBlockedUserIds();
    const users = await prisma.profile.findMany({
      where: q
        ? {
            OR: [
              { email: { contains: q, mode: "insensitive" } },
              { fullName: { contains: q, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        passes: { orderBy: { createdAt: "desc" }, take: 1 },
        payments: { orderBy: { createdAt: "desc" }, take: 1 },
        plans: true,
      },
    });

    return NextResponse.json({
      ok: true,
      users: users.map((user) => {
        const pass = user.passes[0] ?? null;
        const payment = user.payments[0] ?? null;
        const mainRemaining = pass ? Math.max((pass.mainCreditsTotal || pass.tierActionsTotal) - (pass.mainCreditsUsed || pass.tierActionsUsed), 0) : 0;
        const editRemaining = pass ? Math.max(pass.editCreditsTotal - pass.editCreditsUsed, 0) : 0;
        return {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          createdAt: user.createdAt,
          lastActiveAt: user.updatedAt,
          plansCreated: user.plans.length,
          passStatus: pass?.status ?? "NONE",
          planType: pass ? getPackageName(pass.planType ?? pass.tier ?? "starter") : null,
          passExpiresAt: pass?.expiresAt ?? null,
          mainCreditsRemaining: mainRemaining,
          editCreditsRemaining: editRemaining,
          paymentStatus: payment?.status ?? "NONE",
          blocked: blockedUserIds.includes(user.id),
        };
      }),
    });
  } catch (error) {
    console.error("admin users error:", error);
    return NextResponse.json({ ok: true, users: [] });
  }
}
