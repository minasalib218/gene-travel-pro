import type { DayPlan, DayPlanItem } from "../recommendation/types";
import type { TimingValidationResult, TimingWarning } from "./types";

function toMinutes(value: string | null | undefined) {
  if (!value) return 0;
  const [hour = "0", minute = "0"] = value.split(":");
  return Number(hour) * 60 + Number(minute);
}

function fromMinutes(total: number) {
  const bounded = Math.max(0, total);
  const hh = `${Math.floor(bounded / 60)}`.padStart(2, "0");
  const mm = `${bounded % 60}`.padStart(2, "0");
  return `${hh}:${mm}`;
}

function activityLike(type: DayPlanItem["type"]) {
  return type === "activity" || type === "hidden_gem" || type === "restaurant";
}

export function validateAndAdjustDayPlan(dayPlan: DayPlan[]): TimingValidationResult<DayPlan> {
  const warnings: TimingWarning[] = [];
  const confidenceNotes: string[] = [];

  const adjusted = dayPlan.map((day) => {
    const sorted = [...day.items].sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
    const items = sorted.map((item, index) => {
      const previous = index > 0 ? sorted[index - 1] : null;
      let start = toMinutes(item.startTime);
      let end = toMinutes(item.endTime);
      const duration = Math.max(end - start, item.bufferMinutes || 60);

      if (previous) {
        const previousEnd = toMinutes(previous.endTime);
        const buffer =
          previous.type === "flight"
            ? 120
            : previous.type === "transport"
            ? 35
            : previous.type === "hotel"
            ? 25
            : 20;

        if (start < previousEnd + buffer) {
          start = previousEnd + buffer;
          end = start + duration;
          warnings.push({
            code: "OVERLAP",
            severity: "warn",
            message: `${item.title} was shifted to avoid overlapping with ${previous.title}.`,
            day: day.day,
            itemId: item.id,
          });
        }
      }

      if ((item.type === "flight" || item.type === "transport") && duration >= 12 * 60) {
        warnings.push({
          code: "LONG_TRAVEL_DAY",
          severity: "critical",
          message: `${item.title} creates a long travel day. Keep the rest of the day light.`,
          day: day.day,
          itemId: item.id,
        });
      }

      if (activityLike(item.type) && start <= 11 * 60) {
        const mealBufferEnd = end + 45;
        confidenceNotes.push(`Day ${day.day}: meal buffer kept after ${item.title}.`);
        end = Math.max(end, mealBufferEnd - 45);
      }

      return {
        ...item,
        startTime: fromMinutes(start),
        endTime: fromMinutes(end),
        bufferMinutes: Math.max(end - start, duration),
      };
    });

    return {
      ...day,
      items,
    };
  });

  return {
    items: adjusted,
    warnings,
    confidenceNotes,
  };
}
