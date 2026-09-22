import { fetchNormalizedTravelInventory } from "@/lib/travel-engine/recommendation-engine";
import type {
  ActivityRecommendation,
  CarRecommendation,
  FlightRecommendation,
  HotelRecommendation,
  RestaurantRecommendation,
  TransportRecommendation,
  UserTripInput,
} from "@/lib/recommendation/types";

function baseMeta(item: any) {
  const availabilityState = item.affiliate_eligible ? "ready" : "unavailable";
  return {
    id: item.internal_id,
    internalId: item.internal_id,
    supplierItemId: item.supplier_item_id,
    name: item.title,
    imageUrl: String(item.metadata?.imageUrl || "/bg/ai-skyline.jpg"),
    provider: item.supplier,
    sourceBadge: item.supplier,
    aiReason: item.ranking_reasons?.[0] || "Provider-backed recommendation",
    confidenceScore: item.score || 80,
    freshnessLabel: "Supplier ranked",
    fitTags: item.ranking_reasons || [],
    locationLabel: item.destination_id,
    deepLink: item.source_url,
    sourceUrl: item.source_url,
    affiliateEligible: Boolean(item.affiliate_eligible),
    availabilityState: availabilityState as "ready" | "unavailable",
    lastValidatedAt: item.last_validated_at,
    bookingReference: {
      supplier: item.supplier,
      supplierItemId: item.supplier_item_id,
      sourceUrl: item.source_url,
      category: item.category,
      affiliateEligible: Boolean(item.affiliate_eligible),
      internalId: item.internal_id,
      lastValidatedAt: item.last_validated_at,
    },
    normalizedItem: item,
    totalPrice: item.price_snapshot,
    basePrice: item.price_snapshot,
  };
}

async function getInventory(inputs: UserTripInput) {
  const primaryStop = inputs.destinations?.[0];
  return fetchNormalizedTravelInventory({
    destination: inputs.destination,
    destinationId: primaryStop?.id || "primary",
    startDate: inputs.startDate,
    endDate: inputs.endDate,
    currency: inputs.currency,
    budget: inputs.budget,
    travelerCount: inputs.travelersCount,
    adults: inputs.adults,
    children: inputs.kids,
    elderly: inputs.elderly,
    departureCity: inputs.departureCity,
    departureCountry: (inputs.fullInput as any)?.trip?.travellingFrom?.country,
    directFlightsOnly: inputs.directFlightsOnly,
    interests: inputs.interests,
    travelStyle: inputs.travelStyle,
    tripPersonality: inputs.tripPersonality,
    activityIntensity: inputs.activityIntensity,
    destinationCity: primaryStop?.city || inputs.destination,
    destinationCountry: primaryStop?.country || inputs.destination,
  });
}

export async function getHotelRecommendations(inputs: UserTripInput): Promise<HotelRecommendation[]> {
  const inventory = await getInventory(inputs);
  return inventory.hotel.slice(0, 3).map((item) => ({
    ...baseMeta(item),
    area: String(item.metadata?.area || inputs.destination),
    rating: Number(item.rating_snapshot || 4.5),
    reviewsLabel: "Provider search",
    nightlyPrice: Number(item.price_snapshot || 0),
    amenities: Array.isArray(item.metadata?.amenities) ? (item.metadata.amenities as string[]) : [],
    upgrades: [],
    selectedUpgrade: null,
  }));
}

export async function getFlightRecommendations(inputs: UserTripInput): Promise<FlightRecommendation[]> {
  const inventory = await getInventory(inputs);
  return inventory.flight.slice(0, 3).map((item) => ({
    ...baseMeta(item),
    airline: String(item.metadata?.airline || item.title),
    departureTime: String(item.start_time_local || "09:00"),
    arrivalTime: String(item.end_time_local || "13:00"),
    duration: `${Math.round((item.duration_minutes || 240) / 60)}h ${(item.duration_minutes || 240) % 60}m`,
    route: String(item.metadata?.routeLabel || `${inputs.departureCity} -> ${inputs.destination}`),
    stops: Number(item.metadata?.stops || 0),
    fare: Number(item.price_snapshot || 0),
    totalFare: Number(item.price_snapshot || 0),
    baggageAllowanceLbs: Number(item.metadata?.baggageAllowanceLbs || 50),
  }));
}

export async function getActivityRecommendations(inputs: UserTripInput): Promise<ActivityRecommendation[]> {
  const inventory = await getInventory(inputs);
  return [...inventory.activity, ...inventory.trip, ...inventory.event].slice(0, 6).map((item) => ({
    ...baseMeta(item),
    duration: `${Math.round((item.duration_minutes || 120) / 60)}h ${(item.duration_minutes || 120) % 60}m`,
    price: Number(item.price_snapshot || 0),
    categoryLabel: String(item.metadata?.categoryLabel || item.category),
    bestTimeOfDay: String(item.metadata?.bestTimeOfDay || "Flexible"),
    weatherFit: String(item.metadata?.weatherFit || "Balanced"),
  }));
}

export async function getRestaurantRecommendations(inputs: UserTripInput): Promise<RestaurantRecommendation[]> {
  const inventory = await getInventory(inputs);
  return inventory.restaurant.slice(0, 3).map((item) => ({
    ...baseMeta(item),
    cuisine: String(item.metadata?.cuisine || "Local tasting menu"),
    mealWindow: String(item.metadata?.mealWindow || "Dinner"),
    pricePerPerson: Number(item.price_snapshot || 0),
    rating: Number(item.rating_snapshot || 4.4),
  }));
}

export async function getTransportRecommendations(inputs: UserTripInput): Promise<TransportRecommendation[]> {
  const inventory = await getInventory(inputs);
  return inventory.transport.slice(0, 3).map((item) => ({
    ...baseMeta(item),
    transportType: String(item.metadata?.transportType || "local transfer"),
    duration: `${Math.round((item.duration_minutes || 60) / 60)}h ${(item.duration_minutes || 60) % 60}m`,
    cost: Number(item.price_snapshot || 0),
    costLabel: String(item.metadata?.costLabel || "Estimated"),
  }));
}

export async function getCarRecommendations(_inputs: UserTripInput): Promise<CarRecommendation[]> {
  return [];
}
