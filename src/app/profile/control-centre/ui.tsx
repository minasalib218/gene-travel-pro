"use client";

import Link from "next/link";
import { CalendarDays, CheckCircle2, CircleDollarSign, Gauge, Luggage, MapPin, PlaneTakeoff } from "lucide-react";
import GeneLogo from "@/components/brand/GeneLogo";
import ProfileSidebarNav from "@/components/profile/ProfileSidebarNav";
import ProfileMobileNav from "@/components/profile/ProfileMobileNav";
import type { ControlCentreTripOverview } from "@/lib/control-centre/repository";

function percent(done: number, total: number) {
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

function money(amount: number | null, currency: string | null) {
  if (amount == null || !currency) return "Not set";
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

function date(value: Date) {
  return new Date(value).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

function Metric({ icon: Icon, label, value, progress }: { icon: any; label: string; value: string; progress?: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
      <div className="flex items-center gap-3"><Icon className="h-5 w-5 text-[#ff7a00]" /><span className="text-xs text-white/55">{label}</span></div>
      <div className="mt-3 text-xl font-bold text-white">{value}</div>
      {progress !== undefined ? <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#ff7a00]" style={{ width: `${progress}%` }} /></div> : null}
    </div>
  );
}

export default function ControlCentreClient({ name, trips }: { name: string; trips: ControlCentreTripOverview[] }) {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#071019] text-white">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_80%_0%,rgba(255,122,0,.15),transparent_32%),radial-gradient(circle_at_5%_100%,rgba(16,91,122,.2),transparent_42%)]" />
      <div className="relative mx-auto grid min-h-screen max-w-[1540px] lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="sticky top-0 hidden h-screen border-r border-white/10 bg-[#08111a]/90 py-5 backdrop-blur-2xl lg:flex lg:flex-col">
          <div className="px-7 pb-5"><GeneLogo /></div>
          <ProfileSidebarNav createPlanHref="/profile/create-plan" activePage="control-centre" showControlCentre />
        </aside>

        <div className="min-w-0 px-3 pb-24 pt-4 sm:px-6 lg:px-8 lg:pb-12">
          <header className="mb-6 flex items-center justify-between border-b border-white/10 pb-4 lg:hidden"><GeneLogo /><Link href="/profile/trips" className="rounded-full border border-white/12 px-4 py-2 text-xs font-semibold">My Trips</Link></header>
          <section className="mb-8">
            <div className="text-[10px] font-black uppercase tracking-[.22em] text-[#ff8a1d]">Welcome, {name}</div>
            <h1 className="mt-2 font-serif text-4xl sm:text-5xl">Trip Control Centre</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/58">Your bookings, tasks, packing, budget, and trip readiness in one place.</p>
          </section>

          {trips.length === 0 ? (
            <section className="rounded-3xl border border-dashed border-white/15 bg-white/[0.035] p-8 text-center">
              <PlaneTakeoff className="mx-auto h-9 w-9 text-[#ff7a00]" />
              <h2 className="mt-4 text-xl font-bold">No active Control Centre trip yet</h2>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-white/58">Create or continue an AI trip. Once its itinerary is saved, its live planning status will appear here.</p>
              <Link href="/profile/create-plan" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-[#ff7a00] px-6 text-sm font-black">Create a plan</Link>
            </section>
          ) : (
            <div className="space-y-6">
              {trips.map((trip) => {
                const bookingProgress = percent(trip.bookingConfirmed, trip.bookingTotal);
                const taskProgress = percent(trip.taskCompleted, trip.taskTotal);
                const packingProgress = percent(trip.packingCompleted, trip.packingTotal);
                return (
                  <section key={trip.id} className="overflow-hidden rounded-3xl border border-white/10 bg-[#101a24]/84 shadow-[0_24px_80px_rgba(0,0,0,.3)] backdrop-blur-2xl">
                    <div className="border-b border-white/10 bg-[linear-gradient(135deg,rgba(255,122,0,.13),transparent_55%)] p-5 sm:p-7">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div><div className="text-[10px] font-black uppercase tracking-[.2em] text-[#ffae64]">{trip.status.replaceAll("_", " ")}</div><h2 className="mt-2 text-2xl font-bold">{trip.title}</h2><div className="mt-3 flex flex-wrap gap-4 text-xs text-white/62"><span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[#ff7a00]" />{trip.destination}</span><span className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-[#ff7a00]" />{date(trip.startDate)} - {date(trip.endDate)}</span></div></div>
                        <div className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs text-white/65">{trip.planningStage.replaceAll("_", " ")}</div>
                      </div>
                    </div>
                    <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-6 xl:grid-cols-5">
                      <Metric icon={CheckCircle2} label="Bookings" value={`${trip.bookingConfirmed} of ${trip.bookingTotal}`} progress={bookingProgress} />
                      <Metric icon={Gauge} label="Tasks" value={`${taskProgress}% ready`} progress={taskProgress} />
                      <Metric icon={Luggage} label="Packing" value={`${packingProgress}% packed`} progress={packingProgress} />
                      <Metric icon={CircleDollarSign} label="Budget" value={`${money(trip.spentBudget, trip.currency)} / ${money(trip.plannedBudget, trip.currency)}`} />
                      <Metric icon={PlaneTakeoff} label="Readiness" value={trip.readinessScore == null ? "Not checked" : `${trip.readinessScore}%`} progress={trip.readinessScore ?? 0} />
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 px-5 py-4 sm:px-7"><p className="text-sm text-white/58">{trip.nextAction || "Continue planning to generate your next recommended action."}</p><Link href={`/profile/control-centre/${trip.id}`} className="inline-flex min-h-11 items-center rounded-xl border border-[#ff7a00]/45 px-5 text-sm font-bold text-[#ffae64]">Manage trip</Link></div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <ProfileMobileNav active="control" />
    </main>
  );
}
