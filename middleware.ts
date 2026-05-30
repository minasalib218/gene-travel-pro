import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  let res = NextResponse.next();
  const pathname = req.nextUrl.pathname;
  const entry = req.nextUrl.searchParams.get("entry");

  // ✅ Always allow admin login page
  const isEnvAdmin = req.cookies.get("admin_auth")?.value === "1";

  if (pathname.startsWith("/admin/login")) {
    if (isEnvAdmin || entry === "admin") return res;

    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // ✅ Protect /admin with ENV cookie
  if (pathname.startsWith("/admin")) {
    if (!isEnvAdmin) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("entry", "admin");
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return res;
  }

  // ✅ Allow admin cookie to open AI pages without Supabase
  const protectedPrefixes = ["/ai", "/ai-planner", "/planner", "/editor", "/plan-summary", "/profile"];
  const needsAuth = protectedPrefixes.some((p) => pathname.startsWith(p));

  if (!needsAuth) return res;
  if (isEnvAdmin) return res;

  // ✅ Customers require Supabase auth
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
    }
  );

  const { data } = await supabase.auth.getUser();
  const user = data?.user;

  if (!user) {
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

    // ✅ added admin dashboard sub-pages
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
    "/profile/:path*",
  ],
};
