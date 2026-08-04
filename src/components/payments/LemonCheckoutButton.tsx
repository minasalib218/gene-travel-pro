"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { openLemonOverlayCheckout } from "@/lib/payments/lemonsqueezy-client";
import type { PublicPlanType } from "@/lib/payment/passRules";

type Props = {
  planId: PublicPlanType;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  autoStart?: boolean;
  sourcePath?: string;
  onCheckoutIntent?: (planId: PublicPlanType) => void;
  onCheckoutStarted?: (planId: PublicPlanType) => void;
};

export default function LemonCheckoutButton({
  planId,
  className,
  style,
  children,
  autoStart = false,
  sourcePath = "/pricing",
  onCheckoutIntent,
  onCheckoutStarted,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoStartedRef = useRef(false);

  async function handleClick() {
    if (loading) return;

    setError(null);
    setLoading(true);
    try {
      onCheckoutIntent?.(planId);

      const res = await fetch("/api/checkout/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tier: planId, sourcePath }),
      });

      const data = (await res.json().catch(() => null)) as
        | { checkoutUrl?: string; error?: string; code?: string; next?: string }
        | null;

      if (res.status === 401) {
        const next = `${sourcePath}?checkout=${encodeURIComponent(planId)}`;
        router.push(`/signin?next=${encodeURIComponent(next)}`);
        return;
      }

      if (data?.code === "PROFILE_SETUP_REQUIRED" && data.next) {
        setError(data.error || "Please complete your profile before checkout.");
        router.push(data.next);
        return;
      }

      if (data?.code === "CHECKOUT_DB_UNAVAILABLE") {
        throw new Error(
          data.error || "Checkout is temporarily unavailable because the database connection failed.",
        );
      }

      if (!res.ok || !data?.checkoutUrl) {
        throw new Error(data?.error || "Unable to start checkout.");
      }

      onCheckoutStarted?.(planId);
      await openLemonOverlayCheckout(data.checkoutUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to start checkout.";
      setError(message);
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
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={className}
        style={style}
      >
        {loading ? "Preparing checkout..." : children}
      </button>

      {loading ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 px-5 backdrop-blur-md">
          <div className="w-full max-w-md rounded-[28px] border border-white/12 bg-black/45 p-6 text-white shadow-[0_35px_100px_rgba(0,0,0,0.55)]">
            <div className="mx-auto h-11 w-11 animate-spin rounded-full border-2 border-white/20 border-t-[#ff7a00]" />
            <div className="mt-5 text-center text-lg font-semibold">Opening secure checkout</div>
            <div className="mt-2 text-center text-sm text-white/70">
              We’re preparing your Gene payment popup without taking you away from the site.
            </div>
          </div>
        </div>
      ) : null}

      {error ? <p className="mt-3 text-xs text-red-200">{error}</p> : null}
    </>
  );
}
