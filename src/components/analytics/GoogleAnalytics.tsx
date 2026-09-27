"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { loadAnalyticsConfig } from "@/lib/analytics/config-client";

const FALLBACK_GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-EP53JWYNY2";
let activeGaMeasurementId = FALLBACK_GA_MEASUREMENT_ID;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: any[]) => void;
  }
}

function callGtag(...args: any[]) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  try {
    window.gtag(...args);
  } catch {
    // Vendor analytics must stay non-blocking.
  }
}

export function trackGaPageView(path: string) {
  if (!activeGaMeasurementId) return;
  callGtag("config", activeGaMeasurementId, { page_path: path });
}

export function trackGaEvent(eventName: string, params?: Record<string, unknown>) {
  callGtag("event", eventName, params || {});
}

export function trackGaCheckout(packageName: string, value?: number, currency = "USD") {
  trackGaEvent("begin_checkout", {
    currency,
    value: value ?? 0,
    items: [{ item_name: packageName }],
  });
}

export function trackGaPurchase(transactionId: string, packageName: string, value?: number, currency = "USD") {
  trackGaEvent("purchase", {
    transaction_id: transactionId,
    currency,
    value: value ?? 0,
    items: [{ item_name: packageName }],
  });
}

export function trackGaSignup() {
  trackGaEvent("sign_up");
}

export function trackGaLogin() {
  trackGaEvent("login");
}

export default function GoogleAnalytics() {
  const [measurementId, setMeasurementId] = useState(FALLBACK_GA_MEASUREMENT_ID);
  const [enabled, setEnabled] = useState(Boolean(FALLBACK_GA_MEASUREMENT_ID));

  useEffect(() => {
    loadAnalyticsConfig()
      .then((data) => {
        const configuredId = data?.config?.gaMeasurementId || FALLBACK_GA_MEASUREMENT_ID;
        activeGaMeasurementId = configuredId;
        setMeasurementId(configuredId);
        setEnabled(Boolean(configuredId) && data?.config?.enableGoogleAnalytics !== false);
      })
      .catch(() => {
        activeGaMeasurementId = FALLBACK_GA_MEASUREMENT_ID;
      });
  }, []);

  if (!enabled || !measurementId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="gene-ga" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${measurementId}', {
            send_page_view: true
          });
        `}
      </Script>
    </>
  );
}
