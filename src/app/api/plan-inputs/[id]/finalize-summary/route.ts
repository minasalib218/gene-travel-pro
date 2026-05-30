import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
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

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = createRouteClient();
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      return NextResponse.json(
        { ok: false, code: "AUTH_ERROR", message: error.message },
        { status: 401 },
      );
    }

    if (!data?.user) {
      return NextResponse.json({ ok: false, code: "NOT_AUTHED" }, { status: 401 });
    }

    const body = (await req.json()) as { payload?: RecommendationPayload };
    const payload = body?.payload;

    if (!payload) {
      return NextResponse.json({ ok: false, code: "MISSING_PAYLOAD" }, { status: 400 });
    }

    const planInput = await prisma.planInput.findFirst({
      where: {
        id: params.id,
        userId: data.user.id,
      },
    });

    if (!planInput) {
      return NextResponse.json({ ok: false, code: "PLAN_INPUT_NOT_FOUND" }, { status: 404 });
    }

    const savedPlan = await prisma.$transaction(async (tx) => {
      const existingPlan = await tx.plan.findFirst({
        where: {
          userId: data.user.id,
          summaryJson: {
            path: ["planInputId"],
            equals: params.id,
          },
        },
        select: { id: true },
      });

      const planTitle = `${planInput.destination} Final Plan`;
      const recommendationJson = {
        groups: payload.groups,
        selected: payload.selected,
        aiSummary: payload.aiSummary ?? null,
        mode: payload.mode,
      };
      const analysisJson = {
        analysis: payload.analysis,
        modules: payload.modules,
      };
      const summaryJson = {
        planInputId: params.id,
        destination: payload.inputs.destination,
        dayPlan: payload.dayPlan,
        selected: payload.selected,
        groups: payload.groups,
        analysis: payload.analysis,
        modules: payload.modules,
        createdAt: payload.createdAt,
        payload,
      };

      const plan = existingPlan
        ? await tx.plan.update({
            where: { id: existingPlan.id },
            data: {
              status: "CONFIRMED",
              title: planTitle,
              destination: planInput.destination,
              startDate: planInput.startDate,
              endDate: planInput.endDate,
              inputsJson: {
                ...((planInput.rawInput as Record<string, unknown> | null) ?? {}),
                planInputId: planInput.id,
                destination: planInput.destination,
                departureCity: planInput.departureCity,
                budget: planInput.totalBudget,
                currency: "USD",
                travelStyle: planInput.travelLevel,
              },
              recommendationJson: recommendationJson as Prisma.InputJsonValue,
              analysisJson: analysisJson as Prisma.InputJsonValue,
              summaryJson: summaryJson as Prisma.InputJsonValue,
            },
          })
        : await tx.plan.create({
            data: {
              userId: data.user.id,
              status: "CONFIRMED",
              title: planTitle,
              destination: planInput.destination,
              startDate: planInput.startDate,
              endDate: planInput.endDate,
              inputsJson: {
                ...((planInput.rawInput as Record<string, unknown> | null) ?? {}),
                planInputId: planInput.id,
                destination: planInput.destination,
                departureCity: planInput.departureCity,
                budget: planInput.totalBudget,
                currency: "USD",
                travelStyle: planInput.travelLevel,
              },
              recommendationJson: recommendationJson as Prisma.InputJsonValue,
              analysisJson: analysisJson as Prisma.InputJsonValue,
              summaryJson: summaryJson as Prisma.InputJsonValue,
            },
          });

      await tx.planItem.deleteMany({
        where: {
          planDay: {
            planId: plan.id,
          },
        },
      });

      await tx.planDay.deleteMany({
        where: { planId: plan.id },
      });

      for (const day of payload.dayPlan) {
        const createdDay = await tx.planDay.create({
          data: {
            planId: plan.id,
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
                title: item.title,
                description: item.description,
                location: item.location ?? null,
                type: item.type,
              },
            },
          });
        }
      }

      const existingSavedItem = await tx.savedItem.findFirst({
        where: {
          userId: data.user.id,
          kind: "PLAN",
          refId: plan.id,
        },
        select: { id: true },
      });

      if (!existingSavedItem) {
        await tx.savedItem.create({
          data: {
            userId: data.user.id,
            kind: "PLAN",
            refId: plan.id,
            meta: {
              title: plan.title,
              destination: plan.destination,
              subtitle: `${payload.dayPlan.length} day cinematic route`,
              image:
                payload.selected.hotel?.imageUrl ||
                payload.selected.activities[0]?.imageUrl ||
                payload.selected.flight?.imageUrl ||
                null,
              slug: plan.id,
              planInputId: params.id,
            },
          },
        });
      }

      return plan;
    });

    return NextResponse.json({
      ok: true,
      planId: savedPlan.id,
      message: "Plan saved to customer profile.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to finalize summary.";
    return NextResponse.json(
      { ok: false, code: "INTERNAL_ERROR", message },
      { status: 500 },
    );
  }
}

