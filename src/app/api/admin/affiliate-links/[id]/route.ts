import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin/requireAdmin";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return NextResponse.json({ ok: false, code: admin.code }, { status: 403 });
    const body = await req.json().catch(() => ({}));
    const link = await prisma.affiliateLink.update({
      where: { id: params.id },
      data: {
        provider: body?.provider,
        category: body?.category,
        country: body?.country ?? null,
        city: body?.city ?? null,
        destination: body?.destination ?? null,
        label: body?.label ?? null,
        url: body?.url,
        trackingId: body?.trackingId ?? null,
        status: body?.status,
        notes: body?.notes ?? null,
      },
    });
    return NextResponse.json({ ok: true, link });
  } catch (error) {
    console.error("admin affiliate link update error:", error);
    return NextResponse.json({ ok: false, code: "SERVER_ERROR" }, { status: 500 });
  }
}
