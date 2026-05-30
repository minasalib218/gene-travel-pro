import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createRouteClient } from "@/lib/supabase/server";
import { consumeCredit, refundConsumedCredit } from "@/lib/credits/creditService";

export async function POST(req: Request) {
  let consumedUserId: string | null = null;
  let consumedAction: string | null = null;
  try {
    const supabase = createRouteClient();
    const { data } = await supabase.auth.getUser();
    if (!data?.user) {
      return NextResponse.json({ ok: false, code: "NOT_AUTHED" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const planId = String(body?.planId ?? "");
    const kind = String(body?.kind ?? "");
    const newItemId = String(body?.newItemId ?? "");

    if (!planId || !kind || !newItemId) {
      return NextResponse.json({ ok: false, code: "MISSING_FIELDS" }, { status: 400 });
    }

    const plan = await prisma.plan.findUnique({
      where: { id: planId },
      select: {
        recommendationJson: true,
        summaryJson: true,
      },
    });

    if (!plan) {
      return NextResponse.json({ ok: false, code: "PLAN_NOT_FOUND" }, { status: 404 });
    }

    const recommendation = (plan.recommendationJson as any) ?? {};
    const providerData = recommendation.providerData ?? {};
    const picks = recommendation.picks ?? {};
    const summary = (plan.summaryJson as any) ?? { timeline: [] };

    const actionType =
      kind === "hotel"
        ? "REPLACE_HOTEL"
        : kind === "flight"
          ? "REPLACE_FLIGHT"
          : kind === "transport"
            ? "CHANGE_TRANSPORT"
            : "REPLACE_ACTIVITY";

    await consumeCredit(data.user.id, actionType as any, { planId, kind, newItemId });
    consumedUserId = data.user.id;
    consumedAction = actionType;

    if (kind === "hotel") {
      const item = (providerData.hotels ?? []).find((x: any) => x.id === newItemId);
      if (!item) return NextResponse.json({ ok: false, code: "ITEM_NOT_FOUND" }, { status: 404 });
      picks.hotel = item;
    }

    if (kind === "flight") {
      const item = (providerData.flights ?? []).find((x: any) => x.id === newItemId);
      if (!item) return NextResponse.json({ ok: false, code: "ITEM_NOT_FOUND" }, { status: 404 });
      picks.flight = item;
    }

    if (kind === "transport") {
      const item = (providerData.transports ?? []).find((x: any) => x.id === newItemId);
      if (!item) return NextResponse.json({ ok: false, code: "ITEM_NOT_FOUND" }, { status: 404 });
      picks.transport = item;
    }

    if (kind === "activity") {
      const item = (providerData.activities ?? []).find((x: any) => x.id === newItemId);
      if (!item) return NextResponse.json({ ok: false, code: "ITEM_NOT_FOUND" }, { status: 404 });

      const current = Array.isArray(picks.activities) ? picks.activities : [];
      const next = [item, ...current.filter((x: any) => x.id !== item.id)].slice(0, 6);
      picks.activities = next;

      const firstDay = summary.timeline?.[0];
      if (firstDay?.blocks) {
        const actIndex = firstDay.blocks.findIndex((b: any) => b.kind === "ACTIVITY");
        if (actIndex >= 0) {
          firstDay.blocks[actIndex] = {
            ...firstDay.blocks[actIndex],
            title: item.name,
            providerItemId: item.id,
          };
        }
      }
    }

    await prisma.plan.update({
      where: { id: planId },
      data: {
        recommendationJson: {
          ...recommendation,
          picks,
        },
        summaryJson: summary,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    try {
      if (consumedUserId && consumedAction) {
        await refundConsumedCredit(consumedUserId, consumedAction, { reason: "AI_FAILED" });
      }
    } catch {}
    return NextResponse.json(
      { ok: false, code: "INTERNAL_ERROR", message: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
