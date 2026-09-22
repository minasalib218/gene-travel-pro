export const ANALYTICS_EVENT_ALIASES: Record<string, string> = {
  ready_plan_clicked: "ready_plan_viewed",
  ready_plan_favorited: "item_favorited",
  ready_plan_unfavorited: "item_unfavorited",
  destination_clicked: "destination_viewed",
  destination_opened: "destination_viewed",
  destination_saved: "item_favorited",
  destination_removed: "item_unfavorited",
  offer_clicked: "offer_viewed",
  event_clicked: "event_viewed",
  booking_button_clicked: "booking_link_clicked",
  book_now_clicked: "booking_link_clicked",
  affiliate_redirect_clicked: "booking_link_clicked",
  ai_input_completed: "ai_planner_step_completed",
  signup_completed: "account_created",
  login_completed: "user_signed_in",
};

const ALLOWED_ANALYTICS_EVENTS = new Set([
  "account_created",
  "account_verified",
  "user_signed_in",
  "user_signed_out",
  "session_restored",
  "password_reset_requested",
  "profile_viewed",
  "profile_updated",
  "ready_plan_impression",
  "ready_plan_viewed",
  "ready_plan_saved",
  "ready_plan_used_as_base",
  "plan_created",
  "plan_viewed",
  "plan_renamed",
  "plan_saved",
  "plan_completed",
  "plan_archived",
  "plan_deleted",
  "item_favorited",
  "item_unfavorited",
  "ai_planner_opened",
  "ai_planner_started",
  "ai_planner_step_viewed",
  "ai_planner_step_completed",
  "ai_planner_validation_failed",
  "ai_generation_started",
  "ai_generation_completed",
  "ai_generation_failed",
  "ai_recommendations_viewed",
  "ai_plan_saved",
  "ai_plan_resumed",
  "ai_plan_abandoned",
  "recommendation_viewed",
  "recommendation_expanded",
  "recommendation_selected",
  "recommendation_deselected",
  "recommendation_replaced",
  "booking_item_viewed",
  "booking_link_clicked",
  "booking_intent_created",
  "booking_confirmation_received",
  "booking_cancelled",
  "reminder_created",
  "reminder_updated",
  "reminder_completed",
  "reminder_dismissed",
  "reminder_deleted",
  "credit_balance_viewed",
  "credit_purchase_started",
  "credit_purchase_completed",
  "credit_purchase_failed",
  "credit_consumed",
  "credit_refunded",
  "offer_impression",
  "offer_viewed",
  "offer_saved",
  "offer_booking_clicked",
  "destination_impression",
  "destination_viewed",
  "destination_saved",
  "destination_plan_started",
  "event_viewed",
  "page_view",
  "page_viewed",
  "navigation_clicked",
  "search_performed",
  "filter_applied",
  "cta_clicked",
  "external_link_clicked",
  "pricing_view",
  "package_selected",
  "checkout_started",
  "payment_success",
  "payment_failed",
  "summary_viewed",
  "analysis_started",
  "analysis_completed",
  "day_by_day_viewed",
  "recommendation_regenerated",
  "item_replaced",
  "wishlist_item_saved",
  "wishlist_item_removed",
  "signup_started",
]);

const SENSITIVE_METADATA_KEYS = [
  "password",
  "token",
  "access_token",
  "refresh_token",
  "authorization",
  "cookie",
  "secret",
  "card",
  "passportNumber",
  "documentContents",
  "supportMessage",
  "prompt",
];

function isSafeEventName(value: string) {
  return /^[a-z][a-z0-9_]{1,80}$/.test(value);
}

export function normalizeAnalyticsEventName(eventName: string) {
  const normalized = ANALYTICS_EVENT_ALIASES[eventName] ?? eventName;
  if (ALLOWED_ANALYTICS_EVENTS.has(normalized)) return normalized;
  return isSafeEventName(normalized) ? normalized : "external_link_clicked";
}

export function sanitizeAnalyticsMetadata(metadata: Record<string, unknown> | null | undefined) {
  const source = metadata ?? {};
  const safe: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(source)) {
    if (SENSITIVE_METADATA_KEYS.some((blocked) => key.toLowerCase().includes(blocked.toLowerCase()))) {
      continue;
    }
    if (typeof value === "string" && value.length > 500) {
      safe[key] = `${value.slice(0, 500)}...`;
      continue;
    }
    if (typeof value === "object" && value !== null) {
      const json = JSON.stringify(value);
      safe[key] = json.length > 1200 ? { truncated: true } : value;
      continue;
    }
    safe[key] = value;
  }

  return safe;
}
