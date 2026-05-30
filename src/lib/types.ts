export type HotelOption = {
  id: string;
  provider: string;        // "booking" | "trip" | "stub"
  providerRef: string;     // provider hotel id
  title: string;

  imageUrl?: string | null;
  affiliateUrl?: string | null;

  priceAmount?: number | null;   // cents
  priceCurrency?: string | null;

  rating?: number | null;
  reviewCount?: number | null;
};
