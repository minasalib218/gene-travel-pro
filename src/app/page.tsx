import { prisma } from "@/lib/db/client";
import HomeHeroClient, { type HomeSlide } from "@/components/home/HomeHeroClient";
import { parseDestinationRecord } from "@/lib/content/destinations";
import { parseOfferLiveRecord } from "@/lib/content/offers-live";
import { parseEventLiveRecord } from "@/lib/content/events-live";
import { withDatabaseFallback, withExistingTable } from "@/lib/prisma-safe";

const fallbackSlides: HomeSlide[] = [
  {
    title: "Dubai Luxury Weekend",
    subtitle: "Luxury skyline, desert sunset, marina nights",
    image: "/images/dubai.jpg",
    preview: "/bg/ai-skyline.jpg",
    href: "/ready-plans/dubai-luxury-weekend",
    eyebrow: "Dubai, UAE",
    note: "Low-friction luxury pacing with strong evening atmosphere.",
    price: "From 1200 USD",
  },
  {
    title: "Paris Romantic Escape",
    subtitle: "Seine evenings, museum mornings, cafe pauses",
    image: "/images/paris.jpg",
    preview: "/images/paris.jpg",
    href: "/ready-plans/paris-romantic-escape",
    eyebrow: "Paris, France",
    note: "Built for couples who want signature moments and softer movement.",
    price: "From 950 USD",
  },
  {
    title: "Istanbul Culture Journey",
    subtitle: "Bazaars, Bosphorus atmosphere, layered heritage",
    image: "/images/istanbul.jpg",
    preview: "/bg/home-hero-bottom.png",
    href: "/ready-plans/istanbul-culture-journey",
    eyebrow: "Istanbul, Turkey",
    note: "A textured cultural route with stronger local contrast.",
    price: "From 700 USD",
  },
  {
    title: "Morocco Desert Story",
    subtitle: "Warm tones, quiet camps, cinematic desert light",
    image: "/images/patagonia.jpg",
    preview: "/images/middle-bg.jpg",
    href: "/ready-plans/morocco-desert-story",
    eyebrow: "Merzouga, Morocco",
    note: "Designed for travelers who want a calmer visual narrative.",
    price: "From 880 USD",
  },
];

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let slides = fallbackSlides;
  let destinationCards: Array<{ title: string; country: string; description: string; image: string; href: string; featured?: boolean }> = [];
  let offerCards: Array<{ title: string; subtitle: string; image: string; href: string; cta: string }> = [];
  let eventCards: Array<{ title: string; subtitle: string; image: string; href: string; cta: string }> = [];

  try {
    const [plans, destinations, offers, events] = await Promise.all([
      withDatabaseFallback(
        () =>
          prisma.readyPlan.findMany({
            where: { status: "PUBLISHED" },
            orderBy: { updatedAt: "desc" },
            take: 6,
          }),
        [],
      ),
      withExistingTable(
        "destinations",
        () => prisma.destination.findMany({ where: { status: "published" }, orderBy: { updatedAt: "desc" }, take: 4 }),
        [],
      ),
      withExistingTable(
        "offers",
        () => prisma.offer.findMany({ where: { status: "published" }, orderBy: [{ showOnHome: "desc" }, { updatedAt: "desc" }], take: 3 }),
        [],
      ),
      withExistingTable(
        "events",
        () => prisma.event.findMany({ where: { status: "published" }, orderBy: [{ showOnHome: "desc" }, { updatedAt: "desc" }], take: 4 }),
        [],
      ),
    ]);

    if (plans.length > 0) {
      slides = plans.map((plan) => ({
        title: plan.title,
        subtitle: plan.subtitle || `${plan.destination} cinematic route`,
        image: plan.coverImage || plan.heroImage || "/bg/home-hero-bottom.png",
        preview: plan.heroImage || plan.coverImage || "/bg/home-hero.png",
        href: `/ready-plans/${encodeURIComponent(plan.slug)}`,
        eyebrow: plan.destination,
        note:
          plan.subtitle ||
          "A calmer ready-made route with stronger atmosphere and a smoother travel rhythm.",
        price: plan.priceFrom ? `From ${plan.priceFrom} ${plan.currency}` : "Open ready plan",
      }));

      while (slides.length < 4) {
        slides = [...slides, fallbackSlides[slides.length]];
      }
    }

    destinationCards = destinations.map((row, index) => {
      const record = parseDestinationRecord(row as any);
      return {
        title: record.title,
        country: "Destination",
        description: record.description,
        image: record.imageUrl,
        href: `/destinations/${record.slug}`,
        featured: index === 0,
      };
    });

    offerCards = offers.map((row) => {
      const record = parseOfferLiveRecord(row as any);
      return {
        title: record.title,
        subtitle: record.location || record.startingPrice,
        image: record.imageUrl,
        href: `/offers/${record.slug}`,
        cta: "View Offer",
      };
    });

    eventCards = events.map((row) => {
      const record = parseEventLiveRecord(row as any);
      return {
        title: record.title,
        subtitle: record.location || record.dateRange,
        image: record.imageUrl,
        href: `/events/${record.slug}`,
        cta: "View Event",
      };
    });
  } catch {
    slides = fallbackSlides;
  }

  return <HomeHeroClient slides={slides} destinationCards={destinationCards} offerCards={offerCards} eventCards={eventCards} />;
}
