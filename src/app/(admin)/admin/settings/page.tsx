"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    fetch("/api/admin/settings", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setSettings(data.settings));
  }, []);

  const supportSettings = settings?.supportSettings ?? { supportEmail: "", notificationEmail: "", notificationPhone: "" };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Settings"
        title="Operational settings and environment visibility"
        description="Manage support contacts, homepage visibility flags, affiliate tracking defaults, and environment status without exposing secrets."
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminCard>
          <div className="text-sm font-semibold text-white">Support settings</div>
          <form
            className="mt-4 space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              await fetch("/api/admin/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  key: "support-settings",
                  value: {
                    supportEmail: formData.get("supportEmail"),
                    notificationEmail: formData.get("notificationEmail"),
                    notificationPhone: formData.get("notificationPhone"),
                  },
                }),
              });
            }}
          >
            <input name="supportEmail" defaultValue={supportSettings.supportEmail} placeholder="Support email" className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white" />
            <input name="notificationEmail" defaultValue={supportSettings.notificationEmail} placeholder="Admin notification email" className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white" />
            <input name="notificationPhone" defaultValue={supportSettings.notificationPhone} placeholder="Admin notification phone" className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white" />
            <button className="rounded-2xl bg-[#ff7a00] px-5 py-3 text-sm font-semibold text-black">Save support settings</button>
          </form>
        </AdminCard>

        <AdminCard>
          <div className="text-sm font-semibold text-white">Key status</div>
          <div className="mt-4 space-y-3 text-sm text-white/70">
            <div>OpenAI: {settings?.envStatus?.openAi ? "Configured" : "Missing"}</div>
            <div>Supabase: {settings?.envStatus?.supabase ? "Configured" : "Missing"}</div>
            <div>Payment: {settings?.envStatus?.payment ? "Configured" : "Missing"}</div>
            <div>Resend: {settings?.envStatus?.resend ? "Configured" : "Missing"}</div>
            <div>Meta Pixel: {settings?.envStatus?.metaPixel ? "Configured" : "Missing"}</div>
            <div>Google Analytics: {settings?.envStatus?.googleAnalytics ? "Configured" : "Missing"}</div>
          </div>
          <div className="mt-5">
            <Link
              href="/admin/settings/analytics"
              className="inline-flex rounded-2xl border border-[#ff7a00]/30 bg-[#ff7a00]/10 px-4 py-3 text-sm font-medium text-[#ffbf82] transition hover:bg-[#ff7a00]/14"
            >
              Open analytics settings
            </Link>
          </div>
        </AdminCard>
      </div>
    </div>
  );
}
