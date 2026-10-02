import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { createRouteClient } from "@/lib/supabase/server";
import { PassStatus } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const token = String(body?.token || "").trim();

    if (!token) {
      return NextResponse.json(
        { ok: false, code: "MISSING_TOKEN" },
        { status: 400 }
      );
    }

    const supabase = createRouteClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
      return NextResponse.json(
        { ok: false, code: "NOT_AUTHED" },
        { status: 401 }
      );
    }

    const user = data.user;

    const record = await prisma.activationToken.findUnique({
      where: { token },
    });

    if (!record) {
      return NextResponse.json(
        { ok: false, code: "INVALID_TOKEN" },
        { status: 404 }
      );
    }

    if (record.usedAt) {
      return NextResponse.json(
        { ok: false, code: "TOKEN_USED" },
        { status: 409 }
      );
    }

    // Claim and pass creation must commit together. The conditional update
    // allows only one concurrent request to claim this token.
    const pass = await prisma.$transaction(async (tx) => {
      const claimed = await tx.activationToken.updateMany({
        where: { id: record.id, usedAt: null, used: false },
        data: { usedAt: new Date(), used: true },
      });
      if (claimed.count !== 1) return null;

      await tx.profile.upsert({
        where: { id: user.id },
        update: {},
        create: { id: user.id },
      });

      return tx.pass.create({
        data: {
          userId: user.id,
          tier: record.passTier,
          status: PassStatus.ACTIVE,
          tierActionsTotal: 3,
          tierActionsUsed: 0,
          startsAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
    });

    if (!pass) return NextResponse.json({ ok: false, code: "TOKEN_USED" }, { status: 409 });
    return NextResponse.json({ ok: true, pass });
  } catch (error) {
    console.error("Consume activation error:", error);
    return NextResponse.json(
      { ok: false, code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
