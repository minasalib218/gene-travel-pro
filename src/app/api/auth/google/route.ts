import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";

function safeInternalPath(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\") ? value : "/profile";
}

export async function GET(req: Request) {
  const requestUrl = new URL(req.url);
  const next = safeInternalPath(requestUrl.searchParams.get("next"));
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();

  if (!url || !key) {
    return NextResponse.redirect(new URL("/signin?error=auth_callback_failed", requestUrl.origin));
  }

  let response = NextResponse.redirect(new URL("/signin?error=auth_callback_failed", requestUrl.origin));
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        const cookieHeader = req.headers.get("cookie") || "";
        return cookieHeader.split(";").map((entry) => entry.trim()).filter(Boolean).map((entry) => {
          const separator = entry.indexOf("=");
          return { name: separator < 0 ? entry : entry.slice(0, separator), value: separator < 0 ? "" : decodeURIComponent(entry.slice(separator + 1)) };
        });
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const callback = new URL("/auth/callback", requestUrl.origin);
  callback.searchParams.set("next", next);
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callback.toString() },
  });

  if (error || !data.url) return response;
  const cookies = response.cookies.getAll();
  response = NextResponse.redirect(data.url);
  cookies.forEach((cookie) => response.cookies.set(cookie));
  return response;
}
