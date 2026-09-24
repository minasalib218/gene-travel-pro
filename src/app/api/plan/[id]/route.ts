import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createRouteClient } from "@/lib/supabase/server";
import type { RecommendationPayload } from "@/lib/recommendation/types";
import { Prisma } from "@prisma/client";
import { isDatabaseUnavailableError } from "@/lib/prisma-safe";

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
  try {
    const supabase = createRouteClient();
    const { data } = await supabase.auth.getUser();
    if (!data?.user) return NextResponse.json({ ok: false, code: "NOT_AUTHED" }, { status: 401 });

    const plan = await prisma.plan.findFirst({
      where: { id: params.id, userId: data.user.id },
    });

    if (!plan) return NextResponse.json({ ok: false, code: "NOT_FOUND" }, { status: 404 });

    return NextResponse.json({ ok: true, plan });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json(
        {
          ok: false,
          code: "PLAN_STORE_UNAVAILABLE",
          message: "Saved trip storage is temporarily unavailable. Continue from the current AI session and try again shortly.",
        },
        { status: 503 },
      );
    }

    console.error("GET /api/plan/[id] failed", error);
    return NextResponse.json({ ok: false, code: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createRouteClient();
    const { data } = await supabase.auth.getUser();
    if (!data?.user) return NextResponse.json({ ok: false, code: "NOT_AUTHED" }, { status: 401 });

    const raw = await req.text();
    if (raw.length > 256_000) return NextResponse.json({ ok: false, code: "PAYLOAD_TOO_LARGE" }, { status: 413 });
    const body = (JSON.parse(raw || "null")) as { payload?: RecommendationPayload; expectedVersion?: number } | null;
    const payload = body?.payload;

    if (!payload || !payload.inputs || typeof payload.inputs.destination !== "string" ||
        !Array.isArray(payload.dayPlan) || payload.dayPlan.length > 60 ||
        payload.dayPlan.some((day) => !day || !Number.isInteger(day.day) || typeof day.date !== "string" ||
          !Number.isFinite(new Date(day.date).getTime()) || !Array.isArray(day.items) || day.items.length > 30 ||
          day.items.some((item) => !item || typeof item.title !== "string" || item.title.length > 240 ||
            typeof item.type !== "string" || typeof item.slot !== "string"))) {
      return NextResponse.json({ ok: false, code: "INVALID_PAYLOAD" }, { status: 400 });
    }
    if (!payload) {
      return NextResponse.json({ ok: false, code: "MISSING_PAYLOAD" }, { status: 400 });
    }
    if (!Number.isInteger(body?.expectedVersion) || Number(body?.expectedVersion) < 1) {
      return NextResponse.json({ ok: false, code: "EXPECTED_VERSION_REQUIRED" }, { status: 400 });
    }

    const existingPlan = await prisma.plan.findFirst({
      where: { id: params.id, userId: data.user.id },
      select: {
        id: true,
        destination: true,
        summaryJson: true,
        version: true,
      },
    });

    if (!existingPlan) {
      return NextResponse.json({ ok: false, code: "NOT_FOUND" }, { status: 404 });
    }
    if (existingPlan.version !== body!.expectedVersion) {
      return NextResponse.json({ ok: false, code: "STALE_VERSION", currentVersion: existingPlan.version }, { status: 409 });
    }

    await prisma.$transaction(async (tx) => {
      const currentSummary = (existingPlan.summaryJson as Record<string, unknown> | null) ?? {};

      const updated = await tx.plan.updateMany({
        where: { id: existingPlan.id, userId: data.user.id, version: existingPlan.version },
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
          planningStage: "SUMMARY_READY",
          version: { increment: 1 },
        },
      });
      if (updated.count !== 1) throw new Error("STALE_VERSION");

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

    return NextResponse.json({ ok: true, version: existingPlan.version + 1 });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json(
        {
          ok: false,
          code: "PLAN_STORE_UNAVAILABLE",
          message: "Saved trip storage is temporarily unavailable. Your current AI session is still open in this browser.",
        },
        { status: 503 },
      );
    }

    if (error instanceof Error && error.message === "STALE_VERSION") {
      return NextResponse.json({ ok: false, code: "STALE_VERSION" }, { status: 409 });
    }
    console.error("PATCH /api/plan/[id] failed", error);
    return NextResponse.json({ ok: false, code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
