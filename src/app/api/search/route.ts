import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { withExistingTable } from "@/lib/prisma-safe";
import { createRouteClient } from "@/lib/supabase/server";

type SearchResult = {
  id: string;
  type: "ready-plan" | "destination" | "offer" | "event" | "trip" | "favorite" | "reminder" | "booking";
  title: string;
  subtitle?: string;
  href: string;
};

function cleanQuery(value: string | null) {
  return (value || "").trim().slice(0, 80);
}

function containsQuery(query: string) {
  return { contains: query, mode: "insensitive" as const };
}

function uniqueResults(results: SearchResult[]) {
  const seen = new Set<string>();
  return results.filter((result) => {
    const key = `${result.type}:${result.id}:${result.href}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function publicSearch(query: string) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const [readyPlans, destinations, offers, events] = await Promise.all([
    withExistingTable(
      "ready_plans",
      () =>
        prisma.readyPlan.findMany({
          where: {
            status: "PUBLISHED",
            OR: [
              { title: containsQuery(query) },
              { subtitle: containsQuery(query) },
              { destination: containsQuery(query) },
              { style: containsQuery(query) },
            ],
          },
          orderBy: { updatedAt: "desc" },
          take: 8,
        }),
      [],
    ),
    withExistingTable(
      "destinations",
      () =>
        prisma.destination.findMany({
          where: {
            status: "published",
            OR: [
              { title: containsQuery(query) },
              { description: containsQuery(query) },
              { section: containsQuery(query) },
            ],
          },
          orderBy: { updatedAt: "desc" },
          take: 8,
        }),
      [],
    ),
    withExistingTable(
      "offers",
      () =>
        prisma.offer.findMany({
          where: {
            status: "published",
            AND: [
              {
                OR: [
                  { expiresAt: null },
                  { expiresAt: { gt: today } },
                ],
              },
              {
                OR: [
                  { title: containsQuery(query) },
                  { location: containsQuery(query) },
                  { country: containsQuery(query) },
                  { description: containsQuery(query) },
                ],
              },
            ],
          },
          orderBy: [{ featured: "desc" }, { showOnHome: "desc" }, { updatedAt: "desc" }],
          take: 8,
        }),
      [],
    ),
    withExistingTable(
      "events",
      () =>
        prisma.event.findMany({
          where: {
            status: "published",
            AND: [
              {
                OR: [
                  { endDate: null },
                  { endDate: { gte: today } },
                ],
              },
              {
                OR: [
                  { title: containsQuery(query) },
                  { location: containsQuery(query) },
                  { country: containsQuery(query) },
                  { category: containsQuery(query) },
                  { description: containsQuery(query) },
                ],
              },
            ],
          },
          orderBy: [{ showOnHome: "desc" }, { updatedAt: "desc" }],
          take: 8,
        }),
      [],
    ),
  ]);

  return uniqueResults([
    ...readyPlans.map((plan): SearchResult => ({
      id: plan.id,
      type: "ready-plan",
      title: plan.title,
      subtitle: plan.destination || plan.subtitle || "Ready Plan",
      href: `/ready-plans/${encodeURIComponent(plan.slug)}`,
    })),
    ...destinations.map((destination): SearchResult => ({
      id: destination.id,
      type: "destination",
      title: destination.title,
      subtitle: destination.section || "Destination",
      href: `/destinations/${encodeURIComponent(destination.slug)}`,
    })),
    ...offers.map((offer): SearchResult => ({
      id: offer.id,
      type: "offer",
      title: offer.title,
      subtitle: offer.location || offer.startingPrice || "Offer",
      href: `/offers/${encodeURIComponent(offer.slug)}`,
    })),
    ...events.map((event): SearchResult => ({
      id: event.id,
      type: "event",
      title: event.title,
      subtitle: event.location || event.dateRange || "Event",
      href: `/events/${encodeURIComponent(event.slug)}`,
    })),
  ]).slice(0, 20);
}

async function profileSearch(query: string) {
  const supabase = createRouteClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    return { status: 401, results: [] as SearchResult[] };
  }

  const userId = data.user.id;
  const [plans, savedItems, reminders, bookings] = await Promise.all([
    prisma.plan
      .findMany({
        where: {
          userId,
          OR: [
            { title: containsQuery(query) },
            { destination: containsQuery(query) },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 8,
      })
      .catch(() => []),
    withExistingTable(
      "wishlist_items",
      () =>
        prisma.wishlistItem.findMany({
          where: {
            userId,
            status: { not: "REMOVED" },
            OR: [
              { title: containsQuery(query) },
              { destination: containsQuery(query) },
              { provider: containsQuery(query) },
            ],
          },
          orderBy: { createdAt: "desc" },
          take: 8,
        }),
      [],
    ),
    withExistingTable(
      "travel_reminders",
      () =>
        prisma.travelReminder.findMany({
          where: {
            userId,
            OR: [
              { title: containsQuery(query) },
              { tripName: containsQuery(query) },
              { notes: containsQuery(query) },
            ],
          },
          orderBy: { reminderDate: "asc" },
          take: 8,
        }),
      [],
    ),
    withExistingTable(
      "bookings",
      () =>
        prisma.booking.findMany({
          where: {
            userId,
            OR: [
              { provider: containsQuery(query) },
              { providerBookingId: containsQuery(query) },
              { status: containsQuery(query) },
            ],
          },
          orderBy: { createdAt: "desc" },
          take: 8,
        }),
      [],
    ),
  ]);

  return {
    status: 200,
    results: uniqueResults([
      ...plans.map((plan): SearchResult => ({
        id: plan.id,
        type: "trip",
        title: plan.title || "Saved trip",
        subtitle: plan.destination || plan.status,
        href: `/plan-summary/${plan.id}`,
      })),
      ...savedItems.map((item): SearchResult => ({
        id: item.id,
        type: "favorite",
        title: item.title,
        subtitle: item.destination || item.provider || item.itemType,
        href: item.href && item.href.startsWith("/") ? item.href : "/profile#favorite-items",
      })),
      ...reminders.map((reminder): SearchResult => ({
        id: reminder.id,
        type: "reminder",
        title: reminder.title,
        subtitle: reminder.tripName || reminder.reminderType,
        href: "/profile#bookings-reminders",
      })),
      ...bookings.map((booking): SearchResult => ({
        id: booking.id,
        type: "booking",
        title: booking.providerBookingId || booking.provider,
        subtitle: booking.status,
        href: "/profile#bookings-reminders",
      })),
    ]).slice(0, 20),
  };
}

async function search(req: NextRequest) {
  const query = cleanQuery(req.nextUrl.searchParams.get("q"));
  const scope = req.nextUrl.searchParams.get("scope") === "profile" ? "profile" : "public";

  if (query.length < 2) {
    return NextResponse.json({ ok: true, results: [] });
  }

  try {
    if (scope === "profile") {
      const profile = await profileSearch(query);
      return NextResponse.json(
        { ok: profile.status === 200, results: profile.results },
        { status: profile.status },
      );
    }

    return NextResponse.json({ ok: true, results: await publicSearch(query) });
  } catch (error) {
    console.error("search error:", error);
    return NextResponse.json({ ok: false, results: [] }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return search(req);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const url = req.nextUrl.clone();
  url.searchParams.set("q", String(body?.query || body?.q || ""));
  if (body?.scope) url.searchParams.set("scope", String(body.scope));
  return search(new NextRequest(url, req));
}
