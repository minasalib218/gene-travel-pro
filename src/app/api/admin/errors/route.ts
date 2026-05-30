import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin/requireAdmin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return NextResponse.json({ ok: false, code: admin.code }, { status: 403 });

    const [errors, failedEmails, webhookErrors, aiFailures] = await Promise.all([
      prisma.errorLog.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
      prisma.emailLog.findMany({ where: { status: "FAILED" }, orderBy: { createdAt: "desc" }, take: 50 }),
      prisma.webhookEvent.findMany({ where: { OR: [{ processed: false }, { errorMessage: { not: null } }] }, orderBy: { createdAt: "desc" }, take: 50 }),
      prisma.aiUsageLog.findMany({ where: { status: { not: "SUCCESS" } }, orderBy: { createdAt: "desc" }, take: 50 }),
    ]);

    return NextResponse.json({ ok: true, errors, failedEmails, webhookErrors, aiFailures });
  } catch (error) {
    console.error("admin errors route error:", error);
    return NextResponse.json({ ok: true, errors: [], failedEmails: [], webhookErrors: [], aiFailures: [] });
  }
}
