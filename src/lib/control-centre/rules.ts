export type BookingStatus =
  | "NOT_SELECTED"
  | "SELECTED"
  | "CLICKED"
  | "BOOKING_PENDING"
  | "CUSTOMER_CONFIRMED"
  | "PROVIDER_CONFIRMED"
  | "CANCELLED"
  | "REFUNDED";

export type PriceType = "LIVE" | "RECENTLY_CHECKED" | "ESTIMATED";

const BOOKING_TRANSITIONS: Record<BookingStatus, readonly BookingStatus[]> = {
  NOT_SELECTED: ["SELECTED"],
  SELECTED: ["NOT_SELECTED", "CLICKED"],
  CLICKED: ["BOOKING_PENDING", "CUSTOMER_CONFIRMED", "CANCELLED"],
  BOOKING_PENDING: ["CUSTOMER_CONFIRMED", "PROVIDER_CONFIRMED", "CANCELLED"],
  CUSTOMER_CONFIRMED: ["PROVIDER_CONFIRMED", "CANCELLED", "REFUNDED"],
  PROVIDER_CONFIRMED: ["CANCELLED", "REFUNDED"],
  CANCELLED: ["REFUNDED"],
  REFUNDED: [],
};

export function canTransitionBooking(from: BookingStatus, to: BookingStatus) {
  return BOOKING_TRANSITIONS[from].includes(to);
}

export function assertBookingTransition(from: BookingStatus, to: BookingStatus) {
  if (!canTransitionBooking(from, to)) {
    throw new Error(`INVALID_BOOKING_TRANSITION:${from}:${to}`);
  }
}

export type FatigueInput = {
  scheduledMinutes: number;
  walkingIntensity: number;
  physicalIntensity: number;
  transferCount: number;
  hotelChanges: number;
  sleepHours: number;
  hasChildrenOrElderly: boolean;
};

export function calculateFatigue(input: FatigueInput) {
  const duration = Math.max(0, input.scheduledMinutes - 480) / 12;
  const walking = Math.max(0, input.walkingIntensity) * 8;
  const physical = Math.max(0, input.physicalIntensity) * 9;
  const transfers = Math.max(0, input.transferCount) * 6;
  const hotels = Math.max(0, input.hotelChanges) * 10;
  const sleep = Math.max(0, 7 - input.sleepHours) * 8;
  const vulnerability = input.hasChildrenOrElderly ? 8 : 0;
  const score = Math.min(100, Math.round(duration + walking + physical + transfers + hotels + sleep + vulnerability));
  return { score, level: score >= 70 ? "HIGH" : score >= 40 ? "MEDIUM" : "LOW" } as const;
}

export type ReadinessCategory =
  | "transport"
  | "accommodation"
  | "activities"
  | "documents"
  | "packing"
  | "insurance"
  | "connectivity"
  | "budget"
  | "airportTransfers";

export const READINESS_WEIGHTS: Record<ReadinessCategory, number> = {
  transport: 20,
  accommodation: 20,
  activities: 15,
  documents: 15,
  packing: 10,
  insurance: 5,
  connectivity: 5,
  budget: 5,
  airportTransfers: 5,
};

export function calculateReadiness(values: Partial<Record<ReadinessCategory, number>>) {
  const categories = Object.entries(READINESS_WEIGHTS).map(([key, weight]) => {
    const value = Math.max(0, Math.min(100, values[key as ReadinessCategory] ?? 0));
    return { key: key as ReadinessCategory, weight, value, weighted: (value * weight) / 100 };
  });
  return {
    score: Math.round(categories.reduce((sum, category) => sum + category.weighted, 0)),
    categories,
    missing: categories.filter((category) => category.value < 100).map((category) => category.key),
  };
}

export type Money = { amount: number; currency: string };

export function calculateBudget(args: { planned: Money; costs: Money[] }) {
  const currency = args.planned.currency.toUpperCase();
  if (args.costs.some((cost) => cost.currency.toUpperCase() !== currency)) {
    throw new Error("MIXED_CURRENCY_REQUIRES_CONFIRMED_CONVERSION");
  }
  const spent = args.costs.reduce((sum, cost) => sum + cost.amount, 0);
  return { currency, planned: args.planned.amount, spent, remaining: args.planned.amount - spent };
}

export function getPriceDisplay(args: {
  type: PriceType;
  checkedAt?: Date | null;
  now?: Date;
  liveFreshnessMinutes?: number;
}) {
  const now = args.now ?? new Date();
  const freshness = args.liveFreshnessMinutes ?? 30;
  if (args.type === "ESTIMATED") return { label: "Estimated", effectiveType: "ESTIMATED" as const };
  if (!args.checkedAt) return { label: "Check latest price", effectiveType: "ESTIMATED" as const };
  const ageMinutes = (now.getTime() - args.checkedAt.getTime()) / 60_000;
  if (args.type === "LIVE" && ageMinutes <= freshness) return { label: "Live", effectiveType: "LIVE" as const };
  return { label: `Checked ${args.checkedAt.toISOString()}`, effectiveType: "RECENTLY_CHECKED" as const };
}

export function sanitizeOpaqueSubId(value: string) {
  const sanitized = value.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 64);
  if (!sanitized) throw new Error("INVALID_OPAQUE_SUB_ID");
  return sanitized;
}

