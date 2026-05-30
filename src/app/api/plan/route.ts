import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { createRouteClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
      return NextResponse.json({ error: "NOT_AUTHED" }, { status: 401 });
    }

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
    } = body || {};

    if (!destination || !startDate || !endDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const plan = await prisma.plan.create({
      data: {
        userId: data.user.id,
        status: "DRAFT",
        title: "Gene Smart Plan",
        destination,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        inputsJson: {
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

    // create days
    const s = new Date(startDate);
    const e = new Date(endDate);
    const nights = Math.max(1, Math.round((e.getTime() - s.getTime()) / 86400000));

    const days = Array.from({ length: nights }, (_, i) => {
      const d = new Date(s);
      d.setDate(d.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return {
        planId: plan.id,
        dayIndex: i,
        date: `${yyyy}-${mm}-${dd}`,
      };
    });

    await prisma.planDay.createMany({ data: days });

    return NextResponse.json({ ok: true, plan }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Internal error" },
      { status: 500 }
    );
  }
}
