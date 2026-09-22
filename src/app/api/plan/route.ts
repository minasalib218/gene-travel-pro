import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { createRouteClient } from "@/lib/supabase/server";
import { ensureUserProfile } from "@/lib/profile/ensureUserProfile";

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
      return NextResponse.json({ error: "NOT_AUTHED" }, { status: 401 });
    }
    await ensureUserProfile(data.user, "PLAN_CREATED");

    const body = await req.json();

    const {
      destination,
      startDate,
      endDate,
      currency,
      budget,
      style,
      goal,
      groupType,
      hotelType,
      preferences,
      requests,
      idempotencyKey,
    } = body || {};

    if (!destination || !startDate || !endDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const creationKey = typeof idempotencyKey === "string" && idempotencyKey.trim()
      ? `${data.user.id}:${idempotencyKey.trim()}`
      : null;

    if (creationKey) {
      const existing = await prisma.plan.findUnique({ where: { creationKey } });
      if (existing && existing.userId === data.user.id) {
        return NextResponse.json({ ok: true, plan: existing, idempotent: true }, { status: 200 });
      }
    }

    const s = new Date(startDate);
    const e = new Date(endDate);
    if (!Number.isFinite(s.getTime()) || !Number.isFinite(e.getTime()) || e < s) {
      return NextResponse.json({ error: "Invalid travel dates" }, { status: 400 });
    }
    const nights = Math.max(1, Math.round((e.getTime() - s.getTime()) / 86400000));

    const plan = await prisma.$transaction(async (tx) => {
      const created = await tx.plan.create({
        data: {
        userId: data.user.id,
        creationKey,
        status: "DRAFT",
        planningStage: "DRAFT_INPUT",
        title: "Gene Smart Plan",
        destination,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        inputsJson: {
          ...body,
          currency,
          budget,
          style,
          goal,
          groupType,
          hotelType,
          preferences,
          requests,
        },
        },
      });

      const days = Array.from({ length: nights }, (_, i) => {
        const date = new Date(s);
        date.setDate(date.getDate() + i);
        return { planId: created.id, dayIndex: i, date };
      });
      await tx.planDay.createMany({ data: days });
      return created;
    });

    return NextResponse.json({ ok: true, plan }, { status: 200 });
  } catch (e: any) {
    console.error("POST /api/plan error:", e);
    return NextResponse.json(
      { ok: false, error: "Internal error" },
      { status: 500 }
    );
  }
}
