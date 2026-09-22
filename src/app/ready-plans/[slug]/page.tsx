import { notFound } from "next/navigation";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db/client";
import CinematicReadyPlanPage from "@/components/ready-plan/CinematicReadyPlanPage";
import { buildDefaultReadyPlanContent } from "@/lib/ready-plan-content";
import { sanitizeReadyPlanContentForPublic } from "@/lib/ready-plan-public";
import { getReadyPlanBookableItems } from "@/lib/ready-plan-booking";
import { isDatabaseUnavailableError, tableExists, withDatabaseFallback } from "@/lib/prisma-safe";
import { buildSeoMetadata, jsonLdScript, readyPlanDescription, SITE_URL } from "@/lib/seo";

export const revalidate = 60;
export const dynamic = "force-static";

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

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const plan = await getPublishedReadyPlan(params.slug);

  if (!plan || plan.status !== "PUBLISHED") {
    return buildSeoMetadata({
      title: "Ready Plan Not Found",
      description: "This Gene ready plan is private, unpublished, or no longer available.",
      path: `/ready-plans/${params.slug}`,
      noIndex: true,
    });
  }

  return buildSeoMetadata({
    title: plan.title,
    description: readyPlanDescription({
      title: plan.title,
      destination: plan.destination,
      daysCount: plan.daysCount,
      style: (plan as any).style,
      subtitle: plan.subtitle,
      summary: (plan as any).summary,
    }),
    path: `/ready-plans/${plan.slug}`,
    image: plan.heroImage || plan.coverImage,
  });
}

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
  const bookableItems = getReadyPlanBookableItems(rawContent, (plan as any).dayRecords);
  const content = sanitizeReadyPlanContentForPublic(rawContent);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Ready Plans",
              item: `${SITE_URL}/ready-plans`,
            },
            {
              "@type": "ListItem",
              position: 2,
              name: plan.title,
              item: `${SITE_URL}/ready-plans/${plan.slug}`,
            },
          ],
        })}
      />
      <CinematicReadyPlanPage
        planId={plan.id}
        slug={plan.slug}
        content={content}
        bookableItemIds={bookableItems.ids}
        bookableItemRecordIds={bookableItems.recordIdsByContentId}
      />
    </>
  );
}
