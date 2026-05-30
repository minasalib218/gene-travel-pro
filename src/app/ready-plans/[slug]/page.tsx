import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/client";
import CinematicReadyPlanPage from "@/components/ready-plan/CinematicReadyPlanPage";
import { buildDefaultReadyPlanContent } from "@/lib/ready-plan-content";
import { isDatabaseUnavailableError, tableExists, withDatabaseFallback } from "@/lib/prisma-safe";

export default async function ReadyPlanDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  let plan = null as Awaited<ReturnType<typeof prisma.readyPlan.findUnique>> | null;
  const includeLinks = await tableExists("ready_plan_links");

  try {
    plan = includeLinks
      ? await withDatabaseFallback(
          () =>
            prisma.readyPlan.findUnique({
              where: { slug: params.slug },
              include: {
                links: {
                  orderBy: { sortOrder: "asc" },
                },
              },
            }),
          null,
        )
      : await withDatabaseFallback(
          () =>
            prisma.readyPlan.findUnique({
              where: { slug: params.slug },
            }),
          null,
        );
  } catch (error: any) {
    if (isDatabaseUnavailableError(error)) {
      return notFound();
    }

    if (error?.code !== "P2022") throw error;
    plan = await withDatabaseFallback(
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
            priceFrom: true,
            currency: true,
            status: true,
            daysJson: true,
            ...(includeLinks
              ? {
                  links: {
                    orderBy: { sortOrder: "asc" },
                  },
                }
              : {}),
          },
        } as any),
      null,
    );
  }

  if (!plan || plan.status !== "PUBLISHED") return notFound();

  const content = buildDefaultReadyPlanContent({
    title: plan.title,
    subtitle: plan.subtitle,
    destination: plan.destination,
    daysCount: plan.daysCount,
    heroImage: plan.heroImage,
    coverImage: plan.coverImage,
    currency: plan.currency,
    priceFrom: plan.priceFrom,
    style: (plan as any).style,
    daysJson: plan.daysJson,
    contentJson: (plan as any).contentJson,
  });

  return (
    <CinematicReadyPlanPage
      planId={plan.id}
      slug={plan.slug}
      content={content}
    />
  );
}
