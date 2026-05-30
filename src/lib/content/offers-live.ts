import { z } from "zod";
import { contentStatusSchema, normalizeOptionalString, normalizeString, slugifyContent } from "./shared";

export const offerInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  slug: z.string().trim().optional().nullable(),
  imageUrl: z.string().trim().optional().nullable(),
  iconUrl: z.string().trim().optional().nullable(),
  affiliateLink: z.string().trim().optional().nullable(),
  location: z.string().trim().optional().nullable(),
  country: z.string().trim().optional().nullable(),
  duration: z.string().trim().optional().nullable(),
  startingPrice: z.string().trim().optional().nullable(),
  description: z.string().trim().optional().nullable(),
  discountBadge: z.string().trim().optional().nullable(),
  expiresAt: z.string().trim().optional().nullable(),
  featured: z.boolean().optional(),
  showOnHome: z.boolean().optional(),
  status: contentStatusSchema.optional(),
});

export type OfferLiveRecord = {
  id: string;
  title: string;
  slug: string;
  imageUrl: string;
  iconUrl: string;
  affiliateLink: string;
  location: string;
  country: string;
  duration: string;
  startingPrice: string;
  description: string;
  discountBadge: string;
  expiresAt: string;
  featured: boolean;
  showOnHome: boolean;
  status: "draft" | "published" | "removed";
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

export function parseOfferLiveRecord(record: Record<string, unknown>): OfferLiveRecord {
  return {
    id: String(record.id ?? ""),
    title: normalizeString(record.title),
    slug: normalizeString(record.slug),
    imageUrl: normalizeString(record.imageUrl, "/images/customize-band.jpg"),
    iconUrl: normalizeString(record.iconUrl),
    affiliateLink: normalizeString(record.affiliateLink),
    location: normalizeString(record.location),
    country: normalizeString(record.country),
    duration: normalizeString(record.duration, "Curated travel window"),
    startingPrice: normalizeString(record.startingPrice, "Custom pricing"),
    description: normalizeString(
      record.description,
      "A polished booking offer with a stronger destination mood and direct affiliate path."
    ),
    discountBadge: normalizeString(record.discountBadge, "Limited offer"),
    expiresAt: normalizeString(record.expiresAt),
    featured: Boolean(record.featured),
    showOnHome: Boolean(record.showOnHome),
    status: record.status === "published" || record.status === "removed" ? (record.status as any) : "draft",
    createdAt: record.createdAt as string | Date | undefined,
    updatedAt: record.updatedAt as string | Date | undefined,
  };
}

export function buildOfferLiveData(input: unknown) {
  const parsed = offerInputSchema.parse(input);
  return {
    title: parsed.title,
    slug: slugifyContent(parsed.slug || parsed.title),
    imageUrl: normalizeOptionalString(parsed.imageUrl),
    iconUrl: normalizeOptionalString(parsed.iconUrl),
    affiliateLink: normalizeOptionalString(parsed.affiliateLink),
    location: normalizeOptionalString(parsed.location),
    country: normalizeOptionalString(parsed.country),
    duration: normalizeOptionalString(parsed.duration),
    startingPrice: normalizeOptionalString(parsed.startingPrice),
    description: normalizeOptionalString(parsed.description),
    discountBadge: normalizeOptionalString(parsed.discountBadge),
    expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : null,
    featured: Boolean(parsed.featured),
    showOnHome: Boolean(parsed.showOnHome),
    status: parsed.status ?? "draft",
  };
}
