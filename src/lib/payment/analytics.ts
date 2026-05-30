type AnalyticsPayload = Record<string, unknown>;

export function trackPaymentEvent(eventName: string, payload?: AnalyticsPayload) {
  if (typeof window === "undefined") return;

  try {
    import("@/lib/analytics").then(({ trackAnalyticsEvent }) => {
      const mapped =
        eventName === "payment_activation_complete"
          ? "payment_success"
          : eventName === "payment_failure_page_view"
            ? "payment_failed"
            : null;

      if (mapped) {
        trackAnalyticsEvent(mapped, payload);
      }
    });
  } catch {
    // Payment telemetry must never break checkout recovery flows.
  }
}
