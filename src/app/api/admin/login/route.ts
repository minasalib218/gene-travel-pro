import { NextResponse } from "next/server";
import { createRequestSupabaseClient } from "@/lib/admin/serverRouteClient";
import { fetchAdminProfile, isAdminRole } from "@/lib/admin/getAdminProfile";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const email = String(body?.email ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");
    if (!email || !password) {
      return NextResponse.json({ ok: false, code: "INVALID_CREDENTIALS" }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true, next: "/admin" });
    const supabase = createRequestSupabaseClient(req, res);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data?.user) {
      console.error("ADMIN_LOGIN_INVALID_CREDENTIALS", error?.message ?? "Missing user");
      return NextResponse.json({ ok: false, code: "INVALID_CREDENTIALS" }, { status: 401 });
    }

    const profile = await fetchAdminProfile(supabase, data.user.id);
    if (!profile || !isAdminRole(profile.role)) {
      await supabase.auth.signOut();
      return NextResponse.json({ ok: false, code: "NOT_ADMIN" }, { status: 403 });
    }

    res.cookies.set("admin_auth", "1", {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (error) {
    console.error("ADMIN_LOGIN_ERROR", error);
    return NextResponse.json({ ok: false, code: "SERVER_ERROR" }, { status: 500 });
  }
}
