export const MAIN_CREDIT_ACTIONS = [
  "GENERATE_RECOMMENDATIONS",
  "REGENERATE_RECOMMENDATIONS",
  "GENERATE_DAY_PLAN",
  "STYLE_SWITCH_FULL_REBUILD",
  "AUTO_RECOVERY_FULL_REBUILD",
  "EXTRA_WHAT_IF_SIMULATION",
] as const;

export const EDIT_CREDIT_ACTIONS = [
  "REPLACE_HOTEL",
  "REPLACE_ACTIVITY",
  "REPLACE_RESTAURANT",
  "CHANGE_TIMING",
  "CHANGE_TRANSPORT",
  "ADD_EVENT",
  "REMOVE_ITEM",
  "REPLACE_EVENT",
  "REPLACE_FLIGHT",
  "REPLACE_CAR_RENTAL",
] as const;

export const FREE_ACTIONS = [
  "VIEW_RECOMMENDATIONS",
  "VIEW_ANALYSIS",
  "VIEW_SUMMARY",
  "CLICK_BOOK_NOW",
  "VIEW_LIVE_PRICES",
  "VIEW_VISA_NOTES",
  "VIEW_SAFETY_NOTES",
  "VIEW_BUDGET_BREAKDOWN",
  "VIEW_CONFIDENCE_MODULES",
  "OPEN_STORY_MODE",
  "OPEN_PACKING_ASSISTANT",
  "OPEN_RESTAURANT_TIMING",
] as const;

export type MainCreditAction = (typeof MAIN_CREDIT_ACTIONS)[number];
export type EditCreditAction = (typeof EDIT_CREDIT_ACTIONS)[number];
export type FreeAction = (typeof FREE_ACTIONS)[number];
export type CreditActionType = MainCreditAction | EditCreditAction | FreeAction | "CHAT_MESSAGE" | "EXPERT_REVIEW";

export function isMainCreditAction(actionType: string): actionType is MainCreditAction {
  return (MAIN_CREDIT_ACTIONS as readonly string[]).includes(actionType);
}

export function isEditCreditAction(actionType: string): actionType is EditCreditAction {
  return (EDIT_CREDIT_ACTIONS as readonly string[]).includes(actionType);
}

export function isFreeAction(actionType: string): actionType is FreeAction {
  return (FREE_ACTIONS as readonly string[]).includes(actionType);
}
