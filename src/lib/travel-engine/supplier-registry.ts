import { BookingHotelAdapter } from "@/lib/travel-engine/supplier-adapters/booking";
import { LocalExperienceAdapter } from "@/lib/travel-engine/supplier-adapters/local-experiences";
import type { TravelSupplierAdapter } from "@/lib/travel-engine/supplier-adapters/base";
import { TravelpayoutsFlightAdapter } from "@/lib/travel-engine/supplier-adapters/travelpayouts";
import { ViatorExperienceAdapter } from "@/lib/travel-engine/supplier-adapters/viator";
import type { SupplierFeatureFlags } from "@/lib/travel-engine/types";

export function getSupplierFeatureFlags(): SupplierFeatureFlags {
  return {
    // These adapters currently build search candidates rather than retrieving
    // confirmed inventory, so each integration must be explicitly enabled.
    bookingHotels: process.env.GENE_SUPPLIER_BOOKING_HOTELS === "1",
    travelpayoutsFlights: process.env.GENE_SUPPLIER_TRAVELPAYOUTS_FLIGHTS === "1",
    viatorActivities: process.env.GENE_SUPPLIER_VIATOR_ACTIVITIES === "1",
    localRestaurants: process.env.GENE_SUPPLIER_LOCAL_RESTAURANTS === "1",
    localTransport: process.env.GENE_SUPPLIER_LOCAL_TRANSPORT === "1",
    localEvents: process.env.GENE_SUPPLIER_LOCAL_EVENTS === "1",
  };
}

export function getEnabledSupplierAdapters(flags = getSupplierFeatureFlags()): TravelSupplierAdapter[] {
  const adapters: TravelSupplierAdapter[] = [];
  if (flags.bookingHotels) adapters.push(new BookingHotelAdapter());
  if (flags.travelpayoutsFlights) adapters.push(new TravelpayoutsFlightAdapter());
  if (flags.viatorActivities) adapters.push(new ViatorExperienceAdapter());
  if (flags.localRestaurants || flags.localTransport || flags.localEvents) {
    adapters.push(new LocalExperienceAdapter());
  }
  return adapters;
}
