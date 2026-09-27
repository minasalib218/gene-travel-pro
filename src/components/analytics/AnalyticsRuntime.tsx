"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { captureAttributionFromLocation, trackPageEngagement, trackPageView } from "@/lib/analytics";

export default function AnalyticsRuntime() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPageRef = useRef("");
  const visibleSinceRef = useRef<number | null>(null);
  const activeMsRef = useRef(0);

  function collectVisibleTime() {
    if (visibleSinceRef.current === null) return;
    activeMsRef.current += Math.max(0, performance.now() - visibleSinceRef.current);
    visibleSinceRef.current = null;
  }

  function flushPageTime() {
    collectVisibleTime();
    if (currentPageRef.current && activeMsRef.current >= 1000) {
      trackPageEngagement(currentPageRef.current, activeMsRef.current);
    }
    activeMsRef.current = 0;
  }

  useEffect(() => {
    captureAttributionFromLocation();
  }, []);

  useEffect(() => {
    const query = searchParams.toString();
    const path = query ? `${pathname}?${query}` : pathname;
    flushPageTime();
    currentPageRef.current = path;
    visibleSinceRef.current = document.visibilityState === "visible" ? performance.now() : null;
    trackPageView(path);

    return () => flushPageTime();
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushPageTime();
      } else if (visibleSinceRef.current === null) {
        visibleSinceRef.current = performance.now();
      }
    };
    const handlePageHide = () => flushPageTime();

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      flushPageTime();
    };
  }, []);

  return null;
}
