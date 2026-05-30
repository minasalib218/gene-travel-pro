"use client";

import { useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { AdminTable } from "@/components/admin/AdminTable";
import { AdminCard } from "@/components/admin/AdminCard";

export default function AdminAiMonitoringPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/ai-monitoring", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => setData(payload))
      .finally(() => setLoading(false));
  }, []);

  const totals = data?.totals ?? {
    totalRequests: 0,
    failedRequests: 0,
    estimatedCost: 0,
    averageInputTokens: 0,
    averageOutputTokens: 0,
    totalTokens: 0,
    blockedRequests: 0,
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="AI Monitoring"
        title="Tokens, credit pressure, and failed generations"
        description="Review AI requests across the platform, spot failures, and inspect the cost profile without touching live customer routes."
      />

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <AdminStatCard label="Requests" value={totals.totalRequests} />
        <AdminStatCard label="Failed" value={totals.failedRequests} />
        <AdminStatCard label="Blocked" value={totals.blockedRequests} />
        <AdminStatCard label="Input avg" value={totals.averageInputTokens} />
        <AdminStatCard label="Output avg" value={totals.averageOutputTokens} />
        <AdminStatCard label="Est. cost" value={`$${Number(totals.estimatedCost || 0).toFixed(2)}`} />
      </div>

      {loading ? <AdminCard><div className="text-sm text-white/60">Loading AI logs…</div></AdminCard> : null}

      {!loading ? (
        <AdminTable
          headers={["User", "Action", "Plan", "Tokens", "Cost", "Status", "Created"]}
          rows={(data?.logs ?? []).map((log: any) => [
            <div key={`${log.id}-user`} className="text-sm text-white/75">
              {log.profile?.fullName || log.profile?.email || log.customerEmail || "Unknown"}
            </div>,
            <div key={`${log.id}-action`} className="text-sm text-white/75">{log.actionType}</div>,
            <div key={`${log.id}-plan`} className="text-sm text-white/75">{log.pass?.planType || log.pass?.tier || "—"}</div>,
            <div key={`${log.id}-tokens`} className="text-sm text-white/75">{log.totalTokens || 0}</div>,
            <div key={`${log.id}-cost`} className="text-sm text-white/75">${Number(log.estimatedCost || 0).toFixed(4)}</div>,
            <div key={`${log.id}-status`} className="text-sm text-white/75">{log.status}</div>,
            <div key={`${log.id}-created`} className="text-sm text-white/75">{new Date(log.createdAt).toLocaleString()}</div>,
          ])}
        />
      ) : null}
    </div>
  );
}
