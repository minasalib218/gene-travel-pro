"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { AdminTable } from "@/components/admin/AdminTable";
import { AdminCard } from "@/components/admin/AdminCard";

type PaymentRow = {
  id: string;
  provider: string;
  amount: number | null;
  currency: string | null;
  status: string;
  providerOrderId: string | null;
  providerPaymentId: string | null;
  providerCheckoutId: string | null;
  planType: string;
  customerEmail: string | null;
  createdAt: string;
  pass?: { id: string; status: string } | null;
};

export default function AdminPaymentsPage() {
  const [status, setStatus] = useState("");
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [webhookEvents, setWebhookEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load(nextStatus = "") {
    setLoading(true);
    const response = await fetch(`/api/admin/payments${nextStatus ? `?status=${encodeURIComponent(nextStatus)}` : ""}`, { cache: "no-store" });
    const data = await response.json();
    setPayments(data.payments ?? []);
    setWebhookEvents(data.webhookEvents ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => ({
    total: payments.length,
    paid: payments.filter((payment) => payment.status === "PAID").length,
    failed: payments.filter((payment) => payment.status === "FAILED").length,
    refunded: payments.filter((payment) => payment.status === "REFUNDED").length,
  }), [payments]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Payments"
        title="Payment history and transaction visibility"
        description="Track provider, amount, package, refund state, and related webhook activity without touching the customer checkout flow."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <AdminStatCard label="Payments" value={stats.total} />
        <AdminStatCard label="Paid" value={stats.paid} />
        <AdminStatCard label="Failed" value={stats.failed} />
        <AdminStatCard label="Refunded" value={stats.refunded} />
      </div>

      <AdminCard>
        <div className="flex flex-wrap items-center gap-3">
          {["", "PENDING", "PAID", "FAILED", "REFUNDED", "DISPUTED"].map((value) => (
            <button
              key={value || "all"}
              onClick={() => {
                setStatus(value);
                load(value);
              }}
              className={`rounded-full border px-4 py-2 text-sm ${status === value ? "border-[#ffb066]/30 bg-[#ff7a00]/10 text-[#ffbf82]" : "border-white/10 bg-white/5 text-white/80"}`}
            >
              {value || "All"}
            </button>
          ))}
        </div>
      </AdminCard>

      {loading ? <AdminCard><div className="text-sm text-white/60">Loading payments…</div></AdminCard> : null}

      {!loading ? (
        <AdminTable
          headers={["Provider", "Amount", "Status", "Transaction", "Package", "User", "Pass", "Created"]}
          rows={payments.map((payment) => [
            <div key={`${payment.id}-provider`} className="text-sm text-white/75">{payment.provider}</div>,
            <div key={`${payment.id}-amount`} className="text-sm text-white/75">
              {payment.amount ?? 0} {payment.currency || "USD"}
            </div>,
            <div key={`${payment.id}-status`}>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">{payment.status}</span>
            </div>,
            <div key={`${payment.id}-transaction`} className="space-y-1 text-xs text-white/60">
              <div>{payment.providerPaymentId || payment.providerOrderId || payment.providerCheckoutId || "—"}</div>
            </div>,
            <div key={`${payment.id}-package`} className="text-sm text-white/75">{payment.planType}</div>,
            <div key={`${payment.id}-user`} className="text-sm text-white/75">{payment.customerEmail || "Unknown"}</div>,
            <div key={`${payment.id}-pass`} className="text-sm text-white/75">{payment.pass?.status || "No pass"}</div>,
            <div key={`${payment.id}-created`} className="text-sm text-white/75">{new Date(payment.createdAt).toLocaleDateString()}</div>,
          ])}
        />
      ) : null}

      <AdminCard>
        <div className="text-sm font-semibold text-white">Related webhook events</div>
        <div className="mt-4 space-y-3">
          {webhookEvents.length === 0 ? (
            <div className="text-sm text-white/60">No related webhook events found for the current filter.</div>
          ) : (
            webhookEvents.slice(0, 12).map((event) => (
              <div key={event.id} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
                <div className="font-semibold text-white">{event.provider} · {event.eventType}</div>
                <div className="mt-1">{event.processed ? "Processed" : "Pending"}{event.errorMessage ? ` · ${event.errorMessage}` : ""}</div>
              </div>
            ))
          )}
        </div>
      </AdminCard>
    </div>
  );
}
