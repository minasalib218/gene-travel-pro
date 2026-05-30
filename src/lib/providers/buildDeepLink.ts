// src/lib/providers/buildDeepLink.ts

type BuildDeepLinkArgs = {
  provider: "booking" | "viator" | "travelpayouts" | "amadeus";
  rawUrl: string;
};

export function buildDeepLink({ provider, rawUrl }: BuildDeepLinkArgs): string {
  // If no env var exists yet, we still return rawUrl (no crash)
  switch (provider) {
    case "booking": {
      const aid = process.env.BOOKING_AFFILIATE_ID;
      if (!aid) return rawUrl;
      const join = rawUrl.includes("?") ? "&" : "?";
      return `${rawUrl}${join}aid=${encodeURIComponent(aid)}`;
    }

    case "viator": {
      const pid = process.env.VIATOR_PARTNER_ID;
      if (!pid) return rawUrl;
      const join = rawUrl.includes("?") ? "&" : "?";
      return `${rawUrl}${join}pid=${encodeURIComponent(pid)}`;
    }

    case "travelpayouts": {
      const marker = process.env.TRAVELPAYOUTS_MARKER;
      if (!marker) return rawUrl;
      const join = rawUrl.includes("?") ? "&" : "?";
      return `${rawUrl}${join}marker=${encodeURIComponent(marker)}`;
    }

    case "amadeus":
      // often Amadeus returns a URL you pass through, or you deep-link elsewhere
      return rawUrl;

    default:
      return rawUrl;
  }
}
