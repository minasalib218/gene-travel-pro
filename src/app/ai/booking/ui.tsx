"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  Car,
  Clock3,
  ExternalLink,
  Hotel,
  Plane,
  Sparkles,
  Ticket,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import AiSuiteFrame from "@/components/ai/AiSuiteFrame";
import { buildBookingStateFromPayload, refreshBookingTotals, updateBookingItemStatus } from "@/lib/recommendation/bookingState";
import type { RecommendationPayload } from "@/lib/recommendation/types";
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

function SectionCard({
  title,
  icon,
  children,
  action,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-[24px] border border-[#ff7a00]/18 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(0,0,0,0.24))] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.24)] md:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-[#ff9d4d]">{icon}</span>
          <h2 className="text-[18px] font-medium text-white md:text-[20px]">{title}</h2>
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

const sectionOrder = [
  { key: "flight", label: "Flights", icon: <Plane size={18} /> },
  { key: "hotel", label: "Hotels", icon: <Hotel size={18} /> },
  { key: "transportation", label: "Transportation", icon: <Car size={18} /> },
  { key: "activity_trip", label: "Trips & Activities", icon: <Sparkles size={18} /> },
  { key: "event", label: "Events", icon: <Ticket size={18} /> },
  { key: "restaurant", label: "Restaurants", icon: <UtensilsCrossed size={18} /> },
] as const;

export default function BookingClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get("planId");
  const saveAttemptedRef = useRef(false);

  const [payload, setPayload] = useState<RecommendationPayload | null>(null);
  const [savedPlanId, setSavedPlanId] = useState<string | null>(null);
  const [loadingSavedPlan, setLoadingSavedPlan] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [bookingKeyInFlight, setBookingKeyInFlight] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

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
        if (!res.ok || !json?.plan) throw new Error(json?.message || "This booking plan is not ready yet.");
        const nextPayload = buildSummaryPayloadFromPlan(json.plan);
        if (!nextPayload) throw new Error("This saved plan does not have a complete booking payload yet.");
        setPayload(nextPayload);
        setSavedPlanId(json.plan.id);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "This booking plan is not ready yet.");
      } finally {
        setLoadingSavedPlan(false);
      }
    }
    loadSavedPlan();
  }, [payload, planId]);

  useEffect(() => {
    if (!payload) return;
    const computed = refreshBookingTotals(buildBookingStateFromPayload(payload));
    const current = payload.summaryState?.bookingState;
    if (JSON.stringify(current) === JSON.stringify(computed)) return;
    setPayload((currentPayload) =>
      currentPayload
        ? {
            ...currentPayload,
            summaryState: {
              ...currentPayload.summaryState,
              bookingState: computed,
            },
          }
        : currentPayload,
    );
  }, [payload]);

  useEffect(() => {
    if (!payload) return;
    sessionStorage.setItem("gene-recommendation-payload", JSON.stringify(payload));
  }, [payload]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [notice]);

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
        if (!res.ok || !data?.ok || !data.planId) throw new Error("Unable to prepare booking links yet.");
        setSavedPlanId(data.planId);
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    }
    saveToProfile();
  }, [payload, savedPlanId]);

  const bookingState = payload?.summaryState?.bookingState ?? null;
  const currency = payload?.inputs.currency || "USD";

  const groupedItems = useMemo(() => {
    const groups: Record<string, typeof bookingState.items> = {
      flight: [],
      hotel: [],
      transportation: [],
      activity_trip: [],
      event: [],
      restaurant: [],
    };
    for (const item of bookingState?.items || []) {
      if (item.type === "activity" || item.type === "trip") groups.activity_trip.push(item);
      else groups[item.type]?.push(item);
    }
    return groups;
  }, [bookingState]);

  function updateBookingState(nextState: NonNullable<RecommendationPayload["summaryState"]>["bookingState"]) {
    setPayload((currentPayload) =>
      currentPayload
        ? {
            ...currentPayload,
            summaryState: {
              ...currentPayload.summaryState,
              bookingState: nextState,
            },
          }
        : currentPayload,
    );
  }

  async function handleBookNow(itemKey: string) {
    if (!payload || !bookingState) return;
    if (!savedPlanId) {
      setNotice("Preparing booking links for your saved trip. Please try again in a moment.");
      return;
    }
    const apiBase = `/api/affiliate/redirect?planId=${encodeURIComponent(savedPlanId)}&itemKey=${encodeURIComponent(itemKey)}`;
    setBookingKeyInFlight(itemKey);
    try {
      const res = await fetch(`${apiBase}&resolve=1`, { method: "GET" });
      const json = (await res.json().catch(() => null)) as { ok?: boolean; url?: string; message?: string } | null;
      if (!res.ok || !json?.ok || !json.url) {
        setNotice(json?.message || "Booking link is not available yet. Please try another option.");
        return;
      }
      const nextState = refreshBookingTotals(updateBookingItemStatus(bookingState, itemKey, "clicked")!);
      updateBookingState(nextState);
      trackAnalyticsEvent("booking_button_clicked", {
        source: "booking_page",
        itemKey,
        planId: savedPlanId || payload.planId || planId,
      });
      window.open(apiBase, "_blank", "noopener,noreferrer");
    } catch {
      setNotice("Booking link is not available yet. Please try another option.");
    } finally {
      setBookingKeyInFlight(null);
    }
  }

  function continueToSummary() {
    if (!payload || !bookingState) return;
    const nextPayload = {
      ...payload,
      summaryState: {
        ...payload.summaryState,
        bookingState: refreshBookingTotals(bookingState),
      },
    };
    sessionStorage.setItem("gene-recommendation-payload", JSON.stringify(nextPayload));
    setPayload(nextPayload);
    trackAnalyticsEvent("summary_viewed", {
      source: "booking_continue",
      planId: savedPlanId || payload.planId || planId,
      totalConfirmedCost: nextPayload.summaryState?.bookingState?.totals?.totalConfirmedCost ?? 0,
    });
    router.push(`/summary?planId=${savedPlanId || payload.planId || planId || ""}`);
  }

  if (loadingSavedPlan || !payload || !bookingState) {
    return (
      <AiSuiteFrame activePage="booking" planId={savedPlanId || planId || undefined}>
        <section className="rounded-[24px] border border-white/10 bg-black/28 p-6 text-white/70">
          {errorMessage || "Preparing your booking workspace..."}
        </section>
      </AiSuiteFrame>
    );
  }

  const totals = bookingState.totals;
  const routeLabel = getRouteLabel(payload);
  const travelerLabel = getTravelerLabel(payload);

  return (
    <AiSuiteFrame activePage="booking" planId={savedPlanId || payload.planId || planId}>
      <section className="space-y-5">
        <div className="grid gap-5 xl:grid-cols-[1fr_auto] xl:items-start">
          <div>
            <h1 className="text-[28px] font-semibold leading-none text-white md:text-[30px]">Booking</h1>
            <div className="mt-2 text-[13px] text-white/68 md:text-[14px]">
              Confirm your selected trip items and open provider booking links through Gene.
            </div>
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
              href={`/ai/recommendation?planId=${payload.planId || planId || ""}`}
              className="rounded-[14px] border border-[#ff7a00]/40 bg-transparent px-4 py-2.5 text-[13px] font-medium text-[#ff9d4d] transition hover:bg-[#ff7a00]/10"
            >
              Back to Recommendations
            </Link>
          </div>
        </div>

        {notice ? (
          <div className="rounded-[16px] border border-[#ff7a00]/22 bg-[#ff7a00]/10 px-4 py-3 text-[13px] text-[#ffcf9d]">
            {notice}
          </div>
        ) : null}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5">
            {sectionOrder.map((section) => {
              const items = groupedItems[section.key] || [];
              return (
                <SectionCard
                  key={section.key}
                  title={section.label}
                  icon={section.icon}
                  action={<div className="text-[12px] text-white/46">{items.length} selected</div>}
                >
                  {items.length === 0 ? (
                    <div className="rounded-[18px] border border-white/10 bg-black/18 px-4 py-4 text-[13px] text-white/56">
                      No confirmed {section.label.toLowerCase()} selected yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {items.map((item) => (
                        <div
                          key={item.key}
                          className="grid gap-3 rounded-[20px] border border-white/10 bg-black/20 p-3.5 md:grid-cols-[120px_minmax(0,1fr)_auto]"
                        >
                          <div className="relative h-[112px] overflow-hidden rounded-[16px] border border-white/10">
                            {item.image ? (
                              <Image src={item.image} alt={item.title} fill className="object-cover" />
                            ) : (
                              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,122,0,0.18),transparent_45%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(0,0,0,0.86))]" />
                            )}
                            <div className="absolute left-2 top-2 rounded-full border border-white/10 bg-black/50 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-[#ffcf9d]">
                              {item.status === "clicked" ? "Clicked / Pending Booking" : item.status === "cancelled" ? "Cancelled" : "Pending"}
                            </div>
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <div className="text-[17px] font-medium text-white">{item.title}</div>
                                <div className="mt-1 text-[12px] text-white/54">{item.subtitle}</div>
                              </div>
                              <button
                                type="button"
                                className={`rounded-full border px-3 py-1.5 text-[11px] font-medium ${
                                  item.status === "clicked"
                                    ? "border-[#ff7a00]/30 bg-[#ff7a00]/14 text-[#ffcf9d]"
                                    : "border-white/10 bg-black/20 text-white/62"
                                }`}
                              >
                                {item.status === "clicked" ? "Clicked / Pending Booking" : "Pending"}
                              </button>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-white/54">
                              {item.provider ? (
                                <span className="rounded-full border border-white/10 px-2.5 py-1">{item.provider}</span>
                              ) : null}
                              {item.destinationId ? (
                                <span className="rounded-full border border-white/10 px-2.5 py-1">{item.destinationId}</span>
                              ) : null}
                              {item.pricePerPerson ? (
                                <span className="rounded-full border border-white/10 px-2.5 py-1">
                                  {formatCurrency(item.pricePerPerson, currency)} / person
                                </span>
                              ) : null}
                            </div>

                            {item.upgrade ? (
                              <div className="mt-3 rounded-[14px] border border-[#ff7a00]/18 bg-[#ff7a00]/08 px-3 py-2.5 text-[12px] text-white/78">
                                <div className="font-medium text-[#ffcf9d]">
                                  Upgrade selected: {item.upgrade.name}. Please book this upgrade option.
                                </div>
                                <div className="mt-1 text-white/58">
                                  Upgrade price {formatCurrency(item.upgrade.price, currency)} | Updated total {formatCurrency(item.finalPrice, currency)}
                                </div>
                              </div>
                            ) : null}
                          </div>

                          <div className="flex flex-col items-end justify-between gap-3">
                            <div className="text-right">
                              <div className="text-[22px] font-medium text-white">{formatCurrency(item.finalPrice, currency)}</div>
                              <div className="mt-1 text-[11px] text-white/48">Confirmed cost</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleBookNow(item.key)}
                              disabled={bookingKeyInFlight === item.key}
                              className="inline-flex items-center gap-2 rounded-[14px] bg-[linear-gradient(135deg,#ff7a00,rgba(255,166,74,0.96))] px-4 py-2.5 text-[13px] font-medium text-black shadow-[0_18px_44px_rgba(255,122,0,0.22)] transition hover:translate-y-[-1px] disabled:cursor-wait disabled:opacity-60"
                            >
                              <ExternalLink size={14} />
                              {bookingKeyInFlight === item.key ? "Opening..." : "Book Now"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </SectionCard>
              );
            })}
          </div>

          <div className="space-y-5">
            <SectionCard
              title="Trip Summary"
              icon={<Wallet size={18} />}
              action={<div className="text-[12px] text-white/46">Confirmed costs only</div>}
            >
              <div className="space-y-3">
                {[
                  ["Flights", totals.flights],
                  ["Hotels", totals.hotels],
                  ["Transportation", totals.transportation],
                  ["Trips & Activities", totals.trips],
                  ["Events", totals.events],
                  ["Restaurants", totals.restaurants],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-3 rounded-[16px] border border-white/10 bg-black/18 px-4 py-3">
                    <div className="text-[13px] text-white/68">{label}</div>
                    <div className="text-[16px] font-medium text-white">{formatCurrency(Number(value), currency)}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-[18px] border border-[#ff7a00]/22 bg-[#ff7a00]/08 px-4 py-4">
                <div className="text-[12px] uppercase tracking-[0.16em] text-[#ffcf9d]">Total Confirmed Trip Cost</div>
                <div className="mt-2 text-[28px] font-semibold text-white">{formatCurrency(totals.totalConfirmedCost, currency)}</div>
              </div>
            </SectionCard>

            <SectionCard title="Booking Readiness" icon={<Clock3 size={18} />}>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[16px] border border-white/10 bg-black/18 px-4 py-4">
                  <div className="text-[12px] text-white/48">Pending</div>
                  <div className="mt-2 text-[24px] font-medium text-white">{totals.pendingCount}</div>
                </div>
                <div className="rounded-[16px] border border-white/10 bg-black/18 px-4 py-4">
                  <div className="text-[12px] text-white/48">Clicked</div>
                  <div className="mt-2 text-[24px] font-medium text-white">{totals.bookedClickedCount}</div>
                </div>
                <div className="rounded-[16px] border border-white/10 bg-black/18 px-4 py-4">
                  <div className="text-[12px] text-white/48">Activities</div>
                  <div className="mt-2 text-[24px] font-medium text-white">{totals.totalActivities}</div>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[22px] border border-[#ff7a00]/18 bg-[linear-gradient(180deg,rgba(255,122,0,0.08),rgba(0,0,0,0.18))] px-4 py-4 shadow-[0_22px_60px_rgba(0,0,0,0.2)]">
          <div className="flex items-center gap-3">
            <CalendarDays size={18} className="text-[#ff9d4d]" />
            <div>
              <div className="text-[14px] font-medium text-[#ffb36c]">Booking state is ready for Summary</div>
              <div className="text-[12px] text-white/62">We'll carry confirmed items, statuses, upgrades, and total costs forward.</div>
            </div>
          </div>
          <button
            type="button"
            onClick={continueToSummary}
            className="inline-flex items-center gap-2 rounded-[16px] bg-[linear-gradient(135deg,#ff7a00,rgba(255,166,74,0.96))] px-5 py-3 text-[14px] font-medium text-black shadow-[0_18px_44px_rgba(255,122,0,0.22)] transition hover:translate-y-[-1px]"
          >
            Continue to Summary
            <ArrowRight size={16} />
          </button>
        </div>

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
