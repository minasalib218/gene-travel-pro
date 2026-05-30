import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const base = new URL(req.url);
  const res = NextResponse.redirect(new URL("/admin/login", base));
  res.cookies.set("admin_auth", "", { path: "/", maxAge: 0 });
  return res;
}
