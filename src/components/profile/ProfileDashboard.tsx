import Image from "next/image";
import Link from "next/link";
import {
  Bell,
  BookOpen,
  CalendarDays,
  ChevronRight,
  Coins,
  FileText,
  Gift,
  Headphones,
  Heart,
  Map,
  MapPin,
  Plane,
  Settings2,
  ShieldCheck,
  Sparkles,
  Tag,
  User,
} from "lucide-react";
import ProfileActionPanel from "./ProfileActionPanel";
import ProfileFavoritesClient from "./ProfileFavoritesClient";
import ProfileSectionTracker from "./ProfileSectionTracker";
import ProfileMobileNav from "./ProfileMobileNav";
import ProfileSidebarNav from "./ProfileSidebarNav";
import GeneLogo from "@/components/brand/GeneLogo";
import GlobalSearch from "@/components/search/GlobalSearch";
import ProfileYearTools from "./ProfileYearTools";

type Props = {
  data: any;
};

const fallbackImages = [
  "/images/Santorini.avif",
  "/images/Norway.avif",
  "/images/Maldives.jfif",
  "/images/china.jpg",
  "/bg/home-hero-bottom-optimized.jpg",
];

function formatDate(value?: string | Date | null) {
  if (!value) return "Open access";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Coming soon";
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function firstName(name?: string | null, email?: string | null) {
  return (name || email?.split("@")[0] || "Traveler").split(" ")[0];
}

function imageFor(index: number, provided?: string | null) {
  return provided || fallbackImages[index % fallbackImages.length];
}

function GlassCard({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }) {
  return (
    <div
      {...props}
      className={`border border-white/10 bg-[#101c27]/78 shadow-[0_22px_70px_rgba(0,0,0,0.35)] backdrop-blur-2xl ${className}`}
    >
      {children}
    </div>
  );
}

function StatCard({
  icon: Icon,
  iconClass,
  title,
  value,
  note,
  progress,
  href,
}: {
  icon: any;
  iconClass: string;
  title: string;
  value: string;
  note?: string;
  progress?: number;
  href?: string;
}) {
  const content = (
    <GlassCard className={`relative h-full rounded-2xl p-3 sm:p-5 ${href ? "transition hover:border-[#ff7a00]/45 hover:bg-[#142331]/90" : ""}`}>
      <div className="flex h-full min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full sm:h-12 sm:w-12 ${iconClass}`}>
          <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[11px] text-white/80 sm:text-sm">{title}</div>
          <div className="mt-1 text-2xl font-bold leading-none text-white sm:text-3xl">{value}</div>
          {progress !== undefined ? (
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/12">
              <div
                className="h-full rounded-full bg-[#ff7a00]"
                style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
              />
            </div>
          ) : note ? (
            <div className="mt-2 truncate text-[11px] text-[#8ccfff] sm:text-sm">{note}</div>
          ) : null}
        </div>
        <ChevronRight className="absolute right-3 top-3 h-4 w-4 text-white/45 sm:static sm:h-5 sm:w-5 sm:text-white/60" />
      </div>
    </GlassCard>
  );
  return href ? <Link href={href} className="block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7a00]">{content}</Link> : content;
}

function TripCard({ trip, index }: { trip: any; index: number }) {
  const title = trip?.title || "Untitled trip";
  const destination = trip?.destination || "Destination not set";

  return (
    <Link
      href={trip?.id ? `/plan-summary/${trip.id}` : "/ready-plans"}
      className="group overflow-hidden rounded-2xl border border-white/10 bg-[#111b25] transition hover:border-[#ff7a00]/45"
    >
      <div className="relative h-36">
        <Image
          src={imageFor(index)}
          alt={title}
          fill
          className="object-cover transition duration-700 group-hover:scale-105"
          sizes="(max-width: 768px) 90vw, 360px"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/78" />
        <div className="absolute bottom-4 left-4 rounded-lg bg-black/65 px-3 py-2 text-sm text-white">
          {formatDate(trip?.createdAt)}
        </div>
      </div>
      <div className="p-4">
        <div className="text-base font-bold text-white">{title}</div>
        <div className="mt-2 flex flex-wrap gap-4 text-xs text-white/70">
          <span>{destination}</span>
          <span>2 travelers</span>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <span className="rounded-full bg-emerald-500/18 px-3 py-1 text-xs font-semibold text-emerald-300">
            Confirmed
          </span>
          <ChevronRight className="h-5 w-5 text-white/70" />
        </div>
      </div>
    </Link>
  );
}

function QuickAction({ icon: Icon, title, note, href, color }: { icon: any; title: string; note: string; href: string; color: string }) {
  return (
    <Link
      href={href}
      className="flex min-h-[126px] flex-col items-center justify-center rounded-xl border border-white/10 bg-white/[0.045] p-4 text-center transition hover:border-[#ff7a00]/45 hover:bg-white/[0.07]"
    >
      <Icon className={`h-9 w-9 ${color}`} />
      <div className="mt-4 text-sm font-semibold text-white">{title}</div>
      <div className="mt-1 text-xs text-white/55">{note}</div>
    </Link>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.035] p-5 text-sm leading-6 text-white/58">
      {children}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, href }: { icon: any; title: string; href?: string }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <h2 className="flex items-center gap-3 text-xl font-bold">
        <Icon className="h-5 w-5 text-[#ff7a00]" />
        {title}
      </h2>
      {href ? (
        <Link href={href} className="text-sm text-[#8ccfff]">
          View all
        </Link>
      ) : null}
    </div>
  );
}

export default function ProfileDashboard({ data }: Props) {
  const {
    profile,
    usage,
    paidTiers = [],
    confirmedTrips = [],
    favoritePlans = [],
    savedReadyPlans = [],
    favoriteDestinations = [],
    wishlistItems = [],
    travelReminders = [],
    travelPreference = null,
    travelDocuments = [],
    supportTickets = [],
    creditLedger = [],
    personalizedOffers = [],
    bookingActivity = [],
    paymentHistory = [],
    notifications = [],
    unreadNotificationsCount = 0,
  } = data;

  const totalCredits = Number(usage?.mainCreditsTotal || usage?.mainCreditsRemaining || 0);
  const remainingCredits = Number(usage?.mainCreditsRemaining || 0);
  const creditText = usage?.tier === "free" ? "0 / 0" : `${remainingCredits} / ${totalCredits || remainingCredits}`;
  const progress = totalCredits ? (remainingCredits / totalCredits) * 100 : 0;
  const displayTrips = confirmedTrips.slice(0, 2);
  const favoriteDisplay = (favoritePlans.length ? favoritePlans : savedReadyPlans).slice(0, 4);
  const paddedFavorites = favoriteDisplay;
  const savedItemCount = favoriteDestinations.length + wishlistItems.length;
  const createPlanHref = "/profile/create-plan";

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#07111a] pb-24 text-white lg:pb-0">
      <ProfileSectionTracker />
      <div className="flex min-h-screen">
        <aside className="hidden w-[260px] shrink-0 border-r border-white/10 bg-[#07111a]/96 lg:block">
          <div className="sticky top-0 flex h-screen flex-col overflow-y-auto">
            <Link href="/" className="px-9 pb-6 pt-5">
              <GeneLogo imageClassName="h-auto w-[150px]" priority />
            </Link>

            <ProfileSidebarNav createPlanHref={createPlanHref} />

            <div className="relative mt-2 h-56 overflow-hidden">
              <Image src="/bg/home-hero-bottom-optimized.jpg" alt="" fill className="object-cover opacity-55" sizes="260px" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#07111a] via-transparent to-[#07111a]/20" />
              <div className="absolute left-8 top-8 font-serif text-3xl italic leading-tight text-white">
                Good<br />Trips<br />Better<br />Stories
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 border-b border-white/10 bg-[#07111a]/80 backdrop-blur-xl">
            <div className="flex h-[62px] items-center gap-3 px-3 sm:h-[68px] sm:px-5 lg:h-[74px] lg:px-8">
              <Link href="/" className="lg:hidden">
                <GeneLogo imageClassName="h-auto w-[118px]" />
              </Link>
              <nav className="hidden flex-1 justify-center gap-9 text-sm font-medium text-white/86 md:flex">
                <Link href="/">Explore</Link>
                <Link href="/ready-plans">Ready Plans</Link>
                <Link href={createPlanHref}>Create Plan</Link>
                <Link href="/destinations">Destinations</Link>
                <Link href="/offers">Offers</Link>
              </nav>
              <div className="ml-auto flex items-center gap-4">
                <div className="hidden md:block">
                  <GlobalSearch scope="profile" placeholder="Search your trips, favorites, reminders..." />
                </div>
                <a className="relative" href="#notifications" aria-label="Open notifications">
                  <Bell className="h-5 w-5 text-white/82" />
                  {unreadNotificationsCount > 0 ? (
                    <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ff7a00] px-1 text-[10px] font-bold text-white">
                      {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
                    </span>
                  ) : null}
                </a>
                <div className="relative h-11 w-11 overflow-hidden rounded-full border border-white/18 bg-white/10">
                  {profile?.avatarUrl ? (
                    <Image src={profile.avatarUrl} alt={profile.fullName || "Profile"} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#ff7a00] font-bold text-black">
                      {firstName(profile?.fullName, profile?.email).slice(0, 1)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          <section id="profile-overview" className="relative min-h-[250px] scroll-mt-24 overflow-hidden">
            <Image
              src="/bg/home-hero-bottom-optimized.jpg"
              alt="Profile cover"
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#07111a] via-[#07111a]/45 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#07111a] via-transparent to-transparent" />
            <div className="relative mx-auto flex max-w-7xl items-center px-4 py-8 sm:px-5 sm:py-10 lg:px-8 lg:py-12">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
                <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-white/22 bg-[#ff7a00] shadow-[0_24px_70px_rgba(0,0,0,0.45)] sm:h-28 sm:w-28 lg:h-32 lg:w-32">
                  {profile?.avatarUrl ? (
                    <Image src={profile.avatarUrl} alt={profile.fullName || "Profile"} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-5xl font-black text-black">
                      {firstName(profile?.fullName, profile?.email).slice(0, 1)}
                    </div>
                  )}
                  <div className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-[#07111a] text-white">
                    <User className="h-4 w-4" />
                  </div>
                </div>
                <div className="pb-2">
                  <h1 className="text-2xl font-black sm:text-3xl md:text-4xl">{profile?.fullName || firstName(profile?.fullName, profile?.email)}</h1>
                  <p className="mt-2 text-sm text-white/88 sm:text-base">
                    Explorer <span className="px-2 text-white/45">•</span> Travel Lover <span className="px-2 text-white/45">•</span> Better Stories Ahead
                  </p>
                  <Link
                    href="#profile-tools"
                    className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-[#13202d]/82 px-5 py-3 text-sm font-semibold text-white"
                  >
                    <Settings2 className="h-4 w-4" />
                    Edit Profile
                  </Link>
                </div>
              </div>
              <div className="ml-auto hidden max-w-[190px] font-serif text-5xl italic leading-[0.95] text-white md:block">
                Collect<br />Trips<br />Not Things
              </div>
            </div>
          </section>

          <ProfileMobileNav active="profile" />

          <div className="mx-auto max-w-7xl space-y-6 px-5 pb-10 lg:px-8">
            <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
              <StatCard icon={Coins} iconClass="bg-[#ff9f1a]/18 text-[#ff9f1a]" title="Plan Credits" value={creditText} progress={progress} />
              <StatCard icon={Plane} iconClass="bg-sky-400/15 text-sky-300" title="Upcoming Trips" value={String(confirmedTrips.length)} note="Open My Trips" href="/profile/trips" />
              <StatCard icon={Heart} iconClass="bg-rose-400/15 text-rose-300" title="Favorite Plans" value={String(favoritePlans.length || savedReadyPlans.length)} note="View all" />
              <StatCard icon={BookOpen} iconClass="bg-emerald-400/15 text-emerald-300" title="Saved Items" value={String(savedItemCount)} note="View all" />
            </section>

            <GlassCard id="profile-tools" className="scroll-mt-24 rounded-2xl p-4 sm:p-5">
              <SectionHeader icon={Gift} title="Profile Tools" />
              <ProfileActionPanel travelPreference={travelPreference} />
            </GlassCard>

            <section className="grid gap-5 xl:grid-cols-[1.35fr,0.72fr]">
              <GlassCard id="my-trips" className="scroll-mt-24 rounded-2xl p-5">
                <SectionHeader icon={Plane} title="My Trips" href="/profile/trips" />
                {displayTrips.length === 0 ? (
                  <EmptyState>No trips yet. Your saved AI plans and confirmed itineraries will appear here.</EmptyState>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {displayTrips.map((trip: any, index: number) => <TripCard key={trip.id} trip={trip} index={index} />)}
                  </div>
                )}
              </GlassCard>

              <GlassCard className="rounded-2xl p-5">
                <h2 className="flex items-center gap-3 text-xl font-bold"><Sparkles className="h-6 w-6" /> Quick Actions</h2>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <QuickAction icon={Sparkles} title="Create a New Plan" note="Let AI plan for you" href={createPlanHref} color="text-[#ffb13b]" />
                  <QuickAction icon={Map} title="Explore Ready Plans" note="Get inspired" href="/ready-plans" color="text-sky-300" />
                  <QuickAction icon={Plane} title="Find Flight Deals" note="Best prices" href="/offers" color="text-emerald-300" />
                  <QuickAction icon={MapPin} title="Discover Destinations" note="Trending places" href="/destinations" color="text-rose-300" />
                </div>
              </GlassCard>
            </section>

            <section className="grid gap-5 xl:grid-cols-[1.15fr,0.48fr]">
              <ProfileFavoritesClient
                favoritePlans={favoritePlans}
                savedReadyPlans={savedReadyPlans}
                favoriteDestinations={favoriteDestinations}
                wishlistItems={wishlistItems}
              />
              <GlassCard id="bookings-reminders" className="scroll-mt-24 rounded-2xl p-5">
                <SectionHeader icon={CalendarDays} title="Bookings & Reminders" href="/profile/bookings-reminders" />
                <div className="space-y-3">
                  {travelReminders.length === 0 ? (
                    <EmptyState>No reminders yet. Add one when you want Gene to keep a trip task visible here.</EmptyState>
                  ) : (
                    travelReminders.slice(0, 3).map((reminder: any) => (
                      <div key={reminder.id} className="flex items-center gap-3 rounded-xl p-2 hover:bg-white/[0.04]">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ff7a00]/18 text-[#ffb36c]">
                          <CalendarDays className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold text-white">{reminder.title}</div>
                          <div className="text-xs text-white/55">{formatDate(reminder.reminderDate)}</div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-white/55" />
                      </div>
                    ))
                  )}
                  <Link href="/profile/bookings-reminders" className="flex items-center gap-3 rounded-xl p-2 text-[#8ccfff]">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-400/18 text-xl">+</span>
                    Add a reminder
                  </Link>
                  {bookingActivity.length ? (
                    <div className="border-t border-white/10 pt-3">
                      <div className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-white/45">Recent booking clicks</div>
                      {bookingActivity.slice(0, 3).map((click: any) => (
                        <div key={click.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                          <span className="truncate text-white/80">{click.itemName}</span>
                          <span className="shrink-0 text-xs text-white/45">{formatDate(click.clickedAt)}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </GlassCard>
            </section>

            <ProfileYearTools
              confirmedTrips={confirmedTrips}
              reminders={travelReminders}
              favoritePlansCount={favoritePlans.length || savedReadyPlans.length}
              favoriteDestinationsCount={favoriteDestinations.length}
            />

            <section className="grid gap-5 xl:grid-cols-2">
              <GlassCard id="my-credits" className="scroll-mt-24 rounded-2xl p-5">
                <SectionHeader icon={Coins} title="My Credits" />
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-white/[0.045] p-4">
                    <div className="text-xs text-white/55">Main credits</div>
                    <div className="mt-2 text-2xl font-black text-white">{remainingCredits}</div>
                  </div>
                  <div className="rounded-xl bg-white/[0.045] p-4">
                    <div className="text-xs text-white/55">Edit credits</div>
                    <div className="mt-2 text-2xl font-black text-white">{usage?.editCreditsRemaining ?? 0}</div>
                  </div>
                  <div className="rounded-xl bg-white/[0.045] p-4">
                    <div className="text-xs text-white/55">Plan</div>
                    <div className="mt-2 text-2xl font-black capitalize text-white">{usage?.tier ?? "free"}</div>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {creditLedger.length === 0 ? (
                    <EmptyState>No credit activity yet. Purchases and AI usage will appear here automatically.</EmptyState>
                  ) : (
                    creditLedger.slice(0, 5).map((entry: any) => (
                      <div key={entry.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.035] px-4 py-3 text-sm">
                        <span className="truncate text-white/80">{entry.reason || entry.actionType || entry.type}</span>
                        <span className="shrink-0 font-bold text-[#ffb36c]">{entry.amount > 0 ? "+" : ""}{entry.amount}</span>
                      </div>
                    ))
                  )}
                </div>
              </GlassCard>

              <GlassCard id="travel-preferences" className="scroll-mt-24 rounded-2xl p-5">
                <SectionHeader icon={Settings2} title="Travel Preferences" />
                {!travelPreference ? (
                  <EmptyState>No preferences saved yet. Gene will fill this from your AI planner choices and profile edits.</EmptyState>
                ) : (
                  <div className="space-y-4 text-sm">
                    <div>
                      <div className="text-white/45">Travel styles</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(travelPreference.travelStyles || []).length ? travelPreference.travelStyles.map((style: string) => (
                          <span key={style} className="rounded-full bg-[#ff7a00]/18 px-3 py-1 text-xs font-semibold text-[#ffb36c]">{style}</span>
                        )) : <span className="text-white/60">Not set</span>}
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-white/[0.04] p-3">
                        <div className="text-white/45">Budget</div>
                        <div className="mt-1 text-white">{travelPreference.preferredBudgetMin || travelPreference.preferredBudgetMax ? `${travelPreference.preferredCurrency || "USD"} ${travelPreference.preferredBudgetMin || 0} - ${travelPreference.preferredBudgetMax || "Open"}` : "Not set"}</div>
                      </div>
                      <div className="rounded-xl bg-white/[0.04] p-3">
                        <div className="text-white/45">Pace</div>
                        <div className="mt-1 text-white">{travelPreference.activityIntensity || "Not set"}</div>
                      </div>
                    </div>
                  </div>
                )}
              </GlassCard>
            </section>

            <section className="grid gap-5 xl:grid-cols-2">
              <GlassCard id="travel-documents" className="scroll-mt-24 rounded-2xl p-5">
                <SectionHeader icon={FileText} title="Travel Documents" />
                {travelDocuments.length === 0 ? (
                  <EmptyState>No private travel documents saved yet. When documents are added, only metadata appears here; files stay private in storage.</EmptyState>
                ) : (
                  <div className="space-y-3">
                    {travelDocuments.slice(0, 5).map((document: any) => (
                      <div key={document.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.04] p-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-white">{document.displayName}</div>
                          <div className="text-xs uppercase tracking-[0.14em] text-white/45">{document.type}</div>
                        </div>
                        <div className="shrink-0 text-xs text-white/55">{document.expiryDate ? formatDate(document.expiryDate) : "No expiry"}</div>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>

              <GlassCard id="notifications" className="scroll-mt-24 rounded-2xl p-5">
                <SectionHeader icon={Bell} title="Notifications" />
                {notifications.length === 0 ? (
                  <EmptyState>No notifications yet. Trip reminders, credit updates and support responses will appear here.</EmptyState>
                ) : (
                  <div className="space-y-3">
                    {notifications.slice(0, 6).map((notification: any) => {
                      const isUnread = !notification.readAt && notification.status !== "READ";
                      return (
                        <div key={notification.id} className="rounded-xl border border-white/8 bg-white/[0.04] p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                {isUnread ? <span className="h-2 w-2 rounded-full bg-[#ff7a00]" /> : null}
                                <div className="truncate text-sm font-semibold text-white">{notification.title}</div>
                              </div>
                              {notification.message ? (
                                <div className="mt-1 line-clamp-2 text-xs leading-5 text-white/58">{notification.message}</div>
                              ) : null}
                            </div>
                            <div className="shrink-0 text-xs text-white/45">{formatDate(notification.createdAt)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </GlassCard>
            </section>

            <section className="grid gap-5 xl:grid-cols-2">
              <GlassCard id="support" className="scroll-mt-24 rounded-2xl p-5">
                <SectionHeader icon={Headphones} title="Support" />
                {supportTickets.length === 0 ? (
                  <EmptyState>No support tickets yet. Messages sent from this profile will connect to the admin support dashboard.</EmptyState>
                ) : (
                  <div className="space-y-3">
                    {supportTickets.slice(0, 5).map((ticket: any) => (
                      <div key={ticket.id} className="rounded-xl bg-white/[0.04] p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="truncate text-sm font-semibold text-white">{ticket.subject || "Support request"}</div>
                          <span className="rounded-full bg-[#ff7a00]/15 px-2 py-1 text-[10px] font-bold text-[#ffb36c]">{ticket.status}</span>
                        </div>
                        <div className="mt-1 text-xs text-white/50">{formatDate(ticket.createdAt)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>

              <GlassCard id="account-security" className="scroll-mt-24 rounded-2xl p-5">
                <SectionHeader icon={ShieldCheck} title="Account & Security" />
                <div className="space-y-3 text-sm">
                  <div className="rounded-xl bg-white/[0.04] p-4">
                    <div className="text-xs uppercase tracking-[0.16em] text-white/45">Account email</div>
                    <div className="mt-2 break-words font-semibold text-white">{profile?.email || "Not available"}</div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-white/[0.04] p-4">
                      <div className="text-xs uppercase tracking-[0.16em] text-white/45">Role</div>
                      <div className="mt-2 font-semibold text-white">{profile?.role || "USER"}</div>
                    </div>
                    <div className="rounded-xl bg-white/[0.04] p-4">
                      <div className="text-xs uppercase tracking-[0.16em] text-white/45">Member since</div>
                      <div className="mt-2 font-semibold text-white">{formatDate(profile?.createdAt)}</div>
                    </div>
                  </div>
                  <Link href="/api/auth/logout" className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/16 px-5 text-sm font-semibold text-white/86 transition hover:border-[#ff7a00]/45 hover:text-white">
                    Log out securely
                  </Link>
                </div>
              </GlassCard>
            </section>

            <GlassCard id="special-offers" className="scroll-mt-24 rounded-2xl p-5">
              <SectionHeader icon={Tag} title="Special Offers" href="/offers" />
              {personalizedOffers.length === 0 ? (
                <EmptyState>No live offers are published right now. New active offers from the admin dashboard will appear here automatically.</EmptyState>
              ) : (
                <div className="flex gap-4 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {personalizedOffers.slice(0, 8).map((offer: any, index: number) => (
                    <a
                      key={offer.id}
                      href={offer.bookingHref}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      className="group min-w-[220px] overflow-hidden rounded-xl border border-white/10 bg-[#111b25]"
                    >
                      <div className="relative h-32">
                        <Image src={imageFor(index + 3, offer.imageUrl || offer.iconUrl)} alt={offer.title} fill className="object-cover transition duration-700 group-hover:scale-105" sizes="240px" />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/82" />
                        {offer.discountBadge ? (
                          <span className="absolute left-3 top-3 rounded-full bg-[#ff7a00] px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white">
                            {offer.discountBadge}
                          </span>
                        ) : null}
                      </div>
                      <div className="p-3">
                        <div className="line-clamp-2 text-sm font-bold text-white">{offer.title}</div>
                        <div className="mt-1 text-xs text-white/55">{offer.location || offer.country || "Gene offer"}</div>
                        <div className="mt-3 text-sm font-bold text-[#ffb36c]">{offer.startingPrice || "Book now"}</div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </GlassCard>

            <section className="grid gap-5 xl:grid-cols-[1fr,0.58fr]">
              <div className="relative min-h-[155px] overflow-hidden rounded-2xl border border-white/10">
                <Image src="/images/Norway.avif" alt="Adventure banner" fill className="object-cover" sizes="(max-width: 768px) 100vw, 760px" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/82 via-black/35 to-transparent" />
                <div className="relative p-8">
                  <h2 className="max-w-md text-2xl font-black leading-tight">Your next adventure is closer than you think.</h2>
                  <Link href="/ready-plans" className="mt-5 inline-flex rounded-full bg-[#ff7a00] px-6 py-3 text-sm font-bold text-white">
                    Explore Now <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              </div>

              <GlassCard className="relative overflow-hidden rounded-2xl p-8">
                <Image src="/bg/home-hero-bottom-optimized.jpg" alt="" fill className="object-cover opacity-30" sizes="460px" />
                <div className="relative">
                  <div className="text-4xl font-black text-[#ff7a00]">“</div>
                  <p className="mt-1 max-w-xs text-lg leading-7 text-white">
                    Travel far enough, you meet a better version of yourself.
                  </p>
                </div>
              </GlassCard>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
