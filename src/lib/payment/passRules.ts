export type PublicPlanType = "starter" | "pro" | "agency";
export type InternalPassTier = "basic" | "pro" | "agency";
export type PackageName = "BASIC" | "PRO" | "AGENCY";

export type PassRule = {
  planType: PublicPlanType;
  packageName: PackageName;
  internalTier: InternalPassTier;
  planCredits: number;
  editCredits: number;
  expiresInDays: number;
  paddlePriceEnv: string;
};

export const PASS_RULES: Record<PublicPlanType, PassRule> = {
  starter: {
    planType: "starter",
    packageName: "BASIC",
    internalTier: "basic",
    planCredits: 3,
    editCredits: 10,
    expiresInDays: 7,
    paddlePriceEnv: "PADDLE_PRICE_STARTER",
  },
  pro: {
    planType: "pro",
    packageName: "PRO",
    internalTier: "pro",
    planCredits: 5,
    editCredits: 20,
    expiresInDays: 30,
    paddlePriceEnv: "PADDLE_PRICE_PRO",
  },
  agency: {
    planType: "agency",
    packageName: "AGENCY",
    internalTier: "agency",
    planCredits: 8,
    editCredits: 35,
    expiresInDays: 30,
    paddlePriceEnv: "PADDLE_PRICE_AGENCY",
  },
};

export function isPublicPlanType(value: unknown): value is PublicPlanType {
  return value === "starter" || value === "pro" || value === "agency";
}

export function getPassRule(planType: PublicPlanType) {
  return PASS_RULES[planType];
}

export function getCreditsForPlan(planType: string): number {
  if (isPublicPlanType(planType)) {
    return PASS_RULES[planType].planCredits;
  }

  return PASS_RULES.starter.planCredits;
}

export function getPaddlePriceId(planType: PublicPlanType) {
  return process.env[getPassRule(planType).paddlePriceEnv] || "";
}

export function mapTierToPublicPlan(tier: string): PublicPlanType {
  if (tier === "agency") return "agency";
  if (tier === "pro") return "pro";
  return "starter";
}
