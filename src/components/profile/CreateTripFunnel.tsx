"use client";

import Link from "next/link";
import { FormEvent, useRef, useState } from "react";
import { ArrowRight, CalendarDays, Compass, MapPin, PlaneTakeoff, Sparkles } from "lucide-react";

type Mode = "start" | "inspire" | "manual";

const discovery = [
  { href: "/ready-plans", title: "Ready Plans", text: "Start with a complete cinematic itinerary." },
  { href: "/destinations", title: "Destinations", text: "Explore places by continent and travel style." },
  { href: "/offers", title: "Offers", text: "Save a real offer and build your trip around it." },
  { href: "/events", title: "Events", text: "Discover events worth travelling for." },
];

export default function CreateTripFunnel({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>("start");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const creationKey = useRef(crypto.randomUUID());

  async function createTrip(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const startDate = new Date(`${String(form.get("startDate"))}T12:00:00.000Z`);
    const endDate = new Date(`${String(form.get("endDate"))}T12:00:00.000Z`);
    const response = await fetch("/api/profile/customer-trips", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        creationKey: creationKey.current,
        title: form.get("title"),
        destination: form.get("destination"),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        travelers: Number(form.get("travelers") || 1),
        budget: form.get("budget") ? Number(form.get("budget")) : undefined,
        currency: form.get("currency") || "USD",
        notes: form.get("notes") || undefined,
      }),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.tripId) {
      setBusy(false);
      setError(result?.code === "INVALID_DATES" ? "End date must be after the start date." : "Your trip could not be created. Please check the details and try again.");
      return;
    }
    window.location.assign(`/profile/control-centre/${encodeURIComponent(result.tripId)}`);
  }

  return (
    <div className="mx-auto max-w-7xl px-3 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div className="mb-8 max-w-3xl">
        <div className="text-[10px] font-black uppercase tracking-[.22em] text-[#ff8a1d]">Create a trip</div>
        <h1 className="mt-3 font-serif text-4xl sm:text-5xl">How would you like to begin?</h1>
        <p className="mt-3 text-sm leading-6 text-white/58">Start from Gene inspiration or build a private trip around plans you already know.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <button onClick={() => setMode("inspire")} className={`group min-h-[190px] rounded-2xl border p-6 text-left transition ${mode === "inspire" ? "border-[#ff7a00]/70 bg-[#ff7a00]/12" : "border-white/10 bg-white/[.045] hover:border-[#ff7a00]/40"}`}>
          <Sparkles className="h-7 w-7 text-[#ff7a00]" />
          <h2 className="mt-5 font-serif text-2xl">Inspire Me</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-white/55">Browse Ready Plans, destinations, offers, and events. Save what you love or use a plan as your trip.</p>
          <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#ffae64]">Explore ideas <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
        </button>
        <button onClick={() => setMode("manual")} className={`group min-h-[190px] rounded-2xl border p-6 text-left transition ${mode === "manual" ? "border-[#ff7a00]/70 bg-[#ff7a00]/12" : "border-white/10 bg-white/[.045] hover:border-[#ff7a00]/40"}`}>
          <MapPin className="h-7 w-7 text-[#ff7a00]" />
          <h2 className="mt-5 font-serif text-2xl">I Know What I Want</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-white/55">Create a manual trip with your destination and dates. No AI generation and no payment required.</p>
          <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#ffae64]">Enter trip details <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
        </button>
      </div>

      {mode === "inspire" ? (
        <section className="mt-6 rounded-2xl border border-white/10 bg-[#0c151e]/88 p-4 sm:p-6">
          <div className="mb-4 flex items-center gap-2"><Compass className="h-5 w-5 text-[#ff7a00]" /><h2 className="text-lg font-bold">Choose your inspiration</h2></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{discovery.map((item) => <Link key={item.href} href={item.href} className="rounded-xl border border-white/10 bg-black/20 p-4 transition hover:border-[#ff7a00]/45"><strong className="text-sm">{item.title}</strong><p className="mt-2 text-xs leading-5 text-white/48">{item.text}</p><ArrowRight className="mt-4 h-4 w-4 text-[#ff7a00]" /></Link>)}</div>
        </section>
      ) : null}

      {mode === "manual" ? (
        <section className="mt-6 rounded-2xl border border-white/10 bg-[#0c151e]/88 p-4 sm:p-6">
          <div className="mb-5 flex items-center gap-2"><PlaneTakeoff className="h-5 w-5 text-[#ff7a00]" /><h2 className="text-lg font-bold">Your trip details</h2></div>
          <form onSubmit={createTrip} className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-bold text-white/70">Trip name<input name="title" required maxLength={120} placeholder="Summer in Italy" className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-white outline-none focus:border-[#ff7a00]" /></label>
            <label className="text-xs font-bold text-white/70">Destination<input name="destination" required maxLength={160} placeholder="Italy" className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-white outline-none focus:border-[#ff7a00]" /></label>
            <label className="text-xs font-bold text-white/70">Start date<input name="startDate" type="date" required className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-white outline-none focus:border-[#ff7a00]" /></label>
            <label className="text-xs font-bold text-white/70">End date<input name="endDate" type="date" required className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-white outline-none focus:border-[#ff7a00]" /></label>
            <label className="text-xs font-bold text-white/70">Travelers<input name="travelers" type="number" min="1" max="50" defaultValue="1" required className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-white outline-none focus:border-[#ff7a00]" /></label>
            <div className="grid grid-cols-[1fr_92px] gap-2"><label className="text-xs font-bold text-white/70">Budget (optional)<input name="budget" type="number" min="0" step="1" placeholder="2500" className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-white outline-none focus:border-[#ff7a00]" /></label><label className="text-xs font-bold text-white/70">Currency<input name="currency" defaultValue="USD" maxLength={3} className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-sm uppercase text-white outline-none focus:border-[#ff7a00]" /></label></div>
            <label className="text-xs font-bold text-white/70 sm:col-span-2">Notes (optional)<textarea name="notes" maxLength={3000} rows={3} placeholder="Anything you already know about this trip" className="mt-2 w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none focus:border-[#ff7a00]" /></label>
            {error ? <p role="alert" className="text-sm text-red-300 sm:col-span-2">{error}</p> : null}
            <button disabled={busy} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#ff7a00] px-6 text-sm font-black text-white disabled:opacity-60 sm:col-span-2 sm:justify-self-start"><CalendarDays className="h-4 w-4" />{busy ? "Creating trip..." : "Create My Trip"}</button>
          </form>
        </section>
      ) : null}

      <details className="mt-8 rounded-2xl border border-white/10 bg-white/[.035]">
        <summary className="cursor-pointer px-5 py-4 text-sm font-bold text-white/75">Book individual travel services</summary>
        <div className="border-t border-white/10">{children}</div>
      </details>
    </div>
  );
}
