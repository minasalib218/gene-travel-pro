"use client";

import { useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminTable } from "@/components/admin/AdminTable";

export default function AdminAffiliateLinksPage() {
  const [links, setLinks] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [form, setForm] = useState({
    provider: "",
    category: "hotel",
    destination: "",
    country: "",
    city: "",
    label: "",
    url: "",
    trackingId: "",
    status: "ACTIVE",
    notes: "",
  });

  async function load() {
    const [linksResponse, bookingsResponse] = await Promise.all([
      fetch("/api/admin/affiliate-links", { cache: "no-store" }),
      fetch("/api/admin/affiliate-bookings", { cache: "no-store" }),
    ]);
    const [linksData, bookingsData] = await Promise.all([
      linksResponse.json().catch(() => ({})),
      bookingsResponse.json().catch(() => ({})),
    ]);
    setLinks(linksData.links ?? []);
    setBookings(bookingsData.bookings ?? []);
  }

  async function syncBookings() {
    setSyncing(true);
    setSyncNotice(null);
    const response = await fetch("/api/admin/affiliate-bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ days: 45 }),
    });
    const result = await response.json().catch(() => null);
    setSyncing(false);
    if (!response.ok || !result?.ok) {
      setSyncNotice(`Provider sync could not complete (${result?.code || "unknown error"}).`);
      return;
    }
    setSyncNotice(`Provider sync complete: ${result.updated} booking record${result.updated === 1 ? "" : "s"} updated.`);
    await load();
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Affiliate Links"
        title="Trackable links and internal redirects"
        description="Manage affiliate destinations, keep links behind Gene redirects, and review click performance without exposing raw URLs on customer pages."
      />

      <AdminCard>
        <form
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
          onSubmit={async (event) => {
            event.preventDefault();
            const response = await fetch("/api/admin/affiliate-links", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(form),
            });
            if (response.ok) {
              setForm({
                provider: "",
                category: "hotel",
                destination: "",
                country: "",
                city: "",
                label: "",
                url: "",
                trackingId: "",
                status: "ACTIVE",
                notes: "",
              });
              await load();
            }
          }}
        >
          {[
            ["provider", "Provider"],
            ["destination", "Destination"],
            ["country", "Country"],
            ["city", "City"],
            ["label", "Label"],
            ["url", "Affiliate URL"],
            ["trackingId", "Tracking ID"],
            ["notes", "Notes"],
          ].map(([key, label]) => (
            <input
              key={key}
              value={(form as any)[key]}
              onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
              placeholder={label}
              className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white"
            />
          ))}
          <select
            value={form.category}
            onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
            className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white"
          >
            {["hotel", "flight", "activity", "event", "transport", "car rental", "insurance"].map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <button className="rounded-2xl bg-[#ff7a00] px-5 py-3 text-sm font-semibold text-black">
            Add affiliate link
          </button>
        </form>
      </AdminCard>

      <AdminTable
        headers={["Provider", "Type", "Destination", "Redirect", "Tracking", "Clicks", "Status"]}
        rows={links.map((link) => [
          <div key={`${link.id}-provider`} className="text-sm text-white/75">{link.provider}</div>,
          <div key={`${link.id}-type`} className="text-sm text-white/75">{link.category}</div>,
          <div key={`${link.id}-destination`} className="text-sm text-white/75">{link.destination || link.country || "—"}</div>,
          <a key={`${link.id}-redirect`} href={link.internalRedirectUrl} className="text-xs text-[#ffbf82]" target="_blank" rel="noreferrer">
            {link.internalRedirectUrl}
          </a>,
          <div key={`${link.id}-tracking`} className="text-sm text-white/75">{link.trackingId || "—"}</div>,
          <div key={`${link.id}-clicks`} className="text-sm text-white/75">{link.clickCount}</div>,
          <div key={`${link.id}-status`} className="text-sm text-white/75">{link.status}</div>,
        ])}
      />

      <AdminCard>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Provider booking reconciliation</h2>
            <p className="mt-1 text-sm text-white/55">Only provider-confirmed conversions count as confirmed bookings. Customer reports remain clearly marked.</p>
          </div>
          <button onClick={syncBookings} disabled={syncing} className="rounded-2xl bg-[#ff7a00] px-5 py-3 text-sm font-semibold text-black disabled:opacity-50">
            {syncing ? "Checking provider..." : "Sync Travelpayouts"}
          </button>
        </div>
        {syncNotice ? <p className="mt-4 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/70">{syncNotice}</p> : null}
      </AdminCard>

      <AdminTable
        headers={["Trip", "Item", "Provider", "Status", "Value", "Commission", "Last checked"]}
        rows={bookings.map((booking) => [
          <div key={`${booking.id}-plan`} className="text-sm text-white/75">{booking.planTitle || "Travel plan"}</div>,
          <div key={`${booking.id}-item`} className="text-sm text-white/75">{booking.itemTitle || "Travel item"}</div>,
          <div key={`${booking.id}-provider`} className="text-sm text-white/75">{booking.provider || "—"}</div>,
          <div key={`${booking.id}-status`} className="text-xs font-semibold text-[#ffbf82]">{booking.status}</div>,
          <div key={`${booking.id}-value`} className="text-sm text-white/75">{booking.bookingValue == null ? "—" : `${booking.currency || "USD"} ${Number(booking.bookingValue).toLocaleString()}`}</div>,
          <div key={`${booking.id}-commission`} className="text-sm text-white/75">{booking.commission == null ? "—" : `$${Number(booking.commission).toLocaleString()}`}</div>,
          <div key={`${booking.id}-sync`} className="text-xs text-white/55">{booking.lastSyncedAt ? new Date(booking.lastSyncedAt).toLocaleString() : "Not checked"}</div>,
        ])}
      />
    </div>
  );
}
