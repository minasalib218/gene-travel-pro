"use client";

type AnalyticsConfigResponse = {
  ok?: boolean;
  config?: {
    metaPixelId?: string;
    gaMeasurementId?: string;
    enableMetaPixel?: boolean;
    enableGoogleAnalytics?: boolean;
    enableInternalAnalytics?: boolean;
  };
};

declare global {
  interface Window {
    __geneAnalyticsConfig?: AnalyticsConfigResponse;
    __geneAnalyticsConfigPromise?: Promise<AnalyticsConfigResponse>;
  }
}

function waitForIdle(callback: () => void) {
  if (typeof window === "undefined") return;
  const idle = window.requestIdleCallback;
  if (idle) {
    idle(callback, { timeout: 1600 });
    return;
  }
  window.setTimeout(callback, 500);
}

export function loadAnalyticsConfig() {
  if (typeof window === "undefined") {
    return Promise.resolve({ ok: true, config: {} } satisfies AnalyticsConfigResponse);
  }

  if (window.__geneAnalyticsConfig) {
    return Promise.resolve(window.__geneAnalyticsConfig);
  }

  if (!window.__geneAnalyticsConfigPromise) {
    window.__geneAnalyticsConfigPromise = new Promise((resolve) => {
      waitForIdle(() => {
        fetch("/api/analytics/config", { cache: "force-cache" })
          .then((response) => response.json())
          .then((data: AnalyticsConfigResponse) => {
            window.__geneAnalyticsConfig = data;
            resolve(data);
          })
          .catch(() => {
            const fallback = { ok: true, config: {} } satisfies AnalyticsConfigResponse;
            window.__geneAnalyticsConfig = fallback;
            resolve(fallback);
          });
      });
    });
  }

  return window.__geneAnalyticsConfigPromise;
}
