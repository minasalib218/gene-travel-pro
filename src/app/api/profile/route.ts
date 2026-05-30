import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { createRouteClient } from "@/lib/supabase/server";
import { getActivePassOrNull } from "@/lib/require-pass";
import { getPlanRules } from "@/lib/credits/planRules";
import { PassStatus } from "@prisma/client";

export async function GET() {
  const supabase = createRouteClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return NextResponse.json(
      { ok: false, code: "SUPABASE_AUTH_ERROR", message: error.message },
      { status: 401 },
    );
  }

  const user = data?.user;
  if (!user) return NextResponse.json({ ok: false, code: "NOT_AUTHED" }, { status: 401 });

  const fullName =
    (user.user_metadata as any)?.full_name ||
    (user.user_metadata as any)?.name ||
    "Traveler";

  const profile = await prisma.profile.upsert({
    where: { id: user.id },
    update: {
      email: user.email ?? null,
      fullName,
      avatarUrl: (user.user_metadata as any)?.avatar_url ?? null,
    },
    create: {
      id: user.id,
      email: user.email ?? null,
      fullName,
      avatarUrl: (user.user_metadata as any)?.avatar_url ?? null,
    },
    select: {
      id: true,
      role: true,
      email: true,
      fullName: true,
      country: true,
      avatarUrl: true,
      createdAt: true,
    },
  });

  const activePass = await getActivePassOrNull(user.id);
  const paidTiers = await prisma.pass.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      tier: true,
      planType: true,
      status: true,
      tierActionsTotal: true,
      tierActionsUsed: true,
      mainCreditsTotal: true,
      mainCreditsUsed: true,
      editCreditsTotal: true,
      editCreditsUsed: true,
      whatIfFreeTotal: true,
      whatIfFreeUsed: true,
      chatMessagesTotal: true,
      chatMessagesUsed: true,
      expertReviewTotal: true,
      expertReviewUsed: true,
      expiresAt: true,
      createdAt: true,
      meta: true,
    },
  });
  const confirmedTrips = await prisma.plan.findMany({
    where: { userId: user.id, status: "CONFIRMED" },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, destination: true, createdAt: true, summaryJson: true },
  });
  const savedReadyPlans = await prisma.savedItem.findMany({
    where: { userId: user.id, kind: "READY_PLAN" },
    orderBy: { createdAt: "desc" },
    take: 12,
  });
  const savedItems = await prisma.savedItem.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 12,
  });
  const deals = await prisma.deal.findMany({
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  const normalizedPlanType =
    activePass?.planType === "agency" || activePass?.tier === "agency"
      ? "agency"
      : activePass?.planType === "pro" || activePass?.tier === "pro"
        ? "pro"
        : activePass
          ? "starter"
          : "free";

  const planRules = normalizedPlanType === "free" ? null : getPlanRules(normalizedPlanType);
  const mainCreditsTotal = activePass
    ? Number(activePass.mainCreditsTotal ?? activePass.tierActionsTotal ?? planRules?.mainCreditsTotal ?? 0)
    : 0;
  const mainCreditsUsed = activePass
    ? Number(activePass.mainCreditsUsed ?? activePass.tierActionsUsed ?? 0)
    : 0;
  const editCreditsTotal = activePass
    ? Number(activePass.editCreditsTotal ?? planRules?.editCreditsTotal ?? 0)
    : 0;
  const editCreditsUsed = activePass ? Number(activePass.editCreditsUsed ?? 0) : 0;
  const whatIfFreeTotal = activePass
    ? Number(activePass.whatIfFreeTotal ?? planRules?.whatIfFreeTotal ?? 0)
    : 0;
  const whatIfFreeUsed = activePass ? Number(activePass.whatIfFreeUsed ?? 0) : 0;
  const chatMessagesTotal = activePass
    ? typeof activePass.chatMessagesTotal === "number"
      ? activePass.chatMessagesTotal
      : planRules?.chatMessagesTotal ?? 0
    : 0;
  const chatMessagesUsed = activePass ? Number(activePass.chatMessagesUsed ?? 0) : 0;
  const expertReviewTotal = activePass
    ? Number(activePass.expertReviewTotal ?? planRules?.expertReviewTotal ?? 0)
    : 0;
  const expertReviewUsed = activePass ? Number(activePass.expertReviewUsed ?? 0) : 0;

  const usage = activePass
    ? {
        tier: normalizedPlanType as "starter" | "pro" | "agency",
        status:
          activePass.status === PassStatus.CANCELED
            ? "CANCELLED"
            : activePass.status,
        mainCreditsTotal,
        mainCreditsUsed,
        mainCreditsRemaining: Math.max(0, mainCreditsTotal - mainCreditsUsed),
        editCreditsTotal,
        editCreditsUsed,
        editCreditsRemaining: Math.max(0, editCreditsTotal - editCreditsUsed),
        whatIfFreeRemaining: Math.max(0, whatIfFreeTotal - whatIfFreeUsed),
        chatMessagesRemaining:
          chatMessagesTotal === null ? null : Math.max(0, Number(chatMessagesTotal) - chatMessagesUsed),
        expertReviewRemaining: Math.max(0, expertReviewTotal - expertReviewUsed),
        expiresAt: activePass.expiresAt?.toISOString() ?? null,
        features: planRules?.features ?? [],
      }
    : {
        tier: "free" as const,
        status: "NONE" as const,
        mainCreditsTotal: 0,
        mainCreditsUsed: 0,
        mainCreditsRemaining: 0,
        editCreditsTotal: 0,
        editCreditsUsed: 0,
        editCreditsRemaining: 0,
        whatIfFreeRemaining: 0,
        chatMessagesRemaining: 0,
        expertReviewRemaining: 0,
        expiresAt: null,
        features: [],
      };

  return NextResponse.json({
    ok: true,
    profile,
    usage,
    paidTiers,
    confirmedTrips,
    savedReadyPlans,
    savedItems,
    deals,
  });
}
