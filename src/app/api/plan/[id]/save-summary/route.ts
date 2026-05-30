import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client"; // keep your real prisma import path
import { createRouteClient } from "@/lib/supabase/server";

// If you have enum in Prisma like `enum SavedItemKind { PLAN ... }`
// then this import will work. If not, remove it and use the string fallback below.
// import { SavedItemKind } from "@prisma/client";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const planId = params.id;

    // 🔐 auth
    const supabase = createRouteClient();
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      return NextResponse.json({ ok: false, code: "AUTH_ERROR", message: error.message }, { status: 401 });
    }
    if (!data?.user) {
      return NextResponse.json({ ok: false, code: "NOT_AUTHED" }, { status: 401 });
    }

    const userId = data.user.id;

    // ✅ load plan
    const plan = await prisma.plan.findFirst({
      where: { id: planId, userId },
      select: {
        id: true,
        title: true,
        destination: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        summaryJson: true,
      },
    });

    if (!plan) {
      return NextResponse.json({ ok: false, code: "PLAN_NOT_FOUND" }, { status: 404 });
    }

    // ✅ Save summary as SavedItem
    // IMPORTANT:
    // - kind is REQUIRED (this fixes your TS error)
    // - meta must be JSON (convert Date -> ISO string)
    const saved = await prisma.savedItem.create({
      data: {
        userId,
        kind: "PLAN", // ✅ REQUIRED. If your schema expects lowercase, change to "plan".
        // If you have enum SavedItemKind, use this instead:
        // kind: SavedItemKind.PLAN,

        refId: plan.id,
        meta: {
          type: "plan",
          title: plan.title,
          destination: plan.destination,
          startDate: plan.startDate.toISOString(),
          endDate: plan.endDate.toISOString(),
          createdAt: plan.createdAt.toISOString(),
          summary: plan.summaryJson ?? null,
        },
      },
    });

    return NextResponse.json({ ok: true, savedItemId: saved.id });
  } catch (e: any) {
    console.error("save-summary error:", e);
    return NextResponse.json(
      { ok: false, code: "INTERNAL_ERROR", message: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
