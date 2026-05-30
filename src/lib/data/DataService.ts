import { searchBookingHotels } from "@/lib/providers/booking";
import { normalizeBookingHotels } from "@/lib/normalize/bookingHotel";

/**
 * DataService
 * - Only layer allowed to talk to provider APIs
 * - Normalizes provider results to internal format
 */

export type ProviderSearchInput = {
  destination: string;
  budget?: number | null;

  // ✅ You requested to support these
  checkIn?: string | null;  // ISO date: "2026-02-17"
  checkOut?: string | null; // ISO date: "2026-02-20"
};

export class DataService {
  /**
   * Example: Hotels for plan
   * Later: call Booking/Trip/Amadeus/etc.
   */
  async getHotelsForPlan(input: ProviderSearchInput) {
    // ✅ now checkIn/checkOut are allowed (no TS error)
    const providerInput: ProviderSearchInput = {
      destination: input.destination,
      budget: input.budget ?? null,
      checkIn: input.checkIn ?? null,
      checkOut: input.checkOut ?? null,
    };

    // TODO: replace with real provider call:
    // return bookingProvider.searchHotels(providerInput);

    return {
      ok: true as const,
      providerInput,
      results: [],
    };
  }
}

export const dataService = new DataService();
await dataService.getHotelsForPlan({
  destination: "Dubai",
  budget: 1500,
  checkIn: "2026-03-01",
  checkOut: "2026-03-05",
});

