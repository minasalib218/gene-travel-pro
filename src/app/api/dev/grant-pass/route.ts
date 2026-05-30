import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { createRouteClient } from "@/lib/supabase/server";
import { PassStatus } from "@prisma/client";

function configForTier(tier: string) {
  if (tier === "basic")
    return { editDays: 3, tierActionsTotal: 3 };

  if (tier === "pro")
    return { editDays: 6, tierActionsTotal: 5 };

  if (tier === "agency")
    return { editDays: 14, tierActionsTotal: 8 };

  return null;
}

export async function GET(req: Request) {
  try {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { ok: false, code: "DISABLED_IN_PROD" },
        { status: 403 }
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

    const url = new URL(req.url);
    const tier = url.searchParams.get("tier") ?? "basic";

    const cfg = configForTier(tier);
    if (!cfg) {
      return NextResponse.json(
        { ok: false, code: "INVALID_TIER" },
        { status: 400 }
      );
    }

    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + cfg.editDays * 24 * 60 * 60 * 1000
    );

    const pass = await prisma.pass.create({
      data: {
        userId: data.user.id,
        tier,
        status: PassStatus.ACTIVE,

        tierActionsTotal: cfg.tierActionsTotal,
        tierActionsUsed: 0,

        startsAt: now,
        expiresAt,
      },
    });

    return NextResponse.json({ ok: true, pass });
  } catch (e: any) {
    console.error("grant-pass error:", e);
    return NextResponse.json(
      {
        ok: false,
        code: "INTERNAL_ERROR",
        message: e?.message ?? String(e),
      },
      { status: 500 }
    );
  }
}
