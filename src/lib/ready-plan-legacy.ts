import { Prisma, ReadyPlanStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getTableColumns } from "@/lib/prisma-safe";

export type CompatibleReadyPlanRecord = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  destination: string;
  country?: string | null;
  city?: string | null;
  style?: string | null;
  daysCount: number;
  heroImage?: string | null;
  coverImage?: string | null;
  summary?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  tags?: string[];
  season?: string | null;
  showOnHome?: boolean;
  priceFrom?: number | null;
  currency: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  daysJson: unknown;
  contentJson?: unknown;
  links: Array<{
    id?: string;
    kind: string;
    label: string;
    deeplink: string;
    imageUrl?: string | null;
    sortOrder?: number;
  }>;
  updatedAt: string | Date;
  createdAt?: string | Date;
};

export type CompatibleReadyPlanWriteData = {
  status: ReadyPlanStatus;
  slug: string;
  title: string;
  subtitle: string | null;
  destination: string;
  country: string | null;
  city: string | null;
  style: string | null;
  daysCount: number;
  heroImage: string | null;
  coverImage: string | null;
  summary: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  tags: string[];
  season: string | null;
  showOnHome: boolean;
  priceFrom: number | null;
  currency: string;
  daysJson: Prisma.InputJsonValue;
  contentJson: Prisma.InputJsonValue;
};

function pickFirst(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    if (key in row && row[key] !== undefined) {
      return row[key];
    }
  }
  return undefined;
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNullableString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function asNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function asNullableNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = asNumber(value, Number.NaN);
  return Number.isFinite(parsed) ? parsed : null;
}

function asBoolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function toStatus(row: Record<string, unknown>): CompatibleReadyPlanRecord["status"] {
  const status = String(pickFirst(row, ["status"]) ?? "").toUpperCase();
  if (status === "PUBLISHED") return "PUBLISHED";
  if (status === "ARCHIVED" || status === "REMOVED") return "ARCHIVED";
  if ("isPublished" in row) return row.isPublished ? "PUBLISHED" : "DRAFT";
  return "DRAFT";
}

function sqlValue(value: unknown) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (value instanceof Date) return `'${value.toISOString().replace(/'/g, "''")}'`;
  if (Array.isArray(value)) {
    return `ARRAY[${value.map((item) => `'${String(item).replace(/'/g, "''")}'`).join(", ")}]::text[]`;
  }
  if (typeof value === "object") {
    return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
  }
  return `'${String(value).replace(/'/g, "''")}'`;
}

export function mapLegacyReadyPlanRow(row: Record<string, unknown>): CompatibleReadyPlanRecord {
  const title = asString(pickFirst(row, ["title"]), "Untitled Ready Plan");
  const destination = asString(
    pickFirst(row, ["destination", "city", "country", "description"]),
    "Destination pending",
  );
  const rawDaysJson = pickFirst(row, ["daysJson", "itineraryJson", "booking_items"]);
  const rawContentJson = pickFirst(row, ["contentJson", "content_sections"]);
  const rawSlug = asString(pickFirst(row, ["slug"]));

  return {
    id: asString(pickFirst(row, ["id"]), crypto.randomUUID()),
    slug: rawSlug || slugify(title) || crypto.randomUUID(),
    title,
    subtitle: asNullableString(pickFirst(row, ["subtitle", "summary", "overview", "description"])),
    destination,
    country: asNullableString(pickFirst(row, ["country"])),
    city: asNullableString(pickFirst(row, ["city"])),
    style: asNullableString(pickFirst(row, ["style"])),
    daysCount: asNumber(pickFirst(row, ["daysCount", "days"]), 0),
    heroImage: asNullableString(pickFirst(row, ["heroImage", "heroImageUrl", "hero_image_url"])),
    coverImage: asNullableString(pickFirst(row, ["coverImage", "card_image_url", "heroImageUrl", "hero_image_url"])),
    summary: asNullableString(pickFirst(row, ["summary", "overview", "description"])),
    seoTitle: asNullableString(pickFirst(row, ["seoTitle"])),
    seoDescription: asNullableString(pickFirst(row, ["seoDescription"])),
    tags: asArray(pickFirst(row, ["tags"])).map((item) => String(item)),
    season: asNullableString(pickFirst(row, ["season"])),
    showOnHome: asBoolean(pickFirst(row, ["showOnHome", "show_on_home"]), false),
    priceFrom: asNullableNumber(pickFirst(row, ["priceFrom", "price_from"])),
    currency: asString(pickFirst(row, ["currency"]), "USD"),
    status: toStatus(row),
    daysJson: rawDaysJson ?? [],
    contentJson: rawContentJson ?? null,
    links: [],
    updatedAt:
      (pickFirst(row, ["updatedAt", "updated_at", "createdAt", "created_at"]) as string | Date | undefined) ??
      new Date().toISOString(),
    createdAt: (pickFirst(row, ["createdAt", "created_at"]) as string | Date | undefined) ?? undefined,
  };
}

export async function listLegacyReadyPlans() {
  const columns = await getTableColumns("ready_plans");
  if (!columns.length) return [];

  const orderColumn = columns.includes("updatedAt")
    ? "updatedAt"
    : columns.includes("updated_at")
      ? "updated_at"
      : columns.includes("createdAt")
        ? "createdAt"
        : columns.includes("created_at")
          ? "created_at"
          : "id";

  const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
    `SELECT * FROM "ready_plans" ORDER BY "${orderColumn}" DESC`,
  );

  return rows.map(mapLegacyReadyPlanRow);
}

export async function getLegacyReadyPlanById(id: string) {
  const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
    `SELECT * FROM "ready_plans" WHERE "id" = '${id.replace(/'/g, "''")}' LIMIT 1`,
  );

  return rows[0] ? mapLegacyReadyPlanRow(rows[0]) : null;
}

function buildLegacyColumnMap(columns: string[], data: CompatibleReadyPlanWriteData) {
  const values: Record<string, unknown> = {};

  if (columns.includes("slug")) values.slug = data.slug;
  if (columns.includes("title")) values.title = data.title;
  if (columns.includes("subtitle")) values.subtitle = data.subtitle;
  if (columns.includes("description")) values.description = data.summary ?? data.subtitle;
  if (columns.includes("destination")) values.destination = data.destination;
  if (columns.includes("location")) values.location = data.destination;
  if (columns.includes("country")) values.country = data.country;
  if (columns.includes("city")) values.city = data.city;
  if (columns.includes("style")) values.style = data.style;
  if (columns.includes("daysCount")) values.daysCount = data.daysCount;
  if (columns.includes("days")) values.days = data.daysCount;
  if (columns.includes("duration")) values.duration = `${data.daysCount} days`;
  if (columns.includes("priceFrom")) values.priceFrom = data.priceFrom;
  if (columns.includes("price_from")) values.price_from = data.priceFrom;
  if (columns.includes("currency")) values.currency = data.currency;
  if (columns.includes("heroImage")) values.heroImage = data.heroImage;
  if (columns.includes("heroImageUrl")) values.heroImageUrl = data.heroImage;
  if (columns.includes("hero_image_url")) values.hero_image_url = data.heroImage;
  if (columns.includes("image_url")) values.image_url = data.heroImage ?? data.coverImage ?? null;
  if (columns.includes("coverImage")) values.coverImage = data.coverImage;
  if (columns.includes("card_image_url")) values.card_image_url = data.coverImage;
  if (columns.includes("summary")) values.summary = data.summary;
  if (columns.includes("overview")) values.overview = data.summary;
  if (columns.includes("seoTitle")) values.seoTitle = data.seoTitle;
  if (columns.includes("seoDescription")) values.seoDescription = data.seoDescription;
  if (columns.includes("tags")) values.tags = data.tags;
  if (columns.includes("season")) values.season = data.season;
  if (columns.includes("showOnHome")) values.showOnHome = data.showOnHome;
  if (columns.includes("show_on_home")) values.show_on_home = data.showOnHome;
  if (columns.includes("status")) values.status = data.status;
  if (columns.includes("isPublished")) values.isPublished = data.status === ReadyPlanStatus.PUBLISHED;
  if (columns.includes("daysJson")) values.daysJson = data.daysJson;
  if (columns.includes("itineraryJson")) values.itineraryJson = data.daysJson;
  if (columns.includes("booking_items")) values.booking_items = data.daysJson;
  if (columns.includes("contentJson")) values.contentJson = data.contentJson;
  if (columns.includes("content_sections")) values.content_sections = data.contentJson;
  if (columns.includes("createdAt")) values.createdAt = new Date();
  if (columns.includes("created_at")) values.created_at = new Date();
  if (columns.includes("updatedAt")) values.updatedAt = new Date();
  if (columns.includes("updated_at")) values.updated_at = new Date();

  return values;
}

export async function createLegacyReadyPlan(data: CompatibleReadyPlanWriteData) {
  const columns = await getTableColumns("ready_plans");
  const id = crypto.randomUUID();

  if (
    columns.length === 7 &&
    columns.includes("id") &&
    columns.includes("title") &&
    columns.includes("location") &&
    columns.includes("days") &&
    columns.includes("image_url") &&
    columns.includes("tags") &&
    columns.includes("created_at")
  ) {
    const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `INSERT INTO "ready_plans" ("id","title","location","days","image_url","tags","created_at")
       VALUES (${sqlValue(id)}, ${sqlValue(data.title)}, ${sqlValue(data.destination)}, ${sqlValue(data.daysCount)}, ${sqlValue(data.heroImage ?? data.coverImage ?? "")}, ${sqlValue(data.tags)}, ${sqlValue(new Date())})
       RETURNING *`,
    );

    return rows[0] ? mapLegacyReadyPlanRow(rows[0]) : null;
  }

  const mapped = buildLegacyColumnMap(columns, data);
  mapped.id = id;
  console.error("LEGACY_READY_PLAN_CREATE_COLUMNS", columns);
  console.error("LEGACY_READY_PLAN_CREATE_KEYS", Object.keys(mapped));

  const entries = Object.entries(mapped).filter(([, value]) => value !== undefined);
  const columnsSql = entries.map(([key]) => `"${key}"`).join(", ");
  const valuesSql = entries.map(([, value]) => sqlValue(value)).join(", ");

  const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
    `INSERT INTO "ready_plans" (${columnsSql}) VALUES (${valuesSql}) RETURNING *`,
  );

  return rows[0] ? mapLegacyReadyPlanRow(rows[0]) : null;
}

export async function updateLegacyReadyPlan(id: string, data: Partial<CompatibleReadyPlanWriteData>) {
  const columns = await getTableColumns("ready_plans");
  const mapped = buildLegacyColumnMap(columns, {
    status: data.status ?? ReadyPlanStatus.DRAFT,
    slug: data.slug ?? "",
    title: data.title ?? "",
    subtitle: data.subtitle ?? null,
    destination: data.destination ?? "",
    country: data.country ?? null,
    city: data.city ?? null,
    style: data.style ?? null,
    daysCount: data.daysCount ?? 0,
    heroImage: data.heroImage ?? null,
    coverImage: data.coverImage ?? null,
    summary: data.summary ?? null,
    seoTitle: data.seoTitle ?? null,
    seoDescription: data.seoDescription ?? null,
    tags: data.tags ?? [],
    season: data.season ?? null,
    showOnHome: data.showOnHome ?? false,
    priceFrom: data.priceFrom ?? null,
    currency: data.currency ?? "USD",
    daysJson: data.daysJson ?? [],
    contentJson: data.contentJson ?? null,
  });

  const entries = Object.entries(mapped).filter(([, value]) => value !== undefined);
  const setSql = entries.map(([key, value]) => `"${key}" = ${sqlValue(value)}`).join(", ");
  if (!setSql) {
    return getLegacyReadyPlanById(id);
  }

  const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
    `UPDATE "ready_plans" SET ${setSql} WHERE "id" = '${id.replace(/'/g, "''")}' RETURNING *`,
  );

  return rows[0] ? mapLegacyReadyPlanRow(rows[0]) : null;
}
