export type TravelItemCategory =
  | "hotel"
  | "flight"
  | "trip"
  | "activity"
  | "transport"
  | "event"
  | "restaurant"
  | "car";

export type AvailabilityState =
  | "available"
  | "limited"
  | "unavailable"
  | "needs_revalidation";

export type NormalizedTravelItem = {
  internal_id: string;
  supplier: string;
  supplier_item_id: string;
  category: TravelItemCategory;
  title: string;
  destination_id: string;
  lat: number | null;
  lng: number | null;
  timezone: string;
  price_snapshot: number | null;
  rating_snapshot: number | null;
  duration_minutes: number | null;
  start_time_local: string | null;
  end_time_local: string | null;
  availability_state: AvailabilityState;
  source_url: string | null;
  affiliate_eligible: boolean;
  last_validated_at: string;
  metadata: Record<string, unknown>;
};

export type DestinationCatalogEntry = {
  id: string;
  city: string;
  country: string;
  countryCode: string;
  region: string;
  timezone: string;
  lat: number | null;
  lng: number | null;
};

export type SupplierFeatureFlags = {
  bookingHotels: boolean;
  travelpayoutsFlights: boolean;
  viatorActivities: boolean;
  localRestaurants: boolean;
  localTransport: boolean;
  localEvents: boolean;
};

export type SupplierContext = {
  destination: string;
  destinationId: string;
  departureCity?: string;
  departureCountry?: string;
  startDate: string;
  endDate: string;
  currency: string;
  budget: number;
  travelerCount: number;
  adults?: number;
  children?: number;
  elderly?: number;
  directFlightsOnly?: boolean;
  interests?: string[];
  travelStyle?: string;
  tripPersonality?: string[];
  activityIntensity?: string;
  destinationCity?: string;
  destinationCountry?: string;
};

export type RankedTravelItem = NormalizedTravelItem & {
  score: number;
  ranking_reasons: string[];
  warnings: string[];
};

export type TimingWarning = {
  code:
    | "OVERLAP"
    | "LONG_TRAVEL_DAY"
    | "TIGHT_TRANSFER"
    | "CHECKIN_RISK"
    | "MEAL_BUFFER"
    | "REST_BUFFER";
  severity: "info" | "warn" | "critical";
  message: string;
  day: number;
  itemId?: string;
};

export type TimingValidationResult<T> = {
  items: T[];
  warnings: TimingWarning[];
  confidenceNotes: string[];
};

export type BookingReference = {
  supplier: string | null;
  supplierItemId: string | null;
  sourceUrl: string | null;
  category: TravelItemCategory | string;
  affiliateEligible: boolean;
  internalId?: string | null;
  lastValidatedAt?: string | null;
};

export type RevalidatedBookingResult = {
  ok: boolean;
  status: "ready" | "unavailable" | "stale";
  url: string | null;
  supplier: string | null;
  lastValidatedAt: string;
  reason?: string;
};
