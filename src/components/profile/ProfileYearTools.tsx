"use client";

import Link from "next/link";
import { CalendarDays, Check, ChevronLeft, ChevronRight, Circle } from "lucide-react";
import { useMemo, useState } from "react";

type DatedRecord = { createdAt?: string | null; reminderDate?: string | null };

function dateKey(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export default function ProfileYearTools({
  confirmedTrips,
  reminders,
  favoritePlansCount,
  favoriteDestinationsCount,
}: {
  confirmedTrips: DatedRecord[];
  reminders: DatedRecord[];
  favoritePlansCount: number;
  favoriteDestinationsCount: number;
}) {
  const [year, setYear] = useState(new Date().getFullYear());
  const markedDates = useMemo(() => {
    const values = new Set<string>();
    confirmedTrips.forEach((trip) => values.add(dateKey(trip.createdAt)));
    reminders.forEach((reminder) => values.add(dateKey(reminder.reminderDate)));
    values.delete("");
    return values;
  }, [confirmedTrips, reminders]);

  const checklist = [
    { label: "Save a ready plan", done: favoritePlansCount > 0, href: "/ready-plans" },
    { label: "Save a destination", done: favoriteDestinationsCount > 0, href: "/destinations" },
    { label: "Create or confirm a trip", done: confirmedTrips.length > 0, href: "/profile/create-plan" },
    { label: "Add a travel reminder", done: reminders.length > 0, href: "/profile/bookings-reminders" },
  ];

  return (
    <section className="grid gap-5 xl:grid-cols-[0.62fr,1.38fr]">
      <div className="rounded-2xl border border-white/10 bg-[#101c27]/78 p-5 shadow-[0_22px_70px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
        <h2 className="flex items-center gap-3 text-xl font-bold"><Check className="h-5 w-5 text-[#ff7a00]" />Travel Checklist</h2>
        <div className="mt-4 space-y-2">
          {checklist.map((item) => (
            <Link key={item.label} href={item.href} className="flex min-h-12 items-center gap-3 rounded-xl bg-white/[0.04] px-3 transition hover:bg-white/[0.07]">
              {item.done ? <Check className="h-5 w-5 text-emerald-300" /> : <Circle className="h-5 w-5 text-white/35" />}
              <span className={item.done ? "text-sm text-white" : "text-sm text-white/70"}>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#101c27]/78 p-4 shadow-[0_22px_70px_rgba(0,0,0,0.35)] backdrop-blur-2xl sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-3 text-lg font-bold sm:text-xl"><CalendarDays className="h-5 w-5 text-[#ff7a00]" />Travel Calendar</h2>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setYear((value) => value - 1)} aria-label="Previous year" className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10"><ChevronLeft className="h-4 w-4" /></button>
            <span className="min-w-14 text-center text-sm font-bold">{year}</span>
            <button type="button" onClick={() => setYear((value) => value + 1)} aria-label="Next year" className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 12 }, (_, month) => {
            const days = new Date(year, month + 1, 0).getDate();
            const hasPlans = Array.from({ length: days }, (_, index) => markedDates.has(`${year}-${month}-${index + 1}`)).some(Boolean);
            return (
              <Link key={month} href="/profile/bookings-reminders" className={`rounded-xl border p-3 transition hover:border-[#ff7a00]/55 ${hasPlans ? "border-[#ff7a00]/35 bg-[#ff7a00]/10" : "border-white/8 bg-white/[0.035]"}`}>
                <div className="text-sm font-semibold">{new Date(year, month, 1).toLocaleDateString("en-US", { month: "long" })}</div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {Array.from({ length: days }, (_, index) => {
                    const marked = markedDates.has(`${year}-${month}-${index + 1}`);
                    return <span key={index} className={`h-1.5 w-1.5 rounded-full ${marked ? "bg-[#ff7a00] shadow-[0_0_8px_rgba(255,122,0,0.8)]" : "bg-white/12"}`} />;
                  })}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
