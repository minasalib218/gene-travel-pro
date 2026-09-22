import {
  buildDefaultReadyPlanContent,
  type ReadyPlanContent,
  type ReadyPlanDayContent,
  type ReadyPlanSuggestion,
  type ReadyPlanTimelineItem,
} from "@/lib/ready-plan-content";

const BOOK_NOW_LABEL = "Book Now";

function isUrlLike(value: unknown) {
  return typeof value === "string" && /^(https?:\/\/|www\.|\/api\/affiliate\/redirect)/i.test(value.trim());
}

function publicText(value: string | undefined, fallback = "") {
  return isUrlLike(value) ? fallback : value;
}

export function sanitizeReadyPlanContentForPublic(content: ReadyPlanContent): ReadyPlanContent {
  return {
    ...content,
    hero: {
      ...content.hero,
      primaryCtaHref: "/start-planning",
    },
    days: content.days.map((day) => ({
      ...day,
      timelineItems: day.timelineItems.map((item): ReadyPlanTimelineItem => ({
        ...item,
        deeplink: undefined,
      })),
      suggestions: day.suggestions.map((suggestion): ReadyPlanSuggestion => ({
        ...suggestion,
        matchReason: publicText(suggestion.matchReason, ""),
        matchScore: publicText(suggestion.matchScore, "Recommended"),
        duration: publicText(suggestion.duration, ""),
        ctaText: publicText(suggestion.ctaText, BOOK_NOW_LABEL),
      })),
      story: {
        ...day.story,
        musicUrl: undefined,
      },
    })),
    footer: {
      ...content.footer,
      ctaHref: "/start-planning",
    },
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
