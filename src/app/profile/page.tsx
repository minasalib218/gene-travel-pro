import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import Navbar from "@/components/Navbar";
import { getPlanRules } from "@/lib/credits/planRules";

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

type ProfileResponse = {
  ok: true;
  profile: {
    id: string;
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
};

function buildCookieHeader() {
  const store = cookies();
  const all = store.getAll();
  return all.map((c) => `${c.name}=${c.value}`).join("; ");
}

async function getProfile(): Promise<ProfileResponse | null> {
  const cookieHeader = buildCookieHeader();
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
  const url = `${base}/api/profile`;

  const res = await fetch(url, {
    method: "GET",
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
    cache: "no-store",
  });

  if (!res.ok) return null;

  const data = (await res.json()) as ProfileResponse;
  return data.ok ? data : null;
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
    "/bg/home-hero-bottom.png";

  return { title, subtitle, slug, image };
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

  const { profile, usage, paidTiers, confirmedTrips, savedReadyPlans, savedItems, deals } = data;
  const isFree = usage.tier === "free";
  const joinedText = formatJoined(profile.createdAt);
  const currentTierLabel = tierLabel(usage.tier);
  const allowedFeatures =
    isFree ? [] : usage.features.length > 0 ? usage.features : getPlanRules(usage.tier as "starter" | "pro" | "agency").features;
  const planAllowanceText = isFree
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
              src="/bg/home-hero-bottom.png"
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
                        {profile.fullName || "Gene Traveler"}
                      </h1>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-white/72">
                        <span>{profile.email || "Private account"}</span>
                        <span className="text-white/25">•</span>
                        <span>{profile.country || "Global traveler"}</span>
                        <span className="text-white/25">•</span>
                        <span>{joinedText}</span>
                      </div>
                    </div>
                  </div>

                  <p className="mt-8 max-w-2xl text-sm leading-7 text-white/68 md:text-base">
                    This is your private Gene control room: paid access, remaining plan tiers,
                    saved inspiration, confirmed journeys, and your next best route back into the
                    AI planner.
                  </p>
                </div>

                <div className="mt-8 flex flex-wrap gap-4">
                  <Link
                    href={isFree ? "/pricing" : "/ai-planner"}
                    className="rounded-full bg-[linear-gradient(135deg,#ff7a00,rgba(255,212,165,0.96))] px-6 py-3 text-sm font-semibold text-black shadow-[0_16px_55px_rgba(255,122,0,0.24)]"
                  >
                    {isFree ? "Unlock AI Planning" : "Create New Plan"}
                  </Link>
                  <Link
                    href="/ready-plans"
                    className="rounded-full border border-white/18 bg-white/5 px-6 py-3 text-sm text-white/85"
                  >
                    Explore Ready Plans
                  </Link>
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
                        {usage.mainCreditsRemaining}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                      <div className="text-white/45">Edit credits left</div>
                      <div className="mt-2 text-lg font-semibold text-white">
                        {usage.editCreditsRemaining}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                      <div className="text-white/45">What If left</div>
                      <div className="mt-2 text-lg font-semibold text-white">
                        {usage.whatIfFreeRemaining}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                      <div className="text-white/45">Valid until</div>
                      <div className="mt-2 text-lg font-semibold text-white">
                        {formatDate(usage.expiresAt)}
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
                      Paid passes are now linked directly to this profile.
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="mt-2 h-2 w-2 rounded-full bg-[#ffcb88]" />
                      Your available AI features open according to the tier you actually purchased.
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
              label="Saved plans"
              value={String(savedReadyPlans.length)}
              note="Ready-made inspiration waiting for your next move."
            />
            <ProfileStat
              label="Saved moments"
              value={String(savedItems.length)}
              note="Things you bookmarked while exploring the site."
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
                <Link href="/ai-planner" className="text-sm text-white/70 transition hover:text-white">
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
                    Saved Ready Plans
                  </div>
                  <h2 className="mt-3 text-3xl font-semibold">Your curated inspiration shelf.</h2>
                </div>
                <Link href="/ready-plans" className="text-sm text-white/70 transition hover:text-white">
                  Browse library →
                </Link>
              </div>

              {savedReadyPlans.length === 0 ? (
                <div className="mt-6 rounded-[28px] border border-dashed border-white/12 bg-white/[0.03] p-7 text-sm leading-7 text-white/60">
                  You have not saved any ready plans yet. Once you save destination cards, they
                  appear here for fast return.
                </div>
              ) : (
                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  {savedReadyPlans.map((item) => {
                    const card = getSavedReadyPlanCard(item);
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
                              {formatDate(item.createdAt)}
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
