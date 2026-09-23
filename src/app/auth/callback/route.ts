import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";
import { ensureUserProfile } from "@/lib/profile/ensureUserProfile";

function safeInternalPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return "/profile";
  }
  return value;
}

export async function GET(req: Request) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeInternalPath(requestUrl.searchParams.get("next"));
  const response = NextResponse.redirect(new URL(next, requestUrl.origin));
  const url = getSupabaseUrl();
  const publishableKey = getSupabaseAnonKey();

  if (!code || !url || !publishableKey) {
    return NextResponse.redirect(new URL("/signin?error=auth_callback_failed", requestUrl.origin));
  }

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        const cookieHeader = req.headers.get("cookie") || "";
        return cookieHeader.split(";").map((entry) => entry.trim()).filter(Boolean).map((entry) => {
          const separator = entry.indexOf("=");
          return {
            name: separator < 0 ? entry : entry.slice(0, separator),
            value: separator < 0 ? "" : decodeURIComponent(entry.slice(separator + 1)),
          };
        });
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    return NextResponse.redirect(new URL("/signin?error=auth_callback_failed", requestUrl.origin));
  }

  const profile = await ensureUserProfile(data.user, "SIGN_IN");
  if (!profile) {
    await supabase.auth.signOut().catch(() => undefined);
    response.headers.set("location", new URL("/signin?error=profile_unavailable", requestUrl.origin).toString());
    return response;
  }

  return response;
}
