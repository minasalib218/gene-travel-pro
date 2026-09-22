import { PlanningStage, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const transitions: Record<PlanningStage, readonly PlanningStage[]> = {
  DRAFT_INPUT: ["RECOMMENDATIONS_GENERATING", "ARCHIVED"],
  RECOMMENDATIONS_GENERATING: ["RECOMMENDATIONS_READY", "GENERATION_FAILED"],
  RECOMMENDATIONS_READY: ["SELECTIONS_CONFIRMED", "RECOMMENDATIONS_GENERATING", "ARCHIVED"],
  SELECTIONS_CONFIRMED: ["TIMELINE_GENERATING", "RECOMMENDATIONS_READY", "ARCHIVED"],
  TIMELINE_GENERATING: ["TIMELINE_READY", "GENERATION_FAILED"],
  TIMELINE_READY: ["SUMMARY_READY", "TIMELINE_GENERATING", "ARCHIVED"],
  GENERATION_FAILED: ["RECOMMENDATIONS_GENERATING", "TIMELINE_GENERATING", "ARCHIVED"],
  SUMMARY_READY: ["TIMELINE_READY", "ARCHIVED"],
  ARCHIVED: [],
};

export class PlanningSessionError extends Error {
  constructor(public code: "NOT_FOUND" | "STALE_VERSION" | "INVALID_TRANSITION") {
    super(code);
  }
}

export function canTransitionPlanningStage(from: PlanningStage, to: PlanningStage) {
  return from === to || transitions[from].includes(to);
}

export async function updateOwnedPlanningSession(args: {
  planId: string;
  userId: string;
  expectedVersion: number;
  nextStage?: PlanningStage;
  data?: Prisma.PlanUpdateManyMutationInput;
}) {
  const current = await prisma.plan.findFirst({
    where: { id: args.planId, userId: args.userId },
    select: { planningStage: true, version: true },
  });
  if (!current) throw new PlanningSessionError("NOT_FOUND");
  if (current.version !== args.expectedVersion) throw new PlanningSessionError("STALE_VERSION");
  if (args.nextStage && !canTransitionPlanningStage(current.planningStage, args.nextStage)) {
    throw new PlanningSessionError("INVALID_TRANSITION");
  }

  const result = await prisma.plan.updateMany({
    where: { id: args.planId, userId: args.userId, version: args.expectedVersion },
    data: {
      ...(args.data ?? {}),
      ...(args.nextStage ? { planningStage: args.nextStage } : {}),
      version: { increment: 1 },
    },
  });
  if (result.count !== 1) throw new PlanningSessionError("STALE_VERSION");
  return prisma.plan.findFirst({ where: { id: args.planId, userId: args.userId } });
}
