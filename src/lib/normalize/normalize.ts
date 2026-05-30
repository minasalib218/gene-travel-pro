export type HotelOption = {
  provider: "booking" | "tripcom" | "expedia";
  providerId: string;          // hotel id from provider
  title: string;
  city: string;
  price: { amount: number; currency: "USD" | "SAR" | "EGP" };
  rating?: number;
  images: string[];
  deepLink: string;            // ✅ your programmatic affiliate link
  meta: Record<string, any>;   // raw extras if needed
};
