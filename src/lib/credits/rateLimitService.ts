import { endOfMonth, startOfDay, subSeconds } from "@/lib/credits/timeHelpers";
import { prisma } from "@/lib/prisma";
import { getActivePassForUser, getCreditStatus } from "@/lib/credits/creditService";
import { getPlanRules } from "@/lib/credits/planRules";
import { isMainCreditAction } from "@/lib/credits/creditActions";
import { isAdmin } from "@/lib/access/canUseAi";

function startOfCurrentMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export async function recordRateLimitBlock(userId: string, actionType: string, limitType: string) {
  if (await isAdmin(userId)) return null;
  const pass = await getActivePassForUser(userId);
  return prisma.rateLimitLog.create({
    data: {
      userId,
      customerEmail: pass?.customerEmail ?? null,
      passId: pass?.id ?? null,
      actionType,
      limitType,
    },
  });
}

export async function checkDailyRequestLimit(userId: string, actionType: string) {
  if (await isAdmin(userId)) return { ok: true as const };
  if (!isMainCreditAction(actionType)) return { ok: true as const };
  const pass = await getActivePassForUser(userId);
  if (!pass) return { ok: false as const, code: "NO_ACTIVE_PASS", message: "A paid Gene pass is required to continue." };

  const rules = getPlanRules(pass.planType || "starter");
  const usedToday = await prisma.creditLedger.count({
    where: {
      userId,
      actionType,
      creditType: "MAIN",
      type: { in: ["CREDIT_USED"] },
      createdAt: { gte: startOfDay(new Date()) },
    },
  });

  if (usedToday >= rules.dailyMainAiLimit) {
    await recordRateLimitBlock(userId, actionType, "DAILY_REQUEST");
    return { ok: false as const, code: "RATE_LIMIT_DAILY", message: "You reached your current plan limit. Please wait or upgrade your pass." };
  }

  return { ok: true as const };
}

export async function checkHourlyRequestLimit(userId: string, actionType: string) {
  if (await isAdmin(userId)) return { ok: true as const };
  if (!isMainCreditAction(actionType)) return { ok: true as const };
  const pass = await getActivePassForUser(userId);
  if (!pass) return { ok: false as const, code: "NO_ACTIVE_PASS", message: "A paid Gene pass is required to continue." };

  const rules = getPlanRules(pass.planType || "starter");
  const usedInWindow = await prisma.creditLedger.count({
    where: {
      userId,
      actionType,
      creditType: "MAIN",
      type: "CREDIT_USED",
      createdAt: { gte: subSeconds(new Date(), 60 * 60) },
    },
  });

  if (usedInWindow >= rules.hourlyMainAiLimit) {
    await recordRateLimitBlock(userId, actionType, "HOURLY_REQUEST");
    return {
      ok: false as const,
      code: "RATE_LIMIT_HOURLY",
      message: "You reached your hourly AI limit for this package. Please try again later.",
    };
  }

  return { ok: true as const };
}

export async function checkCooldown(userId: string, actionType: string) {
  if (await isAdmin(userId)) return { ok: true as const };
  if (!isMainCreditAction(actionType)) return { ok: true as const };
  const pass = await getActivePassForUser(userId);
  if (!pass) return { ok: false as const, code: "NO_ACTIVE_PASS", message: "A paid Gene pass is required to continue." };

  const rules = getPlanRules(pass.planType || "starter");
  const latest = await prisma.creditLedger.findFirst({
    where: {
      userId,
      actionType,
      creditType: "MAIN",
      type: "CREDIT_USED",
      createdAt: { gte: subSeconds(new Date(), rules.cooldownSeconds) },
    },
    orderBy: { createdAt: "desc" },
  });

  if (latest) {
    await recordRateLimitBlock(userId, actionType, "COOLDOWN");
    return { ok: false as const, code: "RATE_LIMIT_COOLDOWN", message: "Please wait a moment before generating another AI result." };
  }

  return { ok: true as const };
}

export async function checkMonthlyTokenLimit(userId: string) {
  if (await isAdmin(userId)) return { ok: true as const };
  const pass = await getActivePassForUser(userId);
  if (!pass) return { ok: false as const, code: "NO_ACTIVE_PASS", message: "A paid Gene pass is required to continue." };

  const rules = getPlanRules(pass.planType || "starter");
  const aggregate = await prisma.aiUsageLog.aggregate({
    where: {
      userId,
      createdAt: { gte: startOfCurrentMonth(), lte: endOfMonth(new Date()) },
      status: "SUCCESS",
    },
    _sum: { totalTokens: true },
  });

  const used = aggregate._sum.totalTokens ?? 0;
  if (used >= rules.monthlyTokenLimit) {
    await recordRateLimitBlock(userId, "TOKEN_MONTHLY", "TOKEN_MONTHLY");
    return { ok: false as const, code: "RATE_LIMIT_TOKENS", message: "You reached your current plan limit. Please wait or upgrade your pass." };
  }

  return { ok: true as const };
}

export async function assertRateLimits(userId: string, actionType: string) {
  if (await isAdmin(userId)) {
    return { ok: true as const };
  }
  const status = await getCreditStatus(userId);
  if (status.mainCreditsRemaining <= 0 && isMainCreditAction(actionType)) {
    await recordRateLimitBlock(userId, actionType, "CREDIT_EMPTY");
    return { ok: false as const, code: "CREDIT_EMPTY", message: "You reached your current plan limit. Please wait or upgrade your pass." };
  }

  const daily = await checkDailyRequestLimit(userId, actionType);
  if (!daily.ok) return daily;
  const hourly = await checkHourlyRequestLimit(userId, actionType);
  if (!hourly.ok) return hourly;
  const cooldown = await checkCooldown(userId, actionType);
  if (!cooldown.ok) return cooldown;
  const tokens = await checkMonthlyTokenLimit(userId);
  if (!tokens.ok) return tokens;
  return { ok: true as const };
}
