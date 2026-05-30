import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { buildPublicReadyPlanPayload } from "@/lib/ready-plan-public";
import { withDatabaseFallback } from "@/lib/prisma-safe";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: { slug: string } }) {
  try {
    const plan = await withDatabaseFallback(
      () =>
        prisma.readyPlan.findUnique({
          where: { slug: params.slug },
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
            status: true,
          },
        }),
      null,
    );

    if (!plan || plan.status !== "PUBLISHED") {
      return NextResponse.json({ ok: false, code: "NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      plan: buildPublicReadyPlanPayload(plan),
    });
  } catch (error) {
    console.error("public ready plan api error", error);
    return NextResponse.json({ ok: false, code: "SERVER_ERROR" }, { status: 500 });
  }
}
