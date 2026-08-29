import { z } from "zod";
import { contentStatusSchema, normalizeOptionalString, normalizeString, slugifyContent } from "./shared";

export const destinationSections = [
  { value: "africa", label: "Africa" },
  { value: "asia", label: "Asia" },
  { value: "australia", label: "Australia" },
  { value: "north-america", label: "North America" },
  { value: "latin-america", label: "Latin America" },
] as const;

export const destinationTripStyles = [
  { value: "adventure", label: "Adventure" },
  { value: "ancient-wonders", label: "Ancient Wonders" },
  { value: "city-and-culture", label: "City and Culture" },
  { value: "hiking-trekking", label: "Hiking & Trekking" },
  { value: "nature-wildlife", label: "Nature & Wildlife" },
  { value: "island-hopping", label: "Island Hopping" },
  { value: "safari", label: "Safari" },
  { value: "cruise", label: "Cruise" },
] as const;

export type DestinationSectionValue = (typeof destinationSections)[number]["value"];
export type DestinationTripStyleValue = (typeof destinationTripStyles)[number]["value"];

const destinationSectionValues = destinationSections.map((section) => section.value) as [
  DestinationSectionValue,
  ...DestinationSectionValue[],
];

export function normalizeDestinationSection(value: unknown): DestinationSectionValue {
  return destinationSections.some((section) => section.value === value) ? (value as DestinationSectionValue) : "asia";
}

export function getDestinationSectionLabel(value: unknown) {
  return destinationSections.find((section) => section.value === normalizeDestinationSection(value))?.label || "Asia";
}

export function normalizeDestinationTripStyles(value: unknown): DestinationTripStyleValue[] {
  const values = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : [];
  const allowed = new Set(destinationTripStyles.map((style) => style.value));

  return Array.from(
    new Set(
      values
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter((item): item is DestinationTripStyleValue => allowed.has(item as DestinationTripStyleValue)),
    ),
  );
}

export function getDestinationTripStyleLabel(value: unknown) {
  return destinationTripStyles.find((style) => style.value === value)?.label || "";
}

export const destinationInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  slug: z.string().trim().optional().nullable(),
  imageUrl: z.string().trim().optional().nullable(),
  iconUrl: z.string().trim().optional().nullable(),
  affiliateLink: z.string().trim().optional().nullable(),
  description: z.string().trim().optional().nullable(),
  section: z.enum(destinationSectionValues).optional().nullable(),
  tripStyles: z.array(z.string().trim()).optional().nullable(),
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
  section: DestinationSectionValue;
  tripStyles: DestinationTripStyleValue[];
  status: "draft" | "published" | "removed";
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

export function parseDestinationRecord(record: Record<string, unknown>): DestinationRecord {
  return {
    id: String(record.id ?? ""),
    title: normalizeString(record.title),
    slug: normalizeString(record.slug),
    imageUrl: normalizeString(record.imageUrl, "/bg/home-hero-bottom-optimized.jpg"),
    iconUrl: normalizeString(record.iconUrl),
    affiliateLink: normalizeString(record.affiliateLink),
    description: normalizeString(
      record.description,
      "A cinematic destination card with a polished route, warm mood, and direct Gene booking path."
    ),
    section: normalizeDestinationSection(record.section),
    tripStyles: normalizeDestinationTripStyles(record.tripStyles),
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
    section: normalizeDestinationSection(parsed.section),
    tripStyles: normalizeDestinationTripStyles(parsed.tripStyles),
    status: parsed.status ?? "draft",
  };
}
