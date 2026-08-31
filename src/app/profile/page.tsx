import Image from "next/image";
import Link from "next/link";
import { cookies, headers } from "next/headers";
import Navbar from "@/components/Navbar";
import { getPlanRules } from "@/lib/credits/planRules";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PaidTier = {
  id: string;
  tier: "basic" | "pro" | "agency";
  planType?: "starter" | "pro" | "agency" | null;
  status: string;
  tierActionsTotal: number;
  tierActionsUsed: number;
  mainCreditsTotal?: number;
  mainCreditsUsed?: number;
  editCreditsTotal?: number;
  editCreditsUsed?: number;
  whatIfFreeTotal?: number;
  whatIfFreeUsed?: number;
  chatMessagesTotal?: number | null;
  chatMessagesUsed?: number;
  expertReviewTotal?: number;
  expertReviewUsed?: number;
  expiresAt: string | null;
  createdAt: string;
  meta?: Record<string, unknown> | null;
};

type SavedItemRecord = {
  id: string;
  kind: "PLAN" | "READY_PLAN";
  refId: string;
  meta?: Record<string, unknown> | null;
  createdAt: string;
};

type DealRecord = {
  id: string;
  title: string;
  meta?: Record<string, unknown> | null;
  createdAt: string;
};

type FavoritePlanRecord = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  destination: string;
  daysCount: number;
  style?: string | null;
  heroImage?: string | null;
  coverImage?: string | null;
  updatedAt: string;
  favoritedAt: string;
};

type BookingClickRecord = {
  id: string;
  provider?: string | null;
  itemName: string;
  itemType?: string | null;
  destination?: string | null;
  readyPlanId?: string | null;
  readyPlanItemId?: string | null;
  clickedAt: string;
};

type BookingRecord = {
  id: string;
  provider: string;
  providerBookingId?: string | null;
  status: string;
  amount?: number | null;
  currency?: string | null;
  bookingDate?: string | null;
  travelDate?: string | null;
  createdAt: string;
};

type RecentlyViewedRecord = {
  id: string;
  entityType: string;
  entityId: string;
  viewedAt: string;
  metadata?: Record<string, unknown> | null;
};

type FavoriteDestinationRecord = {
  id: string;
  title: string;
  slug: string;
  imageUrl?: string | null;
  iconUrl?: string | null;
  section?: string | null;
  tripStyles?: string[];
  description?: string | null;
  savedAt: string;
};

type WishlistItemRecord = {
  id: string;
  tripName?: string | null;
  itemType: string;
  title: string;
  provider?: string | null;
  destination?: string | null;
  imageUrl?: string | null;
  href?: string | null;
  status: string;
  createdAt: string;
};

type TravelReminderRecord = {
  id: string;
  title: string;
  tripName?: string | null;
  reminderType: string;
  reminderDate: string;
  reminderTime?: string | null;
  notes?: string | null;
  status: string;
};

type TravelPreferenceRecord = {
  id: string;
  travelStyles: string[];
  preferredBudgetMin?: number | null;
  preferredBudgetMax?: number | null;
  preferredCurrency?: string | null;
  hotelPreference?: string | null;
  preferredTransportation?: string | null;
  preferredRegions: string[];
  activityIntensity?: string | null;
  typicalTripDuration?: string | null;
  mealPreferences: string[];
  accessibilityRequirements?: string | null;
};

type RecommendedReadyPlanRecord = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  destination: string;
  daysCount: number;
  style?: string | null;
  heroImage?: string | null;
  coverImage?: string | null;
  priceFrom?: number | null;
  currency?: string | null;
  updatedAt: string;
  recommendationScore?: number;
};

type ActivityRecord = {
  id: string;
  event: string;
  entityType?: string | null;
  entityId?: string | null;
  createdAt: string;
};

type PaymentHistoryRecord = {
  id: string;
  provider: string;
  providerPaymentId?: string | null;
  providerOrderId?: string | null;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
};

type ProfileResponse = {
  ok: true;
  profile: {
    id: string;
    role?: string | null;
    email?: string | null;
    fullName?: string | null;
    country?: string | null;
    avatarUrl?: string | null;
    createdAt: string;
  };
  usage: {
    tier: "free" | "starter" | "pro" | "agency";
    status: "NONE" | "ACTIVE" | "EXPIRED" | "CANCELLED" | "REFUNDED";
    mainCreditsTotal: number;
    mainCreditsUsed: number;
    mainCreditsRemaining: number;
    editCreditsTotal: number;
    editCreditsUsed: number;
    editCreditsRemaining: number;
    whatIfFreeRemaining: number;
    chatMessagesRemaining: number | null;
    expertReviewRemaining: number;
    expiresAt: string | null;
    features: string[];
  };
  paidTiers: PaidTier[];
  confirmedTrips: Array<{
    id: string;
    title: string;
    destination: string;
    createdAt: string;
    summaryJson?: Record<string, unknown> | null;
  }>;
  savedReadyPlans: SavedItemRecord[];
  savedItems: SavedItemRecord[];
  deals: DealRecord[];
  favoritePlans?: FavoritePlanRecord[];
  favoriteDestinations?: FavoriteDestinationRecord[];
  wishlistItems?: WishlistItemRecord[];
  travelReminders?: TravelReminderRecord[];
  travelPreference?: TravelPreferenceRecord | null;
  recommendedReadyPlans?: RecommendedReadyPlanRecord[];
  bookingActivity?: BookingClickRecord[];
  confirmedBookings?: BookingRecord[];
  recentlyViewed?: RecentlyViewedRecord[];
  activityEvents?: ActivityRecord[];
  paymentHistory?: PaymentHistoryRecord[];
};

function buildCookieHeader() {
  const store = cookies();
  const all = store.getAll();
  return all.map((c) => `${c.name}=${c.value}`).join("; ");
}

function getRequestOrigin() {
  const headerStore = headers();
  const forwardedProto = headerStore.get("x-forwarded-proto");
  const host = headerStore.get("x-forwarded-host") || headerStore.get("host");
  const protocol = forwardedProto || (host?.includes("localhost") ? "http" : "https");

  if (host) {
    return `${protocol}://${host}`.replace(/\/$/, "");
  }

  const envOrigin =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");

  return envOrigin || "http://localhost:3000";
}

async function getProfile(): Promise<ProfileResponse | null> {
  try {
    const cookieHeader = buildCookieHeader();
    const base = getRequestOrigin();
    const url = `${base}/api/profile`;

    const res = await fetch(url, {
      method: "GET",
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      cache: "no-store",
    });

    if (!res.ok) return null;

    const data = (await res.json()) as ProfileResponse;
    return data.ok ? data : null;
  } catch (error) {
    console.error("ProfilePage getProfile error", error);
    return null;
  }
}

function formatDate(value?: string | null) {
  if (!value) return "Open access";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Open access";
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatJoined(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Joined recently";
  return `Joined ${date.toLocaleDateString("en-US", { month: "long", year: "numeric" })}`;
}

function tierLabel(tier: string) {
  return tier === "agency"
    ? "Agency Pass"
    : tier === "pro"
      ? "Pro Pass"
      : tier === "basic" || tier === "starter"
        ? "Starter Pass"
        : "Explorer";
}

function tierAccent(tier: string) {
  if (tier === "agency") return "from-[#ffb86b] via-[#ff7a00] to-[#ffd39a]";
  if (tier === "pro") return "from-[#ffc369] via-[#ff7a00] to-[#ffe0b7]";
  if (tier === "basic" || tier === "starter") return "from-[#ffddb3] via-[#ff9540] to-[#ffe9cb]";
  return "from-white/70 via-white/40 to-white/20";
}

function avatarInitial(name?: string | null) {
  return (name?.trim()?.[0] || "G").toUpperCase();
}

function getMetaField(meta: Record<string, unknown> | null | undefined, key: string) {
  const value = meta?.[key];
  return typeof value === "string" ? value : null;
}

function getSavedReadyPlanCard(item: SavedItemRecord) {
  const title = getMetaField(item.meta, "title") || getMetaField(item.meta, "name") || item.refId;
  const subtitle =
    getMetaField(item.meta, "destination") ||
    getMetaField(item.meta, "subtitle") ||
    "Saved for a later cinematic escape";
  const slug = getMetaField(item.meta, "slug") || item.refId;
  const image =
    getMetaField(item.meta, "image") ||
    getMetaField(item.meta, "coverImage") ||
    getMetaField(item.meta, "heroImage") ||
    "/bg/home-hero-bottom-optimized.jpg";

  return { title, subtitle, slug, image };
}

function getFavoritePlanCard(plan: FavoritePlanRecord) {
  return {
    title: plan.title,
    subtitle: `${plan.destination}${plan.daysCount ? ` • ${plan.daysCount} days` : ""}${plan.style ? ` • ${plan.style}` : ""}`,
    slug: plan.slug,
    image: plan.coverImage || plan.heroImage || "/bg/home-hero-bottom-optimized.jpg",
  };
}

function getSavedItemCard(item: SavedItemRecord) {
  const title = getMetaField(item.meta, "title") || item.refId;
  const subtitle =
    getMetaField(item.meta, "subtitle") ||
    getMetaField(item.meta, "destination") ||
    "Saved from your planning flow";
  const href =
    item.kind === "PLAN"
      ? `/plan-summary/${item.refId}`
      : `/ready-plans/${getMetaField(item.meta, "slug") || item.refId}`;

  return { title, subtitle, href };
}

function getDealCard(deal: DealRecord) {
  const destination =
    getMetaField(deal.meta, "destination") ||
    getMetaField(deal.meta, "city") ||
    "Featured destination";
  const href =
    getMetaField(deal.meta, "href") ||
    getMetaField(deal.meta, "deeplink") ||
    "/offers";

  return { destination, href };
}

function formatMoney(amount?: number | null, currency?: string | null) {
  if (typeof amount !== "number") return "Amount pending";
  return `${currency || "USD"} ${amount.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

function getTripBudget(summaryJson: Record<string, unknown> | null | undefined) {
  const payload = summaryJson?.payload as Record<string, any> | undefined;
  const budget = payload?.summaryState?.budget;
  return budget && typeof budget === "object" ? budget : null;
}

function getTripResources(summaryJson: Record<string, unknown> | null | undefined) {
  const payload = summaryJson?.payload as Record<string, any> | undefined;
  const resources = payload?.summaryState?.resources;
  return Array.isArray(resources) ? resources : [];
}

function ProfileStat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-black/25 p-5 backdrop-blur-xl">
      <div className="text-[11px] uppercase tracking-[0.24em] text-white/45">{label}</div>
      <div className="mt-4 text-3xl font-semibold text-white">{value}</div>
      <div className="mt-2 text-sm leading-6 text-white/60">{note}</div>
    </div>
  );
}

export default async function ProfilePage() {
  const data = await getProfile();

  if (!data) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#090909] text-white">
        <div className="absolute inset-0">
          <Image
            src="/images/signup-bg-editorial.jpg"
            alt="Gene Travel account access"
            fill
            priority
            className="object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/75 to-black" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,122,0,0.18),transparent_40%)]" />
        </div>

        <Navbar />

        <section className="relative z-10 mx-auto flex min-h-screen max-w-5xl items-center px-6 pt-28 pb-12">
          <div className="w-full rounded-[34px] border border-white/12 bg-black/35 p-8 shadow-[0_30px_100px_rgba(0,0,0,0.55)] backdrop-blur-2xl md:p-10">
            <div className="text-[11px] uppercase tracking-[0.28em] text-[#ffbf82]">
              Customer Profile
            </div>
            <h1 className="mt-5 text-4xl font-semibold leading-tight md:text-5xl">
              Sign in to open your private travel profile.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/68">
              Your profile holds the pass you paid for, the remaining planning tiers, saved ready
              plans, confirmed journeys, and the next actions that continue your AI flow.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/signin?next=/profile"
                className="rounded-full bg-[linear-gradient(135deg,#ff7a00,rgba(255,208,153,0.96))] px-6 py-3 text-sm font-semibold text-black shadow-[0_16px_50px_rgba(255,122,0,0.22)]"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm text-white/85"
              >
                Create Account
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const {
    profile,
    usage,
    paidTiers,
    confirmedTrips,
    savedReadyPlans,
    savedItems,
    deals,
    favoritePlans = [],
    favoriteDestinations = [],
    wishlistItems = [],
    travelReminders = [],
    travelPreference = null,
    recommendedReadyPlans = [],
    bookingActivity = [],
    confirmedBookings = [],
    recentlyViewed = [],
    activityEvents = [],
    paymentHistory = [],
  } = data;
  const isAdminUnlimited = String(profile.role ?? "").toUpperCase() === "ADMIN";
  const isFree = usage.tier === "free";
  const joinedText = formatJoined(profile.createdAt);
  const currentTierLabel = isAdminUnlimited ? "Admin Unlimited" : tierLabel(usage.tier);
  const allowedFeatures =
    isFree ? [] : usage.features.length > 0 ? usage.features : getPlanRules(usage.tier as "starter" | "pro" | "agency").features;
  const planAllowanceText = isAdminUnlimited
    ? "All Gene features are open on this account with unlimited planning access, unlimited edit power, unlimited what-if coverage, and no traveler payment gate."
    : isFree
      ? "Unlock planning to begin using the Gene trip engine."
      : `${usage.mainCreditsRemaining} main credit${usage.mainCreditsRemaining === 1 ? "" : "s"} and ${usage.editCreditsRemaining} edit credit${usage.editCreditsRemaining === 1 ? "" : "s"} still available in your active pass.`;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080808] text-white">
      <div className="absolute inset-0">
        <Image
          src="/recommendation-bg.jpg"
          alt="Gene Travel profile background"
          fill
          priority
          className="object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,7,7,0.62)_0%,rgba(7,7,7,0.82)_26%,rgba(7,7,7,0.96)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,122,0,0.16),transparent_36%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(255,210,160,0.08),transparent_32%)]" />
      </div>

      <Navbar />

      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-16 pt-28">
        <div className="overflow-hidden rounded-[42px] border border-white/12 bg-black/30 shadow-[0_40px_120px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
          <div className="relative min-h-[420px] overflow-hidden">
            <Image
              src="/bg/home-hero-bottom-optimized.jpg"
              alt="Profile cinematic header"
              fill
              className="object-cover opacity-50"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,10,10,0.88)_0%,rgba(10,10,10,0.6)_42%,rgba(10,10,10,0.36)_100%)]" />

            <div className="relative grid gap-8 px-6 py-8 md:px-10 lg:grid-cols-[1.2fr,0.8fr] lg:px-12 lg:py-12">
              <div className="flex flex-col justify-between">
                <div>
                  <div className="inline-flex rounded-full border border-white/12 bg-white/5 px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-[#ffbf82]">
                    Private Travel Profile
                  </div>
                  <div className="mt-7 flex flex-wrap items-center gap-5">
                    <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white/10 text-3xl font-semibold shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
                      {profile.avatarUrl ? (
                        <Image
                          src={profile.avatarUrl}
                          alt={profile.fullName || "Traveler"}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className={`absolute inset-0 bg-gradient-to-br ${tierAccent(usage.tier)} opacity-90`} />
                      )}
                      {!profile.avatarUrl ? (
                        <span className="relative z-10 text-black">{avatarInitial(profile.fullName)}</span>
                      ) : null}
                    </div>

                    <div>
                      <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
                        Welcome back, {(profile.fullName || "Gene Traveler").split(" ")[0]}
                      </h1>
                      <div className="mt-2 text-xl font-semibold text-white/88">
                        Where are we going next?
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-white/72">
                        <span>{profile.email || "Private account"}</span>
                        <span className="text-white/25">•</span>
                        <span>{profile.country || "Global traveler"}</span>
                        <span className="text-white/25">•</span>
                        <span>{joinedText}</span>
                      </div>
                      {isAdminUnlimited ? (
                        <div className="mt-4 inline-flex rounded-full border border-[#ff7a00]/30 bg-[#ff7a00]/12 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#ffbf82]">
                          Admin Unlimited Access
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <p className="mt-8 max-w-2xl text-sm leading-7 text-white/68 md:text-base">
                    This is your private Gene travel hub: saved inspiration, dream destinations,
                    wishlists, reminders, confirmed journeys, and your next best route back into
                    the AI planner when your pass unlocks it.
                  </p>
                </div>

                  <div className="mt-8 flex flex-wrap gap-4">
                    <Link
                      href={isFree ? "/pricing" : "/start-planning"}
                    className="rounded-full bg-[linear-gradient(135deg,#ff7a00,rgba(255,212,165,0.96))] px-6 py-3 text-sm font-semibold text-black shadow-[0_16px_55px_rgba(255,122,0,0.24)]"
                  >
                    {isFree ? "Create Your Own Plan" : `Create Your Own Plan • ${usage.mainCreditsRemaining} credits`}
                  </Link>
                    <Link
                      href="/ready-plans"
                      className="rounded-full border border-white/18 bg-white/5 px-6 py-3 text-sm text-white/85"
                    >
                      Explore Ready Plans
                    </Link>
                    {isAdminUnlimited ? (
                      <Link
                        href="/admin"
                        className="rounded-full border border-[#ff7a00]/22 bg-[#ff7a00]/10 px-6 py-3 text-sm font-semibold text-[#ffbf82]"
                      >
                        Open Admin Dashboard
                      </Link>
                    ) : null}
                  </div>
                </div>

              <div className="grid gap-4 self-end md:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-[30px] border border-white/12 bg-black/35 p-6 backdrop-blur-xl">
                  <div className="text-[11px] uppercase tracking-[0.26em] text-white/45">
                    Active Membership
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-2xl font-semibold">{currentTierLabel}</div>
                      <div className="mt-2 text-sm leading-6 text-white/62">{planAllowanceText}</div>
                    </div>
                    <div
                      className={`rounded-full border border-white/10 bg-gradient-to-br ${tierAccent(
                        usage.tier,
                      )} px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-black`}
                    >
                      {usage.tier}
                    </div>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                      <div className="text-white/45">Main credits left</div>
                      <div className="mt-2 text-2xl font-semibold text-white">
                        {isAdminUnlimited ? "Unlimited" : usage.mainCreditsRemaining}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                      <div className="text-white/45">Edit credits left</div>
                      <div className="mt-2 text-lg font-semibold text-white">
                        {isAdminUnlimited ? "Unlimited" : usage.editCreditsRemaining}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                      <div className="text-white/45">What If left</div>
                      <div className="mt-2 text-lg font-semibold text-white">
                        {isAdminUnlimited ? "Unlimited" : usage.whatIfFreeRemaining}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                      <div className="text-white/45">{isAdminUnlimited ? "Access level" : "Valid until"}</div>
                      <div className="mt-2 text-lg font-semibold text-white">
                        {isAdminUnlimited ? "No limits" : formatDate(usage.expiresAt)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[30px] border border-white/12 bg-black/35 p-6 backdrop-blur-xl">
                  <div className="text-[11px] uppercase tracking-[0.26em] text-white/45">
                    Profile Flightpath
                  </div>
                  <div className="mt-4 space-y-3 text-sm text-white/68">
                    <div className="flex items-start gap-3">
                      <span className="mt-2 h-2 w-2 rounded-full bg-[#ff7a00]" />
                      {isAdminUnlimited
                        ? "This admin account uses the same profile surface as a traveler, but every Gene feature is unlocked."
                        : "Paid passes are now linked directly to this profile."}
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="mt-2 h-2 w-2 rounded-full bg-[#ffcb88]" />
                      {isAdminUnlimited
                        ? "AI Planner, Recommendation, Day by Day, Analysis, Booking, Summary, and advanced tools all stay open with unlimited use."
                        : "Your available AI features open according to the tier you actually purchased."}
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="mt-2 h-2 w-2 rounded-full bg-white/70" />
                      Confirmed trips and saved inspiration stay attached to the same account.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 border-t border-white/10 bg-black/30 px-6 py-6 md:grid-cols-2 xl:grid-cols-4 xl:px-12">
            <ProfileStat
              label="Paid tiers"
              value={String(paidTiers.length)}
              note="Every paid pass tied back to this profile."
            />
            <ProfileStat
              label="Confirmed trips"
              value={String(confirmedTrips.length)}
              note="Journeys you already turned into confirmed travel."
            />
            <ProfileStat
              label="Favorite plans"
              value={String(favoritePlans.length || savedReadyPlans.length)}
              note="Ready-made inspiration saved with your account."
            />
            <ProfileStat
              label="Dream destinations"
              value={String(favoriteDestinations.length)}
              note="Places saved independently from paid planning."
            />
            <ProfileStat
              label="Reminders"
              value={String(travelReminders.length)}
              note="Upcoming trip tasks and booking reminders."
            />
          </div>
        </div>

        <div className="mt-10 grid gap-8 xl:grid-cols-[1.18fr,0.82fr]">
          <div className="space-y-8">
            <section className="rounded-[34px] border border-white/10 bg-black/25 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-2xl md:p-8">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.26em] text-[#ffbf82]">
                    Confirmed Journeys
                  </div>
                  <h2 className="mt-3 text-3xl font-semibold">Trips you already locked in.</h2>
                </div>
                <Link href="/start-planning" className="text-sm text-white/70 transition hover:text-white">
                  Build another journey →
                </Link>
              </div>

              {confirmedTrips.length === 0 ? (
                <div className="mt-6 rounded-[28px] border border-dashed border-white/12 bg-white/[0.03] p-7 text-sm leading-7 text-white/60">
                  No confirmed trips yet. Once you finish a paid planning flow, this space becomes
                  your cinematic archive of real journeys.
                </div>
              ) : (
                <div className="mt-6 grid gap-4">
                  {confirmedTrips.map((trip, index) => (
                    <Link
                      key={trip.id}
                        href={`/plan-summary/${trip.id}`}
                      className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] p-5 transition hover:border-white/18"
                    >
                      <div className="absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100">
                        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,122,0,0.08),transparent_45%)]" />
                      </div>
                      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-sm font-semibold text-[#ffbf82]">
                            {String(index + 1).padStart(2, "0")}
                          </div>
                          <div>
                            <div className="text-xl font-semibold text-white">{trip.title}</div>
                            <div className="mt-2 text-sm text-white/65">{trip.destination}</div>
                            <div className="mt-3 text-[11px] uppercase tracking-[0.24em] text-white/38">
                              Confirmed {formatDate(trip.createdAt)}
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-white/65 transition group-hover:text-white">
                          Open trip →
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-[34px] border border-white/10 bg-black/25 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-2xl md:p-8">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.26em] text-[#ffbf82]">
                    Dream Destinations
                  </div>
                  <h2 className="mt-3 text-3xl font-semibold">Places your future self is circling.</h2>
                </div>
                <Link href="/destinations" className="text-sm text-white/70 transition hover:text-white">
                  Explore destinations →
                </Link>
              </div>

              {favoriteDestinations.length === 0 ? (
                <div className="mt-6 rounded-[28px] border border-dashed border-white/12 bg-white/[0.03] p-7 text-sm leading-7 text-white/60">
                  Save destinations from the public destination cards and they will become a free,
                  useful shortlist here before you ever buy a pass.
                </div>
              ) : (
                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  {favoriteDestinations.map((destination) => (
                    <Link
                      key={destination.id}
                      href={`/destinations/${destination.slug}`}
                      className="group overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.04] transition hover:border-white/18"
                    >
                      <div className="relative h-44">
                        <Image
                          src={destination.imageUrl || "/bg/home-hero-bottom-optimized.jpg"}
                          alt={destination.title}
                          fill
                          className="object-cover transition duration-700 group-hover:scale-[1.03]"
                        />
                        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(8,8,8,0.2)_34%,rgba(8,8,8,0.92)_100%)]" />
                        <div className="absolute left-4 top-4 rounded-full border border-[#ff7a00]/25 bg-[#ff7a00]/14 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#ffbf82]">
                          {destination.section || "World"}
                        </div>
                        <div className="absolute inset-x-0 bottom-0 p-5">
                          <div className="text-2xl font-semibold text-white">{destination.title}</div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {(destination.tripStyles || []).slice(0, 3).map((style) => (
                              <span key={style} className="rounded-full bg-white/10 px-3 py-1 text-[11px] text-white/70">
                                {style}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-[34px] border border-white/10 bg-black/25 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-2xl md:p-8">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.26em] text-[#ffbf82]">
                    Recommended For You
                  </div>
                  <h2 className="mt-3 text-3xl font-semibold">Rule-based picks from your travel signals.</h2>
                </div>
              </div>

              {recommendedReadyPlans.length === 0 ? (
                <div className="mt-6 rounded-[28px] border border-dashed border-white/12 bg-white/[0.03] p-7 text-sm leading-7 text-white/60">
                  Gene will recommend ready plans here after you save destinations, favorite plans,
                  or update your travel preferences.
                </div>
              ) : (
                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  {recommendedReadyPlans.map((plan) => (
                    <Link
                      key={plan.id}
                      href={`/ready-plans/${plan.slug}`}
                      className="group overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.04] transition hover:border-white/18"
                    >
                      <div className="relative h-52">
                        <Image
                          src={plan.coverImage || plan.heroImage || "/bg/home-hero-bottom-optimized.jpg"}
                          alt={plan.title}
                          fill
                          className="object-cover transition duration-700 group-hover:scale-[1.03]"
                        />
                        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(8,8,8,0.18)_38%,rgba(8,8,8,0.92)_100%)]" />
                        <div className="absolute inset-x-0 bottom-0 p-5">
                          <div className="text-[11px] uppercase tracking-[0.24em] text-[#ffbf82]">
                            {plan.destination}{plan.daysCount ? ` • ${plan.daysCount} days` : ""}
                          </div>
                          <div className="mt-3 text-2xl font-semibold text-white">{plan.title}</div>
                          <div className="mt-2 text-sm leading-6 text-white/68">
                            {plan.subtitle ||
                              plan.style ||
                              (plan.priceFrom ? `From ${plan.currency || "USD"} ${plan.priceFrom}` : "Recommended from your Gene activity.")}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-[34px] border border-white/10 bg-black/25 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-2xl md:p-8">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.26em] text-[#ffbf82]">
                    Saved Ready Plans
                  </div>
                  <h2 className="mt-3 text-3xl font-semibold">Your curated inspiration shelf.</h2>
                </div>
                <Link href="/ready-plans" className="text-sm text-white/70 transition hover:text-white">
                  Browse library →
                </Link>
              </div>

              {favoritePlans.length === 0 && savedReadyPlans.length === 0 ? (
                <div className="mt-6 rounded-[28px] border border-dashed border-white/12 bg-white/[0.03] p-7 text-sm leading-7 text-white/60">
                  You have not saved any ready plans yet. Once you save destination cards, they
                  appear here for fast return.
                </div>
              ) : (
                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  {(favoritePlans.length > 0 ? favoritePlans : savedReadyPlans).map((item: FavoritePlanRecord | SavedItemRecord) => {
                    const card = "kind" in item ? getSavedReadyPlanCard(item) : getFavoritePlanCard(item);
                    const itemDate = "favoritedAt" in item ? item.favoritedAt : item.createdAt;
                    return (
                      <Link
                        key={item.id}
                        href={`/ready-plans/${card.slug}`}
                        className="group overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.04] transition hover:border-white/18"
                      >
                        <div className="relative h-56">
                          <Image
                            src={card.image}
                            alt={card.title}
                            fill
                            className="object-cover transition duration-700 group-hover:scale-[1.03]"
                          />
                          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(8,8,8,0.2)_38%,rgba(8,8,8,0.9)_100%)]" />
                          <div className="absolute inset-x-0 bottom-0 p-5">
                            <div className="text-[11px] uppercase tracking-[0.24em] text-white/55">
                              {formatDate(itemDate)}
                            </div>
                            <div className="mt-3 text-2xl font-semibold text-white">{card.title}</div>
                            <div className="mt-2 text-sm leading-6 text-white/68">{card.subtitle}</div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="rounded-[34px] border border-white/10 bg-black/25 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-2xl md:p-8">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.26em] text-[#ffbf82]">
                    Saved Budget & Safety
                  </div>
                  <h2 className="mt-3 text-3xl font-semibold">Offline maps, alerts, and budget memory.</h2>
                </div>
              </div>

              {confirmedTrips.length === 0 ? (
                <div className="mt-6 rounded-[28px] border border-dashed border-white/12 bg-white/[0.03] p-7 text-sm leading-7 text-white/60">
                  Finalize a trip first and Gene will keep the budget breakdown plus destination resources here for later access.
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {confirmedTrips.slice(0, 3).map((trip) => {
                    const budget = getTripBudget(trip.summaryJson);
                    const resources = getTripResources(trip.summaryJson);
                    return (
                      <div key={`${trip.id}-resources`} className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
                        <div className="text-xl font-semibold text-white">{trip.title}</div>
                        <div className="mt-2 text-sm text-white/62">{trip.destination}</div>
                        {budget ? (
                          <div className="mt-5 grid gap-4 lg:grid-cols-2">
                            <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                              <div className="text-[11px] uppercase tracking-[0.18em] text-[#ffbf82]">Budget</div>
                              <div className="mt-3 space-y-2 text-sm text-white/72">
                                {Object.entries((budget as any).totals || {}).map(([key, value]) => (
                                  <div key={key} className="flex items-center justify-between gap-3">
                                    <span className="capitalize text-white/52">{key}</span>
                                    <span>{String(value)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                              <div className="text-[11px] uppercase tracking-[0.18em] text-[#ffbf82]">Resources</div>
                              <div className="mt-3 space-y-3 text-sm text-white/70">
                                {resources.length > 0 ? (
                                  resources.map((resource: any) => (
                                    <details key={resource.destinationId} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                                      <summary className="cursor-pointer list-none font-medium text-white">{resource.label}</summary>
                                      <div className="mt-3 space-y-2">
                                        {(resource.offlineMaps || []).map((map: any) => (
                                          <div key={map.key} className="flex items-center justify-between gap-3">
                                            <span>{map.title}</span>
                                            {map.href ? <a href={map.href} className="text-[#ffbf82]">Open</a> : <span className="text-white/45">Waiting for feed</span>}
                                          </div>
                                        ))}
                                        {(resource.alerts || []).map((alert: any) => (
                                          <div key={alert.id} className="text-white/62">{alert.title}</div>
                                        ))}
                                      </div>
                                    </details>
                                  ))
                                ) : (
                                  <div className="text-white/48">Resources will appear here after the destination feeds are available.</div>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-5 text-sm text-white/52">
                            Budget and offline resources will populate once this trip is resaved with the new planner flow.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          <div className="space-y-8">
            <section className="rounded-[34px] border border-white/10 bg-black/25 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-2xl md:p-8">
              <div className="text-[11px] uppercase tracking-[0.26em] text-[#ffbf82]">
                Pass History
              </div>
              <h2 className="mt-3 text-3xl font-semibold">Every paid tier tied to your account.</h2>

              {paidTiers.length === 0 ? (
                <div className="mt-6 rounded-[28px] border border-dashed border-white/12 bg-white/[0.03] p-6 text-sm leading-7 text-white/60">
                  No paid pass yet. Once you purchase from pricing, the exact tier and allowance
                  appear here automatically.
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {paidTiers.map((pass) => {
                    const normalizedTier =
                      pass.planType || (pass.tier === "agency" ? "agency" : pass.tier === "pro" ? "pro" : "starter");
                    const passRules = getPlanRules(normalizedTier);
                    const mainRemaining = Math.max(
                      0,
                      Number(pass.mainCreditsTotal ?? pass.tierActionsTotal ?? passRules.mainCreditsTotal) -
                        Number(pass.mainCreditsUsed ?? pass.tierActionsUsed ?? 0),
                    );
                    const editRemaining = Math.max(
                      0,
                      Number(pass.editCreditsTotal ?? passRules.editCreditsTotal) -
                        Number(pass.editCreditsUsed ?? 0),
                    );
                    const source = getMetaField(pass.meta, "sourcePath") || "Website checkout";

                    return (
                      <div
                        key={pass.id}
                        className="rounded-[26px] border border-white/10 bg-white/[0.04] p-5"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-3">
                              <div className="text-xl font-semibold text-white">
                                {tierLabel(normalizedTier)}
                              </div>
                              <div
                                className={`rounded-full bg-gradient-to-r px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-black ${tierAccent(
                                  normalizedTier,
                                )}`}
                              >
                                {pass.status}
                              </div>
                            </div>
                            <div className="mt-3 text-sm leading-6 text-white/62">
                              Purchased from {source} and attached directly to your profile.
                            </div>
                          </div>
                          <div className="text-right text-sm text-white/58">
                            <div>{mainRemaining} main / {editRemaining} edit left</div>
                            <div className="mt-2">{formatDate(pass.expiresAt)}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="rounded-[34px] border border-white/10 bg-black/25 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-2xl md:p-8">
              <div className="text-[11px] uppercase tracking-[0.26em] text-[#ffbf82]">
                Allowed Features
              </div>
              <h2 className="mt-3 text-3xl font-semibold">What your current pass unlocks.</h2>
              {isAdminUnlimited ? (
                <p className="mt-3 max-w-3xl text-sm leading-7 text-white/64">
                  This is the same customer profile experience, but because the signed-in account is an admin,
                  every Gene feature is open here with unlimited usage and no package restriction.
                </p>
              ) : null}

              {isFree ? (
                <div className="mt-6 rounded-[28px] border border-dashed border-white/12 bg-white/[0.03] p-6 text-sm leading-7 text-white/60">
                  No active pass yet. Choose a pricing tier to open your planning features and credits.
                </div>
              ) : (
                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  {allowedFeatures.map((feature) => (
                    <div
                      key={feature}
                      className="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/74"
                    >
                      {feature}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-[34px] border border-white/10 bg-black/25 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-2xl md:p-8">
              <div className="text-[11px] uppercase tracking-[0.26em] text-[#ffbf82]">
                Wishlist & Reminders
              </div>
              <h2 className="mt-3 text-3xl font-semibold">Free travel organization, even before checkout.</h2>

              <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <div className="rounded-[26px] border border-white/10 bg-white/[0.04] p-5">
                  <div className="text-sm font-semibold text-white">My Travel Wishlist</div>
                  <div className="mt-4 space-y-3">
                    {wishlistItems.length === 0 ? (
                      <div className="text-sm leading-6 text-white/58">
                        Save hotels, activities, destinations, and ready plans here as you explore.
                      </div>
                    ) : (
                      wishlistItems.slice(0, 6).map((item) => (
                        <a
                          key={item.id}
                          href={item.href || "/profile"}
                          className="block rounded-[20px] border border-white/8 bg-black/20 p-4 transition hover:border-white/18"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-base font-semibold text-white">{item.title}</div>
                              <div className="mt-2 text-sm text-white/60">
                                {item.destination || item.tripName || item.provider || "Saved travel idea"}
                              </div>
                            </div>
                            <span className="rounded-full bg-[#ff7a00]/12 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#ffbf82]">
                              {item.itemType.replaceAll("_", " ")}
                            </span>
                          </div>
                        </a>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-[26px] border border-white/10 bg-white/[0.04] p-5">
                  <div className="text-sm font-semibold text-white">Upcoming Reminders</div>
                  <div className="mt-4 space-y-3">
                    {travelReminders.length === 0 ? (
                      <div className="text-sm leading-6 text-white/58">
                        Add hotel, flight, visa, passport, or custom reminders to keep future trips moving.
                      </div>
                    ) : (
                      travelReminders.slice(0, 6).map((reminder) => (
                        <div key={reminder.id} className="rounded-[20px] border border-white/8 bg-black/20 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-base font-semibold text-white">{reminder.title}</div>
                              <div className="mt-2 text-sm text-white/60">
                                {reminder.tripName || reminder.reminderType} • {formatDate(reminder.reminderDate)}
                              </div>
                            </div>
                            <span className="text-xs uppercase tracking-[0.18em] text-white/42">{reminder.status}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[34px] border border-white/10 bg-black/25 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-2xl md:p-8">
              <div className="text-[11px] uppercase tracking-[0.26em] text-[#ffbf82]">
                Travel Preferences
              </div>
              <h2 className="mt-3 text-3xl font-semibold">Signals Gene can use without paid AI calls.</h2>

              {!travelPreference ? (
                <div className="mt-6 rounded-[28px] border border-dashed border-white/12 bg-white/[0.03] p-6 text-sm leading-7 text-white/60">
                  Add preferred styles, regions, budget range, hotels, transportation, food, and accessibility notes to personalize future recommendations.
                </div>
              ) : (
                <div className="mt-6 space-y-5">
                  <div>
                    <div className="text-xs uppercase tracking-[0.22em] text-white/42">Styles</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(travelPreference.travelStyles || []).length === 0 ? (
                        <span className="text-sm text-white/52">No styles saved yet.</span>
                      ) : (
                        travelPreference.travelStyles.map((style) => (
                          <span key={style} className="rounded-full border border-[#ff7a00]/20 bg-[#ff7a00]/10 px-3 py-1 text-xs text-[#ffbf82]">
                            {style}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="grid gap-3 text-sm text-white/68 sm:grid-cols-2">
                    <div className="rounded-[20px] border border-white/8 bg-white/[0.03] p-4">
                      <div className="text-white/42">Budget</div>
                      <div className="mt-2 text-white">
                        {travelPreference.preferredBudgetMin || travelPreference.preferredBudgetMax
                          ? `${travelPreference.preferredCurrency || "USD"} ${travelPreference.preferredBudgetMin || 0} - ${travelPreference.preferredBudgetMax || "open"}`
                          : "Not set"}
                      </div>
                    </div>
                    <div className="rounded-[20px] border border-white/8 bg-white/[0.03] p-4">
                      <div className="text-white/42">Pace</div>
                      <div className="mt-2 text-white">{travelPreference.activityIntensity || "Not set"}</div>
                    </div>
                    <div className="rounded-[20px] border border-white/8 bg-white/[0.03] p-4">
                      <div className="text-white/42">Hotels</div>
                      <div className="mt-2 text-white">{travelPreference.hotelPreference || "Not set"}</div>
                    </div>
                    <div className="rounded-[20px] border border-white/8 bg-white/[0.03] p-4">
                      <div className="text-white/42">Transport</div>
                      <div className="mt-2 text-white">{travelPreference.preferredTransportation || "Not set"}</div>
                    </div>
                  </div>
                </div>
              )}
            </section>

            <section className="rounded-[34px] border border-white/10 bg-black/25 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-2xl md:p-8">
              <div className="text-[11px] uppercase tracking-[0.26em] text-[#ffbf82]">
                Saved Items
              </div>
              <h2 className="mt-3 text-3xl font-semibold">Quick return to the things you chose.</h2>

              {savedItems.length === 0 ? (
                <div className="mt-6 rounded-[28px] border border-dashed border-white/12 bg-white/[0.03] p-6 text-sm leading-7 text-white/60">
                  Nothing saved yet. As customers save plans and trip pieces, those bookmarks can
                  live here.
                </div>
              ) : (
                <div className="mt-6 space-y-3">
                  {savedItems.map((item) => {
                    const card = getSavedItemCard(item);
                    return (
                      <Link
                        key={item.id}
                        href={card.href}
                        className="flex items-center justify-between gap-4 rounded-[24px] border border-white/10 bg-white/[0.04] px-5 py-4 transition hover:border-white/18"
                      >
                        <div>
                          <div className="text-base font-semibold text-white">{card.title}</div>
                          <div className="mt-2 text-sm text-white/62">{card.subtitle}</div>
                        </div>
                        <div className="text-sm text-white/55">Open →</div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="rounded-[34px] border border-white/10 bg-black/25 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-2xl md:p-8">
              <div className="text-[11px] uppercase tracking-[0.26em] text-[#ffbf82]">
                Booking Activity
              </div>
              <h2 className="mt-3 text-3xl font-semibold">Provider links opened through Gene.</h2>

              {bookingActivity.length === 0 ? (
                <div className="mt-6 rounded-[28px] border border-dashed border-white/12 bg-white/[0.03] p-6 text-sm leading-7 text-white/60">
                  No booking activity yet. When you click Book Now, Gene records the visit before sending you to the provider.
                </div>
              ) : (
                <div className="mt-6 space-y-3">
                  {bookingActivity.map((click) => (
                    <div key={click.id} className="rounded-[24px] border border-white/10 bg-white/[0.04] px-5 py-4">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <div className="text-base font-semibold text-white">{click.itemName}</div>
                          <div className="mt-2 text-sm text-white/62">
                            {click.provider || "Provider"} • {click.itemType || "booking item"}{click.destination ? ` • ${click.destination}` : ""}
                          </div>
                        </div>
                        <div className="rounded-full border border-[#ff7a00]/20 bg-[#ff7a00]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#ffbf82]">
                          Visited Provider
                        </div>
                      </div>
                      <div className="mt-3 text-xs uppercase tracking-[0.22em] text-white/38">
                        {formatDate(click.clickedAt)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-[34px] border border-white/10 bg-black/25 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-2xl md:p-8">
              <div className="text-[11px] uppercase tracking-[0.26em] text-[#ffbf82]">
                My Bookings
              </div>
              <h2 className="mt-3 text-3xl font-semibold">Provider-confirmed bookings.</h2>

              {confirmedBookings.length === 0 ? (
                <div className="mt-6 rounded-[28px] border border-dashed border-white/12 bg-white/[0.03] p-6 text-sm leading-7 text-white/60">
                  Confirmed bookings appear here only after trusted provider confirmation. A Book Now click is tracked separately as provider activity.
                </div>
              ) : (
                <div className="mt-6 space-y-3">
                  {confirmedBookings.map((booking) => (
                    <div key={booking.id} className="rounded-[24px] border border-white/10 bg-white/[0.04] px-5 py-4">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <div className="text-base font-semibold text-white">{booking.provider}</div>
                          <div className="mt-2 text-sm text-white/62">
                            {booking.providerBookingId || "Provider reference pending"} • {formatMoney(booking.amount, booking.currency)}
                          </div>
                        </div>
                        <div className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/66">
                          {booking.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-[34px] border border-white/10 bg-black/25 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-2xl md:p-8">
              <div className="text-[11px] uppercase tracking-[0.26em] text-[#ffbf82]">
                Continue Exploring
              </div>
              <h2 className="mt-3 text-3xl font-semibold">Recently viewed places and plans.</h2>

              {recentlyViewed.length === 0 ? (
                <div className="mt-6 rounded-[28px] border border-dashed border-white/12 bg-white/[0.03] p-6 text-sm leading-7 text-white/60">
                  Ready Plans you open while signed in will appear here for easy return.
                </div>
              ) : (
                <div className="mt-6 space-y-3">
                  {recentlyViewed.map((view) => {
                    const slug = getMetaField(view.metadata, "slug") || view.entityId;
                    const title = getMetaField(view.metadata, "title") || view.entityType.replaceAll("_", " ");
                    const destination = getMetaField(view.metadata, "destination") || "Recently viewed";
                    return (
                      <Link
                        key={view.id}
                        href={view.entityType === "READY_PLAN" ? `/ready-plans/${slug}` : "/profile"}
                        className="flex items-center justify-between gap-4 rounded-[24px] border border-white/10 bg-white/[0.04] px-5 py-4 transition hover:border-white/18"
                      >
                        <div>
                          <div className="text-base font-semibold text-white">{title}</div>
                          <div className="mt-2 text-sm text-white/62">{destination}</div>
                        </div>
                        <div className="text-sm text-white/55">{formatDate(view.viewedAt)}</div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="rounded-[34px] border border-white/10 bg-black/25 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-2xl md:p-8">
              <div className="text-[11px] uppercase tracking-[0.26em] text-[#ffbf82]">
                Payments & Activity
              </div>
              <h2 className="mt-3 text-3xl font-semibold">Account history tied to this profile.</h2>

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="rounded-[26px] border border-white/10 bg-white/[0.04] p-5">
                  <div className="text-sm font-semibold text-white">Payment History</div>
                  <div className="mt-4 space-y-3">
                    {paymentHistory.length === 0 ? (
                      <div className="text-sm leading-6 text-white/58">No payment records yet.</div>
                    ) : (
                      paymentHistory.slice(0, 6).map((payment) => (
                        <div key={payment.id} className="border-b border-white/8 pb-3 last:border-0 last:pb-0">
                          <div className="flex items-center justify-between gap-3 text-sm">
                            <span className="text-white/78">{payment.provider}</span>
                            <span className="text-[#ffbf82]">{payment.status}</span>
                          </div>
                          <div className="mt-1 text-xs text-white/45">{formatMoney(payment.amount, payment.currency)} • {formatDate(payment.createdAt)}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-[26px] border border-white/10 bg-white/[0.04] p-5">
                  <div className="text-sm font-semibold text-white">Recent Activity</div>
                  <div className="mt-4 space-y-3">
                    {activityEvents.length === 0 ? (
                      <div className="text-sm leading-6 text-white/58">No tracked account activity yet.</div>
                    ) : (
                      activityEvents.slice(0, 8).map((event) => (
                        <div key={event.id} className="border-b border-white/8 pb-3 last:border-0 last:pb-0">
                          <div className="text-sm text-white/78">{event.event.replaceAll("_", " ")}</div>
                          <div className="mt-1 text-xs text-white/45">{formatDate(event.createdAt)}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[34px] border border-white/10 bg-black/25 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-2xl md:p-8">
              <div className="text-[11px] uppercase tracking-[0.26em] text-[#ffbf82]">
                Active Offers
              </div>
              <h2 className="mt-3 text-3xl font-semibold">Fresh ways back into the site.</h2>

              {deals.length === 0 ? (
                <div className="mt-6 rounded-[28px] border border-dashed border-white/12 bg-white/[0.03] p-6 text-sm leading-7 text-white/60">
                  No live offers right now.
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {deals.map((deal) => {
                    const card = getDealCard(deal);
                    return (
                      <Link
                        key={deal.id}
                        href={card.href}
                        className="block rounded-[26px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-5 transition hover:border-white/18"
                      >
                        <div className="text-[11px] uppercase tracking-[0.24em] text-white/46">
                          {card.destination}
                        </div>
                        <div className="mt-3 text-xl font-semibold text-white">{deal.title}</div>
                        <div className="mt-3 text-sm text-white/58">Open offer →</div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
