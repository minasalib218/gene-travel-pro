import { ReferralRecommendations, ReferralItem, ReferralCategory } from "./types";

type ReferralApiConfig = {
  baseUrl: string;
  apiKey?: string;
};

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export function referralConfig(): ReferralApiConfig {
  return {
    baseUrl: mustEnv("REFERRAL_API_BASE_URL"),
    apiKey: process.env.REFERRAL_API_KEY,
  };
}

async function referralFetch<T>(path: string, body: any): Promise<T> {
  const { baseUrl, apiKey } = referralConfig();

  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Referral API error ${res.status}: ${text}`);
  }

  return (await res.json()) as T;
}

/**
 * These endpoints are examples.
 * Change paths + payload to match your real Referral API docs.
 */
export async function getHotelRecs(payload: any): Promise<ReferralItem[]> {
  return referralFetch<ReferralItem[]>("/recommend/hotels", payload);
}

export async function getTourRecs(payload: any): Promise<ReferralItem[]> {
  return referralFetch<ReferralItem[]>("/recommend/tours", payload);
}

export async function getFlightRecs(payload: any): Promise<ReferralItem[]> {
  return referralFetch<ReferralItem[]>("/recommend/flights", payload);
}

export async function getTransportRecs(payload: any): Promise<ReferralItem[]> {
  return referralFetch<ReferralItem[]>("/recommend/transport", payload);
}

/**
 * Basic validation so we don't store broken items.
 * (No fake — if invalid, we discard.)
 */
export function validateItem(x: any, category: ReferralCategory): x is ReferralItem {
  return (
    x &&
    x.category === category &&
    typeof x.provider === "string" &&
    typeof x.providerId === "string" &&
    typeof x.title === "string" &&
    typeof x.trackingUrl === "string" &&
    x.trackingUrl.startsWith("http")
  );
}

export function normalizeList(list: any[], category: ReferralCategory): ReferralItem[] {
  if (!Array.isArray(list)) return [];
  return list.filter((x) => validateItem(x, category));
}
