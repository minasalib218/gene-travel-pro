import { buildTravelpayoutsFlightLegUrl } from "@/lib/providers/travelpayoutsFlights";
import { resolveDestinationCatalogEntry } from "@/lib/travel-engine/destination-catalog";
import { logTravelEngine } from "@/lib/travel-engine/logger";
import type { TravelSupplierAdapter } from "@/lib/travel-engine/supplier-adapters/base";
import type { NormalizedTravelItem, SupplierContext } from "@/lib/travel-engine/types";

export class TravelpayoutsFlightAdapter implements TravelSupplierAdapter {
  readonly supplier = "travelpayouts";
  readonly categories = ["flight"];

  async search(context: SupplierContext): Promise<NormalizedTravelItem[]> {
    const destination = resolveDestinationCatalogEntry(context.destinationCity || context.destination, context.destinationCountry);
    const sourceUrl = buildTravelpayoutsFlightLegUrl({
      originCity: context.departureCity,
      originCountry: context.departureCountry,
      destinationCity: destination.city,
      destinationCountry: destination.country,
      departDate: context.startDate,
      returnDate: context.endDate,
      adults: context.adults,
      children: context.children,
      elderly: context.elderly,
      directFlightsOnly: context.directFlightsOnly,
    });
    if (!sourceUrl) {
      logTravelEngine("warn", "supplier.travelpayouts.no_search_link", { destinationId: context.destinationId, code: "PROVIDER_NO_RESULTS" });
      return [];
    }

    const retrievedAt = new Date().toISOString();
    return [{
      internal_id: `travelpayouts-search-${context.destinationId}`,
      supplier: "travelpayouts",
      supplier_item_id: `search-${context.destinationId}`,
      category: "flight",
      title: `Search flights to ${destination.city}`,
      destination_id: context.destinationId,
      lat: null,
      lng: null,
      timezone: destination.timezone,
      price_snapshot: null,
      rating_snapshot: null,
      duration_minutes: null,
      start_time_local: null,
      end_time_local: null,
      availability_state: "needs_revalidation",
      source_url: sourceUrl,
      affiliate_eligible: true,
      last_validated_at: retrievedAt,
      freshness_expires_at: null,
      data_quality_status: "AFFILIATE_SEARCH_LINK",
      metadata: { providerActionLabel: "Search with provider", currentPriceConfirmed: false, availabilityConfirmed: false },
    }];
  }
}
