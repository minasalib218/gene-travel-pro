"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { loadAnalyticsConfig } from "@/lib/analytics/config-client";

const DEFAULT_META_PIXEL_ID = "1342110297701763";

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: (...args: any[]) => void;
  }
}

function callFbq(...args: any[]) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  try {
    window.fbq(...args);
  } catch {
    // Vendor analytics must never break the page.
  }
}

export function trackMetaPageView() {
  callFbq("track", "PageView");
}

export function trackMetaLead(metadata?: Record<string, unknown>) {
  callFbq("track", "Lead", metadata || {});
}

export function trackMetaCheckout(packageName: string, value?: number, currency = "USD", eventId?: string) {
  callFbq(
    "track",
    "InitiateCheckout",
    {
      content_name: packageName,
      value: value ?? 0,
      currency,
    },
    eventId ? { eventID: eventId } : undefined,
  );
}

export function trackMetaPurchase(packageName: string, value?: number, currency = "USD", eventId?: string) {
  callFbq(
    "track",
    "Purchase",
    {
      content_name: packageName,
      value: value ?? 0,
      currency,
    },
    eventId ? { eventID: eventId } : undefined,
  );
}

export function trackMetaViewContent(contentName: string, metadata?: Record<string, unknown>) {
  callFbq("track", "ViewContent", {
    content_name: contentName,
    ...(metadata || {}),
  });
}

export function trackMetaSearch(searchTerm: string) {
  callFbq("track", "Search", { search_string: searchTerm });
}

export function trackMetaCompleteRegistration(metadata?: Record<string, unknown>) {
  callFbq("track", "CompleteRegistration", metadata || {});
}

export default function MetaPixel() {
  const [pixelId, setPixelId] = useState("");
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    loadAnalyticsConfig()
      .then((data) => {
        const configuredPixelId = data?.config?.metaPixelId || DEFAULT_META_PIXEL_ID;
        setPixelId(configuredPixelId);
        setEnabled(data?.config?.enableMetaPixel !== false);
      })
      .catch(() => {
        const fallback = process.env.NEXT_PUBLIC_META_PIXEL_ID || DEFAULT_META_PIXEL_ID;
        setPixelId(fallback);
        setEnabled(Boolean(fallback));
      });
  }, []);

  if (!enabled || !pixelId) return null;

  return (
    <>
      <Script id="gene-meta-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${pixelId}');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
