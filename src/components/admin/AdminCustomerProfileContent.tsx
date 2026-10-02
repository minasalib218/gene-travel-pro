"use client";

import { useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Plus, Save, Tag, Trash2 } from "lucide-react";
import type { ChecklistItem } from "@/lib/profile/checklist";

type Offer = { id: string; title: string; location?: string | null };
type CalendarItem = { id: string; type: string; title: string; destination?: string | null };

export default function AdminCustomerProfileContent({
  userId,
  initialChecklist,
  offers,
  calendarItems,
  initialHiddenOfferIds,
  initialPinnedOfferIds,
  initialCalendarDismissed,
}: {
  userId: string;
  initialChecklist: ChecklistItem[];
  offers: Offer[];
  calendarItems: CalendarItem[];
  initialHiddenOfferIds: string[];
  initialPinnedOfferIds: string[];
  initialCalendarDismissed: string[];
}) {
  const [checklist, setChecklist] = useState(initialChecklist);
  const [hiddenOfferIds, setHiddenOfferIds] = useState(initialHiddenOfferIds);
  const [pinnedOfferIds, setPinnedOfferIds] = useState(initialPinnedOfferIds);
  const [calendarDismissed, setCalendarDismissed] = useState(initialCalendarDismissed);
  const [newItem, setNewItem] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const calendarKeys = useMemo(() => new Set(calendarDismissed), [calendarDismissed]);

  function addChecklistItem() {
    const label = newItem.trim();
    if (!label || checklist.some((item) => item.label.toLowerCase() === label.toLowerCase())) return;
    setChecklist((items) => [...items, { id: `admin-${Date.now()}`, label, group: "Travel Essentials", done: false, custom: true }]);
    setNewItem("");
  }

  async function save() {
    setSaving(true);
    setStatus("");
    const response = await fetch(`/api/admin/users/${userId}/profile-content`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ checklist, hiddenOfferIds, pinnedOfferIds, calendarDismissed }),
    });
    setSaving(false);
    setStatus(response.ok ? "Customer profile content saved." : "Could not save these changes.");
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Profile content controls</h2>
          <p className="mt-1 text-sm text-white/50">Changes update this customer only and appear in their Checklist, Special Offers, and Calendar.</p>
        </div>
        <button onClick={save} disabled={saving} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#ff7a00] px-5 text-sm font-bold text-white disabled:opacity-50"><Save className="h-4 w-4" />{saving ? "Saving..." : "Save changes"}</button>
      </div>
      {status ? <div role="status" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">{status}</div> : null}

      <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <h3 className="flex items-center gap-2 font-semibold"><CheckCircle2 className="h-5 w-5 text-[#ff7a00]" />Travel Checklist</h3>
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {checklist.map((item) => <div key={item.id} className="flex min-h-11 items-center gap-3 rounded-xl border border-white/10 bg-white/[.035] px-3"><input aria-label={`Packed ${item.label}`} type="checkbox" checked={item.done} onChange={(event) => setChecklist((items) => items.map((entry) => entry.id === item.id ? { ...entry, done: event.target.checked } : entry))} className="h-4 w-4 accent-[#ff7a00]" /><input aria-label={`Checklist item ${item.label}`} value={item.label} onChange={(event) => setChecklist((items) => items.map((entry) => entry.id === item.id ? { ...entry, label: event.target.value } : entry))} className="min-w-0 flex-1 bg-transparent text-sm outline-none" /><button aria-label={`Remove ${item.label}`} onClick={() => setChecklist((items) => items.filter((entry) => entry.id !== item.id))} className="flex h-10 w-10 items-center justify-center text-white/45 hover:text-red-300"><Trash2 className="h-4 w-4" /></button></div>)}
        </div>
        <div className="mt-3 flex gap-2"><input value={newItem} onChange={(event) => setNewItem(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addChecklistItem(); } }} placeholder="Add checklist item" className="min-h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-black/25 px-4 text-sm outline-none focus:border-[#ff7a00]/60" /><button onClick={addChecklistItem} className="flex min-h-11 items-center gap-2 rounded-xl border border-[#ff7a00]/40 px-4 text-sm font-bold text-[#ffad65]"><Plus className="h-4 w-4" />Add</button></div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <h3 className="flex items-center gap-2 font-semibold"><Tag className="h-5 w-5 text-[#ff7a00]" />Special Offers</h3>
        <p className="mt-1 text-xs text-white/45">Visible offers use the existing published offer. Pinning moves an offer first for this customer.</p>
        <div className="mt-4 grid gap-2 md:grid-cols-2">{offers.map((offer) => { const hidden = hiddenOfferIds.includes(offer.id); const pinned = pinnedOfferIds.includes(offer.id); return <div key={offer.id} className="rounded-xl border border-white/10 bg-white/[.035] p-3"><p className="truncate text-sm font-semibold">{offer.title}</p><p className="mt-1 text-xs text-white/45">{offer.location || "Published offer"}</p><div className="mt-3 flex gap-4 text-xs"><label className="flex items-center gap-2"><input type="checkbox" checked={!hidden} onChange={(event) => setHiddenOfferIds((ids) => event.target.checked ? ids.filter((id) => id !== offer.id) : [...new Set([...ids, offer.id])])} className="accent-[#ff7a00]" />Visible</label><label className="flex items-center gap-2"><input type="checkbox" checked={pinned} disabled={hidden} onChange={(event) => setPinnedOfferIds((ids) => event.target.checked ? [...new Set([...ids, offer.id])] : ids.filter((id) => id !== offer.id))} className="accent-[#ff7a00]" />Pin first</label></div></div>; })}</div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <h3 className="flex items-center gap-2 font-semibold"><CalendarDays className="h-5 w-5 text-[#ff7a00]" />Calendar of the Year</h3>
        <p className="mt-1 text-xs text-white/45">Choose which published discovery items are available to this customer’s calendar.</p>
        <div className="mt-4 grid max-h-[430px] gap-2 overflow-y-auto pr-1 md:grid-cols-2">{calendarItems.map((item) => { const key = `${item.type}:${item.id}`; return <label key={key} className="flex min-h-11 items-center gap-3 rounded-xl border border-white/10 bg-white/[.035] px-3"><input type="checkbox" checked={!calendarKeys.has(key)} onChange={(event) => setCalendarDismissed((keys) => event.target.checked ? keys.filter((entry) => entry !== key) : [...new Set([...keys, key])])} className="accent-[#ff7a00]" /><span className="min-w-0"><span className="block truncate text-sm font-semibold">{item.title}</span><span className="block truncate text-[11px] uppercase tracking-wide text-white/40">{item.type.replace("_", " ")}{item.destination ? ` · ${item.destination}` : ""}</span></span></label>; })}</div>
      </section>
    </div>
  );
}
