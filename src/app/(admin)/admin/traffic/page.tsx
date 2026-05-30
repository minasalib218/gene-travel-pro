"use client";

import { useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { AdminTable } from "@/components/admin/AdminTable";

export default function AdminTrafficPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/admin/traffic", { cache: "no-store" })
      .then((response) => response.json())
      .then(setData);
  }, []);

  const totals = data?.totals ?? {
    pageViews: 0,
    pricingClicks: 0,
    checkoutClicks: 0,
    plannerStarts: 0,
    plannerCompletions: 0,
    bookingClicks: 0,
    revenue: 0,
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Traffic"
        title="Traffic, conversions, and source performance"
        description="Track homepage interest, pricing engagement, planner starts, booking clicks, and country/source performance."
      />

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-7">
        <AdminStatCard label="Page views" value={totals.pageViews} />
        <AdminStatCard label="Pricing clicks" value={totals.pricingClicks} />
        <AdminStatCard label="Checkout clicks" value={totals.checkoutClicks} />
        <AdminStatCard label="Planner starts" value={totals.plannerStarts} />
        <AdminStatCard label="Planner complete" value={totals.plannerCompletions} />
        <AdminStatCard label="Booking clicks" value={totals.bookingClicks} />
        <AdminStatCard label="Revenue" value={`$${Number(totals.revenue || 0).toFixed(0)}`} />
      </div>

      <AdminTable
        headers={["Source", "Visits"]}
        rows={(data?.bySource ?? []).map((row: any) => [
          <div key={`${row.source}-source`} className="text-sm text-white/75">{row.source}</div>,
          <div key={`${row.source}-count`} className="text-sm text-white/75">{row.count}</div>,
        ])}
      />

      <AdminTable
        headers={["Country", "Visits"]}
        rows={(data?.byCountry ?? []).map((row: any) => [
          <div key={`${row.country}-country`} className="text-sm text-white/75">{row.country}</div>,
          <div key={`${row.country}-count`} className="text-sm text-white/75">{row.count}</div>,
        ])}
      />
    </div>
  );
}
