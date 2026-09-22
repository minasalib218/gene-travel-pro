import { buildDeepLink } from "../providers/buildDeepLink.ts";
import { logTravelEngine } from "./logger.ts";
import type { BookingReference, RevalidatedBookingResult } from "./types.ts";

function isHttpUrl(value?: string | null) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function buildAffiliateLink(reference: BookingReference): RevalidatedBookingResult {
  const lastValidatedAt = new Date().toISOString();
  if (!reference.sourceUrl || !isHttpUrl(reference.sourceUrl)) {
    return {
      ok: false,
      status: "unavailable",
      url: null,
      supplier: reference.supplier,
      lastValidatedAt,
      reason: "Missing source URL",
    };
  }

  if (!reference.affiliateEligible || !reference.supplier) {
    return {
      ok: false,
      status: "unavailable",
      url: null,
      supplier: reference.supplier,
      lastValidatedAt,
      reason: "Item is not affiliate eligible",
    };
  }

  const supported =
    reference.supplier === "booking" ||
    reference.supplier === "viator" ||
    reference.supplier === "travelpayouts" ||
    reference.supplier === "amadeus";

  if (!supported) {
    return {
      ok: false,
      status: "unavailable",
      url: null,
      supplier: reference.supplier,
      lastValidatedAt,
      reason: "Supplier is not configured for affiliate redirect",
    };
  }

  const url = buildDeepLink({
    provider: reference.supplier as "booking" | "viator" | "travelpayouts" | "amadeus",
    rawUrl: reference.sourceUrl,
  });

  logTravelEngine("info", "affiliate.generated", {
    supplier: reference.supplier,
    internalId: reference.internalId || null,
    category: reference.category,
  });

  return {
    ok: true,
    status: "ready",
    url,
    supplier: reference.supplier,
    lastValidatedAt,
  };
}
