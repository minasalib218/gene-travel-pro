import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";
import { ensureUserProfile } from "@/lib/profile/ensureUserProfile";

const AUTH_RETURN_PATH_COOKIE = "gene_auth_return_path";

function safeInternalPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return "/profile";
  }
  return value;
}

function preventAuthCaching(response: NextResponse) {
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

function authErrorRedirect(origin: string, error = "auth_callback_failed") {
  return preventAuthCaching(NextResponse.redirect(new URL(`/signin?error=${error}`, origin)));
}

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeInternalPath(
    req.cookies.get(AUTH_RETURN_PATH_COOKIE)?.value ?? requestUrl.searchParams.get("next"),
  );
  const completeUrl = new URL("/auth/complete", requestUrl.origin);
  completeUrl.searchParams.set("next", next);
  const response = preventAuthCaching(NextResponse.redirect(completeUrl));
  response.cookies.set(AUTH_RETURN_PATH_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  const url = getSupabaseUrl();
  const publishableKey = getSupabaseAnonKey();

  if (!code || !url || !publishableKey) {
    return authErrorRedirect(requestUrl.origin);
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
    console.error("[GOOGLE_AUTH_CALLBACK_FAILED]", error?.message || "Missing authenticated user");
    return authErrorRedirect(requestUrl.origin);
  }

  try {
    const profile = await ensureUserProfile(data.user, "SIGN_IN");
    if (profile) return response;

    await supabase.auth.signOut().catch(() => undefined);
    response.headers.set("location", new URL("/signin?error=profile_unavailable", requestUrl.origin).toString());
    return response;
  } catch (profileError) {
    console.error("[GOOGLE_PROFILE_SETUP_FAILED]", profileError);
    await supabase.auth.signOut().catch(() => undefined);
    response.headers.set("location", new URL("/signin?error=profile_unavailable", requestUrl.origin).toString());
    return response;
  }
}
