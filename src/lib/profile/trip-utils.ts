import type { PlanStatus, Prisma } from "@prisma/client";

export type TripSource = "READY_PLAN" | "AI_GENERATED" | "READY_PLAN_CUSTOMIZED" | "MANUAL";
export type TripAccess = "FREE" | "PAID";
export type TripDisplayStatus = "DRAFT" | "PLANNING" | "READY" | "UPCOMING" | "ACTIVE" | "COMPLETED" | "ARCHIVED";

export type GeneTripMeta = {
  sourceType?: TripSource;
  accessType?: TripAccess;
  planningStage?: "INPUT" | "RECOMMENDATION" | "ANALYSIS" | "DAY_BY_DAY" | "BOOKING" | "SUMMARY";
  sourceReadyPlanId?: string;
  sourceReadyPlanSlug?: string;
  coverImage?: string;
  travelersCount?: number;
  datesSelected?: boolean;
  archivedAt?: string | null;
  updatedAt?: string;
};

export function objectValue(value: Prisma.JsonValue | null | undefined): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export function getGeneTripMeta(inputsJson: Prisma.JsonValue | null | undefined): GeneTripMeta {
  const inputs = objectValue(inputsJson);
  const metadata = inputs.geneTrip;
  return metadata && typeof metadata === "object" && !Array.isArray(metadata)
    ? metadata as GeneTripMeta
    : {};
}

export function mergeGeneTripMeta(
  inputsJson: Prisma.JsonValue | null | undefined,
  updates: Partial<GeneTripMeta>,
): Prisma.InputJsonValue {
  const inputs = objectValue(inputsJson);
  return {
    ...inputs,
    geneTrip: {
      ...getGeneTripMeta(inputsJson),
      ...updates,
      updatedAt: new Date().toISOString(),
    },
  } as Prisma.InputJsonValue;
}

export function classifyTrip(args: {
  status: PlanStatus;
  startDate: Date;
  endDate: Date;
  meta: GeneTripMeta;
  now?: Date;
}): TripDisplayStatus {
  if (args.meta.archivedAt) return "ARCHIVED";
  const now = args.now ?? new Date();
  if (args.status === "DRAFT") return "DRAFT";
  if (args.status === "RECOMMENDED" || args.status === "ANALYZED") return "PLANNING";
  if (args.endDate.getTime() < now.getTime()) return "COMPLETED";
  if (args.startDate.getTime() <= now.getTime() && args.endDate.getTime() >= now.getTime()) return "ACTIVE";
  if (args.startDate.getTime() > now.getTime()) return "UPCOMING";
  return "READY";
}

export function resumeHref(planId: string, status: PlanStatus, meta: GeneTripMeta) {
  const stage = meta.planningStage;
  if (stage === "INPUT") return `/ai-planner?planId=${encodeURIComponent(planId)}`;
  if (stage === "RECOMMENDATION") return `/ai/recommendation?planId=${encodeURIComponent(planId)}`;
  if (stage === "ANALYSIS") return `/ai/analysis?planId=${encodeURIComponent(planId)}`;
  if (stage === "DAY_BY_DAY") return `/ai/day-by-day?planId=${encodeURIComponent(planId)}`;
  if (stage === "BOOKING") return `/ai/booking?planId=${encodeURIComponent(planId)}`;
  if (stage === "SUMMARY") return `/plan-summary/${encodeURIComponent(planId)}`;
  if (status === "DRAFT") return `/ai-planner?planId=${encodeURIComponent(planId)}`;
  if (status === "RECOMMENDED") return `/ai/recommendation?planId=${encodeURIComponent(planId)}`;
  if (status === "ANALYZED") return `/ai/analysis?planId=${encodeURIComponent(planId)}`;
  return `/plan-summary/${encodeURIComponent(planId)}`;
}

export function planningProgress(args: {
  datesSelected: boolean;
  travelersCount: number;
  dayCount: number;
  itemCount: number;
  status: PlanStatus;
}) {
  let score = 0;
  if (args.datesSelected) score += 20;
  if (args.travelersCount > 0) score += 15;
  if (args.dayCount > 0) score += 30;
  if (args.itemCount > 0) score += 20;
  if (args.status === "CONFIRMED") score += 15;
  return Math.min(score, 100);
}

export function bookingProgress(selected: number, booked: number) {
  const total = Math.max(selected, booked);
  return total > 0 ? Math.min(100, Math.round((booked / total) * 100)) : 0;
}
