import Image from "next/image";
import Link from "next/link";
import { Bell, CalendarDays, CheckCircle2, Coins, FileText, Headphones, Heart, LockKeyhole, Settings2, Tag } from "lucide-react";
import ProfileActionPanel from "./ProfileActionPanel";
import ProfileChecklist from "./ProfileChecklist";
import ProfileFavoritesClient from "./ProfileFavoritesClient";

const sectionMeta: Record<string, { title: string; subtitle: string; icon: any }> = {
  favorites: { title: "Favourite Plans", subtitle: "The places and plans you saved, ready when you are.", icon: Heart },
  credits: { title: "My Credits", subtitle: "Your current balance, plan access, and credit activity.", icon: Coins },
  offers: { title: "Special Offers", subtitle: "Real offers selected for your travel preferences.", icon: Tag },
  checklist: { title: "Travel Checklist", subtitle: "Pack with confidence and keep every essential in one place.", icon: CheckCircle2 },
  calendar: { title: "Calendar of the Year", subtitle: "See your trips and reminders across the year.", icon: CalendarDays },
  preferences: { title: "Travel Preferences", subtitle: "Help Gene make every recommendation feel more personal.", icon: Settings2 },
  documents: { title: "Travel Documents", subtitle: "Keep your travel documents organized and easy to find.", icon: FileText },
  notifications: { title: "Notifications", subtitle: "Your latest account and travel updates.", icon: Bell },
  support: { title: "Support", subtitle: "Get help with your account, planning, or bookings.", icon: Headphones },
  security: { title: "Account & Security", subtitle: "Review your sign-in status and account protection.", icon: LockKeyhole },
};

function Empty({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.035] p-8 text-center text-sm leading-6 text-white/58"><p>{children}</p>{action ? <div className="mt-5">{action}</div> : null}</div>;
}

function money(value: unknown, currency = "USD") {
  const number = Number(value);
  return Number.isFinite(number) ? new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(number) : null;
}

function date(value?: string | Date | null) {
  if (!value) return "Date not set";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Date not set" : parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function CalendarView({ data }: { data: any }) {
  const now = new Date();
  const year = now.getFullYear();
  const entries = [
    ...(data.confirmedTrips || []).map((trip: any) => ({ id: `trip-${trip.id}`, title: trip.title, type: "Trip", when: trip.startDate || trip.createdAt, href: `/plan-summary/${trip.id}` })),
    ...(data.travelReminders || []).map((reminder: any) => ({ id: `reminder-${reminder.id}`, title: reminder.title, type: "Reminder", when: reminder.reminderDate, href: "/profile/bookings-reminders" })),
  ].filter((entry: any) => entry.when);
  return <div className="space-y-5"><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 12 }, (_, month) => { const count = entries.filter((entry: any) => { const d = new Date(entry.when); return d.getFullYear() === year && d.getMonth() === month; }).length; return <div key={month} className={`rounded-2xl border p-4 ${count ? "border-[#ff7a00]/45 bg-[#ff7a00]/8" : "border-white/10 bg-white/[0.035]"}`}><div className="text-sm font-bold">{new Date(year, month, 1).toLocaleDateString("en-US", { month: "long" })}</div><div className="mt-7 text-xs text-white/48">{count ? `${count} travel ${count === 1 ? "item" : "items"}` : "No plans yet"}</div></div>; })}</div><section className="rounded-2xl border border-white/10 bg-[#101c27]/78 p-5"><h2 className="text-lg font-bold">Travel dates</h2><div className="mt-4 space-y-2">{entries.length ? entries.map((entry: any) => <Link key={entry.id} href={entry.href} className="flex items-center justify-between gap-4 rounded-xl border border-white/8 bg-black/20 p-4 transition hover:border-[#ff7a00]/40"><div><span className="text-[10px] font-bold uppercase tracking-[.18em] text-[#ff9b43]">{entry.type}</span><p className="mt-1 font-semibold">{entry.title}</p></div><span className="shrink-0 text-xs text-white/55">{date(entry.when)}</span></Link>) : <Empty>Add a trip or reminder and it will appear here automatically.</Empty>}</div></section></div>;
}

export default function ProfileSectionView({ section, data }: { section: string; data: any }) {
  const meta = sectionMeta[section] || sectionMeta.favorites;
  const Icon = meta.icon;
  const usage = data.usage || {};
  const preference = data.travelPreference || null;
  if (section === "checklist") {
    return <ProfileChecklist preference={preference} trips={data.confirmedTrips || []} />;
  }
  return <>
    <header className="mb-6 flex items-start gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#ff7a00]/30 bg-[#ff7a00]/10 text-[#ff7a00] shadow-[0_0_28px_rgba(255,122,0,.12)]"><Icon className="h-6 w-6" /></span><div><h1 className="text-2xl font-black sm:text-3xl">{meta.title}</h1><p className="mt-1 max-w-2xl text-sm leading-6 text-white/55">{meta.subtitle}</p></div></header>
    {section === "favorites" ? <ProfileFavoritesClient favoritePlans={data.favoritePlans} savedReadyPlans={data.savedReadyPlans} favoriteDestinations={data.favoriteDestinations} wishlistItems={data.wishlistItems} /> : null}
    {section === "calendar" ? <CalendarView data={data} /> : null}
    {section === "credits" ? <div className="grid gap-4 lg:grid-cols-[.8fr,1.2fr]"><section className="rounded-2xl border border-[#ff7a00]/25 bg-[linear-gradient(135deg,rgba(255,122,0,.14),rgba(16,28,39,.85))] p-6"><p className="text-sm text-white/60">Available planning credits</p><p className="mt-3 text-5xl font-black">{Number(usage.mainCreditsRemaining || 0)}</p><p className="mt-3 text-sm capitalize text-white/68">{usage.tier || "free"} plan · {usage.status || "NONE"}</p><Link href="/pricing" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-[#ff7a00] px-5 text-sm font-bold">View plans</Link></section><section className="rounded-2xl border border-white/10 bg-[#101c27]/78 p-5"><h2 className="text-lg font-bold">Credit activity</h2><div className="mt-4 space-y-2">{(data.creditLedger || []).length ? data.creditLedger.map((entry: any) => <div key={entry.id} className="flex items-center justify-between rounded-xl border border-white/8 bg-black/20 p-4"><div><p className="font-semibold">{entry.reason || entry.type || "Credit update"}</p><p className="mt-1 text-xs text-white/48">{date(entry.createdAt)}</p></div><strong className={Number(entry.amount || entry.delta || 0) >= 0 ? "text-emerald-300" : "text-[#ff9b43]"}>{Number(entry.amount || entry.delta || 0) > 0 ? "+" : ""}{Number(entry.amount || entry.delta || 0)}</strong></div>) : <Empty>No credit activity yet.</Empty>}</div></section></div> : null}
    {section === "offers" ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{(data.personalizedOffers || []).length ? data.personalizedOffers.map((offer: any, index: number) => <Link key={offer.id} href={offer.href || `/offers/${offer.slug || offer.id}`} className="group overflow-hidden rounded-2xl border border-white/10 bg-[#101c27]/78 transition hover:border-[#ff7a00]/45"><div className="relative h-44"><Image src={offer.imageUrl || offer.image || "/bg/home-hero-bottom-optimized.jpg"} alt="" fill className="object-cover transition duration-500 group-hover:scale-105" sizes="(max-width:768px) 100vw, 420px" /><div className="absolute inset-0 bg-gradient-to-t from-[#07111a] to-transparent" /></div><div className="p-5"><h2 className="text-lg font-bold">{offer.title}</h2>{offer.destination ? <p className="mt-1 text-sm text-white/55">{offer.destination}</p> : null}{money(offer.priceFrom || offer.price, offer.currency) ? <p className="mt-4 font-bold text-[#ff9b43]">From {money(offer.priceFrom || offer.price, offer.currency)}</p> : null}<span className="mt-4 inline-flex text-sm font-bold text-white">View offer</span></div></Link>) : <div className="sm:col-span-2 xl:col-span-3"><Empty action={<Link href="/offers" className="inline-flex min-h-11 items-center rounded-xl bg-[#ff7a00] px-5 font-bold text-white">Explore all offers</Link>}>No personalized offers are available yet.</Empty></div>}</div> : null}
    {section === "notifications" ? <div className="space-y-3">{(data.notifications || []).length ? data.notifications.map((item: any) => <div key={item.id} className="rounded-2xl border border-white/10 bg-[#101c27]/78 p-5"><div className="flex gap-3"><Bell className="mt-0.5 h-5 w-5 shrink-0 text-[#ff7a00]" /><div><h2 className="font-bold">{item.title || "Travel update"}</h2><p className="mt-1 text-sm leading-6 text-white/58">{item.message || item.body}</p><p className="mt-2 text-xs text-white/38">{date(item.createdAt)}</p></div></div></div>) : <Empty>You are all caught up.</Empty>}</div> : null}
    {(section === "preferences" || section === "documents" || section === "support") ? <ProfileActionPanel travelPreference={preference} mode={section} /> : null}
    {section === "security" ? <div className="grid gap-4 md:grid-cols-2"><section className="rounded-2xl border border-white/10 bg-[#101c27]/78 p-6"><h2 className="font-bold">Sign-in identity</h2><p className="mt-4 break-all text-sm text-white/70">{data.profile?.email || "Email unavailable"}</p><p className="mt-2 text-sm text-white/50">Provider: {data.auth?.provider || data.profile?.provider || "Email"}</p></section><section className="rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-6"><h2 className="font-bold">Account protection</h2><p className="mt-4 text-sm leading-6 text-white/60">Your profile is private to your authenticated account. Signing out securely ends this browser session without deleting your data.</p><Link href="/api/auth/logout" className="mt-5 inline-flex min-h-11 items-center rounded-xl border border-white/18 px-5 text-sm font-bold">Sign out</Link></section></div> : null}
  </>;
}
