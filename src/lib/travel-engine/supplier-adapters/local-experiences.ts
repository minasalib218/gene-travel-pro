import { logTravelEngine } from "@/lib/travel-engine/logger";
import type { TravelSupplierAdapter } from "@/lib/travel-engine/supplier-adapters/base";
import type { NormalizedTravelItem, SupplierContext } from "@/lib/travel-engine/types";

/** No production fallback: local inventory requires an approved live provider. */
export class LocalExperienceAdapter implements TravelSupplierAdapter {
  readonly supplier = "gene-local";
  readonly categories = ["activity", "trip", "restaurant", "transport", "event"];

  async search(context: SupplierContext): Promise<NormalizedTravelItem[]> {
    logTravelEngine("warn", "supplier.local.not_configured", {
      destinationId: context.destinationId,
      code: "PROVIDER_NOT_CONFIGURED",
    });
    return [];
  }
}
