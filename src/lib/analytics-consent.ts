"use client";

const ANALYTICS_DISABLED_KEY = "gene:analytics-disabled";

export function isAnalyticsAllowed() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(ANALYTICS_DISABLED_KEY) !== "1";
  } catch {
    return true;
  }
}

export function setAnalyticsAllowed(allowed: boolean) {
  if (typeof window === "undefined") return;
  try {
    if (allowed) {
      window.localStorage.removeItem(ANALYTICS_DISABLED_KEY);
    } else {
      window.localStorage.setItem(ANALYTICS_DISABLED_KEY, "1");
    }
  } catch {
    // Ignore storage issues. We want analytics gating to stay non-blocking.
  }
}
