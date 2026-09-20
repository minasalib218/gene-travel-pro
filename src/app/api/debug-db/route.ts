import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { getPrismaDatabaseUrl } from "@/lib/env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("Not found", { status: 404 });
  }

  const admin = await requireAdmin();
  if (!admin.ok) return new NextResponse("Not found", { status: 404 });

  return NextResponse.json({ ok: true, configured: Boolean(getPrismaDatabaseUrl()) });
}
