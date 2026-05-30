import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    return NextResponse.json({ ok: false, code: "ADMIN_ENV_MISSING" }, { status: 500 });
  }

  if (email !== adminEmail || password !== adminPassword) {
    return NextResponse.json({ ok: false, code: "INVALID_CREDENTIALS" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true, next: "/admin" });
  res.cookies.set("admin_auth", "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return res;
}
