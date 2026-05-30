import type { Prisma } from "@prisma/client";
import type { PlanInputPayload } from "@/lib/validations/plan-input";

export function mapPlanInputToPrisma(payload: PlanInputPayload, userId?: string) {
  return {
    userId,
    destination: payload.trip.destination,
    startDate: new Date(payload.trip.startDate),
    endDate: new Date(payload.trip.endDate),
    departureCity: payload.trip.departureCity,
    isFlexibleDates: payload.trip.flexibleDates ?? payload.trip.isFlexibleDates,
    travelersCount: payload.trip.travelersCount,
    travelersType: payload.trip.travelersType,
    adults: payload.trip.adults,
    kids: payload.trip.kids,
    elderly: payload.trip.elderly,

    totalBudget: payload.budget.totalBudget,
    budgetPer: payload.budget.budgetPer,
    includeFlights: payload.budget.includeFlights,
    travelLevel: payload.budget.travelLevel,
    shoppingBudget: payload.budget.shoppingBudget,
    emergencyBuffer: payload.budget.emergencyBuffer,

    travelStyles: payload.style.travelStyles,
    paceLevel: payload.style.paceLevel,
    priorities: payload.style.priorities,

    stayType: payload.stay.stayType,
    hotelStars: payload.stay.hotelStars,
    roomCount: payload.stay.roomCount,
    bedType: payload.stay.bedType,
    breakfastIncluded: payload.stay.breakfastIncluded,
    amenities: payload.stay.amenities,
    locationPreference: payload.stay.locationPreference,

    directFlightsOnly: payload.flight.directFlightsOnly,
    preferredAirlines: payload.flight.preferredAirlines || null,
    cabinClass: payload.flight.cabinClass,
    flightTimePreference: payload.flight.flightTimePreference,
    maxLayoverHours: payload.flight.maxLayoverHours,

    transportType: payload.transport.transportType,
    // Legacy DB field kept for compatibility while the planner UI uses walking tolerance instead.
    maxTravelTimeBetweenPlaces: Math.max(
      30,
      Math.min(payload.constraints.walkingTolerance ?? 90, 240),
    ),

    mustDoList: payload.activities.mustDoList || null,
    interests: payload.activities.interests,
    avoidList: payload.activities.avoidList || null,
    activityIntensity: payload.activities.activityIntensity,

    mobilityNeeds: payload.constraints.mobilityNeeds || null,
    wakeUpTime: payload.constraints.wakeUpTime || null,
    dailyActiveHours: payload.constraints.dailyActiveHours,
    needsRestTime: payload.constraints.needsRestTime,
    walkingTolerance: payload.constraints.walkingTolerance,
    foodPreferences: payload.constraints.foodPreferences,
    specialOccasion: payload.constraints.specialOccasion || null,
    hardConstraints: payload.constraints.hardConstraints || null,

    rawInput: payload as unknown as Prisma.InputJsonValue,
  };
}
