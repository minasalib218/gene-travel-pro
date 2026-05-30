"use client";

import { useEffect } from "react";
import { PaymentStatusCard } from "@/components/payment/PaymentStatusCard";
import { trackPaymentEvent } from "@/lib/payment/analytics";

export default function PaymentCancelledPage() {
  useEffect(() => {
    trackPaymentEvent("payment_cancelled_page_view");
  }, []);

  return (
    <main className="min-h-screen bg-[#050505] px-6 py-14 text-white">
      <div className="mx-auto max-w-4xl">
        <PaymentStatusCard
          title="Payment Cancelled"
          description="No money was charged."
          status="cancelled"
          primaryAction={{ label: "Return to Pricing", href: "/pricing" }}
          secondaryAction={{ label: "Go to Profile", href: "/profile" }}
        />
      </div>
    </main>
  );
}
