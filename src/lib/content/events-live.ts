import { z } from "zod";
import { contentStatusSchema, normalizeOptionalString, normalizeString, slugifyContent } from "./shared";

export const eventInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  slug: z.string().trim().optional().nullable(),
  imageUrl: z.string().trim().optional().nullable(),
  iconUrl: z.string().trim().optional().nullable(),
  affiliateLink: z.string().trim().optional().nullable(),
  category: z.string().trim().optional().nullable(),
  location: z.string().trim().optional().nullable(),
  country: z.string().trim().optional().nullable(),
  dateRange: z.string().trim().optional().nullable(),
  description: z.string().trim().optional().nullable(),
  showOnHome: z.boolean().optional(),
  status: contentStatusSchema.optional(),
});

export type EventLiveRecord = {
  id: string;
  title: string;
  slug: string;
  imageUrl: string;
  iconUrl: string;
  affiliateLink: string;
  category: string;
  location: string;
  country: string;
  dateRange: string;
  description: string;
  showOnHome: boolean;
  status: "draft" | "published" | "removed";
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

export function parseEventLiveRecord(record: Record<string, unknown>): EventLiveRecord {
  return {
    id: String(record.id ?? ""),
    title: normalizeString(record.title),
    slug: normalizeString(record.slug),
    imageUrl: normalizeString(record.imageUrl, "/images/barcelona.jpg"),
    iconUrl: normalizeString(record.iconUrl),
    affiliateLink: normalizeString(record.affiliateLink),
    category: normalizeString(record.category, "Event"),
    location: normalizeString(record.location),
    country: normalizeString(record.country),
    dateRange: normalizeString(record.dateRange, "Seasonal details"),
    description: normalizeString(
      record.description,
      "A cinematic event highlight with a direct Gene booking path."
    ),
    showOnHome: Boolean(record.showOnHome),
    status: record.status === "published" || record.status === "removed" ? (record.status as any) : "draft",
    createdAt: record.createdAt as string | Date | undefined,
    updatedAt: record.updatedAt as string | Date | undefined,
  };
}

export function buildEventLiveData(input: unknown) {
  const parsed = eventInputSchema.parse(input);
  return {
    title: parsed.title,
    slug: slugifyContent(parsed.slug || parsed.title),
    imageUrl: normalizeOptionalString(parsed.imageUrl),
    iconUrl: normalizeOptionalString(parsed.iconUrl),
    affiliateLink: normalizeOptionalString(parsed.affiliateLink),
    category: normalizeOptionalString(parsed.category),
    location: normalizeOptionalString(parsed.location),
    country: normalizeOptionalString(parsed.country),
    dateRange: normalizeOptionalString(parsed.dateRange),
    description: normalizeOptionalString(parsed.description),
    showOnHome: Boolean(parsed.showOnHome),
    status: parsed.status ?? "draft",
  };
}
