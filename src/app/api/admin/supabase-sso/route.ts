import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const next = url.searchParams.get("next") || "/ai/recommendation";

  // ✅ Only allow if ENV-admin cookie exists
  const cookieHeader = req.headers.get("cookie") ?? "";
  const isEnvAdmin = cookieHeader.includes("admin_auth=1");
  if (!isEnvAdmin) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  const email = process.env.SUPABASE_ADMIN_EMAIL;
  const password = process.env.SUPABASE_ADMIN_PASSWORD;

  if (!email || !password) {
    return NextResponse.json(
      { ok: false, code: "MISSING_SUPABASE_ADMIN_ENV" },
      { status: 500 }
    );
  }

  // ✅ IMPORTANT: create a response and let Supabase write cookies to it
  const res = NextResponse.redirect(new URL(next, req.url));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // parse incoming cookies (simple parse is enough here)
        getAll() {
          return cookieHeader
            .split(";")
            .map((c) => c.trim())
            .filter(Boolean)
            .map((c) => {
              const idx = c.indexOf("=");
              return {
                name: idx === -1 ? c : c.slice(0, idx),
                value: idx === -1 ? "" : decodeURIComponent(c.slice(idx + 1)),
              };
            });
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return NextResponse.json(
      { ok: false, code: "SUPABASE_SSO_FAILED", message: error.message },
      { status: 401 }
    );
  }

  return res;
}