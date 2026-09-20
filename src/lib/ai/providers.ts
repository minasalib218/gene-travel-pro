import type { PlanInputPayload } from "@/lib/validations/plan-input";
import { fetchNormalizedTravelInventory } from "@/lib/travel-engine/recommendation-engine";
import type { RankedTravelItem, TravelItemCategory } from "@/lib/travel-engine/types";

export type ProviderHotel = {
  name: string;
  price?: number;
  currency?: string;
  location?: string;
  deepLink?: string | null;
  normalizedItem?: RankedTravelItem;
};

export type ProviderFlight = {
  airline: string;
  routeLabel: string;
  price?: number;
  currency?: string;
  deepLink?: string | null;
  baggageAllowanceLbs?: number;
  overweightFee51To70?: number;
  overweightFee71To99?: number;
  normalizedItem?: RankedTravelItem;
};

export type ProviderActivity = {
  name: string;
  category?: string;
  price?: number;
  currency?: string;
  deepLink?: string | null;
  normalizedItem?: RankedTravelItem;
};

type ProviderTransport = {
  name: string;
  category?: string;
  price?: number;
  currency?: string;
  deepLink?: string | null;
  normalizedItem?: RankedTravelItem;
};

function firstDestination(payload?: PlanInputPayload) {
  return payload?.trip.destinations?.[0];
}

function mapHotels(items: RankedTravelItem[]): ProviderHotel[] {
  return items.map((item) => ({
    name: item.title,
    location: String(item.metadata.area || item.destination_id),
    price: item.price_snapshot ?? undefined,
    currency: String(item.metadata.currency || "USD"),
    deepLink: item.source_url,
    normalizedItem: item,
  }));
}

function mapFlights(items: RankedTravelItem[], departureCity: string, destination: string): ProviderFlight[] {
  return items.map((item) => ({
    airline: String(item.metadata.airline || item.title.split(" ")[0] || "Selected airline"),
    routeLabel: String(item.metadata.routeLabel || `${departureCity} -> ${destination}`),
    price: item.price_snapshot ?? undefined,
    currency: String(item.metadata.currency || "USD"),
    deepLink: item.source_url,
    baggageAllowanceLbs: Number(item.metadata.baggageAllowanceLbs || 50),
    overweightFee51To70: 100,
    overweightFee71To99: 200,
    normalizedItem: item,
  }));
}

function mapActivities(items: RankedTravelItem[]): ProviderActivity[] {
  return items.map((item) => ({
    name: item.title,
    category: String(item.metadata.categoryLabel || item.category),
    price: item.price_snapshot ?? undefined,
    currency: String(item.metadata.currency || "USD"),
    deepLink: item.source_url,
    normalizedItem: item,
  }));
}

function mapCategory(
  inventory: Record<TravelItemCategory, RankedTravelItem[]>,
  category: TravelItemCategory,
) {
  return inventory[category] || [];
}

export async function fetchProviderData(payload: {
  destination: string;
  startDate: string;
  endDate: string;
  departureCity: string;
  adults: number;
  kids: number;
  directOnly: boolean;
  interests: string[];
  fullPayload?: PlanInputPayload;
}) {
  const stop = firstDestination(payload.fullPayload);
  const inventory = await fetchNormalizedTravelInventory({
    destination: payload.destination,
    destinationId: stop?.id || "primary",
    departureCity: payload.departureCity,
    departureCountry: payload.fullPayload?.trip.travellingFrom?.country,
    startDate: payload.startDate,
    endDate: payload.endDate,
    currency: "USD",
    budget: payload.fullPayload?.budget.totalBudget || 0,
    travelerCount: payload.fullPayload?.trip.travelersCount || Math.max(payload.adults + payload.kids, 1),
    adults: payload.fullPayload?.trip.adults || payload.adults,
    children: payload.fullPayload?.trip.kids || payload.kids,
    elderly: payload.fullPayload?.trip.elderly || 0,
    directFlightsOnly: payload.directOnly,
    interests: payload.interests,
    travelStyle: payload.fullPayload?.budget.travelLevel || payload.fullPayload?.style.travelStyles?.join(", "),
    tripPersonality: payload.fullPayload?.style.tripPersonality || [],
    activityIntensity: payload.fullPayload?.activities.activityIntensity,
    destinationCity: stop?.city || payload.destination,
    destinationCountry: stop?.country || payload.destination,
  });

  const activities = [
    ...mapCategory(inventory, "activity"),
    ...mapCategory(inventory, "trip"),
    ...mapCategory(inventory, "event"),
  ];

  return {
    hotels: mapHotels(inventory.hotel).slice(0, 3),
    flights: mapFlights(inventory.flight, payload.departureCity, payload.destination).slice(0, 3),
    activities: mapActivities(activities).slice(0, 6),
    transports: mapActivities(mapCategory(inventory, "transport")).slice(0, 3) as ProviderTransport[],
    restaurants: mapActivities(mapCategory(inventory, "restaurant")).slice(0, 3),
    rawInventory: inventory,
  };
}
