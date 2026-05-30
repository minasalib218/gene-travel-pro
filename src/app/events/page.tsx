import { CalendarDays } from "lucide-react";
import Navbar from "@/components/Navbar";
import CollectionShowcasePage from "@/components/home/CollectionShowcasePage";
import { prisma } from "@/lib/db/client";
import { parseEventLiveRecord } from "@/lib/content/events-live";
import { withExistingTable } from "@/lib/prisma-safe";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  let cards: Array<{
    title: string;
    category: string;
    location: string;
    date: string;
    image: string;
    href: string;
  }> = [];

  try {
    const deals = await withExistingTable(
      "events",
      () =>
        prisma.event.findMany({
          where: { status: "published" },
          orderBy: [{ showOnHome: "desc" }, { updatedAt: "desc" }],
        }),
      [],
    );

    cards = deals
      .map((row) => parseEventLiveRecord(row as any))
      .map((event) => ({
        title: event.title,
        category: event.category || "Event",
        location: [event.location, event.country].filter(Boolean).join(", "),
        date: event.dateRange || "Seasonal date details",
        image: event.imageUrl || "/images/barcelona.jpg",
        href: `/events/${encodeURIComponent(event.slug)}`,
      }));
  } catch (error) {
    console.error("EventsPage database error:", error);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#0d131b]">
      <Navbar />
      <CollectionShowcasePage
        kind="events"
        icon={CalendarDays}
        label="Events"
        title="Events worth traveling for"
        description="Discover festivals, concerts, cultural nights, and seasonal moments."
        ctaLabel="View All Events"
        ctaHref="/events"
        cards={cards}
        emptyMessage="No published events are available right now."
      />
    </main>
  );
}
