"use client";

import Image from "next/image";
import Link from "next/link";
import { Backpack, BatteryCharging, Building2, Check, ChevronDown, CircleEllipsis, FileCheck2, HeartPulse, ListPlus, MapPin, Mountain, Palmtree, Plus, Search, Shirt, Snowflake, Sparkles, Trash2, Umbrella, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { starterChecklistItems, type ChecklistItem } from "@/lib/profile/checklist";

type PresetKey = "general" | "beach" | "city" | "winter" | "adventure" | "custom";
type Suggestion = { label: string; reason: string; group: string; icon: any };

const groups = ["Travel Documents", "Clothing", "Toiletries & Health", "Electronics", "Travel Essentials"];
const presets: Array<{ key: PresetKey; label: string; icon: any }> = [
  { key: "general", label: "General Trip", icon: Backpack }, { key: "beach", label: "Beach", icon: Palmtree },
  { key: "city", label: "City Break", icon: Building2 }, { key: "winter", label: "Winter", icon: Snowflake },
  { key: "adventure", label: "Adventure", icon: Mountain }, { key: "custom", label: "Custom", icon: Plus },
];
const suggestionsByPreset: Record<PresetKey, Suggestion[]> = {
  general: [
    { label: "Reusable Water Bottle", reason: "Stay hydrated while exploring", group: "Travel Essentials", icon: Umbrella },
    { label: "Sunglasses", reason: "Comfort for bright travel days", group: "Travel Essentials", icon: Sparkles },
    { label: "Rain Jacket", reason: "Ready for changing weather", group: "Clothing", icon: Shirt },
  ],
  beach: [
    { label: "Sunglasses", reason: "Perfect for sunny destinations", group: "Travel Essentials", icon: Sparkles },
    { label: "Hat / Cap", reason: "Keep cool and protected", group: "Clothing", icon: Palmtree },
    { label: "Reusable Water Bottle", reason: "Stay hydrated", group: "Travel Essentials", icon: Umbrella },
    { label: "Snorkeling Gear", reason: "Useful for beach adventures", group: "Travel Essentials", icon: Palmtree },
  ],
  city: [
    { label: "Comfortable Walking Shoes", reason: "Made for long city days", group: "Clothing", icon: Building2 },
    { label: "Portable Charger", reason: "Keep maps and tickets available", group: "Electronics", icon: BatteryCharging },
    { label: "Day Bag", reason: "Carry essentials comfortably", group: "Travel Essentials", icon: Backpack },
  ],
  winter: [
    { label: "Thermal Layers", reason: "Stay warm without bulky packing", group: "Clothing", icon: Snowflake },
    { label: "Gloves", reason: "Cold-weather essential", group: "Clothing", icon: Snowflake },
    { label: "Lip Balm", reason: "Protection in dry weather", group: "Toiletries & Health", icon: HeartPulse },
  ],
  adventure: [
    { label: "First Aid Kit", reason: "Prepared for active days", group: "Toiletries & Health", icon: HeartPulse },
    { label: "Headlamp", reason: "Useful beyond daylight", group: "Electronics", icon: Sparkles },
    { label: "Reusable Water Bottle", reason: "Hydration for every trail", group: "Travel Essentials", icon: Mountain },
  ],
  custom: [
    { label: "Travel Organizer", reason: "Keep small essentials together", group: "Travel Essentials", icon: Backpack },
    { label: "Emergency Contacts", reason: "Important details close at hand", group: "Travel Documents", icon: FileCheck2 },
  ],
};

function slug(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }
function normalizeGroup(value: string) {
  if (value === "Documents") return "Travel Documents";
  if (value === "Health & Personal") return "Toiletries & Health";
  return value || "Travel Essentials";
}
function groupIcon(name: string) {
  if (name === "Travel Documents") return FileCheck2;
  if (name === "Clothing") return Shirt;
  if (name === "Toiletries & Health") return HeartPulse;
  if (name === "Electronics") return BatteryCharging;
  return Backpack;
}

export default function ProfileChecklist({ preference, trips = [] }: { preference?: any; trips?: any[] }) {
  const savedItems: ChecklistItem[] = (Array.isArray(preference?.metadata?.checklist) ? preference.metadata.checklist : starterChecklistItems)
    .map((item: ChecklistItem) => ({ ...item, group: normalizeGroup(item.group) }));
  const initialPreset = presets.some((p) => p.key === preference?.metadata?.checklistPreset) ? preference.metadata.checklistPreset as PresetKey : "general";
  const [items, setItems] = useState<ChecklistItem[]>(savedItems);
  const [preset, setPreset] = useState<PresetKey>(initialPreset);
  const [query, setQuery] = useState("");
  const [label, setLabel] = useState("");
  const [group, setGroup] = useState("Travel Essentials");
  const [tripId, setTripId] = useState(String(preference?.metadata?.checklistTripId || ""));
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const undoRef = useRef<ChecklistItem | null>(null);
  const packed = items.filter((item) => item.done).length;
  const progress = items.length ? Math.round((packed / items.length) * 100) : 0;
  const selectedTrip = trips.find((trip) => String(trip.id) === tripId);
  const suggestions = suggestionsByPreset[preset];
  const allGroups = useMemo(() => [...groups, ...items.map((item) => item.group).filter((name) => !groups.includes(name))].filter((name, index, values) => values.indexOf(name) === index), [items]);
  const filteredGroups = useMemo(() => allGroups.map((name) => ({ name, items: items.filter((item) => item.group === name && item.label.toLowerCase().includes(query.trim().toLowerCase())) })).filter((entry) => entry.items.length || !query.trim()), [allGroups, items, query]);

  async function persist(nextItems: ChecklistItem[], nextPreset = preset, nextTripId = tripId) {
    const previous = items;
    setItems(nextItems); setSaving(true); setStatus("");
    const body = {
      travelStyles: preference?.travelStyles || [], preferredRegions: preference?.preferredRegions || [], mealPreferences: preference?.mealPreferences || [],
      preferredBudgetMin: preference?.preferredBudgetMin ?? null, preferredBudgetMax: preference?.preferredBudgetMax ?? null,
      preferredCurrency: preference?.preferredCurrency ?? null, hotelPreference: preference?.hotelPreference ?? null,
      preferredTransportation: preference?.preferredTransportation ?? null, activityIntensity: preference?.activityIntensity ?? null,
      typicalTripDuration: preference?.typicalTripDuration ?? null, accessibilityRequirements: preference?.accessibilityRequirements ?? null,
      metadata: { ...(preference?.metadata || {}), checklist: nextItems, checklistPreset: nextPreset, checklistTripId: nextTripId || null, checklistUpdatedAt: new Date().toISOString() },
    };
    try {
      const response = await fetch("/api/profile/preferences", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      if (!response.ok) throw new Error();
      setStatus("Saved to your profile ✓");
    } catch { setItems(previous); setStatus("Could not save. Your checklist was restored."); }
    finally { setSaving(false); }
  }

  function addItem(value: string, targetGroup = group) {
    const clean = value.trim(); if (!clean) return;
    if (items.some((item) => item.label.toLowerCase() === clean.toLowerCase())) { setStatus("That item is already in your checklist."); return; }
    void persist([...items, { id: `custom-${slug(clean)}-${Date.now()}`, label: clean, group: targetGroup, done: false, custom: true }]);
    setLabel(""); setQuery(""); setAddOpen(false); setStatus("Added to checklist ✓");
  }
  function openAdd(targetGroup = "Travel Essentials", initialLabel = "") { setGroup(targetGroup); setLabel(initialLabel); setAddOpen(true); }
  function removeItem(item: ChecklistItem) { undoRef.current = item; void persist(items.filter((entry) => entry.id !== item.id)); setStatus(`${item.label} removed. Undo is available.`); }
  function undoDelete() { const item = undoRef.current; if (!item) return; undoRef.current = null; void persist([...items, item]); }

  return (
    <div className="relative -mx-3 -mt-5 min-h-[calc(100vh-68px)] overflow-hidden px-3 pb-8 sm:-mx-5 sm:-mt-7 sm:px-5 lg:-mx-8 lg:-mt-8 lg:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[410px] sm:h-[360px]"><Image src="/images/Greece Blue Island Romance/santorini.jpg" alt="" fill priority className="object-cover opacity-85 sm:opacity-70" sizes="100vw" /><div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,17,26,.92)_0%,rgba(7,17,26,.48)_65%,rgba(7,17,26,.18)_100%)] sm:bg-[linear-gradient(90deg,#07111a_0%,rgba(7,17,26,.66)_52%,rgba(7,17,26,.2)_100%)]" /><div className="absolute inset-0 bg-gradient-to-b from-[#07111a]/5 via-[#07111a]/20 to-[#07111a] sm:from-[#07111a]/15" /></div>
      <div className="relative pt-7 lg:pt-9">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <header><p className="text-xs font-bold uppercase tracking-[.18em] text-[#ff7a00]">— Travel ready</p><h1 className="mt-3 text-4xl font-black leading-[1.02] tracking-tight sm:text-4xl xl:text-5xl">Your Travel <span className="block text-[#ff7a00] sm:inline">Checklist</span></h1><p className="mt-2 max-w-sm text-sm leading-6 text-white/78 sm:text-lg">Pack smart. Travel easy. Enjoy every moment.</p></header>
          <div className="w-full max-w-lg space-y-2 lg:w-[390px]"><label id="checklist-search" className="flex min-h-12 scroll-mt-24 items-center gap-3 rounded-full border border-white/15 bg-black/45 px-5 backdrop-blur-xl focus-within:border-[#ff7a00]/70"><Search className="h-5 w-5 text-white/55" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search checklist..." className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-white/42" />{query ? <button aria-label="Clear search" onClick={() => setQuery("")}><X className="h-4 w-4 text-white/55" /></button> : null}</label>{query.trim() && !items.some((item) => item.label.toLowerCase().includes(query.trim().toLowerCase())) ? <button onClick={() => openAdd(group, query)} className="ml-4 min-h-11 text-sm font-semibold text-[#ff9b43]">+ Add “{query.trim()}”</button> : null}</div>
        </div>

        {trips.length ? <div className="mt-5 flex flex-wrap items-center gap-3"><label className="text-sm text-white/55">Checklist for:</label><select value={tripId} onChange={(e) => { setTripId(e.target.value); void persist(items, preset, e.target.value); }} className="min-h-11 rounded-xl border border-white/12 bg-[#0b1721]/90 px-4 text-sm outline-none focus:border-[#ff7a00]/60"><option value="">General checklist</option>{trips.map((trip) => <option key={trip.id} value={trip.id}>{trip.title || trip.destination || "Saved trip"}</option>)}</select>{selectedTrip ? <span className="text-xs text-[#ffb36c]">{selectedTrip.destination || "Trip checklist"}</span> : null}</div> : null}

        <div className="mt-6 flex snap-x gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{presets.map(({ key, label: text, icon: Icon }) => <button key={key} onClick={() => { setPreset(key); void persist(items, key); }} className={`flex min-h-[72px] min-w-[128px] snap-start flex-col items-center justify-center gap-2 rounded-xl border px-4 text-xs font-semibold transition ${preset === key ? "border-[#ff7a00] bg-[#ff7a00]/12 text-white shadow-[0_0_24px_rgba(255,122,0,.18)]" : "border-white/12 bg-[#111c26]/72 text-white/70 hover:border-white/25"}`}><Icon className={`h-5 w-5 ${preset === key ? "text-[#ff7a00]" : ""}`} />{text}</button>)}</div>

        <div className="mt-3 grid gap-5 xl:grid-cols-[minmax(0,1fr)_370px]">
          <div className="min-w-0 space-y-4">
            <section className="rounded-2xl border border-white/12 bg-[#0d1720]/80 p-4 shadow-2xl backdrop-blur-xl sm:p-5"><div className="grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:gap-4"><div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[conic-gradient(#ff7a00_var(--progress),rgba(255,255,255,.1)_0)] p-[6px] transition-all sm:h-20 sm:w-20 sm:p-[7px]" style={{ "--progress": `${progress}%` } as React.CSSProperties}><span className="flex h-full w-full items-center justify-center rounded-full bg-[#0d1720] text-base font-black sm:text-lg">{progress}%</span></div><div className="min-w-0 flex-1"><p className="text-sm font-bold sm:text-base">{packed} of {items.length} items packed</p><p className="mt-1 text-xs text-white/52">{progress === 100 ? "Ready to travel." : progress >= 50 ? "Great progress!" : "A smart start."}</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-[#ff5a00] to-[#ff9b43] transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${progress}%` }} /></div></div><button onClick={() => openAdd()} className="col-start-3 row-start-1 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/18 px-3 text-xs font-bold hover:border-[#ff7a00]/65 sm:px-4 sm:text-sm"><Plus className="h-4 w-4" /><span className="hidden min-[360px]:inline">Add Item</span></button></div></section>

            <form onSubmit={(e) => { e.preventDefault(); addItem(label); }} className="hidden gap-2 rounded-2xl border border-white/10 bg-white/[0.035] p-3 sm:grid sm:grid-cols-[1fr,190px,auto]"><input id="checklist-add-item" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Add a checklist item" className="min-h-11 rounded-xl border border-white/10 bg-black/25 px-4 text-sm outline-none focus:border-[#ff7a00]/60" /><select value={group} onChange={(e) => setGroup(e.target.value)} className="min-h-11 rounded-xl border border-white/10 bg-[#0c1721] px-3 text-sm outline-none">{allGroups.map((name) => <option key={name}>{name}</option>)}</select><button disabled={saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#ff7a00] px-5 text-sm font-bold disabled:opacity-55"><ListPlus className="h-4 w-4" />Add</button></form>
            {status ? <div aria-live="polite" className="flex items-center gap-3 rounded-xl border border-[#ff7a00]/20 bg-[#ff7a00]/8 px-4 py-3 text-sm text-[#ffc18b]"><span className="flex-1">{status}</span>{undoRef.current ? <button onClick={undoDelete} className="font-bold underline">Undo</button> : null}</div> : null}

            {filteredGroups.map(({ name, items: categoryItems }) => { const Icon = groupIcon(name); const total = items.filter((item) => item.group === name).length; const done = items.filter((item) => item.group === name && item.done).length; return <section key={name} className="rounded-2xl border border-white/12 bg-[#0d1720]/82 p-3 shadow-xl backdrop-blur-xl"><button onClick={() => setCollapsed((value) => ({ ...value, [name]: !value[name] }))} className="flex min-h-11 w-full items-center gap-3 px-1 text-left"><Icon className="h-5 w-5 text-white/65" /><span className="min-w-0 flex-1 truncate font-bold">{name}</span><span className="text-sm text-white/50">{done} / {total}</span><ChevronDown className={`h-4 w-4 transition motion-reduce:transition-none ${collapsed[name] ? "-rotate-90" : ""}`} /></button>{!collapsed[name] ? <div className="mt-2 flex snap-x gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-2 md:overflow-visible 2xl:grid-cols-3">{categoryItems.map((item) => <div key={item.id} className={`relative flex min-h-[58px] min-w-[152px] snap-start items-center gap-2 rounded-xl border px-2.5 transition md:min-w-0 md:gap-3 md:px-3 ${item.done ? "border-[#ff7a00]/25 bg-[#ff7a00]/7" : "border-white/10 bg-black/20 hover:border-white/22"}`}>{editing === item.id ? <><input defaultValue={item.label} aria-label={`Rename ${item.label}`} className="min-w-0 flex-1 rounded-lg bg-black/30 px-2 py-2 text-sm outline-none" onKeyDown={(e) => { if (e.key === "Enter") { const next = (e.currentTarget.value || item.label).trim(); void persist(items.map((entry) => entry.id === item.id ? { ...entry, label: next } : entry)); setEditing(null); } }} /><select value={item.group} aria-label={`Move ${item.label}`} onChange={(e) => { void persist(items.map((entry) => entry.id === item.id ? { ...entry, group: e.target.value } : entry)); setEditing(null); }} className="max-w-[110px] rounded-lg bg-[#14212c] px-1 py-2 text-xs">{allGroups.map((groupName) => <option key={groupName}>{groupName}</option>)}</select><button aria-label="Close item editor" onClick={() => setEditing(null)}><X className="h-4 w-4" /></button></> : <><button aria-label={`${item.done ? "Unpack" : "Pack"} ${item.label}`} onClick={() => void persist(items.map((entry) => entry.id === item.id ? { ...entry, done: !entry.done } : entry))} className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition active:scale-90 motion-reduce:transition-none ${item.done ? "border-[#ff7a00] bg-[#ff7a00] text-white" : "border-white/25 text-transparent"}`}><Check className="h-4 w-4" /></button><button onClick={() => void persist(items.map((entry) => entry.id === item.id ? { ...entry, done: !entry.done } : entry))} className={`min-h-11 min-w-0 flex-1 text-left text-xs leading-tight sm:text-sm ${item.done ? "text-white/48 line-through" : "text-white/88"}`}>{item.label}</button><button aria-label={`Edit ${item.label}`} onClick={() => setEditing(item.id)} className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/42 hover:bg-white/6 hover:text-white sm:flex"><CircleEllipsis className="h-4 w-4" /></button>{item.custom ? <button aria-label={`Delete ${item.label}`} onClick={() => removeItem(item)} className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/36 hover:bg-red-500/10 hover:text-red-300 sm:flex"><Trash2 className="h-4 w-4" /></button> : null}</>}</div>)}<button onClick={() => openAdd(name)} className="flex min-h-[58px] min-w-[70px] snap-start flex-col items-center justify-center rounded-xl border border-dashed border-white/25 text-xs font-bold text-white/65 hover:border-[#ff7a00]/60 hover:text-white md:min-w-0"><Plus className="h-5 w-5" />Add</button>{!categoryItems.length && query ? <p className="px-2 py-3 text-sm text-white/42">No matching items here.</p> : null}</div> : null}</section>; })}
          </div>

          <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start"><section className="rounded-2xl border border-white/12 bg-[#0b151e]/86 p-4 shadow-2xl backdrop-blur-xl"><div className="flex items-start gap-3"><Sparkles className="mt-0.5 h-6 w-6 shrink-0 text-[#ff7a00]" /><div className="min-w-0 flex-1"><h2 className="text-lg font-bold">Smart Suggestions</h2><p className="text-xs text-white/50">Based on your destination and trip style</p></div><button onClick={() => { const missing = suggestions.filter((suggestion) => !items.some((item) => item.label.toLowerCase() === suggestion.label.toLowerCase())); void persist([...items, ...missing.map((suggestion) => ({ id: `suggestion-${slug(suggestion.label)}-${Date.now()}`, label: suggestion.label, group: suggestion.group, done: false, custom: true }))]); }} className="min-h-10 shrink-0 rounded-xl border border-white/15 px-3 text-xs font-bold hover:border-[#ff7a00]/55">+ Add All</button></div><div className="mt-4 flex snap-x gap-3 overflow-x-auto pb-1 xl:block xl:space-y-2 xl:overflow-visible">{suggestions.map((suggestion) => { const added = items.some((item) => item.label.toLowerCase() === suggestion.label.toLowerCase()); const Icon = suggestion.icon; return <div key={suggestion.label} className="flex min-w-[270px] snap-start items-center gap-3 rounded-xl border border-white/10 bg-black/22 p-3 xl:min-w-0"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#ff7a00]/12 text-[#ff9b43]"><Icon className="h-5 w-5" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{suggestion.label}</p><p className="mt-0.5 truncate text-xs text-white/48">{suggestion.reason}</p></div><button disabled={added} aria-label={added ? `${suggestion.label} added` : `Add ${suggestion.label}`} onClick={() => addItem(suggestion.label, suggestion.group)} className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ${added ? "bg-emerald-500/18 text-emerald-300" : "bg-[#ff7a00] text-white hover:scale-105"}`}>{added ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}</button></div>; })}</div></section>
            <section className="relative min-h-[300px] overflow-hidden rounded-2xl border border-[#ff7a00]/25"><Image src="/images/Santorini.avif" alt="Santorini sunset" fill className="object-cover" sizes="370px" /><div className="absolute inset-0 bg-gradient-to-t from-black via-black/48 to-transparent" /><div className="absolute inset-x-0 bottom-0 p-6"><MapPin className="h-5 w-5 text-[#ff7a00]" /><h2 className="mt-3 text-2xl font-black">Ready for Your Next <span className="text-[#ff7a00]">Adventure?</span></h2><p className="mt-3 text-sm leading-6 text-white/70">A well-packed bag leads to stress-free trips and unforgettable memories.</p><Link href="/destinations" className="mt-5 inline-flex min-h-11 items-center rounded-full border border-[#ff7a00] px-5 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,122,0,.18)]">Explore Destinations →</Link></div></section></aside>
        </div>
      </div>
      <button aria-label="Add checklist item" onClick={() => openAdd()} className="fixed bottom-[84px] right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#ff7a00] text-white shadow-[0_8px_28px_rgba(255,122,0,.48)] active:scale-95 sm:hidden"><Plus className="h-6 w-6" /></button>
      {addOpen ? <div className="fixed inset-0 z-[80] sm:hidden"><button aria-label="Close add item sheet" className="absolute inset-0 bg-black/72 backdrop-blur-sm" onClick={() => setAddOpen(false)} /><form onSubmit={(e) => { e.preventDefault(); addItem(label); }} className="absolute inset-x-0 bottom-0 rounded-t-[24px] border-t border-white/15 bg-[#0b1620] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[0_-20px_70px_rgba(0,0,0,.6)]"><div className="mx-auto mb-4 h-1 w-12 rounded-full bg-white/20" /><div className="flex items-center justify-between"><h2 className="text-lg font-black">Add checklist item</h2><button type="button" aria-label="Close" onClick={() => setAddOpen(false)} className="flex h-11 w-11 items-center justify-center rounded-full bg-white/6"><X className="h-5 w-5" /></button></div><label className="mt-4 block text-xs font-bold text-white/58">Item name<input autoFocus id="checklist-add-item-mobile" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="What do you need to pack?" className="mt-2 min-h-12 w-full rounded-xl border border-white/12 bg-black/25 px-4 text-sm text-white outline-none focus:border-[#ff7a00]/70" /></label><label className="mt-4 block text-xs font-bold text-white/58">Category<select value={group} onChange={(e) => setGroup(e.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-white/12 bg-[#111f2a] px-4 text-sm text-white outline-none">{allGroups.map((name) => <option key={name}>{name}</option>)}</select></label><div className="mt-5 grid grid-cols-2 gap-3"><button type="button" onClick={() => setAddOpen(false)} className="min-h-12 rounded-xl border border-white/15 text-sm font-bold">Cancel</button><button disabled={!label.trim() || saving} className="min-h-12 rounded-xl bg-[#ff7a00] text-sm font-black text-white disabled:opacity-45">Add Item</button></div></form></div> : null}
    </div>
  );
}
