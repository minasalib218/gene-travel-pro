import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { getSupabaseStorageUsage } from "@/lib/supabase/storage-usage";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  const code = typeof (admin as any)?.code === "string" ? (admin as any).code : "FORBIDDEN";
  if (!admin.ok) return NextResponse.json({ ok: false, code }, { status: 403 });

  try {
    const usage = await getSupabaseStorageUsage();
    return NextResponse.json({ ok: true, usage });
  } catch (error) {
    console.error("[SUPABASE_STORAGE_USAGE_FAILED]", error);
    return NextResponse.json({ ok: false, code: "STORAGE_USAGE_UNAVAILABLE" }, { status: 500 });
  }
}
