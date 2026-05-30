"use client";

import { useEffect, useRef, useState } from "react";
import type { PublicPlanType } from "@/lib/payment/passRules";

type Props = {
  planId: PublicPlanType;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  onCheckoutIntent?: (planId: PublicPlanType) => void;
  onCheckoutStarted?: (planId: PublicPlanType) => void;
  autoStart?: boolean;
};

export default function PaddleCheckoutButton({ planId, className, style, children, onCheckoutIntent, onCheckoutStarted, autoStart = false }: Props) {
  const [loading, setLoading] = useState(false);
  const autoStartedRef = useRef(false);

  async function handleClick() {
    if (loading) return;

    onCheckoutIntent?.(planId);
    setLoading(true);
    try {
      const res = await fetch("/api/payments/paddle/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, sourcePath: "/pricing" }),
      });

      const data = (await res.json().catch(() => null)) as
        | { checkoutUrl?: string; error?: string }
        | null;

      if (res.status === 401) {
        const next = `/pricing?checkout=${encodeURIComponent(planId)}`;
        window.location.href = `/signin?next=${encodeURIComponent(next)}`;
        return;
      }

      if (!res.ok || !data?.checkoutUrl) {
        throw new Error(data?.error || "Unable to start checkout.");
      }

      onCheckoutStarted?.(planId);
      window.location.href = data.checkoutUrl;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to start checkout.";
      window.alert(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!autoStart || autoStartedRef.current) return;
    autoStartedRef.current = true;
    void handleClick();
  }, [autoStart]);

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
