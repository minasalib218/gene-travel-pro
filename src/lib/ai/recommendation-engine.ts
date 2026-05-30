import OpenAI from "openai";
import type { PlanInputPayload } from "@/lib/validations/plan-input";
import type { RecommendationResult } from "@/lib/ai/recommendation-types";
import { fetchProviderData } from "@/lib/ai/providers";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function formatBudgetLabel(price?: number | null, currency?: string | null) {
  if (typeof price !== "number") return "Price on provider";
  return `${currency || "USD"} ${price}`;
}

function buildFallbackRecommendation(
  payload: PlanInputPayload,
  providerData: Awaited<ReturnType<typeof fetchProviderData>>,
  reason: string
): RecommendationResult {
  const travelStyles = payload.style.travelStyles.join(", ");
  const tripPersonality = (payload.style.tripPersonality || []).join(", ");
  const energyFatigueSignals = (payload.constraints.energyFatigueSignals || []).join(", ");
  const interests = payload.activities.interests.join(", ");
  const nights =
    Math.max(
      1,
      Math.ceil(
        (new Date(payload.trip.endDate).getTime() - new Date(payload.trip.startDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    ) || 1;

  return {
    headline: `${payload.trip.destination} smart-fit recommendation`,
    summary: `Gene prepared this recommendation from live provider results while the full AI ranking layer is temporarily unavailable. The trip is shaped for ${payload.trip.travelersType} travelers over ${nights} nights, with a ${payload.budget.travelLevel} budget and a ${payload.activities.activityIntensity} activity rhythm.`,
    hotels: providerData.hotels.slice(0, 3).map((hotel) => ({
      name: hotel.name,
      location: hotel.location || payload.trip.destination,
      priceLabel: formatBudgetLabel(hotel.price, hotel.currency),
      reason: `Matches the destination and keeps the stay aligned with your ${payload.stay.stayType} preference and ${payload.stay.hotelStars}-star target.`,
      deepLink: hotel.deepLink ?? null,
    })),
    flights: providerData.flights.slice(0, 2).map((flight) => ({
      name: flight.airline,
      route: flight.routeLabel,
      priceLabel: formatBudgetLabel(flight.price, flight.currency),
      reason: payload.flight.directFlightsOnly
        ? "Kept because your trip prefers simpler routing and lower transfer friction."
        : "Kept because it fits the route and gives a reasonable starting point for the itinerary.",
      deepLink: flight.deepLink ?? null,
    })),
    activities: providerData.activities.slice(0, 4).map((activity) => ({
      name: activity.name,
      category: activity.category || "experience",
      priceLabel: formatBudgetLabel(activity.price, activity.currency),
      reason: `Included because it lines up with your interests: ${interests || "general travel highlights"}.`,
      deepLink: activity.deepLink ?? null,
    })),
    fitBullets: [
      `Style match: ${travelStyles || "balanced"}`,
      tripPersonality ? `Trip personality: ${tripPersonality}` : "",
      energyFatigueSignals ? `Energy rules: ${energyFatigueSignals}` : "",
      `Budget level: ${payload.budget.travelLevel}`,
      `Pace: ${payload.activities.activityIntensity}`,
      `Provider-ranked mode is active for now`,
    ],
    rawAi: {
      fallback: true,
      reason,
      providerData,
      structured: {
        recommendations: {
          destinations: payload.trip.destinations.map((destination, index) => ({
            id: destination.id,
            title: `${destination.city}, ${destination.country}`,
            why: index === 0 ? "Primary stop from planner input." : "Additional stop preserved from multi-destination input.",
            estimated: true,
          })),
          hotels: providerData.hotels,
          flights: providerData.flights,
          transport: [],
          activities: providerData.activities,
          events: [],
          shopping: [],
          food: [],
          dayByDayPlan: [],
        },
        analysis: {
          budget: {
            totalBudget: payload.budget.totalBudget,
            shoppingBudget: payload.budget.shoppingBudget,
            emergencyBufferEnabled: payload.budget.emergencyBuffer,
            estimated: true,
          },
          travelers: {
            total: payload.trip.travelersCount,
            adults: payload.trip.adults,
            kids: payload.trip.kids,
            elderly: payload.trip.elderly,
          },
          dates: {
            startDate: payload.trip.startDate,
            endDate: payload.trip.endDate,
          },
          flexibleDates: {
            enabled: payload.trip.flexibleDates ?? payload.trip.isFlexibleDates,
          },
          route: {
            destinations: payload.trip.destinations,
          },
          hotels: {},
          flights: {},
          transport: {},
          mobility: {
            walkingTolerance: payload.constraints.walkingTolerance,
            mobilityNeeds: payload.constraints.mobilityNeeds,
          },
          food: {
            preferences: payload.constraints.foodPreferences,
          },
          risks: [],
          warnings: payload.constraints.hardConstraints ? [payload.constraints.hardConstraints] : [],
          constraints: [payload.activities.avoidList, payload.constraints.hardConstraints].filter(Boolean),
          score: {
            confidence: 62,
            estimated: true,
          },
        },
      },
    },
  };
}

export async function buildRecommendationFromInput(
  payload: PlanInputPayload
): Promise<RecommendationResult> {
  const providerData = await fetchProviderData({
    destination: payload.trip.destination,
    startDate: payload.trip.startDate,
    endDate: payload.trip.endDate,
    departureCity: payload.trip.departureCity,
    adults: payload.trip.adults,
    kids: payload.trip.kids,
    directOnly: payload.flight.directFlightsOnly,
    interests: payload.activities.interests,
  });

  const prompt = `
You are the Gene Travel recommendation AI.

Your job:
- Use ONLY the provider data given below.
- Do NOT invent hotels, flights, activities, events, food places, shopping places, prices or links.
- Rank options based on the traveler input.
- Explain why each selected option fits.
- Use every field from the full trip input, including destinations, locked rest days, budget split, mobility, food, and hard constraints.
- The traveler selected these trip personality preferences: ${JSON.stringify(payload.style.tripPersonality || [])}.
- Use them as hard preference signals when choosing hotels, activities, restaurants, transport, timing, shopping, and day-by-day density.
- Do not ignore these preferences unless they conflict with safety, budget, opening hours, weather, distance, or user constraints.
- Explain the influence briefly inside recommendation notes/tags.
- The traveler selected these energy and fatigue signals: ${JSON.stringify(payload.constraints.energyFatigueSignals || [])}.
- Use them as hard planning constraints when arranging activity timing, meal spacing, transport mode, rest windows, walking distance, and day-by-day density.
- Do not ignore these constraints unless they conflict with safety, availability, weather, budget, or opening hours.
- Explain the effect briefly in recommendation notes and analysis reasoning.
- Use the Smart Crowd & Queue Predictor when arranging the day-by-day itinerary.
- Consider weekends, holidays, weather, nearby events, place popularity, opening hours, and time of day.
- Prefer lower-crowd hours for famous attractions.
- Add crowdLevel, estimatedWaitMinutes, bestVisitHours, avoidHours, and crowdNote to relevant day items.
- Explain the crowd logic in the Analysis page.
- Keep output concise, commercial, and realistic.

Traveler input:
${JSON.stringify(payload, null, 2)}

Provider data:
${JSON.stringify(providerData, null, 2)}

Return strict JSON with this shape:
{
  "headline": "string",
  "summary": "string",
  "hotels": [{"name":"string","location":"string","priceLabel":"string","reason":"string","deepLink":"string or null"}],
  "flights": [{"name":"string","route":"string","priceLabel":"string","reason":"string","deepLink":"string or null"}],
  "activities": [{"name":"string","category":"string","priceLabel":"string","reason":"string","deepLink":"string or null"}],
  "fitBullets": ["string"],
  "structured": {
    "recommendations": {
      "destinations": [],
      "hotels": [],
      "flights": [],
      "transport": [],
      "activities": [],
      "events": [],
      "shopping": [],
      "food": [],
      "dayByDayPlan": []
    },
    "analysis": {
      "budget": {},
      "travelers": {},
      "dates": {},
      "flexibleDates": {},
      "route": {},
      "hotels": {},
      "flights": {},
      "transport": {},
      "mobility": {},
      "food": {},
      "risks": [],
      "warnings": [],
      "constraints": [],
      "score": {}
    }
  }
}

Rules:
- Select up to 3 hotels, 2 flights, 4 activities.
- Match the user's travel style, pace, budget, hard constraints, food preferences, mobility needs, direct flight preference, layover limit, preferred hotels by stop, and multi-destination stop logic.
- Mention tradeoffs honestly.
- If flights are excluded from budget, do not penalize flight price heavily.
- Prefer lower walking load if walking tolerance is low.
- Prefer direct flights if directFlightsOnly is true.
- Respect locked rest days and avoid assigning activity density there.
- If provider/API data is missing, leave that sub-section empty or mark it estimated in the text.
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a travel recommendation engine that strictly outputs valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) {
      throw new Error("OpenAI returned empty recommendation content");
    }

    const parsed = JSON.parse(raw) as RecommendationResult;

    parsed.hotels =
      parsed.hotels?.map((item) => ({
        ...item,
        priceLabel: item.priceLabel || "Price on provider",
      })) || [];

    parsed.flights =
      parsed.flights?.map((item) => ({
        ...item,
        priceLabel: item.priceLabel || "Price on provider",
      })) || [];

    parsed.activities =
      parsed.activities?.map((item) => ({
        ...item,
        priceLabel: item.priceLabel || "Price on provider",
      })) || [];

    parsed.fitBullets = parsed.fitBullets || [];
    parsed.rawAi = {
      raw,
      providerData,
      structured: (parsed as any).structured ?? null,
    };

    return parsed;
  } catch (error: any) {
    const fallbackReason =
      error?.code === "insufficient_quota"
        ? "OpenAI quota exceeded"
        : error?.message || "AI request failed";

    console.warn("Falling back to provider-based recommendation:", fallbackReason);
    return buildFallbackRecommendation(payload, providerData, fallbackReason);
  }
}
