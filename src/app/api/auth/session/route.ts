import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { prisma } from "@/lib/db/client";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";

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

    const supabaseUrl = getSupabaseUrl();
    const supabaseAnonKey = getSupabaseAnonKey();
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ ok: false, error: "Supabase auth is not configured." }, { status: 500 });
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

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      return NextResponse.json(
        { ok: false, error: error?.message || "Invalid email or password." },
        { status: 401 },
      );
    }

    const fullName =
      (data.user.user_metadata as any)?.full_name ||
      (data.user.user_metadata as any)?.name ||
      email.split("@")[0] ||
      "Traveler";

    try {
      await prisma.profile.upsert({
        where: { id: data.user.id },
        update: {
          email,
          fullName,
          avatarUrl: (data.user.user_metadata as any)?.avatar_url ?? null,
        },
        create: {
          id: data.user.id,
          email,
          fullName,
          avatarUrl: (data.user.user_metadata as any)?.avatar_url ?? null,
        },
      });

      await prisma.$transaction([
        prisma.customerEvent.updateMany({
          where: { email, userId: null },
          data: { userId: data.user.id },
        }),
        prisma.payment.updateMany({
          where: { customerEmail: email, userId: null },
          data: { userId: data.user.id },
        }),
        prisma.pass.updateMany({
          where: { customerEmail: email, userId: null },
          data: {
            userId: data.user.id,
            profileId: data.user.id,
          },
        }),
        prisma.creditLedger.updateMany({
          where: { customerEmail: email, userId: null },
          data: { userId: data.user.id },
        }),
        prisma.emailLog.updateMany({
          where: { customerEmail: email, userId: null },
          data: { userId: data.user.id },
        }),
      ]);
    } catch (profileError) {
      console.error("customer session profile sync warning:", profileError);
    }

    return res;
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Server error" }, { status: 500 });
  }
}
