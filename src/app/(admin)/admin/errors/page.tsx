"use client";

import { useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminTable } from "@/components/admin/AdminTable";
import { AdminMutationButton } from "@/components/admin/AdminMutationButton";

export default function AdminErrorsPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/admin/errors", { cache: "no-store" })
      .then((response) => response.json())
      .then(setData);
  }, []);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Errors & Logs"
        title="Operational issues across AI, API, payments, and email"
        description="See the latest failures, review their scope, and mark resolved issues without exposing secrets."
      />

      <AdminTable
        headers={["Source", "Message", "Status", "Created", "Action"]}
        rows={(data?.errors ?? []).map((errorLog: any) => [
          <div key={`${errorLog.id}-source`} className="text-sm text-white/75">{errorLog.source}</div>,
          <div key={`${errorLog.id}-message`} className="max-w-md text-sm text-white/75">{errorLog.message}</div>,
          <div key={`${errorLog.id}-status`} className="text-sm text-white/75">{errorLog.status}</div>,
          <div key={`${errorLog.id}-created`} className="text-sm text-white/75">{new Date(errorLog.createdAt).toLocaleString()}</div>,
          <AdminMutationButton
            key={`${errorLog.id}-action`}
            endpoint="/api/admin/errors/resolve"
            payload={{ id: errorLog.id }}
            label="Resolve"
            className="rounded-full border border-[#ffb066]/30 bg-[#ff7a00]/10 px-3 py-1 text-xs text-[#ffbf82]"
          />,
        ])}
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <AdminCard>
          <div className="text-sm font-semibold text-white">Webhook errors</div>
          <div className="mt-4 space-y-3">
            {(data?.webhookErrors ?? []).slice(0, 6).map((event: any) => (
              <div key={event.id} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
                {event.provider} · {event.eventType}
              </div>
            ))}
          </div>
        </AdminCard>
        <AdminCard>
          <div className="text-sm font-semibold text-white">Failed emails</div>
          <div className="mt-4 space-y-3">
            {(data?.failedEmails ?? []).slice(0, 6).map((log: any) => (
              <div key={log.id} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
                {log.type} · {log.customerEmail || "Unknown"}
              </div>
            ))}
          </div>
        </AdminCard>
        <AdminCard>
          <div className="text-sm font-semibold text-white">AI failures</div>
          <div className="mt-4 space-y-3">
            {(data?.aiFailures ?? []).slice(0, 6).map((log: any) => (
              <div key={log.id} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
                {log.actionType} · {log.errorMessage || log.status}
              </div>
            ))}
          </div>
        </AdminCard>
      </div>
    </div>
  );
}
