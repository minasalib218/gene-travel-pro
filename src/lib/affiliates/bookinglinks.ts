export type BookingHotelLinkParams = {
  providerId: string;            // Booking/partner hotel id (or your normalized providerRef)
  destination?: string | null;    // optional
  checkIn?: string | null;        // "YYYY-MM-DD"
  checkOut?: string | null;       // "YYYY-MM-DD"
  adults?: number | null;         // optional
};

export function buildBookingHotelLink(params: BookingHotelLinkParams): string {
  const base = process.env.NEXT_PUBLIC_BOOKING_AFFILIATE_BASE_URL || "https://www.booking.com";
  const aid = process.env.NEXT_PUBLIC_BOOKING_AFFILIATE_AID || ""; // your affiliate id if you have it

  const url = new URL(base);

  // ✅ If you have a real Booking deep link format later, replace this mapping.
  // For now: build a valid URL with your tracking params and allow app to work.
  if (aid) url.searchParams.set("aid", aid);

  // Use providerId in a stable way (you can map to /hotel/... later when provider data is real)
  url.searchParams.set("gene_hotel_id", params.providerId);

  if (params.destination) url.searchParams.set("ss", params.destination);
  if (params.checkIn) url.searchParams.set("checkin", params.checkIn);
  if (params.checkOut) url.searchParams.set("checkout", params.checkOut);
  if (params.adults != null) url.searchParams.set("group_adults", String(params.adults));

  return url.toString();
}
