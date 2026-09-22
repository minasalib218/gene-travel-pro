import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { createRouteClient } from "@/lib/supabase/server";
import { getActivePassOrNull } from "@/lib/require-pass";
import { getPlanRules } from "@/lib/credits/planRules";
import { getVerifiedAdmin } from "@/lib/admin/verified";
import { PassStatus, Prisma } from "@prisma/client";
import { tableExists } from "@/lib/prisma-safe";
import { ensureUserProfile } from "@/lib/profile/ensureUserProfile";

async function getProfileActivity(userId: string) {
  const [
    hasFavoritePlans,
    hasFavoriteDestinations,
    hasWishlistItems,
    hasTravelReminders,
    hasTravelPreferences,
    hasBookingClicks,
    hasBookings,
    hasRecentlyViewed,
    hasUserActivity,
    hasTravelDocuments,
    hasSupportTickets,
    hasOffers,
    hasCreditLedger,
    hasNotifications,
  ] = await Promise.all([
    tableExists("favorite_plans").catch(() => false),
    tableExists("favorite_destinations").catch(() => false),
    tableExists("wishlist_items").catch(() => false),
    tableExists("travel_reminders").catch(() => false),
    tableExists("travel_preferences").catch(() => false),
    tableExists("booking_clicks").catch(() => false),
    tableExists("bookings").catch(() => false),
    tableExists("recently_viewed").catch(() => false),
    tableExists("user_activity").catch(() => false),
    tableExists("travel_documents").catch(() => false),
    tableExists("support_tickets").catch(() => false),
    tableExists("offers").catch(() => false),
    tableExists("credit_ledger").catch(() => false),
    tableExists("in_app_notifications").catch(() => false),
  ]);

  const favoriteRows = hasFavoritePlans
    ? await prisma.favoritePlan.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 12,
      })
    : [];
  const favoritePlanIds = favoriteRows.map((favorite) => favorite.readyPlanId);
  const favoritePlans = favoritePlanIds.length
    ? await prisma.readyPlan.findMany({
        where: { id: { in: favoritePlanIds } },
        select: {
          id: true,
          slug: true,
          title: true,
          subtitle: true,
          destination: true,
          daysCount: true,
          style: true,
          heroImage: true,
          coverImage: true,
          updatedAt: true,
        },
      })
    : [];
  const favoritePlanById = new Map(favoritePlans.map((plan) => [plan.id, plan]));
  const favoriteDestinationRows = hasFavoriteDestinations
    ? await prisma.favoriteDestination.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 12,
      })
    : [];
  const favoriteDestinationIds = favoriteDestinationRows.map((favorite) => favorite.destinationId);
  const favoriteDestinationRecords = favoriteDestinationIds.length
    ? await prisma.destination.findMany({
        where: { id: { in: favoriteDestinationIds }, status: "published" },
        select: {
          id: true,
          title: true,
          slug: true,
          imageUrl: true,
          iconUrl: true,
          section: true,
          tripStyles: true,
          description: true,
          updatedAt: true,
        },
      })
    : [];
  const favoriteDestinationById = new Map(
    favoriteDestinationRecords.map((destination) => [destination.id, destination]),
  );

  const bookingActivity = hasBookingClicks
    ? await prisma.bookingClick.findMany({
        where: { userId },
        orderBy: { clickedAt: "desc" },
        take: 12,
      })
    : [];
  const confirmedBookings = hasBookings
    ? await prisma.booking.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 12,
      })
    : [];
  const recentlyViewed = hasRecentlyViewed
    ? await prisma.recentlyViewed.findMany({
        where: { userId },
        orderBy: { viewedAt: "desc" },
        take: 12,
      })
    : [];
  const activityEvents = hasUserActivity
    ? await prisma.userActivity.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 20,
      })
    : [];
  const wishlistItems = hasWishlistItems
    ? await prisma.wishlistItem.findMany({
        where: { userId, status: { not: "REMOVED" } },
        orderBy: { createdAt: "desc" },
        take: 16,
      })
    : [];
  const travelReminders = hasTravelReminders
    ? await prisma.travelReminder.findMany({
        where: { userId, status: "UPCOMING" },
        orderBy: { reminderDate: "asc" },
        take: 8,
      })
    : [];
  const travelPreference = hasTravelPreferences
    ? await prisma.travelPreference.findUnique({
        where: { userId },
      })
    : null;
  const travelDocuments = hasTravelDocuments
    ? await prisma.travelDocument.findMany({
        where: { userId, status: { not: "DELETED" } },
        orderBy: { createdAt: "desc" },
        take: 12,
        select: {
          id: true,
          type: true,
          displayName: true,
          mimeType: true,
          fileSize: true,
          expiryDate: true,
          tripId: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      })
    : [];
  const supportTickets = hasSupportTickets
    ? await prisma.supportTicket.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          subject: true,
          status: true,
          priority: true,
          createdAt: true,
          updatedAt: true,
        },
      })
    : [];
  const creditLedger = hasCreditLedger
    ? await prisma.creditLedger.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 12,
        select: {
          id: true,
          type: true,
          actionType: true,
          creditType: true,
          amount: true,
          balanceAfter: true,
          reason: true,
          createdAt: true,
        },
      })
    : [];
  const notifications = hasNotifications
    ? await prisma.inAppNotification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 12,
        select: {
          id: true,
          type: true,
          title: true,
          message: true,
          status: true,
          metadata: true,
          createdAt: true,
          readAt: true,
        },
      })
    : [];
  const paymentHistory = await prisma.payment.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 12,
  });
  const personalizedOffers = hasOffers
    ? await prisma.offer
        .findMany({
          where: {
            status: "published",
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
          orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
          take: 12,
          select: {
            id: true,
            title: true,
            slug: true,
            imageUrl: true,
            iconUrl: true,
            location: true,
            country: true,
            duration: true,
            startingPrice: true,
            discountBadge: true,
            featured: true,
            expiresAt: true,
          },
        })
        .then((offers) =>
          offers.map((offer) => ({
            ...offer,
            bookingHref: `/api/affiliate/redirect?type=offer&id=${offer.id}`,
          })),
        )
    : [];
  const interestTerms = [
    ...(travelPreference?.travelStyles ?? []),
    ...(travelPreference?.preferredRegions ?? []),
    ...favoriteDestinationRecords.map((destination) => destination.title),
    ...favoriteDestinationRecords.flatMap((destination) => destination.tripStyles ?? []),
  ]
    .map((term) => term.toLowerCase())
    .filter(Boolean);
  const recommendedReadyPlans = await prisma.readyPlan
    .findMany({
      where: {
        status: "PUBLISHED",
        id: { notIn: favoritePlanIds },
      },
      orderBy: { updatedAt: "desc" },
      take: 18,
      select: {
        id: true,
        slug: true,
        title: true,
        subtitle: true,
        destination: true,
        daysCount: true,
        style: true,
        heroImage: true,
        coverImage: true,
        priceFrom: true,
        currency: true,
        updatedAt: true,
      },
    })
    .then((plans) =>
      plans
        .map((plan) => {
          const haystack = `${plan.title} ${plan.subtitle ?? ""} ${plan.destination} ${plan.style ?? ""}`.toLowerCase();
          const score = interestTerms.reduce((sum, term) => sum + (haystack.includes(term) ? 1 : 0), 0);
          return { ...plan, recommendationScore: score };
        })
        .sort((a, b) => b.recommendationScore - a.recommendationScore)
        .slice(0, 6),
    )
    .catch(() => []);

  return {
    favoritePlans: favoriteRows
      .map((favorite) => {
        const plan = favoritePlanById.get(favorite.readyPlanId);
        return plan ? { ...plan, favoritedAt: favorite.createdAt } : null;
      })
      .filter(Boolean),
    favoriteDestinations: favoriteDestinationRows
      .map((favorite) => {
        const destination = favoriteDestinationById.get(favorite.destinationId);
        return destination ? { ...destination, savedAt: favorite.createdAt } : null;
      })
      .filter(Boolean),
    wishlistItems,
    travelReminders,
    travelPreference,
    recommendedReadyPlans,
    bookingActivity,
    confirmedBookings,
    recentlyViewed,
    activityEvents,
    paymentHistory,
    travelDocuments,
    supportTickets,
    creditLedger,
    notifications,
    unreadNotificationsCount: notifications.filter((notification) => !notification.readAt && notification.status !== "READ").length,
    personalizedOffers,
  };
}

async function getCustomerTrips(userId: string) {
  try {
    return await prisma.$queryRaw<
      Array<{
        id: string;
        title: string;
        destination: string;
        createdAt: Date;
        summaryJson: Record<string, unknown> | null;
      }>
    >(
      Prisma.sql`
        SELECT
          "id",
          "title",
          COALESCE("destination", '') AS "destination",
          "createdAt",
          "summaryJson"
        FROM "plans"
        WHERE "userId" = ${userId}
          AND "status" IN ('DRAFT', 'RECOMMENDED', 'ANALYZED', 'CONFIRMED')
        ORDER BY "createdAt" DESC
      `,
    );
  } catch (error) {
    console.error("Profile trips warning:", error);
    return [];
  }
}

async function getSavedReadyPlans(userId: string) {
  const exists = await tableExists("saved_items").catch(() => false);
  if (!exists) return [];

  return prisma.savedItem
    .findMany({
      where: { userId, kind: "READY_PLAN" },
      orderBy: { createdAt: "desc" },
      take: 12,
    })
    .catch((error) => {
      console.error("Profile saved ready plans warning:", error);
      return [];
    });
}

async function getSavedItems(userId: string) {
  const exists = await tableExists("saved_items").catch(() => false);
  if (!exists) return [];

  return prisma.savedItem
    .findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 12,
    })
    .catch((error) => {
      console.error("Profile saved items warning:", error);
      return [];
    });
}

async function getDeals() {
  const exists = await tableExists("deals").catch(() => false);
  if (!exists) return [];

  return prisma.deal
    .findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
    })
    .catch((error) => {
      console.error("Profile deals warning:", error);
      return [];
    });
}

export async function GET() {
  const verifiedAdmin = await getVerifiedAdmin();

  let user = verifiedAdmin.ok ? verifiedAdmin.user : null;

  if (!user) {
    const supabase = createRouteClient();
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      return NextResponse.json(
        { ok: false, code: "SUPABASE_AUTH_ERROR" },
        { status: 401 },
      );
    }

    user = data?.user ?? null;
  }

  if (!user) return NextResponse.json({ ok: false, code: "NOT_AUTHED" }, { status: 401 });

  const adminRules = getPlanRules("agency");

  const ensuredProfile = await ensureUserProfile(user, "PROFILE_VIEWED");
  if (!ensuredProfile) {
    return NextResponse.json(
      { ok: false, code: "PROFILE_UNAVAILABLE", message: "Profile data is temporarily unavailable." },
      { status: 503 },
    );
  }

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
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

  if (!profile) {
    return NextResponse.json(
      { ok: false, code: "PROFILE_UNAVAILABLE", message: "Profile data is temporarily unavailable." },
      { status: 503 },
    );
  }

  if (String(profile.role ?? "").toUpperCase() === "ADMIN") {
    const confirmedTrips = await getCustomerTrips(user.id);
    const savedReadyPlans = await getSavedReadyPlans(user.id);
    const savedItems = await getSavedItems(user.id);
    const deals = await getDeals();
    const activity = await getProfileActivity(user.id);

    return NextResponse.json({
      ok: true,
      profile,
      usage: {
        tier: "agency" as const,
        status: "ACTIVE" as const,
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
        features: adminRules.features,
      },
      paidTiers: [],
      confirmedTrips,
      savedReadyPlans,
      savedItems,
      deals,
      ...activity,
    });
  }

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
  const confirmedTrips = await getCustomerTrips(user.id);
  const savedReadyPlans = await getSavedReadyPlans(user.id);
  const savedItems = await getSavedItems(user.id);
  const deals = await getDeals();
  const activity = await getProfileActivity(user.id);

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
    ...activity,
  });
}
