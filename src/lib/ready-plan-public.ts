import {
  buildDefaultReadyPlanContent,
  type ReadyPlanContent,
  type ReadyPlanDayContent,
  type ReadyPlanSuggestion,
  type ReadyPlanTimelineItem,
} from "@/lib/ready-plan-content";

export function sanitizeReadyPlanContentForPublic(content: ReadyPlanContent): ReadyPlanContent {
  return {
    ...content,
    days: content.days.map((day) => ({
      ...day,
      timelineItems: day.timelineItems.map((item): ReadyPlanTimelineItem => ({
        ...item,
        deeplink: undefined,
      })),
      suggestions: day.suggestions.map((suggestion): ReadyPlanSuggestion => ({
        ...suggestion,
      })),
      story: {
        ...day.story,
      },
    })),
  };
}

export function buildPublicReadyPlanPayload(plan: {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  destination: string;
  daysCount: number;
  heroImage?: string | null;
  coverImage?: string | null;
  currency?: string | null;
  priceFrom?: number | null;
  style?: string | null;
  daysJson?: unknown;
  contentJson?: unknown;
}) {
  const content = sanitizeReadyPlanContentForPublic(
    buildDefaultReadyPlanContent({
      title: plan.title,
      subtitle: plan.subtitle,
      destination: plan.destination,
      daysCount: plan.daysCount,
      heroImage: plan.heroImage,
      coverImage: plan.coverImage,
      currency: plan.currency,
      priceFrom: plan.priceFrom,
      style: plan.style,
      daysJson: plan.daysJson,
      contentJson: plan.contentJson,
    }),
  );

  return {
    id: plan.id,
    slug: plan.slug,
    title: plan.title,
    subtitle: plan.subtitle ?? "",
    destination: plan.destination,
    daysCount: plan.daysCount,
    heroImage: plan.heroImage ?? null,
    coverImage: plan.coverImage ?? null,
    currency: plan.currency ?? "USD",
    priceFrom: plan.priceFrom ?? null,
    style: plan.style ?? null,
    content,
  };
}
