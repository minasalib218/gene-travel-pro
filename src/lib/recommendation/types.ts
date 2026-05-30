export type RecommendationCategory =
  | "hotel"
  | "flight"
  | "activity"
  | "restaurant"
  | "transport"
  | "car"
  | "hidden_gem";

export type RecommendationLabel = "Luxury" | "Cheap" | "Best Value";
export type HiddenGemCategory =
  | "underrated_cafe"
  | "hidden_beach"
  | "local_restaurant"
  | "local_market"
  | "local_event"
  | "local_activity"
  | "boutique_experience";

export type HotelUpgrade = {
  id: string;
  name: string;
  extraPrice: number;
  totalPrice: number;
  available: boolean;
  providerData?: unknown;
};

export type BaggageInfo = {
  allowedWeight: number;
  customerWeight: number;
  extraWeight: number;
  extraPrice: number;
  note: string;
};

export type TripDestination = {
  id: string;
  country: string;
  city: string;
  preferredHotel?: string;
  startDate?: string;
  endDate?: string;
  durationNights?: number;
  hotelStars?: number;
  stayType?: string;
  interests?: string[];
  transportType?: string;
  shoppingFocus?: string;
  eventTypes?: string[];
};

export type BudgetCategory =
  | "flights"
  | "lodging"
  | "activities"
  | "transport"
  | "misc";

export type BudgetCategoryTotals = Record<BudgetCategory, number>;

export type BudgetSettings = {
  limits: BudgetCategoryTotals;
  totals: BudgetCategoryTotals;
  remaining: BudgetCategoryTotals;
  collaborativeNotes?: string;
};

export type DestinationResource = {
  key: string;
  title: string;
  description: string;
  href: string | null;
  source: string;
};

export type DestinationAlert = {
  id: string;
  level: "info" | "watch" | "urgent";
  title: string;
  text: string;
  source: string;
};

export type DestinationResources = {
  destinationId: string;
  label: string;
  offlineMaps: DestinationResource[];
  alerts: DestinationAlert[];
};

export type LiveBookingMeta = {
  status: "live" | "fallback" | "unavailable";
  provider: string;
  label: string;
  bookingUrl: string | null;
  price?: number | null;
  currency?: string | null;
};

export type UserTripInput = {
  destination: string;
  departureCity: string;
  startDate: string;
  endDate: string;
  passportCountry?: string;
  transitCountries?: string[];
  passportExpiryDate?: string;
  budget: number;
  currency: string;
  travelStyle: string;
  travelersCount: number;
  travelerType: "family" | "couple" | "solo" | "friends" | "business";
  hotelClass: string;
  interests: string[];
  preferredTransport: string;
  walkingTolerance: number;
  specialRequests: string;
  multiDestinations?: boolean;
  destinations?: TripDestination[];
  tripsPerDay?: number;
  noTripDays?: number;
  daysWithoutTrips?: number[];
  preferredHotels?: string[];
  flexibleDates?: boolean;
  budgetIncludesFlights?: boolean;
  flightBudget?: number;
  baggageWeight?: number;
  shoppingBudget?: number;
  emergencyBufferEnabled?: boolean;
  paceLevel?: number;
  priorities?: string[];
  tripPersonality?: string[];
  stayType?: string;
  roomCount?: number;
  breakfastIncluded?: boolean;
  amenities?: string[];
  directFlightsOnly?: boolean;
  preferredAirlines?: string;
  cabinClass?: string;
  flightTimePreference?: string;
  maxLayoverHours?: number;
  maxTravelTimeBetweenPlaces?: number;
  mustDoList?: string;
  avoidList?: string;
  activityIntensity?: string;
  mobilityNeeds?: string;
  wakeUpTime?: string;
  dailyActiveHours?: number;
  needsRestTime?: boolean;
  foodPreferences?: string[];
  energyFatigueSignals?: string[];
  adults?: number;
  kids?: number;
  elderly?: number;
  fullTripCostEstimate?: number;
  costPerPersonEstimate?: number;
  budgetValidation?: string;
  reviewSummary?: string;
  fullInput?: unknown;
};

export type RecommendationBase = {
  id: string;
  name: string;
  imageUrl: string;
  provider: string;
  sourceBadge: string;
  aiReason: string;
  badge?: string;
  confidenceScore: number;
  freshnessLabel: string;
  fitTags: string[];
  locationLabel?: string;
  areaWarning?: string;
  deepLink?: string | null;
  destinationId?: string;
  destinationLabel?: string;
  liveBooking?: LiveBookingMeta;
  aiLabel?: RecommendationLabel;
  aiTip?: string;
  whyItFits?: string;
  affiliateUrl?: string | null;
  basePrice?: number;
  taxes?: number;
  fees?: number;
  upgradePrice?: number;
  baggageExtraPrice?: number;
  totalPrice?: number;
  selected?: boolean;
};

export type HotelRecommendation = RecommendationBase & {
  area: string;
  rating: number;
  reviewsLabel: string;
  nightlyPrice: number;
  amenities: string[];
  upgrades?: HotelUpgrade[];
  selectedUpgrade?: HotelUpgrade | null;
};

export type FlightRecommendation = RecommendationBase & {
  airline: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  route: string;
  stops: number;
  fare: number;
  baggageAllowanceLbs?: number;
  declaredBaggageWeightLbs?: number;
  baggageFee?: number;
  totalFare?: number;
  baggageInfo?: BaggageInfo;
};

export type ActivityRecommendation = RecommendationBase & {
  duration: string;
  price: number;
  categoryLabel: string;
  bestTimeOfDay: string;
  weatherFit: string;
};

export type RestaurantRecommendation = RecommendationBase & {
  cuisine: string;
  mealWindow: string;
  pricePerPerson: number;
  rating: number;
};

export type TransportRecommendation = RecommendationBase & {
  transportType: string;
  duration: string;
  cost: number;
  costLabel: string;
};

export type CarRecommendation = RecommendationBase & {
  carType: string;
  seats: number;
  luggage: number;
  transmission: string;
  dailyPrice: number;
};

export type HiddenGemResult = RecommendationBase & {
  category: HiddenGemCategory;
  title: string;
  description: string;
  destination: string;
  city?: string;
  neighborhood?: string;
  rating?: number;
  reviewCount?: number;
  priceFrom?: number;
  currency?: string;
  duration?: string;
  openingHours?: string;
  location?: {
    lat?: number;
    lng?: number;
    address?: string;
  };
  seasonFitScore: number;
  personalityFitScore: number;
  weatherFitScore: number;
  crowdFitScore: number;
  localAuthenticityScore: number;
  isBookable: boolean;
  providerItemId?: string;
  sourceUrl?: string;
  bestTime?: string;
  crowdNote?: string;
  categoryLabel?: string;
  tags?: string[];
};

export type RecommendationGroups = {
  hotels: HotelRecommendation[];
  flights: FlightRecommendation[];
  activities: ActivityRecommendation[];
  restaurants: RestaurantRecommendation[];
  transports: TransportRecommendation[];
  cars: CarRecommendation[];
  hiddenGems: HiddenGemResult[];
};

export type SelectedRecommendations = {
  hotel: HotelRecommendation | null;
  flight: FlightRecommendation | null;
  activities: ActivityRecommendation[];
  restaurant: RestaurantRecommendation | null;
  transport: TransportRecommendation | null;
  car: CarRecommendation | null;
  hiddenGems: HiddenGemResult[];
};

export type DayPlanItem = {
  id: string;
  day: number;
  slot: "morning" | "midday" | "afternoon" | "evening";
  type: "flight" | "hotel" | "activity" | "restaurant" | "transport" | "car" | "hidden_gem";
  title: string;
  description: string;
  location?: string;
  imageUrl?: string;
  deepLink?: string | null;
  affiliateUrl?: string | null;
  provider?: string;
  startTime: string;
  endTime: string;
  cost?: number;
  destinationId?: string;
  destinationLabel?: string;
  bufferMinutes?: number;
  crowdLevel?: "low" | "medium" | "high" | "very-high";
  estimatedWaitMinutes?: number;
  bestVisitHours?: string[];
  avoidHours?: string[];
  crowdNote?: string;
  crowdConfidence?: number;
  crowdSource?: "api" | "fallback";
};

export type DayPlan = {
  day: number;
  date: string;
  theme: string;
  items: DayPlanItem[];
};

export type SwapImpactPreview = {
  budgetDelta: number;
  travelTimeDelta: number;
  fatigueDelta: number;
  weatherDelta: number;
  balanceDelta: number;
};

export type AnalysisInsight = {
  key: string;
  title: string;
  icon: string;
  status: "good" | "warn" | "bad";
  text: string;
  value?: number;
};

export type AnalysisModule = {
  key: string;
  title: string;
  value: number;
  label: string;
  description: string;
};

export type SmartBookingScore = {
  itemId: string;
  itemType: "hotel" | "flight" | "activity" | "restaurant" | "transport";
  itemTitle: string;
  valueScore: number;
  locationScore: number;
  walkingScore: number;
  comfortScore: number;
  familyScore: number;
  transportScore: number;
  worthMoneyScore: number;
  overallScore: number;
  confidence: number;
  aiReason: string;
  strengths: string[];
  warnings: string[];
};

export type TravelHappinessScore = {
  enjoymentProbability: number;
  stressProbability: number;
  compatibilityScore: number;
  overallScore: number;
  confidence: number;
  aiSummary: string;
  positiveDrivers: string[];
  riskDrivers: string[];
};

export type VisaEntryAnalysis = {
  destinationCountry: string;
  passportCountry?: string;
  transitCountries?: string[];
  visaRequired: "yes" | "no" | "visa-on-arrival" | "evisa" | "unknown";
  entryRestrictions: string[];
  vaccinationRules: string[];
  transitVisaNotes: string[];
  passportValidityRule: string;
  customsNotes: string[];
  requiredDocuments: string[];
  confidence: number;
  lastChecked?: string;
  aiSummary: string;
  warnings: string[];
  sourceStatus: "api" | "ai-generated-with-disclaimer" | "missing-data";
  countryBreakdown?: Array<{
    country: string;
    visaRequired: "yes" | "no" | "visa-on-arrival" | "evisa" | "unknown";
    note: string;
  }>;
};

export type CinematicStoryDay = {
  dayNumber: number;
  date?: string;
  city?: string;
  country?: string;
  cinematicTitle: string;
  storyLine: string;
  practicalSummary: string;
  mood:
    | "adventure"
    | "romantic"
    | "family"
    | "luxury"
    | "hidden_gems"
    | "relaxed"
    | "nightlife"
    | "culture"
    | "nature"
    | "mixed";
  highlightItems: string[];
  estimatedReadSeconds: number;
  imageUrl?: string;
};

export type CinematicStoryMode = {
  tripTitle: string;
  intro: string;
  days: CinematicStoryDay[];
  endingLine: string;
  shareCaption: string;
  confidence: number;
  generatedAt: string;
};

export type RecommendationSummaryState = {
  bookedItemKeys?: string[];
  budget?: BudgetSettings;
  resources?: DestinationResources[];
  bookingState?: {
    items: Array<{
      id: string;
      key: string;
      type: "flight" | "hotel" | "transportation" | "trip" | "activity" | "event" | "restaurant";
      destinationId?: string;
      title: string;
      provider?: string | null;
      affiliateProvider?: string | null;
      price?: number | null;
      pricePerPerson?: number | null;
      travelerCount: number;
      upgrade?: {
        name: string;
        price: number;
      } | null;
      finalPrice: number;
      status: "pending" | "clicked" | "cancelled";
      affiliateRedirectUrl?: string | null;
      image?: string | null;
      subtitle?: string | null;
    }>;
    totals: {
      flights: number;
      hotels: number;
      transportation: number;
      trips: number;
      events: number;
      restaurants: number;
      totalConfirmedCost: number;
      totalActivities: number;
      bookedClickedCount: number;
      pendingCount: number;
      cancelledCount: number;
    };
    routeOverview?: {
      originLabel?: string | null;
      stopLabels: string[];
    };
  };
};

export type RecommendationPayload = {
  inputs: UserTripInput;
  groups: RecommendationGroups;
  selected: SelectedRecommendations;
  selectedByDestination?: Record<string, SelectedRecommendations>;
  dayPlan: DayPlan[];
  analysis: AnalysisInsight[];
  modules: AnalysisModule[];
  createdAt: string;
  planId?: string;
  mode: "ai" | "provider-fallback";
  aiSummary?: string;
  summaryState?: RecommendationSummaryState;
  livePricing?: Record<string, LiveBookingMeta>;
  cinematicStory?: CinematicStoryMode;
};
