import { fetchNormalizedTravelInventory } from "@/lib/travel-engine/recommendation-engine";
import type { RankedTravelItem } from "@/lib/travel-engine/types";

export type ProviderItemBase = {
  id: string;
  name: string;
  imageUrl?: string;
  deeplink: string | null;
  priceFrom?: number;
  currency?: string;
  rating?: number;
  durationMin?: number;
  meta?: Record<string, unknown>;
  normalizedItem?: RankedTravelItem;
};

export type ProviderData = {
  hotels: ProviderItemBase[];
  activities: ProviderItemBase[];
  transports: ProviderItemBase[];
  flights: ProviderItemBase[];
  weather?: any;
  map?: any;
};

function mapItems(items: RankedTravelItem[]): ProviderItemBase[] {
  return items.map((item) => ({
    id: item.internal_id,
    name: item.title,
    imageUrl: String(item.metadata.imageUrl || "/bg/ai-skyline.jpg"),
    deeplink: item.source_url,
    priceFrom: item.price_snapshot ?? undefined,
    currency: String(item.metadata.currency || "USD"),
    rating: item.rating_snapshot ?? undefined,
    durationMin: item.duration_minutes ?? undefined,
    meta: item.metadata,
    normalizedItem: item,
  }));
}

export async function aggregateProviderData(args: {
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  currency: string;
}): Promise<ProviderData> {
  const inventory = await fetchNormalizedTravelInventory({
    destination: args.destination,
    destinationId: "primary",
    startDate: args.startDate,
    endDate: args.endDate,
    currency: args.currency,
    budget: args.budget,
    travelerCount: 2,
    destinationCity: args.destination,
    destinationCountry: args.destination,
  });

  return {
    hotels: mapItems(inventory.hotel),
    activities: mapItems([...inventory.activity, ...inventory.trip, ...inventory.event]),
    transports: mapItems(inventory.transport),
    flights: mapItems(inventory.flight),
    weather: {
      summary: "Provider-backed fallback mode",
    },
  };
}
