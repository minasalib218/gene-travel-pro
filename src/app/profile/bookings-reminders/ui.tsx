"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Bell,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  Plane,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import GeneLogo from "@/components/brand/GeneLogo";
import ProfileSidebarNav from "@/components/profile/ProfileSidebarNav";

type DateValue = Date | string;

type Trip = {
  id: string;
  title: string;
  destination: string;
  startDate: DateValue;
  endDate: DateValue;
  status: string;
  inputsJson?: unknown;
};

type Booking = {
  id: string;
  provider: string;
  status: string;
  travelDate?: DateValue | null;
  bookingDate?: DateValue | null;
  amount?: number | null;
  currency?: string | null;
  planId?: string | null;
  metadata?: unknown;
  createdAt: DateValue;
};

type BookingClick = {
  id: string;
  itemName: string;
  itemType?: string | null;
  destination?: string | null;
  provider?: string | null;
  clickedAt: DateValue;
  planId?: string | null;
  metadata?: unknown;
};

type SavedItem = {
  id: string;
  tripName?: string | null;
  itemType: string;
  title: string;
  provider?: string | null;
  destination?: string | null;
  imageUrl?: string | null;
  href?: string | null;
  status: string;
  createdAt: DateValue;
  metadata?: unknown;
};

type Reminder = {
  id: string;
  title: string;
  tripName?: string | null;
  reminderType: string;
  reminderDate: DateValue;
  reminderTime?: string | null;
  notes?: string | null;
  status: string;
};

type Props = {
  profile: { name: string; email: string; avatarUrl: string | null };
  initialData: {
    trips: Trip[];
    bookings: Booking[];
    bookingClicks: BookingClick[];
    savedItems: SavedItem[];
    reminders: Reminder[];
  };
};

type TimelineItem = {
  id: string;
  kind: "booking" | "selected" | "reminder" | "trip";
  title: string;
  subtitle: string;
  date: Date;
  status: string;
};

const fallbackImages = [
  "/images/Greece.jpg",
  "/images/Switzerland.jpg",
  "/images/Japan.jpg",
  "/images/Norway.avif",
];

function asDate(value?: DateValue | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateKey(value: DateValue | Date) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDate(value?: DateValue | null, options?: Intl.DateTimeFormatOptions) {
  const date = asDate(value);
  if (!date) return "Date not set";
  return date.toLocaleDateString("en-US", options || { day: "numeric", month: "short", year: "numeric" });
}

function metadataText(metadata: unknown, ...keys: string[]) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const row = metadata as Record<string, unknown>;
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-white/10 bg-[#111820]/82 shadow-[0_18px_55px_rgba(0,0,0,.22)] backdrop-blur-xl ${className}`}>{children}</div>;
}

export default function BookingsRemindersClient({ profile, initialData }: Props) {
  const [reminders, setReminders] = useState(initialData.reminders);
  const [month, setMonth] = useState(() => {
    const nextDate = asDate(initialData.trips[0]?.startDate) || new Date();
    return new Date(nextDate.getFullYear(), nextDate.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => dateKey(new Date()));
  const [filter, setFilter] = useState<"all" | "booking" | "reminder">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!dialogOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDialogOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [dialogOpen]);

  const nextTrip = useMemo(() => {
    const now = new Date();
    return initialData.trips.find((trip) => (asDate(trip.endDate)?.getTime() || 0) >= now.getTime()) || initialData.trips[0] || null;
  }, [initialData.trips]);

  const timeline = useMemo<TimelineItem[]>(() => {
    const bookingRows = initialData.bookings.map((booking) => ({
      id: booking.id,
      kind: "booking" as const,
      title: metadataText(booking.metadata, "title", "itemName", "name") || `${booking.provider} booking`,
      subtitle: booking.amount ? `${booking.currency || "USD"} ${booking.amount.toLocaleString()}` : booking.provider,
      date: asDate(booking.travelDate || booking.bookingDate || booking.createdAt) || new Date(),
      status: booking.status,
    }));
    const selectedRows = initialData.bookingClicks.map((item) => ({
      id: item.id,
      kind: "selected" as const,
      title: item.itemName,
      subtitle: item.destination || item.provider || item.itemType || "Selected travel item",
      date: asDate(metadataText(item.metadata, "travelDate", "startDate", "date")) || asDate(item.clickedAt) || new Date(),
      status: "SELECTED",
    }));
    const savedRows = initialData.savedItems.map((item) => ({
      id: item.id,
      kind: "selected" as const,
      title: item.title,
      subtitle: item.destination || item.tripName || item.provider || item.itemType,
      date: asDate(metadataText(item.metadata, "travelDate", "startDate", "date")) || asDate(item.createdAt) || new Date(),
      status: item.status,
    }));
    const tripRows = initialData.trips.map((trip) => ({
      id: trip.id,
      kind: "trip" as const,
      title: trip.title,
      subtitle: trip.destination,
      date: asDate(trip.startDate) || new Date(),
      status: trip.status,
    }));
    const reminderRows = reminders.map((reminder) => ({
      id: reminder.id,
      kind: "reminder" as const,
      title: reminder.title,
      subtitle: reminder.tripName || reminder.reminderType,
      date: asDate(reminder.reminderDate) || new Date(),
      status: reminder.status,
    }));
    return [...tripRows, ...bookingRows, ...selectedRows, ...savedRows, ...reminderRows].sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [initialData.trips, initialData.bookings, initialData.bookingClicks, initialData.savedItems, reminders]);

  const dayItems = timeline.filter((item) => dateKey(item.date) === selectedDate);
  const filteredTimeline = timeline.filter((item) => {
    if (filter === "booking") return item.kind === "booking" || item.kind === "selected";
    if (filter === "reminder") return item.kind === "reminder";
    return true;
  });

  const monthDays = useMemo(() => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const firstWeekday = new Date(year, monthIndex, 1).getDay();
    const count = new Date(year, monthIndex + 1, 0).getDate();
    return [...Array(firstWeekday).fill(null), ...Array.from({ length: count }, (_, index) => index + 1)];
  }, [month]);

  function markersFor(day: number) {
    const calendarDate = new Date(month.getFullYear(), month.getMonth(), day);
    const key = dateKey(calendarDate);
    const markers = timeline.filter((item) => dateKey(item.date) === key).map((item) => item.kind);
    const insideTrip = initialData.trips.some((trip) => {
      const start = asDate(trip.startDate);
      const end = asDate(trip.endDate);
      if (!start || !end) return false;
      const value = calendarDate.getTime();
      return value >= new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime()
        && value <= new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
    });
    return insideTrip && !markers.includes("trip") ? ["trip" as const, ...markers] : markers;
  }

  async function createReminder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice(null);
    const form = new FormData(event.currentTarget);
    const reminderDate = new Date(`${form.get("date")}T${form.get("time") || "09:00"}:00`);
    const response = await fetch("/api/profile/reminders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: form.get("title"),
        tripName: form.get("tripName") || null,
        reminderType: form.get("type") || "custom",
        reminderDate: reminderDate.toISOString(),
        reminderTime: form.get("time") || null,
        notes: form.get("notes") || null,
      }),
    });
    const result = await response.json().catch(() => null);
    setBusy(false);
    if (!response.ok || !result?.reminder) {
      setNotice("The reminder could not be saved. Please try again.");
      return;
    }
    setReminders((current) => [...current, result.reminder]);
    setDialogOpen(false);
    setNotice("Reminder saved to your profile.");
  }

  async function removeReminder(id: string) {
    setBusy(true);
    const response = await fetch("/api/profile/reminders", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setBusy(false);
    if (!response.ok) {
      setNotice("The reminder could not be removed.");
      return;
    }
    setReminders((current) => current.filter((reminder) => reminder.id !== id));
    setNotice("Reminder removed. Your travel item was not changed.");
  }

  return (
    <main className="min-h-screen bg-[#080d13] text-white">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_78%_0%,rgba(255,122,0,.12),transparent_32%),radial-gradient(circle_at_10%_100%,rgba(25,84,112,.2),transparent_38%)]" />
      <div className="relative mx-auto grid min-h-screen max-w-[1540px] lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="sticky top-0 hidden h-screen border-r border-white/10 bg-[#09111a]/88 py-5 backdrop-blur-2xl lg:flex lg:flex-col">
          <div className="px-7 pb-5"><GeneLogo /></div>
          <ProfileSidebarNav createPlanHref="/profile/create-plan" activePage="bookings-reminders" />
        </aside>

        <div className="min-w-0 px-3 pb-28 pt-4 sm:px-6 lg:px-8 lg:pb-12">
          <header className="mb-6 flex items-center justify-between border-b border-white/10 pb-4 lg:hidden">
            <GeneLogo />
            <Link href="/profile" className="rounded-full border border-white/12 px-4 py-2 text-xs font-semibold text-white/80">Profile</Link>
          </header>

          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-[#ff8a1d]">Customer Profile</div>
              <h1 className="mt-2 font-serif text-3xl sm:text-4xl">Bookings &amp; Reminders</h1>
              <p className="mt-2 text-sm text-white/55">Your saved travel choices, confirmed bookings and upcoming trip tasks.</p>
            </div>
            <button onClick={() => setDialogOpen(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#ff7a00] px-5 text-sm font-bold text-white shadow-[0_10px_28px_rgba(255,122,0,.25)]">
              <Plus className="h-4 w-4" /> Add reminder
            </button>
          </div>

          {notice ? <div className="mb-4 rounded-xl border border-[#ff7a00]/25 bg-[#ff7a00]/10 px-4 py-3 text-sm text-[#ffc38d]">{notice}</div> : null}

          {nextTrip ? (
            <Card className="relative mb-4 min-h-[170px] overflow-hidden p-6 sm:p-8">
              <Image src={fallbackImages[0]} alt="" fill priority className="object-cover opacity-45" sizes="(max-width: 1024px) 100vw, 1100px" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#071019] via-[#071019]/82 to-transparent" />
              <div className="relative max-w-xl">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ffae64]">Your next trip</div>
                <h2 className="mt-2 font-serif text-2xl sm:text-3xl">{nextTrip.title}</h2>
                <div className="mt-4 flex flex-wrap gap-4 text-xs text-white/72">
                  <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[#ff7a00]" />{nextTrip.destination}</span>
                  <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-[#ff7a00]" />{formatDate(nextTrip.startDate)} - {formatDate(nextTrip.endDate)}</span>
                </div>
                <Link href={`/plan-summary/${nextTrip.id}`} className="mt-5 inline-flex min-h-10 items-center rounded-lg border border-white/18 bg-black/25 px-4 text-xs font-bold">View full trip</Link>
              </div>
            </Card>
          ) : null}

          <section className="mb-4 grid grid-cols-3 gap-2 sm:gap-4">
            {[
              ["Booked", initialData.bookings.length, "bg-emerald-400/12 text-emerald-300"],
              ["Selected", initialData.bookingClicks.length + initialData.savedItems.length, "bg-sky-400/12 text-sky-300"],
              ["Reminders", reminders.filter((item) => item.status === "UPCOMING").length, "bg-[#ff7a00]/12 text-[#ffae64]"],
            ].map(([label, value, color]) => (
              <Card key={String(label)} className="p-3 sm:p-5">
                <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${color}`}><CalendarDays className="h-4 w-4" /></div>
                <strong className="block text-2xl">{value}</strong>
                <span className="text-[11px] text-white/50 sm:text-xs">{label}</span>
              </Card>
            ))}
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.08fr_.92fr]">
            <Card>
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-4 sm:px-5">
                <div><h2 className="font-bold">Travel calendar</h2><p className="mt-1 text-[11px] text-white/45">Select a day to view its activity</p></div>
                <div className="flex items-center gap-2">
                  <button aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="grid h-10 w-10 place-items-center rounded-lg border border-white/10"><ChevronLeft className="h-4 w-4" /></button>
                  <span className="min-w-[110px] text-center text-xs font-bold">{month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
                  <button aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="grid h-10 w-10 place-items-center rounded-lg border border-white/10"><ChevronRight className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="p-3 sm:p-5">
                <div className="grid grid-cols-7 text-center text-[9px] font-bold uppercase tracking-[0.14em] text-white/35">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <span key={day} className="py-2">{day}</span>)}</div>
                <div className="grid grid-cols-7 gap-1">
                  {monthDays.map((day, index) => {
                    if (!day) return <span key={`blank-${index}`} />;
                    const key = dateKey(new Date(month.getFullYear(), month.getMonth(), day));
                    const markers = markersFor(day);
                    return (
                      <button key={key} onClick={() => setSelectedDate(key)} className={`min-h-14 rounded-xl border p-1.5 text-left text-xs transition sm:min-h-16 sm:p-2 ${selectedDate === key ? "border-[#ff7a00]/60 bg-[#ff7a00]/12" : "border-transparent hover:border-white/10 hover:bg-white/[.03]"}`}>
                        <span>{day}</span>
                        <span className="mt-3 flex gap-1">{markers.slice(0, 3).map((marker, markerIndex) => <i key={`${marker}-${markerIndex}`} className={`h-1.5 w-1.5 rounded-full ${marker === "reminder" ? "bg-[#ff7a00]" : marker === "booking" ? "bg-emerald-400" : marker === "trip" ? "bg-violet-400" : "bg-sky-400"}`} />)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="border-t border-white/10 p-4 sm:p-5">
                <h3 className="text-sm font-bold">{formatDate(`${selectedDate}T12:00:00`, { weekday: "long", day: "numeric", month: "long" })}</h3>
                <div className="mt-3 space-y-2">
                  {dayItems.length ? dayItems.map((item) => <TimelineRow key={`${item.kind}-${item.id}`} item={item} onRemove={removeReminder} busy={busy} />) : <p className="rounded-xl bg-white/[.03] p-4 text-xs text-white/45">Nothing scheduled for this day.</p>}
                </div>
              </div>
            </Card>

            <Card>
              <div className="border-b border-white/10 p-5">
                <h2 className="font-bold">Upcoming timeline</h2>
                <div className="mt-4 flex gap-2">
                  {(["all", "booking", "reminder"] as const).map((value) => <button key={value} onClick={() => setFilter(value)} className={`min-h-9 rounded-full px-4 text-xs font-bold capitalize ${filter === value ? "bg-[#ff7a00] text-white" : "bg-white/[.05] text-white/55"}`}>{value === "booking" ? "Bookings" : `${value}s`.replace("alls", "All")}</button>)}
                </div>
              </div>
              <div className="max-h-[620px] space-y-2 overflow-y-auto p-4 sm:p-5">
                {filteredTimeline.length ? filteredTimeline.slice(0, 30).map((item) => <TimelineRow key={`${item.kind}-${item.id}`} item={item} onRemove={removeReminder} busy={busy} />) : <p className="p-6 text-center text-sm text-white/45">No upcoming items in this category.</p>}
              </div>
            </Card>
          </section>

          <Card className="mt-4 p-4 sm:p-5">
            <h2 className="font-bold">Saved to your profile</h2>
            <p className="mt-1 text-xs text-white/45">Items you selected elsewhere in Gene remain selected until a booking is confirmed.</p>
            <div className="mt-4 flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {initialData.savedItems.length ? initialData.savedItems.map((item, index) => (
                <article key={item.id} className="min-w-[235px] overflow-hidden rounded-xl border border-white/10 bg-[#0b121a] sm:min-w-[270px]">
                  <div className="relative h-32"><Image src={item.imageUrl || fallbackImages[index % fallbackImages.length]} alt={item.title} fill className="object-cover" sizes="270px" /><div className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent" /></div>
                  <div className="p-4"><span className="text-[9px] font-black uppercase tracking-[.16em] text-[#ff9c43]">{item.itemType}</span><h3 className="mt-2 line-clamp-2 text-sm font-bold">{item.title}</h3><p className="mt-1 text-xs text-white/45">{item.destination || item.tripName || item.provider || "Saved travel option"}</p></div>
                </article>
              )) : <p className="py-8 text-sm text-white/45">No saved travel items yet.</p>}
            </div>
          </Card>
        </div>
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-30 flex items-center justify-around rounded-2xl border border-white/12 bg-[#0b121a]/95 p-2 shadow-2xl backdrop-blur-2xl lg:hidden">
        <Link href="/profile" className="flex min-h-11 flex-col items-center justify-center px-3 text-[10px] text-white/55"><Plane className="mb-1 h-4 w-4" />Trips</Link>
        <span className="flex min-h-11 flex-col items-center justify-center px-3 text-[10px] text-[#ff8a1d]"><CalendarDays className="mb-1 h-4 w-4" />Calendar</span>
        <button onClick={() => setDialogOpen(true)} className="flex min-h-11 flex-col items-center justify-center px-3 text-[10px] text-white/55"><Plus className="mb-1 h-4 w-4" />Reminder</button>
        <Link href="/profile#notifications" className="flex min-h-11 flex-col items-center justify-center px-3 text-[10px] text-white/55"><Bell className="mb-1 h-4 w-4" />Alerts</Link>
      </nav>

      {dialogOpen ? (
        <div role="dialog" aria-modal="true" aria-labelledby="reminder-title" className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialogOpen(false); }}>
          <form onSubmit={createReminder} className="w-full max-w-lg rounded-2xl border border-white/12 bg-[#101821] p-5 shadow-2xl sm:p-6">
            <div className="flex items-center justify-between"><div><h2 id="reminder-title" className="text-xl font-bold">Add a reminder</h2><p className="mt-1 text-xs text-white/45">Saved privately to your Gene profile.</p></div><button type="button" aria-label="Close" onClick={() => setDialogOpen(false)} className="grid h-11 w-11 place-items-center rounded-xl hover:bg-white/5"><X className="h-5 w-5" /></button></div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <input name="title" required maxLength={160} placeholder="Reminder title" className="sm:col-span-2 min-h-12 rounded-xl border border-white/10 bg-black/20 px-4 text-sm outline-none focus:border-[#ff7a00]" />
              <input name="tripName" maxLength={120} placeholder="Trip name (optional)" className="min-h-12 rounded-xl border border-white/10 bg-black/20 px-4 text-sm outline-none focus:border-[#ff7a00]" />
              <select name="type" className="min-h-12 rounded-xl border border-white/10 bg-[#0b121a] px-4 text-sm outline-none focus:border-[#ff7a00]"><option value="custom">Custom</option><option value="flight">Flight</option><option value="hotel">Hotel</option><option value="activity">Activity</option><option value="transportation">Transport</option><option value="passport">Passport</option><option value="visa">Visa</option></select>
              <input name="date" type="date" required defaultValue={selectedDate} className="min-h-12 rounded-xl border border-white/10 bg-black/20 px-4 text-sm outline-none focus:border-[#ff7a00]" />
              <input name="time" type="time" defaultValue="09:00" className="min-h-12 rounded-xl border border-white/10 bg-black/20 px-4 text-sm outline-none focus:border-[#ff7a00]" />
              <textarea name="notes" maxLength={1000} placeholder="Notes (optional)" className="sm:col-span-2 min-h-24 rounded-xl border border-white/10 bg-black/20 p-4 text-sm outline-none focus:border-[#ff7a00]" />
            </div>
            <button disabled={busy} className="mt-4 min-h-12 w-full rounded-xl bg-[#ff7a00] text-sm font-black text-white disabled:opacity-50">{busy ? "Saving..." : "Save reminder"}</button>
          </form>
        </div>
      ) : null}
    </main>
  );
}

function TimelineRow({ item, onRemove, busy }: { item: TimelineItem; onRemove: (id: string) => void; busy: boolean }) {
  const icon = item.kind === "booking" || item.kind === "trip" ? <Plane className="h-4 w-4" /> : item.kind === "reminder" ? <Bell className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />;
  const color = item.kind === "booking" ? "bg-emerald-400/12 text-emerald-300" : item.kind === "trip" ? "bg-violet-400/12 text-violet-300" : item.kind === "reminder" ? "bg-[#ff7a00]/12 text-[#ffae64]" : "bg-sky-400/12 text-sky-300";
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/[.06] bg-white/[.025] p-3">
      <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${color}`}>{icon}</div>
      <div className="min-w-0 flex-1"><div className="truncate text-sm font-bold">{item.title}</div><div className="mt-1 truncate text-[11px] text-white/45">{formatDate(item.date)} · {item.subtitle}</div></div>
      <span className={`hidden rounded-full px-2 py-1 text-[9px] font-black sm:block ${color}`}>{item.status}</span>
      {item.kind === "reminder" ? <button disabled={busy} onClick={() => onRemove(item.id)} aria-label={`Remove ${item.title}`} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-white/40 hover:bg-red-400/10 hover:text-red-300"><Trash2 className="h-4 w-4" /></button> : null}
    </div>
  );
}
