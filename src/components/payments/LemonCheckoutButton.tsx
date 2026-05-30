"use client";

import { useState } from "react";
import { openLemonOverlayCheckout } from "@/lib/payments/lemonsqueezy-client";

type LemonPlanId = "starter" | "pro" | "agency";

type Props = {
  planId: LemonPlanId;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

export default function LemonCheckoutButton({ planId, className, style, children }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (loading) return;

    setLoading(true);
    try {
      const res = await fetch("/api/payments/lemonsqueezy/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planId }),
      });

      const data = (await res.json().catch(() => null)) as
        | { checkoutUrl?: string; error?: string }
        | null;

      if (!res.ok || !data?.checkoutUrl) {
        throw new Error(data?.error || "Unable to start checkout.");
      }

      await openLemonOverlayCheckout(data.checkoutUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to start checkout.";
      window.alert(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={className}
      style={style}
    >
      {loading ? "Loading..." : children}
    </button>
  );
}
