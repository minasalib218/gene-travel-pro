import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/client";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import CinematicReadyPlanPage from "@/components/ready-plan/CinematicReadyPlanPage";
import { buildDefaultReadyPlanContent } from "@/lib/ready-plan-content";
import { sanitizeReadyPlanContentForPublic } from "@/lib/ready-plan-public";
import { getReadyPlanBookableItems } from "@/lib/ready-plan-booking";
import { tableExists } from "@/lib/prisma-safe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Ready Plan Customer Preview",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ReadyPlanCustomerPreviewPage({
  params,
}: {
  params: { id: string };
}) {
  const admin = await requireAdmin();
  if (!admin.ok) return notFound();

  const includeDayRecords = await tableExists("ready_plan_days");
  const includeItemRecords = includeDayRecords ? await tableExists("ready_plan_items") : false;
  const plan = await prisma.readyPlan
    .findUnique({
      where: { id: params.id },
      include: {
        ...(includeDayRecords
          ? {
              dayRecords: {
                orderBy: { sortOrder: "asc" },
                ...(includeItemRecords
                  ? {
                      include: {
                        itemRecords: {
                          orderBy: { sortOrder: "asc" },
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
          : {}),
      },
    } as any)
    .catch(() => null);

  if (!plan) return notFound();

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
    <CinematicReadyPlanPage
      planId={plan.id}
      slug={plan.slug}
      content={content}
      bookableItemIds={bookableItems.ids}
      bookableItemRecordIds={bookableItems.recordIdsByContentId}
      trackView={false}
    />
  );
}
