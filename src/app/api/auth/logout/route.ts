import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";
import { recordUserActivity } from "@/lib/customer-activity";

async function logout(req: Request) {
  const base = new URL(req.url);
  const res = NextResponse.redirect(new URL("/signin", base));
  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = getSupabaseAnonKey();

  if (!supabaseUrl || !supabaseAnonKey) return res;

  const cookieHeader = req.headers.get("cookie") ?? "";
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieHeader
          .split(";")
          .map((cookie) => cookie.trim())
          .filter(Boolean)
          .map((cookie) => {
            const idx = cookie.indexOf("=");
            return {
              name: idx === -1 ? cookie : cookie.slice(0, idx),
              value: idx === -1 ? "" : decodeURIComponent(cookie.slice(idx + 1)),
            };
          });
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          res.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
  if (data.user) {
    await recordUserActivity({
      userId: data.user.id,
      event: "SIGN_OUT",
      entityType: "PROFILE",
      entityId: data.user.id,
    }).catch(() => undefined);
  }
  await supabase.auth.signOut().catch(() => null);
  res.cookies.set("admin_auth", "", {
    path: "/",
    maxAge: 0,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  });
  return res;
}

export async function GET(req: Request) {
  return logout(req);
}

export async function POST(req: Request) {
  return logout(req);
}
