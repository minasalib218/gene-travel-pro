import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(email.trim());
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ ok: false, error: "Enter a valid email address." }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({ ok: false, error: "Password is required." }, { status: 400 });
    }

    const cookieHeader = req.headers.get("cookie") ?? "";
    const res = NextResponse.json({ ok: true });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 401 });
    }

    return res;
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Server error" }, { status: 500 });
  }
}
