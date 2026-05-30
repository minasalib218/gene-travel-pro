"use client";

import { useEffect } from "react";
import { PaymentStatusCard } from "@/components/payment/PaymentStatusCard";
import { trackPaymentEvent } from "@/lib/payment/analytics";

export default function PaymentFailurePage() {
  useEffect(() => {
    trackPaymentEvent("payment_failure_page_view");
  }, []);

  return (
    <main className="min-h-screen bg-[#050505] px-6 py-14 text-white">
      <div className="mx-auto max-w-4xl">
        <PaymentStatusCard
          title="Payment was not completed"
          description="Common reasons include card declined, insufficient balance, bank verification checks, or the payment window being closed before completion."
          status="failed"
          primaryAction={{ label: "Try Payment Again", href: "/pricing" }}
          secondaryAction={{ label: "Choose Another Package", href: "/pricing" }}
        />

        <div className="mt-6 rounded-[24px] border border-white/10 bg-white/5 p-5 text-sm leading-7 text-white/72 backdrop-blur-xl">
          Need help? You can contact support at{" "}
          <a href="mailto:support@gene.com" className="text-[#ff7a00] hover:text-[#ff9a3d]">
            support@gene.com
          </a>
          .
        </div>
      </div>
    </main>
  );
}
