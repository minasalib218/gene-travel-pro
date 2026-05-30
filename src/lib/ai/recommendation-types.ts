export type ScoredHotel = {
  name: string;
  location: string;
  priceLabel: string;
  reason: string;
  deepLink?: string | null;
};

export type ScoredFlight = {
  name: string;
  route: string;
  priceLabel: string;
  reason: string;
  deepLink?: string | null;
};

export type ScoredActivity = {
  name: string;
  category: string;
  priceLabel: string;
  reason: string;
  deepLink?: string | null;
};

export type RecommendationResult = {
  headline: string;
  summary: string;
  hotels: ScoredHotel[];
  flights: ScoredFlight[];
  activities: ScoredActivity[];
  fitBullets: string[];
  rawAi?: unknown;
};