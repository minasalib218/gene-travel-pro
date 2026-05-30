"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { captureAttributionFromLocation, trackPageView } from "@/lib/analytics";

export default function AnalyticsRuntime() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    captureAttributionFromLocation();
  }, []);

  useEffect(() => {
    const query = searchParams.toString();
    const path = query ? `${pathname}?${query}` : pathname;
    trackPageView(path);
  }, [pathname, searchParams]);

  return null;
}
