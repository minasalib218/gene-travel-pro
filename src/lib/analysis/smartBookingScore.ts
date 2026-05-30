import type {
  ActivityRecommendation,
  FlightRecommendation,
  HotelRecommendation,
  RecommendationPayload,
  RecommendationBase,
  RestaurantRecommendation,
  SmartBookingScore,
  TransportRecommendation,
  UserTripInput,
} from "@/lib/recommendation/types";

type ScoreableItem =
  | HotelRecommendation
  | FlightRecommendation
  | ActivityRecommendation
  | RestaurantRecommendation
  | TransportRecommendation;

type ScoreContext = {
  routeMinutes: number;
  weatherRisk: number;
  crowdRisk: number;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function parseDurationToMinutes(value?: string | null) {
  if (!value) return 0;
  const hours = Number((value.match(/(\d+)\s*h/i) || [])[1] || 0);
  const minutes = Number((value.match(/(\d+)\s*m/i) || [])[1] || 0);
  return hours * 60 + minutes;
}

function normalizePrice(item: ScoreableItem) {
  const base = item as RecommendationBase;
  if ("nightlyPrice" in item) return item.selectedUpgrade?.totalPrice ?? item.totalPrice ?? item.nightlyPrice;
  if ("fare" in item) return item.totalFare ?? item.totalPrice ?? item.fare;
  if ("price" in item) return item.totalPrice ?? item.price;
  if ("pricePerPerson" in item) return item.totalPrice ?? item.pricePerPerson;
  if ("cost" in item) return item.totalPrice ?? item.cost;
  return base.totalPrice ?? base.basePrice ?? 0;
}

function inferItemType(item: ScoreableItem): SmartBookingScore["itemType"] {
  if ("nightlyPrice" in item) return "hotel";
  if ("fare" in item) return "flight";
  if ("pricePerPerson" in item) return "restaurant";
  if ("cost" in item) return "transport";
  return "activity";
}

function travelerWeight(input: UserTripInput) {
  return {
    familySensitive: Boolean(input.kids || input.elderly || input.travelerType === "family"),
    luxurySensitive: /luxury/i.test(`${input.travelStyle} ${(input.tripPersonality || []).join(" ")}`),
    budgetSensitive: /budget|cheap|value/i.test(`${input.travelStyle}`) || input.budget < 1800,
    walkingSensitive: Boolean(
      input.energyFatigueSignals?.includes("Walking Overload") ||
        input.energyFatigueSignals?.includes("Elderly Fatigue") ||
        input.energyFatigueSignals?.includes("Kid Fatigue"),
    ),
  };
}

function estimateLocationScore(item: ScoreableItem, input: UserTripInput) {
  const text = `${item.locationLabel || ""} ${item.name} ${item.aiReason}`.toLowerCase();
  let score = item.confidenceScore || 70;
  if (/central|city|district|near|walk|metro|landmark/.test(text)) score += 12;
  if (/quiet|remote|outskirts/.test(text)) score -= 10;
  if (input.tripPersonality?.includes("Famous Places") && /landmark|museum|iconic/.test(text)) score += 8;
  return clamp(score, 35, 98);
}

function estimateWalkingScore(item: ScoreableItem, input: UserTripInput) {
  const text = `${item.aiReason} ${(item.fitTags || []).join(" ")}`.toLowerCase();
  let score = input.walkingTolerance >= 60 ? 80 : 66;
  if (/low walking|easy|indoor|private|central/.test(text)) score += 12;
  if (/walk|stairs|hike|outdoor/.test(text)) score -= 14;
  if (travelerWeight(input).walkingSensitive) score -= /walk|stairs|hike/.test(text) ? 18 : 0;
  return clamp(score, 28, 96);
}

function estimateComfortScore(item: ScoreableItem, input: UserTripInput, context: ScoreContext) {
  const text = `${item.aiReason} ${(item.fitTags || []).join(" ")}`.toLowerCase();
  let score = item.confidenceScore || 72;
  if ("nightlyPrice" in item && item.rating) score = score + item.rating * 3;
  if ("fare" in item) score += item.stops === 0 ? 10 : -8;
  if ("duration" in item && item.duration) score -= Math.max(parseDurationToMinutes(item.duration) - 180, 0) / 20;
  if (/comfort|private|premium|executive|spa|suite/.test(text)) score += 12;
  if (context.weatherRisk > 70 && /outdoor|walk/.test(text)) score -= 10;
  if (travelerWeight(input).luxurySensitive) score += 6;
  return clamp(score, 32, 98);
}

function estimateFamilyScore(item: ScoreableItem, input: UserTripInput) {
  const text = `${item.aiReason} ${(item.fitTags || []).join(" ")} ${(item.locationLabel || "")}`.toLowerCase();
  let score = 72;
  if (/family|kids|easy|central|private|breakfast/.test(text)) score += 12;
  if (/nightlife|late|club|stairs|hike/.test(text)) score -= 16;
  if (!travelerWeight(input).familySensitive) score = Math.max(score, 68);
  return clamp(score, 30, 97);
}

function estimateTransportScore(item: ScoreableItem, input: UserTripInput, context: ScoreContext) {
  const text = `${item.aiReason} ${(item.fitTags || []).join(" ")}`.toLowerCase();
  let score = 74;
  if (/direct|private|central|low stress|arrival fit/.test(text)) score += 12;
  if (context.routeMinutes > Math.max((input.maxTravelTimeBetweenPlaces || 90) * 2, 120)) score -= 10;
  if (travelerWeight(input).walkingSensitive && /metro|walking/.test(text)) score -= 8;
  if ("cost" in item) score += /private|comfort/.test(text) ? 8 : 0;
  return clamp(score, 34, 96);
}

function estimateValueScore(item: ScoreableItem, input: UserTripInput, context: ScoreContext) {
  const price = normalizePrice(item);
  const budget = Math.max(input.budget || 1, 1);
  let score = item.confidenceScore || 70;
  if (!price) return 54;
  const ratio = price / budget;
  if (ratio <= 0.05) score += 18;
  else if (ratio <= 0.12) score += 8;
  else if (ratio >= 0.22) score -= 14;
  if ("rating" in item && typeof item.rating === "number") score += (item.rating - 4) * 8;
  if (context.crowdRisk > 75) score -= 6;
  if (travelerWeight(input).budgetSensitive && ratio >= 0.15) score -= 8;
  return clamp(score, 25, 96);
}

function estimateWorthMoneyScore(
  valueScore: number,
  comfortScore: number,
  locationScore: number,
  transportScore: number,
  context: ScoreContext,
) {
  return clamp((valueScore * 0.34) + (comfortScore * 0.22) + (locationScore * 0.22) + (transportScore * 0.22) - context.weatherRisk * 0.03 - context.crowdRisk * 0.03, 22, 98);
}

export function generateBookingScoreWarnings(scores: Omit<SmartBookingScore, "warnings" | "strengths" | "aiReason">, item: ScoreableItem, plannerInput: UserTripInput) {
  const warnings: string[] = [];
  if (scores.valueScore < 62) warnings.push("Price may stretch the selected budget.");
  if (scores.walkingScore < 58) warnings.push("Walking effort may feel high for this trip profile.");
  if (scores.transportScore < 58) warnings.push("Transfers may create friction or timing stress.");
  if (scores.familyScore < 58 && (plannerInput.kids || plannerInput.elderly)) warnings.push("This option is not an easy fit for kids or elderly travelers.");
  if (!normalizePrice(item)) warnings.push("Some pricing data is missing, so confidence is lower.");
  return warnings;
}

function buildStrengths(scores: Omit<SmartBookingScore, "warnings" | "strengths" | "aiReason">) {
  const strengths: string[] = [];
  if (scores.locationScore >= 82) strengths.push("Strong location fit");
  if (scores.comfortScore >= 82) strengths.push("High comfort level");
  if (scores.valueScore >= 80) strengths.push("Good value for price");
  if (scores.familyScore >= 80) strengths.push("Family-friendly fit");
  if (scores.transportScore >= 80) strengths.push("Smooth transport fit");
  return strengths;
}

export function calculateOverallBookingScore(scores: {
  valueScore: number;
  locationScore: number;
  walkingScore: number;
  comfortScore: number;
  familyScore: number;
  transportScore: number;
  worthMoneyScore: number;
}, plannerInput: UserTripInput) {
  const weights = travelerWeight(plannerInput);
  const valueWeight = weights.budgetSensitive ? 0.22 : 0.16;
  const comfortWeight = weights.luxurySensitive ? 0.2 : 0.15;
  const walkingWeight = weights.walkingSensitive ? 0.18 : 0.13;
  const familyWeight = weights.familySensitive ? 0.16 : 0.11;
  return clamp(
    scores.valueScore * valueWeight +
      scores.locationScore * 0.15 +
      scores.walkingScore * walkingWeight +
      scores.comfortScore * comfortWeight +
      scores.familyScore * familyWeight +
      scores.transportScore * 0.12 +
      scores.worthMoneyScore * 0.14,
  );
}

export function calculateSmartBookingScore(item: ScoreableItem, plannerInput: UserTripInput, context: ScoreContext): SmartBookingScore {
  const valueScore = estimateValueScore(item, plannerInput, context);
  const locationScore = estimateLocationScore(item, plannerInput);
  const walkingScore = estimateWalkingScore(item, plannerInput);
  const comfortScore = estimateComfortScore(item, plannerInput, context);
  const familyScore = estimateFamilyScore(item, plannerInput);
  const transportScore = estimateTransportScore(item, plannerInput, context);
  const worthMoneyScore = estimateWorthMoneyScore(valueScore, comfortScore, locationScore, transportScore, context);
  const overallScore = calculateOverallBookingScore(
    { valueScore, locationScore, walkingScore, comfortScore, familyScore, transportScore, worthMoneyScore },
    plannerInput,
  );
  const priceKnown = Boolean(normalizePrice(item));
  const locationKnown = Boolean(item.locationLabel);
  const confidence = clamp(52 + (priceKnown ? 20 : 0) + (locationKnown ? 12 : 0) + (item.confidenceScore ? 0.16 * item.confidenceScore : 0), 35, 97);
  const base = {
    itemId: item.id,
    itemType: inferItemType(item),
    itemTitle: item.name,
    valueScore,
    locationScore,
    walkingScore,
    comfortScore,
    familyScore,
    transportScore,
    worthMoneyScore,
    overallScore,
    confidence,
  };
  const strengths = buildStrengths(base);
  const warnings = generateBookingScoreWarnings(base, item, plannerInput);
  const aiReason =
    `${item.name} scores ${overallScore}/100 because ${locationScore >= comfortScore ? "location and access are doing a lot of the work" : "comfort quality is carrying the choice"}, ` +
    `${valueScore < 65 ? "while price-to-value is the main pressure point." : "and the value stays reasonably aligned with the trip setup."}`;

  return {
    ...base,
    aiReason,
    strengths,
    warnings,
  };
}

export function buildSmartBookingScorePayload(selectedItems: RecommendationPayload["selected"], plannerInput: UserTripInput, context: ScoreContext) {
  const items: ScoreableItem[] = [
    ...(selectedItems.hotel ? [selectedItems.hotel] : []),
    ...(selectedItems.flight ? [selectedItems.flight] : []),
    ...selectedItems.activities,
    ...(selectedItems.restaurant ? [selectedItems.restaurant] : []),
    ...(selectedItems.transport ? [selectedItems.transport] : []),
  ];
  const scores = items.map((item) => calculateSmartBookingScore(item, plannerInput, context));
  const overall = scores.length
    ? Math.round(scores.reduce((sum, item) => sum + item.overallScore, 0) / scores.length)
    : 0;
  const strengths = Array.from(new Set(scores.flatMap((item) => item.strengths))).slice(0, 4);
  const warnings = Array.from(new Set(scores.flatMap((item) => item.warnings))).slice(0, 4);
  return {
    scores,
    overall,
    summary:
      scores.length === 0
        ? "Add selected items first to unlock Smart Booking Scores."
        : `These booking choices stay strongest where ${strengths.slice(0, 2).join(" and ").toLowerCase() || "comfort and access line up"} with your planner inputs.`,
    caution:
      warnings.length
        ? warnings[0]
        : "No major booking pressure points are standing out from the current selection.",
  };
}
