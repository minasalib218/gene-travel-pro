import { logTravelEngine } from "@/lib/travel-engine/logger";
import type { TravelSupplierAdapter } from "@/lib/travel-engine/supplier-adapters/base";
import type { NormalizedTravelItem, SupplierContext, TravelItemCategory } from "@/lib/travel-engine/types";

const DEFAULT_VIATOR_API_BASE_URL = "https://api.viator.com/partner";
const VIATOR_TIMEOUT_MS = 8_000;

type ViatorImageVariant = { height?: unknown; width?: unknown; url?: unknown };
type ViatorImage = { isCover?: unknown; variants?: ViatorImageVariant[] };
type ViatorProduct = {
  productCode?: unknown;
  title?: unknown;
  description?: unknown;
  productUrl?: unknown;
  images?: ViatorImage[];
  reviews?: { combinedAverageRating?: unknown; totalReviews?: unknown };
  duration?: {
    fixedDurationInMinutes?: unknown;
    variableDurationFromMinutes?: unknown;
    variableDurationToMinutes?: unknown;
    unstructuredDuration?: unknown;
  };
  pricing?: { currency?: unknown; summary?: { fromPrice?: unknown } };
  flags?: unknown[];
  tags?: unknown[];
  itineraryType?: unknown;
  confirmationType?: unknown;
};

function finiteNumber(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function safeText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function validProviderUrl(value: unknown) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function bestImage(images: ViatorImage[] | undefined) {
  const preferred = images?.find((image) => image?.isCover === true) ?? images?.[0];
  const variants = Array.isArray(preferred?.variants) ? preferred.variants : [];
  return variants
    .map((variant) => ({
      url: validProviderUrl(variant.url),
      width: finiteNumber(variant.width) ?? 0,
    }))
    .filter((variant): variant is { url: string; width: number } => Boolean(variant.url))
    .sort((a, b) => b.width - a.width)[0]?.url ?? null;
}

function durationMinutes(product: ViatorProduct) {
  return (
    finiteNumber(product.duration?.fixedDurationInMinutes) ??
    finiteNumber(product.duration?.variableDurationFromMinutes) ??
    finiteNumber(product.duration?.variableDurationToMinutes)
  );
}

function classifyProduct(product: ViatorProduct): TravelItemCategory {
  const text = `${safeText(product.title, 300)} ${String(product.itineraryType ?? "")}`.toLowerCase();
  if (/concert|festival|show|performance|theater|theatre|nightlife|night tour|ticketed event/.test(text)) {
    return "event";
  }
  if (/multi.day|day trip|excursion|cruise|safari|road trip|island hop/.test(text)) {
    return "trip";
  }
  return "activity";
}

function normalizeProduct(product: ViatorProduct, context: SupplierContext): NormalizedTravelItem | null {
  const productCode = safeText(product.productCode, 160);
  const title = safeText(product.title, 300);
  const productUrl = validProviderUrl(product.productUrl);
  if (!productCode || !title) return null;

  const category = classifyProduct(product);
  const price = finiteNumber(product.pricing?.summary?.fromPrice);
  const rating = finiteNumber(product.reviews?.combinedAverageRating);

  return {
    internal_id: `viator-${productCode}`,
    supplier: "viator",
    supplier_item_id: productCode,
    category,
    title,
    destination_id: context.destinationId,
    lat: null,
    lng: null,
    timezone: "UTC",
    price_snapshot: price,
    rating_snapshot: rating,
    duration_minutes: durationMinutes(product),
    start_time_local: null,
    end_time_local: null,
    // Product search is date-filtered, but an exact departure must still be
    // checked before purchase.
    availability_state: "needs_revalidation",
    // Viator states that the attributed productUrl must not be modified.
    source_url: productUrl,
    affiliate_eligible: Boolean(productUrl),
    last_validated_at: new Date().toISOString(),
    metadata: {
      provider: "viator",
      productCode,
      description: safeText(product.description, 1_500),
      imageUrl: bestImage(product.images),
      currency: safeText(product.pricing?.currency, 3) || context.currency,
      reviewCount: finiteNumber(product.reviews?.totalReviews),
      flags: Array.isArray(product.flags) ? product.flags.slice(0, 20) : [],
      tags: Array.isArray(product.tags) ? product.tags.slice(0, 50) : [],
      confirmationType: safeText(product.confirmationType, 40),
      itineraryType: safeText(product.itineraryType, 80),
      categoryLabel: category === "event" ? "event" : category === "trip" ? "day trip" : "activity",
      freshness: "live-search",
    },
  };
}

async function requestViator(context: SupplierContext, attempt = 0): Promise<ViatorProduct[]> {
  const apiKey = process.env.VIATOR_API_KEY?.trim();
  if (!apiKey) return [];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), VIATOR_TIMEOUT_MS);
  const baseUrl = (process.env.VIATOR_API_BASE_URL || DEFAULT_VIATOR_API_BASE_URL).replace(/\/+$/, "");
  const headers: Record<string, string> = {
    Accept: "application/json;version=2.0",
    "Content-Type": "application/json",
    "Accept-Language": "en-US",
    "exp-api-key": apiKey,
  };
  const campaign = process.env.VIATOR_CAMPAIGN_VALUE?.trim();
  if (campaign) headers["campaign-value"] = campaign.slice(0, 100);

  try {
    const interests = (context.interests || []).slice(0, 4).join(" ");
    const response = await fetch(`${baseUrl}/search/freetext`, {
      method: "POST",
      headers,
      signal: controller.signal,
      cache: "no-store",
      body: JSON.stringify({
        searchTerm: `${context.destinationCity || context.destination} ${interests}`.trim(),
        productFiltering: {
          dateRange: { from: context.startDate, to: context.endDate },
          includeAutomaticTranslations: true,
        },
        productSorting: { sort: "TRAVELER_RATING", order: "DESCENDING" },
        searchTypes: [{ searchType: "PRODUCTS", pagination: { start: 1, count: 12 } }],
        currency: context.currency || "USD",
      }),
    });

    if ((response.status === 429 || response.status >= 500) && attempt === 0) {
      await new Promise((resolve) => setTimeout(resolve, 250));
      return requestViator(context, 1);
    }
    if (!response.ok) {
      logTravelEngine("warn", "supplier.viator.failed", { status: response.status });
      return [];
    }

    const payload = (await response.json()) as { products?: { results?: unknown[] } };
    return Array.isArray(payload?.products?.results) ? (payload.products.results as ViatorProduct[]) : [];
  } catch (error) {
    logTravelEngine("warn", "supplier.viator.failed", {
      reason: error instanceof Error ? error.name : "unknown",
    });
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

export class ViatorExperienceAdapter implements TravelSupplierAdapter {
  readonly supplier = "viator";
  readonly categories = ["trip", "activity", "event"];

  async search(context: SupplierContext): Promise<NormalizedTravelItem[]> {
    const products = await requestViator(context);
    const items = products
      .map((product) => normalizeProduct(product, context))
      .filter((item): item is NormalizedTravelItem => Boolean(item));

    logTravelEngine("info", "supplier.viator.products", {
      destinationId: context.destinationId,
      count: items.length,
    });
    return items;
  }
}
