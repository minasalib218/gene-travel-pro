import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin/requireAdmin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return NextResponse.json({ ok: false, code: admin.code }, { status: 403 });
    const tickets = await prisma.supportTicket.findMany({
      include: { profile: { select: { fullName: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json({ ok: true, tickets });
  } catch (error) {
    console.error("admin support error:", error);
    return NextResponse.json({ ok: true, tickets: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return NextResponse.json({ ok: false, code: admin.code }, { status: 403 });
    const body = await req.json().catch(() => ({}));
    const email = String(body?.email ?? "").trim();
    const message = String(body?.message ?? "").trim();
    if (!email || !message) return NextResponse.json({ ok: false, code: "INVALID_INPUT" }, { status: 400 });
    const ticket = await prisma.supportTicket.create({
      data: {
        userId: String(body?.userId ?? "").trim() || null,
        email,
        subject: String(body?.subject ?? "").trim() || null,
        message,
        status: String(body?.status ?? "OPEN").trim() || "OPEN",
        priority: String(body?.priority ?? "MEDIUM").trim() || "MEDIUM",
        adminNote: String(body?.adminNote ?? "").trim() || null,
      },
    });
    return NextResponse.json({ ok: true, ticket });
  } catch (error) {
    console.error("admin support create error:", error);
    return NextResponse.json({ ok: false, code: "SERVER_ERROR" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return NextResponse.json({ ok: false, code: admin.code }, { status: 403 });
    const body = await req.json().catch(() => ({}));
    const id = String(body?.id ?? "").trim();
    if (!id) return NextResponse.json({ ok: false, code: "ID_REQUIRED" }, { status: 400 });
    const ticket = await prisma.supportTicket.update({
      where: { id },
      data: {
        status: body?.status,
        priority: body?.priority,
        adminNote: body?.adminNote,
      },
    });
    return NextResponse.json({ ok: true, ticket });
  } catch (error) {
    console.error("admin support update error:", error);
    return NextResponse.json({ ok: false, code: "SERVER_ERROR" }, { status: 500 });
  }
}
