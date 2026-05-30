"use client";

import { useEffect, useState } from "react";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

type AnalyticsSettings = {
  metaPixelId: string;
  gaMeasurementId: string;
  enableMetaPixel: boolean;
  enableGoogleAnalytics: boolean;
  enableInternalAnalytics: boolean;
};

const defaultSettings: AnalyticsSettings = {
  metaPixelId: "",
  gaMeasurementId: "",
  enableMetaPixel: true,
  enableGoogleAnalytics: true,
  enableInternalAnalytics: true,
};

export default function AdminAnalyticsSettingsPage() {
  const [settings, setSettings] = useState<AnalyticsSettings>(defaultSettings);
  const [envStatus, setEnvStatus] = useState<any>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        setSettings({ ...defaultSettings, ...(data?.settings?.analyticsSettings || {}) });
        setEnvStatus(data?.settings?.envStatus || null);
      })
      .catch(() => null);
  }, []);

  async function saveSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    const response = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: "analytics-settings",
        value: settings,
      }),
    });
    setNotice(response.ok ? "Analytics settings saved." : "Could not save analytics settings.");
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Settings"
        title="Analytics, Meta Pixel, and Google Analytics"
        description="Control public analytics IDs, toggle internal analytics, and keep the app safe when vendor IDs are missing."
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <AdminCard>
          <div className="text-sm font-semibold text-white">Tracking configuration</div>
          <form className="mt-4 space-y-4" onSubmit={saveSettings}>
            <label className="block space-y-2">
              <span className="text-xs uppercase tracking-[0.18em] text-white/45">Meta Pixel ID</span>
              <input
                value={settings.metaPixelId}
                onChange={(event) => setSettings((current) => ({ ...current, metaPixelId: event.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white"
                placeholder="123456789012345"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-xs uppercase tracking-[0.18em] text-white/45">Google Analytics Measurement ID</span>
              <input
                value={settings.gaMeasurementId}
                onChange={(event) => setSettings((current) => ({ ...current, gaMeasurementId: event.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white"
                placeholder="G-XXXXXXXXXX"
              />
            </label>

            {[
              ["enableMetaPixel", "Enable Meta Pixel"],
              ["enableGoogleAnalytics", "Enable Google Analytics"],
              ["enableInternalAnalytics", "Enable internal analytics"],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <span className="text-sm text-white/76">{label}</span>
                <input
                  type="checkbox"
                  checked={Boolean(settings[key as keyof AnalyticsSettings])}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      [key]: event.target.checked,
                    }))
                  }
                  className="h-5 w-5 accent-[#ff7a00]"
                />
              </label>
            ))}

            <button className="rounded-2xl bg-[#ff7a00] px-5 py-3 text-sm font-semibold text-black">
              Save analytics settings
            </button>
            {notice ? <div className="text-sm text-[#ffbf82]">{notice}</div> : null}
          </form>
        </AdminCard>

        <AdminCard>
          <div className="text-sm font-semibold text-white">Environment status</div>
          <div className="mt-4 space-y-3 text-sm text-white/70">
            <div>Meta Pixel env: {envStatus?.metaPixel ? "Configured" : "Missing"}</div>
            <div>Google Analytics env: {envStatus?.googleAnalytics ? "Configured" : "Missing"}</div>
            <div>Internal analytics DB: Ready when analytics tables are migrated</div>
          </div>
          <div className="mt-5 rounded-2xl border border-white/10 bg-black/18 px-4 py-4 text-sm leading-7 text-white/58">
            Public IDs like the Meta Pixel ID and GA measurement ID are safe for the client. Secret tokens stay server-side and are not shown here.
          </div>
        </AdminCard>
      </div>
    </div>
  );
}
