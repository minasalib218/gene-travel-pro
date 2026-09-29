import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/client";
import { getTableColumns, tableExists } from "@/lib/prisma-safe";
import { ensureUserProfile } from "@/lib/profile/ensureUserProfile";
import { createRouteClient } from "@/lib/supabase/server";
import { Prisma } from "@prisma/client";
import BookingsRemindersClient from "./ui";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function BookingsRemindersPage({ searchParams }: { searchParams?: { tripId?: string } }) {
  const supabase = createRouteClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/signin?next=/profile/bookings-reminders");
  }

  const profile = await ensureUserProfile(data.user);
  const userId = data.user.id;
  const requestedTripId = typeof searchParams?.tripId === "string" ? searchParams.tripId : null;
  const [hasBookings, hasClicks, hasTrackedBookings, hasTrackedClicks, hasWishlist, hasReminders, planColumns] = await Promise.all([
    tableExists("bookings").catch(() => false),
    tableExists("booking_clicks").catch(() => false),
    tableExists("trip_booking_records").catch(() => false),
    tableExists("trip_affiliate_clicks").catch(() => false),
    tableExists("wishlist_items").catch(() => false),
    tableExists("travel_reminders").catch(() => false),
    getTableColumns("plans"),
  ]);
  const hasCustomerPlans = ["userId", "status", "startDate", "endDate", "inputsJson", "createdAt"]
    .every((column) => planColumns.includes(column));
  const selectedTrip = requestedTripId && hasCustomerPlans
    ? await prisma.plan.findFirst({ where: { id: requestedTripId, userId }, select: { id: true, title: true } })
    : null;
  const tripId = selectedTrip?.id || null;

  const [trips, bookings, bookingClicks, trackedBookings, trackedClicks, savedItems, reminders] = await Promise.all([
    hasCustomerPlans ? prisma.plan.findMany({
      where: { userId },
      orderBy: { startDate: "asc" },
      take: 30,
      select: {
        id: true,
        title: true,
        destination: true,
        startDate: true,
        endDate: true,
        status: true,
        inputsJson: true,
      },
    }) : [],
    hasBookings
      ? prisma.booking.findMany({
          where: { userId, ...(tripId ? { planId: tripId } : {}) },
          orderBy: [{ travelDate: "asc" }, { createdAt: "desc" }],
          take: 100,
          select: {
            id: true,
            provider: true,
            status: true,
            travelDate: true,
            bookingDate: true,
            amount: true,
            currency: true,
            planId: true,
            metadata: true,
            createdAt: true,
          },
        })
      : [],
    hasClicks
      ? prisma.bookingClick.findMany({
          where: { userId, ...(tripId ? { planId: tripId } : {}) },
          orderBy: { clickedAt: "desc" },
          take: 100,
          select: {
            id: true,
            itemName: true,
            itemType: true,
            destination: true,
            provider: true,
            clickedAt: true,
            planId: true,
            metadata: true,
          },
        })
      : [],
    hasTrackedBookings
      ? prisma.$queryRaw<Array<{ id: string; provider: string; status: string; travelDate: Date | null; bookingDate: Date | null; amount: number | null; currency: string | null; planId: string; metadata: unknown; createdAt: Date }>>(Prisma.sql`
          select b.id::text, coalesce(b.provider, i.provider, 'Travel provider') as provider,
            b.status, b.travel_start_at as "travelDate", b.booked_at as "bookingDate",
            b.final_price::float8 as amount, b.currency, b.plan_id::text as "planId",
            jsonb_build_object('title', coalesce(i.title, 'Travel booking'), 'source', 'secure_affiliate_tracking') as metadata,
            b.created_at as "createdAt"
          from public.trip_booking_records b
          left join public.customer_plan_items i on i.id=b.item_id
          where b.user_id=${userId}::uuid ${tripId ? Prisma.sql`and b.plan_id=${tripId}::uuid` : Prisma.empty}
          order by coalesce(b.travel_start_at,b.booked_at,b.created_at) asc
          limit 100
        `)
      : [],
    hasTrackedClicks
      ? prisma.$queryRaw<Array<{ id: string; itemName: string; itemType: string | null; destination: string | null; provider: string | null; clickedAt: Date; planId: string; metadata: unknown }>>(Prisma.sql`
          select c.id::text, coalesce(i.title,'Travel item') as "itemName", i.kind as "itemType",
            p.destination, c.provider, c.created_at as "clickedAt", c.plan_id::text as "planId",
            jsonb_build_object('trackingStatus',c.status,'subId',c.opaque_click_id) as metadata
          from public.trip_affiliate_clicks c
          left join public.customer_plan_items i on i.id=c.item_id
          left join public.customer_plans p on p.id=c.plan_id
          where c.user_id=${userId}::uuid ${tripId ? Prisma.sql`and c.plan_id=${tripId}::uuid` : Prisma.empty}
          order by c.created_at desc limit 100
        `)
      : [],
    hasWishlist
      ? prisma.wishlistItem.findMany({
          where: { userId, status: { not: "REMOVED" } },
          orderBy: { createdAt: "desc" },
          take: 100,
          select: {
            id: true,
            tripName: true,
            itemType: true,
            title: true,
            provider: true,
            destination: true,
            imageUrl: true,
            href: true,
            status: true,
            createdAt: true,
            metadata: true,
          },
        })
      : [],
    hasReminders
      ? prisma.travelReminder.findMany({
          where: { userId, status: { not: "CANCELED" } },
          orderBy: { reminderDate: "asc" },
          take: 100,
          select: {
            id: true,
            title: true,
            tripName: true,
            reminderType: true,
            reminderDate: true,
            reminderTime: true,
            notes: true,
            status: true,
            metadata: true,
          },
        })
      : [],
  ]);

  return (
    <BookingsRemindersClient
      profile={{
        name: profile?.fullName || data.user.email?.split("@")[0] || "Traveler",
        email: profile?.email || data.user.email || "",
        avatarUrl: profile?.avatarUrl || null,
      }}
      initialData={{
        trips: tripId ? trips.filter((trip) => trip.id === tripId) : trips,
        bookings: [...trackedBookings, ...bookings],
        bookingClicks: [...trackedClicks, ...bookingClicks],
        savedItems,
        reminders: tripId
          ? reminders.filter((reminder) => {
              const metadata = reminder.metadata;
              return metadata && typeof metadata === "object" && !Array.isArray(metadata)
                ? (metadata as Record<string, unknown>).planId === tripId
                : reminder.tripName === selectedTrip?.title;
            })
          : reminders,
      }}
    />
  );
}
