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

function isPrivateWorkflowLabel(value: unknown) {
  return typeof value === "string" && /^(?:affiliate(?: link)?\s+pending|pending affiliate|draft)$/i.test(value.trim());
}

function isPriceWithoutAmount(value: unknown) {
  if (typeof value !== "string") return false;
  const normalized = value.trim();
  return /^(?:live price|check live price|price unavailable|pricing pending|pending)$/i.test(normalized)
    || (/live price/i.test(normalized) && !/\d/.test(normalized));
}

function publicText(value: string | undefined, fallback = "") {
  return isUrlLike(value) || isPrivateWorkflowLabel(value) ? fallback : value;
}

function publicPrice(value: string | undefined, fallback = "") {
  return isUrlLike(value) || isPrivateWorkflowLabel(value) || isPriceWithoutAmount(value)
    ? fallback
    : value;
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
        badge: publicText(item.badge),
        status: publicText(item.status),
        title: publicText(item.title, "Travel item") || "Travel item",
        description: publicText(item.description),
        buttonLabel: publicText(item.buttonLabel, BOOK_NOW_LABEL),
        price: publicPrice(item.price),
        people: publicText(item.people),
        deeplink: undefined,
      })),
      suggestions: day.suggestions.map((suggestion): ReadyPlanSuggestion => ({
        ...suggestion,
        title: publicText(suggestion.title, "Travel suggestion") || "Travel suggestion",
        category: publicText(suggestion.category),
        matchReason: publicText(suggestion.matchReason, ""),
        matchScore: publicText(suggestion.matchScore, "Recommended"),
        price: publicPrice(suggestion.price),
        duration: publicText(suggestion.duration, ""),
        ctaText: publicText(suggestion.ctaText, BOOK_NOW_LABEL),
      })),
      summary: {
        ...day.summary,
        estimatedCost: publicPrice(day.summary.estimatedCost, "-"),
        upgrades: day.summary.upgrades?.filter((upgrade) => !isUrlLike(upgrade) && !isPrivateWorkflowLabel(upgrade)),
      },
      story: {
        ...day.story,
        musicUrl: undefined,
      },
    })),
    journeyOverview: {
      ...content.journeyOverview,
      estimatedCost: publicPrice(content.journeyOverview.estimatedCost, "Not available"),
    },
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
