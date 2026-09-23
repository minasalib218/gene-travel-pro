"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Archive,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Copy,
  MapPin,
  MoreHorizontal,
  Plane,
  RotateCcw,
  Sparkles,
  Users,
} from "lucide-react";
import GeneLogo from "@/components/brand/GeneLogo";
import ProfileSidebarNav from "@/components/profile/ProfileSidebarNav";
import ProfileMobileNav from "@/components/profile/ProfileMobileNav";
import type { TripAccess, TripDisplayStatus, TripSource } from "@/lib/profile/trip-utils";

export type TripCardData = {
  id: string;
  readyPlanId?: string;
  recordType: "PLAN" | "READY_PLAN";
  title: string;
  destination: string;
  startDate: string | null;
  endDate: string | null;
  travelersCount: number;
  sourceType: TripSource;
  accessType: TripAccess;
  status: TripDisplayStatus;
  planStatus: "DRAFT" | "RECOMMENDED" | "ANALYZED" | "CONFIRMED";
  planningProgress: number;
  bookingProgress: number;
  selectedCount: number;
  bookedCount: number;
  coverImage: string | null;
  lastUpdatedAt: string;
  primaryHref: string;
  documentsNeedingAttention: number;
};

type Props = {
  profile: { name: string };
  trips: TripCardData[];
  createPlanHref: string;
  controlCentreEnabled?: boolean;
};

type Filter = "ALL" | "UPCOMING" | "PLANNING" | "COMPLETED" | "ARCHIVED";

const fallbackImages = [
  "/images/Greece.jpg",
  "/images/Switzerland.jpg",
  "/images/Japan.jpg",
  "/images/Norway.avif",
];

const statusTone: Record<TripDisplayStatus, string> = {
  DRAFT: "bg-amber-400/14 text-amber-300",
  PLANNING: "bg-sky-400/14 text-sky-300",
  READY: "bg-violet-400/14 text-violet-300",
  UPCOMING: "bg-[#ff7a00]/14 text-[#ffad62]",
  ACTIVE: "bg-emerald-400/14 text-emerald-300",
  COMPLETED: "bg-white/10 text-white/65",
  ARCHIVED: "bg-white/7 text-white/45",
};

function formatDate(value: string | null) {
  if (!value) return "Dates not selected";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Dates not selected" : date.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

function duration(start: string | null, end: string | null) {
  if (!start || !end) return null;
  const days = Math.max(1, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1);
  return `${days} day${days === 1 ? "" : "s"}`;
}

function sourceLabel(source: TripSource) {
  if (source === "READY_PLAN") return "Ready plan";
  if (source === "READY_PLAN_CUSTOMIZED") return "Customized";
  if (source === "MANUAL") return "Manual";
  return "AI plan";
}

function primaryLabel(trip: TripCardData) {
  if (["DRAFT", "PLANNING"].includes(trip.status)) return "Continue planning";
  if (trip.bookedCount > 0) return "Manage bookings";
  return "View itinerary";
}

function matchesFilter(trip: TripCardData, filter: Filter) {
  if (filter === "ALL") return trip.status !== "ARCHIVED";
  if (filter === "UPCOMING") return ["UPCOMING", "ACTIVE", "READY"].includes(trip.status);
  if (filter === "PLANNING") return ["DRAFT", "PLANNING"].includes(trip.status);
  return trip.status === filter;
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-white/10 bg-[#101a24]/82 shadow-[0_20px_60px_rgba(0,0,0,.28)] backdrop-blur-xl ${className}`}>{children}</div>;
}

export default function MyTripsClient({ profile, trips: initialTrips, createPlanHref, controlCentreEnabled = false }: Props) {
  const [trips, setTrips] = useState(initialTrips);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [sourceFilter, setSourceFilter] = useState<"ALL" | TripSource>("ALL");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const counts = useMemo(() => ({
    upcoming: trips.filter((trip) => ["UPCOMING", "ACTIVE", "READY"].includes(trip.status)).length,
    planning: trips.filter((trip) => ["DRAFT", "PLANNING"].includes(trip.status)).length,
    completed: trips.filter((trip) => trip.status === "COMPLETED").length,
    booked: trips.reduce((sum, trip) => sum + trip.bookedCount, 0),
  }), [trips]);

  const nextTrip = useMemo(() => trips
    .filter((trip) => trip.startDate && ["UPCOMING", "ACTIVE"].includes(trip.status))
    .sort((a, b) => new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime())[0] || null, [trips]);

  const continueTrip = useMemo(() => trips
    .filter((trip) => ["DRAFT", "PLANNING"].includes(trip.status))
    .sort((a, b) => new Date(b.lastUpdatedAt).getTime() - new Date(a.lastUpdatedAt).getTime())[0] || null, [trips]);

  const filtered = trips.filter((trip) => matchesFilter(trip, filter) && (sourceFilter === "ALL" || trip.sourceType === sourceFilter));

  function setFilterAndUrl(value: Filter) {
    setFilter(value);
    const url = new URL(window.location.href);
    if (value === "ALL") url.searchParams.delete("status"); else url.searchParams.set("status", value.toLowerCase());
    window.history.replaceState(null, "", url.toString());
  }

  async function mutate(action: "ARCHIVE" | "RESTORE" | "DUPLICATE", trip: TripCardData) {
    if (trip.recordType !== "PLAN") return;
    setBusyId(trip.id);
    setNotice(null);
    const response = await fetch("/api/profile/trips", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, planId: trip.id }),
    });
    const result = await response.json().catch(() => null);
    setBusyId(null);
    if (!response.ok || !result?.ok) {
      setNotice("This trip could not be updated. Please try again.");
      return;
    }
    if (action === "DUPLICATE" && result.planId) {
      window.location.href = `/profile/trips?created=${encodeURIComponent(result.planId)}`;
      return;
    }
    setTrips((current) => current.map((row) => row.id === trip.id ? { ...row, status: action === "ARCHIVE" ? "ARCHIVED" : "DRAFT" } : row));
    setNotice(action === "ARCHIVE" ? "Trip archived without deleting any bookings or plan content." : "Trip restored to My Trips.");
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#071019] text-white">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_82%_0%,rgba(255,122,0,.14),transparent_31%),radial-gradient(circle_at_8%_100%,rgba(22,87,118,.2),transparent_40%)]" />
      <div className="relative mx-auto grid min-h-screen max-w-[1540px] lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="sticky top-0 hidden h-screen border-r border-white/10 bg-[#08111a]/90 py-5 backdrop-blur-2xl lg:flex lg:flex-col">
          <div className="px-7 pb-5"><GeneLogo /></div>
          <ProfileSidebarNav createPlanHref={createPlanHref} activePage="my-trips" showControlCentre={controlCentreEnabled} />
        </aside>

        <div className="min-w-0 px-3 pb-28 pt-4 sm:px-6 lg:px-8 lg:pb-12">
          <header className="mb-6 flex items-center justify-between border-b border-white/10 pb-4 lg:hidden">
            <GeneLogo />
            <Link href="/profile" className="rounded-full border border-white/12 px-4 py-2 text-xs font-semibold text-white/80">Profile</Link>
          </header>

          <section className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[.22em] text-[#ff8a1d]">Welcome, {profile.name}</div>
              <h1 className="mt-2 font-serif text-4xl sm:text-5xl">My Trips</h1>
              <p className="mt-2 text-sm text-white/55">All your plans and journeys in one place.</p>
            </div>
            {controlCentreEnabled ? (
              <Link href="/profile/control-centre" className="inline-flex min-h-11 items-center rounded-xl border border-[#ff7a00]/45 bg-[#ff7a00]/12 px-5 text-sm font-bold text-[#ffae64] transition hover:bg-[#ff7a00]/20">
                Open Trip Control Centre
              </Link>
            ) : null}
            <Link href={createPlanHref} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#ff7a00] px-5 text-sm font-black shadow-[0_12px_30px_rgba(255,122,0,.24)]">
              <Sparkles className="h-4 w-4" /> Create a plan
            </Link>
          </section>

          {notice ? <div className="mb-4 rounded-xl border border-[#ff7a00]/25 bg-[#ff7a00]/10 px-4 py-3 text-sm text-[#ffc38d]">{notice}</div> : null}

          <section className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-4">
            {([
              ["Upcoming", counts.upcoming, Plane, "text-[#ffae64] bg-[#ff7a00]/12"],
              ["In planning", counts.planning, Clock3, "text-sky-300 bg-sky-400/12"],
              ["Completed", counts.completed, CheckCircle2, "text-emerald-300 bg-emerald-400/12"],
              ["Booked items", counts.booked, CalendarDays, "text-violet-300 bg-violet-400/12"],
            ] as Array<[string, number, typeof Plane, string]>).map(([label, value, MetricIcon, tone]) => {
              return <Card key={String(label)} className="p-4"><div className={`mb-3 grid h-9 w-9 place-items-center rounded-xl ${tone}`}><MetricIcon className="h-4 w-4" /></div><strong className="text-2xl">{value}</strong><div className="mt-1 text-xs text-white/45">{String(label)}</div></Card>;
            })}
          </section>

          {nextTrip ? <NextTripHero trip={nextTrip} /> : (
            <Card className="relative mb-4 overflow-hidden p-7 sm:p-10">
              <Image src="/bg/home-hero-bottom-optimized.jpg" alt="" fill className="object-cover opacity-35" sizes="100vw" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#071019] via-[#071019]/85 to-transparent" />
              <div className="relative max-w-xl"><div className="text-[10px] font-black uppercase tracking-[.2em] text-[#ffae64]">Your next story</div><h2 className="mt-3 font-serif text-3xl">No upcoming trip yet.</h2><p className="mt-3 text-sm leading-6 text-white/60">Choose a cinematic ready plan or create a smart itinerary around your own dates.</p><div className="mt-6 flex flex-wrap gap-3"><Link href="/ready-plans" className="rounded-xl border border-white/15 px-5 py-3 text-sm font-bold">Explore ready plans</Link><Link href={createPlanHref} className="rounded-xl bg-[#ff7a00] px-5 py-3 text-sm font-bold">Create my smart plan</Link></div></div>
            </Card>
          )}

          {continueTrip ? (
            <Card className="mb-4 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div><div className="text-[10px] font-black uppercase tracking-[.18em] text-[#ff9c43]">Continue planning</div><h2 className="mt-2 text-lg font-bold">{continueTrip.title}</h2><p className="mt-1 text-xs text-white/48">Resume where you stopped. Opening this trip does not use another credit.</p></div>
              <Link href={continueTrip.primaryHref} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-5 text-sm font-black text-[#091019]">Continue <ChevronRight className="ml-2 h-4 w-4" /></Link>
            </Card>
          ) : null}

          <Card className="mb-4 p-3 sm:p-4">
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {(["ALL", "UPCOMING", "PLANNING", "COMPLETED", "ARCHIVED"] as Filter[]).map((value) => <button key={value} onClick={() => setFilterAndUrl(value)} className={`min-h-10 shrink-0 rounded-full px-4 text-xs font-black capitalize ${filter === value ? "bg-[#ff7a00]" : "bg-white/[.05] text-white/55"}`}>{value.toLowerCase().replace("planning", "in planning")}</button>)}
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {(["ALL", "READY_PLAN", "AI_GENERATED", "READY_PLAN_CUSTOMIZED"] as const).map((value) => <button key={value} onClick={() => setSourceFilter(value)} className={`min-h-9 shrink-0 rounded-lg border px-3 text-[11px] font-bold ${sourceFilter === value ? "border-[#ff7a00]/50 bg-[#ff7a00]/10 text-[#ffae64]" : "border-white/8 text-white/45"}`}>{value === "ALL" ? "All sources" : sourceLabel(value)}</button>)}
            </div>
          </Card>

          {filtered.length ? (
            <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {filtered.map((trip, index) => <TripCard key={`${trip.recordType}-${trip.id}`} trip={trip} image={trip.coverImage || fallbackImages[index % fallbackImages.length]} busy={busyId === trip.id} onAction={mutate} />)}
            </section>
          ) : (
            <Card className="p-10 text-center"><Plane className="mx-auto h-9 w-9 text-[#ff7a00]" /><h2 className="mt-4 text-xl font-bold">No trips in this view</h2><p className="mt-2 text-sm text-white/48">Try another filter or create a new plan.</p></Card>
          )}
        </div>
      </div>

      <ProfileMobileNav active="trips" />
    </main>
  );
}

function NextTripHero({ trip }: { trip: TripCardData }) {
  const start = trip.startDate ? new Date(trip.startDate) : null;
  const countdown = start ? Math.max(0, Math.ceil((start.getTime() - Date.now()) / 86400000)) : 0;
  return (
    <Card className="relative mb-4 min-h-[260px] overflow-hidden p-6 sm:p-9">
      <Image src={trip.coverImage || fallbackImages[0]} alt={trip.title} fill priority className="object-cover opacity-58" sizes="(max-width: 1024px) 100vw, 1100px" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#06101a] via-[#06101a]/82 to-black/10" />
      <div className="relative max-w-2xl"><div className="text-[10px] font-black uppercase tracking-[.2em] text-[#ffae64]">Your next trip · {countdown} days away</div><h2 className="mt-3 font-serif text-3xl sm:text-4xl">{trip.title}</h2><div className="mt-4 flex flex-wrap gap-4 text-xs text-white/72"><span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[#ff7a00]" />{trip.destination}</span><span className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-[#ff7a00]" />{formatDate(trip.startDate)} - {formatDate(trip.endDate)}</span><span className="flex items-center gap-2"><Users className="h-4 w-4 text-[#ff7a00]" />{trip.travelersCount}</span></div><div className="mt-5 grid max-w-lg grid-cols-2 gap-3"><Progress label="Planning" value={trip.planningProgress} /><Progress label="Booked" value={trip.bookingProgress} /></div><div className="mt-6 flex flex-wrap gap-3"><Link href={trip.primaryHref} className="rounded-xl bg-[#ff7a00] px-5 py-3 text-sm font-black">{primaryLabel(trip)}</Link><Link href={`/profile/bookings-reminders?tripId=${encodeURIComponent(trip.id)}`} className="rounded-xl border border-white/18 bg-black/20 px-5 py-3 text-sm font-bold">Bookings &amp; Reminders</Link></div></div>
    </Card>
  );
}

function Progress({ label, value }: { label: string; value: number }) {
  return <div><div className="mb-2 flex justify-between text-[10px] font-bold uppercase tracking-[.14em] text-white/55"><span>{label}</span><span>{value}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#ff7a00]" style={{ width: `${value}%` }} /></div></div>;
}

function TripCard({ trip, image, busy, onAction }: { trip: TripCardData; image: string; busy: boolean; onAction: (action: "ARCHIVE" | "RESTORE" | "DUPLICATE", trip: TripCardData) => void }) {
  const [menu, setMenu] = useState(false);
  return (
    <Card className="group overflow-hidden">
      <div className="relative h-48"><Image src={image} alt={trip.title} fill className="object-cover transition duration-700 group-hover:scale-[1.03]" sizes="(max-width: 768px) 100vw, 440px" /><div className="absolute inset-0 bg-gradient-to-t from-[#08111a] via-transparent to-black/30" /><div className="absolute left-4 top-4 flex flex-wrap gap-2"><span className="rounded-full bg-black/60 px-3 py-1 text-[9px] font-black uppercase tracking-[.15em] text-white/80">{sourceLabel(trip.sourceType)}</span><span className="rounded-full bg-black/60 px-3 py-1 text-[9px] font-black uppercase tracking-[.15em] text-[#ffae64]">{trip.accessType}</span></div><span className={`absolute bottom-4 right-4 rounded-full px-3 py-1 text-[9px] font-black ${statusTone[trip.status]}`}>{trip.status}</span></div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="line-clamp-2 text-lg font-bold">{trip.title}</h2><p className="mt-1 flex items-center gap-1.5 text-xs text-white/48"><MapPin className="h-3.5 w-3.5 text-[#ff7a00]" />{trip.destination}</p></div>{trip.recordType === "PLAN" ? <div className="relative"><button aria-label={`Actions for ${trip.title}`} onClick={() => setMenu((value) => !value)} className="grid h-10 w-10 place-items-center rounded-lg hover:bg-white/5"><MoreHorizontal className="h-5 w-5" /></button>{menu ? <div className="absolute right-0 top-11 z-20 w-48 rounded-xl border border-white/10 bg-[#0a121a] p-2 shadow-2xl"><button disabled={busy} onClick={() => onAction("DUPLICATE", trip)} className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-xs hover:bg-white/5"><Copy className="h-4 w-4" />Duplicate as draft</button><button disabled={busy} onClick={() => onAction(trip.status === "ARCHIVED" ? "RESTORE" : "ARCHIVE", trip)} className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-xs hover:bg-white/5">{trip.status === "ARCHIVED" ? <RotateCcw className="h-4 w-4" /> : <Archive className="h-4 w-4" />}{trip.status === "ARCHIVED" ? "Restore" : "Archive"}</button></div> : null}</div> : null}</div>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-white/50"><span>{trip.startDate ? `${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}` : "Dates not selected"}</span>{duration(trip.startDate, trip.endDate) ? <span>{duration(trip.startDate, trip.endDate)}</span> : null}<span>{trip.travelersCount} traveler{trip.travelersCount === 1 ? "" : "s"}</span></div>
        <div className="mt-5 grid grid-cols-2 gap-3"><Progress label="Planning" value={trip.planningProgress} /><Progress label="Booking" value={trip.bookingProgress} /></div>
        <div className="mt-4 flex items-center justify-between text-[11px] text-white/45"><span>{trip.bookedCount} booked · {trip.selectedCount} selected</span><span>Updated {formatDate(trip.lastUpdatedAt)}</span></div>
        {trip.documentsNeedingAttention ? <div className="mt-3 rounded-lg bg-amber-400/10 px-3 py-2 text-[11px] text-amber-300">{trip.documentsNeedingAttention} document{trip.documentsNeedingAttention === 1 ? "" : "s"} need attention</div> : null}
        <div className="mt-5 grid grid-cols-[1fr_auto] gap-2"><Link href={trip.primaryHref} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#ff7a00] px-4 text-xs font-black">{primaryLabel(trip)}</Link><Link aria-label={`Open bookings for ${trip.title}`} href={`/profile/bookings-reminders?tripId=${encodeURIComponent(trip.recordType === "PLAN" ? trip.id : trip.readyPlanId || trip.id)}`} className="grid h-11 w-11 place-items-center rounded-xl border border-white/12"><CalendarDays className="h-4 w-4" /></Link></div>
      </div>
    </Card>
  );
}
