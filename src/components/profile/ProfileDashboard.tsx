import Image from "next/image";
import Link from "next/link";
import {
  Bell,
  BookOpen,
  Briefcase,
  CalendarDays,
  ChevronRight,
  Coins,
  FileText,
  Gift,
  Headphones,
  Heart,
  LogOut,
  Map,
  MapPin,
  Plane,
  Search,
  Settings2,
  Sparkles,
  Tag,
  User,
} from "lucide-react";

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

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`border border-white/10 bg-[#101c27]/78 shadow-[0_22px_70px_rgba(0,0,0,0.35)] backdrop-blur-2xl ${className}`}
    >
      {children}
    </div>
  );
}

function SidebarItem({
  icon: Icon,
  label,
  active = false,
  badge,
}: {
  icon: any;
  label: string;
  active?: boolean;
  badge?: string;
}) {
  return (
    <Link
      href={label === "Log Out" ? "/api/admin/logout" : "#"}
      className={`flex items-center gap-4 rounded-xl px-5 py-4 text-sm transition ${
        active
          ? "border-l-4 border-[#ff7a00] bg-[#ff7a00]/14 text-[#ff7a00]"
          : "text-white/82 hover:bg-white/[0.06] hover:text-white"
      }`}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="flex-1">{label}</span>
      {badge ? (
        <span className="rounded-full bg-[#ff7a00] px-2 py-1 text-[10px] font-bold text-white">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}

function StatCard({
  icon: Icon,
  iconClass,
  title,
  value,
  note,
  progress,
}: {
  icon: any;
  iconClass: string;
  title: string;
  value: string;
  note?: string;
  progress?: number;
}) {
  return (
    <GlassCard className="rounded-2xl p-5">
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-full ${iconClass}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm text-white/80">{title}</div>
          <div className="mt-1 text-3xl font-bold leading-none text-white">{value}</div>
          {progress !== undefined ? (
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/12">
              <div
                className="h-full rounded-full bg-[#ff7a00]"
                style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
              />
            </div>
          ) : note ? (
            <div className="mt-2 text-sm text-[#8ccfff]">{note}</div>
          ) : null}
        </div>
        <ChevronRight className="h-5 w-5 text-white/60" />
      </div>
    </GlassCard>
  );
}

function TripCard({ trip, index }: { trip: any; index: number }) {
  const title = trip?.title || (index === 0 ? "Greece - Island Escape" : "Switzerland - Alps Adventure");
  const destination = trip?.destination || (index === 0 ? "Santorini, Greece" : "Swiss Alps");

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

function FavoriteCard({ plan, index }: { plan: any; index: number }) {
  const title = plan?.title || ["Bali - Spirit & Island Glow", "Japan - Culture & Modern Life", "Italy - Hidden Gems", "Portugal - Atlantic Charm"][index];
  const slug = plan?.slug || "";
  const img = imageFor(index + 2, plan?.coverImage || plan?.heroImage);

  return (
    <Link
      href={slug ? `/ready-plans/${slug}` : "/ready-plans"}
      className="group min-w-[190px] overflow-hidden rounded-xl border border-white/10 bg-[#111b25]"
    >
      <div className="relative h-28">
        <Image
          src={img}
          alt={title}
          fill
          className="object-cover transition duration-700 group-hover:scale-105"
          sizes="220px"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/75" />
        <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-[#ff6d8e]">
          <Heart className="h-4 w-4 fill-current" />
        </div>
      </div>
      <div className="p-3 text-sm font-semibold leading-5 text-white">{title}</div>
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

export default function ProfileDashboard({ data }: Props) {
  const {
    profile,
    usage,
    paidTiers = [],
    confirmedTrips = [],
    favoritePlans = [],
    savedReadyPlans = [],
    favoriteDestinations = [],
    travelReminders = [],
  } = data;

  const totalCredits = Number(usage?.mainCreditsTotal || usage?.mainCreditsRemaining || 0);
  const remainingCredits = Number(usage?.mainCreditsRemaining || 0);
  const creditText = usage?.tier === "free" ? "0 / 0" : `${remainingCredits} / ${totalCredits || remainingCredits}`;
  const progress = totalCredits ? (remainingCredits / totalCredits) * 100 : 0;
  const displayTrips = confirmedTrips.length ? confirmedTrips.slice(0, 2) : [{}, {}];
  const favoriteDisplay = (favoritePlans.length ? favoritePlans : savedReadyPlans).slice(0, 4);
  const paddedFavorites = favoriteDisplay.length
    ? favoriteDisplay
    : [{ title: "Bali - Spirit & Island Glow" }, { title: "Japan - Culture & Modern Life" }, { title: "Italy - Hidden Gems" }, { title: "Portugal - Atlantic Charm" }];

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#07111a] text-white">
      <div className="flex min-h-screen">
        <aside className="hidden w-[260px] shrink-0 border-r border-white/10 bg-[#07111a]/96 lg:block">
          <div className="sticky top-0 flex h-screen flex-col overflow-hidden">
            <Link href="/" className="px-9 pb-6 pt-5">
              <div className="text-4xl font-black leading-none text-[#ff7a00]">
                Gene<span className="text-white">✈</span>
              </div>
              <div className="text-xs text-white/85">Travel Smarter</div>
            </Link>

            <nav className="space-y-1 px-3">
              <SidebarItem icon={User} label="My Profile" active />
              <SidebarItem icon={Briefcase} label="My Trips" />
              <SidebarItem icon={Sparkles} label="Create a Plan" />
              <SidebarItem icon={Heart} label="Favorite Plans" />
              <SidebarItem icon={CalendarDays} label="Bookings & Reminders" />
              <SidebarItem icon={Coins} label="My Credits" />
              <SidebarItem icon={Settings2} label="Travel Preferences" />
              <SidebarItem icon={FileText} label="Travel Documents" />
              <SidebarItem icon={Tag} label="Special Offers" badge="NEW" />
              <SidebarItem icon={Headphones} label="Support" />
            </nav>

            <div className="mt-auto border-t border-white/8 px-3 pb-5 pt-4">
              <SidebarItem icon={LogOut} label="Log Out" />
            </div>

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
            <div className="flex h-[74px] items-center gap-4 px-4 lg:px-8">
              <Link href="/" className="lg:hidden">
                <div className="text-3xl font-black text-[#ff7a00]">Gene<span className="text-white">✈</span></div>
              </Link>
              <nav className="hidden flex-1 justify-center gap-9 text-sm font-medium text-white/86 md:flex">
                <Link href="/">Explore</Link>
                <Link href="/ready-plans">Ready Plans</Link>
                <Link href="/pricing">AI Planner</Link>
                <Link href="/destinations">Destinations</Link>
                <Link href="/offers">Offers</Link>
              </nav>
              <div className="ml-auto flex items-center gap-4">
                <div className="hidden h-11 w-72 items-center gap-3 rounded-full bg-white/[0.06] px-4 text-sm text-white/65 md:flex">
                  <Search className="h-5 w-5" />
                  <span>Search destinations...</span>
                </div>
                <div className="relative">
                  <Bell className="h-5 w-5 text-white/82" />
                  <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#ff7a00] text-[10px] font-bold text-white">
                    3
                  </span>
                </div>
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

          <section className="relative min-h-[250px] overflow-hidden">
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
            <div className="relative mx-auto flex max-w-7xl items-center px-5 py-12 lg:px-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
                <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-white/22 bg-[#ff7a00] shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
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
                  <h1 className="text-3xl font-black md:text-4xl">{profile?.fullName || firstName(profile?.fullName, profile?.email)}</h1>
                  <p className="mt-2 text-base text-white/88">
                    Explorer <span className="px-2 text-white/45">•</span> Travel Lover <span className="px-2 text-white/45">•</span> Better Stories Ahead
                  </p>
                  <Link
                    href="/profile"
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

          <div className="mx-auto max-w-7xl space-y-6 px-5 pb-10 lg:px-8">
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard icon={Coins} iconClass="bg-[#ff9f1a]/18 text-[#ff9f1a]" title="Plan Credits" value={creditText} progress={progress} />
              <StatCard icon={Plane} iconClass="bg-sky-400/15 text-sky-300" title="Upcoming Trips" value={String(confirmedTrips.length || 2)} note="View all" />
              <StatCard icon={Heart} iconClass="bg-rose-400/15 text-rose-300" title="Favorite Plans" value={String((favoritePlans.length || savedReadyPlans.length) || 7)} note="View all" />
              <StatCard icon={BookOpen} iconClass="bg-emerald-400/15 text-emerald-300" title="Saved Places" value={String(favoriteDestinations.length || 12)} note="View all" />
            </section>

            <section className="grid gap-5 xl:grid-cols-[1.35fr,0.72fr]">
              <GlassCard className="rounded-2xl p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="flex items-center gap-3 text-xl font-bold"><Plane className="h-6 w-6" /> Upcoming Trips</h2>
                  <Link href="/plan-summary" className="text-sm text-[#8ccfff]">View all</Link>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {displayTrips.map((trip: any, index: number) => <TripCard key={trip?.id || index} trip={trip} index={index} />)}
                </div>
              </GlassCard>

              <GlassCard className="rounded-2xl p-5">
                <h2 className="flex items-center gap-3 text-xl font-bold"><Sparkles className="h-6 w-6" /> Quick Actions</h2>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <QuickAction icon={Sparkles} title="Create a New Plan" note="Let AI plan for you" href="/pricing" color="text-[#ffb13b]" />
                  <QuickAction icon={Map} title="Explore Ready Plans" note="Get inspired" href="/ready-plans" color="text-sky-300" />
                  <QuickAction icon={Plane} title="Find Flight Deals" note="Best prices" href="/offers" color="text-emerald-300" />
                  <QuickAction icon={MapPin} title="Discover Destinations" note="Trending places" href="/destinations" color="text-rose-300" />
                </div>
              </GlassCard>
            </section>

            <section className="grid gap-5 xl:grid-cols-[1.15fr,0.48fr]">
              <GlassCard className="rounded-2xl p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="flex items-center gap-3 text-xl font-bold"><Heart className="h-5 w-5 fill-rose-300 text-rose-300" /> Favorite Plans</h2>
                  <Link href="/ready-plans" className="text-sm text-[#8ccfff]">View all</Link>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {paddedFavorites.map((plan: any, index: number) => (
                    <FavoriteCard key={plan?.id || index} plan={plan} index={index} />
                  ))}
                </div>
              </GlassCard>

              <GlassCard className="rounded-2xl p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="flex items-center gap-3 text-lg font-bold"><CalendarDays className="h-5 w-5" /> Travel Reminders</h2>
                  <Link href="/profile" className="text-sm text-[#8ccfff]">View all</Link>
                </div>
                <div className="space-y-3">
                  {(travelReminders.length ? travelReminders.slice(0, 3) : [
                    { title: "Passport expires", reminderDate: "2026-01-12", reminderType: "document" },
                    { title: "Flight to Athens", reminderDate: "2026-04-12", reminderType: "flight" },
                    { title: "Hotel check-in", reminderDate: "2026-04-12", reminderType: "hotel" },
                  ]).map((reminder: any, index: number) => (
                    <div key={reminder.id || index} className="flex items-center gap-3 rounded-xl p-2 hover:bg-white/[0.04]">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ff7a00]/18 text-[#ffb36c]">
                        <CalendarDays className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-white">{reminder.title}</div>
                        <div className="text-xs text-white/55">{formatDate(reminder.reminderDate)}</div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-white/55" />
                    </div>
                  ))}
                  <Link href="/profile" className="flex items-center gap-3 rounded-xl p-2 text-[#8ccfff]">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-400/18 text-xl">+</span>
                    Add a reminder
                  </Link>
                </div>
              </GlassCard>
            </section>

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
