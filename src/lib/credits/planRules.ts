export type GenePlanType = "starter" | "pro" | "agency";
export type GenePackageName = "BASIC" | "PRO" | "AGENCY";

export type PlanRule = {
  planType: GenePlanType;
  packageName: GenePackageName;
  mainCreditsTotal: number;
  editCreditsTotal: number;
  expiresInDays: number;
  whatIfFreeTotal: number;
  chatMessagesTotal: number | null;
  chatWindowHours?: number;
  expertReviewTotal: number;
  features: string[];
  dailyMainAiLimit: number;
  hourlyMainAiLimit: number;
  cooldownSeconds: number;
  monthlyTokenLimit: number;
  aiPriority: "slow" | "medium" | "highest";
};

const STARTER_FEATURES = [
  "AI Trip Personality Engine",
  "Dynamic itinerary editing",
  "Live prices and booking integration",
  "Multi city and route optimization",
  "Budget management tools",
  "Energy & Mood Prediction Engine",
  "Smart Booking Score",
  "Cinematic Story Mode",
  "Travel Happiness Score",
  "One Click Style Switch",
  "AI Event Injection",
  "AI Transportation Genius",
  "Confidence Modules Expansion",
  "Smart Memory Timeline",
] as const;

const PRO_FEATURES = [
  ...STARTER_FEATURES,
  "What If Simulation Mode",
  "Smart Crowd & Queue Predictor",
  "Smart Visa & Entry Assistant",
  "AI Packing Assistant",
  "AI Spending Protection",
  "Smart Sleep Optimizer",
  "AI Negotiation Suggestions",
  "Why This Plan Works",
  "AI Plan Health Score",
] as const;

const AGENCY_FEATURES = [
  ...PRO_FEATURES,
  "AI Auto-Recovery Mode",
  "Gene Copilot",
  "Ultra Accurate Transfer Logic",
  "Expert revision on the plan",
] as const;

const RULES: Record<GenePlanType, PlanRule> = {
  starter: {
    planType: "starter",
    packageName: "BASIC",
    mainCreditsTotal: 3,
    editCreditsTotal: 10,
    expiresInDays: 7,
    whatIfFreeTotal: 0,
    chatMessagesTotal: 0,
    expertReviewTotal: 0,
    features: [...STARTER_FEATURES],
    dailyMainAiLimit: 3,
    hourlyMainAiLimit: 3,
    cooldownSeconds: 60,
    monthlyTokenLimit: 250000,
    aiPriority: "slow",
  },
  pro: {
    planType: "pro",
    packageName: "PRO",
    mainCreditsTotal: 5,
    editCreditsTotal: 20,
    expiresInDays: 30,
    whatIfFreeTotal: 0,
    chatMessagesTotal: 0,
    expertReviewTotal: 0,
    features: [...PRO_FEATURES],
    dailyMainAiLimit: 4,
    hourlyMainAiLimit: 6,
    cooldownSeconds: 45,
    monthlyTokenLimit: 500000,
    aiPriority: "medium",
  },
  agency: {
    planType: "agency",
    packageName: "AGENCY",
    mainCreditsTotal: 8,
    editCreditsTotal: 35,
    expiresInDays: 30,
    whatIfFreeTotal: 0,
    chatMessagesTotal: null,
    expertReviewTotal: 1,
    features: [...AGENCY_FEATURES],
    dailyMainAiLimit: 8,
    hourlyMainAiLimit: 10,
    cooldownSeconds: 30,
    monthlyTokenLimit: 1000000,
    aiPriority: "highest",
  },
};

export function normalizePlanType(planType: string | null | undefined): GenePlanType {
  const normalized = String(planType ?? "").trim().toLowerCase();
  if (normalized === "agency") return "agency";
  if (normalized === "pro") return "pro";
  if (normalized === "basic" || normalized === "starter") return "starter";
  return "starter";
}

export function getPlanRules(planType: string): PlanRule {
  const normalized = normalizePlanType(planType);
  return RULES[normalized];
}

export function getPackageName(planType: string): GenePackageName {
  return getPlanRules(planType).packageName;
}

export function getAllFeatureNames() {
  return [...new Set([...STARTER_FEATURES, ...PRO_FEATURES, ...AGENCY_FEATURES])];
}

export function getLockedFeatures(planType: string) {
  const enabled = new Set(getPlanRules(planType).features);
  return getAllFeatureNames().filter((feature) => !enabled.has(feature));
}

export function getRequiredPlanForFeature(featureKey: string): GenePackageName {
  if (AGENCY_FEATURES.includes(featureKey as (typeof AGENCY_FEATURES)[number]) && !PRO_FEATURES.includes(featureKey as (typeof PRO_FEATURES)[number])) {
    return "AGENCY";
  }
  if (PRO_FEATURES.includes(featureKey as (typeof PRO_FEATURES)[number]) && !STARTER_FEATURES.includes(featureKey as (typeof STARTER_FEATURES)[number])) {
    return "PRO";
  }
  return "BASIC";
}

export function canAccessFeature(planType: string, featureKey: string) {
  const rules = getPlanRules(planType);
  return rules.features.includes(featureKey);
}
