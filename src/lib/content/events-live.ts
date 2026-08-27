import { z } from "zod";
import { contentStatusSchema, normalizeOptionalString, normalizeString, slugifyContent } from "./shared";

function normalizeOptionalDateInput(value: unknown) {
  if (value instanceof Date && Number.isFinite(value.getTime())) return value;
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
    ? new Date(`${trimmed}T23:59:59.999Z`)
    : new Date(trimmed);

  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

function normalizeDateString(value: unknown) {
  const date = normalizeOptionalDateInput(value);
  return date ? date.toISOString().slice(0, 10) : "";
}

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
  endDate: z.string().trim().optional().nullable(),
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
  endDate: string;
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
    endDate: normalizeDateString(record.endDate),
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
    endDate: normalizeOptionalDateInput(parsed.endDate),
    description: normalizeOptionalString(parsed.description),
    showOnHome: Boolean(parsed.showOnHome),
    status: parsed.status ?? "draft",
  };
}
