import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { withExistingTable } from "@/lib/prisma-safe";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return NextResponse.json({ ok: false, code: admin.code }, { status: 403 });

    const actionType = req.nextUrl.searchParams.get("actionType")?.trim() || undefined;
    const logs = await withExistingTable(
      "ai_usage_logs",
      () =>
        prisma.aiUsageLog.findMany({
          where: actionType ? { actionType } : undefined,
          include: {
            profile: { select: { email: true, fullName: true } },
            pass: { select: { planType: true, tier: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 200,
        }),
      [],
    );

    const blockedRequests = await withExistingTable("rate_limit_logs", () => prisma.rateLimitLog.count(), 0);
    const totalRequests = logs.length;
    const failedRequests = logs.filter((log) => log.status !== "SUCCESS").length;
    const estimatedCost = logs.reduce((sum, log) => sum + (log.estimatedCost || 0), 0);
    const totalTokens = logs.reduce((sum, log) => sum + (log.totalTokens || 0), 0);

    return NextResponse.json({
      ok: true,
      totals: {
        totalRequests,
        failedRequests,
        estimatedCost,
        averageInputTokens: totalRequests ? Math.round(logs.reduce((sum, log) => sum + (log.inputTokens || 0), 0) / totalRequests) : 0,
        averageOutputTokens: totalRequests ? Math.round(logs.reduce((sum, log) => sum + (log.outputTokens || 0), 0) / totalRequests) : 0,
        totalTokens,
        blockedRequests,
      },
      logs,
    });
  } catch (error) {
    console.error("admin ai-monitoring error:", error);
    return NextResponse.json({ ok: true, totals: { totalRequests: 0, failedRequests: 0, estimatedCost: 0, averageInputTokens: 0, averageOutputTokens: 0, totalTokens: 0, blockedRequests: 0 }, logs: [] });
  }
}
