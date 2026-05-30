"use client";

import { isAnalyticsAllowed } from "@/lib/analytics-consent";
import {
  trackGaCheckout,
  trackGaEvent,
  trackGaLogin,
  trackGaPageView,
  trackGaPurchase,
  trackGaSignup,
} from "@/components/analytics/GoogleAnalytics";
import {
  trackMetaCheckout,
  trackMetaCompleteRegistration,
  trackMetaLead,
  trackMetaPageView,
  trackMetaPurchase,
  trackMetaSearch,
  trackMetaViewContent,
} from "@/components/analytics/MetaPixel";

type AnalyticsMetadata = Record<string, unknown>;

export type GeneAnalyticsEventName =
  | "page_view"
  | "pricing_view"
  | "package_selected"
  | "checkout_started"
  | "payment_success"
  | "payment_failed"
  | "ai_planner_started"
  | "ai_input_completed"
  | "recommendation_viewed"
  | "recommendation_regenerated"
  | "item_replaced"
  | "analysis_started"
  | "analysis_completed"
  | "booking_button_clicked"
  | "affiliate_redirect_clicked"
  | "summary_viewed"
  | "ready_plan_clicked"
  | "destination_clicked"
  | "offer_clicked"
  | "event_clicked"
  | "signup_started"
  | "signup_completed"
  | "login_completed";

const SESSION_KEY = "gene:analytics:session-id";
const UTM_KEY = "gene:analytics:utm";
const COOKIE_NAME = "gene_analytics_sid";

function safeWindow() {
  return typeof window !== "undefined" ? window : null;
}

function ensureCookie(name: string, value: string) {
  if (typeof document === "undefined") return;
  try {
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${60 * 60 * 24 * 180}; samesite=lax`;
  } catch {
    // Ignore cookie failures.
  }
}

export function getAnalyticsSessionId() {
  const win = safeWindow();
  if (!win) return "";
  try {
    const existing = win.localStorage.getItem(SESSION_KEY);
    if (existing) {
      ensureCookie(COOKIE_NAME, existing);
      return existing;
    }
    const created = win.crypto?.randomUUID?.() ?? `sid_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    win.localStorage.setItem(SESSION_KEY, created);
    ensureCookie(COOKIE_NAME, created);
    return created;
  } catch {
    return `sid_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }
}

export function captureAttributionFromLocation() {
  const win = safeWindow();
  if (!win) return;
  try {
    const params = new URLSearchParams(win.location.search);
    const utm = {
      utm_source: params.get("utm_source"),
      utm_medium: params.get("utm_medium"),
      utm_campaign: params.get("utm_campaign"),
      utm_content: params.get("utm_content"),
      utm_term: params.get("utm_term"),
    };
    const hasAny = Object.values(utm).some(Boolean);
    if (hasAny) {
      win.localStorage.setItem(UTM_KEY, JSON.stringify(utm));
    }
  } catch {
    // Ignore storage or URL parsing issues.
  }
}

export function getStoredAttribution() {
  const win = safeWindow();
  if (!win) return {};
  try {
    const raw = win.localStorage.getItem(UTM_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function buildPayload(eventName: GeneAnalyticsEventName, pagePath: string, metadata?: AnalyticsMetadata) {
  return {
    eventName,
    category: metadata?.category ?? deriveCategory(eventName),
    pagePath,
    metadata: {
      ...getStoredAttribution(),
      ...(metadata || {}),
      referrer: typeof document !== "undefined" ? document.referrer || null : null,
    },
    sessionId: getAnalyticsSessionId(),
  };
}

function deriveCategory(eventName: GeneAnalyticsEventName) {
  if (eventName.includes("payment") || eventName.includes("checkout") || eventName.includes("package")) return "commerce";
  if (eventName.includes("signup") || eventName.includes("login")) return "auth";
  if (eventName.includes("ai_") || eventName.includes("recommendation") || eventName.includes("analysis")) return "ai";
  if (eventName.includes("clicked") || eventName.includes("viewed")) return "engagement";
  return "navigation";
}

function fireInternalAnalytics(body: Record<string, unknown>, useBeacon = false) {
  try {
    if (typeof navigator !== "undefined" && useBeacon && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([JSON.stringify(body)], { type: "application/json" });
      navigator.sendBeacon("/api/analytics/event", blob);
      return;
    }

    void fetch("/api/analytics/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: useBeacon,
      credentials: "same-origin",
    }).catch(() => null);
  } catch {
    // Never block UX for analytics.
  }
}

export function trackAnalyticsEvent(eventName: GeneAnalyticsEventName, metadata?: AnalyticsMetadata, options?: { useBeacon?: boolean; pagePath?: string }) {
  if (!isAnalyticsAllowed()) return;
  const pagePath =
    options?.pagePath ||
    (typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search || ""}`
      : "/");

  const payload = buildPayload(eventName, pagePath, metadata);
  fireInternalAnalytics(payload, options?.useBeacon);
  dispatchVendorEvents(eventName, payload.metadata as AnalyticsMetadata, pagePath);
}

function dispatchVendorEvents(eventName: GeneAnalyticsEventName, metadata: AnalyticsMetadata, pagePath: string) {
  const packageName = String(metadata.packageName ?? metadata.planType ?? metadata.contentName ?? "Gene Travel");
  const value = typeof metadata.value === "number" ? metadata.value : Number(metadata.value ?? 0);
  const currency = String(metadata.currency ?? "USD");
  const transactionId = String(metadata.transactionId ?? metadata.paymentId ?? metadata.orderId ?? "");

  switch (eventName) {
    case "page_view":
      trackMetaPageView();
      trackGaPageView(pagePath);
      break;
    case "pricing_view":
      trackMetaViewContent("Pricing");
      trackGaEvent("view_item", { item_name: "Pricing" });
      break;
    case "ready_plan_clicked":
    case "destination_clicked":
    case "offer_clicked":
    case "event_clicked":
      trackMetaViewContent(packageName, metadata);
      trackGaEvent("select_item", { item_name: packageName, item_category: metadata.category || eventName });
      break;
    case "checkout_started":
      trackMetaCheckout(packageName, value, currency, transactionId || undefined);
      trackGaCheckout(packageName, value, currency);
      break;
    case "payment_success":
      trackMetaPurchase(packageName, value, currency, transactionId || undefined);
      if (transactionId) {
        trackGaPurchase(transactionId, packageName, value, currency);
      } else {
        trackGaEvent("purchase", { item_name: packageName, currency, value });
      }
      break;
    case "signup_started":
    case "ai_planner_started":
      trackMetaLead(metadata);
      trackGaEvent("generate_lead", metadata);
      break;
    case "signup_completed":
      trackMetaCompleteRegistration(metadata);
      trackGaSignup();
      break;
    case "login_completed":
      trackGaLogin();
      break;
    default:
      if (typeof metadata.searchTerm === "string") {
        trackMetaSearch(metadata.searchTerm);
        trackGaEvent("search", { search_term: metadata.searchTerm });
      }
      break;
  }
}

export function trackPageView(path?: string) {
  trackAnalyticsEvent("page_view", {}, { pagePath: path });
}

export function trackSelectItem(eventName: Extract<GeneAnalyticsEventName, "ready_plan_clicked" | "destination_clicked" | "offer_clicked" | "event_clicked">, contentName: string, metadata?: AnalyticsMetadata) {
  trackAnalyticsEvent(eventName, { contentName, ...metadata });
}

export function trackCheckoutStart(packageName: string, value?: number, currency = "USD", metadata?: AnalyticsMetadata) {
  trackAnalyticsEvent("checkout_started", { packageName, value, currency, ...metadata });
}

export function trackPurchaseSuccess(packageName: string, value?: number, currency = "USD", metadata?: AnalyticsMetadata) {
  const transactionId =
    String(metadata?.transactionId ?? metadata?.paymentId ?? metadata?.orderId ?? crypto.randomUUID?.() ?? `purchase_${Date.now()}`);
  trackAnalyticsEvent("payment_success", { packageName, value, currency, transactionId, ...metadata });
}

export function trackLead(eventName: Extract<GeneAnalyticsEventName, "signup_started" | "ai_planner_started">, metadata?: AnalyticsMetadata) {
  trackAnalyticsEvent(eventName, metadata);
}

export function trackSearch(searchTerm: string, metadata?: AnalyticsMetadata) {
  trackAnalyticsEvent("page_view", { searchTerm, ...metadata });
}
