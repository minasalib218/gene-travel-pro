import { PassStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  isEditCreditAction,
  isFreeAction,
  isMainCreditAction,
  type CreditActionType,
  type EditCreditAction,
  type MainCreditAction,
} from "@/lib/credits/creditActions";
import {
  canAccessFeature,
  getLockedFeatures,
  getPackageName,
  getPlanRules,
  getRequiredPlanForFeature,
  normalizePlanType,
} from "@/lib/credits/planRules";
import { isAdmin } from "@/lib/access/canUseAi";

export class CreditError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

type JsonMetadata = Record<string, unknown> | undefined;

export function toPassStatusString(status: PassStatus) {
  if (status === PassStatus.CANCELED) return "CANCELLED";
  return status;
}

export async function getActivePassForUser(userId: string) {
  if (await isAdmin(userId)) {
    return null;
  }
  const now = new Date();
  return prisma.pass.findFirst({
    where: {
      userId,
      status: PassStatus.ACTIVE,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: [{ expiresAt: "desc" }, { createdAt: "desc" }],
  });
}

export async function assertActivePass(userId: string) {
  if (await isAdmin(userId)) {
    return null;
  }
  const pass = await prisma.pass.findFirst({
    where: { userId },
    orderBy: [{ expiresAt: "desc" }, { createdAt: "desc" }],
  });

  if (!pass) {
    throw new CreditError("NO_ACTIVE_PASS", "A paid Gene pass is required to continue.");
  }

  if (pass.status === PassStatus.REFUNDED || pass.status === PassStatus.CANCELED) {
    throw new CreditError("PASS_INACTIVE", "This Gene pass is no longer active.");
  }

  if (pass.expiresAt && pass.expiresAt <= new Date()) {
    throw new CreditError("PASS_EXPIRED", "Your Gene pass has expired. Choose a new pass to continue planning.");
  }

  if (pass.status !== PassStatus.ACTIVE) {
    throw new CreditError("PASS_INACTIVE", "This Gene pass is not active right now.");
  }

  return pass;
}

function buildAdminStatus() {
  const rules = getPlanRules("agency");
  return {
    planType: "agency",
    packageName: "AGENCY" as const,
    status: "ACTIVE",
    mainCreditsTotal: 9999,
    mainCreditsUsed: 0,
    mainCreditsRemaining: 9999,
    editCreditsTotal: 9999,
    editCreditsUsed: 0,
    editCreditsRemaining: 9999,
    whatIfFreeRemaining: 9999,
    chatMessagesRemaining: null,
    expertReviewRemaining: 9999,
    expiresAt: null,
    features: rules.features,
    lockedFeatures: [] as string[],
    isAdminBypass: true,
  };
}

function buildStatus(pass: Exclude<Awaited<ReturnType<typeof assertActivePass>>, null>) {
  const normalizedPlanType = normalizePlanType(pass.planType || "starter");
  const rules = getPlanRules(normalizedPlanType);
  const mainCreditsTotal = pass.mainCreditsTotal || pass.tierActionsTotal || rules.mainCreditsTotal;
  const mainCreditsUsed = pass.mainCreditsUsed || pass.tierActionsUsed || 0;
  const editCreditsTotal = pass.editCreditsTotal || rules.editCreditsTotal;
  const editCreditsUsed = pass.editCreditsUsed || 0;
  const whatIfFreeTotal = pass.whatIfFreeTotal || rules.whatIfFreeTotal;
  const whatIfFreeUsed = pass.whatIfFreeUsed || 0;
  const chatMessagesTotal =
    typeof pass.chatMessagesTotal === "number" ? pass.chatMessagesTotal : rules.chatMessagesTotal;
  const chatMessagesUsed = pass.chatMessagesUsed || 0;
  const expertReviewTotal = pass.expertReviewTotal || rules.expertReviewTotal;
  const expertReviewUsed = pass.expertReviewUsed || 0;

  return {
    planType: normalizedPlanType,
    packageName: getPackageName(normalizedPlanType),
    status: toPassStatusString(pass.status),
    mainCreditsTotal,
    mainCreditsUsed,
    mainCreditsRemaining: Math.max(mainCreditsTotal - mainCreditsUsed, 0),
    editCreditsTotal,
    editCreditsUsed,
    editCreditsRemaining: Math.max(editCreditsTotal - editCreditsUsed, 0),
    whatIfFreeRemaining: Math.max(whatIfFreeTotal - whatIfFreeUsed, 0),
    chatMessagesRemaining:
      chatMessagesTotal === null ? null : Math.max(chatMessagesTotal - chatMessagesUsed, 0),
    expertReviewRemaining: Math.max(expertReviewTotal - expertReviewUsed, 0),
    expiresAt: pass.expiresAt?.toISOString() ?? null,
    features: rules.features,
    lockedFeatures: getLockedFeatures(normalizedPlanType),
    isAdminBypass: false,
  };
}

export async function getCreditStatus(userId: string) {
  if (await isAdmin(userId)) {
    return buildAdminStatus();
  }
  const pass = await assertActivePass(userId);
  return buildStatus(pass);
}

export async function canUseAction(
  userId: string,
  actionType: CreditActionType,
  requiredFeature?: string,
) {
  const admin = await isAdmin(userId);
  if (admin) {
    return {
      allowed: true as const,
      pass: null,
      creditType: "ADMIN" as const,
      status: buildAdminStatus(),
      blockedReason: null,
    };
  }

  const pass = await assertActivePass(userId);
  const status = buildStatus(pass);

  if (requiredFeature && !canAccessFeature(status.planType, requiredFeature)) {
    const requiredPlan = getRequiredPlanForFeature(requiredFeature);
    throw new CreditError(
      "FEATURE_NOT_INCLUDED",
      `This feature is locked on your current pass. Upgrade to ${requiredPlan} to use ${requiredFeature}.`,
    );
  }

  if (isFreeAction(actionType)) {
    return { allowed: true as const, pass, creditType: "FREE" as const, status, blockedReason: null };
  }

  if (actionType === "CHAT_MESSAGE") {
    const rules = getPlanRules(status.planType);
    if (rules.chatMessagesTotal === 0) {
      throw new CreditError("FEATURE_NOT_INCLUDED", "Chat is not included in your current Gene pass.");
    }
    if (rules.chatMessagesTotal !== null && (status.chatMessagesRemaining ?? 0) < 1) {
      throw new CreditError("CHAT_LIMIT_REACHED", "Your companion chat limit has been reached for this pass.");
    }
    return { allowed: true as const, pass, creditType: "CHAT" as const, status, blockedReason: null };
  }

  if (actionType === "EXPERT_REVIEW") {
    if (!canAccessFeature(status.planType, "Expert revision on the plan")) {
      throw new CreditError("FEATURE_NOT_INCLUDED", "Expert review is only available on the Agency pass.");
    }
    if (status.expertReviewRemaining < 1) {
      throw new CreditError("EXPERT_LIMIT_REACHED", "Your included expert review has already been used.");
    }
    return { allowed: true as const, pass, creditType: "EXPERT" as const, status, blockedReason: null };
  }

  if (actionType === "EXTRA_WHAT_IF_SIMULATION") {
    if (!canAccessFeature(status.planType, "What If Simulation Mode")) {
      throw new CreditError("FEATURE_NOT_INCLUDED", "What If Simulation Mode is not included in your current Gene pass.");
    }
    if (status.whatIfFreeRemaining > 0 || status.mainCreditsRemaining > 0) {
      return { allowed: true as const, pass, creditType: "WHAT_IF_OR_MAIN" as const, status, blockedReason: null };
    }
    throw new CreditError("NO_MAIN_CREDITS", "You used all your main AI credits. Upgrade your pass or buy more credits to generate another plan.");
  }

  if (isMainCreditAction(actionType)) {
    if (status.mainCreditsRemaining < 1) {
      throw new CreditError("NO_MAIN_CREDITS", "You used all your main AI credits. Upgrade your pass or buy more credits to generate another plan.");
    }
    return { allowed: true as const, pass, creditType: "MAIN" as const, status, blockedReason: null };
  }

  if (isEditCreditAction(actionType)) {
    if (status.editCreditsRemaining < 1) {
      throw new CreditError("NO_EDIT_CREDITS", "You used all your edit actions. You can still view and book your saved plan.");
    }
    return { allowed: true as const, pass, creditType: "EDIT" as const, status, blockedReason: null };
  }

  return { allowed: true as const, pass, creditType: "FREE" as const, status, blockedReason: null };
}

async function createLedgerRecord(tx: Prisma.TransactionClient, args: {
  userId: string;
  passId: string;
  customerEmail?: string | null;
  actionType: string;
  creditType: string;
  amount: number;
  balanceBefore?: number | null;
  balanceAfter?: number | null;
  reason?: string;
  metadata?: JsonMetadata;
}) {
  return tx.creditLedger.create({
    data: {
      userId: args.userId,
      customerEmail: args.customerEmail ?? null,
      passId: args.passId,
      actionType: args.actionType,
      creditType: args.creditType,
      type: args.amount >= 0 ? "CREDIT_ADDED" : "CREDIT_USED",
      amount: args.amount,
      balanceBefore: args.balanceBefore ?? null,
      balanceAfter: args.balanceAfter ?? null,
      reason: args.reason ?? null,
      metadata: (args.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
}

export async function consumeMainCredit(userId: string, actionType: MainCreditAction, metadata?: JsonMetadata) {
  await canUseAction(userId, actionType);

  if (await isAdmin(userId)) {
    return { pass: null, status: buildAdminStatus() };
  }

  return prisma.$transaction(async (tx) => {
    const pass = await tx.pass.findFirst({
      where: { userId, status: PassStatus.ACTIVE },
      orderBy: [{ expiresAt: "desc" }, { createdAt: "desc" }],
    });
    if (!pass) throw new CreditError("NO_ACTIVE_PASS", "A paid Gene pass is required to continue.");

    const before = pass.mainCreditsTotal - pass.mainCreditsUsed;
    if (before < 1) {
      throw new CreditError("NO_MAIN_CREDITS", "You used all your main AI credits. Upgrade your pass or buy more credits to generate another plan.");
    }

    const updated = await tx.pass.update({
      where: { id: pass.id },
      data: {
        mainCreditsUsed: { increment: 1 },
        tierActionsUsed: { increment: 1 },
      },
    });

    const after = before - 1;
    await createLedgerRecord(tx, {
      userId,
      passId: pass.id,
      customerEmail: pass.customerEmail,
      actionType,
      creditType: "MAIN",
      amount: -1,
      balanceBefore: before,
      balanceAfter: after,
      reason: `${actionType} consumed 1 main credit.`,
      metadata,
    });

    return { pass: updated, status: buildStatus(updated) };
  });
}

export async function consumeEditCredit(userId: string, actionType: EditCreditAction, metadata?: JsonMetadata) {
  await canUseAction(userId, actionType);

  if (await isAdmin(userId)) {
    return { pass: null, status: buildAdminStatus() };
  }

  return prisma.$transaction(async (tx) => {
    const pass = await tx.pass.findFirst({
      where: { userId, status: PassStatus.ACTIVE },
      orderBy: [{ expiresAt: "desc" }, { createdAt: "desc" }],
    });
    if (!pass) throw new CreditError("NO_ACTIVE_PASS", "A paid Gene pass is required to continue.");

    const before = pass.editCreditsTotal - pass.editCreditsUsed;
    if (before < 1) {
      throw new CreditError("NO_EDIT_CREDITS", "You used all your edit actions. You can still view and book your saved plan.");
    }

    const updated = await tx.pass.update({
      where: { id: pass.id },
      data: {
        editCreditsUsed: { increment: 1 },
      },
    });

    const after = before - 1;
    await createLedgerRecord(tx, {
      userId,
      passId: pass.id,
      customerEmail: pass.customerEmail,
      actionType,
      creditType: "EDIT",
      amount: -1,
      balanceBefore: before,
      balanceAfter: after,
      reason: `${actionType} consumed 1 edit credit.`,
      metadata,
    });

    return { pass: updated, status: buildStatus(updated) };
  });
}

export async function consumeWhatIf(userId: string, metadata?: JsonMetadata) {
  await canUseAction(userId, "EXTRA_WHAT_IF_SIMULATION");

  if (await isAdmin(userId)) {
    return { pass: null, status: buildAdminStatus() };
  }

  return prisma.$transaction(async (tx) => {
    const pass = await tx.pass.findFirst({
      where: { userId, status: PassStatus.ACTIVE },
      orderBy: [{ expiresAt: "desc" }, { createdAt: "desc" }],
    });
    if (!pass) throw new CreditError("NO_ACTIVE_PASS", "A paid Gene pass is required to continue.");

    const freeBefore = Math.max(pass.whatIfFreeTotal - pass.whatIfFreeUsed, 0);
    if (freeBefore > 0) {
      const updated = await tx.pass.update({
        where: { id: pass.id },
        data: { whatIfFreeUsed: { increment: 1 } },
      });
      await createLedgerRecord(tx, {
        userId,
        passId: pass.id,
        customerEmail: pass.customerEmail,
        actionType: "EXTRA_WHAT_IF_SIMULATION",
        creditType: "WHAT_IF_FREE",
        amount: -1,
        balanceBefore: freeBefore,
        balanceAfter: freeBefore - 1,
        reason: "Used one included What If simulation.",
        metadata,
      });
      return { pass: updated, status: buildStatus(updated) };
    }

    const before = pass.mainCreditsTotal - pass.mainCreditsUsed;
    if (before < 1) {
      throw new CreditError("NO_MAIN_CREDITS", "You used all your main AI credits. Upgrade your pass or buy more credits to generate another plan.");
    }

    const updated = await tx.pass.update({
      where: { id: pass.id },
      data: {
        mainCreditsUsed: { increment: 1 },
        tierActionsUsed: { increment: 1 },
      },
    });
    await createLedgerRecord(tx, {
      userId,
      passId: pass.id,
      customerEmail: pass.customerEmail,
      actionType: "EXTRA_WHAT_IF_SIMULATION",
      creditType: "MAIN",
      amount: -1,
      balanceBefore: before,
      balanceAfter: before - 1,
      reason: "Used main credit after free What If simulations were exhausted.",
      metadata,
    });
    return { pass: updated, status: buildStatus(updated) };
  });
}

export async function consumeChatMessage(userId: string, metadata?: JsonMetadata) {
  await canUseAction(userId, "CHAT_MESSAGE");

  if (await isAdmin(userId)) {
    return { pass: null, status: buildAdminStatus() };
  }

  return prisma.$transaction(async (tx) => {
    const pass = await tx.pass.findFirst({
      where: { userId, status: PassStatus.ACTIVE },
      orderBy: [{ expiresAt: "desc" }, { createdAt: "desc" }],
    });
    if (!pass) throw new CreditError("NO_ACTIVE_PASS", "A paid Gene pass is required to continue.");

    const rules = getPlanRules(pass.planType || "starter");
    if (rules.chatMessagesTotal === null) {
      return { pass, status: buildStatus(pass) };
    }

    const before = Math.max((pass.chatMessagesTotal ?? rules.chatMessagesTotal) - pass.chatMessagesUsed, 0);
    if (before < 1) {
      throw new CreditError("CHAT_LIMIT_REACHED", "Your companion chat limit has been reached for this pass.");
    }

    const updated = await tx.pass.update({
      where: { id: pass.id },
      data: { chatMessagesUsed: { increment: 1 } },
    });
    await createLedgerRecord(tx, {
      userId,
      passId: pass.id,
      customerEmail: pass.customerEmail,
      actionType: "CHAT_MESSAGE",
      creditType: "CHAT",
      amount: -1,
      balanceBefore: before,
      balanceAfter: before - 1,
      reason: "Used one travel companion chat message.",
      metadata,
    });
    return { pass: updated, status: buildStatus(updated) };
  });
}

export async function consumeExpertReview(userId: string, metadata?: JsonMetadata) {
  await canUseAction(userId, "EXPERT_REVIEW");

  if (await isAdmin(userId)) {
    return { pass: null, status: buildAdminStatus() };
  }

  return prisma.$transaction(async (tx) => {
    const pass = await tx.pass.findFirst({
      where: { userId, status: PassStatus.ACTIVE },
      orderBy: [{ expiresAt: "desc" }, { createdAt: "desc" }],
    });
    if (!pass) throw new CreditError("NO_ACTIVE_PASS", "A paid Gene pass is required to continue.");

    const before = Math.max(pass.expertReviewTotal - pass.expertReviewUsed, 0);
    if (before < 1) {
      throw new CreditError("EXPERT_LIMIT_REACHED", "Your included expert review has already been used.");
    }

    const updated = await tx.pass.update({
      where: { id: pass.id },
      data: { expertReviewUsed: { increment: 1 } },
    });
    await createLedgerRecord(tx, {
      userId,
      passId: pass.id,
      customerEmail: pass.customerEmail,
      actionType: "EXPERT_REVIEW",
      creditType: "EXPERT",
      amount: -1,
      balanceBefore: before,
      balanceAfter: before - 1,
      reason: "Used included expert review.",
      metadata,
    });
    return { pass: updated, status: buildStatus(updated) };
  });
}

export async function consumeCredit(userId: string, actionType: CreditActionType, metadata?: JsonMetadata) {
  if (await isAdmin(userId)) {
    return { free: true as const, status: buildAdminStatus() };
  }
  if (isFreeAction(actionType)) {
    return { free: true as const, status: await getCreditStatus(userId) };
  }
  if (actionType === "EXTRA_WHAT_IF_SIMULATION") return consumeWhatIf(userId, metadata);
  if (actionType === "CHAT_MESSAGE") return consumeChatMessage(userId, metadata);
  if (actionType === "EXPERT_REVIEW") return consumeExpertReview(userId, metadata);
  if (isMainCreditAction(actionType)) return consumeMainCredit(userId, actionType, metadata);
  if (isEditCreditAction(actionType)) return consumeEditCredit(userId, actionType, metadata);
  return { free: true as const, status: await getCreditStatus(userId) };
}

export async function refundConsumedCredit(userId: string, actionType: string, metadata?: JsonMetadata) {
  if (await isAdmin(userId)) {
    return { pass: null, status: buildAdminStatus() };
  }
  return prisma.$transaction(async (tx) => {
    const pass = await tx.pass.findFirst({
      where: { userId, status: PassStatus.ACTIVE },
      orderBy: [{ expiresAt: "desc" }, { createdAt: "desc" }],
    });
    if (!pass) return null;

    let data: Prisma.PassUpdateInput | null = null;
    let creditType = "MAIN";
    let before = 0;
    let after = 0;

    if (isEditCreditAction(actionType) && pass.editCreditsUsed > 0) {
      before = Math.max(pass.editCreditsTotal - pass.editCreditsUsed, 0);
      after = before + 1;
      data = { editCreditsUsed: { decrement: 1 } };
      creditType = "EDIT";
    } else if (pass.mainCreditsUsed > 0) {
      before = Math.max(pass.mainCreditsTotal - pass.mainCreditsUsed, 0);
      after = before + 1;
      data = {
        mainCreditsUsed: { decrement: 1 },
        tierActionsUsed: pass.tierActionsUsed > 0 ? { decrement: 1 } : undefined,
      };
      creditType = "MAIN";
    }

    if (!data) return null;

    const updated = await tx.pass.update({ where: { id: pass.id }, data });
    await tx.creditLedger.create({
      data: {
        userId,
        customerEmail: pass.customerEmail,
        passId: pass.id,
        actionType,
        creditType,
        type: "CREDIT_REFUND",
        amount: 1,
        balanceBefore: before,
        balanceAfter: after,
        reason: "AI_FAILED",
        metadata: (metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
    return { pass: updated, status: buildStatus(updated) };
  });
}

export async function logAiUsage(
  userId: string,
  passId: string | null,
  actionType: string,
  tokenData?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    model?: string;
    estimatedCost?: number;
    status?: string;
    errorMessage?: string;
  },
) {
  const pass = passId ? await prisma.pass.findUnique({ where: { id: passId } }) : null;
  return prisma.aiUsageLog.create({
    data: {
      userId,
      customerEmail: pass?.customerEmail ?? null,
      passId: passId ?? null,
      actionType,
      inputTokens: tokenData?.inputTokens ?? null,
      outputTokens: tokenData?.outputTokens ?? null,
      totalTokens: tokenData?.totalTokens ?? null,
      model: tokenData?.model ?? null,
      estimatedCost: tokenData?.estimatedCost ?? null,
      status: tokenData?.status ?? "SUCCESS",
      errorMessage: tokenData?.errorMessage ?? null,
    },
  });
}
