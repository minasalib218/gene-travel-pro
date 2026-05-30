import type { DayPlan, DayPlanItem, SelectedRecommendations, UserTripInput } from "@/lib/recommendation/types";
import { buildBudgetTotalsFromSelection } from "@/lib/recommendation/budget";

export type EditableItineraryItem = Partial<Pick<DayPlanItem, "title" | "description" | "location" | "startTime" | "endTime" | "deepLink">> & {
  id: string;
};

export function updateItineraryItem(dayPlan: DayPlan[], update: EditableItineraryItem): DayPlan[] {
  return dayPlan.map((day) => ({
    ...day,
    items: day.items.map((item) => (item.id === update.id ? { ...item, ...update } : item)),
  }));
}

export function removeItineraryItem(dayPlan: DayPlan[], itemId: string): DayPlan[] {
  return dayPlan.map((day) => ({
    ...day,
    items: day.items.filter((item) => item.id !== itemId),
  }));
}

export function moveItineraryItem(dayPlan: DayPlan[], itemId: string, targetDay: number): DayPlan[] {
  const allDays = dayPlan.map((day) => ({ ...day, items: [...day.items] }));
  let moving: DayPlanItem | null = null;

  allDays.forEach((day) => {
    const match = day.items.find((item) => item.id === itemId);
    if (match) {
      moving = { ...match, day: targetDay };
      day.items = day.items.filter((item) => item.id !== itemId);
    }
  });

  if (!moving) return allDays;

  const target = allDays.find((day) => day.day === targetDay);
  if (!target) return allDays;

  target.items.push({ ...moving, bufferMinutes: computeBufferMinutes(moving.startTime, moving.endTime) });
  target.items.sort((a, b) => a.startTime.localeCompare(b.startTime));
  return allDays;
}

export function addItineraryItem(
  dayPlan: DayPlan[],
  dayNumber: number,
  item: Omit<DayPlanItem, "day" | "bufferMinutes">,
): DayPlan[] {
  return dayPlan.map((day) =>
    day.day === dayNumber
      ? {
          ...day,
          items: [
            ...day.items,
            {
              ...item,
              day: dayNumber,
              bufferMinutes: computeBufferMinutes(item.startTime, item.endTime),
            },
          ].sort((a, b) => a.startTime.localeCompare(b.startTime)),
        }
      : day,
  );
}

export function computeBufferMinutes(startTime: string, endTime: string) {
  const [startHour = 0, startMinute = 0] = startTime.split(":").map(Number);
  const [endHour = 0, endMinute = 0] = endTime.split(":").map(Number);
  const start = startHour * 60 + startMinute;
  const end = endHour * 60 + endMinute;
  return Math.max(end - start, 0);
}

export function recalculatePlanMetrics(
  inputs: UserTripInput,
  selected: SelectedRecommendations,
  dayPlan: DayPlan[],
) {
  const activityCount = dayPlan.reduce(
    (sum, day) => sum + day.items.filter((item) => item.type === "activity").length,
    0,
  );
  const transportMinutes = dayPlan.reduce(
    (sum, day) => sum + day.items.reduce((itemSum, item) => itemSum + (item.bufferMinutes ?? computeBufferMinutes(item.startTime, item.endTime)), 0),
    0,
  );
  const totals = buildBudgetTotalsFromSelection(selected, dayPlan);
  const dailyLoad = Math.max(activityCount / Math.max(dayPlan.length, 1), 0);

  return {
    bufferMinutes: transportMinutes,
    estimatedBudget: Object.values(totals).reduce((sum, value) => sum + value, 0),
    fatigueScore: Math.max(45, Math.round(92 - dailyLoad * 9 - (inputs.walkingTolerance < 40 ? 8 : 0))),
    totals,
  };
}
