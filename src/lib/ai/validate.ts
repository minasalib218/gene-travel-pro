import type { PlanContract } from "@/lib/ai/contracts";
import type { ProviderData } from "@/lib/providers/aggregate";

function isTime(v: string) {
  return /^\d{2}:\d{2}$/.test(v);
}

export function validatePlanContract(data: any, providerData: ProviderData): data is PlanContract {
  if (!data || typeof data !== "object") return false;
  if (!data.picks || !Array.isArray(data.timeline) || !data.analysis) return false;

  const validIds = new Set([
    ...providerData.hotels.map((i) => i.id),
    ...providerData.activities.map((i) => i.id),
    ...providerData.transports.map((i) => i.id),
    ...providerData.flights.map((i) => i.id),
  ]);

  const picks = data.picks;
  if (picks.hotelId && !validIds.has(picks.hotelId)) return false;
  if (picks.flightId && !validIds.has(picks.flightId)) return false;
  if (picks.transportId && !validIds.has(picks.transportId)) return false;
  if (!Array.isArray(picks.activityIds)) return false;
  for (const id of picks.activityIds) {
    if (!validIds.has(id)) return false;
  }

  for (const day of data.timeline) {
    if (typeof day.dayIndex !== "number" || typeof day.date !== "string") return false;
    if (!Array.isArray(day.blocks)) return false;

    for (const block of day.blocks) {
      if (!block.slot || !block.kind || !block.title) return false;
      if (!isTime(block.startTime) || !isTime(block.endTime)) return false;
      if (block.providerItemId && !validIds.has(block.providerItemId)) return false;
    }
  }

  if (!Array.isArray(data.analysis.features)) return false;
  return true;
}