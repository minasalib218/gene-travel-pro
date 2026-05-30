"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Globe2,
  MapPin,
  Plus,
  Wallet,
  Sparkles,
  Hotel,
  CalendarDays,
  ShieldCheck,
  Plane,
  Search,
  X,
} from "lucide-react";
import {
  COUNTRY_REGIONS,
  findCountryRecord,
  getAirportsByCountryCity,
  getCountryDepartureOptions,
  searchCitiesByCountry,
  searchCountries,
  type AirportRecord,
  type CountryRecord,
  type DestinationRecord,
} from "@/lib/travelCatalog";
import { getPlannerSuggestions } from "@/lib/travelPreferences";
import { usePass } from "@/hooks/usePass";
import { trackAnalyticsEvent, trackLead } from "@/lib/analytics";

type TravelType = "solo" | "couple" | "family" | "friends" | "business";
type BudgetPer = "total" | "person";
type TravelLevel = "budget" | "mid-range" | "luxury";
type StayType = "hotel" | "apartment" | "resort" | "villa";
type TransportType = "public" | "taxi" | "rental-car" | "private-driver";
type ActivityIntensity = "light" | "balanced" | "intense";
type FlightCabin = "economy" | "premium-economy" | "business" | "first";
type FlightTimePreference = "any" | "morning" | "afternoon" | "evening" | "overnight";
type DestinationBlock = {
  id: string;
  country: string;
  city: string;
  preferredHotel: string;
  startDate?: string;
  endDate?: string;
  durationNights?: number;
  interests?: string[];
  transportType?: TransportType;
  shoppingFocus?: string;
};

type TravelerPassport = {
  travelerIndex: number;
  passportCountry: string;
  passportExpiryDate: string;
};

type FieldErrors = Record<string, string>;

type FormData = {
  trip: {
    destination: string;
    startDate: string;
    endDate: string;
    departureCity: string;
    travellingFrom: {
      country: string;
      city: string;
      airport: string;
    };
    preferredAirport: string;
    passportCountry: string;
    transitCountries: string[];
    passportExpiryDate: string;
    travelersPassport: TravelerPassport[];
    isFlexibleDates: boolean;
    travelersCount: number;
    travelersType: TravelType;
    adults: number;
    kids: number;
    elderly: number;
    destinations: DestinationBlock[];
    tripsPerDay: number;
    noTripDays: number;
    daysWithoutTrips: number[];
  };
  budget: {
    totalBudget: number;
    openBudget: boolean;
    budgetMin: number | null;
    budgetMax: number | null;
    budgetPer: BudgetPer;
    includeFlights: boolean;
    flightBudget: number;
    baggageWeight: number;
    travelLevel: TravelLevel;
    shoppingBudget: number;
    emergencyBuffer: boolean;
  };
  style: {
    travelStyles: string[];
    paceLevel: number;
    priorities: string[];
    tripPersonality: string[];
  };
  stay: {
    stayType: StayType;
    hotelStars: number;
    roomCount: number;
    bedType: string;
    roomType: "single" | "double" | "triple" | "king" | "family" | "suite" | "";
    breakfastIncluded: boolean;
    amenities: string[];
    locationPreference: string;
    preferredHotels: string[];
  };
  flight: {
    directFlightsOnly: boolean;
    preferredAirlines: string;
    cabinClass: FlightCabin;
    flightTimePreference: FlightTimePreference;
    maxLayoverHours: number;
  };
  transport: {
    transportType: TransportType;
  };
  activities: {
    mustDoList: string;
    interests: string[];
    avoidList: string;
    activityIntensity: ActivityIntensity;
  };
  constraints: {
    mobilityNeeds: string;
    wakeUpTime: string;
    dailyActiveHours: number;
    needsRestTime: boolean;
    walkingTolerance: number;
    energyFatigueSignals: string[];
    foodPreferences: string[];
    specialOccasion: string;
    hardConstraints: string;
  };
};

const travelStyleOptions = [
  "relaxing",
  "adventure",
  "romantic",
  "luxury",
  "nature",
  "city",
  "shopping",
  "food",
  "nightlife",
  "culture",
] as const;

const priorityOptions = [
  "price",
  "comfort",
  "experiences",
  "food",
  "luxury",
  "convenience",
  "uniqueness",
] as const;

const tripPersonalityOptions = [
  "Luxury",
  "Exploration",
  "Adventure",
  "Photography Lover",
  "Nightlife Lover",
  "Hidden Gems",
  "Famous Places",
] as const;

const energyFatigueSignalOptions = [
  "Exhaustion Probability",
  "Walking Overload",
  "Heat Stress",
  "Overstimulation",
  "Kid Fatigue",
  "Elderly Fatigue",
  "Jet Lag Effect",
] as const;

const amenityOptions = [
  "pool",
  "gym",
  "spa",
  "kids club",
  "parking",
  "sea view",
] as const;

const interestOptions = [
  "museums",
  "beaches",
  "theme parks",
  "hiking",
  "shopping malls",
  "local markets",
  "cafes",
  "fine dining",
  "boat trips",
  "desert trips",
  "photography",
] as const;

const foodOptions = [
  "halal",
  "vegetarian",
  "vegan",
  "seafood",
  "gluten-free",
  "no pork",
] as const;

const steps = [
  { id: 0, title: "Trip Basics", icon: MapPin },
  { id: 1, title: "Budget", icon: Wallet },
  { id: 2, title: "Style & Mood", icon: Sparkles },
  { id: 3, title: "Stay & Transport", icon: Hotel },
  { id: 4, title: "Experiences", icon: CalendarDays },
  { id: 5, title: "Constraints", icon: ShieldCheck },
  { id: 6, title: "Review", icon: Plane },
] as const;

function createDestinationBlock(seed = 1): DestinationBlock {
  return {
    id: `destination-${seed}-${Math.random().toString(36).slice(2, 8)}`,
    country: "",
    city: "",
    preferredHotel: "",
    startDate: "",
    endDate: "",
    durationNights: 0,
    interests: [],
    transportType: "taxi",
    shoppingFocus: "",
  };
}

function createTravelerPassport(seed = 1): TravelerPassport {
  return {
    travelerIndex: seed,
    passportCountry: "",
    passportExpiryDate: "",
  };
}


const defaultData: FormData = {
  trip: {
    destination: "",
    startDate: "",
    endDate: "",
    departureCity: "",
    travellingFrom: {
      country: "",
      city: "",
      airport: "",
    },
    preferredAirport: "",
    passportCountry: "",
    transitCountries: [],
    passportExpiryDate: "",
    travelersPassport: [createTravelerPassport(1), createTravelerPassport(2)],
    isFlexibleDates: false,
    travelersCount: 2,
    travelersType: "couple",
    adults: 2,
    kids: 0,
    elderly: 0,
    destinations: [createDestinationBlock(1)],
    tripsPerDay: 2,
    noTripDays: 0,
    daysWithoutTrips: [],
  },
  budget: {
    totalBudget: 3000,
    openBudget: false,
    budgetMin: 2000,
    budgetMax: 3000,
    budgetPer: "total",
    includeFlights: true,
    flightBudget: 900,
    baggageWeight: 0,
    travelLevel: "mid-range",
    shoppingBudget: 300,
    emergencyBuffer: true,
  },
  style: {
    travelStyles: ["romantic", "city"],
    paceLevel: 55,
    priorities: ["comfort", "experiences", "convenience"],
    tripPersonality: [],
  },
  stay: {
    stayType: "hotel",
    hotelStars: 4,
    roomCount: 1,
    bedType: "double",
    roomType: "",
    breakfastIncluded: true,
    amenities: ["pool", "gym"],
    locationPreference: "city center",
    preferredHotels: [""],
  },
  flight: {
    directFlightsOnly: false,
    preferredAirlines: "",
    cabinClass: "economy",
    flightTimePreference: "afternoon",
    maxLayoverHours: 3,
  },
  transport: {
    transportType: "taxi",
  },
  activities: {
    mustDoList: "",
    interests: ["cafes", "fine dining", "photography"],
    avoidList: "",
    activityIntensity: "balanced",
  },
  constraints: {
    mobilityNeeds: "",
    wakeUpTime: "08:30",
    dailyActiveHours: 8,
    needsRestTime: true,
    walkingTolerance: 45,
    energyFatigueSignals: [],
    foodPreferences: ["halal"],
    specialOccasion: "",
    hardConstraints: "",
  },
};

function addFieldError(errors: FieldErrors, path: string, message: string) {
  if (!errors[path]) {
    errors[path] = message;
  }
}

function getStepFieldErrors(errors: FieldErrors, step: number) {
  const stepPrefixes =
    step === 0
      ? ["trip."]
      : step === 1
        ? ["budget."]
        : step === 2
          ? ["style."]
          : step === 3
            ? ["stay.", "flight.", "transport."]
            : step === 4
              ? ["activities."]
              : step === 5
                ? ["constraints."]
                : [];

  if (step === 6) return errors;

  return Object.fromEntries(
    Object.entries(errors).filter(([path]) =>
      stepPrefixes.some((prefix) => path.startsWith(prefix)),
    ),
  );
}

function buildStepErrorMessage(stepTitle: string, errors: FieldErrors) {
  const messages = Object.values(errors);
  if (!messages.length) return "";
  if (messages.length === 1) return `${stepTitle}: ${messages[0]}`;
  return `${stepTitle}: ${messages.length} fields still need attention. ${messages[0]}`;
}

export default function AIPlannerPage() {
  const router = useRouter();
  const { loading: passLoading, hasPass, remaining, remainingEditCredits, packageName } = usePass();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [data, setData] = useState<FormData>(defaultData);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [showTravelFromCountrySuggestions, setShowTravelFromCountrySuggestions] = useState(false);
  const [showTravelFromCitySuggestions, setShowTravelFromCitySuggestions] = useState(false);
  const [showDestinationMap, setShowDestinationMap] = useState(false);
  const [activeDestinationIndex, setActiveDestinationIndex] = useState(0);
  const [openPassportIndex, setOpenPassportIndex] = useState(0);

  const tripDays = useMemo(() => {
    if (!data.trip.startDate || !data.trip.endDate) return 0;
    const start = new Date(data.trip.startDate);
    const end = new Date(data.trip.endDate);
    const diff = end.getTime() - start.getTime();
    if (diff < 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, [data.trip.startDate, data.trip.endDate]);

  const dailyBudget = useMemo(() => {
    if (data.budget.openBudget || !tripDays || !data.budget.totalBudget) return 0;
    return Math.round(data.budget.totalBudget / tripDays);
  }, [data.budget.openBudget, tripDays, data.budget.totalBudget]);

  const estimatedEmergencyBuffer = useMemo(
    () => (data.budget.openBudget ? 0 : data.budget.emergencyBuffer ? Math.round(data.budget.totalBudget * 0.12) : 0),
    [data.budget.emergencyBuffer, data.budget.openBudget, data.budget.totalBudget],
  );

  const usableTripBudget = useMemo(
    () => Math.max(data.budget.totalBudget - data.budget.shoppingBudget - estimatedEmergencyBuffer, 0),
    [data.budget.shoppingBudget, data.budget.totalBudget, estimatedEmergencyBuffer],
  );

  const costPerTravelerEstimate = useMemo(() => {
    if (data.budget.openBudget || !data.trip.travelersCount) return 0;
    return Math.round(data.budget.totalBudget / data.trip.travelersCount);
  }, [data.budget.openBudget, data.budget.totalBudget, data.trip.travelersCount]);

  const budgetValidation = useMemo(() => {
    if (data.budget.openBudget) return "Open budget enabled";
    if (usableTripBudget <= 0) return "Budget too low";
    if (tripDays > 0 && usableTripBudget / Math.max(tripDays, 1) < 120) return "Tight budget warning";
    return "Budget looks workable";
  }, [data.budget.openBudget, tripDays, usableTripBudget]);

  const progress = ((step + 1) / steps.length) * 100;

  useEffect(() => {
    const raw = sessionStorage.getItem("gene-planner-inputs");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as FormData;
      setData({
        ...defaultData,
        ...parsed,
        trip: {
          ...defaultData.trip,
          ...parsed.trip,
          destinations: parsed.trip?.destinations?.length ? parsed.trip.destinations : defaultData.trip.destinations,
          travellingFrom: {
            ...defaultData.trip.travellingFrom,
            ...parsed.trip?.travellingFrom,
          },
          travelersPassport:
            parsed.trip?.travelersPassport?.length
              ? parsed.trip.travelersPassport
              : Array.from({ length: parsed.trip?.travelersCount || defaultData.trip.travelersCount }, (_, index) =>
                  createTravelerPassport(index + 1),
                ),
        },
        budget: {
          ...defaultData.budget,
          ...parsed.budget,
        },
        style: {
          ...defaultData.style,
          ...parsed.style,
        },
        stay: {
          ...defaultData.stay,
          ...parsed.stay,
        },
        constraints: {
          ...defaultData.constraints,
          ...parsed.constraints,
        },
      });
    } catch {
      // Ignore corrupted local planner cache.
    }
  }, []);

  useEffect(() => {
    trackLead("ai_planner_started", {
      source: "ai_planner_page",
      includeFlights: data.budget.includeFlights,
    });
    // We only want the planner-start event once when the page becomes active.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    sessionStorage.setItem("gene-planner-inputs", JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    const computedTravelers = data.trip.adults + data.trip.kids + data.trip.elderly;
    if (computedTravelers !== data.trip.travelersCount) {
      updateSection("trip", { travelersCount: computedTravelers });
    }
  }, [data.trip.adults, data.trip.elderly, data.trip.kids]);

  useEffect(() => {
    setData((prev) => {
      const current = prev.trip.travelersPassport || [];
      if (current.length === prev.trip.travelersCount) return prev;
      const next = Array.from({ length: prev.trip.travelersCount }, (_, index) => ({
        travelerIndex: index + 1,
        passportCountry: current[index]?.passportCountry || "",
        passportExpiryDate: current[index]?.passportExpiryDate || "",
      }));
      return {
        ...prev,
        trip: {
          ...prev.trip,
          travelersPassport: next,
        },
      };
    });
    setOpenPassportIndex((current) => Math.min(current, Math.max(data.trip.travelersCount - 1, 0)));
  }, [data.trip.travelersCount]);

  useEffect(() => {
    if (passLoading) return;
    if (!hasPass || remaining <= 0) {
      router.replace("/pricing?access=required");
    }
  }, [hasPass, passLoading, remaining, router]);

  function updateSection<K extends keyof FormData>(
    section: K,
    value: Partial<FormData[K]>
  ) {
    setData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...value,
      },
    }));
  }

  function toggleArrayValue(section: keyof FormData, key: string, value: string) {
    setData((prev) => {
      const sectionData = prev[section] as Record<string, unknown>;
      const current = ((sectionData[key] as string[]) || []).slice();
      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];

      return {
        ...prev,
        [section]: {
          ...sectionData,
          [key]: next,
        },
      } as FormData;
    });
  }

  function syncDestinations(blocks: DestinationBlock[]) {
    setData((prev) => ({
      ...prev,
      trip: {
        ...prev.trip,
        destination: blocks[0]?.country ?? "",
        destinations: blocks,
      },
      stay: {
        ...prev.stay,
        preferredHotels: blocks.map((block) => block.preferredHotel),
      },
    }));
  }

  function updateDestinationBlock(index: number, value: Partial<DestinationBlock>) {
    const nextBlocks = data.trip.destinations.map((block, currentIndex) =>
      currentIndex === index ? { ...block, ...value } : block,
    );
    syncDestinations(nextBlocks);
  }

  function addDestinationBlock() {
    syncDestinations([...data.trip.destinations, createDestinationBlock(data.trip.destinations.length + 1)]);
    setActiveDestinationIndex(data.trip.destinations.length);
  }

  function removeDestinationBlock(index: number) {
    if (data.trip.destinations.length <= 1) return;
    const nextBlocks = data.trip.destinations.filter((_, currentIndex) => currentIndex !== index);
    syncDestinations(nextBlocks);
    setActiveDestinationIndex(Math.max(0, Math.min(activeDestinationIndex, nextBlocks.length - 1)));
  }

  function updatePreferredHotel(index: number, value: string) {
    updateDestinationBlock(index, { preferredHotel: value });
  }

  function toggleRestDay(day: number) {
    setData((prev) => {
      const current = prev.trip.daysWithoutTrips || [];
      const next = current.includes(day)
        ? current.filter((value) => value !== day)
        : [...current, day].sort((a, b) => a - b);
      return {
        ...prev,
        trip: {
          ...prev.trip,
          daysWithoutTrips: next,
          noTripDays: next.length,
        },
      };
    });
  }

  const selectedCountryRecord = useMemo(
    () => findCountryRecord(data.trip.destinations[0]?.country || data.trip.destination),
    [data.trip.destination, data.trip.destinations],
  );

  const cityOptions = useMemo(
    () => getCountryDepartureOptions(selectedCountryRecord?.countryCode),
    [selectedCountryRecord],
  );
  const selectedTravelFromCountryRecord = useMemo(
    () => findCountryRecord(data.trip.travellingFrom.country),
    [data.trip.travellingFrom.country],
  );
  const travelFromCountrySuggestions = useMemo(
    () => searchCountries(data.trip.travellingFrom.country || ""),
    [data.trip.travellingFrom.country],
  );
  const travelFromCitySuggestions = useMemo(
    () => searchCitiesByCountry(selectedTravelFromCountryRecord?.countryCode, data.trip.travellingFrom.city || ""),
    [data.trip.travellingFrom.city, selectedTravelFromCountryRecord],
  );
  const travelFromAirportOptions = useMemo(
    () => getAirportsByCountryCity(selectedTravelFromCountryRecord?.countryCode, data.trip.travellingFrom.city),
    [data.trip.travellingFrom.city, selectedTravelFromCountryRecord],
  );
  const plannerSuggestions = useMemo(
    () => getPlannerSuggestions(selectedCountryRecord?.countryCode),
    [selectedCountryRecord],
  );

  const composedDestination = useMemo(() => {
    const primary = data.trip.destinations[0];
    if (primary?.country && primary?.city) {
      return `${primary.city}, ${primary.country}`;
    }

    return primary?.country || data.trip.destination || "Not selected";
  }, [data.trip.destination, data.trip.destinations]);

  const fieldErrors = useMemo(() => {
    const errors: FieldErrors = {};

    data.trip.destinations.forEach((destination, index) => {
      if (!destination.country.trim()) {
        addFieldError(
          errors,
          `trip.destinations.${index}.country`,
          `Destination ${index + 1} country is required.`,
        );
      }
      if (!destination.city.trim()) {
        addFieldError(
          errors,
          `trip.destinations.${index}.city`,
          `Destination ${index + 1} city is required.`,
        );
      }
    });

    if (!data.trip.startDate) {
      addFieldError(errors, "trip.startDate", "Start date is required.");
    }
    if (!data.trip.endDate) {
      addFieldError(errors, "trip.endDate", "End date is required.");
    } else if (tripDays <= 0) {
      addFieldError(
        errors,
        "trip.endDate",
        "End date must be after the start date.",
      );
    }

    if (data.trip.travelersCount < 1) {
      addFieldError(
        errors,
        "trip.travelersCount",
        "Travelers count must be at least 1.",
      );
    }

    if (data.trip.adults < 1) {
      addFieldError(
        errors,
        "trip.adults",
        "At least one adult traveler is required.",
      );
    }

    if (
      data.trip.travelersCount !==
      data.trip.adults + data.trip.kids + data.trip.elderly
    ) {
      addFieldError(
        errors,
        "trip.travelersCount",
        "Travelers count must equal adults + kids + elderly.",
      );
    }

    if ((data.trip.daysWithoutTrips || []).length > tripDays && tripDays > 0) {
      addFieldError(
        errors,
        "trip.daysWithoutTrips",
        "Locked rest days cannot be more than your trip length.",
      );
    }

    if (data.budget.includeFlights) {
      if (!data.trip.travellingFrom.country.trim()) {
        addFieldError(
          errors,
          "trip.travellingFrom.country",
          "Travelling From country is required when flights are included.",
        );
      }
      if (!data.trip.travellingFrom.city.trim()) {
        addFieldError(
          errors,
          "trip.travellingFrom.city",
          "Travelling From city is required when flights are included.",
        );
      }
      if (!data.trip.travellingFrom.airport.trim()) {
        addFieldError(
          errors,
          "trip.travellingFrom.airport",
          "Travelling From airport is required when flights are included.",
        );
      }
    }

    if (data.trip.travelersPassport.length !== data.trip.travelersCount) {
      addFieldError(
        errors,
        "trip.travelersPassport",
        "Passport details are required for every traveler.",
      );
    }

    data.trip.travelersPassport.forEach((traveler, index) => {
      if (!traveler.passportCountry.trim()) {
        addFieldError(
          errors,
          `trip.travelersPassport.${index}.passportCountry`,
          `Traveler ${traveler.travelerIndex} passport country is required.`,
        );
      }
      if (!traveler.passportExpiryDate) {
        addFieldError(
          errors,
          `trip.travelersPassport.${index}.passportExpiryDate`,
          `Traveler ${traveler.travelerIndex} passport expiry date is required.`,
        );
      } else if (new Date(traveler.passportExpiryDate).getTime() <= Date.now()) {
        addFieldError(
          errors,
          `trip.travelersPassport.${index}.passportExpiryDate`,
          `Traveler ${traveler.travelerIndex} passport expiry date must be in the future.`,
        );
      }
    });

    if (!data.budget.openBudget && data.budget.totalBudget < 0) {
      addFieldError(
        errors,
        "budget.totalBudget",
        "Budget cannot be negative.",
      );
    }

    if (
      data.budget.includeFlights &&
      !data.budget.openBudget &&
      data.budget.flightBudget <= 0
    ) {
      addFieldError(
        errors,
        "budget.flightBudget",
        "Flight budget must be greater than 0 when flights are included.",
      );
    }

    if (data.budget.baggageWeight < 0) {
      addFieldError(
        errors,
        "budget.baggageWeight",
        "Baggage weight cannot be negative.",
      );
    }

    if (data.style.travelStyles.length === 0) {
      addFieldError(
        errors,
        "style.travelStyles",
        "Choose at least one travel style.",
      );
    }

    if (data.style.priorities.length === 0) {
      addFieldError(
        errors,
        "style.priorities",
        "Add at least one priority for the recommendation engine.",
      );
    }

    if (!data.stay.bedType.trim()) {
      addFieldError(errors, "stay.bedType", "Bed type is required.");
    }

    if (!data.stay.locationPreference.trim()) {
      addFieldError(
        errors,
        "stay.locationPreference",
        "Location preference is required.",
      );
    }

    if (data.constraints.dailyActiveHours < 1 || data.constraints.dailyActiveHours > 18) {
      addFieldError(
        errors,
        "constraints.dailyActiveHours",
        "Daily active hours must be between 1 and 18.",
      );
    }

    if (data.constraints.walkingTolerance < 0 || data.constraints.walkingTolerance > 300) {
      addFieldError(
        errors,
        "constraints.walkingTolerance",
        "Walking tolerance must be between 0 and 300 minutes.",
      );
    }

    return errors;
  }, [composedDestination, data, tripDays]);

  const currentStepErrors = useMemo(
    () => getStepFieldErrors(fieldErrors, step),
    [fieldErrors, step],
  );

  const currentStepErrorMessage = useMemo(
    () => buildStepErrorMessage(steps[step]?.title ?? "This step", currentStepErrors),
    [currentStepErrors, step],
  );

  const isCurrentStepValid = Object.keys(currentStepErrors).length === 0;

  useEffect(() => {
    setErrorMessage(currentStepErrorMessage);
  }, [currentStepErrorMessage]);

  function getFieldError(path: string) {
    return currentStepErrors[path] || "";
  }

  const primaryCountrySuggestions = useMemo(
    () => searchCountries(data.trip.destinations[0]?.country || ""),
    [data.trip.destinations],
  );

  const primaryCitySuggestions = useMemo(
    () => searchCitiesByCountry(selectedCountryRecord?.countryCode, data.trip.destinations[0]?.city || ""),
    [data.trip.destinations, selectedCountryRecord],
  );

  function selectCountry(country: CountryRecord, index = 0) {
    const nextCityOptions = getCountryDepartureOptions(country.countryCode);
    const currentCity = data.trip.destinations[index]?.city ?? "";
    const nextCity = nextCityOptions.includes(currentCity) ? currentCity : "";
    updateDestinationBlock(index, { country: country.country, city: nextCity });
    setShowDestinationSuggestions(false);
    setShowCitySuggestions(Boolean(nextCityOptions.length));
    setShowDestinationMap(false);
  }

  function selectCity(destination: DestinationRecord, index = 0) {
    updateDestinationBlock(index, { city: destination.city });
    setShowCitySuggestions(false);
  }

  function selectTravelFromCountry(country: CountryRecord) {
    updateSection("trip", {
      travellingFrom: {
        country: country.country,
        city: "",
        airport: "",
      },
    });
    updateSection("trip", { departureCity: "" });
    setShowTravelFromCountrySuggestions(false);
    setShowTravelFromCitySuggestions(true);
  }

  function selectTravelFromCity(destination: DestinationRecord) {
    updateSection("trip", {
      travellingFrom: {
        ...data.trip.travellingFrom,
        city: destination.city,
        airport: "",
      },
      departureCity: destination.city,
    });
    setShowTravelFromCitySuggestions(false);
  }

  function selectTravelFromAirport(airport: AirportRecord) {
    updateSection("trip", {
      travellingFrom: {
        ...data.trip.travellingFrom,
        airport: `${airport.name} (${airport.code})`,
      },
      preferredAirport: `${airport.name} (${airport.code})`,
    });
  }

  function updateTravelerPassport(index: number, value: Partial<TravelerPassport>) {
    setData((prev) => ({
      ...prev,
      trip: {
        ...prev.trip,
        travelersPassport: prev.trip.travelersPassport.map((traveler, currentIndex) =>
          currentIndex === index ? { ...traveler, ...value } : traveler,
        ),
      },
    }));
  }

  function movePriority(index: number, direction: "up" | "down") {
    setData((prev) => {
      const arr = [...prev.style.priorities];
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= arr.length) return prev;
      [arr[index], arr[target]] = [arr[target], arr[index]];
      return {
        ...prev,
        style: {
          ...prev.style,
          priorities: arr,
        },
      };
    });
  }

  async function handleGenerate() {
    if (Object.keys(fieldErrors).length > 0) {
      const firstInvalidPath = Object.keys(fieldErrors)[0];
      const nextStep = [0, 1, 2, 3, 4, 5].find((stepIndex) =>
        Object.keys(getStepFieldErrors(fieldErrors, stepIndex)).length > 0,
      );
      setErrorMessage(
        buildStepErrorMessage(
          steps[nextStep ?? 0]?.title ?? "Trip Basics",
          getStepFieldErrors(fieldErrors, nextStep ?? 0),
        ),
      );
      setStep(nextStep ?? 0);
      if (firstInvalidPath.startsWith("trip.travelersPassport.")) {
        const passportIndex = Number(firstInvalidPath.split(".")[2]);
        if (!Number.isNaN(passportIndex)) {
          setOpenPassportIndex(passportIndex);
        }
      }
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const reviewSummary = [
        `${composedDestination}`,
        `${tripDays} nights`,
        `${data.trip.travelersCount} travelers`,
        `${data.budget.travelLevel} budget`,
        `${data.style.travelStyles.join(", ")}`,
      ].join(" • ");

      const response = await fetch("/api/plan-inputs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          trip: {
            ...data.trip,
            destination: composedDestination,
            departureCity: data.trip.departureCity || data.trip.travellingFrom.city || "",
            travellingFrom: data.trip.travellingFrom,
            destinations: data.trip.destinations,
            multiDestinations: data.trip.destinations.length > 1,
            flexibleDates: data.trip.isFlexibleDates,
            daysWithoutTrips: data.trip.daysWithoutTrips,
            moreDestinations: Math.max(data.trip.destinations.length - 1, 0),
            preferredAirport: data.trip.travellingFrom.airport || data.trip.preferredAirport,
            passportCountry: data.trip.travelersPassport[0]?.passportCountry || "",
            passportExpiryDate: data.trip.travelersPassport[0]?.passportExpiryDate || "",
            travelersPassport: data.trip.travelersPassport,
          },
          stay: {
            ...data.stay,
            roomType: data.stay.roomType || null,
            preferredHotels: data.trip.destinations.map((item) => item.preferredHotel),
          },
          budget: {
            ...data.budget,
            budgetIncludesFlights: data.budget.includeFlights,
            flightBudget: data.budget.flightBudget,
            baggageWeight: data.budget.baggageWeight,
            totalBudget: data.budget.openBudget ? 0 : data.budget.totalBudget,
            budgetMin: data.budget.openBudget ? null : data.budget.budgetMin,
            budgetMax: data.budget.openBudget ? null : data.budget.budgetMax,
          },
          review: {
            reviewSummary,
            fullTripCostEstimate: data.budget.totalBudget,
            costPerPersonEstimate: costPerTravelerEstimate,
            budgetValidation,
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        const issueMessage =
          result?.issues?.fieldErrors && typeof result.issues.fieldErrors === "object"
            ? Object.values(result.issues.fieldErrors)
                .flat()
                .filter(Boolean)[0]
            : "";
        throw new Error(issueMessage || result?.error || "Failed to create recommendation");
      }

      const planId = result?.planInput?.id;
      if (!planId) {
        throw new Error("No plan id returned from server");
      }

      trackAnalyticsEvent("ai_input_completed", {
        planId,
        travelersCount: data.trip.travelersCount,
        destinationsCount: data.trip.destinations.length,
        includeFlights: data.budget.includeFlights,
        travelLevel: data.budget.travelLevel,
      });

      if (result?.planInputData && result?.recommendation) {
        sessionStorage.setItem(
          `gene-recommendation-bootstrap:${planId}`,
          JSON.stringify({
            planInput: result.planInputData,
            recommendation: result.recommendation,
          }),
        );
      }

      router.push(`/ai/recommendation?planId=${planId}`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong while creating your recommendation.";
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] text-white">
      {!passLoading && (!hasPass || remaining <= 0) ? (
        <div className="relative z-20 flex min-h-screen items-center justify-center px-6">
          <div className="max-w-xl rounded-[28px] border border-white/10 bg-black/55 p-8 text-center shadow-[0_24px_90px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
            <div className="text-[11px] uppercase tracking-[0.28em] text-[#ffb066]">Paid access required</div>
            <h1 className="mt-4 text-3xl font-semibold">Your AI planning access is linked to a paid tier.</h1>
            <p className="mt-4 text-sm leading-7 text-white/68">
              Buy or renew a tier to reopen the planner. Once payment returns from checkout, your profile and plan limits will update automatically.
            </p>
          </div>
        </div>
      ) : null}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{ backgroundImage: "url('/ai-planner-bg.jpg')" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,122,0,0.18),transparent_35%),linear-gradient(to_bottom,rgba(0,0,0,0.2),rgba(0,0,0,0.92))]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 md:px-8 lg:flex-row lg:gap-8 lg:px-12">
        <div className="mb-4 flex w-full justify-start lg:hidden">
          <Link href="/" className="flex items-center">
            <img src="/images/logo.png" alt="Gene Travel" className="h-16 w-auto object-contain" />
          </Link>
        </div>
        <aside className="mb-6 w-full lg:mb-0 lg:max-w-[330px]">
          <div className="rounded-[28px] border border-white/10 bg-white/8 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
            <Link href="/" className="mb-5 hidden items-center lg:flex">
              <img src="/images/logo.png" alt="Gene Travel" className="h-16 w-auto object-contain" />
            </Link>
            <p className="text-xs uppercase tracking-[0.28em] text-white/50">
              Gene Travel Planner
            </p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight">
              Build your smart trip input
            </h1>
            <p className="mt-3 text-sm leading-6 text-white/65">
              Add the details Gene needs to search your APIs and create AI-ranked travel recommendations.
            </p>

            <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[#ff7a00] transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="mt-6 space-y-2">
              {steps.map((item, index) => {
                const Icon = item.icon;
                const active = step === index;
                const done = index < step;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setStep(index)}
                    className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-all duration-300 ${
                      active
                        ? "border-[#ff7a00]/50 bg-[#ff7a00]/12 shadow-[0_0_30px_rgba(255,122,0,0.18)]"
                        : done
                        ? "border-white/10 bg-white/8 hover:bg-white/10"
                        : "border-transparent bg-transparent hover:bg-white/6"
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        active
                          ? "bg-[#ff7a00] text-white"
                          : done
                          ? "bg-white/12 text-white"
                          : "bg-white/8 text-white/70"
                      }`}
                    >
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-white/45">Step {index + 1}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-white/45">
                Your package
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Package</div>
                  <div className="mt-2 text-sm font-medium text-white">{packageName || "No active pass"}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Plan credits</div>
                  <div className="mt-2 text-sm font-medium text-white">{remaining}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Edit credits</div>
                  <div className="mt-2 text-sm font-medium text-white">{remainingEditCredits}</div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-white/45">
                Live summary
              </p>
              <div className="mt-3 space-y-2 text-sm text-white/80">
                <p>
                  <span className="text-white/45">Destination:</span>{" "}
                  {composedDestination}
                </p>
                <p>
                  <span className="text-white/45">Trip length:</span> {tripDays || 0} nights
                </p>
                <p>
                  <span className="text-white/45">Travelers:</span> {data.trip.travelersCount}
                </p>
                <p>
                  <span className="text-white/45">Budget:</span>{" "}
                  {data.budget.openBudget ? "Open budget" : `$${data.budget.totalBudget.toLocaleString()}`}
                </p>
                <p>
                  <span className="text-white/45">Daily target:</span>{" "}
                  {data.budget.openBudget ? "AI matched" : `$${dailyBudget.toLocaleString()}`}
                </p>
              </div>
            </div>
          </div>
        </aside>

        <section className="flex-1">
          <div className="rounded-[32px] border border-white/10 bg-white/8 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl md:p-7 lg:p-8">
            {errorMessage ? (
              <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {errorMessage}
              </div>
            ) : null}

            {Object.keys(currentStepErrors).length ? (
              <div className="mb-6 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.22em] text-red-200/80">
                  Fix these before continuing
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {Object.entries(currentStepErrors)
                    .slice(0, 4)
                    .map(([path, message]) => (
                      <div
                        key={path}
                        className="rounded-full border border-red-400/25 bg-red-500/10 px-3 py-1.5 text-xs text-red-100"
                      >
                        {message}
                      </div>
                    ))}
                </div>
              </div>
            ) : null}

            {step === 0 && (
              <div className="space-y-6">
                <StepHeader
                  title="Trip basics"
                  subtitle="Start with destination, dates and traveler profile."
                />
                 
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-[24px] border border-white/10 bg-black/18 p-4 md:col-span-2">
                    <div className="mb-4">
                      <div className="text-sm font-medium text-white/88">Travelling From</div>
                      <div className="mt-1 text-xs text-white/52">Choose the departure country, city, and airport using the same flow as your destination.</div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      <Field label="Country" error={getFieldError("trip.travellingFrom.country")}>
                        <div className="relative">
                          <Input
                            invalid={Boolean(getFieldError("trip.travellingFrom.country"))}
                            value={data.trip.travellingFrom.country}
                            onChange={(e) => {
                              updateSection("trip", {
                                travellingFrom: {
                                  country: e.target.value,
                                  city: "",
                                  airport: "",
                                },
                                departureCity: "",
                                preferredAirport: "",
                              });
                              setShowTravelFromCountrySuggestions(true);
                              setShowTravelFromCitySuggestions(false);
                            }}
                            onFocus={() => setShowTravelFromCountrySuggestions(true)}
                            onBlur={() => setTimeout(() => setShowTravelFromCountrySuggestions(false), 150)}
                            placeholder="Choose a country"
                          />
                          {showTravelFromCountrySuggestions && travelFromCountrySuggestions.length > 0 ? (
                            <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#050505]/95 shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                              {travelFromCountrySuggestions.map((item) => (
                                <button
                                  key={`from-country-${item.countryCode}`}
                                  type="button"
                                  onClick={() => selectTravelFromCountry(item)}
                                  className="block w-full border-b border-white/10 px-4 py-3 text-left text-sm text-white transition hover:bg-[#ff7a00]/12 hover:text-white last:border-b-0"
                                >
                                  <div className="font-medium">{item.country}</div>
                                  <div className="mt-1 text-xs text-white/55">{item.region} • {item.cities.length} cities</div>
                                </button>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </Field>

                      <Field label="City" error={getFieldError("trip.travellingFrom.city")}>
                        <div className="relative">
                          <Input
                            invalid={Boolean(getFieldError("trip.travellingFrom.city"))}
                            value={data.trip.travellingFrom.city}
                            onChange={(e) => {
                              updateSection("trip", {
                                travellingFrom: {
                                  ...data.trip.travellingFrom,
                                  city: e.target.value,
                                  airport: "",
                                },
                                departureCity: e.target.value,
                                preferredAirport: "",
                              });
                              setShowTravelFromCitySuggestions(true);
                            }}
                            onFocus={() => selectedTravelFromCountryRecord && setShowTravelFromCitySuggestions(true)}
                            onBlur={() => setTimeout(() => setShowTravelFromCitySuggestions(false), 150)}
                            placeholder={selectedTravelFromCountryRecord ? "Choose a city" : "Choose country first"}
                            disabled={!selectedTravelFromCountryRecord}
                          />
                          {showTravelFromCitySuggestions && travelFromCitySuggestions.length > 0 ? (
                            <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#050505]/95 shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                              {travelFromCitySuggestions.map((item) => (
                                <button
                                  key={`from-city-${item.countryCode}-${item.city}`}
                                  type="button"
                                  onClick={() => selectTravelFromCity(item)}
                                  className="block w-full border-b border-white/10 px-4 py-3 text-left text-sm text-white transition hover:bg-[#ff7a00]/12 hover:text-white last:border-b-0"
                                >
                                  <div className="font-medium">{item.city}</div>
                                  <div className="mt-1 text-xs text-white/55">{item.country}</div>
                                </button>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </Field>

                      <Field label="Airport" error={getFieldError("trip.travellingFrom.airport")}>
                        <Select
                          invalid={Boolean(getFieldError("trip.travellingFrom.airport"))}
                          value={data.trip.travellingFrom.airport}
                          onChange={(e) => {
                            updateSection("trip", {
                              travellingFrom: {
                                ...data.trip.travellingFrom,
                                airport: e.target.value,
                              },
                              preferredAirport: e.target.value,
                            });
                          }}
                          disabled={!travelFromAirportOptions.length}
                        >
                          <option value="">
                            {travelFromAirportOptions.length ? "Choose an airport" : "Choose city first"}
                          </option>
                          {travelFromAirportOptions.map((airport) => (
                            <option key={airport.code} value={`${airport.name} (${airport.code})`}>
                              {airport.name} ({airport.code})
                            </option>
                          ))}
                        </Select>
                      </Field>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="block text-sm font-medium text-white/85">Country</span>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={addDestinationBlock}
                          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-xs text-white/75 transition hover:bg-white/10"
                        >
                          <Plus size={14} />
                          Add stop
                        </button>
                      </div>
                    </div>
                    <div className="relative">
                      <Input
                        invalid={Boolean(getFieldError("trip.destinations.0.country"))}
                        value={data.trip.destination}
                        onChange={(e) => {
                          setActiveDestinationIndex(0);
                          updateDestinationBlock(0, { country: e.target.value, city: "" });
                          setShowDestinationSuggestions(true);
                          setShowCitySuggestions(false);
                        }}
                        onFocus={() => {
                          setActiveDestinationIndex(0);
                          setShowDestinationSuggestions(true);
                        }}
                        onBlur={() => {
                          setTimeout(() => setShowDestinationSuggestions(false), 150);
                        }}
                        placeholder="Choose a country"
                      />

                      {showDestinationSuggestions && primaryCountrySuggestions.length > 0 ? (
                        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#050505]/95 shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                          {primaryCountrySuggestions.map((item) => (
                            <button
                              key={`${item.countryCode}-${item.country}`}
                              type="button"
                              onClick={() => selectCountry(item, 0)}
                              className="block w-full border-b border-white/10 px-4 py-3 text-left text-sm text-white transition hover:bg-[#ff7a00]/12 hover:text-white last:border-b-0"
                            >
                              <div className="font-medium">{item.country}</div>
                              <div className="mt-1 text-xs text-white/55">{item.region} • {item.cities.length} cities</div>
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <ValidationText message={getFieldError("trip.destinations.0.country")} />
                    {selectedCountryRecord ? (
                      <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-xs text-white/65">
                        Gene linked this trip to <span className="text-white">{selectedCountryRecord.country}</span>, so the next city field now shows places from the same country.
                      </div>
                    ) : null}
                  </div>

                  <Field
                    label={selectedCountryRecord ? `City in ${selectedCountryRecord.country}` : "City"}
                    error={getFieldError("trip.destinations.0.city")}
                  >
                    <div className="relative">
                      <Input
                        invalid={Boolean(getFieldError("trip.destinations.0.city"))}
                        value={data.trip.destinations[0]?.city ?? ""}
                        onChange={(e) => {
                          setActiveDestinationIndex(0);
                          updateDestinationBlock(0, { city: e.target.value });
                          setShowCitySuggestions(true);
                        }}
                        onFocus={() => {
                          setActiveDestinationIndex(0);
                          selectedCountryRecord && setShowCitySuggestions(true);
                        }}
                        onBlur={() => {
                          setTimeout(() => setShowCitySuggestions(false), 150);
                        }}
                        placeholder={selectedCountryRecord ? "Choose a city" : "Choose a country first"}
                        disabled={!selectedCountryRecord}
                      />

                      {showCitySuggestions && primaryCitySuggestions.length > 0 ? (
                        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#050505]/95 shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                          {primaryCitySuggestions.map((item) => (
                            <button
                              key={`${item.countryCode}-${item.city}`}
                              type="button"
                              onClick={() => selectCity(item, 0)}
                              className="block w-full border-b border-white/10 px-4 py-3 text-left text-sm text-white transition hover:bg-[#ff7a00]/12 hover:text-white last:border-b-0"
                            >
                              <div className="font-medium">{item.city}</div>
                              <div className="mt-1 text-xs text-white/55">{item.country}</div>
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </Field>

                  {data.trip.destinations.slice(1).map((destinationBlock, blockIndex) => {
                    const index = blockIndex + 1;
                    const blockCountryRecord = findCountryRecord(destinationBlock.country);
                    const isActive = index === activeDestinationIndex;
                    const blockCountries = searchCountries(destinationBlock.country);
                    const blockCities = searchCitiesByCountry(blockCountryRecord?.countryCode, destinationBlock.city);

                    return (
                      <div
                        key={destinationBlock.id}
                        className="rounded-[24px] border border-white/10 bg-black/18 p-4 md:col-span-2"
                      >
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-medium text-white/88">Extra destination {index + 1}</div>
                            <div className="mt-1 text-xs text-white/52">
                              Gene will add a new city segment, transfers, and local stay for this stop.
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveDestinationIndex(index);
                                setShowDestinationMap(true);
                              }}
                              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-xs text-white/75 transition hover:bg-white/10"
                            >
                              <MapPin size={14} />
                              Map
                            </button>
                            <button
                              type="button"
                              onClick={() => removeDestinationBlock(index)}
                              className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-xs text-white/72 transition hover:bg-white/10"
                            >
                              Remove
                            </button>
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="relative">
                            <Input
                              invalid={Boolean(getFieldError(`trip.destinations.${index}.country`))}
                              value={destinationBlock.country}
                              onChange={(e) => {
                                setActiveDestinationIndex(index);
                                updateDestinationBlock(index, { country: e.target.value, city: "" });
                                setShowDestinationSuggestions(true);
                                setShowCitySuggestions(false);
                              }}
                              onFocus={() => {
                                setActiveDestinationIndex(index);
                                setShowDestinationSuggestions(true);
                              }}
                              onBlur={() => setTimeout(() => setShowDestinationSuggestions(false), 150)}
                              placeholder="Country"
                            />
                            {isActive && showDestinationSuggestions && blockCountries.length > 0 ? (
                              <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#050505]/95 shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                                {blockCountries.map((item) => (
                                  <button
                                    key={`${destinationBlock.id}-${item.countryCode}`}
                                    type="button"
                                    onClick={() => selectCountry(item, index)}
                                    className="block w-full border-b border-white/10 px-4 py-3 text-left text-sm text-white transition hover:bg-[#ff7a00]/12 hover:text-white last:border-b-0"
                                  >
                                    <div className="font-medium">{item.country}</div>
                                    <div className="mt-1 text-xs text-white/55">{item.region} • {item.cities.length} cities</div>
                                  </button>
                                ))}
                              </div>
                            ) : null}
                            <ValidationText message={getFieldError(`trip.destinations.${index}.country`)} />
                          </div>
                          <div className="relative">
                            <Input
                              invalid={Boolean(getFieldError(`trip.destinations.${index}.city`))}
                              value={destinationBlock.city}
                              onChange={(e) => {
                                setActiveDestinationIndex(index);
                                updateDestinationBlock(index, { city: e.target.value });
                                setShowCitySuggestions(true);
                              }}
                              onFocus={() => {
                                setActiveDestinationIndex(index);
                                blockCountryRecord && setShowCitySuggestions(true);
                              }}
                              onBlur={() => setTimeout(() => setShowCitySuggestions(false), 150)}
                              placeholder={blockCountryRecord ? "City" : "Choose country first"}
                              disabled={!blockCountryRecord}
                            />
                            {isActive && showCitySuggestions && blockCities.length > 0 ? (
                              <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#050505]/95 shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                                {blockCities.map((item) => (
                                  <button
                                    key={`${destinationBlock.id}-${item.city}`}
                                    type="button"
                                    onClick={() => selectCity(item, index)}
                                    className="block w-full border-b border-white/10 px-4 py-3 text-left text-sm text-white transition hover:bg-[#ff7a00]/12 hover:text-white last:border-b-0"
                                  >
                                    <div className="font-medium">{item.city}</div>
                                    <div className="mt-1 text-xs text-white/55">{item.country}</div>
                                  </button>
                                ))}
                              </div>
                            ) : null}
                            <ValidationText message={getFieldError(`trip.destinations.${index}.city`)} />
                          </div>
                          <Input
                            value={destinationBlock.preferredHotel}
                            onChange={(e) => updatePreferredHotel(index, e.target.value)}
                            placeholder="Preferred hotel (optional)"
                          />
                        </div>
                      </div>
                    );
                  })}

                  <Field label="Start date" error={getFieldError("trip.startDate")}>
                    <BrandDateInput
                      invalid={Boolean(getFieldError("trip.startDate"))}
                      value={data.trip.startDate}
                      onChange={(value) => updateSection("trip", { startDate: value })}
                      placeholder="Select start date"
                      rangeStart={data.trip.startDate}
                      rangeEnd={data.trip.endDate}
                    />
                  </Field>

                  <Field label="End date" error={getFieldError("trip.endDate")}>
                    <BrandDateInput
                      invalid={Boolean(getFieldError("trip.endDate"))}
                      value={data.trip.endDate}
                      onChange={(value) => updateSection("trip", { endDate: value })}
                      placeholder="Select end date"
                      rangeStart={data.trip.startDate}
                      rangeEnd={data.trip.endDate}
                    />
                  </Field>

                  <Field label="Travelers count" error={getFieldError("trip.travelersCount")}>
                    <Input
                      invalid={Boolean(getFieldError("trip.travelersCount"))}
                      type="number"
                      min={1}
                      value={data.trip.travelersCount}
                      onChange={(e) =>
                        updateSection("trip", {
                          travelersCount: Number(e.target.value),
                        })
                      }
                    />
                  </Field>

                  <Field label="Traveler type">
                    <Select
                      value={data.trip.travelersType}
                      onChange={(e) =>
                        updateSection("trip", {
                          travelersType: e.target.value as TravelType,
                        })
                      }
                    >
                      <option value="solo">Solo</option>
                      <option value="couple">Couple</option>
                      <option value="family">Family</option>
                      <option value="friends">Friends</option>
                      <option value="business">Business</option>
                    </Select>
                  </Field>

                  <div className="rounded-[24px] border border-white/10 bg-black/18 p-4 md:col-span-2">
                    <div className="mb-4">
                      <div className="text-sm font-medium text-white/88">Passport details per traveler</div>
                      <div className="mt-1 text-xs text-white/52">Each traveler needs a passport country and future expiry date for visa and entry checks.</div>
                    </div>
                    <div className="space-y-3">
                      {data.trip.travelersPassport.map((traveler, index) => {
                        const open = openPassportIndex === index;
                        return (
                          <div
                            key={`traveler-passport-${traveler.travelerIndex}`}
                            className={`rounded-[20px] border bg-black/22 ${
                              getFieldError(`trip.travelersPassport.${index}.passportCountry`) ||
                              getFieldError(`trip.travelersPassport.${index}.passportExpiryDate`)
                                ? "border-red-500/40 shadow-[0_0_0_1px_rgba(239,68,68,0.12)]"
                                : "border-white/10"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => setOpenPassportIndex(open ? -1 : index)}
                              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                            >
                              <div>
                                <div className="text-sm font-medium text-white">Traveler {traveler.travelerIndex}</div>
                                <div className="mt-1 text-xs text-white/50">
                                  {traveler.passportCountry || "Passport country not added"} • {traveler.passportExpiryDate || "Expiry date missing"}
                                </div>
                              </div>
                              <span className="text-xs text-[#ffb066]">{open ? "Hide" : "Edit"}</span>
                            </button>
                            {open ? (
                              <div className="grid gap-4 border-t border-white/10 px-4 py-4 md:grid-cols-2">
                                <Field
                                  label="Passport country"
                                  error={getFieldError(`trip.travelersPassport.${index}.passportCountry`)}
                                >
                                  <Input
                                    invalid={Boolean(getFieldError(`trip.travelersPassport.${index}.passportCountry`))}
                                    value={traveler.passportCountry}
                                    onChange={(e) => {
                                      updateTravelerPassport(index, { passportCountry: e.target.value });
                                      if (index === 0) updateSection("trip", { passportCountry: e.target.value });
                                    }}
                                    placeholder="Traveler nationality / passport country"
                                  />
                                </Field>
                                <Field
                                  label="Passport expiry date"
                                  error={getFieldError(`trip.travelersPassport.${index}.passportExpiryDate`)}
                                >
                                  <Input
                                    invalid={Boolean(getFieldError(`trip.travelersPassport.${index}.passportExpiryDate`))}
                                    type="date"
                                    value={traveler.passportExpiryDate}
                                    onChange={(e) => {
                                      updateTravelerPassport(index, { passportExpiryDate: e.target.value });
                                      if (index === 0) updateSection("trip", { passportExpiryDate: e.target.value });
                                    }}
                                  />
                                </Field>
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <Field label="Transit / layover countries">
                    <Input
                      value={data.trip.transitCountries.join(", ")}
                      onChange={(e) =>
                        updateSection("trip", {
                          transitCountries: e.target.value
                            .split(",")
                            .map((item) => item.trim())
                            .filter(Boolean),
                        })
                      }
                      placeholder="Germany, UAE, Turkey..."
                    />
                  </Field>

                  <Field label="Trips / activities per day">
                    <Input
                      type="number"
                      min={0}
                      max={6}
                      value={data.trip.tripsPerDay}
                      onChange={(e) =>
                        updateSection("trip", {
                          tripsPerDay: Number(e.target.value),
                        })
                      }
                    />
                  </Field>

                  <Field label="Days without trips / activities">
                    <Input
                      type="number"
                      min={0}
                      max={30}
                      value={data.trip.noTripDays}
                      onChange={(e) =>
                        updateSection("trip", {
                          noTripDays: Number(e.target.value),
                        })
                      }
                    />
                  </Field>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <Field label="Adults" error={getFieldError("trip.adults") || getFieldError("trip.travelersCount")}>
                    <Input
                      invalid={Boolean(getFieldError("trip.adults") || getFieldError("trip.travelersCount"))}
                      type="number"
                      min={1}
                      value={data.trip.adults}
                      onChange={(e) =>
                        updateSection("trip", { adults: Number(e.target.value) })
                      }
                    />
                  </Field>
                  <Field label="Kids" error={getFieldError("trip.travelersCount")}>
                    <Input
                      invalid={Boolean(getFieldError("trip.travelersCount"))}
                      type="number"
                      min={0}
                      value={data.trip.kids}
                      onChange={(e) =>
                        updateSection("trip", { kids: Number(e.target.value) })
                      }
                    />
                  </Field>
                  <Field label="Elderly" error={getFieldError("trip.travelersCount")}>
                    <Input
                      invalid={Boolean(getFieldError("trip.travelersCount"))}
                      type="number"
                      min={0}
                      value={data.trip.elderly}
                      onChange={(e) =>
                        updateSection("trip", { elderly: Number(e.target.value) })
                      }
                    />
                  </Field>
                </div>

                <ToggleRow
                  title="Flexible dates"
                  description="Let Gene search nearby dates for better-value recommendations."
                  checked={data.trip.isFlexibleDates}
                  onChange={() =>
                    updateSection("trip", {
                      isFlexibleDates: !data.trip.isFlexibleDates,
                    })
                  }
                />

                {tripDays > 0 ? (
                  <div
                    className={`rounded-3xl border bg-black/20 p-5 ${
                      getFieldError("trip.daysWithoutTrips")
                        ? "border-red-500/35 shadow-[0_0_0_1px_rgba(239,68,68,0.12)]"
                        : "border-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium">Days without trips</p>
                        <p className="mt-1 text-sm text-white/55">
                          Select the exact days Gene should keep as rest / free days.
                        </p>
                      </div>
                      <div className="rounded-full border border-[#ff7a00]/30 bg-[#ff7a00]/10 px-3 py-1 text-sm text-[#ffb066]">
                        {data.trip.daysWithoutTrips.length} locked
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {Array.from({ length: tripDays }, (_, index) => index + 1).map((day) => {
                        const active = data.trip.daysWithoutTrips.includes(day);
                        return (
                          <button
                            key={`rest-day-${day}`}
                            type="button"
                            onClick={() => toggleRestDay(day)}
                            className={`rounded-full border px-4 py-2 text-sm transition ${
                              active
                                ? "border-[#ff7a00]/50 bg-[#ff7a00]/12 text-[#ffbf82]"
                                : "border-white/10 bg-white/6 text-white/75 hover:bg-white/10"
                            }`}
                          >
                            Day {day}
                          </button>
                        );
                      })}
                    </div>
                    <ValidationText message={getFieldError("trip.daysWithoutTrips")} />
                  </div>
                ) : null}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <StepHeader
                  title="Budget intelligence"
                  subtitle="Help the engine distribute your budget across stay, flights, food and activities."
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <ToggleRow
                      title="Open Budget"
                      description="Gene will recommend the best matching options without a fixed budget limit."
                      checked={data.budget.openBudget}
                      onChange={() =>
                        updateSection("budget", {
                          openBudget: !data.budget.openBudget,
                        })
                      }
                    />
                  </div>

                  {!data.budget.openBudget ? (
                    <>
                      <Field label="Total budget ($)" error={getFieldError("budget.totalBudget")}>
                        <Input
                          invalid={Boolean(getFieldError("budget.totalBudget"))}
                          type="number"
                          min={0}
                          value={data.budget.totalBudget}
                          onChange={(e) =>
                            updateSection("budget", {
                              totalBudget: Number(e.target.value),
                              budgetMin: Number(e.target.value) || 0,
                              budgetMax: Number(e.target.value) || 0,
                            })
                          }
                        />
                      </Field>

                      <Field label="Budget is for">
                        <Select
                          value={data.budget.budgetPer}
                          onChange={(e) =>
                            updateSection("budget", {
                              budgetPer: e.target.value as BudgetPer,
                            })
                          }
                        >
                          <option value="total">Total trip</option>
                          <option value="person">Per person</option>
                        </Select>
                      </Field>
                    </>
                  ) : (
                    <div className="rounded-3xl border border-[#ff7a00]/18 bg-[#ff7a00]/8 px-4 py-4 text-sm text-white/76 md:col-span-2">
                      Gene will recommend the best matching options without a fixed budget limit.
                    </div>
                  )}

                  <Field label="Travel level">
                    <Select
                      value={data.budget.travelLevel}
                      onChange={(e) =>
                        updateSection("budget", {
                          travelLevel: e.target.value as TravelLevel,
                        })
                      }
                    >
                      <option value="budget">Budget</option>
                      <option value="mid-range">Mid-range</option>
                      <option value="luxury">Luxury</option>
                    </Select>
                  </Field>

                  {!data.budget.openBudget ? (
                    <Field label="Shopping budget ($)">
                      <Input
                        type="number"
                        min={0}
                        value={data.budget.shoppingBudget}
                        onChange={(e) =>
                          updateSection("budget", {
                            shoppingBudget: Number(e.target.value),
                          })
                        }
                      />
                    </Field>
                  ) : null}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <ToggleRow
                    title="Budget includes flights"
                    description="Needed so Gene scores flight price correctly."
                    checked={data.budget.includeFlights}
                    onChange={() =>
                      updateSection("budget", {
                        includeFlights: !data.budget.includeFlights,
                      })
                    }
                  />
                  <ToggleRow
                    title="Keep emergency buffer"
                    description="Reserve a safety portion of the total budget."
                    checked={data.budget.emergencyBuffer}
                    onChange={() =>
                      updateSection("budget", {
                        emergencyBuffer: !data.budget.emergencyBuffer,
                      })
                    }
                  />
                </div>

                {data.budget.includeFlights && !data.budget.openBudget ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Flight ticket budget ($)" error={getFieldError("budget.flightBudget")}>
                      <Input
                        invalid={Boolean(getFieldError("budget.flightBudget"))}
                        type="number"
                        min={0}
                        value={data.budget.flightBudget}
                        onChange={(e) =>
                          updateSection("budget", {
                            flightBudget: Number(e.target.value),
                          })
                        }
                      />
                    </Field>

                    <Field label="Baggage weight (lbs)" error={getFieldError("budget.baggageWeight")}>
                      <Input
                        invalid={Boolean(getFieldError("budget.baggageWeight"))}
                        type="number"
                        min={0}
                        value={data.budget.baggageWeight}
                        onChange={(e) =>
                          updateSection("budget", {
                            baggageWeight: Number(e.target.value),
                          })
                        }
                      />
                    </Field>
                  </div>
                ) : null}

                <StatCard
                  label="Estimated daily budget"
                  value={`$${dailyBudget.toLocaleString()}`}
                />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <StepHeader
                  title="Style & mood"
                  subtitle="This is where the trip becomes personal instead of generic."
                />

                <div
                  className={`rounded-3xl ${
                    getFieldError("style.travelStyles")
                      ? "border border-red-500/35 p-4 shadow-[0_0_0_1px_rgba(239,68,68,0.12)]"
                      : ""
                  }`}
                >
                  <ChoiceGrid
                    items={plannerSuggestions.travelStyles}
                    selected={data.style.travelStyles}
                    onToggle={(item) => toggleArrayValue("style", "travelStyles", item)}
                  />
                  <ValidationText message={getFieldError("style.travelStyles")} />
                </div>

                <div
                  className={`rounded-3xl border bg-black/20 p-5 ${
                    getFieldError("style.priorities")
                      ? "border-red-500/35 shadow-[0_0_0_1px_rgba(239,68,68,0.12)]"
                      : "border-white/10"
                  }`}
                >
                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-medium text-white/88">AI Trip Personality Engine</p>
                    <p className="text-sm text-white/55">
                      Add stronger personality signals so Gene can shape hotels, timing, dining, and routes more intentionally.
                    </p>
                  </div>
                  <div className="mt-4">
                    <ChoiceGrid
                      items={tripPersonalityOptions}
                      selected={data.style.tripPersonality}
                      onToggle={(item) => toggleArrayValue("style", "tripPersonality", item)}
                    />
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">Pace slider</p>
                      <p className="text-sm text-white/55">
                        Chill on the left, packed on the right.
                      </p>
                    </div>
                    <div className="rounded-full border border-[#ff7a00]/30 bg-[#ff7a00]/10 px-3 py-1 text-sm text-[#ffb066]">
                      {data.style.paceLevel}
                    </div>
                  </div>

                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={data.style.paceLevel}
                    onChange={(e) =>
                      updateSection("style", {
                        paceLevel: Number(e.target.value),
                      })
                    }
                    className="mt-4 h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-[#ff7a00]"
                  />
                </div>

                <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                  <p className="text-sm font-medium">Priority ranking</p>
                  <p className="mt-1 text-sm text-white/55">
                    Rank what matters most for the recommendation engine.
                  </p>

                  <div className="mt-4 space-y-3">
                    {data.style.priorities.map((item, index) => (
                      <div
                        key={item}
                        className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/6 px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ff7a00]/15 text-sm text-[#ffb066]">
                            {index + 1}
                          </div>
                          <span className="capitalize">{item}</span>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => movePriority(index, "up")}
                            className="rounded-xl border border-white/10 px-3 py-1.5 text-sm hover:bg-white/10"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => movePriority(index, "down")}
                            className="rounded-xl border border-white/10 px-3 py-1.5 text-sm hover:bg-white/10"
                          >
                            ↓
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {plannerSuggestions.priorities
                      .filter((item) => !data.style.priorities.includes(item))
                      .map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() =>
                            updateSection("style", {
                              priorities: [...data.style.priorities, item],
                            })
                          }
                          className="rounded-full border border-white/10 bg-white/6 px-3 py-2 text-sm capitalize text-white/75 hover:bg-white/10"
                        >
                          + {item}
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <StepHeader
                  title="Stay & transport"
                  subtitle="Choose how you want to stay, move and fly."
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Stay type">
                    <Select
                      value={data.stay.stayType}
                      onChange={(e) =>
                        updateSection("stay", {
                          stayType: e.target.value as StayType,
                        })
                      }
                    >
                      <option value="hotel">Hotel</option>
                      <option value="apartment">Apartment</option>
                      <option value="resort">Resort</option>
                      <option value="villa">Villa</option>
                    </Select>
                  </Field>

                  <Field label="Hotel stars">
                    <Input
                      type="number"
                      min={1}
                      max={5}
                      value={data.stay.hotelStars}
                      onChange={(e) =>
                        updateSection("stay", {
                          hotelStars: Number(e.target.value),
                        })
                      }
                    />
                  </Field>

                  <Field label="Rooms">
                    <Input
                      type="number"
                      min={1}
                      value={data.stay.roomCount}
                      onChange={(e) =>
                        updateSection("stay", {
                          roomCount: Number(e.target.value),
                        })
                      }
                    />
                  </Field>

                  <Field label="Bed type" error={getFieldError("stay.bedType")}>
                    <Select
                      invalid={Boolean(getFieldError("stay.bedType"))}
                      value={data.stay.bedType}
                      onChange={(e) =>
                        updateSection("stay", { bedType: e.target.value })
                      }
                    >
                      {plannerSuggestions.bedTypes.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>

                <Field label="Kind of Room">
                  <ChoiceGrid
                    items={["Single room", "Double room", "Triple room", "King bed", "Family room", "Suite"]}
                    selected={data.stay.roomType ? [data.stay.roomType] : []}
                    onToggle={(item) => {
                      const roomTypeMap: Record<string, FormData["stay"]["roomType"]> = {
                        "Single room": "single",
                        "Double room": "double",
                        "Triple room": "triple",
                        "King bed": "king",
                        "Family room": "family",
                        Suite: "suite",
                      };
                      const next = roomTypeMap[item];
                      updateSection("stay", { roomType: data.stay.roomType === next ? "" : next });
                    }}
                  />
                </Field>

                <Field label="Amenities">
                  <ChoiceGrid
                    items={plannerSuggestions.amenities}
                    selected={data.stay.amenities}
                    onToggle={(item) => toggleArrayValue("stay", "amenities", item)}
                  />
                </Field>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Location preference" error={getFieldError("stay.locationPreference")}>
                    <Select
                      invalid={Boolean(getFieldError("stay.locationPreference"))}
                      value={data.stay.locationPreference}
                      onChange={(e) =>
                        updateSection("stay", {
                          locationPreference: e.target.value,
                        })
                      }
                    >
                      {plannerSuggestions.locationPreferences.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </Select>
                  </Field>

                  <ToggleRow
                    title="Breakfast included"
                    description="Useful for family flow and early activity days."
                    checked={data.stay.breakfastIncluded}
                    onChange={() =>
                      updateSection("stay", {
                        breakfastIncluded: !data.stay.breakfastIncluded,
                      })
                    }
                  />
                </div>

                <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                  <div>
                    <p className="text-sm font-medium">Preferred hotels by stop</p>
                    <p className="mt-1 text-sm text-white/55">
                      Add one preferred hotel or district for each destination if you already have a favorite.
                    </p>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {data.trip.destinations.map((destinationBlock, index) => (
                      <Field
                        key={`${destinationBlock.id}-preferred-hotel`}
                        label={`${destinationBlock.city || `Destination ${index + 1}`} hotel`}
                      >
                        <Input
                          value={destinationBlock.preferredHotel}
                          onChange={(e) => updatePreferredHotel(index, e.target.value)}
                          placeholder="Hotel or neighborhood"
                        />
                      </Field>
                    ))}
                  </div>
                  <ValidationText message={getFieldError("style.priorities")} />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <ToggleRow
                    title="Direct flights only"
                    description="Remove layovers from flight results."
                    checked={data.flight.directFlightsOnly}
                    onChange={() =>
                      updateSection("flight", {
                        directFlightsOnly: !data.flight.directFlightsOnly,
                      })
                    }
                  />

                  <Field label="Preferred airlines">
                    <Select
                      value={data.flight.preferredAirlines}
                      onChange={(e) =>
                        updateSection("flight", {
                          preferredAirlines: e.target.value,
                        })
                      }
                    >
                      {plannerSuggestions.preferredAirlines.map((item) => (
                        <option key={item} value={item === "Any" ? "" : item}>
                          {item}
                        </option>
                      ))}
                    </Select>
                  </Field>

                  <Field label="Cabin class">
                    <Select
                      value={data.flight.cabinClass}
                      onChange={(e) =>
                        updateSection("flight", {
                          cabinClass: e.target.value as FlightCabin,
                        })
                      }
                    >
                      <option value="economy">Economy</option>
                      <option value="premium-economy">Premium economy</option>
                      <option value="business">Business</option>
                      <option value="first">First</option>
                    </Select>
                  </Field>

                  <Field label="Flight time preference">
                    <Select
                      value={data.flight.flightTimePreference}
                      onChange={(e) =>
                        updateSection("flight", {
                          flightTimePreference:
                            e.target.value as FlightTimePreference,
                        })
                      }
                    >
                      <option value="any">Any</option>
                      <option value="morning">Morning</option>
                      <option value="afternoon">Afternoon</option>
                      <option value="evening">Evening</option>
                      <option value="overnight">Overnight</option>
                    </Select>
                  </Field>

                  <Field label="Max layover hours">
                    <Input
                      type="number"
                      min={0}
                      max={24}
                      value={data.flight.maxLayoverHours}
                      onChange={(e) =>
                        updateSection("flight", {
                          maxLayoverHours: Number(e.target.value),
                        })
                      }
                    />
                  </Field>

                  <Field label="Transport type">
                    <Select
                      value={data.transport.transportType}
                      onChange={(e) =>
                        updateSection("transport", {
                          transportType: e.target.value as TransportType,
                        })
                      }
                    >
                      {plannerSuggestions.transportTypes.map((item) => (
                        <option key={item} value={item}>
                          {item === "public"
                            ? "Public transport"
                            : item === "taxi"
                              ? "Taxi / Uber"
                              : item === "rental-car"
                                ? "Rental car"
                                : "Private driver"}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>

              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <StepHeader
                  title="Experiences"
                  subtitle="Tell Gene what the trip should include — and what it should avoid."
                />

                <Field label="Must-do experiences">
                  <Select
                    value={data.activities.mustDoList}
                    onChange={(e) =>
                      updateSection("activities", {
                        mustDoList: e.target.value,
                      })
                    }
                  >
                    <option value="">Choose a must-do</option>
                    {plannerSuggestions.mustDo.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Interests">
                  <ChoiceGrid
                    items={plannerSuggestions.interests}
                    selected={data.activities.interests}
                    onToggle={(item) =>
                      toggleArrayValue("activities", "interests", item)
                    }
                  />
                </Field>

                <Field label="Avoid list">
                  <Select
                    value={data.activities.avoidList}
                    onChange={(e) =>
                      updateSection("activities", {
                        avoidList: e.target.value,
                      })
                    }
                  >
                    <option value="">Choose what to avoid</option>
                    {plannerSuggestions.avoid.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Activity intensity">
                  <Select
                    value={data.activities.activityIntensity}
                    onChange={(e) =>
                      updateSection("activities", {
                        activityIntensity: e.target.value as ActivityIntensity,
                      })
                    }
                  >
                    <option value="light">Light</option>
                    <option value="balanced">Balanced</option>
                    <option value="intense">Intense</option>
                  </Select>
                </Field>

                <div className="grid gap-4 md:grid-cols-2">
                  <StatCard
                    label="Trips per day"
                    value={String(data.trip.tripsPerDay)}
                  />
                  <StatCard
                    label="No-trip days"
                    value={String(data.trip.noTripDays)}
                  />
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6">
                <StepHeader
                  title="Smart constraints"
                  subtitle="This is the layer that makes the recommendations realistic."
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Mobility needs">
                    <Select
                      value={data.constraints.mobilityNeeds}
                      onChange={(e) =>
                        updateSection("constraints", {
                          mobilityNeeds: e.target.value,
                        })
                      }
                    >
                      <option value="">Choose support level</option>
                      {plannerSuggestions.mobility.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </Select>
                  </Field>

                  <Field label="Wake-up time">
                    <Input
                      type="time"
                      value={data.constraints.wakeUpTime}
                      onChange={(e) =>
                        updateSection("constraints", {
                          wakeUpTime: e.target.value,
                        })
                      }
                    />
                  </Field>

                  <Field label="Daily active hours" error={getFieldError("constraints.dailyActiveHours")}>
                    <Input
                      invalid={Boolean(getFieldError("constraints.dailyActiveHours"))}
                      type="number"
                      min={1}
                      max={18}
                      value={data.constraints.dailyActiveHours}
                      onChange={(e) =>
                        updateSection("constraints", {
                          dailyActiveHours: Number(e.target.value),
                        })
                      }
                    />
                  </Field>

                  <Field label="Walking tolerance (minutes)" error={getFieldError("constraints.walkingTolerance")}>
                    <Input
                      invalid={Boolean(getFieldError("constraints.walkingTolerance"))}
                      type="number"
                      min={0}
                      max={300}
                      value={data.constraints.walkingTolerance}
                      onChange={(e) =>
                        updateSection("constraints", {
                          walkingTolerance: Number(e.target.value),
                        })
                      }
                    />
                  </Field>
                </div>

                <ToggleRow
                  title="Needs rest time each day"
                  description="Reserve a break in the middle of the itinerary."
                  checked={data.constraints.needsRestTime}
                  onChange={() =>
                    updateSection("constraints", {
                      needsRestTime: !data.constraints.needsRestTime,
                    })
                  }
                />

                <Field label="Energy & fatigue prediction engine">
                  <ChoiceGrid
                    items={energyFatigueSignalOptions}
                    selected={data.constraints.energyFatigueSignals}
                    onToggle={(item) =>
                      toggleArrayValue("constraints", "energyFatigueSignals", item)
                    }
                  />
                </Field>

                <Field label="Food preferences">
                  <ChoiceGrid
                    items={plannerSuggestions.foodPreferences}
                    selected={data.constraints.foodPreferences}
                    onToggle={(item) =>
                      toggleArrayValue("constraints", "foodPreferences", item)
                    }
                  />
                </Field>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Special occasion">
                    <Select
                      value={data.constraints.specialOccasion}
                      onChange={(e) =>
                        updateSection("constraints", {
                          specialOccasion: e.target.value,
                        })
                      }
                    >
                      <option value="">Choose occasion</option>
                      {plannerSuggestions.occasions.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </Select>
                  </Field>

                  <Field label="Hard constraints">
                    <TextArea
                      value={data.constraints.hardConstraints}
                      onChange={(e) =>
                        updateSection("constraints", {
                          hardConstraints: e.target.value,
                        })
                      }
                      placeholder="No wake-up before 9 AM, max 2 activities/day..."
                    />
                  </Field>
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="space-y-6">
                <StepHeader
                  title="Review & generate"
                  subtitle="Final check before Gene sends your input to the backend AI recommendation engine."
                />

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <ReviewCard title="Trip">
                    <ReviewRow label="Destination" value={data.trip.destination || "—"} />
                    <ReviewRow
                      label="Dates"
                      value={`${data.trip.startDate || "—"} → ${data.trip.endDate || "—"}`}
                    />
                    <ReviewRow
                      label="Travelling from"
                      value={
                        data.trip.travellingFrom.country || data.trip.travellingFrom.city || data.trip.travellingFrom.airport
                          ? [
                              data.trip.travellingFrom.city,
                              data.trip.travellingFrom.country,
                              data.trip.travellingFrom.airport,
                            ]
                              .filter(Boolean)
                              .join(" • ")
                          : "Not added"
                      }
                    />
                    <ReviewRow
                      label="Traveler passports"
                      value={
                        data.trip.travelersPassport.length
                          ? data.trip.travelersPassport
                              .map((traveler) =>
                                `Traveler ${traveler.travelerIndex}: ${traveler.passportCountry || "No country"}${traveler.passportExpiryDate ? ` (${traveler.passportExpiryDate})` : ""}`,
                              )
                              .join(" | ")
                          : "Not added"
                      }
                    />
                    <ReviewRow
                      label="Transit countries"
                      value={data.trip.transitCountries.length ? data.trip.transitCountries.join(", ") : "None"}
                    />
                    <ReviewRow
                      label="Travelers"
                      value={`${data.trip.travelersCount} (${data.trip.travelersType})`}
                    />
                    <ReviewRow
                      label="Split"
                      value={`${data.trip.adults} adults / ${data.trip.kids} kids / ${data.trip.elderly} elderly`}
                    />
                    <ReviewRow
                      label="Locked rest days"
                      value={
                        data.trip.daysWithoutTrips.length
                          ? data.trip.daysWithoutTrips.map((day) => `Day ${day}`).join(", ")
                          : "None"
                      }
                    />
                  </ReviewCard>

                  <ReviewCard title="Budget">
                    <ReviewRow
                      label="Budget"
                      value={data.budget.openBudget ? "Open budget" : `$${data.budget.totalBudget.toLocaleString()}`}
                    />
                    <ReviewRow label="Open budget" value={data.budget.openBudget ? "On" : "Off"} />
                    <ReviewRow label="Per" value={data.budget.budgetPer} />
                    <ReviewRow
                      label="Flights included"
                      value={data.budget.includeFlights ? "Yes" : "No"}
                    />
                    <ReviewRow
                      label="Daily target"
                      value={data.budget.openBudget ? "AI matched" : `$${dailyBudget.toLocaleString()}`}
                    />
                    <ReviewRow
                      label="Per traveler"
                      value={data.budget.openBudget ? "Flexible" : `$${costPerTravelerEstimate.toLocaleString()}`}
                    />
                    <ReviewRow
                      label="Shopping"
                      value={data.budget.openBudget ? "Flexible" : `$${data.budget.shoppingBudget.toLocaleString()}`}
                    />
                    <ReviewRow
                      label="Flight budget"
                      value={
                        data.budget.includeFlights
                          ? data.budget.openBudget
                            ? "Flexible"
                            : `$${data.budget.flightBudget.toLocaleString()}`
                          : "Not included"
                      }
                    />
                    <ReviewRow
                      label="Baggage"
                      value={data.budget.includeFlights ? `${data.budget.baggageWeight} lbs` : "Hidden"}
                    />
                    <ReviewRow
                      label="Emergency buffer"
                      value={data.budget.openBudget ? "Flexible" : `$${estimatedEmergencyBuffer.toLocaleString()}`}
                    />
                    <ReviewRow label="Validation" value={budgetValidation} />
                  </ReviewCard>

                  <ReviewCard title="Style">
                    <ReviewRow
                      label="Styles"
                      value={data.style.travelStyles.join(", ") || "—"}
                    />
                    <ReviewRow
                      label="Trip personality"
                      value={data.style.tripPersonality.join(", ") || "—"}
                    />
                    <ReviewRow label="Pace" value={String(data.style.paceLevel)} />
                    <ReviewRow
                      label="Top priorities"
                      value={data.style.priorities.slice(0, 3).join(", ")}
                    />
                  </ReviewCard>

                  <ReviewCard title="Stay & flight">
                    <ReviewRow
                      label="Stay"
                      value={`${data.stay.hotelStars}★ ${data.stay.stayType}`}
                    />
                    <ReviewRow
                      label="Location"
                      value={data.stay.locationPreference || "—"}
                    />
                    <ReviewRow
                      label="Kind of room"
                      value={data.stay.roomType ? data.stay.roomType.replace("-", " ") : "Not selected"}
                    />
                    <ReviewRow label="Cabin" value={data.flight.cabinClass} />
                    <ReviewRow
                      label="Direct only"
                      value={data.flight.directFlightsOnly ? "Yes" : "No"}
                    />
                    <ReviewRow
                      label="Preferred airlines"
                      value={data.flight.preferredAirlines || "Any"}
                    />
                  </ReviewCard>

                  <ReviewCard title="Activities">
                    <ReviewRow
                      label="Must-do"
                      value={data.activities.mustDoList || "—"}
                    />
                    <ReviewRow
                      label="Interests"
                      value={data.activities.interests.join(", ") || "—"}
                    />
                    <ReviewRow
                      label="Intensity"
                      value={data.activities.activityIntensity || "—"}
                    />
                    <ReviewRow
                      label="Avoid"
                      value={data.activities.avoidList || "—"}
                    />
                  </ReviewCard>

                  <ReviewCard title="Constraints">
                    <ReviewRow
                      label="Mobility"
                      value={data.constraints.mobilityNeeds || "—"}
                    />
                    <ReviewRow
                      label="Wake-up"
                      value={data.constraints.wakeUpTime || "—"}
                    />
                    <ReviewRow
                      label="Energy & fatigue"
                      value={data.constraints.energyFatigueSignals.join(", ") || "—"}
                    />
                    <ReviewRow
                      label="Food"
                      value={data.constraints.foodPreferences.join(", ") || "—"}
                    />
                    <ReviewRow
                      label="Hard rules"
                      value={data.constraints.hardConstraints || "—"}
                    />
                  </ReviewCard>
                  <ReviewCard title="Stops">
                    <ReviewRow
                      label="Route"
                      value={data.trip.destinations
                        .map((destination) => `${destination.city}, ${destination.country}`)
                        .join(" → ") || "—"}
                    />
                    <ReviewRow
                      label="Flexible dates"
                      value={data.trip.isFlexibleDates ? "Enabled" : "Fixed"}
                    />
                    <ReviewRow
                      label="Rest days"
                      value={data.trip.daysWithoutTrips.length
                        ? data.trip.daysWithoutTrips.map((day) => `Day ${day}`).join(", ")
                        : "None locked"}
                    />
                  </ReviewCard>
                </div>
              </div>
            )}

            <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => setStep((prev) => Math.max(prev - 1, 0))}
                disabled={step === 0 || loading}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/6 px-5 py-3 text-sm font-medium transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={16} /> Back
              </button>

              {step < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((prev) => Math.min(prev + 1, steps.length - 1))}
                  disabled={loading || !isCurrentStepValid}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#ff7a00] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(255,122,0,0.35)] transition hover:scale-[1.02] hover:shadow-[0_14px_36px_rgba(255,122,0,0.4)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Next <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={loading || Object.keys(fieldErrors).length > 0}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#ff7a00] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(255,122,0,0.35)] transition hover:scale-[1.02] hover:shadow-[0_14px_36px_rgba(255,122,0,0.4)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Generating recommendation..." : "Generate my smart plan"}
                </button>
              )}
            </div>
          </div>
        </section>
      </div>
      <DestinationMapPicker
        open={showDestinationMap}
        query={data.trip.destinations[activeDestinationIndex]?.country || data.trip.destination}
        onQueryChange={(value) => updateDestinationBlock(activeDestinationIndex, { country: value, city: "" })}
        onClose={() => setShowDestinationMap(false)}
        onSelect={(country) => selectCountry(country, activeDestinationIndex)}
      />
    </main>
  );
}

function StepHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.28em] text-[#ffb066]">
        Gene input
      </p>
      <h2 className="mt-2 text-2xl font-semibold md:text-3xl">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">{subtitle}</p>
    </div>
  );
}

function Field({
  label,
  children,
  error,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <label className="block space-y-2.5">
      <span
        className={`block text-sm font-medium ${
          label ? (error ? "text-red-200" : "text-white/88") : "invisible"
        }`}
      >
        {label || "Placeholder"}
      </span>
      {children}
      <ValidationText message={error} />
    </label>
  );
}
function ValidationText({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs leading-5 text-red-200">{message}</p>;
}

function Input({
  className,
  invalid,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      {...props}
      className={`h-12 w-full rounded-2xl border bg-black/20 px-4 text-sm text-white shadow-[0_10px_30px_rgba(0,0,0,0.18)] outline-none transition duration-300 placeholder:text-white/35 hover:bg-black/25 focus:bg-black/25 ${
        invalid
          ? "border-red-500/50 shadow-[0_0_0_1px_rgba(239,68,68,0.18),0_14px_36px_rgba(239,68,68,0.08)] hover:border-red-400/60 focus:border-red-400 focus:shadow-[0_0_0_1px_rgba(239,68,68,0.28),0_14px_36px_rgba(239,68,68,0.14)]"
          : "border-white/10 hover:border-white/15 focus:border-[#ff7a00] focus:shadow-[0_0_0_1px_rgba(255,122,0,0.35),0_14px_36px_rgba(255,122,0,0.12)]"
      } ${className || ""}`}
    />
  );
}

function BrandDateInput({
  value,
  onChange,
  placeholder,
  rangeStart,
  rangeEnd,
  invalid,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  rangeStart?: string;
  rangeEnd?: string;
  invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => parseIsoDate(value) ?? parseIsoDate(rangeStart) ?? new Date());

  useEffect(() => {
    const next = parseIsoDate(value);
    if (next) setViewDate(next);
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("click", close);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("click", close);
    };
  }, [open]);

  const monthStart = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const monthLabel = monthStart.toLocaleString("en-US", { month: "long", year: "numeric" });
  const start = parseIsoDate(rangeStart);
  const end = parseIsoDate(rangeEnd);
  const selected = parseIsoDate(value);
  const leadingEmptyDays = (monthStart.getDay() + 6) % 7;
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const calendarDays = [
    ...Array.from({ length: leadingEmptyDays }, (_, index) => ({ key: `empty-${index}`, date: null })),
    ...Array.from({ length: daysInMonth }, (_, index) => ({
      key: `day-${index + 1}`,
      date: new Date(viewDate.getFullYear(), viewDate.getMonth(), index + 1),
    })),
  ];

  return (
    <div className="relative" onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`flex h-12 w-full items-center justify-between rounded-2xl border bg-black/20 px-4 text-left text-sm text-white shadow-[0_10px_30px_rgba(0,0,0,0.22)] outline-none transition hover:bg-black/25 ${
          invalid
            ? "border-red-500/50 hover:border-red-400/60 focus:border-red-400 focus:shadow-[0_0_0_1px_rgba(239,68,68,0.28),0_12px_36px_rgba(239,68,68,0.14)]"
            : "border-white/10 hover:border-white/15 focus:border-[#ff7a00] focus:shadow-[0_0_0_1px_rgba(255,122,0,0.45),0_12px_36px_rgba(255,122,0,0.15)]"
        }`}
      >
        <span className={value ? "text-white" : "text-white/42"}>
          {value ? formatReadableDate(value) : placeholder}
        </span>
        <CalendarDays size={16} className="text-[#ffb066]" />
      </button>

      {open ? (
        <div className="absolute left-0 top-[calc(100%+0.75rem)] z-40 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-[24px] border border-white/10 bg-black/85 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
          <div className="border-b border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,122,0,0.16),transparent_45%)] p-4">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setViewDate((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/72 transition hover:border-[#ff7a00]/40 hover:bg-[#ff7a00]/12 hover:text-white"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="text-sm font-medium tracking-[0.08em] text-white">{monthLabel}</div>
              <button
                type="button"
                onClick={() => setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/72 transition hover:border-[#ff7a00]/40 hover:bg-[#ff7a00]/12 hover:text-white"
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <div className="mt-4 grid grid-cols-7 gap-2 text-center text-[11px] uppercase tracking-[0.14em] text-white/45">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                <div key={day}>{day}</div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 p-4">
            {calendarDays.map((item) => {
              if (!item.date) return <div key={item.key} className="h-10 w-10" />;

              const iso = toIsoDate(item.date);
              const today = isSameDay(item.date, new Date());
              const isSelected = selected ? isSameDay(item.date, selected) : false;
              const isStart = start ? isSameDay(item.date, start) : false;
              const isEnd = end ? isSameDay(item.date, end) : false;
              const inRange = start && end ? item.date > stripTime(start) && item.date < stripTime(end) : false;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    onChange(iso);
                    setOpen(false);
                  }}
                  className={`relative flex h-10 w-10 items-center justify-center rounded-full text-sm transition duration-200 ${
                    isSelected || isStart || isEnd
                      ? "bg-[#ff7a00] text-white shadow-[0_0_24px_rgba(255,122,0,0.35)]"
                      : inRange
                        ? "bg-[#ff7a00]/18 text-white"
                        : "text-white hover:bg-[#ff7a00]/14 hover:text-white hover:shadow-[0_0_18px_rgba(255,122,0,0.14)]"
                  } ${today && !(isSelected || isStart || isEnd) ? "border border-[#ff7a00]/70 shadow-[0_0_14px_rgba(255,122,0,0.14)]" : ""}`}
                >
                  {item.date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function parseIsoDate(value?: string) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatReadableDate(value: string) {
  const parsed = parseIsoDate(value);
  return parsed
    ? parsed.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : value;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function stripTime(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function TextArea({
  className,
  invalid,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea
      {...props}
      className={`min-h-[120px] w-full rounded-2xl border bg-black/20 px-4 py-3 text-sm text-white shadow-[0_10px_30px_rgba(0,0,0,0.18)] outline-none transition duration-300 placeholder:text-white/35 hover:bg-black/25 focus:bg-black/25 ${
        invalid
          ? "border-red-500/50 hover:border-red-400/60 focus:border-red-400 focus:shadow-[0_0_0_1px_rgba(239,68,68,0.28),0_14px_36px_rgba(239,68,68,0.14)]"
          : "border-white/10 hover:border-white/15 focus:border-[#ff7a00] focus:shadow-[0_0_0_1px_rgba(255,122,0,0.35),0_14px_36px_rgba(255,122,0,0.12)]"
      } ${className || ""}`}
    />
  );
}

function Select({
  className,
  invalid,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <select
      {...props}
      className={`h-12 w-full rounded-2xl border bg-black/20 px-4 text-sm text-white shadow-[0_10px_30px_rgba(0,0,0,0.18)] outline-none transition duration-300 hover:bg-black/25 focus:bg-black/25 [&>option]:bg-[#050505] [&>option]:text-white ${
        invalid
          ? "border-red-500/50 hover:border-red-400/60 focus:border-red-400 focus:shadow-[0_0_0_1px_rgba(239,68,68,0.28),0_14px_36px_rgba(239,68,68,0.14)]"
          : "border-white/10 hover:border-white/15 focus:border-[#ff7a00] focus:shadow-[0_0_0_1px_rgba(255,122,0,0.35),0_14px_36px_rgba(255,122,0,0.12)]"
      } ${className || ""}`}
      style={{
        colorScheme: "dark",
      }}
    />
  );
}

function ChoiceGrid({
  items,
  selected,
  onToggle,
}: {
  items: readonly string[];
  selected: string[];
  onToggle: (item: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {items.map((item) => {
        const active = selected.includes(item);
        return (
          <button
            key={item}
            type="button"
            onClick={() => onToggle(item)}
            className={`rounded-full border px-4 py-2 text-sm capitalize transition-all duration-300 ${
              active
                ? "border-[#ff7a00]/50 bg-[#ff7a00]/12 text-[#ffb066] shadow-[0_0_24px_rgba(255,122,0,0.12)]"
                : "border-white/10 bg-white/6 text-white/82 hover:border-[#ff7a00]/35 hover:bg-[#ff7a00]/10 hover:text-white hover:shadow-[0_0_24px_rgba(255,122,0,0.10)]"
            }`}
          >
            {item}
          </button>
        );
      })}
    </div>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-3xl border border-white/10 bg-black/20 p-4">
      <div>
        <p className="text-sm font-medium text-white/88">{title}</p>
        <p className="mt-1 text-sm text-white/55">{description}</p>
      </div>
      <button
        type="button"
        onClick={onChange}
        className={`relative h-8 w-14 rounded-full border transition ${
          checked
            ? "border-[#ff7a00]/45 bg-[#ff7a00] shadow-[0_0_24px_rgba(255,122,0,0.22)]"
            : "border-white/10 bg-white/10 hover:border-[#ff7a00]/30 hover:bg-[#ff7a00]/10"
        }`}
      >
        <span
          className={`absolute top-1 h-6 w-6 rounded-full bg-white transition ${
            checked ? "left-7" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-[#ff7a00]/20 bg-[#ff7a00]/8 p-5">
      <p className="text-sm text-white/60">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-[#ffb066]">{value}</p>
    </div>
  );
}

function ReviewCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="mt-4 space-y-2">{children}</div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-[0.2em] text-white/40">
        {label}
      </span>
      <span className="text-sm text-white/85">{value}</span>
    </div>
  );
}

function DestinationMapPicker({
  open,
  query,
  onQueryChange,
  onClose,
  onSelect,
}: {
  open: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  onClose: () => void;
  onSelect: (country: CountryRecord) => void;
}) {
  const filtered = useMemo(() => searchCountries(query), [query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-md">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-6xl animate-[mapOrbIn_420ms_cubic-bezier(0.22,1,0.36,1)] overflow-hidden rounded-[40px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,122,0,0.18),transparent_26%),linear-gradient(180deg,rgba(13,13,13,0.98),rgba(6,6,6,0.98))] shadow-[0_40px_140px_rgba(0,0,0,0.55)]">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 px-6 py-5">
          <div>
            <div className="text-[11px] uppercase tracking-[0.28em] text-[#ffb066]">World destination map</div>
            <h3 className="mt-2 text-2xl font-semibold text-white">Choose a country, then we will unlock its cities for the next field.</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/75 transition hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-3 rounded-[24px] border border-white/10 bg-white/5 px-4 py-3">
            <Search size={16} className="text-white/45" />
            <input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search any city or country"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
            />
            <Globe2 size={16} className="text-[#ffb066]" />
          </div>

          <div className="mt-5 overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_20%_20%,rgba(255,122,0,0.18),transparent_20%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5">
            <div className="relative h-[200px] overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(7,7,7,0.3),rgba(7,7,7,0.6))]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_30%,rgba(255,255,255,0.08),transparent_18%),radial-gradient(circle_at_32%_42%,rgba(255,255,255,0.08),transparent_16%),radial-gradient(circle_at_55%_34%,rgba(255,255,255,0.08),transparent_18%),radial-gradient(circle_at_76%_42%,rgba(255,255,255,0.08),transparent_18%),radial-gradient(circle_at_88%_70%,rgba(255,255,255,0.08),transparent_12%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.04)_50%,transparent_100%)]" />
              <div className="absolute left-[8%] top-[24%] rounded-full border border-white/10 bg-black/35 px-4 py-2 text-xs text-white/75 shadow-[0_12px_24px_rgba(0,0,0,0.28)]">North America</div>
              <div className="absolute left-[30%] top-[50%] rounded-full border border-white/10 bg-black/35 px-4 py-2 text-xs text-white/75 shadow-[0_12px_24px_rgba(0,0,0,0.28)]">South America</div>
              <div className="absolute left-[43%] top-[23%] rounded-full border border-[#ff7a00]/30 bg-[#ff7a00]/12 px-4 py-2 text-xs text-[#ffbf82] shadow-[0_12px_24px_rgba(255,122,0,0.18)]">Europe</div>
              <div className="absolute left-[49%] top-[50%] rounded-full border border-white/10 bg-black/35 px-4 py-2 text-xs text-white/75 shadow-[0_12px_24px_rgba(0,0,0,0.28)]">Africa</div>
              <div className="absolute left-[65%] top-[28%] rounded-full border border-white/10 bg-black/35 px-4 py-2 text-xs text-white/75 shadow-[0_12px_24px_rgba(0,0,0,0.28)]">Asia</div>
              <div className="absolute left-[82%] top-[62%] rounded-full border border-white/10 bg-black/35 px-4 py-2 text-xs text-white/75 shadow-[0_12px_24px_rgba(0,0,0,0.28)]">Oceania</div>
            </div>
          </div>

          <div className="mt-5 flex gap-3 overflow-x-auto pb-2">
            {COUNTRY_REGIONS.map((group) => (
              <div
                key={group.region}
                className="min-w-[180px] rounded-full border border-white/10 bg-white/5 px-4 py-2 text-center text-sm text-white/72"
              >
                {group.region}
              </div>
            ))}
          </div>

          <div className="mt-6 grid max-h-[58vh] gap-5 overflow-y-auto pr-1 md:grid-cols-2 xl:grid-cols-3">
            {(query.trim() ? [{ region: "Matching countries", items: filtered }] : COUNTRY_REGIONS).map((group) => (
              <div key={group.region} className="rounded-[28px] border border-white/10 bg-white/[0.04] p-4">
                <div className="text-[11px] uppercase tracking-[0.24em] text-[#ffbf82]">{group.region}</div>
                <div className="mt-4 space-y-3">
                  {group.items.map((item) => (
                    <button
                      key={`${group.region}-${item.countryCode}-${item.country}`}
                      type="button"
                      onClick={() => onSelect(item)}
                      className="block w-full rounded-[22px] border border-white/10 bg-black/25 px-4 py-4 text-left transition hover:border-[#ff7a00]/30 hover:bg-[#ff7a00]/10"
                    >
                      <div className="text-base font-semibold text-white">{item.country}</div>
                      <div className="mt-1 text-sm text-white/55">{item.region} • {item.cities.length} cities</div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style jsx global>{`
        @keyframes mapOrbIn {
          0% {
            opacity: 0;
            transform: scale(0.78) translateY(24px);
            border-radius: 999px;
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
            border-radius: 40px;
          }
        }
      `}</style>
    </div>
  );
}






