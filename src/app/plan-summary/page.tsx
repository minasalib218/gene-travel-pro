"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  DayPlanItem,
  RecommendationBase,
  RecommendationPayload,
  SelectedRecommendations,
} from "@/lib/recommendation/types";

function safeLink(url?: string | null) {
  if (!url) return null;
  try {
    return new URL(url).toString();
  } catch {
    return null;
  }
}

function getBookingLink(item: DayPlanItem, payload: RecommendationPayload) {
  if (safeLink(item.deepLink)) return safeLink(item.deepLink);

  if (item.type === "hotel") return safeLink(payload.selected.hotel?.deepLink);
  if (item.type === "flight") return safeLink(payload.selected.flight?.deepLink);
  if (item.type === "restaurant") return safeLink(payload.selected.restaurant?.deepLink);
  if (item.type === "transport") return safeLink(payload.selected.transport?.deepLink);
  if (item.type === "car") return safeLink(payload.selected.car?.deepLink);
  if (item.type === "activity") {
    const match = payload.selected.activities.find((activity) => activity.id === item.id);
    return safeLink(match?.deepLink);
  }
  return null;
}

function getItemImage(item: DayPlanItem, selected: SelectedRecommendations) {
  if (item.imageUrl) return item.imageUrl;
  if (item.type === "hotel") return selected.hotel?.imageUrl ?? null;
  if (item.type === "flight") return selected.flight?.imageUrl ?? null;
  if (item.type === "restaurant") return selected.restaurant?.imageUrl ?? null;
  if (item.type === "transport") return selected.transport?.imageUrl ?? null;
  if (item.type === "car") return selected.car?.imageUrl ?? null;
  if (item.type === "activity") {
    return selected.activities.find((activity) => activity.id === item.id)?.imageUrl ?? null;
  }
  return null;
}

function getCollectionCards(payload: RecommendationPayload) {
  const cards: Array<{
    key: string;
    label: string;
    name: string;
    subtitle: string;
    imageUrl: string;
    href: string | null;
  }> = [];

  const pushCard = (
    key: string,
    label: string,
    item: (RecommendationBase & Record<string, unknown>) | null | undefined,
    subtitle: string,
  ) => {
    if (!item) return;
    cards.push({
      key,
      label,
      name: item.name,
      subtitle,
      imageUrl: item.imageUrl,
      href: safeLink(item.deepLink),
    });
  };

  pushCard(
    "hotel",
    "Hotel",
    payload.selected.hotel,
    payload.selected.hotel ? `${payload.selected.hotel.area} • ${payload.selected.hotel.nightlyPrice} / night` : "",
  );
  pushCard(
    "flight",
    "Flight",
    payload.selected.flight,
    payload.selected.flight
      ? `${payload.selected.flight.route} • ${payload.selected.flight.departureTime}`
      : "",
  );
  pushCard(
    "restaurant",
    "Restaurant",
    payload.selected.restaurant,
    payload.selected.restaurant
      ? `${payload.selected.restaurant.cuisine} • ${payload.selected.restaurant.mealWindow}`
      : "",
  );
  pushCard(
    "transport",
    "Transport",
    payload.selected.transport,
    payload.selected.transport
      ? `${payload.selected.transport.transportType} • ${payload.selected.transport.costLabel}`
      : "",
  );
  pushCard(
    "car",
    "Car Rental",
    payload.selected.car,
    payload.selected.car
      ? `${payload.selected.car.carType} • ${payload.selected.car.dailyPrice} / day`
      : "",
  );

  payload.selected.activities.forEach((activity, index) => {
    cards.push({
      key: `activity-${activity.id}`,
      label: `Activity ${index + 1}`,
      name: activity.name,
      subtitle: `${activity.categoryLabel} • ${activity.bestTimeOfDay}`,
      imageUrl: activity.imageUrl,
      href: safeLink(activity.deepLink),
    });
  });

  return cards;
}

function formatDateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTypeLabel(type: DayPlanItem["type"]) {
  if (type === "car") return "Car Rental";
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export default function PlanSummaryPage() {
  const router = useRouter();
  const [payload, setPayload] = useState<RecommendationPayload | null>(null);
  const [savedPlanId, setSavedPlanId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const saveAttemptedRef = useRef(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("gene-recommendation-payload");
    if (!raw) return;
    try {
      setPayload(JSON.parse(raw));
    } catch {
      setPayload(null);
    }
  }, []);

  const collectionCards = useMemo(() => (payload ? getCollectionCards(payload) : []), [payload]);
  const totalDays = payload?.dayPlan?.length ?? 0;
  const totalActivities = payload?.selected.activities.length ?? 0;

  useEffect(() => {
    async function saveToProfile() {
      if (!payload?.planId || saveAttemptedRef.current) return;

      saveAttemptedRef.current = true;
      setSaveState("saving");

      try {
        const res = await fetch(`/api/plan-inputs/${payload.planId}/finalize-summary`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ payload }),
        });

        const data = (await res.json().catch(() => null)) as
          | { ok?: boolean; planId?: string }
          | null;

        if (!res.ok || !data?.ok || !data.planId) {
          throw new Error("Unable to save this trip to the customer profile.");
        }

        setSavedPlanId(data.planId);
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    }

    saveToProfile();
  }, [payload]);

  if (!payload) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#080808] text-white">
        <div className="absolute inset-0">
          <Image
            src="/recommendation-bg.jpg"
            alt="Gene summary"
            fill
            priority
            className="object-cover opacity-75"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black" />
        </div>

        <section className="relative z-10 mx-auto flex min-h-screen max-w-5xl items-center px-6 py-16">
          <div className="w-full rounded-[36px] border border-white/12 bg-black/35 p-8 shadow-[0_30px_100px_rgba(0,0,0,0.55)] backdrop-blur-2xl md:p-10">
            <div className="text-[11px] uppercase tracking-[0.28em] text-[#ffbf82]">
              Plan Summary
            </div>
            <h1 className="mt-5 text-4xl font-semibold leading-tight md:text-5xl">
              There is no active summary to show yet.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/68">
              Finish the recommendation and analysis flow first, then the final day-by-day plan
              will appear here in the same cinematic format.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/ai/recommendation"
                className="rounded-full bg-[linear-gradient(135deg,#ff7a00,rgba(255,208,153,0.96))] px-6 py-3 text-sm font-semibold text-black shadow-[0_16px_50px_rgba(255,122,0,0.22)]"
              >
                Return to Recommendation
              </Link>
              <Link
                href="/ai-planner"
                className="rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm text-white/85"
              >
                Start New Plan
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const heroImage =
    payload.selected.hotel?.imageUrl ||
    payload.selected.activities[0]?.imageUrl ||
    payload.selected.flight?.imageUrl ||
    "/recommendation-bg.jpg";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070707] text-white">
      <div className="absolute inset-0">
        <Image
          src={heroImage}
          alt={payload.inputs.destination}
          fill
          priority
          className="object-cover opacity-85"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,7,7,0.5)_0%,rgba(7,7,7,0.78)_24%,rgba(7,7,7,0.96)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,122,0,0.18),transparent_32%)]" />
      </div>

      <section className="relative z-10 mx-auto max-w-7xl px-5 pb-16 pt-10 md:px-6">
        <div className="overflow-hidden rounded-[42px] border border-white/12 bg-black/30 shadow-[0_40px_120px_rgba(0,0,0,0.52)] backdrop-blur-2xl">
          <div className="relative min-h-[360px] overflow-hidden">
            <Image
              src={heroImage}
              alt={payload.inputs.destination}
              fill
              className="object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,9,9,0.88)_0%,rgba(9,9,9,0.65)_40%,rgba(9,9,9,0.35)_100%)]" />

            <div className="relative grid gap-8 px-6 py-8 md:px-10 lg:grid-cols-[1.1fr,0.9fr] lg:px-12 lg:py-12">
              <div className="flex flex-col justify-between">
                <div>
                  <div className="inline-flex rounded-full border border-white/12 bg-white/5 px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-[#ffbf82]">
                    Final Ready Plan
                  </div>
                  <h1 className="mt-6 text-4xl font-semibold leading-[0.95] md:text-6xl">
                    {payload.inputs.destination}
                  </h1>
                  <p className="mt-5 max-w-2xl text-sm leading-7 text-white/68 md:text-base">
                    Your selected hotel, transport, flights, dining, and experiences are now
                    arranged as one cinematic trip summary with direct booking actions inside the
                    final route.
                  </p>
                </div>

                <div className="mt-8 flex flex-wrap gap-4">
                  <button
                    onClick={() => router.push("/ai/analysis")}
                    className="rounded-full bg-[linear-gradient(135deg,#ff7a00,rgba(255,212,165,0.96))] px-6 py-3 text-sm font-semibold text-black shadow-[0_16px_55px_rgba(255,122,0,0.24)]"
                  >
                    Back to Analysis
                  </button>
                  <button
                    onClick={() => router.push("/ai/recommendation")}
                    className="rounded-full border border-white/18 bg-white/5 px-6 py-3 text-sm text-white/85"
                  >
                    Edit Recommendation
                  </button>
                  {savedPlanId ? (
                    <Link
                      href="/profile"
                      className="rounded-full border border-white/18 bg-white/5 px-6 py-3 text-sm text-white/85"
                    >
                      Open Profile
                    </Link>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-4 self-end sm:grid-cols-3">
                <SummaryStat
                  label="Trip window"
                  value={`${formatDateLabel(payload.inputs.startDate)} - ${formatDateLabel(payload.inputs.endDate)}`}
                />
                <SummaryStat label="Day plan" value={`${totalDays} days`} />
                <SummaryStat label="Experiences" value={`${totalActivities} selected`} />
              </div>
            </div>
          </div>

          <div className="grid gap-4 border-t border-white/10 bg-black/30 px-6 py-6 md:grid-cols-3 xl:px-12">
            <SummaryStripCard
              title="Departure"
              value={payload.inputs.departureCity}
              note={`${payload.inputs.travelersCount} travelers • ${payload.inputs.travelStyle}`}
            />
            <SummaryStripCard
              title="Budget"
              value={`${payload.inputs.currency} ${payload.inputs.budget}`}
              note={`Preferred transport: ${payload.inputs.preferredTransport}`}
            />
            <SummaryStripCard
              title="Travel mood"
              value={payload.inputs.travelerType}
              note={`${payload.inputs.hotelClass} hotel class • Walking ${payload.inputs.walkingTolerance}/10`}
            />
          </div>
          <div className="border-t border-white/10 bg-black/20 px-6 py-4 xl:px-12">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-white/10 bg-white/[0.04] px-5 py-4 backdrop-blur-xl">
              <div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-[#ffbf82]">
                  Profile Sync
                </div>
                <div className="mt-2 text-sm text-white/72">
                  {saveState === "saving"
                    ? "Saving this finished trip into the customer profile..."
                    : saveState === "saved"
                      ? "This trip is now saved on the customer profile."
                      : saveState === "error"
                        ? "We could not save this trip automatically yet."
                        : "This final route will be attached to the customer profile."}
                </div>
              </div>
              {savedPlanId ? (
                <Link
                  href={`/plan-summary/${savedPlanId}`}
                  className="rounded-full bg-[linear-gradient(135deg,#ff7a00,rgba(255,212,165,0.96))] px-5 py-3 text-sm font-semibold text-black shadow-[0_16px_42px_rgba(255,122,0,0.2)]"
                >
                  Open saved version
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        <section className="mt-10 rounded-[34px] border border-white/10 bg-black/25 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-2xl md:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.26em] text-[#ffbf82]">
                Chosen Collection
              </div>
              <h2 className="mt-3 text-3xl font-semibold">Everything the customer selected.</h2>
            </div>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {collectionCards.map((card) => {
              const Wrapper = card.href ? "a" : "div";

              return (
                <Wrapper
                  key={card.key}
                  {...(card.href ? { href: card.href, target: "_blank", rel: "noreferrer" } : {})}
                  className="group overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.04] transition hover:border-white/18"
                >
                  <div className="relative h-60">
                    <Image
                      src={card.imageUrl || "/recommendation-bg.jpg"}
                      alt={card.name}
                      fill
                      className="object-cover transition duration-700 group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(8,8,8,0.18)_40%,rgba(8,8,8,0.92)_100%)]" />
                    <div className="absolute inset-x-0 bottom-0 p-5">
                      <div className="text-[11px] uppercase tracking-[0.24em] text-white/55">
                        {card.label}
                      </div>
                      <div className="mt-3 text-2xl font-semibold text-white">{card.name}</div>
                      <div className="mt-2 text-sm leading-6 text-white/68">{card.subtitle}</div>
                      <div className="mt-4 text-sm text-[#ffbf82]">
                        {card.href ? "Open booking link →" : "Added to your final route"}
                      </div>
                    </div>
                  </div>
                </Wrapper>
              );
            })}
          </div>
        </section>

        <section className="mt-10 grid gap-8 lg:grid-cols-[0.78fr,1.22fr]">
          <aside className="h-fit rounded-[34px] border border-white/10 bg-black/25 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-2xl md:p-8 lg:sticky lg:top-8">
            <div className="text-[11px] uppercase tracking-[0.26em] text-[#ffbf82]">
              Trip Summary
            </div>
            <h2 className="mt-3 text-3xl font-semibold">Final overview before booking.</h2>
            <div className="mt-6 space-y-4 text-sm leading-7 text-white/68">
              <p>
                The day-by-day plan below keeps the selected items visual and clickable, so the
                customer can move from review to booking without losing the route structure.
              </p>
              <p>
                Each card uses the chosen image when available and falls back to the selected item
                image so the summary feels complete and cinematic.
              </p>
            </div>

            <div className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
              <div className="text-[11px] uppercase tracking-[0.24em] text-white/50">
                Selected components
              </div>
              <div className="mt-4 space-y-3 text-sm text-white/76">
                {[
                  ["Hotel", payload.selected.hotel?.name],
                  ["Flight", payload.selected.flight?.name],
                  ["Transport", payload.selected.transport?.name],
                  ["Car Rental", payload.selected.car?.name],
                  ["Restaurant", payload.selected.restaurant?.name],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-start justify-between gap-4">
                    <span className="text-white/55">{label}</span>
                    <span className="max-w-[60%] text-right text-white/90">{value ?? "-"}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <div className="space-y-6">
            {payload.dayPlan.map((day) => (
              <section
                key={day.day}
                className="overflow-hidden rounded-[34px] border border-white/10 bg-black/25 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-2xl"
              >
                <div className="flex flex-col gap-4 border-b border-white/10 px-6 py-6 md:flex-row md:items-end md:justify-between md:px-8">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.24em] text-[#ffbf82]">
                      Day {day.day}
                    </div>
                    <div className="mt-3 text-3xl font-semibold text-white">{day.theme}</div>
                    <div className="mt-2 text-sm text-white/58">{day.date}</div>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs uppercase tracking-[0.22em] text-white/58">
                    {day.items.length} stops
                  </div>
                </div>

                <div className="space-y-4 px-6 py-6 md:px-8">
                  {day.items.map((item) => {
                    const bookingLink = getBookingLink(item, payload);
                    const imageUrl = getItemImage(item, payload.selected) || "/recommendation-bg.jpg";

                    return (
                      <article
                        key={item.id}
                        className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04]"
                      >
                        <div className="grid gap-0 md:grid-cols-[260px,1fr]">
                          <div className="relative min-h-[220px]">
                            <Image src={imageUrl} alt={item.title} fill className="object-cover" />
                            <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(8,8,8,0.2)_38%,rgba(8,8,8,0.75)_100%)]" />
                            <div className="absolute left-4 top-4 rounded-full border border-white/12 bg-black/35 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-[#ffbf82] backdrop-blur-xl">
                              {formatTypeLabel(item.type)}
                            </div>
                          </div>

                          <div className="flex flex-col justify-between gap-5 p-5 md:p-6">
                            <div>
                              <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                  <div className="text-2xl font-semibold text-white">{item.title}</div>
                                  <div className="mt-2 text-sm leading-7 text-white/66">
                                    {item.description}
                                  </div>
                                </div>
                                <div className="rounded-full border border-white/10 bg-black/25 px-4 py-2 text-sm text-white/75">
                                  {item.startTime} to {item.endTime}
                                </div>
                              </div>

                              <div className="mt-5 flex flex-wrap gap-3">
                                <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs uppercase tracking-[0.18em] text-white/56">
                                  {item.slot}
                                </div>
                                {item.location ? (
                                  <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs uppercase tracking-[0.18em] text-white/56">
                                    {item.location}
                                  </div>
                                ) : null}
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                              {bookingLink ? (
                                <a
                                  href={bookingLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="rounded-full bg-[linear-gradient(135deg,#ff7a00,rgba(255,212,165,0.96))] px-5 py-3 text-sm font-semibold text-black shadow-[0_16px_42px_rgba(255,122,0,0.2)]"
                                >
                                  Book this stop
                                </a>
                              ) : (
                                <button
                                  disabled
                                  className="cursor-not-allowed rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-white/45"
                                >
                                  Booking soon
                                </button>
                              )}
                              <div className="text-sm text-white/52">
                                Added to the final day-by-day route.
                              </div>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[28px] border border-white/12 bg-black/35 p-5 backdrop-blur-xl">
      <div className="text-[11px] uppercase tracking-[0.24em] text-white/45">{label}</div>
      <div className="mt-3 text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}

function SummaryStripCard({
  title,
  value,
  note,
}: {
  title: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-black/25 p-5 backdrop-blur-xl">
      <div className="text-[11px] uppercase tracking-[0.22em] text-white/45">{title}</div>
      <div className="mt-3 text-2xl font-semibold text-white">{value}</div>
      <div className="mt-2 text-sm text-white/60">{note}</div>
    </div>
  );
}
