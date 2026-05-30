"use client";

import { useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminMutationButton } from "@/components/admin/AdminMutationButton";

export default function AdminApiHealthPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const response = await fetch("/api/admin/api-health", { cache: "no-store" });
    const data = await response.json();
    setServices(data.services ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="API Health"
        title="Provider status, configuration, and last checks"
        description="Monitor core provider integrations and run lightweight test checks without spending customer credits."
      />

      {loading ? <AdminCard><div className="text-sm text-white/60">Loading provider health…</div></AdminCard> : null}

      <div className="grid gap-4 xl:grid-cols-2">
        {services.map((service) => (
          <AdminCard key={service.serviceName}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xl font-semibold text-white">{service.serviceName}</div>
                <div className="mt-2 text-sm text-white/60">
                  {service.errorMessage || "Healthy enough for admin monitoring."}
                </div>
                <div className="mt-3 text-sm text-white/70">
                  Last checked: {service.checkedAt ? new Date(service.checkedAt).toLocaleString() : "Not checked yet"}
                </div>
                <div className="mt-1 text-sm text-white/70">Response: {service.responseTime ?? "—"} ms</div>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs ${service.status === "OK" ? "bg-emerald-500/20 text-emerald-100" : service.status === "NOT_CONFIGURED" ? "bg-white/10 text-white/70" : "bg-red-500/20 text-red-100"}`}>
                {service.status}
              </span>
            </div>
            <div className="mt-4">
              <AdminMutationButton
                endpoint="/api/admin/api-health/check"
                payload={{ serviceName: service.serviceName }}
                label="Test API"
                className="rounded-full border border-[#ffb066]/30 bg-[#ff7a00]/10 px-4 py-2 text-sm text-[#ffbf82]"
              />
            </div>
          </AdminCard>
        ))}
      </div>
    </div>
  );
}
