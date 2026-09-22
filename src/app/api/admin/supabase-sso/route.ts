import { NextResponse } from "next/server";
import { isVerifiedAdmin } from "@/lib/admin/verified";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const next = url.searchParams.get("next") || "/ai/recommendation";

  if (!(await isVerifiedAdmin())) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  return NextResponse.redirect(new URL(next, req.url));
}
