import type { RecommendationPayload } from "@/lib/recommendation/types";

export function buildRecommendationPayloadFromSavedPlan(plan: any): RecommendationPayload | null {
  const summaryJson = (plan?.summaryJson as Record<string, any> | null) ?? null;
  if (summaryJson?.payload) return summaryJson.payload as RecommendationPayload;
  if (!summaryJson || !summaryJson.dayPlan) return null;

  const inputsJson = (plan?.inputsJson as Record<string, any> | null) ?? {};
  const recommendationJson = (plan?.recommendationJson as Record<string, any> | null) ?? {};
  const analysisJson = (plan?.analysisJson as Record<string, any> | null) ?? {};

  return {
    inputs: {
      destination: summaryJson.destination || inputsJson.destination || plan.destination,
      departureCity: inputsJson.departureCity || "",
      startDate:
        typeof plan.startDate === "string"
          ? plan.startDate
          : new Date(plan.startDate).toISOString(),
      endDate:
        typeof plan.endDate === "string"
          ? plan.endDate
          : new Date(plan.endDate).toISOString(),
      budget: Number(inputsJson.budget ?? 0),
      currency: String(inputsJson.currency ?? "USD"),
      travelStyle: String(inputsJson.travelStyle ?? "balanced"),
      travelersCount: Number(inputsJson.travelersCount ?? inputsJson.adults ?? 1),
      travelerType: (inputsJson.travelerType ?? inputsJson.travelersType ?? "couple") as any,
      hotelClass: String(inputsJson.hotelClass ?? "4 star"),
      interests: Array.isArray(inputsJson.interests) ? inputsJson.interests : [],
      preferredTransport: String(inputsJson.preferredTransport ?? "private"),
      walkingTolerance: Number(inputsJson.walkingTolerance ?? 60),
      specialRequests: String(inputsJson.specialRequests ?? ""),
      destinations: Array.isArray(inputsJson.trip?.destinations) ? inputsJson.trip.destinations : [],
      preferredHotels: Array.isArray(inputsJson.stay?.preferredHotels) ? inputsJson.stay.preferredHotels : [],
      adults: Number(inputsJson.adults ?? 0),
      kids: Number(inputsJson.kids ?? 0),
      elderly: Number(inputsJson.elderly ?? 0),
      fullInput: inputsJson,
    },
    groups: recommendationJson.groups ?? summaryJson.groups ?? {
      hotels: [],
      flights: [],
      activities: [],
      restaurants: [],
      transports: [],
      cars: [],
      hiddenGems: [],
    },
    selected: recommendationJson.selected ?? summaryJson.selected,
    selectedByDestination:
      recommendationJson.selectedByDestination ?? summaryJson.selectedByDestination ?? undefined,
    dayPlan: summaryJson.dayPlan,
    analysis: analysisJson.analysis ?? summaryJson.analysis ?? [],
    modules: analysisJson.modules ?? summaryJson.modules ?? [],
    createdAt: summaryJson.createdAt ?? new Date().toISOString(),
    planId: summaryJson.planInputId,
    mode: recommendationJson.mode ?? "ai",
    aiSummary: recommendationJson.aiSummary ?? undefined,
    summaryState: summaryJson.payload?.summaryState ?? summaryJson.summaryState ?? undefined,
    livePricing: summaryJson.payload?.livePricing ?? undefined,
    cinematicStory: summaryJson.payload?.cinematicStory ?? summaryJson.cinematicStory ?? undefined,
  };
}
