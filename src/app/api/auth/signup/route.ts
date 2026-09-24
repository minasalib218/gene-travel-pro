import { NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { ensureUserProfile } from "@/lib/profile/ensureUserProfile";
import { mergeGuestDataIntoUser, readGuestIdentityFromCookieHeader } from "@/lib/profile/guestMerge";

function cleanPhone(phone: string) {
  return phone.replace(/\s+/g, "");
}

function isValidPhone(phone: string) {
  return /^[+]?\d{8,15}$/.test(phone);
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(email);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const fullName = String(body.fullName ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const phoneRaw = String(body.phone ?? "").trim();
    const birthDate = String(body.birthDate ?? "").trim();
    const password = String(body.password ?? "");
    const confirm = String(body.confirm ?? "");

    const phone = cleanPhone(phoneRaw);

    if (!fullName || fullName.length < 3) {
      return NextResponse.json({ error: "Full name is required." }, { status: 400 });
    }

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "Use a valid email address." }, { status: 400 });
    }

    if (!phone || !isValidPhone(phone)) {
      return NextResponse.json({ error: "Invalid phone number." }, { status: 400 });
    }

    if (!birthDate) {
      return NextResponse.json({ error: "Birth date is required." }, { status: 400 });
    }

    if (!password || password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    if (password !== confirm) {
      return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
    }

    // Public signup must prove ownership of the email before it can claim
    // purchases or credits associated with that address.
    const supabase = createRouteClient();
    const { data: created, error: createErr } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, birth_date: birthDate, phone },
      },
    });

    if (createErr || !created?.user) {
      return NextResponse.json(
        { error: createErr?.message || "Failed to create user." },
        { status: 400 },
      );
    }

    const userId = created.user.id;

    try {
      await ensureUserProfile(created.user, "PROFILE_CREATED");
      await mergeGuestDataIntoUser({
        userId,
        ...readGuestIdentityFromCookieHeader(req.headers.get("cookie")),
        source: "signup",
      });

      // Purchases are linked only after verified email ownership in a
      // separate, transaction-backed claim flow. Do not match by raw signup input.
    } catch (profileErr: any) {
      console.error("signup profile sync warning:", profileErr?.message || profileErr);
    }

    return NextResponse.json({ ok: true, verificationRequired: !created.session }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 },
    );
  }
}
