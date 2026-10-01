import { prisma } from "@/lib/db/client";

const seasonMonths: Record<string, number[]> = {
  winter: [0, 1, 11], spring: [2, 3, 4], summer: [5, 6, 7], autumn: [8, 9, 10], fall: [8, 9, 10],
};

function monthsForText(...values: Array<string | null | undefined>) {
  const text = values.filter(Boolean).join(" ").toLowerCase();
  const matched = Object.entries(seasonMonths).flatMap(([season, months]) => text.includes(season) ? months : []);
  const names = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
  names.forEach((name, index) => { if (text.includes(name)) matched.push(index); });
  return matched.length ? [...new Set(matched)] : Array.from({ length: 12 }, (_, index) => index);
}

export async function getCalendarDiscoveryData() {
  const now = new Date();
  const [plans, destinations, offers, events] = await Promise.all([
    prisma.readyPlan.findMany({ where: { status: "PUBLISHED" }, orderBy: { updatedAt: "desc" }, take: 100, select: { id: true, slug: true, title: true, subtitle: true, destination: true, daysCount: true, style: true, season: true, tags: true, heroImage: true, coverImage: true, priceFrom: true, currency: true } }).catch(() => []),
    prisma.destination.findMany({ where: { status: "published" }, orderBy: { updatedAt: "desc" }, take: 100, select: { id: true, slug: true, title: true, description: true, section: true, tripStyles: true, imageUrl: true } }).catch(() => []),
    prisma.offer.findMany({ where: { status: "published", OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }, orderBy: [{ featured: "desc" }, { updatedAt: "desc" }], take: 100, select: { id: true, slug: true, title: true, description: true, location: true, country: true, duration: true, startingPrice: true, discountBadge: true, imageUrl: true, expiresAt: true } }).catch(() => []),
    prisma.event.findMany({ where: { status: "published", OR: [{ endDate: null }, { endDate: { gte: now } }] }, orderBy: [{ endDate: "asc" }, { updatedAt: "desc" }], take: 100, select: { id: true, slug: true, title: true, description: true, category: true, location: true, country: true, dateRange: true, endDate: true, imageUrl: true } }).catch(() => []),
  ]);

  return {
    items: [
      ...plans.map((item) => ({ ...item, type: "ready_plan", image: item.heroImage || item.coverImage, href: `/ready-plans/${item.slug}`, months: monthsForText(item.season, item.style, ...(item.tags || [])) })),
      ...destinations.map((item) => ({ ...item, type: "destination", image: item.imageUrl, href: `/destinations/${item.slug}`, months: monthsForText(...(item.tripStyles || []), item.description) })),
      ...offers.map((item) => ({ ...item, type: "offer", image: item.imageUrl, destination: [item.location, item.country].filter(Boolean).join(", "), href: `/offers/${item.slug}`, months: item.expiresAt ? [item.expiresAt.getUTCMonth()] : monthsForText(item.description, item.title) })),
      ...events.map((item) => ({ ...item, type: "event", image: item.imageUrl, destination: [item.location, item.country].filter(Boolean).join(", "), href: `/events/${item.slug}`, months: item.endDate ? [item.endDate.getUTCMonth()] : monthsForText(item.dateRange, item.title, item.description) })),
    ],
  };
}
