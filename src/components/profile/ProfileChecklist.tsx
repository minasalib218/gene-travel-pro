"use client";

import { Check, ListChecks, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

type ChecklistItem = { id: string; label: string; group: string; done: boolean; custom?: boolean };
const starterItems: ChecklistItem[] = [
  { id: "passport", label: "Passport", group: "Documents", done: false },
  { id: "travel-documents", label: "Travel documents", group: "Documents", done: false },
  { id: "charger", label: "Phone charger", group: "Electronics", done: false },
  { id: "medicine", label: "Medication and essentials", group: "Health & Personal", done: false },
  { id: "jacket", label: "Weather-ready jacket", group: "Clothing", done: false },
  { id: "swimwear", label: "Swimwear", group: "Clothing", done: false },
];

export default function ProfileChecklist({ preference }: { preference?: any }) {
  const existing = Array.isArray(preference?.metadata?.checklist) ? preference.metadata.checklist : starterItems;
  const [items, setItems] = useState<ChecklistItem[]>(existing);
  const [label, setLabel] = useState("");
  const [group, setGroup] = useState("Travel Essentials");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const groups = useMemo(() => [...new Set(items.map((item) => item.group))], [items]);
  const packed = items.filter((item) => item.done).length;
  const progress = items.length ? Math.round((packed / items.length) * 100) : 0;

  async function save(next: ChecklistItem[]) {
    setItems(next);
    setSaving(true);
    setStatus("");
    const body = {
      travelStyles: preference?.travelStyles || [], preferredRegions: preference?.preferredRegions || [],
      mealPreferences: preference?.mealPreferences || [], preferredBudgetMin: preference?.preferredBudgetMin ?? null,
      preferredBudgetMax: preference?.preferredBudgetMax ?? null, preferredCurrency: preference?.preferredCurrency ?? null,
      hotelPreference: preference?.hotelPreference ?? null, preferredTransportation: preference?.preferredTransportation ?? null,
      activityIntensity: preference?.activityIntensity ?? null, typicalTripDuration: preference?.typicalTripDuration ?? null,
      accessibilityRequirements: preference?.accessibilityRequirements ?? null,
      metadata: { ...(preference?.metadata || {}), checklist: next },
    };
    try {
      const response = await fetch("/api/profile/preferences", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      if (!response.ok) throw new Error();
      setStatus("Saved to your profile");
    } catch {
      setItems(items);
      setStatus("Could not save. Please try again.");
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-white/10 bg-[#101c27]/82 p-5 shadow-2xl backdrop-blur-xl sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><p className="text-sm text-white/58">Packing progress</p><p className="mt-1 text-2xl font-black">{packed} / {items.length} packed</p></div>
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[conic-gradient(#ff7a00_var(--progress),rgba(255,255,255,.1)_0)] p-2" style={{ "--progress": `${progress}%` } as React.CSSProperties}><span className="flex h-full w-full items-center justify-center rounded-full bg-[#101c27] text-lg font-bold">{progress}%</span></div>
        </div>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#ff7a00] transition-all" style={{ width: `${progress}%` }} /></div>
      </section>
      <form onSubmit={(event) => { event.preventDefault(); const value = label.trim(); if (!value) return; void save([...items, { id: crypto.randomUUID(), label: value, group, done: false, custom: true }]); setLabel(""); }} className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:grid-cols-[1fr,190px,auto]">
        <input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Add a checklist item" className="min-h-11 rounded-xl border border-white/10 bg-black/25 px-4 text-sm outline-none focus:border-[#ff7a00]/60" />
        <select value={group} onChange={(event) => setGroup(event.target.value)} className="min-h-11 rounded-xl border border-white/10 bg-[#0c1721] px-3 text-sm outline-none"><option>Travel Essentials</option><option>Documents</option><option>Clothing</option><option>Electronics</option><option>Health & Personal</option></select>
        <button disabled={saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#ff7a00] px-5 text-sm font-bold"><Plus className="h-4 w-4" /> Add item</button>
      </form>
      {status ? <p aria-live="polite" className="text-sm text-white/60">{status}</p> : null}
      <div className="grid gap-4 md:grid-cols-2">
        {groups.map((name) => <section key={name} className="rounded-2xl border border-white/10 bg-[#101c27]/76 p-5 backdrop-blur-xl"><h2 className="mb-4 flex items-center gap-2 text-lg font-bold"><ListChecks className="h-5 w-5 text-[#ff7a00]" />{name}</h2><div className="space-y-2">{items.filter((item) => item.group === name).map((item) => <div key={item.id} className="flex min-h-12 items-center gap-3 rounded-xl border border-white/8 bg-black/18 px-3"><button aria-label={`${item.done ? "Unpack" : "Pack"} ${item.label}`} onClick={() => void save(items.map((entry) => entry.id === item.id ? { ...entry, done: !entry.done } : entry))} className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${item.done ? "border-[#ff7a00] bg-[#ff7a00] text-white" : "border-white/22 text-transparent"}`}><Check className="h-4 w-4" /></button><span className={`min-w-0 flex-1 text-sm ${item.done ? "text-white/42 line-through" : "text-white/88"}`}>{item.label}</span>{item.custom ? <button aria-label={`Delete ${item.label}`} onClick={() => void save(items.filter((entry) => entry.id !== item.id))} className="flex h-9 w-9 items-center justify-center rounded-lg text-white/45 hover:bg-red-500/10 hover:text-red-300"><Trash2 className="h-4 w-4" /></button> : null}</div>)}</div></section>)}
      </div>
    </div>
  );
}
