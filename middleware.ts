import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";

async function getAuthState(req: NextRequest, res: NextResponse) {
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  return {
    configured: true as const,
    user,
    isAdmin: String(profile?.role ?? "").trim().toUpperCase() === "ADMIN",
  };
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const pathname = req.nextUrl.pathname;
  const entry = req.nextUrl.searchParams.get("entry");
  const isAdminRoute = pathname.startsWith("/admin");
  const protectedPrefixes = ["/ai", "/ai-planner", "/planner", "/editor", "/plan-summary", "/profile"];
  const needsUserAuth = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (!isAdminRoute && !needsUserAuth) {
    return res;
  }

  const auth = await getAuthState(req, res);

  if (pathname.startsWith("/admin/login")) {
    if (auth.isAdmin || entry === "admin") return res;

    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (isAdminRoute) {
    if (auth.isAdmin) return res;

    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("entry", "admin");
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (auth.isAdmin) return res;

  if (!auth.configured || !auth.user) {
    const url = req.nextUrl.clone();
    url.pathname = "/signin";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/admin/customers/:path*",
    "/admin/analytics/:path*",
    "/admin/accounting/:path*",
    "/admin/ready-plans/:path*",
    "/admin/account/:path*",
    "/ai/:path*",
    "/ai-planner/:path*",
    "/planner/:path*",
    "/editor/:path*",
    "/plan-summary/:path*",
    "/profile",
    "/profile/:path*",
  ],
};
