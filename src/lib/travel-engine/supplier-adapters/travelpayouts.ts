import { buildTravelpayoutsFlightLegUrl } from "@/lib/providers/travelpayoutsFlights";
import { resolveDestinationCatalogEntry } from "@/lib/travel-engine/destination-catalog";
import { logTravelEngine } from "@/lib/travel-engine/logger";
import type { TravelSupplierAdapter } from "@/lib/travel-engine/supplier-adapters/base";
import type { NormalizedTravelItem, SupplierContext } from "@/lib/travel-engine/types";

function minutesToClock(total: number) {
  const hh = `${Math.floor(total / 60)}`.padStart(2, "0");
  const mm = `${total % 60}`.padStart(2, "0");
  return `${hh}:${mm}`;
}

export class TravelpayoutsFlightAdapter implements TravelSupplierAdapter {
  readonly supplier = "travelpayouts";
  readonly categories = ["flight"];

  async search(context: SupplierContext): Promise<NormalizedTravelItem[]> {
    const destinationEntry = resolveDestinationCatalogEntry(
      context.destinationCity || context.destination,
      context.destinationCountry,
    );
    const routeBase = `${context.departureCity || "Origin"} -> ${destinationEntry.city}`;
    const priceBase = Math.max(220, Math.round((context.budget || 1000) * 0.22));
    const options = [
      { airline: "Emirates", departMinutes: 8 * 60 + 15, durationMinutes: 255, delta: 0, stops: 0 },
      { airline: "Qatar Airways", departMinutes: 11 * 60, durationMinutes: 330, delta: 70, stops: 1 },
      { airline: "Turkish Airlines", departMinutes: 15 * 60 + 20, durationMinutes: 365, delta: 35, stops: 1 },
    ];

    const items = options.map((option, index) => {
      const depart = minutesToClock(option.departMinutes);
      const arrive = minutesToClock(option.departMinutes + option.durationMinutes);
      const sourceUrl =
        buildTravelpayoutsFlightLegUrl({
          originCity: context.departureCity,
          originCountry: context.departureCountry,
          destinationCity: destinationEntry.city,
          destinationCountry: destinationEntry.country,
          departDate: context.startDate,
          returnDate: context.endDate,
          adults: context.adults,
          children: context.children,
          elderly: context.elderly,
          directFlightsOnly: context.directFlightsOnly,
        }) || null;

      return {
        internal_id: `travelpayouts-flight-${context.destinationId}-${index + 1}`,
        supplier: "travelpayouts",
        supplier_item_id: `${context.destinationId}-flight-${index + 1}`,
        category: "flight" as const,
        title: `${option.airline} ${routeBase}`,
        destination_id: context.destinationId,
        lat: null,
        lng: null,
        timezone: destinationEntry.timezone,
        price_snapshot: priceBase + option.delta,
        rating_snapshot: 4.4 - index * 0.1,
        duration_minutes: option.durationMinutes,
        start_time_local: depart,
        end_time_local: arrive,
        availability_state: "available" as const,
        source_url: sourceUrl,
        affiliate_eligible: Boolean(sourceUrl),
        last_validated_at: new Date().toISOString(),
        metadata: {
          airline: option.airline,
          routeLabel: routeBase,
          stops: option.stops,
          baggageAllowanceLbs: 50,
          imageUrl: "/bg/ai-skyline.jpg",
        },
      };
    });

    logTravelEngine("info", "supplier.travelpayouts.flights", {
      destinationId: context.destinationId,
      count: items.length,
    });

    return items;
  }
}
