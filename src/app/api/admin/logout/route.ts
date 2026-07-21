import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";

export async function POST(req: Request) {
  const base = new URL(req.url);
  const res = NextResponse.redirect(new URL("/admin/login", base));

  const cookieHeader = req.headers.get("cookie") ?? "";
  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = getSupabaseAnonKey();
  if (!supabaseUrl || !supabaseAnonKey) {
    res.cookies.set("admin_auth", "", { path: "/", maxAge: 0, sameSite: "strict", secure: process.env.NODE_ENV === "production", httpOnly: true });
    return res;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
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
    },
  );

  await supabase.auth.signOut().catch(() => null);
  res.cookies.set("admin_auth", "", { path: "/", maxAge: 0, sameSite: "strict", secure: process.env.NODE_ENV === "production", httpOnly: true });
  return res;
}
