"use client";

import { useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminTable } from "@/components/admin/AdminTable";

export default function AdminAffiliateLinksPage() {
  const [links, setLinks] = useState<any[]>([]);
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
    const response = await fetch("/api/admin/affiliate-links", { cache: "no-store" });
    const data = await response.json();
    setLinks(data.links ?? []);
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
    </div>
  );
}
