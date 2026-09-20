import { logTravelEngine } from "@/lib/travel-engine/logger";
import type { TravelSupplierAdapter } from "@/lib/travel-engine/supplier-adapters/base";
import type { NormalizedTravelItem, SupplierContext } from "@/lib/travel-engine/types";

function buildViatorSearchUrl(query: string, destination: string) {
  const url = new URL("https://www.viator.com/searchResults/all");
  url.searchParams.set("text", `${query} ${destination}`.trim());
  return url.toString();
}

function buildMapsSearchUrl(query: string, destination: string) {
  return `https://www.google.com/maps/search/${encodeURIComponent(`${query} ${destination}`.trim())}`;
}

export class LocalExperienceAdapter implements TravelSupplierAdapter {
  readonly supplier = "gene-local";
  readonly categories = ["activity", "trip", "restaurant", "transport", "event"];

  async search(context: SupplierContext): Promise<NormalizedTravelItem[]> {
    const destination = context.destinationCity || context.destination;
    const interests = (context.interests || []).join(" ").toLowerCase();
    const activityCore =
      /food|market|cafe/.test(interests)
        ? `${destination} chef-led food walk`
        : /museum|history|culture/.test(interests)
        ? `${destination} old town heritage tour`
        : /beach|nature|outdoor|hiking/.test(interests)
        ? `${destination} coastal escape day`
        : `${destination} signature city experience`;

    const items: NormalizedTravelItem[] = [
      {
        internal_id: `local-activity-${context.destinationId}-1`,
        supplier: "viator",
        supplier_item_id: `${context.destinationId}-activity-1`,
        category: "activity",
        title: activityCore,
        destination_id: context.destinationId,
        lat: null,
        lng: null,
        timezone: "UTC",
        price_snapshot: 75,
        rating_snapshot: 4.7,
        duration_minutes: context.activityIntensity === "light" ? 120 : 180,
        start_time_local: "10:00",
        end_time_local: context.activityIntensity === "light" ? "12:00" : "13:00",
        availability_state: "available",
        source_url: buildViatorSearchUrl(activityCore, destination),
        affiliate_eligible: true,
        last_validated_at: new Date().toISOString(),
        metadata: {
          categoryLabel: "guided experience",
          weatherFit: "Flexible",
          bestTimeOfDay: "Morning",
          imageUrl: "/bg/ai-skyline.jpg",
        },
      },
      {
        internal_id: `local-trip-${context.destinationId}-1`,
        supplier: "viator",
        supplier_item_id: `${context.destinationId}-trip-1`,
        category: "trip",
        title: `${destination} sunset highlights cruise`,
        destination_id: context.destinationId,
        lat: null,
        lng: null,
        timezone: "UTC",
        price_snapshot: 110,
        rating_snapshot: 4.8,
        duration_minutes: 150,
        start_time_local: "17:30",
        end_time_local: "20:00",
        availability_state: "available",
        source_url: buildViatorSearchUrl(`${destination} sunset cruise`, destination),
        affiliate_eligible: true,
        last_validated_at: new Date().toISOString(),
        metadata: {
          categoryLabel: "day trip",
          weatherFit: "Best in clear weather",
          bestTimeOfDay: "Evening",
          imageUrl: "/bg/ai-skyline.jpg",
        },
      },
      {
        internal_id: `local-event-${context.destinationId}-1`,
        supplier: "viator",
        supplier_item_id: `${context.destinationId}-event-1`,
        category: "event",
        title: `${destination} cultural night showcase`,
        destination_id: context.destinationId,
        lat: null,
        lng: null,
        timezone: "UTC",
        price_snapshot: 58,
        rating_snapshot: 4.5,
        duration_minutes: 120,
        start_time_local: "20:00",
        end_time_local: "22:00",
        availability_state: "limited",
        source_url: buildViatorSearchUrl(`${destination} evening show`, destination),
        affiliate_eligible: true,
        last_validated_at: new Date().toISOString(),
        metadata: {
          categoryLabel: "event",
          imageUrl: "/bg/ai-skyline.jpg",
        },
      },
      {
        internal_id: `local-restaurant-${context.destinationId}-1`,
        supplier: "maps",
        supplier_item_id: `${context.destinationId}-restaurant-1`,
        category: "restaurant",
        title: `${destination} tasting table`,
        destination_id: context.destinationId,
        lat: null,
        lng: null,
        timezone: "UTC",
        price_snapshot: 42,
        rating_snapshot: 4.6,
        duration_minutes: 90,
        start_time_local: "19:00",
        end_time_local: "20:30",
        availability_state: "needs_revalidation",
        source_url: buildMapsSearchUrl(`${destination} fine dining`, destination),
        affiliate_eligible: false,
        last_validated_at: new Date().toISOString(),
        metadata: {
          cuisine: "Local tasting menu",
          mealWindow: "Dinner",
          imageUrl: "/bg/ai-skyline.jpg",
        },
      },
      {
        internal_id: `local-transport-${context.destinationId}-1`,
        supplier: "gene-local",
        supplier_item_id: `${context.destinationId}-transport-1`,
        category: "transport",
        title:
          context.travelStyle?.includes("luxury") || context.travelStyle?.includes("private")
            ? "Private arrival transfer"
            : "Metro + short transfer combo",
        destination_id: context.destinationId,
        lat: null,
        lng: null,
        timezone: "UTC",
        price_snapshot: context.travelStyle?.includes("luxury") ? 48 : 14,
        rating_snapshot: 4.3,
        duration_minutes: context.travelStyle?.includes("luxury") ? 45 : 60,
        start_time_local: "13:00",
        end_time_local: "14:00",
        availability_state: "needs_revalidation",
        source_url: null,
        affiliate_eligible: false,
        last_validated_at: new Date().toISOString(),
        metadata: {
          transportType: context.travelStyle?.includes("luxury") ? "private transfer" : "metro + taxi",
          costLabel: context.travelStyle?.includes("luxury") ? "Door-to-door" : "Budget friendly",
        },
      },
    ];

    logTravelEngine("info", "supplier.local.content", {
      destinationId: context.destinationId,
      count: items.length,
    });

    return items;
  }
}
