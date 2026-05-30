import type {
  RecommendationPayload,
  SmartBookingScore,
  TravelHappinessScore,
} from "@/lib/recommendation/types";

type HappinessContext = {
  crowdRisk: number;
  weatherRisk: number;
  routeMinutes: number;
  walkingKm: number;
  walkingToleranceMinutes: number;
  dayDensity: number;
  smartBookingScores?: SmartBookingScore[];
};

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function hasPersonality(payload: RecommendationPayload, label: string) {
  return (payload.inputs.tripPersonality || []).some((item) =>
    item.toLowerCase().includes(label.toLowerCase()),
  );
}

function countKeywordMatches(text: string, keywords: string[]) {
  const lowered = text.toLowerCase();
  return keywords.reduce((sum, keyword) => sum + (lowered.includes(keyword) ? 1 : 0), 0);
}

function buildCorpus(payload: RecommendationPayload) {
  return payload.dayPlan
    .flatMap((day) => day.items)
    .map((item) => `${item.title} ${item.description} ${item.destinationLabel || ""}`)
    .join(" ")
    .toLowerCase();
}

export function calculateTravelHappinessConfidence(
  payload: RecommendationPayload,
  context: HappinessContext,
) {
  let confidence = 58;
  if (payload.dayPlan.length) confidence += 10;
  if (payload.selected.hotel || payload.selected.flight || payload.selected.activities.length) confidence += 10;
  if (context.smartBookingScores?.length) confidence += 10;
  if (payload.dayPlan.some((day) => day.items.some((item) => item.crowdLevel))) confidence += 8;
  if (payload.inputs.tripPersonality?.length) confidence += 5;
  if (!payload.inputs.budget) confidence -= 12;
  if (!payload.inputs.walkingTolerance) confidence -= 6;
  return clamp(confidence, 42, 96);
}

export function calculateEnjoymentProbability(
  payload: RecommendationPayload,
  context: HappinessContext,
) {
  const corpus = buildCorpus(payload);
  const personalities = payload.inputs.tripPersonality || [];
  let score = 68;

  if (personalities.length) score += 5;
  if (hasPersonality(payload, "luxury") && (payload.selected.hotel?.rating || 0) >= 4.5) score += 10;
  if (hasPersonality(payload, "famous") && countKeywordMatches(corpus, ["museum", "pyramids", "acropolis", "landmark"]) >= 2) score += 9;
  if (hasPersonality(payload, "hidden") && payload.selected.hiddenGems?.length) score += 8;
  if (hasPersonality(payload, "photography") && countKeywordMatches(corpus, ["view", "sunset", "panorama", "cruise"]) >= 2) score += 9;
  if (hasPersonality(payload, "nightlife") && countKeywordMatches(corpus, ["dinner", "night", "evening", "cruise"]) >= 2) score += 7;
  if (context.crowdRisk <= 48) score += 4;
  if (context.walkingKm <= Math.max(3, context.walkingToleranceMinutes / 12)) score += 5;
  if (context.dayDensity <= 4.5) score += 4;
  if ((context.smartBookingScores || []).length) {
    const avgComfort =
      context.smartBookingScores!.reduce((sum, item) => sum + item.comfortScore, 0) /
      context.smartBookingScores!.length;
    score += (avgComfort - 70) * 0.18;
  }

  return clamp(score, 34, 98);
}

export function calculateStressProbability(
  payload: RecommendationPayload,
  context: HappinessContext,
) {
  const costPressure = payload.inputs.budget
    ? Math.max(
        0,
        ((payload.dayPlan.flatMap((day) => day.items).reduce((sum, item) => sum + Number(item.cost || 0), 0) /
          Math.max(payload.inputs.budget, 1)) -
          0.85) *
          100,
      )
    : 14;
  let score = 26;

  score += context.crowdRisk * 0.22;
  score += Math.max(context.walkingKm - Math.max(3, context.walkingToleranceMinutes / 12), 0) * 6;
  score += Math.max(context.routeMinutes - 240, 0) / 18;
  score += Math.max(context.dayDensity - 4.5, 0) * 6;
  score += context.weatherRisk * 0.12;
  score += costPressure * 0.22;

  const fatigueSignals = payload.inputs.energyFatigueSignals || [];
  if (fatigueSignals.includes("Walking Overload")) score += 10;
  if (fatigueSignals.includes("Elderly Fatigue")) score += 8;
  if (fatigueSignals.includes("Kid Fatigue")) score += 7;
  if (fatigueSignals.includes("Jet Lag Effect") && payload.dayPlan.some((day) => day.items.some((item) => item.type === "flight"))) score += 6;

  return clamp(score, 10, 96);
}

export function calculateCompatibilityScore(
  payload: RecommendationPayload,
  context: HappinessContext,
) {
  const corpus = buildCorpus(payload);
  const travelerType = payload.inputs.travelerType;
  let score = 70;

  if (travelerType === "family" && countKeywordMatches(corpus, ["family", "museum", "cruise", "easy"]) >= 2) score += 8;
  if (payload.inputs.kids && context.dayDensity <= 4.5) score += 6;
  if (payload.inputs.elderly && context.walkingKm <= Math.max(4, context.walkingToleranceMinutes / 12)) score += 7;
  if (hasPersonality(payload, "luxury") && (payload.selected.hotel?.rating || 0) >= 4.3) score += 8;
  if (hasPersonality(payload, "adventure") && countKeywordMatches(corpus, ["cruise", "walk", "tour", "explore"]) >= 2) score += 8;
  if (hasPersonality(payload, "hidden") && payload.selected.hiddenGems?.length) score += 8;
  if (hasPersonality(payload, "famous") && countKeywordMatches(corpus, ["pyramids", "acropolis", "museum", "landmark"]) >= 2) score += 7;
  if ((payload.inputs.energyFatigueSignals || []).length && context.dayDensity <= 4.8) score += 6;
  if ((context.smartBookingScores || []).length) {
    const avgOverall =
      context.smartBookingScores!.reduce((sum, item) => sum + item.overallScore, 0) /
      context.smartBookingScores!.length;
    score += (avgOverall - 72) * 0.16;
  }

  return clamp(score, 36, 98);
}

export function buildTravelHappinessSummary(
  score: TravelHappinessScore,
  payload: RecommendationPayload,
) {
  const intro =
    score.overallScore >= 85
      ? "This trip feels highly aligned with the traveler’s style because it stays emotionally rewarding without making the route feel overworked."
      : score.overallScore >= 72
      ? "This plan has a strong core, with good upside on enjoyment as long as the busiest windows stay controlled."
      : "This trip still has strong moments, but a few pressure points are making comfort and realism work harder than they should.";

  const positiveDrivers: string[] = [];
  const riskDrivers: string[] = [];

  if (score.compatibilityScore >= 80) positiveDrivers.push("Strong match with traveler personality");
  if (score.enjoymentProbability >= 82) positiveDrivers.push("High enjoyment potential from the selected mix");
  if ((payload.inputs.daysWithoutTrips?.length || 0) > 0 || (payload.inputs.energyFatigueSignals || []).length) positiveDrivers.push("Good pace and recovery windows");
  if (payload.selected.hiddenGems.length && payload.inputs.tripPersonality?.some((item) => /hidden|exploration|photography/i.test(item))) positiveDrivers.push("Balanced mix of famous places and local texture");

  if (score.stressProbability >= 55) riskDrivers.push("Crowd or routing pressure may increase stress");
  if ((payload.inputs.energyFatigueSignals || []).length && score.stressProbability >= 45) riskDrivers.push("Fatigue signals need a gentler execution rhythm");
  if (payload.selected.flight && payload.dayPlan.some((day) => day.items.some((item) => item.type === "flight"))) riskDrivers.push("Transfer days need tighter timing");
  if (score.overallScore < 70) riskDrivers.push("Budget or walking pressure is softening the overall fit");

  return {
    aiSummary: intro,
    positiveDrivers: positiveDrivers.slice(0, 4),
    riskDrivers: riskDrivers.slice(0, 4),
  };
}

export function calculateTravelHappinessScore(
  plannerInput: RecommendationPayload["inputs"],
  payload: RecommendationPayload,
  analysisContext: HappinessContext,
): TravelHappinessScore {
  const enjoymentProbability = calculateEnjoymentProbability(payload, analysisContext);
  const stressProbability = calculateStressProbability(payload, analysisContext);
  const compatibilityScore = calculateCompatibilityScore(payload, analysisContext);
  const confidence = calculateTravelHappinessConfidence(payload, analysisContext);
  const overallScore = clamp(
    enjoymentProbability * 0.36 +
      (100 - stressProbability) * 0.28 +
      compatibilityScore * 0.28 +
      confidence * 0.08,
  );

  const summary = buildTravelHappinessSummary(
    {
      enjoymentProbability,
      stressProbability,
      compatibilityScore,
      overallScore,
      confidence,
      aiSummary: "",
      positiveDrivers: [],
      riskDrivers: [],
    },
    payload,
  );

  return {
    enjoymentProbability,
    stressProbability,
    compatibilityScore,
    overallScore,
    confidence,
    aiSummary: summary.aiSummary,
    positiveDrivers: summary.positiveDrivers,
    riskDrivers: summary.riskDrivers,
  };
}
