export type OfferStatus = "DRAFT" | "PUBLISHED";
export type OfferContentType = "offer" | "event";

export type OfferRecord = {
  id: string;
  title: string;
  slug: string;
  destination: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  coverImage: string;
  affiliateUrl: string;
  price: string;
  discountLabel: string;
  highlights: string[];
  status: OfferStatus;
  contentType: OfferContentType;
  updatedAt?: string | Date;
};

type DealLike = {
  id: string;
  title: string;
  meta: unknown;
  createdAt?: Date;
};

function readMeta(meta: unknown) {
  return meta && typeof meta === "object" ? (meta as Record<string, unknown>) : {};
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function toString(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

export function parseOfferRecord(deal: DealLike): OfferRecord {
  const meta = readMeta(deal.meta);
  const title = toString(meta.title, deal.title) || deal.title;
  const destination = toString(meta.destination, "Destination");
  const subtitle = toString(meta.subtitle, `${destination} offer`);
  const description =
    toString(meta.description) ||
    "A polished booking offer with a stronger destination mood, softer visual rhythm, and a direct affiliate path.";
  const imageUrl =
    toString(meta.imageUrl) ||
    toString(meta.coverImage) ||
    "/bg/home-hero-bottom.png";
  const coverImage =
    toString(meta.coverImage) ||
    toString(meta.imageUrl) ||
    imageUrl;
  const affiliateUrl = toString(meta.affiliateUrl);
  const price = toString(meta.price, "Open offer");
  const discountLabel = toString(meta.discountLabel, "Limited offer");
  const status = meta.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT";
  const contentType = meta.contentType === "event" ? "event" : "offer";
  const highlights = Array.isArray(meta.highlights)
    ? meta.highlights
        .map((entry) => toString(entry))
        .filter(Boolean)
        .slice(0, 6)
    : [];

  return {
    id: deal.id,
    title,
    slug: toString(meta.slug, slugify(title)),
    destination,
    subtitle,
    description,
    imageUrl,
    coverImage,
    affiliateUrl,
    price,
    discountLabel,
    highlights,
    status,
    contentType,
    updatedAt: deal.createdAt,
  };
}

export function buildOfferMeta(input: Partial<OfferRecord>) {
  return {
    slug: slugify(toString(input.slug, input.title || "offer")),
    title: toString(input.title),
    destination: toString(input.destination),
    subtitle: toString(input.subtitle),
    description: toString(input.description),
    imageUrl: toString(input.imageUrl),
    coverImage: toString(input.coverImage),
    affiliateUrl: toString(input.affiliateUrl),
    price: toString(input.price),
    discountLabel: toString(input.discountLabel),
    highlights: Array.isArray(input.highlights)
      ? input.highlights.map((entry) => toString(entry)).filter(Boolean)
      : [],
    status: input.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
    contentType: input.contentType === "event" ? "event" : "offer",
  };
}
