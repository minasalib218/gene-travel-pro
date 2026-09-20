import type { BookingReference, RankedTravelItem } from "@/lib/travel-engine/types";

export function buildBookingReferenceFromRankedItem(item: RankedTravelItem): BookingReference {
  return {
    supplier: item.supplier || null,
    supplierItemId: item.supplier_item_id || null,
    sourceUrl: item.source_url || null,
    category: item.category,
    affiliateEligible: item.affiliate_eligible,
    internalId: item.internal_id,
    lastValidatedAt: item.last_validated_at,
  };
}
