import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createRouteClient } from "@/lib/supabase/server";
import type { RecommendationPayload } from "@/lib/recommendation/types";
import { Prisma } from "@prisma/client";

function mapItemKind(type: string) {
  if (type === "hotel") return "HOTEL";
  if (type === "flight") return "FLIGHT";
  if (type === "transport" || type === "car") return "TRANSPORT";
  return "ACTIVITY";
}

function mapSlot(slot: string) {
  if (slot === "midday") return "MIDDAY";
  if (slot === "afternoon") return "AFTERNOON";
  if (slot === "evening") return "EVENING";
  return "MORNING";
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const supabase = createRouteClient();
  const { data } = await supabase.auth.getUser();
  if (!data?.user) return NextResponse.json({ ok: false, code: "NOT_AUTHED" }, { status: 401 });

  const plan = await prisma.plan.findFirst({
    where: { id: params.id, userId: data.user.id },
  });

  if (!plan) return NextResponse.json({ ok: false, code: "NOT_FOUND" }, { status: 404 });

  return NextResponse.json({ ok: true, plan });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createRouteClient();
  const { data } = await supabase.auth.getUser();
  if (!data?.user) return NextResponse.json({ ok: false, code: "NOT_AUTHED" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { payload?: RecommendationPayload } | null;
  const payload = body?.payload;

  if (!payload) {
    return NextResponse.json({ ok: false, code: "MISSING_PAYLOAD" }, { status: 400 });
  }

  const existingPlan = await prisma.plan.findFirst({
    where: { id: params.id, userId: data.user.id },
    select: {
      id: true,
      destination: true,
      summaryJson: true,
    },
  });

  if (!existingPlan) {
    return NextResponse.json({ ok: false, code: "NOT_FOUND" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    const currentSummary = (existingPlan.summaryJson as Record<string, unknown> | null) ?? {};

    await tx.plan.update({
      where: { id: existingPlan.id },
      data: {
        summaryJson: {
          ...currentSummary,
          destination: payload.inputs.destination,
          dayPlan: payload.dayPlan,
          selected: payload.selected,
          groups: payload.groups,
          analysis: payload.analysis,
          modules: payload.modules,
          createdAt: payload.createdAt,
          payload,
        } as Prisma.InputJsonValue,
      },
    });

    await tx.planItem.deleteMany({
      where: {
        planDay: {
          planId: existingPlan.id,
        },
      },
    });

    await tx.planDay.deleteMany({
      where: { planId: existingPlan.id },
    });

    for (const day of payload.dayPlan) {
      const createdDay = await tx.planDay.create({
        data: {
          planId: existingPlan.id,
          dayIndex: Math.max(day.day - 1, 0),
          date: new Date(day.date),
        },
      });

      for (const item of day.items) {
        await tx.planItem.create({
          data: {
            planDayId: createdDay.id,
            slot: mapSlot(item.slot) as any,
            kind: mapItemKind(item.type) as any,
            startTime: item.startTime,
            endTime: item.endTime,
            imageUrl: item.imageUrl ?? null,
            deeplink: item.deepLink ?? null,
            meta: {
              id: item.id,
              title: item.title,
              description: item.description,
              location: item.location ?? null,
              type: item.type,
            },
          },
        });
      }
    }
  });

  return NextResponse.json({ ok: true });
}
