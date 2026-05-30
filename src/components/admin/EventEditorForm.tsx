"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { EventLiveRecord } from "@/lib/content/events-live";
import AdminImageUploadField from "./AdminImageUploadField";

export default function EventEditorForm({
  initial,
  mode,
}: {
  initial: EventLiveRecord;
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const [draft, setDraft] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function save(status?: EventLiveRecord["status"]) {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(mode === "create" ? "/api/admin/events" : `/api/admin/events/${draft.id}`, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, status: status ?? draft.status }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.ok) throw new Error(data?.code || "SAVE_FAILED");
      if (mode === "create") {
        router.push(`/admin/events/${data.id}/edit`);
        return;
      }
      setDraft(data.event);
      setMessage("Event saved.");
      router.refresh();
    } catch (error: any) {
      setMessage(error?.message || "SAVE_FAILED");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (mode === "create") {
      router.push("/admin/events");
      return;
    }
    if (!window.confirm("Remove this event?")) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/events/${draft.id}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.ok) throw new Error(data?.code || "DELETE_FAILED");
      router.push("/admin/events");
      router.refresh();
    } catch (error: any) {
      setMessage(error?.message || "DELETE_FAILED");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.28em] text-[#ffb066]">Event Editor</div>
            <h1 className="mt-3 text-3xl font-semibold">{draft.title || "Untitled event"}</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => save("draft")} disabled={saving} className="rounded-2xl border border-white/12 bg-white/[0.06] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.12] disabled:opacity-60">Save Draft</button>
            <button onClick={() => save("published")} disabled={saving} className="rounded-2xl bg-[#ff7a00] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#ff9330] disabled:opacity-60">Publish</button>
            <button onClick={remove} disabled={saving} className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-100 transition hover:bg-red-500/20 disabled:opacity-60">Remove</button>
          </div>
        </div>
        {message ? <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white/75">{message}</div> : null}
        <section className="rounded-[34px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Title"><input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="input" /></Field>
            <Field label="Slug"><input value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} className="input" /></Field>
            <Field label="Category"><input value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} className="input" /></Field>
            <Field label="Location"><input value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} className="input" /></Field>
            <Field label="Country"><input value={draft.country} onChange={(e) => setDraft({ ...draft, country: e.target.value })} className="input" /></Field>
            <Field label="Date Range"><input value={draft.dateRange} onChange={(e) => setDraft({ ...draft, dateRange: e.target.value })} className="input" /></Field>
            <AdminImageUploadField label="Card Image" bucket="events" value={draft.imageUrl} onChange={(value) => setDraft({ ...draft, imageUrl: value })} />
            <AdminImageUploadField label="Icon Image" bucket="events" value={draft.iconUrl} onChange={(value) => setDraft({ ...draft, iconUrl: value })} />
            <Field label="Affiliate Link"><input value={draft.affiliateLink} onChange={(e) => setDraft({ ...draft, affiliateLink: e.target.value })} className="input" /></Field>
            <Field label="Status">
              <select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as EventLiveRecord["status"] })} className="input">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="removed">Removed</option>
              </select>
            </Field>
          </div>
          <div className="mt-4">
            <label className="flex items-center gap-3 text-sm text-white/78"><input type="checkbox" checked={draft.showOnHome} onChange={(e) => setDraft({ ...draft, showOnHome: e.target.checked })} /> Show on homepage</label>
          </div>
          <div className="mt-4">
            <Field label="Description"><textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className="input min-h-[140px]" /></Field>
          </div>
        </section>
        <style jsx global>{`.input { width:100%; border-radius:1rem; border:1px solid rgba(255,255,255,0.1); background:rgba(0,0,0,0.3); padding:0.85rem 1rem; color:white; }`}</style>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><div className="mb-2 text-[11px] uppercase tracking-[0.22em] text-white/44">{label}</div>{children}</label>;
}
