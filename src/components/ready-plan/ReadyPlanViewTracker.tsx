"use client";

import { useEffect } from "react";
import { trackAnalyticsEvent } from "@/lib/analytics";

type Props = {
  readyPlanId: string;
  slug: string;
  title: string;
  destination: string;
};

export default function ReadyPlanViewTracker({
  readyPlanId,
  slug,
  title,
  destination,
}: Props) {
  useEffect(() => {
    trackAnalyticsEvent(
      "ready_plan_viewed",
      {
        readyPlanId,
        slug,
        title,
        contentName: title,
        destination,
        entityType: "ready_plan",
        entityId: readyPlanId,
      },
      { useBeacon: true },
    );

    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      fetch("/api/profile/recently-viewed", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          entityType: "READY_PLAN",
          entityId: readyPlanId,
          metadata: { slug, title, destination },
        }),
        signal: controller.signal,
      }).catch(() => null);
    }, 1200);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [destination, readyPlanId, slug, title]);

  return null;
}
