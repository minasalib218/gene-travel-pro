import { logTravelEngine } from "@/lib/travel-engine/logger";
import type { TravelSupplierAdapter } from "@/lib/travel-engine/supplier-adapters/base";
import type { NormalizedTravelItem, SupplierContext } from "@/lib/travel-engine/types";

function buildStay22SearchUrl(context: SupplierContext) {
  const aid = process.env.STAY22_AID?.trim();
  if (!aid) return null;

  const url = new URL("https://www.stay22.com/allez/roam");
  url.searchParams.set("aid", aid);
  url.searchParams.set("address", context.destinationCity || context.destination);
  if (context.startDate) url.searchParams.set("checkin", context.startDate);
  if (context.endDate) url.searchParams.set("checkout", context.endDate);
  url.searchParams.set("adults", String(Math.max(context.adults || context.travelerCount || 1, 1)));
  return url.toString();
}

/** Stay22 Allez is an affiliate search handoff, not hotel inventory. */
export class BookingHotelAdapter implements TravelSupplierAdapter {
  readonly supplier = "stay22";
  readonly categories = ["hotel"];

  async search(context: SupplierContext): Promise<NormalizedTravelItem[]> {
    const sourceUrl = buildStay22SearchUrl(context);
    if (!sourceUrl) {
      logTravelEngine("warn", "supplier.stay22.not_configured", { destinationId: context.destinationId });
      return [];
    }

    const destination = context.destinationCity || context.destination;
    return [{
      internal_id: `stay22-search-${context.destinationId}`,
      supplier: "stay22",
      supplier_item_id: `hotel-search-${context.destinationId}`,
      category: "hotel",
      title: `Search verified stays in ${destination}`,
      destination_id: context.destinationId,
      lat: null,
      lng: null,
      timezone: "UTC",
      price_snapshot: null,
      rating_snapshot: null,
      duration_minutes: null,
      start_time_local: null,
      end_time_local: null,
      availability_state: "needs_revalidation",
      source_url: sourceUrl,
      affiliate_eligible: true,
      last_validated_at: new Date().toISOString(),
      metadata: {
        provider: "stay22",
        dataQuality: "AFFILIATE_SEARCH_LINK",
        bookingActionLabel: "Search with provider",
        availabilityDisclosure: "Hotel availability and price are confirmed on Stay22.",
        currency: context.currency,
      },
    }];
  }
}
