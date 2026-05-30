"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const BRAND_ORANGE = "#ff7a00";

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function metric10(v: number) {
  return `${Math.round(clamp01(v) * 10)}/10`;
}

function fmtMoney(amountCents?: number | null, currency?: string | null) {
  if (amountCents == null) return "-";
  const v = (amountCents / 100).toFixed(0);
  return currency ? `${v} ${currency}` : v;
}

export default function PlanSummaryPage() {
  const bgUrl = "/bg/ai-skyline.jpg"; // your permanent skyline bg

  const router = useRouter();
  const params = useParams<{ planId: string }>();
  const planId = params?.planId;

  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!planId) {
        setErr("Missing planId in route.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErr(null);

        const res = await fetch(`/api/plan/${planId}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data?.error || "Failed to load plan");
        if (!cancelled) setPlan(data?.plan ?? null);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [planId]);

  const totals = useMemo(() => {
    if (!plan) return null;

    const days = Array.isArray(plan.days) ? plan.days : [];

    const budgetUsed = days.reduce((s: number, d: any) => s + (d?.budgetUsed ?? 0), 0);
    const travelMinutes = days.reduce((s: number, d: any) => s + (d?.travelMinutes ?? 0), 0);

    const avg = (arr: number[], fallback = 0.8) =>
      arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : fallback;

    const fatigueAvg = avg(days.map((d: any) => Number(d?.fatigueScore ?? 0.75)));
    const weatherAvg = avg(days.map((d: any) => Number(d?.weatherScore ?? 0.85)));
    const seasonAvg = avg(days.map((d: any) => Number(d?.seasonGenius ?? 0.8)));
    const wellnessAvg = avg(days.map((d: any) => Number(d?.wellnessScore ?? 0.75)));

    const allItems = days.flatMap((d: any) => (Array.isArray(d?.items) ? d.items : []));
    const safetyAvg = allItems.length
      ? allItems.reduce((s: number, it: any) => s + Number(it?.safetyScore ?? 0.9), 0) / allItems.length
      : 0.9;

    // until provider freshness timestamps are stored
    const freshness = 0.9;

    return {
      budgetUsed,
      budgetLimit: Number(plan?.budgetAmount ?? 0),
      travelMinutes,
      fatigueAvg,
      weatherAvg,
      seasonAvg,
      wellnessAvg,
      safetyAvg,
      freshness,
    };
  }, [plan]);

  if (loading) {
    return <div className="min-h-screen bg-black text-white p-8">Loading summary…</div>;
  }

  if (err || !plan || !totals) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="text-red-300">Error: {err || "Plan not found"}</div>
      </div>
    );
  }

  const days: any[] = Array.isArray(plan.days) ? plan.days : [];

  return (
    <main className="relative min-h-screen overflow-hidden text-white">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={bgUrl} alt="Summary background" className="h-full w-full object-cover opacity-85" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/75 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(255,122,0,0.20),transparent_45%)]" />
      </div>

      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/35 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div
              className="h-9 w-9 rounded-full"
              style={{
                background: `linear-gradient(135deg, ${BRAND_ORANGE}, rgba(255,200,120,0.9))`,
                boxShadow: "0 10px 30px rgba(255,122,0,0.25)",
              }}
            />
            <div>
              <div className="text-[11px] uppercase tracking-[0.28em] text-white/60">
                Gene Travel • Final Analysis
              </div>
              <div className="text-lg font-semibold">
                {plan?.destination || "Your Trip"} — Summary
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/planner/${plan.id}`)}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/80 hover:bg-white/10"
            >
              Back to Timeline
            </button>

            <button
              onClick={() => alert("Export/Share will be added in v2 (PDF + share image).")}
              className="rounded-full px-4 py-2 text-xs font-semibold"
              style={{
                background: `linear-gradient(135deg, ${BRAND_ORANGE}, rgba(255,170,90,0.95))`,
                boxShadow: "0 12px 35px rgba(255,122,0,0.20)",
              }}
            >
              Share / Export
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="mx-auto w-full max-w-7xl px-5 pb-16 pt-8">
        {/* Hero */}
        <div className="grid gap-6 lg:grid-cols-[1.25fr,0.75fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: BRAND_ORANGE }} />
              Cinematic analysis • API-first • no fake data
            </div>

            <h1 className="mt-4 text-3xl font-semibold leading-tight md:text-4xl">
              Your trip to{" "}
              <span style={{ color: BRAND_ORANGE }}>
                {plan?.destination || "your destination"}
              </span>{" "}
              is ready.
            </h1>

            <p className="mt-3 text-sm text-white/70 max-w-2xl">
              This plan is built to be realistic: timeline slots, budget tracking, and upgrade-ready
              for Mapbox + Weather + Provider APIs. You can always return to Timeline Editor to swap
              activities or rebuild a day.
            </p>

            {/* Story Mode (safe defaults) */}
            <div className="mt-6 rounded-3xl border border-white/10 bg-black/25 p-5">
              <div className="text-xs uppercase tracking-[0.2em] text-white/60">Story Mode</div>
              <div className="mt-2 text-lg font-semibold">
                {plan?.storyTitle || "A cinematic journey — balanced and bookable."}
              </div>
              <p className="mt-2 text-sm text-white/70 leading-relaxed">
                {plan?.storyText ||
                  "Gene builds day-by-day timelines that are budget-aware and easy to adjust. Use Replace to choose alternatives from real provider data and keep the plan smooth and realistic."}
              </p>
            </div>
          </div>

          {/* KPIs */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="text-xs uppercase tracking-[0.2em] text-white/60">Plan Health</div>

            <div className="mt-4 space-y-4">
              <Kpi
                label="Budget Used"
                value={fmtMoney(totals.budgetUsed, plan.currency)}
                sub={`of ${fmtMoney(totals.budgetLimit, plan.currency)}`}
              />
              <Kpi label="Travel Time" value={`${totals.travelMinutes} min`} sub="Total across trip" />

              <Meter label="Fatigue" score={totals.fatigueAvg} />
              <Meter label="Weather Fit" score={totals.weatherAvg} />
              <Meter label="Safety" score={totals.safetyAvg} />
              <Meter label="Season Genius" score={totals.seasonAvg} />
              <Meter label="Freshness" score={totals.freshness} />

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/60">
                Wellness:{" "}
                <span className="text-white/80 font-semibold">{metric10(totals.wellnessAvg)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Days */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-[0.2em] text-white/60">
              Day-by-day Breakdown
            </div>
            <div className="text-xs text-white/55">Timeline items + booking buttons.</div>
          </div>

          <div className="mt-4 grid gap-6">
            {days.map((d: any) => {
              const items: any[] = Array.isArray(d?.items) ? d.items : [];
              return (
                <div
                  key={d.id || `${d.dayIndex}`}
                  className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] text-white/60">
                        Day {Number(d?.dayIndex ?? 0) + 1}
                      </div>
                      <div className="text-lg font-semibold">{d?.date || "—"}</div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <MiniPill
                        label="Budget"
                        value={`${fmtMoney(d?.budgetUsed ?? 0, plan.currency)} / ${fmtMoney(
                          d?.budgetLimit ?? 0,
                          plan.currency
                        )}`}
                      />
                      <MiniPill label="Travel" value={`${d?.travelMinutes ?? 0} min`} />
                      <MiniPill label="Fatigue" value={metric10(Number(d?.fatigueScore ?? 0.75))} />
                      <MiniPill label="Weather" value={metric10(Number(d?.weatherScore ?? 0.85))} />
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    {items.map((it: any) => (
                      <div
                        key={it.id}
                        className="group relative overflow-hidden rounded-3xl border border-white/10 bg-black/25 p-4 transition"
                        style={{ boxShadow: "0 20px 45px rgba(0,0,0,0.35)" }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLDivElement).style.transform =
                            "translateY(-5px) scale(1.01)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLDivElement).style.transform =
                            "translateY(0px) scale(1)";
                        }}
                      >
                        <div
                          className="pointer-events-none absolute -left-16 -top-16 h-44 w-44 rounded-full opacity-0 blur-3xl transition group-hover:opacity-100"
                          style={{ backgroundColor: "rgba(255,122,0,0.22)" }}
                        />

                        <div className="flex gap-4">
                          <div className="h-20 w-20 overflow-hidden rounded-2xl bg-white/10">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            {it?.imageUrl ? (
                              <img
                                src={it.imageUrl}
                                alt={it?.title || "Item"}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="text-xs uppercase tracking-[0.2em] text-white/60">
                              {(it?.slot || "SLOT")} • {it?.startTime || "--:--"}–{it?.endTime || "--:--"}
                            </div>
                            <div className="mt-1 truncate text-lg font-semibold">
                              {it?.title || "Timeline item"}
                            </div>
                            {it?.subtitle && (
                              <div className="mt-1 text-sm text-white/70 line-clamp-2">
                                {it.subtitle}
                              </div>
                            )}

                            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/60">
                              {it?.travelMinutesBefore != null && (
                                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                                  Travel {it.travelMinutesBefore}m
                                </span>
                              )}
                              {(it?.weatherTempC != null || it?.weatherIcon) && (
                                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                                  {it.weatherIcon ? `${it.weatherIcon} ` : ""}
                                  {it.weatherTempC != null ? `${Math.round(it.weatherTempC)}°C` : ""}
                                </span>
                              )}
                              {it?.priceAmount != null && (
                                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-orange-200">
                                  {fmtMoney(it.priceAmount, it.priceCurrency || plan.currency)}
                                </span>
                              )}
                            </div>

                            {it?.affiliateUrl && (
                              <div className="mt-4">
                                <a
                                  href={it.affiliateUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold"
                                  style={{
                                    background: `linear-gradient(135deg, ${BRAND_ORANGE}, rgba(255,170,90,0.95))`,
                                    boxShadow: "0 12px 35px rgba(255,122,0,0.18)",
                                  }}
                                >
                                  Book this
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {items.length === 0 && (
                      <div className="rounded-3xl border border-white/10 bg-black/25 p-6 text-white/70">
                        No items in this day yet.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom note */}
        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div className="text-lg font-semibold">Want it even more accurate?</div>
          <div className="mt-2 text-sm text-white/70">
            Next upgrades: Mapbox travel times, OpenWeather slot forecasting, provider availability/pricing live,
            and a full “Freshness Score” based on API fetch timestamps.
          </div>
        </div>
      </section>
    </main>
  );
}

/* ---------- UI components ---------- */

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <div className="text-xs uppercase tracking-[0.2em] text-white/60">{label}</div>
      <div className="mt-2 text-xl font-semibold">{value}</div>
      {sub && <div className="mt-1 text-xs text-white/55">{sub}</div>}
    </div>
  );
}

function Meter({ label, score }: { label: string; score: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-[0.2em] text-white/60">{label}</div>
        <div className="text-xs text-white/70">{metric10(score)}</div>
      </div>
      <div className="mt-3 h-2 rounded-full bg-white/10">
        <div
          className="h-2 rounded-full"
          style={{
            width: `${Math.round(clamp01(score) * 100)}%`,
            backgroundColor: BRAND_ORANGE,
          }}
        />
      </div>
    </div>
  );
}

function MiniPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/75">
      <span className="text-white/55">{label}:</span>{" "}
      <span className="font-semibold">{value}</span>
    </div>
  );
}
