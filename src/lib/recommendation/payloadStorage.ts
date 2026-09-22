import type { RecommendationPayload } from "@/lib/recommendation/types";

const ACTIVE_PAYLOAD_KEY = "gene-recommendation-payload";

function scopedPayloadKey(planId: string) {
  return `${ACTIVE_PAYLOAD_KEY}:${planId}`;
}

export function storeRecommendationPayload(payload: RecommendationPayload) {
  if (typeof window === "undefined") return;

  const serialized = JSON.stringify(payload);
  sessionStorage.setItem(ACTIVE_PAYLOAD_KEY, serialized);

  if (payload.planId) {
    sessionStorage.setItem(scopedPayloadKey(payload.planId), serialized);
  }
}

export function readRecommendationPayload(planId?: string | null) {
  if (typeof window === "undefined") return null;

  const candidates = [
    planId ? scopedPayloadKey(planId) : null,
    ACTIVE_PAYLOAD_KEY,
  ].filter(Boolean) as string[];

  for (const key of candidates) {
    const raw = sessionStorage.getItem(key);
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw) as RecommendationPayload;
      if (!planId || !parsed.planId || parsed.planId === planId) {
        return parsed;
      }
    } catch {
      continue;
    }
  }

  return null;
}
