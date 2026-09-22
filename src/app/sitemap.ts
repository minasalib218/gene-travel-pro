import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db/client";
import { withDatabaseFallback, withExistingTable } from "@/lib/prisma-safe";
import { SITE_URL, absoluteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/ready-plans"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/destinations"), lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: absoluteUrl("/offers"), lastModified: now, changeFrequency: "daily", priority: 0.75 },
    { url: absoluteUrl("/events"), lastModified: now, changeFrequency: "daily", priority: 0.72 },
    { url: absoluteUrl("/pricing"), lastModified: now, changeFrequency: "monthly", priority: 0.65 },
  ];

  const [readyPlans, destinations, offers, events] = await Promise.all([
    withDatabaseFallback(
      () =>
        prisma.readyPlan.findMany({
          where: { status: "PUBLISHED" },
          select: { slug: true, updatedAt: true },
          orderBy: { updatedAt: "desc" },
        }),
      [],
    ),
    withExistingTable(
      "destinations",
      () =>
        prisma.destination.findMany({
          where: { status: "published" },
          select: { slug: true, updatedAt: true },
          orderBy: { updatedAt: "desc" },
        }),
      [],
    ),
    withExistingTable(
      "offers",
      () =>
        prisma.offer.findMany({
          where: { status: "published" },
          select: { slug: true, updatedAt: true },
          orderBy: { updatedAt: "desc" },
        }),
      [],
    ),
    withExistingTable(
      "events",
      () =>
        prisma.event.findMany({
          where: {
            status: "published",
            OR: [{ endDate: null }, { endDate: { gte: today } }],
          },
          select: { slug: true, updatedAt: true },
          orderBy: { updatedAt: "desc" },
        }),
      [],
    ),
  ]);

  return [
    ...staticRoutes,
    ...readyPlans.map((plan) => ({
      url: absoluteUrl(`/ready-plans/${encodeURIComponent(plan.slug)}`),
      lastModified: plan.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.86,
    })),
    ...destinations.map((destination) => ({
      url: absoluteUrl(`/destinations/${encodeURIComponent(destination.slug)}`),
      lastModified: destination.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.78,
    })),
    ...offers.map((offer) => ({
      url: absoluteUrl(`/offers/${encodeURIComponent(offer.slug)}`),
      lastModified: offer.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.68,
    })),
    ...events.map((event) => ({
      url: absoluteUrl(`/events/${encodeURIComponent(event.slug)}`),
      lastModified: event.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.66,
    })),
  ];
}
