import { Tag } from "lucide-react";
import Navbar from "@/components/Navbar";
import CollectionShowcasePage from "@/components/home/CollectionShowcasePage";
import { prisma } from "@/lib/db/client";
import { parseOfferLiveRecord } from "@/lib/content/offers-live";
import { withExistingTable } from "@/lib/prisma-safe";

export const dynamic = "force-dynamic";

export default async function OffersPage() {
  let cards: Array<{
    title: string;
    location: string;
    duration: string;
    price: string;
    discount: string;
    image: string;
    href: string;
  }> = [];

  try {
    const deals = await withExistingTable(
      "offers",
      () =>
        prisma.offer.findMany({
          where: { status: "published" },
          orderBy: [{ showOnHome: "desc" }, { updatedAt: "desc" }],
        }),
      [],
    );

    cards = deals
      .map((row) => parseOfferLiveRecord(row as any))
      .map((offer) => ({
        title: offer.title,
        location: [offer.location, offer.country].filter(Boolean).join(", "),
        duration: offer.duration || "Curated travel window",
        price: offer.startingPrice || "Custom pricing",
        discount: offer.discountBadge || "Limited offer",
        image: offer.imageUrl || "/images/customize-band.jpg",
        href: `/offers/${encodeURIComponent(offer.slug)}`,
      }));
  } catch (error) {
    console.error("OffersPage database error:", error);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#0d131b]">
      <Navbar />
      <CollectionShowcasePage
        kind="offers"
        icon={Tag}
        label="Offers"
        title="Exclusive offers"
        description="Limited deals curated for smart travelers."
        ctaLabel="View All Offers"
        ctaHref="/offers"
        cards={cards}
        emptyMessage="No published offers are available right now."
      />
    </main>
  );
}
