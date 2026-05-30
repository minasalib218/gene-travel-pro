import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { buildPublicReadyPlanPayload } from "@/lib/ready-plan-public";
import { withDatabaseFallback } from "@/lib/prisma-safe";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const plans = await withDatabaseFallback(
      () =>
        prisma.readyPlan.findMany({
          where: { status: "PUBLISHED", showOnHome: true },
          orderBy: { updatedAt: "desc" },
          select: {
            id: true,
            slug: true,
            title: true,
            subtitle: true,
            destination: true,
            daysCount: true,
            heroImage: true,
            coverImage: true,
            currency: true,
            priceFrom: true,
            style: true,
            daysJson: true,
            contentJson: true,
          },
        }),
      [],
    );

    return NextResponse.json({
      ok: true,
      plans: plans.map((plan) => buildPublicReadyPlanPayload(plan)),
    });
  } catch (error) {
    console.error("public ready plans api error", error);
    return NextResponse.json({ ok: false, plans: [] }, { status: 200 });
  }
}
