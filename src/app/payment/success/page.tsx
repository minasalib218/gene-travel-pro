"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PaymentStatusCard } from "@/components/payment/PaymentStatusCard";
import { trackPaymentEvent } from "@/lib/payment/analytics";
import { trackPurchaseSuccess } from "@/lib/analytics";

type StatusResponse = {
  status: "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "UNKNOWN";
  passStatus: "ACTIVE" | "EXPIRED" | "REFUNDED" | "NONE";
  planType: string | null;
  totalCredits: number | null;
  usedCredits: number | null;
  expiresAt: string | null;
  paymentId?: string | null;
  amount?: number | null;
  currency?: string | null;
  provider?: string | null;
  providerOrderId?: string | null;
};

function PaymentSuccessPageContent() {
  const search = useSearchParams();
  const router = useRouter();
  const [result, setResult] = useState<StatusResponse | null>(null);
  const [mode, setMode] = useState<"checking" | "active" | "pending" | "failed" | "unknown">("checking");
  const startedAt = useRef<number>(Date.now());
  const purchaseTracked = useRef(false);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    const paymentId = search.get("paymentId");
    const providerOrderId = search.get("order_id");
    const providerCheckoutId = search.get("checkout_id");

    if (paymentId) params.set("paymentId", paymentId);
    if (providerOrderId) params.set("providerOrderId", providerOrderId);
    if (providerCheckoutId) params.set("providerCheckoutId", providerCheckoutId);

    return params.toString();
  }, [search]);

  useEffect(() => {
    trackPaymentEvent("payment_success_page_view");
  }, []);

  useEffect(() => {
    if (mode !== "active" || !result || purchaseTracked.current) return;
    purchaseTracked.current = true;
    trackPurchaseSuccess(result.planType || "Gene Travel", result.amount ?? 0, result.currency || "USD", {
      paymentId: result.paymentId || undefined,
      orderId: result.providerOrderId || undefined,
      transactionId: result.paymentId || result.providerOrderId || undefined,
      provider: result.provider || undefined,
      planType: result.planType || undefined,
      source: "payment_success_page",
    });
  }, [mode, result]);

  useEffect(() => {
    let active = true;
    let timeout: ReturnType<typeof setTimeout> | null = null;

    async function checkStatus() {
      try {
        const res = await fetch(`/api/payment/status?${query}`, {
          cache: "no-store",
        });
        const data = (await res.json()) as StatusResponse;
        if (!active) return;

        setResult(data);

        if (data.passStatus === "ACTIVE") {
          setMode("active");
          trackPaymentEvent("payment_activation_complete", { planType: data.planType });
          return;
        }

        if (data.status === "FAILED" || data.status === "REFUNDED") {
          setMode("failed");
          return;
        }

        if (data.status === "UNKNOWN") {
          setMode("unknown");
          return;
        }

        const elapsed = Date.now() - startedAt.current;
        if (elapsed >= 30000) {
          setMode("pending");
          trackPaymentEvent("payment_activation_pending", { elapsed });
          return;
        }

        setMode("checking");
        timeout = setTimeout(checkStatus, 3000);
      } catch {
        if (!active) return;
        setMode("unknown");
      }
    }

    if (!query) {
      setMode("unknown");
      return;
    }

    checkStatus();

    return () => {
      active = false;
      if (timeout) clearTimeout(timeout);
    };
  }, [query]);

  useEffect(() => {
    if (mode === "failed") {
      const timer = setTimeout(() => router.replace(`/payment/failure?${query}`), 1200);
      return () => clearTimeout(timer);
    }
  }, [mode, query, router]);

  const title =
    mode === "active"
      ? "Payment Successful"
      : mode === "pending" || mode === "checking"
        ? "Activating your Gene pass..."
        : mode === "failed"
          ? "Payment could not be confirmed"
          : "We could not verify this payment yet";

  const description =
    mode === "active"
      ? "Your payment was received and your Gene pass is active. You can start building your AI trip right away."
      : mode === "pending" || mode === "checking"
        ? "Payment successful. We are activating your Gene pass now. This usually finishes in a few seconds."
        : mode === "failed"
          ? "This payment did not complete successfully. We’ll take you to the payment failure page now."
          : "Payment may have completed, but we could not safely verify it from this session. Please open your profile or contact support if the pass does not appear.";

  return (
    <main className="min-h-screen bg-[#050505] px-6 py-14 text-white">
      <div className="mx-auto max-w-4xl">
        <PaymentStatusCard
          title={title}
          description={description}
          status={mode}
          planType={result?.planType}
          totalCredits={result?.totalCredits}
          usedCredits={result?.usedCredits}
          expiresAt={result?.expiresAt}
          primaryAction={
            mode === "active"
              ? { label: "Start My AI Plan", href: "/ai-planner" }
              : mode === "pending"
                ? { label: "Go to Profile", href: "/profile" }
                : undefined
          }
          secondaryAction={{ label: "Go to Profile", href: "/profile" }}
        />

        {(mode === "pending" || mode === "unknown") && (
          <div className="mt-6 rounded-[24px] border border-white/10 bg-white/5 p-5 text-sm leading-7 text-white/72 backdrop-blur-xl">
            Payment received, but activation is taking longer than expected. Please refresh, check your profile, or contact support if the pass is still not active.
            <div className="mt-4">
              <Link href="mailto:support@gene.com" className="text-[#ff7a00] hover:text-[#ff9a3d]">
                Contact support
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#050505] px-6 py-14 text-white" />}>
      <PaymentSuccessPageContent />
    </Suspense>
  );
}
