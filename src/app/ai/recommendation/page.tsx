import { prisma } from "@/lib/prisma";
import RecommendationWorkspace from "@/app/ai/recommendation/ui";
import RecommendationRecovery from "@/app/ai/recommendation/recovery";
import ProtectedAI from "@/components/ProtectedAI";
import { buildHiddenGemRecommendationPayload } from "@/lib/hidden-gems/hiddenGemsEngine";
import type { UserTripInput } from "@/lib/recommendation/types";

type Props = {
  searchParams: {
    planId?: string;
  };
};

function toTripInput(planInput: any): UserTripInput {
  const raw = planInput.rawInput || {};
  const rawDestinations = Array.isArray(raw?.trip?.destinations) ? raw.trip.destinations : [];
  const stay = raw?.stay || {};
  const flight = raw?.flight || {};
  const transport = raw?.transport || {};
  const activities = raw?.activities || {};
  const constraints = raw?.constraints || {};
  const budget = raw?.budget || {};
  const review = raw?.review || {};
  return {
    destination: planInput.destination,
    departureCity: planInput.departureCity,
    startDate: planInput.startDate,
    endDate: planInput.endDate,
    passportCountry: raw?.trip?.travelersPassport?.[0]?.passportCountry || raw?.trip?.passportCountry || "",
    passportExpiryDate: raw?.trip?.travelersPassport?.[0]?.passportExpiryDate || raw?.trip?.passportExpiryDate || "",
    transitCountries: Array.isArray(raw?.trip?.transitCountries) ? raw.trip.transitCountries : [],
    budget: planInput.totalBudget,
    currency: "USD",
    travelStyle: raw?.style?.travelStyles?.join(", ") || planInput.travelLevel || "balanced",
    tripPersonality: Array.isArray(raw?.style?.tripPersonality) ? raw.style.tripPersonality : [],
    travelersCount: planInput.travelersCount,
    travelerType: planInput.travelersType,
    hotelClass: stay.hotelStars ? `${stay.hotelStars} star` : "4 star",
    interests: Array.isArray(planInput.interests) && planInput.interests.length ? planInput.interests : activities?.interests || [],
    preferredTransport: planInput.transportType || transport?.transportType || "taxi",
    walkingTolerance: planInput.walkingTolerance ?? constraints?.walkingTolerance ?? 60,
    specialRequests: [planInput.specialOccasion, constraints?.specialOccasion, constraints?.hardConstraints].filter(Boolean).join(" | "),
    multiDestinations: Boolean(raw?.trip?.multiDestinations || rawDestinations.length > 1),
    destinations: rawDestinations.map((item: any, index: number) => ({
      id: item?.id || `destination-${index + 1}`,
      country: item?.country || "",
      city: item?.city || "",
      preferredHotel: item?.preferredHotel || stay?.preferredHotels?.[index] || "",
      startDate: item?.startDate || "",
      endDate: item?.endDate || "",
      durationNights: Number(item?.durationNights ?? 0),
      hotelStars: Number(item?.hotelStars ?? stay?.hotelStars ?? 0),
      stayType: item?.stayType || stay?.stayType || "",
      interests: Array.isArray(item?.interests) && item.interests.length ? item.interests : activities?.interests || [],
      transportType: item?.transportType || transport?.transportType || "",
      shoppingFocus: item?.shoppingFocus || "",
      eventTypes: Array.isArray(item?.eventTypes) ? item.eventTypes : [],
    })),
    tripsPerDay: Number(raw?.trip?.tripsPerDay ?? 3),
    noTripDays: Number(raw?.trip?.noTripDays ?? 0),
    daysWithoutTrips: Array.isArray(raw?.trip?.daysWithoutTrips) ? raw.trip.daysWithoutTrips : [],
    preferredHotels: Array.isArray(stay?.preferredHotels) ? stay.preferredHotels : [],
    flexibleDates: Boolean(raw?.trip?.flexibleDates ?? raw?.trip?.isFlexibleDates),
    budgetIncludesFlights: Boolean(budget?.budgetIncludesFlights ?? budget?.includeFlights),
    flightBudget: Number(budget?.flightBudget ?? 0),
    baggageWeight: Number(budget?.baggageWeight ?? 0),
    shoppingBudget: Number(budget?.shoppingBudget ?? planInput.shoppingBudget ?? 0),
    emergencyBufferEnabled: Boolean(budget?.emergencyBuffer),
    paceLevel: Number(raw?.style?.paceLevel ?? planInput.paceLevel ?? 50),
    priorities: Array.isArray(raw?.style?.priorities) ? raw.style.priorities : [],
    stayType: stay?.stayType || "",
    roomCount: Number(stay?.roomCount ?? planInput.roomCount ?? 1),
    breakfastIncluded: Boolean(stay?.breakfastIncluded),
    amenities: Array.isArray(stay?.amenities) ? stay.amenities : [],
    directFlightsOnly: Boolean(flight?.directFlightsOnly),
    preferredAirlines: flight?.preferredAirlines || "",
    cabinClass: flight?.cabinClass || "",
    flightTimePreference: flight?.flightTimePreference || "",
    maxLayoverHours: Number(flight?.maxLayoverHours ?? 0),
    mustDoList: activities?.mustDoList || "",
    avoidList: activities?.avoidList || "",
    activityIntensity: activities?.activityIntensity || "",
    mobilityNeeds: constraints?.mobilityNeeds || "",
    wakeUpTime: constraints?.wakeUpTime || "",
    dailyActiveHours: Number(constraints?.dailyActiveHours ?? 0),
    needsRestTime: Boolean(constraints?.needsRestTime),
    energyFatigueSignals: Array.isArray(constraints?.energyFatigueSignals) ? constraints.energyFatigueSignals : [],
    foodPreferences: Array.isArray(constraints?.foodPreferences) ? constraints.foodPreferences : [],
    adults: Number(planInput.adults ?? raw?.trip?.adults ?? 0),
    kids: Number(planInput.kids ?? raw?.trip?.kids ?? 0),
    elderly: Number(planInput.elderly ?? raw?.trip?.elderly ?? 0),
    fullTripCostEstimate: Number(review?.fullTripCostEstimate ?? 0) || undefined,
    costPerPersonEstimate: Number(review?.costPerPersonEstimate ?? 0) || undefined,
    budgetValidation: review?.budgetValidation || "",
    reviewSummary: review?.reviewSummary || "",
    fullInput: raw,
  };
}

export default async function RecommendationPage({ searchParams }: Props) {
  const planId = searchParams.planId;
  if (!planId) {
    return (
      <ProtectedAI>
        <RecommendationRecovery planId="" />
      </ProtectedAI>
    );
  }

  try {
    const [planInput, recommendation] = await Promise.all([
      prisma.planInput.findUnique({ where: { id: planId } }),
      prisma.planRecommendation.findFirst({
        where: { planInputId: planId },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    if (planInput && recommendation) {
      const hiddenGems = await buildHiddenGemRecommendationPayload(toTripInput(planInput));
      return (
        <ProtectedAI>
          <RecommendationWorkspace
            planId={planId}
            planInput={JSON.parse(JSON.stringify(planInput))}
            recommendation={JSON.parse(JSON.stringify(recommendation))}
            hiddenGems={JSON.parse(JSON.stringify(hiddenGems.all))}
          />
        </ProtectedAI>
      );
    }
  } catch (error) {
    console.error("RecommendationPage load error", error);
  }

  return (
    <ProtectedAI>
      <RecommendationRecovery planId={planId} />
    </ProtectedAI>
  );
}
