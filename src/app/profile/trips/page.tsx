import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/client";
import { createRouteClient } from "@/lib/supabase/server";
import { ensureUserProfile } from "@/lib/profile/ensureUserProfile";
import { getTableColumns, tableExists } from "@/lib/prisma-safe";
import { Prisma } from "@prisma/client";
import {
  bookingProgress,
  classifyTrip,
  getGeneTripMeta,
  objectValue,
  planningProgress,
  resumeHref,
} from "@/lib/profile/trip-utils";
import MyTripsClient, { type TripCardData } from "./ui";
import { isControlCentreFeatureEnabled } from "@/lib/control-centre/featureFlags";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function numberFrom(source: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = Number(source[key]);
    if (Number.isFinite(value) && value > 0) return value;
  }
  return 1;
}

export default async function MyTripsPage() {
  const supabase = createRouteClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/signin?next=/profile/trips");

  const profile = await ensureUserProfile(data.user);
  const userId = data.user.id;
  const [hasBookings, hasClicks, hasDocuments, hasSavedItems, planColumns, planDayColumns, planItemColumns] = await Promise.all([
    tableExists("bookings").catch(() => false),
    tableExists("booking_clicks").catch(() => false),
    tableExists("travel_documents").catch(() => false),
    tableExists("saved_items").catch(() => false),
    getTableColumns("plans"),
    getTableColumns("plan_days"),
    getTableColumns("plan_items"),
  ]);
  const hasCustomerPlans = ["userId", "status", "startDate", "endDate", "inputsJson", "summaryJson", "createdAt"]
    .every((column) => planColumns.includes(column))
    && ["planId", "dayIndex"].every((column) => planDayColumns.includes(column))
    && ["planDayId", "imageUrl"].every((column) => planItemColumns.includes(column));

  const [plans, bookingRows, clickRows, documents, savedReadyRows] = await Promise.all([
    hasCustomerPlans ? prisma.plan.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        days: {
          select: { id: true, items: { select: { id: true, imageUrl: true } } },
        },
      },
    }) : [],
    hasBookings ? prisma.booking.findMany({ where: { userId }, select: { id: true, planId: true, status: true } }) : [],
    hasClicks ? prisma.bookingClick.findMany({ where: { userId }, select: { id: true, planId: true } }) : [],
    hasDocuments
      ? prisma.$queryRaw<Array<{ tripId: string | null; expiryDate: Date | null }>>(
          Prisma.sql`
            SELECT "tripId", "expiryDate"
            FROM "travel_documents"
            WHERE "userId" = ${userId} AND "status" <> 'DELETED'
          `,
        )
      : [],
    hasSavedItems ? prisma.savedItem.findMany({ where: { userId, kind: "READY_PLAN" }, orderBy: { createdAt: "desc" }, take: 100 }) : [],
  ]);

  const readyPlanIds = [...new Set(savedReadyRows.map((row) => row.refId))];
  const readyPlans = readyPlanIds.length
    ? await prisma.readyPlan.findMany({
        where: { id: { in: readyPlanIds }, status: "PUBLISHED" },
        select: { id: true, slug: true, title: true, destination: true, daysCount: true, heroImage: true, coverImage: true, updatedAt: true },
      })
    : [];
  const readyById = new Map(readyPlans.map((plan) => [plan.id, plan]));

  const ownedTrips: TripCardData[] = plans.map((plan) => {
    const inputs = objectValue(plan.inputsJson);
    const summary = objectValue(plan.summaryJson);
    const meta = getGeneTripMeta(plan.inputsJson);
    const dayCount = plan.days.length;
    const itemCount = plan.days.reduce((sum, day) => sum + day.items.length, 0);
    const booked = bookingRows.filter((row) => row.planId === plan.id && !["CANCELLED", "CANCELED"].includes(row.status.toUpperCase())).length;
    const selected = Math.max(itemCount, clickRows.filter((row) => row.planId === plan.id).length, booked);
    const travelersCount = meta.travelersCount || numberFrom(inputs, "travelersCount", "adults");
    const datesSelected = meta.datesSelected !== false;
    const displayStatus = classifyTrip({ status: plan.status, startDate: plan.startDate, endDate: plan.endDate, meta });
    const coverImage = meta.coverImage
      || (typeof summary.coverImage === "string" ? summary.coverImage : null)
      || plan.days.flatMap((day) => day.items).find((item) => item.imageUrl)?.imageUrl
      || null;
    const updatedAt = meta.updatedAt || plan.createdAt.toISOString();
    const expiringDocuments = documents.filter((document) => document.tripId === plan.id && document.expiryDate && document.expiryDate.getTime() < plan.endDate.getTime()).length;

    return {
      id: plan.id,
      recordType: "PLAN" as const,
      title: plan.title,
      destination: plan.destination,
      startDate: datesSelected ? plan.startDate.toISOString() : null,
      endDate: datesSelected ? plan.endDate.toISOString() : null,
      travelersCount,
      sourceType: meta.sourceType || "AI_GENERATED",
      accessType: meta.accessType || (plan.passId ? "PAID" : "FREE"),
      status: displayStatus,
      planStatus: plan.status,
      planningProgress: planningProgress({ datesSelected, travelersCount, dayCount, itemCount, status: plan.status }),
      bookingProgress: bookingProgress(selected, booked),
      selectedCount: selected,
      bookedCount: booked,
      coverImage,
      lastUpdatedAt: updatedAt,
      primaryHref: resumeHref(plan.id, plan.status, meta),
      documentsNeedingAttention: expiringDocuments,
    };
  });

  const savedTrips: TripCardData[] = savedReadyRows.flatMap((saved) => {
    const ready = readyById.get(saved.refId);
    if (!ready) return [];
    return [{
      id: saved.id,
      readyPlanId: ready.id,
      recordType: "READY_PLAN" as const,
      title: ready.title,
      destination: ready.destination,
      startDate: null,
      endDate: null,
      travelersCount: 1,
      sourceType: "READY_PLAN" as const,
      accessType: "FREE" as const,
      status: "READY" as const,
      planStatus: "CONFIRMED" as const,
      planningProgress: 55,
      bookingProgress: 0,
      selectedCount: 0,
      bookedCount: 0,
      coverImage: ready.coverImage || ready.heroImage,
      lastUpdatedAt: ready.updatedAt.toISOString(),
      primaryHref: `/ready-plans/${ready.slug}`,
      documentsNeedingAttention: 0,
    }];
  });

  return (
    <MyTripsClient
      profile={{ name: profile?.fullName || data.user.email?.split("@")[0] || "Traveler" }}
      trips={[...ownedTrips, ...savedTrips]}
      createPlanHref="/ai-planner"
      controlCentreEnabled={isControlCentreFeatureEnabled("controlCentre")}
    />
  );
}
