import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/requireAdmin";

export async function GET(req: Request) {
  const admin = await requireAdmin();

  if (!admin.ok) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  return NextResponse.redirect(new URL("/ai-planner", req.url));
}
