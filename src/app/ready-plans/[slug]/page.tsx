import { notFound } from "next/navigation";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db/client";
import CinematicReadyPlanPage from "@/components/ready-plan/CinematicReadyPlanPage";
import { buildDefaultReadyPlanContent, type ReadyPlanContent } from "@/lib/ready-plan-content";
import { sanitizeReadyPlanContentForPublic } from "@/lib/ready-plan-public";
import { isDatabaseUnavailableError, tableExists, withDatabaseFallback } from "@/lib/prisma-safe";

export const revalidate = 60;
export const dynamic = "force-static";

function getBookableItemIds(content: ReadyPlanContent, dayRecords?: any[] | null) {
  const ids = new Set<string>();

  content.days.forEach((day) => {
    day.timelineItems.forEach((item) => {
      if ((item as any).showButton !== false && item.deeplink?.trim()) {
        ids.add(item.id);
      }
    });
  });

  if (Array.isArray(dayRecords)) {
    dayRecords.forEach((dayRecord, dayIndex) => {
      const contentDay = content.days[dayIndex];
      const itemRecords = Array.isArray(dayRecord?.itemRecords) ? dayRecord.itemRecords : [];
      itemRecords.forEach((itemRecord: any, itemIndex: number) => {
        const contentItem = contentDay?.timelineItems?.[itemIndex];
        if (contentItem && itemRecord?.affiliateUrl?.trim()) {
          ids.add(contentItem.id);
        }
      });
    });
  }

  return Array.from(ids);
}

const getPublishedReadyPlan = unstable_cache(
  async (slug: string) => {
    let plan = null as Awaited<ReturnType<typeof prisma.readyPlan.findUnique>> | null;
    const includeLinks = await tableExists("ready_plan_links");
    const includeDayRecords = await tableExists("ready_plan_days");
    const includeItemRecords = includeDayRecords ? await tableExists("ready_plan_items") : false;
    const dayRecordsInclude = includeDayRecords
      ? {
          dayRecords: {
            orderBy: { sortOrder: "asc" as const },
            ...(includeItemRecords
              ? {
                  include: {
                    itemRecords: {
                      orderBy: { sortOrder: "asc" as const },
                      select: {
                        id: true,
                        affiliateUrl: true,
                        buttonLabel: true,
                        sortOrder: true,
                      },
                    },
                  },
                }
              : {}),
          },
        }
      : {};

    try {
      plan = includeLinks
        ? await withDatabaseFallback(
            () =>
              prisma.readyPlan.findUnique({
                where: { slug },
                include: {
                  links: {
                    orderBy: { sortOrder: "asc" },
                  },
                  ...dayRecordsInclude,
                },
              } as any),
            null,
          )
        : await withDatabaseFallback(
            () =>
              prisma.readyPlan.findUnique({
                where: { slug },
                include: dayRecordsInclude,
              } as any),
            null,
          );
    } catch (error: any) {
      if (isDatabaseUnavailableError(error)) {
        return null;
      }

      if (error?.code !== "P2022") throw error;
      plan = await withDatabaseFallback(
        () =>
          prisma.readyPlan.findUnique({
            where: { slug },
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
              ...dayRecordsInclude,
            },
          } as any),
        null,
      );
    }

    return plan;
  },
  ["published-ready-plan-detail"],
  {
    revalidate: 60,
    tags: ["published-ready-plans"],
  },
);

export default async function ReadyPlanDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const plan = await getPublishedReadyPlan(params.slug);

  if (!plan || plan.status !== "PUBLISHED") return notFound();

  const rawContent = buildDefaultReadyPlanContent({
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
  const bookableItemIds = getBookableItemIds(rawContent, (plan as any).dayRecords);
  const content = sanitizeReadyPlanContentForPublic(rawContent);

  return (
    <CinematicReadyPlanPage
      planId={plan.id}
      slug={plan.slug}
      content={content}
      bookableItemIds={bookableItemIds}
    />
  );
}
