import type { NormalizedTravelItem, SupplierContext } from "@/lib/travel-engine/types";

export interface TravelSupplierAdapter {
  readonly supplier: string;
  readonly categories: string[];
  search(context: SupplierContext): Promise<NormalizedTravelItem[]>;
}
