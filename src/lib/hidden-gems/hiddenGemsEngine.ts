import type { HiddenGemCategory, HiddenGemResult, UserTripInput } from "@/lib/recommendation/types";
import { predictCrowdForPlace } from "@/lib/crowd/crowdPredictor";

const env = {
  viator: process.env.VIATOR_API_KEY,
  getYourGuide: process.env.GETYOURGUIDE_API_KEY,
  klook: process.env.KLOOK_API_KEY,
  tripcom: process.env.TRIPCOM_API_KEY,
  booking: process.env.BOOKING_API_KEY,
  expedia: process.env.EXPEDIA_API_KEY,
  googlePlaces: process.env.GOOGLE_PLACES_API_KEY,
  mapbox: process.env.MAPBOX_API_KEY,
  foursquare: process.env.FOURSQUARE_API_KEY,
  events: process.env.EVENTS_API_KEY,
  affiliateBaseUrl: process.env.AFFILIATE_BASE_URL,
};

type HiddenGemProviderCandidate = {
  id: string;
  provider: string;
  providerItemId?: string;
  category: HiddenGemCategory;
  title: string;
  description: string;
  destination: string;
  city?: string;
  neighborhood?: string;
  imageUrl?: string;
  rating?: number;
  reviewCount?: number;
  priceFrom?: number;
  currency?: string;
  duration?: string;
  openingHours?: string;
  location?: {
    lat?: number;
    lng?: number;
    address?: string;
  };
  affiliateUrl?: string | null;
  sourceUrl?: string;
  tags?: string[];
};

type HiddenGemRules = {
  maxBudget: number;
  personalities: string[];
  weatherMood: "hot" | "rainy" | "cold" | "mild";
  destination: string;
  walkingSensitive: boolean;
  crowdSensitive: boolean;
};

function hasAnyProviderKey() {
  return Boolean(
    env.viator ||
      env.getYourGuide ||
      env.klook ||
      env.tripcom ||
      env.booking ||
      env.expedia ||
      env.googlePlaces ||
      env.mapbox ||
      env.foursquare ||
      env.events,
  );
}

function inferWeatherMood(input: UserTripInput) {
  const month = new Date(input.startDate).getMonth() + 1;
  if (month >= 5 && month <= 9) return "hot" as const;
  if (month === 11 || month === 12 || month <= 2) return "rainy" as const;
  if (month <= 3) return "cold" as const;
  return "mild" as const;
}

function buildRules(input: UserTripInput): HiddenGemRules {
  const personalities = input.tripPersonality || [];
  return {
    maxBudget: input.budget,
    personalities,
    weatherMood: inferWeatherMood(input),
    destination: input.destination,
    walkingSensitive: Boolean(
      input.energyFatigueSignals?.includes("Walking Overload") ||
        input.energyFatigueSignals?.includes("Elderly Fatigue") ||
        input.energyFatigueSignals?.includes("Kid Fatigue"),
    ),
    crowdSensitive: Boolean(
      personalities.includes("Hidden Gems") ||
        input.energyFatigueSignals?.includes("Overstimulation"),
    ),
  };
}

function normalizeTag(value: string) {
  return value.trim().toLowerCase();
}

function personalityScore(result: HiddenGemProviderCandidate, rules: HiddenGemRules) {
  const text = `${result.title} ${result.description} ${(result.tags || []).join(" ")} ${result.neighborhood || ""}`.toLowerCase();
  let score = 40;
  if (rules.personalities.includes("Photography Lover") && /view|sunset|scenic|panorama|rooftop|beach|aesthetic/.test(text)) score += 22;
  if (rules.personalities.includes("Nightlife Lover") && /late|night|music|evening|market|lounge/.test(text)) score += 20;
  if (rules.personalities.includes("Luxury") && /boutique|premium|chef|refined|rooftop/.test(text)) score += 18;
  if (rules.personalities.includes("Adventure") && /beach|trail|outdoor|tour|nature/.test(text)) score += 20;
  if (rules.personalities.includes("Exploration") && /district|market|street|neighborhood|local/.test(text)) score += 16;
  if (rules.personalities.includes("Hidden Gems") && /hidden|local|boutique|authentic|quiet|artisan/.test(text)) score += 24;
  if (rules.personalities.includes("Famous Places")) score += /landmark|iconic/.test(text) ? -10 : 8;
  return Math.min(100, Math.max(0, score));
}

function seasonScore(result: HiddenGemProviderCandidate, rules: HiddenGemRules) {
  const text = `${result.title} ${result.description} ${result.category}`.toLowerCase();
  if (rules.weatherMood === "hot") {
    if (/cafe|market|indoor|museum/.test(text)) return 88;
    if (/beach|sunset|evening/.test(text)) return 78;
    return 65;
  }
  if (rules.weatherMood === "rainy") {
    if (/cafe|market|indoor|restaurant|event/.test(text)) return 90;
    if (/beach|outdoor|street/.test(text)) return 52;
    return 68;
  }
  if (rules.weatherMood === "cold") {
    if (/cafe|market|indoor|restaurant/.test(text)) return 86;
    return 62;
  }
  return /beach|outdoor|view|market|local/.test(text) ? 84 : 72;
}

function weatherScore(result: HiddenGemProviderCandidate, rules: HiddenGemRules) {
  return seasonScore(result, rules);
}

async function crowdScore(result: HiddenGemProviderCandidate, input: UserTripInput) {
  const crowd = await predictCrowdForPlace(
    {
      title: result.title,
      description: result.description,
      destinationLabel: `${result.city || input.destination}, ${result.destination}`,
      type: "activity",
      startTime: "17:30",
    },
    input.startDate,
    "17:30",
    input,
  );
  const fit =
    crowd.crowdLevel === "low" ? 92 :
    crowd.crowdLevel === "medium" ? 76 :
    crowd.crowdLevel === "high" ? 54 : 34;
  return { crowd, fit };
}

function authenticityScore(result: HiddenGemProviderCandidate) {
  const text = `${result.title} ${result.description} ${(result.tags || []).join(" ")} ${result.neighborhood || ""}`.toLowerCase();
  let score = 48;
  if (/local|authentic|artisan|family-run|boutique|quiet|underrated/.test(text)) score += 28;
  if (/mall|chain|generic|landmark/.test(text)) score -= 12;
  return Math.min(100, Math.max(0, score));
}

function scorePrice(result: HiddenGemProviderCandidate, rules: HiddenGemRules) {
  if (typeof result.priceFrom !== "number") return 70;
  if (result.priceFrom <= rules.maxBudget * 0.05) return 92;
  if (result.priceFrom <= rules.maxBudget * 0.1) return 82;
  if (result.priceFrom <= rules.maxBudget * 0.16) return 70;
  return 50;
}

export async function getHiddenGemCandidates(input: UserTripInput): Promise<HiddenGemProviderCandidate[]> {
  if (!hasAnyProviderKey()) {
    console.info("Hidden Gems API keys missing; using empty provider result set.");
    return [];
  }
  return [];
}

export function normalizeHiddenGemProviderResults(providerResults: HiddenGemProviderCandidate[]) {
  return providerResults.map((item) => ({
    ...item,
    affiliateUrl: item.affiliateUrl && item.affiliateUrl !== "#" ? item.affiliateUrl : null,
    isBookable: Boolean(item.affiliateUrl && item.affiliateUrl !== "#"),
    tags: (item.tags || []).map(normalizeTag),
  }));
}

export async function scoreHiddenGemResult(result: HiddenGemProviderCandidate, rules: HiddenGemRules, input: UserTripInput): Promise<HiddenGemResult> {
  const { crowd, fit: crowdFitScore } = await crowdScore(result, input);
  const personalityFitScore = personalityScore(result, rules);
  const seasonFitScore = seasonScore(result, rules);
  const weatherFitScore = weatherScore(result, rules);
  const localAuthenticityScore = authenticityScore(result);
  const budgetScore = scorePrice(result, rules);
  const tags = [
    localAuthenticityScore >= 75 ? "Hidden gem" : "",
    rules.personalities.includes("Photography Lover") && /view|sunset|scenic/.test(`${result.title} ${result.description}`.toLowerCase()) ? "Sunset" : "",
    crowd.crowdLevel === "low" ? "Low crowd" : crowd.crowdLevel === "medium" ? "Manageable crowd" : "",
    rules.walkingSensitive ? "Low walking" : "",
  ].filter(Boolean);
  const bestTime = crowd.bestVisitHours[0];
  const reason = [
    personalityFitScore >= 75 ? "strong personality fit" : "",
    seasonFitScore >= 80 ? "good seasonal match" : "",
    crowd.crowdLevel === "low" || crowd.crowdLevel === "medium" ? "calmer crowd timing" : "",
    rules.weatherMood === "hot" && /cafe|market|indoor/.test(`${result.title} ${result.description}`.toLowerCase()) ? "heat-friendly stop" : "",
    budgetScore >= 80 ? "works within trip budget" : "",
  ].filter(Boolean).join(", ") || "Fits the route and travel style.";

  return {
    id: result.id,
    name: result.title,
    title: result.title,
    description: result.description,
    imageUrl: result.imageUrl || "/recommendation-bg.jpg",
    provider: result.provider,
    providerItemId: result.providerItemId,
    sourceBadge: result.provider,
    aiReason: reason,
    confidenceScore: Math.round((personalityFitScore + seasonFitScore + weatherFitScore + crowdFitScore + localAuthenticityScore + budgetScore) / 6),
    freshnessLabel: crowd.source === "api" ? "Provider timing refreshed" : "Fallback timing estimate",
    fitTags: tags,
    locationLabel: result.neighborhood || result.city || result.destination,
    deepLink: result.affiliateUrl || null,
    affiliateUrl: result.affiliateUrl || null,
    totalPrice: result.priceFrom,
    basePrice: result.priceFrom,
    aiLabel: "Best Value",
    aiTip: crowd.crowdLevel === "high" || crowd.crowdLevel === "very-high" ? `Best around ${bestTime} to reduce queues.` : `Best time ${bestTime || "later afternoon"} for a calmer local stop.`,
    whyItFits: reason,
    category: result.category,
    destination: result.destination,
    city: result.city,
    neighborhood: result.neighborhood,
    rating: result.rating,
    reviewCount: result.reviewCount,
    priceFrom: result.priceFrom,
    currency: result.currency,
    duration: result.duration,
    openingHours: result.openingHours,
    location: result.location,
    seasonFitScore,
    personalityFitScore,
    weatherFitScore,
    crowdFitScore,
    localAuthenticityScore,
    isBookable: Boolean(result.affiliateUrl),
    sourceUrl: result.sourceUrl,
    bestTime,
    crowdNote: crowd.reason,
    categoryLabel: result.category.replaceAll("_", " "),
    selected: false,
  };
}

export async function rankHiddenGemResults(results: HiddenGemProviderCandidate[], rules: HiddenGemRules, input: UserTripInput) {
  const scored = await Promise.all(results.map((result) => scoreHiddenGemResult(result, rules, input)));
  return scored.sort((a, b) => b.confidenceScore - a.confidenceScore);
}

export function filterAffiliateReadyResults(results: HiddenGemResult[]) {
  return results.filter((item) => item.isBookable && item.affiliateUrl);
}

export async function buildHiddenGemRecommendationPayload(input: UserTripInput) {
  const rules = buildRules(input);
  const providerResults = await getHiddenGemCandidates(input);
  const normalized = normalizeHiddenGemProviderResults(providerResults);
  const ranked = await rankHiddenGemResults(normalized, rules, input);
  return {
    all: ranked,
    affiliateReady: filterAffiliateReadyResults(ranked),
  };
}
