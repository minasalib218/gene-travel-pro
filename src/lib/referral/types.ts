export type ReferralCategory = "HOTEL" | "TOUR" | "FLIGHT" | "TRANSPORT";

export type ReferralItem = {
  category: ReferralCategory;

  // required identity
  provider: string;        // "booking" | "viator" | "amadeus" | "your-provider"
  providerId: string;      // id from referral API/provider

  // user-facing info
  title: string;
  subtitle?: string;
  imageUrl?: string;

  price?: number;
  currency?: string;
  rating?: number;
  reviewsCount?: number;

  // ✅ most important: referral tracking URL (what user clicks)
  trackingUrl: string;

  // optional extra data to support filters and your engines
  meta?: Record<string, any>;
};

export type ReferralRecommendations = {
  hotels: ReferralItem[];
  tours: ReferralItem[];
  flights: ReferralItem[];
  transport: ReferralItem[];
};
