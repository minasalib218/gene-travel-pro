import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin/requireAdmin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return NextResponse.json({ ok: false, code: admin.code }, { status: 403 });
    const body = await req.json().catch(() => ({}));
    const id = String(body?.id ?? "").trim();
    if (!id) return NextResponse.json({ ok: false, code: "ID_REQUIRED" }, { status: 400 });
    const errorLog = await prisma.errorLog.update({
      where: { id },
      data: { status: "RESOLVED", resolvedAt: new Date() },
    });
    return NextResponse.json({ ok: true, errorLog });
  } catch (error) {
    console.error("admin error resolve error:", error);
    return NextResponse.json({ ok: false, code: "SERVER_ERROR" }, { status: 500 });
  }
}
