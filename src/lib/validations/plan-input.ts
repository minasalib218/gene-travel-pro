import { z } from "zod";

const destinationBlockSchema = z.object({
  id: z.string().min(1),
  country: z.string().min(2),
  city: z.string().min(2),
  preferredHotel: z.string().optional().default(""),
  startDate: z.string().optional().default(""),
  endDate: z.string().optional().default(""),
  durationNights: z.number().min(0).optional().default(0),
  interests: z.array(z.string()).optional().default([]),
  transportType: z.enum(["public", "taxi", "rental-car", "private-driver"]).optional(),
  shoppingFocus: z.string().optional().default(""),
});

const travelerPassportSchema = z.object({
  travelerIndex: z.number().min(1),
  passportCountry: z.string().min(2),
  passportExpiryDate: z.string().min(1),
});

export const planInputSchema = z.object({
  trip: z.object({
    destination: z.string().min(2),
    startDate: z.string().min(1),
    endDate: z.string().min(1),
    departureCity: z.string().min(2),
    travellingFrom: z.object({
      country: z.string().default(""),
      city: z.string().default(""),
      airport: z.string().default(""),
    }).optional().default({ country: "", city: "", airport: "" }),
    preferredAirport: z.string().optional().default(""),
    passportCountry: z.string().optional().default(""),
    transitCountries: z.array(z.string()).optional().default([]),
    passportExpiryDate: z.string().optional().default(""),
    travelersPassport: z.array(travelerPassportSchema).optional().default([]),
    isFlexibleDates: z.boolean(),
    travelersCount: z.number().min(1),
    travelersType: z.enum(["solo", "couple", "family", "friends", "business"]),
    adults: z.number().min(1),
    kids: z.number().min(0),
    elderly: z.number().min(0),
    destinations: z.array(destinationBlockSchema).min(1).optional().default([]),
    multiDestinations: z.boolean().optional().default(false),
    flexibleDates: z.boolean().optional().default(false),
    moreDestinations: z.number().min(0).optional().default(0),
    tripsPerDay: z.number().min(0).max(6).optional().default(2),
    noTripDays: z.number().min(0).max(30).optional().default(0),
    daysWithoutTrips: z.array(z.number().min(1)).optional().default([]),
  }),
  budget: z.object({
    totalBudget: z.number().min(0),
    openBudget: z.boolean().optional().default(false),
    budgetMin: z.number().nullable().optional().default(null),
    budgetMax: z.number().nullable().optional().default(null),
    budgetPer: z.enum(["total", "person"]),
    includeFlights: z.boolean(),
    budgetIncludesFlights: z.boolean().optional(),
    flightBudget: z.number().min(0).optional(),
    baggageWeight: z.number().min(0).optional(),
    travelLevel: z.enum(["budget", "mid-range", "luxury"]),
    shoppingBudget: z.number().min(0),
    emergencyBuffer: z.boolean(),
  }),
  style: z.object({
    travelStyles: z.array(z.string()).min(1),
    paceLevel: z.number().min(0).max(100),
    priorities: z.array(z.string()).min(1),
    tripPersonality: z.array(z.string()).optional().default([]),
  }),
  stay: z.object({
    stayType: z.enum(["hotel", "apartment", "resort", "villa"]),
    hotelStars: z.number().min(1).max(5),
    roomCount: z.number().min(1),
    bedType: z.string().min(1),
    roomType: z.enum(["single", "double", "triple", "king", "family", "suite"]).optional().nullable().default(null),
    breakfastIncluded: z.boolean(),
    amenities: z.array(z.string()),
    locationPreference: z.string().min(1),
    preferredHotels: z.array(z.string()).optional().default([]),
  }),
  flight: z.object({
    directFlightsOnly: z.boolean(),
    preferredAirlines: z.string(),
    cabinClass: z.enum(["economy", "premium-economy", "business", "first"]),
    flightTimePreference: z.enum(["any", "morning", "afternoon", "evening", "overnight"]),
    maxLayoverHours: z.number().min(0).max(24),
  }),
  transport: z.object({
    transportType: z.enum(["public", "taxi", "rental-car", "private-driver"]),
  }),
  activities: z.object({
    mustDoList: z.string(),
    interests: z.array(z.string()),
    avoidList: z.string(),
    activityIntensity: z.enum(["light", "balanced", "intense"]),
  }),
  constraints: z.object({
    mobilityNeeds: z.string(),
    wakeUpTime: z.string(),
    dailyActiveHours: z.number().min(1).max(18),
    needsRestTime: z.boolean(),
    walkingTolerance: z.number().min(0).max(300),
    energyFatigueSignals: z.array(z.string()).optional().default([]),
    foodPreferences: z.array(z.string()),
    specialOccasion: z.string(),
    hardConstraints: z.string(),
  }),
  review: z.object({
    reviewSummary: z.string().optional().default(""),
    fullTripCostEstimate: z.number().optional(),
    costPerPersonEstimate: z.number().optional(),
    budgetValidation: z.string().optional().default(""),
  }).optional(),
}).superRefine((payload, ctx) => {
  const travelerSum = payload.trip.adults + payload.trip.kids + payload.trip.elderly;
  if (travelerSum !== payload.trip.travelersCount) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["trip", "travelersCount"],
      message: "Travelers count must equal adults + kids + elderly.",
    });
  }

  const start = new Date(payload.trip.startDate);
  const end = new Date(payload.trip.endDate);
  const tripDays =
    Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())
      ? 0
      : Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  if (tripDays <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["trip", "endDate"],
      message: "End date must be after start date.",
    });
  }

  if ((payload.trip.daysWithoutTrips || []).length > Math.max(tripDays, 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["trip", "daysWithoutTrips"],
      message: "Locked rest days cannot exceed trip days.",
    });
  }

  if (payload.budget.includeFlights) {
    if (!payload.trip.travellingFrom.country.trim() || !payload.trip.travellingFrom.city.trim() || !payload.trip.travellingFrom.airport.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["trip", "travellingFrom"],
        message: "Travelling from country, city, and airport are required when flights are included.",
      });
    }
    if ((payload.budget.flightBudget ?? 0) <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["budget", "flightBudget"],
        message: "Flight budget is required when flights are included.",
      });
    }
    if ((payload.budget.baggageWeight ?? 0) < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["budget", "baggageWeight"],
        message: "Baggage weight cannot be negative.",
      });
    }
  }

  if (!payload.budget.openBudget && payload.budget.totalBudget < 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["budget", "totalBudget"],
      message: "Budget cannot be negative.",
    });
  }

  if (!payload.budget.openBudget) {
    if (payload.budget.budgetMin == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["budget", "budgetMin"],
        message: "Minimum budget is required unless Open Budget is enabled.",
      });
    }
    if (payload.budget.budgetMax == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["budget", "budgetMax"],
        message: "Maximum budget is required unless Open Budget is enabled.",
      });
    }
  }

  if (payload.trip.travelersPassport.length !== payload.trip.travelersCount) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["trip", "travelersPassport"],
      message: "Passport details are required for each traveler.",
    });
  }

  payload.trip.travelersPassport.forEach((traveler, index) => {
    const expiry = new Date(traveler.passportExpiryDate);
    if (Number.isNaN(expiry.getTime()) || expiry.getTime() <= Date.now()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["trip", "travelersPassport", index, "passportExpiryDate"],
        message: "Passport expiry date must be in the future.",
      });
    }
  });
});

export type PlanInputPayload = z.infer<typeof planInputSchema>;
