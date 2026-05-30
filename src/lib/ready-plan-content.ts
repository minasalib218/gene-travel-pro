type ReadyPlanStat = {
  label: string;
  value: string;
};

export type ReadyPlanTimelineItem = {
  id: string;
  type: "hotel" | "flight" | "transportation" | "activity" | "event" | "restaurant";
  icon?: string;
  badge?: string;
  status?: string;
  time?: string;
  title: string;
  description: string;
  imageUrl?: string;
  deeplink?: string;
  buttonLabel?: string;
  price?: string;
  people?: string;
};

export type ReadyPlanSuggestion = {
  id: string;
  title: string;
  category: string;
  imageUrl?: string;
  matchReason: string;
  matchScore?: string;
  price?: string;
  duration?: string;
  ctaText?: string;
};

export type ReadyPlanNote = {
  id: string;
  icon?: string;
  title: string;
  text: string;
};

export type ReadyPlanDayContent = {
  id: string;
  dayNumber: number;
  title: string;
  destinationLabel: string;
  countryLabel?: string;
  previewImage?: string;
  heroImage?: string;
  dateLabel?: string;
  routeFrom?: string;
  routeTo?: string;
  weatherLabel?: string;
  quote?: string;
  description?: string;
  timelineItems: ReadyPlanTimelineItem[];
  suggestions: ReadyPlanSuggestion[];
  story: {
    imageUrl?: string;
    quote?: string;
    musicLabel?: string;
    musicUrl?: string;
  };
  summary: {
    activitiesCount?: string;
    restaurantsCount?: string;
    transfersCount?: string;
    estimatedCost?: string;
    upgrades?: string[];
    viewDetailsText?: string;
    editPlanText?: string;
  };
  notes: ReadyPlanNote[];
};

export type ReadyPlanContent = {
  hero: {
    backgroundImage?: string;
    title: string;
    subtitle: string;
    stats: ReadyPlanStat[];
    primaryCtaText: string;
    primaryCtaHref: string;
    secondaryCtaText: string;
  };
  journeyOverview: {
    title: string;
    startPoint: string;
    destinations: string;
    tripStyle: string;
    travelers: string;
    estimatedCost: string;
    aiScore: string;
  };
  days: ReadyPlanDayContent[];
  footer: {
    backgroundImage?: string;
    title: string;
    subtitle: string;
    ctaText: string;
    ctaHref: string;
  };
};

function id(prefix: string, index: number) {
  return `${prefix}-${index + 1}`;
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

function asObject(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

export function buildDefaultReadyPlanContent(plan: {
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
  const existing = plan.contentJson && typeof plan.contentJson === "object"
    ? (plan.contentJson as ReadyPlanContent)
    : null;

  if (existing?.days?.length) {
    return normalizeReadyPlanContent(existing, plan);
  }

  const daysJson = Array.isArray(plan.daysJson) ? plan.daysJson : [];
  const days = (daysJson.length ? daysJson : Array.from({ length: Math.max(plan.daysCount || 1, 1) }, (_, index) => ({ day: index + 1 }))).map(
    (entry, index) => {
      const record = asObject(entry);
      const items = Array.isArray(record.items) ? record.items : [];

      return {
        id: id("day", index),
        dayNumber: Number(record.day ?? index + 1),
        title: asString(record.title, `Day ${index + 1}`),
        destinationLabel: plan.destination,
        countryLabel: "",
        previewImage: asString(record.imageUrl, plan.heroImage || plan.coverImage || "/bg/home-hero.png"),
        heroImage: asString(record.imageUrl, plan.heroImage || plan.coverImage || "/bg/home-hero.png"),
        dateLabel: "",
        routeFrom: "",
        routeTo: plan.destination,
        weatherLabel: "",
        quote: asString(record.theme, "A cinematic travel moment, shaped for calm and memory."),
        description: asString(record.theme, plan.subtitle || "A polished Ready Plan with a softer, more luxurious travel flow."),
        timelineItems: items.map((item, itemIndex) => {
          const row = asObject(item);
          const type = asString(row.type, "activity").toLowerCase();
          return {
            id: id(`item-${index}`, itemIndex),
            type:
              type === "flight"
                ? "flight"
                : type === "hotel"
                  ? "hotel"
                  : type === "transport"
                    ? "transportation"
                    : type === "restaurant"
                      ? "restaurant"
                      : "activity",
            time: asString(row.time),
            title: asString(row.title, "Plan item"),
            description: asString(row.note, "Add more detail from the admin page."),
            imageUrl: asString(row.imageUrl, plan.heroImage || plan.coverImage || "/bg/home-hero.png"),
            deeplink: asString(row.deeplink),
            buttonLabel: asString(row.buttonLabel, "Book Now"),
            badge: type === "restaurant" ? "Dining" : "Ready Plan",
            status: "Confirmed",
            price: "",
            people: "",
          } as ReadyPlanTimelineItem;
        }),
        suggestions: [],
        story: {
          imageUrl: asString(record.imageUrl, plan.heroImage || plan.coverImage || "/bg/home-hero.png"),
          quote: `“${asString(record.theme, "This part of the journey deserves to stay with you.")}”`,
          musicLabel: "Cinematic Story",
          musicUrl: "",
        },
        summary: {
          activitiesCount: String(items.length),
          restaurantsCount: String(items.filter((item) => asString(asObject(item).type).toLowerCase() === "restaurant").length),
          transfersCount: String(items.filter((item) => asString(asObject(item).type).toLowerCase() === "transport").length),
          estimatedCost: plan.priceFrom ? `${plan.currency || "USD"} ${plan.priceFrom}` : "Open budget",
          upgrades: [],
          viewDetailsText: "View Details",
          editPlanText: "Edit Plan",
        },
        notes: [
          {
            id: id(`note-${index}`, 0),
            icon: "sun",
            title: "Gene Reminder",
            text: "Use the admin page to add notes, tips, and reminders for this day.",
          },
        ],
      } satisfies ReadyPlanDayContent;
    },
  );

  return normalizeReadyPlanContent(
    {
      hero: {
        backgroundImage: plan.heroImage || plan.coverImage || "/bg/home-hero.png",
        title: "Your Cinematic Ready Plan",
        subtitle:
          plan.subtitle ||
          "A journey curated with atmosphere, practical flow, and memorable travel moments.",
        stats: [
          { label: "Days", value: String(plan.daysCount || days.length || 1) },
          { label: "Countries", value: "1" },
          { label: "Cities", value: "1" },
          { label: "Travelers", value: "2" },
          { label: "Travel Style", value: plan.style || "Luxury" },
        ],
        primaryCtaText: "Plan Smarter With AI",
        primaryCtaHref: "/ai-planner",
        secondaryCtaText: "View Full Timeline",
      },
      journeyOverview: {
        title: "Journey Overview",
        startPoint: "Starting point",
        destinations: plan.destination,
        tripStyle: plan.style || "Luxury getaway",
        travelers: "2 Adults",
        estimatedCost: plan.priceFrom ? `${plan.currency || "USD"} ${plan.priceFrom}` : "Tailored",
        aiScore: "4.9",
      },
      days,
      footer: {
        backgroundImage: plan.coverImage || plan.heroImage || "/bg/home-hero.png",
        title: "Your journey, but smarter.",
        subtitle: "Let AI handle the details while you focus on the memories.",
        ctaText: "Plan Smarter With AI",
        ctaHref: "/ai-planner",
      },
    },
    plan,
  );
}

export function normalizeReadyPlanContent(
  value: unknown,
  plan?: {
    destination?: string;
    daysCount?: number;
    heroImage?: string | null;
    coverImage?: string | null;
    subtitle?: string | null;
    style?: string | null;
    priceFrom?: number | null;
    currency?: string | null;
  },
): ReadyPlanContent {
  const root = asObject(value);
  const hero = asObject(root.hero);
  const overview = asObject(root.journeyOverview);
  const footer = asObject(root.footer);
  const days = Array.isArray(root.days) ? root.days : [];

  return {
    hero: {
      backgroundImage: asString(hero.backgroundImage, plan?.heroImage || plan?.coverImage || "/bg/home-hero.png"),
      title: asString(hero.title, "Your Cinematic Ready Plan"),
      subtitle: asString(
        hero.subtitle,
        plan?.subtitle || "A journey curated with atmosphere, practical flow, and memorable travel moments.",
      ),
      stats: (Array.isArray(hero.stats) ? hero.stats : []).map((item) => {
        const stat = asObject(item);
        return { label: asString(stat.label), value: asString(stat.value) };
      }).filter((item) => item.label || item.value).slice(0, 5),
      primaryCtaText: asString(hero.primaryCtaText, "Plan Smarter With AI"),
      primaryCtaHref: asString(hero.primaryCtaHref, "/ai-planner"),
      secondaryCtaText: asString(hero.secondaryCtaText, "View Full Timeline"),
    },
    journeyOverview: {
      title: asString(overview.title, "Journey Overview"),
      startPoint: asString(overview.startPoint, "Starting point"),
      destinations: asString(overview.destinations, plan?.destination || ""),
      tripStyle: asString(overview.tripStyle, plan?.style || "Luxury getaway"),
      travelers: asString(overview.travelers, "2 Adults"),
      estimatedCost: asString(
        overview.estimatedCost,
        plan?.priceFrom ? `${plan.currency || "USD"} ${plan.priceFrom}` : "Tailored",
      ),
      aiScore: asString(overview.aiScore, "4.9"),
    },
    days: days.map((item, index) => {
      const day = asObject(item);
      const timelineItems = Array.isArray(day.timelineItems) ? day.timelineItems : [];
      const suggestions = Array.isArray(day.suggestions) ? day.suggestions : [];
      const notes = Array.isArray(day.notes) ? day.notes : [];
      const summary = asObject(day.summary);
      const story = asObject(day.story);

      return {
        id: asString(day.id, id("day", index)),
        dayNumber: Number(day.dayNumber ?? index + 1),
        title: asString(day.title, `Day ${index + 1}`),
        destinationLabel: asString(day.destinationLabel, plan?.destination || ""),
        countryLabel: asString(day.countryLabel),
        previewImage: asString(day.previewImage, plan?.heroImage || plan?.coverImage || "/bg/home-hero.png"),
        heroImage: asString(day.heroImage, plan?.heroImage || plan?.coverImage || "/bg/home-hero.png"),
        dateLabel: asString(day.dateLabel),
        routeFrom: asString(day.routeFrom),
        routeTo: asString(day.routeTo, plan?.destination || ""),
        weatherLabel: asString(day.weatherLabel),
        quote: asString(day.quote),
        description: asString(day.description),
        timelineItems: timelineItems.map((row, itemIndex) => {
          const entry = asObject(row);
          return {
            id: asString(entry.id, id(`item-${index}`, itemIndex)),
            type: (asString(entry.type, "activity") as ReadyPlanTimelineItem["type"]),
            icon: asString(entry.icon),
            badge: asString(entry.badge),
            status: asString(entry.status),
            time: asString(entry.time),
            title: asString(entry.title, "Plan item"),
            description: asString(entry.description),
            imageUrl: asString(entry.imageUrl, plan?.heroImage || plan?.coverImage || "/bg/home-hero.png"),
            deeplink: asString(entry.deeplink),
            buttonLabel: asString(entry.buttonLabel, "Book Now"),
            price: asString(entry.price),
            people: asString(entry.people),
          };
        }),
        suggestions: suggestions.map((row, suggestionIndex) => {
          const entry = asObject(row);
          return {
            id: asString(entry.id, id(`suggestion-${index}`, suggestionIndex)),
            title: asString(entry.title, "Suggestion"),
            category: asString(entry.category, "Activity"),
            imageUrl: asString(entry.imageUrl, plan?.heroImage || plan?.coverImage || "/bg/home-hero.png"),
            matchReason: asString(entry.matchReason, "Strong fit for the mood of this day."),
            matchScore: asString(entry.matchScore, "Highly Recommended"),
            price: asString(entry.price),
            duration: asString(entry.duration),
            ctaText: asString(entry.ctaText, "Add to Plan"),
          };
        }),
        story: {
          imageUrl: asString(story.imageUrl, plan?.heroImage || plan?.coverImage || "/bg/home-hero.png"),
          quote: asString(story.quote),
          musicLabel: asString(story.musicLabel, "Cinematic Story"),
          musicUrl: asString(story.musicUrl),
        },
        summary: {
          activitiesCount: asString(summary.activitiesCount),
          restaurantsCount: asString(summary.restaurantsCount),
          transfersCount: asString(summary.transfersCount),
          estimatedCost: asString(summary.estimatedCost),
          upgrades: asStringArray(summary.upgrades),
          viewDetailsText: asString(summary.viewDetailsText, "View Details"),
          editPlanText: asString(summary.editPlanText, "Edit Plan"),
        },
        notes: notes.map((row, noteIndex) => {
          const entry = asObject(row);
          return {
            id: asString(entry.id, id(`note-${index}`, noteIndex)),
            icon: asString(entry.icon),
            title: asString(entry.title, "Travel note"),
            text: asString(entry.text),
          };
        }),
      };
    }),
    footer: {
      backgroundImage: asString(footer.backgroundImage, plan?.coverImage || plan?.heroImage || "/bg/home-hero.png"),
      title: asString(footer.title, "Your journey, but smarter."),
      subtitle: asString(footer.subtitle, "Let AI handle the details while you focus on the memories."),
      ctaText: asString(footer.ctaText, "Plan Smarter With AI"),
      ctaHref: asString(footer.ctaHref, "/ai-planner"),
    },
  };
}

export function contentToDaysJson(content: ReadyPlanContent) {
  return content.days.map((day) => ({
    day: day.dayNumber,
    title: day.title,
    theme: day.quote || day.description || "",
    imageUrl: day.heroImage || day.previewImage || "",
    items: day.timelineItems.map((item) => ({
      time: item.time || "",
      title: item.title,
      note: item.description,
      type:
        item.type === "transportation"
          ? "transport"
          : item.type,
      imageUrl: item.imageUrl || "",
      deeplink: item.deeplink || "",
      buttonLabel: item.buttonLabel || "Book Now",
    })),
  }));
}
