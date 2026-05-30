import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { prisma } from "@/lib/prisma";

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

    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        birth_date: birthDate,
        phone,
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
      await prisma.profile.upsert({
        where: { id: userId },
        update: {
          email,
          fullName,
        },
        create: {
          id: userId,
          email,
          fullName,
        },
      });

      await prisma.$transaction([
        prisma.customerEvent.updateMany({
          where: {
            email,
            userId: null,
          },
          data: { userId },
        }),
        prisma.payment.updateMany({
          where: {
            customerEmail: email,
            userId: null,
          },
          data: { userId },
        }),
        prisma.pass.updateMany({
          where: {
            customerEmail: email,
            userId: null,
          },
          data: {
            userId,
            profileId: userId,
          },
        }),
        prisma.creditLedger.updateMany({
          where: {
            customerEmail: email,
            userId: null,
          },
          data: { userId },
        }),
        prisma.emailLog.updateMany({
          where: {
            customerEmail: email,
            userId: null,
          },
          data: { userId },
        }),
      ]);
    } catch (profileErr: any) {
      console.error("signup profile sync warning:", profileErr?.message || profileErr);
    }

    return NextResponse.json({ ok: true, userId }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 },
    );
  }
}
