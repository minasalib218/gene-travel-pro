import type { HotelOption } from "@/lib/types";
import { normalizeBookingHotels } from "@/lib/normalize/bookingHotel";

export type SearchBookingHotelsParams = {
  destination: string;
  checkIn: string; // "YYYY-MM-DD"
  checkOut: string; // "YYYY-MM-DD"
  adults?: number;
  currency?: "USD" | "SAR" | "EGP";
  query?: string;
};

/**
 * Booking Provider (MVP stub)
 * ---------------------------------
 * IMPORTANT: No direct provider calls here yet.
 * You will later replace `raw` with real API response.
 */
export async function searchBookingHotels(
  params: SearchBookingHotelsParams
): Promise<HotelOption[]> {
  // ✅ In MVP, we don't have the Booking API wired yet.
  // Return empty list instead of crashing with "hotels is not defined".
  // Later: call Booking API -> set raw -> normalize.

  const raw = { result: [] as any[] };

  return normalizeBookingHotels(raw, params.currency ?? "USD", {
    destination: params.destination,
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    adults: params.adults ?? 2,
  });
}
