import { buildAffiliateLink } from "@/lib/travel-engine/affiliate-link-service";
import type { BookingReference, RevalidatedBookingResult } from "@/lib/travel-engine/types";

const STALE_AFTER_MS = 1000 * 60 * 60 * 6;

export function revalidateBookingReference(reference: BookingReference): RevalidatedBookingResult {
  const built = buildAffiliateLink(reference);
  if (!built.ok) return built;

  const validatedAt = reference.lastValidatedAt ? new Date(reference.lastValidatedAt).getTime() : 0;
  if (validatedAt && Date.now() - validatedAt > STALE_AFTER_MS) {
    return {
      ...built,
      status: "stale",
      reason: "Supplier data is stale and should be refreshed soon.",
    };
  }

  return built;
}
