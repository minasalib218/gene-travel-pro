import { resolveDestinationCatalogEntry } from "@/lib/travel-engine/destination-catalog";
import { logTravelEngine } from "@/lib/travel-engine/logger";
import { getEnabledSupplierAdapters } from "@/lib/travel-engine/supplier-registry";
import type {
  NormalizedTravelItem,
  RankedTravelItem,
  SupplierContext,
  TravelItemCategory,
} from "@/lib/travel-engine/types";

function scoreItem(context: SupplierContext, item: NormalizedTravelItem): RankedTravelItem {
  const reasons: string[] = [];
  const warnings: string[] = [];
  let score = 50;

  if (item.availability_state === "available") {
    score += 24;
    reasons.push("Available from supplier");
  } else if (item.availability_state === "limited") {
    score += 12;
    reasons.push("Limited but still available");
  } else {
    warnings.push("Needs revalidation before booking");
  }

  if (typeof item.price_snapshot === "number" && context.budget > 0) {
    const budgetFit = item.price_snapshot / Math.max(context.budget, 1);
    if (budgetFit <= 0.18) {
      score += 18;
      reasons.push("Strong budget fit");
    } else if (budgetFit <= 0.32) {
      score += 10;
      reasons.push("Within expected budget band");
    } else {
      warnings.push("Price is on the higher side for this budget");
    }
  }

  if (typeof item.rating_snapshot === "number") {
    score += Math.round(item.rating_snapshot * 4);
    reasons.push("Strong review quality");
  }

  if (context.directFlightsOnly && item.category === "flight" && Number(item.metadata.stops || 0) > 0) {
    score -= 16;
    warnings.push("Includes a stop despite direct-flight preference");
  }

  const text = `${item.title} ${JSON.stringify(item.metadata)}`.toLowerCase();
  const personalities = (context.tripPersonality || []).join(" ").toLowerCase();
  if (/luxury/.test(personalities) && /boutique|suite|private|premium|palace/.test(text)) {
    score += 12;
    reasons.push("Matches luxury preferences");
  }
  if (/food/.test((context.interests || []).join(" ").toLowerCase()) && /food|chef|tasting|market/.test(text)) {
    score += 10;
    reasons.push("Aligned with food interests");
  }
  if (/culture|museum|history/.test((context.interests || []).join(" ").toLowerCase()) && /heritage|museum|cultural|old town/.test(text)) {
    score += 10;
    reasons.push("Aligned with cultural interests");
  }
  if (item.category === "transport" && /private/.test(text) && /luxury|private/.test(`${context.travelStyle || ""}`.toLowerCase())) {
    score += 10;
    reasons.push("Reduces transfer friction");
  }
  if (item.category === "restaurant" && !item.affiliate_eligible) {
    warnings.push("Supplier booking is not directly bookable");
  }

  return {
    ...item,
    score,
    ranking_reasons: reasons,
    warnings,
  };
}

export async function fetchNormalizedTravelInventory(
  context: SupplierContext,
): Promise<Record<TravelItemCategory, RankedTravelItem[]>> {
  const destination = resolveDestinationCatalogEntry(
    context.destinationCity || context.destination,
    context.destinationCountry,
  );
  const nextContext = {
    ...context,
    destinationId: destination.id,
    destinationCity: destination.city,
    destinationCountry: destination.country,
  };

  const adapters = getEnabledSupplierAdapters();
  const results = await Promise.all(adapters.map((adapter) => adapter.search(nextContext)));
  const flat = results.flat().map((item) =>
    scoreItem(nextContext, {
      ...item,
      destination_id: item.destination_id || destination.id,
      timezone: item.timezone || destination.timezone,
      lat: item.lat ?? destination.lat,
      lng: item.lng ?? destination.lng,
    }),
  );

  logTravelEngine("info", "inventory.fetched", {
    destinationId: destination.id,
    totalItems: flat.length,
  });

  const grouped: Record<TravelItemCategory, RankedTravelItem[]> = {
    hotel: [],
    flight: [],
    trip: [],
    activity: [],
    transport: [],
    event: [],
    restaurant: [],
    car: [],
  };

  for (const item of flat) {
    grouped[item.category].push(item);
  }

  (Object.keys(grouped) as TravelItemCategory[]).forEach((key) => {
    grouped[key] = grouped[key].sort((a, b) => b.score - a.score);
  });

  return grouped;
}
