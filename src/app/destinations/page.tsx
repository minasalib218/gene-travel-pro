import { MapPin } from "lucide-react";
import Navbar from "@/components/Navbar";
import CollectionShowcasePage from "@/components/home/CollectionShowcasePage";
import { prisma } from "@/lib/db/client";
import { parseDestinationRecord } from "@/lib/content/destinations";
import { withExistingTable } from "@/lib/prisma-safe";

export const dynamic = "force-dynamic";

export default async function DestinationsPage() {
  let cards: Array<{
    title: string;
    country: string;
    description: string;
    image: string;
    href: string;
    featured?: boolean;
  }> = [];

  try {
    const plans = await withExistingTable(
      "destinations",
      () =>
        prisma.destination.findMany({
          where: { status: "published" },
          orderBy: { updatedAt: "desc" },
        }),
      [],
    );

    cards = plans.map((plan, index) => {
      const record = parseDestinationRecord(plan as any);
      return {
        title: record.title,
        country: "Destination",
        description: record.description,
        image: record.imageUrl || "/bg/home-hero-bottom.png",
        href: `/destinations/${encodeURIComponent(record.slug)}`,
        featured: index === 0,
      };
    });
  } catch (error) {
    console.error("DestinationsPage database error:", error);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#0d131b]">
      <Navbar />
      <CollectionShowcasePage
        kind="destinations"
        icon={MapPin}
        label="Destinations"
        title="Explore the world"
        description="Handpicked places for your next unforgettable journey."
        ctaLabel="View All Destinations"
        ctaHref="/destinations"
        cards={cards}
        emptyMessage="No destination programs are published yet."
      />
    </main>
  );
}
