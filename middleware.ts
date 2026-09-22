import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";

async function getAuthState(req: NextRequest, res: NextResponse, includeAdminRole = false) {
  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = getSupabaseAnonKey();

  if (!supabaseUrl || !supabaseAnonKey) {
    return { configured: false as const, user: null, isAdmin: false };
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          res.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data, error } = await supabase.auth.getUser();
  const user = error ? null : data?.user ?? null;

  if (!user) {
    return { configured: true as const, user: null, isAdmin: false };
  }

  const profile = includeAdminRole
    ? (await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()).data
    : null;

  return {
    configured: true as const,
    user,
    isAdmin: String(profile?.role ?? "").trim().toUpperCase() === "ADMIN",
  };
}

function redirectWithCookies(req: NextRequest, cookieSource: NextResponse, pathname: string) {
  const url = req.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  const redirect = NextResponse.redirect(url);

  cookieSource.cookies.getAll().forEach((cookie) => {
    redirect.cookies.set(cookie);
  });

  return redirect;
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const pathname = req.nextUrl.pathname;
  const pathWithSearch = `${pathname}${req.nextUrl.search}`;
  const entry = req.nextUrl.searchParams.get("entry");
  const isAdminRoute = pathname.startsWith("/admin");
  const protectedPrefixes = ["/ai", "/ai-planner", "/planner", "/editor", "/plan-summary", "/profile"];
  const needsUserAuth = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
  const isSignInRoute = pathname === "/signin" || pathname.startsWith("/signin/");

  if (!isAdminRoute && !needsUserAuth && !isSignInRoute) return res;

  const auth = await getAuthState(req, res, isAdminRoute);

  if (isSignInRoute && auth.user) {
    return redirectWithCookies(req, res, "/profile");
  }

  if (pathname.startsWith("/admin/login")) {
    if (auth.isAdmin || entry === "admin") return res;

    return redirectWithCookies(req, res, "/");
  }

  if (isAdminRoute) {
    if (auth.isAdmin) return res;

    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("entry", "admin");
    url.searchParams.set("next", pathWithSearch);
    const redirect = NextResponse.redirect(url);
    res.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  if (!needsUserAuth) return res;

  if (auth.isAdmin) return res;

  if (!auth.configured || !auth.user) {
    const url = req.nextUrl.clone();
    url.pathname = "/signin";
    url.searchParams.set("next", pathWithSearch);
    const redirect = NextResponse.redirect(url);
    res.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|map|txt|xml|woff|woff2)$).*)",
  ],
};
