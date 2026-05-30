import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { createRouteClient } from "@/lib/supabase/server";
import { PassStatus } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const token = String(body?.token ?? "").trim();

    if (!token) {
      return NextResponse.json({ ok: false, code: "MISSING_TOKEN" }, { status: 400 });
    }

    // ✅ Auth user
    const supabase = createRouteClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
      return NextResponse.json({ ok: false, code: "NOT_AUTHED" }, { status: 401 });
    }

    const userId = data.user.id;

    // ✅ Find token record
    const record = await prisma.activationToken.findUnique({
      where: { token },
    });

    if (!record) {
      return NextResponse.json({ ok: false, code: "INVALID_TOKEN" }, { status: 404 });
    }

    if (record.usedAt) {
      return NextResponse.json({ ok: false, code: "TOKEN_USED" }, { status: 409 });
    }

    // ✅ Ensure profile exists
    await prisma.profile.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId },
    });

    // ✅ Create pass with ONLY fields that exist in your schema
    const pass = await prisma.pass.create({
      data: {
        userId,
        tier: record.passTier,          // must exist on ActivationToken
        status: PassStatus.ACTIVE,      // enum
        tierActionsTotal: 3,
 // if you DON'T have actionsTotal, see note below
        tierActionsUsed: 0,
        startsAt: new Date(),
        expiresAt: null, // if you DON'T have expiresAt, see note below
      },
    });

    // ✅ Mark token used (ONLY usedAt)
    await prisma.activationToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });

    return NextResponse.json({ ok: true, claimed: true, passId: pass.id, pass }, { status: 200 });
  } catch (e: any) {
    console.error("passes/claim error:", e);
    return NextResponse.json(
      { ok: false, code: "INTERNAL_ERROR", message: e?.message ?? "Claim error" },
      { status: 500 }
    );
  }
}
