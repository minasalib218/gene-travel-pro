"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Globe2,
  Hotel,
  MapPinned,
  Plane,
  ShieldCheck,
  Sparkles,
  Ticket,
  Users,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import AiSuiteFrame from "@/components/ai/AiSuiteFrame";
import { buildCinematicStoryModeFromPayload } from "@/lib/story/cinematicStoryMode";
import { buildBookingStateFromPayload, refreshBookingTotals, updateBookingItemStatus } from "@/lib/recommendation/bookingState";
import type { CinematicStoryMode, RecommendationPayload } from "@/lib/recommendation/types";
import { trackAnalyticsEvent } from "@/lib/analytics";

function formatCurrency(amount: number, currency = "USD") {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `$${Math.round(amount).toLocaleString()}`;
  }
}

function formatTripDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function formatDayLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" });
}

function getTravelerLabel(payload: RecommendationPayload) {
  const parts = [
    payload.inputs.adults ? `${payload.inputs.adults} Adults` : "",
    payload.inputs.kids ? `${payload.inputs.kids} Child` : "",
    payload.inputs.elderly ? `${payload.inputs.elderly} Elderly` : "",
  ].filter(Boolean);
  return parts.join(", ") || `${payload.inputs.travelersCount} Travelers`;
}

function getRouteLabel(payload: RecommendationPayload) {
  const fullTrip = (payload.inputs.fullInput as Record<string, any> | undefined)?.trip;
  const origin = fullTrip?.travellingFrom
    ? [fullTrip.travellingFrom.city, fullTrip.travellingFrom.country].filter(Boolean).join(", ")
    : payload.inputs.departureCity;
  const stops = payload.inputs.destinations?.length
    ? payload.inputs.destinations.map((item) => `${item.city}, ${item.country}`)
    : [payload.inputs.destination];
  return [origin, ...stops.filter(Boolean)].filter(Boolean).join("  ->  ");
}

function getCountries(payload: RecommendationPayload) {
  const stops = payload.inputs.destinations?.length
    ? payload.inputs.destinations.map((item) => item.country)
    : [payload.inputs.destination];
  return Array.from(new Set(stops.filter(Boolean)));
}

function buildSummaryPayloadFromPlan(plan: any): RecommendationPayload | null {
  const summaryJson = plan?.summaryJson as Record<string, any> | null;
  if (summaryJson?.payload) return summaryJson.payload as RecommendationPayload;
  if (!summaryJson || !summaryJson.dayPlan) return null;

  const inputsJson = (plan?.inputsJson as Record<string, any> | null) ?? {};
  const recommendationJson = (plan?.recommendationJson as Record<string, any> | null) ?? {};
  const analysisJson = (plan?.analysisJson as Record<string, any> | null) ?? {};

  return {
    inputs: {
      destination: summaryJson.destination || inputsJson.destination || plan.destination,
      departureCity: inputsJson.departureCity || "",
      startDate: typeof plan.startDate === "string" ? plan.startDate : new Date(plan.startDate).toISOString(),
      endDate: typeof plan.endDate === "string" ? plan.endDate : new Date(plan.endDate).toISOString(),
      budget: Number(inputsJson.budget ?? 0),
      currency: String(inputsJson.currency ?? "USD"),
      travelStyle: String(inputsJson.travelStyle ?? "balanced"),
      travelersCount: Number(inputsJson.travelersCount ?? inputsJson.adults ?? 1),
      travelerType: (inputsJson.travelerType ?? inputsJson.travelersType ?? "couple") as any,
      hotelClass: String(inputsJson.hotelClass ?? "4 star"),
      interests: Array.isArray(inputsJson.interests) ? inputsJson.interests : [],
      preferredTransport: String(inputsJson.preferredTransport ?? "private"),
      walkingTolerance: Number(inputsJson.walkingTolerance ?? 60),
      specialRequests: String(inputsJson.specialRequests ?? ""),
      destinations: Array.isArray(inputsJson.trip?.destinations) ? inputsJson.trip.destinations : [],
      preferredHotels: Array.isArray(inputsJson.stay?.preferredHotels) ? inputsJson.stay.preferredHotels : [],
      adults: Number(inputsJson.adults ?? 0),
      kids: Number(inputsJson.kids ?? 0),
      elderly: Number(inputsJson.elderly ?? 0),
      fullInput: inputsJson,
    },
    groups: recommendationJson.groups ?? summaryJson.groups ?? {
      hotels: [],
      flights: [],
      activities: [],
      restaurants: [],
      transports: [],
      cars: [],
      hiddenGems: [],
    },
    selected: recommendationJson.selected ?? summaryJson.selected,
    selectedByDestination: recommendationJson.selectedByDestination ?? summaryJson.selectedByDestination ?? undefined,
    dayPlan: summaryJson.dayPlan,
    analysis: analysisJson.analysis ?? summaryJson.analysis ?? [],
    modules: analysisJson.modules ?? summaryJson.modules ?? [],
    createdAt: summaryJson.createdAt ?? new Date().toISOString(),
    planId: summaryJson.planInputId,
    mode: recommendationJson.mode ?? "ai",
    aiSummary: recommendationJson.aiSummary ?? undefined,
    summaryState: summaryJson.payload?.summaryState ?? summaryJson.summaryState ?? undefined,
    livePricing: summaryJson.payload?.livePricing ?? undefined,
    cinematicStory: summaryJson.payload?.cinematicStory ?? summaryJson.cinematicStory ?? undefined,
  };
}

function SummaryMetric({
  icon,
  label,
  value,
  note,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-black/90 px-4 py-4 shadow-[0_16px_34px_rgba(0,0,0,0.2)]">
      <div className="flex items-center gap-2.5 text-[#ff9d4d]">
        {icon}
        <div className="text-[13px] font-medium text-white/86">{label}</div>
      </div>
      <div className="mt-4 text-[24px] font-medium leading-none text-white md:text-[26px]">{value}</div>
      <div className="mt-2 text-[12px] text-white/54 md:text-[13px]">{note}</div>
    </div>
  );
}

function SectionShell({
  title,
  icon,
  action,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-[#ff7a00]/18 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(0,0,0,0.24))] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.24)] md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-[#ff9d4d]">{icon}</span>
          <h2 className="text-[18px] font-medium text-white md:text-[20px]">{title}</h2>
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export default function SummaryClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get("planId");
  const storyRailRef = useRef<HTMLDivElement | null>(null);
  const saveAttemptedRef = useRef(false);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [payload, setPayload] = useState<RecommendationPayload | null>(null);
  const [savedPlanId, setSavedPlanId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [loadingSavedPlan, setLoadingSavedPlan] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeDay, setActiveDay] = useState(1);
  const [visibleDayStartIndex, setVisibleDayStartIndex] = useState(0);
  const [expandedIncludedCategory, setExpandedIncludedCategory] = useState<string | null>(null);
  const [cinematicStory, setCinematicStory] = useState<CinematicStoryMode | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    trackAnalyticsEvent("summary_viewed", {
      planId,
      source: "summary_page",
    });
  }, [planId]);

  useEffect(() => {
    const raw = sessionStorage.getItem("gene-recommendation-payload");
    if (!raw) return;
    try {
      setPayload(JSON.parse(raw));
    } catch {
      setPayload(null);
    }
  }, []);

  useEffect(() => {
    async function loadSavedPlan() {
      if (payload || !planId) return;
      setLoadingSavedPlan(true);
      setErrorMessage(null);
      try {
        const res = await fetch(`/api/plan/${planId}`, { method: "GET" });
        const json = await res.json().catch(() => null);
        if (!res.ok || !json?.plan) throw new Error(json?.message || "This summary is not ready yet.");
        const summaryPayload = buildSummaryPayloadFromPlan(json.plan);
        if (!summaryPayload) throw new Error("This saved plan does not have a complete summary payload yet.");
        setPayload(summaryPayload);
        setSavedPlanId(json.plan.id);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "This summary is not ready yet.");
      } finally {
        setLoadingSavedPlan(false);
      }
    }
    loadSavedPlan();
  }, [payload, planId]);

  useEffect(() => {
    if (!payload) return;
    const computedBooking = refreshBookingTotals(buildBookingStateFromPayload(payload));
    const currentBooking = payload.summaryState?.bookingState;
    const nextStory = payload.cinematicStory ?? buildCinematicStoryModeFromPayload(payload);
    const bookingMatches = JSON.stringify(currentBooking) === JSON.stringify(computedBooking);
    const storyMatches = JSON.stringify(payload.cinematicStory) === JSON.stringify(nextStory);
    if (bookingMatches && storyMatches) return;
    setPayload((current) =>
      current
        ? {
            ...current,
            summaryState: {
              ...current.summaryState,
              bookingState: computedBooking,
            },
            cinematicStory: nextStory,
          }
        : current,
    );
  }, [payload]);

  useEffect(() => {
    if (!payload) return;
    sessionStorage.setItem("gene-recommendation-payload", JSON.stringify(payload));
  }, [payload]);

  useEffect(() => {
    if (!payload?.cinematicStory) return;
    setCinematicStory(payload.cinematicStory);
  }, [payload]);

  useEffect(() => {
    if (!payload || !savedPlanId) return;
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(async () => {
      try {
        await fetch(`/api/plan/${savedPlanId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ payload }),
        });
      } catch {
        // local state remains source of truth for the active session
      }
    }, 500);

    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [payload, savedPlanId]);

  useEffect(() => {
    async function saveToProfile() {
      if (!payload?.planId || saveAttemptedRef.current || savedPlanId) return;
      saveAttemptedRef.current = true;
      setSaveState("saving");
      try {
        const res = await fetch(`/api/plan-inputs/${payload.planId}/finalize-summary`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ payload }),
        });
        const data = (await res.json().catch(() => null)) as { ok?: boolean; planId?: string } | null;
        if (!res.ok || !data?.ok || !data.planId) throw new Error("Unable to save this trip to the customer profile.");
        setSavedPlanId(data.planId);
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    }
    saveToProfile();
  }, [payload, savedPlanId]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const bookingState = payload?.summaryState?.bookingState ?? null;

  const itineraryStats = useMemo(() => {
    if (!payload || !bookingState) return null;
    return {
      totalDays: payload.dayPlan.length,
      totalBudget: bookingState.totals.totalConfirmedCost,
      totalActivities: bookingState.totals.totalActivities,
    };
  }, [payload, bookingState]);

  const countries = useMemo(() => (payload ? getCountries(payload) : []), [payload]);

  const activeDayData = useMemo(() => {
    if (!payload) return null;
    return payload.dayPlan.find((day) => day.day === activeDay) ?? payload.dayPlan[0] ?? null;
  }, [payload, activeDay]);

  const maxVisibleDays = 5;
  const activeDayIndex = useMemo(() => {
    if (!payload) return 0;
    return Math.max(0, payload.dayPlan.findIndex((day) => day.day === activeDay));
  }, [payload, activeDay]);

  const visibleDays = useMemo(() => {
    if (!payload) return [];
    return payload.dayPlan.slice(visibleDayStartIndex, visibleDayStartIndex + maxVisibleDays);
  }, [payload, visibleDayStartIndex]);

  useEffect(() => {
    if (!payload?.dayPlan.length) return;
    setActiveDay((current) =>
      payload.dayPlan.some((day) => day.day === current) ? current : payload.dayPlan[0].day,
    );
  }, [payload]);

  useEffect(() => {
    if (!payload?.dayPlan.length) return;
    const maxStart = Math.max(0, payload.dayPlan.length - maxVisibleDays);
    setVisibleDayStartIndex((current) => Math.min(current, maxStart));
  }, [payload]);

  useEffect(() => {
    if (!payload?.dayPlan.length) return;
    setVisibleDayStartIndex((current) => {
      const maxStart = Math.max(0, payload.dayPlan.length - maxVisibleDays);
      if (activeDayIndex < current) return activeDayIndex;
      if (activeDayIndex >= current + maxVisibleDays) return Math.min(activeDayIndex - maxVisibleDays + 1, maxStart);
      return Math.min(current, maxStart);
    });
  }, [payload, activeDayIndex]);

  const includedItems = useMemo(() => {
    if (!payload || !bookingState) return [];
    const byType = (types: string[]) =>
      bookingState.items.filter((item) => types.includes(item.type) && item.status !== "cancelled");
    return [
      {
        key: "Flights",
        label: "Flights",
        note: "Air Tickets",
        icon: <Plane size={18} />,
        details: byType(["flight"]).map((item) => `${item.title} | ${formatCurrency(item.finalPrice, payload.inputs.currency)}`),
      },
      {
        key: "Hotels",
        label: "Hotels",
        note: "Stays & Suites",
        icon: <Hotel size={18} />,
        details: byType(["hotel"]).map((item) => `${item.title} | ${item.subtitle || "Selected stay"}`),
      },
      {
        key: "Activities",
        label: "Activities",
        note: "Trips & Attractions",
        icon: <Sparkles size={18} />,
        details: byType(["activity", "trip", "event"]).map((item) => `${item.title} | ${formatCurrency(item.finalPrice, payload.inputs.currency)}`),
      },
      {
        key: "Transfers",
        label: "Transfers",
        note: "Transport",
        icon: <MapPinned size={18} />,
        details: byType(["transportation"]).map((item) => `${item.title} | ${formatCurrency(item.finalPrice, payload.inputs.currency)}`),
      },
      {
        key: "Meals",
        label: "Meals",
        note: "Restaurants",
        icon: <UtensilsCrossed size={18} />,
        details: byType(["restaurant"]).map((item) => `${item.title} | ${formatCurrency(item.finalPrice, payload.inputs.currency)}`),
      },
      {
        key: "Tickets",
        label: "Tickets",
        note: "Entry Tickets",
        icon: <Ticket size={18} />,
        details: byType(["activity", "event", "trip"]).map((item) => `${item.title} | ${formatCurrency(item.finalPrice, payload.inputs.currency)}`),
      },
      {
        key: "Insurance",
        label: "Insurance",
        note: "Travel Insurance",
        icon: <ShieldCheck size={18} />,
        details: ["Coverage details are shared during provider booking."],
      },
      {
        key: "Support",
        label: "Support",
        note: "Trip Assistance",
        icon: <Users size={18} />,
        details: ["Gene itinerary support", "Booking handoff guidance", "Trip status tracking"],
      },
    ];
  }, [payload, bookingState]);

  function applyBookingState(nextBookingState: NonNullable<RecommendationPayload["summaryState"]>["bookingState"]) {
    setPayload((current) =>
      current
        ? {
            ...current,
            summaryState: {
              ...current.summaryState,
              bookingState: nextBookingState,
            },
          }
        : current,
    );
  }

  async function shareStory() {
    if (!cinematicStory) return;
    const shareText = `${cinematicStory.tripTitle}\n${cinematicStory.shareCaption}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: cinematicStory.tripTitle,
          text: shareText,
          url: window.location.href,
        });
        return;
      } catch {
        // clipboard fallback below
      }
    }
    try {
      await navigator.clipboard.writeText(`${shareText}\n${window.location.href}`);
      setNotice("Story link copied.");
    } catch {
      setNotice("Story link copied.");
    }
  }

  function scrollStoryRail(direction: "left" | "right") {
    storyRailRef.current?.scrollBy({
      left: direction === "left" ? -280 : 280,
      behavior: "smooth",
    });
  }

  async function openAffiliate(itemKey: string, markClicked: boolean) {
    if (!payload || !bookingState) return false;
    if (!savedPlanId) {
      setNotice("Preparing booking links for your saved trip. Please try again in a moment.");
      return false;
    }
    const apiBase = `/api/affiliate/redirect?planId=${encodeURIComponent(savedPlanId)}&itemKey=${encodeURIComponent(itemKey)}`;
    const res = await fetch(`${apiBase}&resolve=1`, { method: "GET" });
    const json = (await res.json().catch(() => null)) as { ok?: boolean; url?: string; message?: string } | null;
    if (!res.ok || !json?.ok || !json.url) {
      setNotice(json?.message || "Booking link is not available yet. Please try another option.");
      return false;
    }
    if (markClicked) {
      applyBookingState(refreshBookingTotals(updateBookingItemStatus(bookingState, itemKey, "clicked")!));
    }
    trackAnalyticsEvent("affiliate_redirect_clicked", {
      source: "summary_page",
      itemKey,
      planId: savedPlanId || payload.planId || planId,
    }, { useBeacon: true });
    window.open(apiBase, "_blank", "noopener,noreferrer");
    return true;
  }

  async function bookAllPending() {
    if (!bookingState) return;
    const pendingItems = bookingState.items.filter((item) => item.status === "pending");
    for (const item of pendingItems) {
      await openAffiliate(item.key, true);
    }
  }

  function cancelItem(itemKey: string) {
    if (!bookingState) return;
    applyBookingState(refreshBookingTotals(updateBookingItemStatus(bookingState, itemKey, "cancelled")!));
  }

  if (loadingSavedPlan || !payload || !bookingState || !itineraryStats) {
    return (
      <AiSuiteFrame activePage="summary" planId={savedPlanId || planId || undefined}>
        <section className="rounded-[24px] border border-white/10 bg-black/28 p-6 text-white/70">
          {errorMessage || "Preparing your summary..."}
        </section>
      </AiSuiteFrame>
    );
  }

  const routeLabel = getRouteLabel(payload);
  const travelerLabel = getTravelerLabel(payload);
  const routeStops = bookingState.routeOverview?.stopLabels ?? [];

  return (
    <AiSuiteFrame activePage="summary" planId={savedPlanId || payload.planId || planId}>
      <section className="space-y-5">
        <div className="grid gap-5 xl:grid-cols-[1fr_auto] xl:items-start">
          <div>
            <h1 className="text-[28px] font-semibold leading-none text-white md:text-[30px]">Trip Summary</h1>
            <div className="mt-2 text-[13px] text-white/68 md:text-[14px]">Here's your complete trip overview.</div>
          </div>
          <div className="flex flex-wrap items-center gap-3 xl:justify-end">
            <div className="rounded-[16px] border border-white/10 bg-black/28 px-4 py-2.5 text-[12px] text-white/78 md:text-[13px]">
              <div className="flex flex-wrap items-center gap-4">
                <span>{routeLabel}</span>
                <span className="text-white/42">|</span>
                <span>
                  {formatTripDate(payload.inputs.startDate)} - {formatTripDate(payload.inputs.endDate)}
                </span>
                <span className="text-white/42">|</span>
                <span>{travelerLabel}</span>
              </div>
            </div>
            <Link
              href={`/ai-planner?planId=${payload.planId || planId || ""}`}
              className="rounded-[14px] border border-[#ff7a00]/40 bg-transparent px-4 py-2.5 text-[13px] font-medium text-[#ff9d4d] transition hover:bg-[#ff7a00]/10"
            >
              Edit Trip
            </Link>
          </div>
        </div>

        {notice ? (
          <div className="rounded-[16px] border border-[#ff7a00]/22 bg-[#ff7a00]/10 px-4 py-3 text-[13px] text-[#ffcf9d]">
            {notice}
          </div>
        ) : null}

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <SummaryMetric icon={<CalendarDays size={18} />} label="Total Days" value={`${itineraryStats.totalDays}`} note={`${formatTripDate(payload.inputs.startDate)} - ${formatTripDate(payload.inputs.endDate)}`} />
          <SummaryMetric icon={<Wallet size={18} />} label="Total Budget" value={formatCurrency(bookingState.totals.totalConfirmedCost, payload.inputs.currency)} note="Matches Booking summary" />
          <SummaryMetric icon={<Sparkles size={18} />} label="Total Activities" value={`${bookingState.totals.totalActivities}`} note="Restaurants + events + trips" />
          <SummaryMetric icon={<Globe2 size={18} />} label="Countries" value={`${countries.length}`} note={countries.join(", ")} />
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5">
            <SectionShell
              title="Itinerary Overview"
              icon={<Plane size={18} />}
              action={
                <button
                  type="button"
                  onClick={() => router.push(`/ai/day-by-day?planId=${payload.planId || planId || ""}`)}
                  className="rounded-[14px] border border-[#ff7a00]/28 px-4 py-2 text-sm text-[#ffb36c]"
                >
                  View Day by Day Plan
                </button>
              }
            >
              <div className="grid gap-4 lg:grid-cols-[136px_minmax(0,1fr)]">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setVisibleDayStartIndex((current) => Math.max(0, current - 1))}
                      disabled={visibleDayStartIndex === 0}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/24 text-white/70 transition hover:border-[#ff7a00]/30 hover:text-[#ffb36c] disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <div className="text-[11px] uppercase tracking-[0.16em] text-white/36">
                      {payload.dayPlan.length <= maxVisibleDays
                        ? "All Days"
                        : `${visibleDayStartIndex + 1}-${Math.min(visibleDayStartIndex + maxVisibleDays, payload.dayPlan.length)}`}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setVisibleDayStartIndex((current) =>
                          Math.min(Math.max(0, payload.dayPlan.length - maxVisibleDays), current + 1),
                        )
                      }
                      disabled={visibleDayStartIndex >= Math.max(0, payload.dayPlan.length - maxVisibleDays)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/24 text-white/70 transition hover:border-[#ff7a00]/30 hover:text-[#ffb36c] disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                  <div className="relative space-y-2 pl-4">
                    <div className="absolute bottom-3 left-[9px] top-3 border-l border-dashed border-white/14" />
                    {visibleDays.map((day) => (
                      <button
                        key={day.day}
                        type="button"
                        onClick={() => setActiveDay(day.day)}
                        className={`flex w-full items-start gap-3 rounded-[16px] border px-3 py-3 text-left transition ${
                          activeDayData?.day === day.day
                            ? "border-[#ff7a00]/35 bg-[#ff7a00]/10 text-white"
                            : "border-white/8 bg-black/16 text-white/72 hover:border-white/14"
                        }`}
                      >
                        <span className={`mt-1 h-3 w-3 rounded-full ${activeDayData?.day === day.day ? "bg-[#ff7a00]" : "bg-white/36"}`} />
                        <div>
                          <div className="text-[15px] font-medium">Day {day.day}</div>
                          <div className="mt-1 text-[12px] text-white/52">{formatDayLabel(day.date)}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-[20px] border border-white/10 bg-black/20">
                  {activeDayData ? (
                    <>
                      <div className="border-b border-white/10 px-4 py-3.5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="text-[17px] font-medium text-white">{activeDayData.theme}</div>
                            <div className="mt-1 text-[12px] text-white/52">{formatDayLabel(activeDayData.date)}</div>
                          </div>
                          <div className="text-[12px] text-white/52">{activeDayData.items.length} items planned</div>
                        </div>
                      </div>
                      <div className="space-y-0">
                        {activeDayData.items.map((item) => (
                          <div key={item.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-white/8 px-4 py-3.5 last:border-b-0">
                            <div className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-white/10 bg-black/24 text-[#ff9d4d]">
                              {item.type === "hotel" ? <Hotel size={18} /> : item.type === "flight" ? <Plane size={18} /> : item.type === "restaurant" ? <UtensilsCrossed size={18} /> : item.type === "transport" || item.type === "car" ? <MapPinned size={18} /> : <Sparkles size={18} />}
                            </div>
                            <div className="min-w-0">
                              <div className="truncate text-[15px] font-medium text-white">{item.title}</div>
                              <div className="mt-1 text-[12px] text-white/56">
                                {item.startTime} | {item.description}
                              </div>
                            </div>
                            <div className="text-right text-[15px] font-medium text-white">
                              {typeof item.cost === "number" && item.cost > 0 ? formatCurrency(item.cost, payload.inputs.currency) : ""}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            </SectionShell>

            {cinematicStory ? (
              <SectionShell
                title="Trip Story"
                icon={<Sparkles size={18} />}
                action={
                  <button
                    type="button"
                    onClick={shareStory}
                    className="rounded-[14px] border border-[#ff7a00]/24 px-4 py-2 text-sm text-[#ffb36c]"
                  >
                    Share Story
                  </button>
                }
              >
                <div className="rounded-[20px] border border-white/10 bg-black/18 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-[18px] font-medium text-white">{cinematicStory.tripTitle}</div>
                      <div className="mt-2 max-w-4xl text-[12px] leading-6 text-white/70">{cinematicStory.intro}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => scrollStoryRail("left")}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/32 text-white/72 transition hover:border-[#ff7a00]/36 hover:bg-[#ff7a00]/10 hover:text-[#ffb36c] hover:shadow-[0_0_24px_rgba(255,122,0,0.18)]"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => scrollStoryRail("right")}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/32 text-white/72 transition hover:border-[#ff7a00]/36 hover:bg-[#ff7a00]/10 hover:text-[#ffb36c] hover:shadow-[0_0_24px_rgba(255,122,0,0.18)]"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>

                  <div ref={storyRailRef} className="mt-4 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {cinematicStory.days.map((day) => (
                      <div key={`summary-story-${day.dayNumber}`} className="min-w-[228px] overflow-hidden rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(0,0,0,0.26))]">
                        <div className="relative min-h-[220px]">
                          <div className="absolute inset-0">
                            {day.imageUrl ? (
                              <Image src={day.imageUrl} alt={day.cinematicTitle} fill className="object-cover" />
                            ) : (
                              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,122,0,0.18),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(0,0,0,0.92))]" />
                            )}
                          </div>
                          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08),rgba(0,0,0,0.84)_78%)]" />
                          <div className="relative flex min-h-[220px] flex-col justify-between p-4">
                            <div className="text-[14px] font-medium text-white">Day {day.dayNumber}</div>
                            <div>
                              <div className="text-[12px] text-white/68">{[day.city, day.country].filter(Boolean).join(", ")}</div>
                              <div className="mt-2 text-[16px] font-medium leading-6 text-white">{day.storyLine}</div>
                              <div className="mt-2 text-[12px] leading-5 text-white/56">{day.practicalSummary}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 rounded-[16px] border border-[#ff7a00]/16 bg-[#ff7a00]/06 px-4 py-3">
                    <div className="text-[12px] leading-6 text-white/78">{cinematicStory.endingLine}</div>
                    <div className="mt-1.5 text-[12px] text-[#ffb36c]">{cinematicStory.shareCaption}</div>
                  </div>
                </div>
              </SectionShell>
            ) : null}

            <SectionShell title="What's Included" icon={<ShieldCheck size={18} />}>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {includedItems.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setExpandedIncludedCategory((current) => (current === item.key ? null : item.key))}
                    className={`rounded-[18px] border p-4 text-left transition ${
                      expandedIncludedCategory === item.key
                        ? "border-[#ff7a00]/32 bg-[#ff7a00]/08 shadow-[0_16px_40px_rgba(255,122,0,0.08)]"
                        : "border-white/10 bg-black/18 hover:border-white/16"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 text-[#ff9d4d]">
                        {item.icon}
                        <div className="text-[15px] font-medium text-white">{item.label}</div>
                      </div>
                      <ChevronRight size={14} className={`text-white/46 transition ${expandedIncludedCategory === item.key ? "rotate-90 text-[#ffb36c]" : ""}`} />
                    </div>
                    <div className="mt-2 text-[12px] text-white/56">{item.note}</div>
                    {expandedIncludedCategory === item.key ? (
                      <div className="mt-3 space-y-2 border-t border-white/8 pt-3">
                        {(item.details.length ? item.details : ["Nothing selected yet."]).map((detail) => (
                          <div key={`${item.key}-${detail}`} className="rounded-[12px] border border-white/8 bg-black/18 px-3 py-2 text-[12px] text-white/72">
                            {detail}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </button>
                ))}
              </div>
            </SectionShell>
          </div>

          <div className="space-y-5">
            <SectionShell title="Payments & Booking Status" icon={<Wallet size={18} />}>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[16px] border border-white/10 bg-black/18 px-4 py-4">
                  <div className="text-[12px] text-white/48">Total Items</div>
                  <div className="mt-2 text-[24px] font-medium text-white">{bookingState.items.length}</div>
                </div>
                <div className="rounded-[16px] border border-white/10 bg-black/18 px-4 py-4">
                  <div className="text-[12px] text-white/48">Pending Booking Confirmation</div>
                  <div className="mt-2 text-[24px] font-medium text-white">{bookingState.totals.bookedClickedCount}</div>
                </div>
                <div className="rounded-[16px] border border-white/10 bg-black/18 px-4 py-4">
                  <div className="text-[12px] text-white/48">Pending</div>
                  <div className="mt-2 text-[24px] font-medium text-white">{bookingState.totals.pendingCount}</div>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {bookingState.items.map((item) => (
                  <div key={item.key} className="rounded-[16px] border border-white/10 bg-black/18 px-4 py-3.5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-[15px] font-medium text-white">{item.title}</div>
                        <div className="mt-1 text-[12px] text-white/52">{item.subtitle}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[15px] font-medium text-white">{formatCurrency(item.finalPrice, payload.inputs.currency)}</div>
                        <div className={`mt-1 text-[11px] ${item.status === "clicked" ? "text-[#ffcf9d]" : item.status === "cancelled" ? "text-rose-300" : "text-white/54"}`}>
                          {item.status === "clicked"
                            ? "Pending booking confirmation"
                            : item.status === "cancelled"
                              ? "Cancelled"
                              : "Pending"}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.status === "pending" ? (
                        <button
                          type="button"
                          onClick={() => openAffiliate(item.key, true)}
                          className="rounded-[12px] border border-[#ff7a00]/24 bg-[#ff7a00]/08 px-3 py-2 text-[12px] font-medium text-[#ffb36c]"
                        >
                          Book Now
                        </button>
                      ) : null}
                      {savedPlanId ? (
                        <button
                          type="button"
                          onClick={() => cancelItem(item.key)}
                          disabled={item.status === "cancelled"}
                          className="rounded-[12px] border border-white/10 bg-black/24 px-3 py-2 text-[12px] font-medium text-white/78 disabled:opacity-45"
                        >
                          Cancel
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={bookAllPending}
                className="mt-4 w-full rounded-[14px] bg-[linear-gradient(135deg,#ff7a00,rgba(255,166,74,0.96))] px-5 py-3 text-[14px] font-medium text-black shadow-[0_18px_44px_rgba(255,122,0,0.22)]"
              >
                Book all pending
              </button>
              <div className="mt-3 text-[12px] leading-6 text-white/56">
                Cancellation here updates your Gene trip status only. Provider booking cancellation must be completed on the provider website unless connected API cancellation is available.
              </div>
            </SectionShell>
          </div>
        </div>

        <SectionShell title="Trip Route Overview" icon={<MapPinned size={18} />}>
          <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
            <div className="space-y-3">
              {(routeStops.length ? routeStops : [payload.inputs.destination]).map((stop, index) => (
                <div key={`${stop}-${index}`} className="rounded-[18px] border border-[#ff7a00]/20 bg-black/18 p-3.5">
                  <div className="text-[15px] font-medium text-white">{stop}</div>
                  <div className="mt-1.5 text-[12px] text-white/56">
                    {index === 0 && bookingState.routeOverview?.originLabel
                      ? `From ${bookingState.routeOverview.originLabel}`
                      : `Stop ${index + 1}`}
                  </div>
                </div>
              ))}
            </div>

            <div className="relative min-h-[330px] overflow-hidden rounded-[22px] border border-white/10 bg-[radial-gradient(circle_at_center,rgba(255,122,0,0.12),transparent_35%),linear-gradient(180deg,rgba(19,19,19,0.9),rgba(8,8,8,0.96))]">
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:80px_80px] opacity-20" />
              <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
                <path
                  d={`M 12 72 ${routeStops
                    .map((_, index) => {
                      const x = 26 + index * (56 / Math.max(routeStops.length, 1));
                      const y = index % 2 === 0 ? 36 : 58;
                      return `Q ${Math.max(18, x - 4)} ${Math.max(18, y + 8)} ${x} ${y}`;
                    })
                    .join(" ")}`}
                  stroke="#ff7a00"
                  strokeWidth="0.75"
                  fill="none"
                  strokeDasharray="2 2.4"
                  opacity="0.95"
                />
              </svg>

              <div className="absolute left-[10%] top-[68%] flex items-center gap-2 text-white">
                <span className="h-4 w-4 rounded-full border-2 border-[#ff7a00] bg-black shadow-[0_0_18px_rgba(255,122,0,0.35)]" />
                <span className="text-[15px] font-medium">{bookingState.routeOverview?.originLabel || "Origin"}</span>
              </div>

              {routeStops.map((stop, index) => {
                const horizontal = 28 + index * (50 / Math.max(routeStops.length, 1));
                const vertical = index % 2 === 0 ? 22 : 48;
                return (
                  <div key={`route-${stop}-${index}`} className="absolute flex items-center gap-2 text-white" style={{ left: `${horizontal}%`, top: `${vertical}%` }}>
                    <span className="h-4 w-4 rounded-full border-2 border-[#ff7a00] bg-black shadow-[0_0_18px_rgba(255,122,0,0.35)]" />
                    <span className="text-[14px] font-medium">{stop}</span>
                  </div>
                );
              })}

              <div className="absolute bottom-5 right-5 rounded-[14px] border border-[#ff7a00]/24 bg-black/24 px-4 py-2.5 text-[13px] text-[#ffb36c]">
                Cinematic route preview
              </div>
            </div>
          </div>
        </SectionShell>

        {saveState === "saved" && savedPlanId ? (
          <div className="text-sm text-white/46">
            Saved to profile. Open the saved version at{" "}
            <Link href={`/plan-summary/${savedPlanId}`} className="text-[#ffb36c]">
              /plan-summary/{savedPlanId}
            </Link>
            .
          </div>
        ) : null}
      </section>
    </AiSuiteFrame>
  );
}
