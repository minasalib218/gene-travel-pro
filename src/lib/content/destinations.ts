import { z } from "zod";
import { contentStatusSchema, normalizeOptionalString, normalizeString, slugifyContent } from "./shared";

export const destinationInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  slug: z.string().trim().optional().nullable(),
  imageUrl: z.string().trim().optional().nullable(),
  iconUrl: z.string().trim().optional().nullable(),
  affiliateLink: z.string().trim().optional().nullable(),
  description: z.string().trim().optional().nullable(),
  status: contentStatusSchema.optional(),
});

export type DestinationRecord = {
  id: string;
  title: string;
  slug: string;
  imageUrl: string;
  iconUrl: string;
  affiliateLink: string;
  description: string;
  status: "draft" | "published" | "removed";
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

export function parseDestinationRecord(record: Record<string, unknown>): DestinationRecord {
  return {
    id: String(record.id ?? ""),
    title: normalizeString(record.title),
    slug: normalizeString(record.slug),
    imageUrl: normalizeString(record.imageUrl, "/bg/home-hero-bottom.png"),
    iconUrl: normalizeString(record.iconUrl),
    affiliateLink: normalizeString(record.affiliateLink),
    description: normalizeString(
      record.description,
      "A cinematic destination card with a polished route, warm mood, and direct Gene booking path."
    ),
    status: record.status === "published" || record.status === "removed" ? (record.status as any) : "draft",
    createdAt: record.createdAt as string | Date | undefined,
    updatedAt: record.updatedAt as string | Date | undefined,
  };
}

export function buildDestinationData(input: unknown) {
  const parsed = destinationInputSchema.parse(input);
  return {
    title: parsed.title,
    slug: slugifyContent(parsed.slug || parsed.title),
    imageUrl: normalizeOptionalString(parsed.imageUrl),
    iconUrl: normalizeOptionalString(parsed.iconUrl),
    affiliateLink: normalizeOptionalString(parsed.affiliateLink),
    description: normalizeOptionalString(parsed.description),
    status: parsed.status ?? "draft",
  };
}
