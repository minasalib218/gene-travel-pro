import { z } from "zod";

export const contentStatusSchema = z.enum(["draft", "published", "removed"]);

export function slugifyContent(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function normalizeOptionalString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export function normalizeString(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

export const adminImageBucketSchema = z.enum(["ready-plans", "destinations", "offers", "events"]);

export const imageUploadConstraints = {
  maxBytes: 12 * 1024 * 1024,
  allowedTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"] as const,
};

export const imageUploadConstraintsLabel = {
  maxSizeText: "12 MB",
  allowedTypesText: "JPG, PNG, WebP, or AVIF",
};
