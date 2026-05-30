import type { HotelOption } from "@/lib/types";
import { buildBookingHotelLink } from "@/lib/affiliates/bookinglinks";

export function normalizeBookingHotels(
  raw: any,
  currency: "USD" | "SAR" | "EGP",
  ctx?: {
    destination?: string;
    checkIn?: string;  // "YYYY-MM-DD"
    checkOut?: string; // "YYYY-MM-DD"
    adults?: number;
  }
): HotelOption[] {
  const items = raw?.result ?? [];

  return items.map((h: any) => {
    const providerId = String(h.hotel_id);

    return {
      provider: "booking",
      providerId,
      title: h.hotel_name ?? "Hotel",
      city: h.city ?? "",
      price: { amount: Number(h.min_total_price ?? 0), currency },
      rating: h.review_score ? Number(h.review_score) : undefined,
      images: h.max_photo_url ? [h.max_photo_url] : [],
      deepLink: buildBookingHotelLink({
        providerId,
        destination: ctx?.destination ?? null,
        checkIn: ctx?.checkIn ?? null,
        checkOut: ctx?.checkOut ?? null,
        adults: ctx?.adults ?? null,
      }),
      meta: { raw: h },
    };
  });
}
