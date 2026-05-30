import type {
  BudgetCategory,
  BudgetCategoryTotals,
  BudgetSettings,
  DayPlan,
  RecommendationPayload,
  SelectedRecommendations,
} from "@/lib/recommendation/types";

const categories: BudgetCategory[] = ["flights", "lodging", "activities", "transport", "misc"];

export function createEmptyBudgetTotals(): BudgetCategoryTotals {
  return {
    flights: 0,
    lodging: 0,
    activities: 0,
    transport: 0,
    misc: 0,
  };
}

export function createDefaultBudgetLimits(totalBudget: number): BudgetCategoryTotals {
  const safeBudget = Math.max(totalBudget, 0);
  return {
    flights: Math.round(safeBudget * 0.28),
    lodging: Math.round(safeBudget * 0.34),
    activities: Math.round(safeBudget * 0.18),
    transport: Math.round(safeBudget * 0.12),
    misc: Math.max(0, safeBudget - Math.round(safeBudget * 0.92)),
  };
}

export function buildBudgetTotalsFromSelection(
  selected: SelectedRecommendations,
  dayPlan: DayPlan[],
): BudgetCategoryTotals {
  const totals = createEmptyBudgetTotals();
  totals.flights = selected.flight?.fare ?? 0;
  totals.lodging = selected.hotel?.nightlyPrice ?? 0;
  totals.activities = selected.activities.reduce((sum, item) => sum + (item.price ?? 0), 0);
  totals.transport =
    (selected.transport?.cost ?? 0) +
    (selected.car?.dailyPrice ?? 0) +
    dayPlan.reduce(
      (sum, day) =>
        sum +
        day.items.reduce((itemSum, item) => {
          if (item.type === "transport" || item.type === "car") return itemSum + (item.cost ?? 0);
          return itemSum;
        }, 0),
      0,
    );
  return totals;
}

export function buildBudgetSettings(
  payload: Pick<RecommendationPayload, "inputs" | "selected" | "dayPlan" | "summaryState">,
): BudgetSettings {
  const totals = buildBudgetTotalsFromSelection(payload.selected, payload.dayPlan);
  const persisted = payload.summaryState?.budget;
  const limits = persisted?.limits ?? createDefaultBudgetLimits(payload.inputs.budget);
  const remaining = categories.reduce((acc, key) => {
    acc[key] = Math.max((limits[key] ?? 0) - (totals[key] ?? 0), 0);
    return acc;
  }, createEmptyBudgetTotals());

  return {
    limits,
    totals,
    remaining,
    collaborativeNotes: persisted?.collaborativeNotes ?? "",
  };
}
