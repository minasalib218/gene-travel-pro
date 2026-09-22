import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/client";
import { getTableColumns, tableExists } from "@/lib/prisma-safe";
import { ensureUserProfile } from "@/lib/profile/ensureUserProfile";
import { createRouteClient } from "@/lib/supabase/server";
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
  const [hasBookings, hasClicks, hasWishlist, hasReminders, planColumns] = await Promise.all([
    tableExists("bookings").catch(() => false),
    tableExists("booking_clicks").catch(() => false),
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

  const [trips, bookings, bookingClicks, savedItems, reminders] = await Promise.all([
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
        bookings,
        bookingClicks,
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
