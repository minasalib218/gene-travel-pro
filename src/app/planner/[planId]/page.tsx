"use client";

import { useEffect, useMemo, useState } from "react";

const BRAND_ORANGE = "#ff7a00";

type TimeSlot = "MORNING" | "MIDDAY" | "AFTERNOON" | "EVENING" | "NIGHT";

type PlanItem = {
  id: string;
  slot: TimeSlot;
  type: string;
  title: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  startTime: string;
  endTime: string;
  affiliateUrl?: string | null;

  priceAmount?: number | null;
  priceCurrency?: string | null;

  safetyScore?: number | null;
  fatigueImpact?: number | null;
  preferenceScore?: number | null;
  seasonScore?: number | null;

  weatherIcon?: string | null;
  weatherTempC?: number | null;
  travelMinutesBefore?: number | null;
};

type PlanDay = {
  id: string;
  date: string;
  dayIndex: number;

  budgetUsed: number;
  budgetLimit: number;
  fatigueScore: number;
  weatherScore: number;
  seasonGenius: number;
  travelMinutes: number;
  wellnessScore: number;

  items: PlanItem[];
};

type PlanAlert = {
  id: string;
  dayIndex: number;
  type: string;
  severity: "info" | "warning" | "critical" | string;
  engine: string;
  message: string;
  ctasJson?: string | null;
};

type Plan = {
  id: string;
  destination: string;
  currency: string;
  budgetAmount: number;
  startDate: string;
  endDate: string;
  days: PlanDay[];
  alerts?: PlanAlert[];
};

type SearchActivity = {
  id: string;
  title: string;
  imageUrl?: string | null;
  subtitle?: string | null;
  priceAmount?: number | null;
  priceCurrency?: string | null;
  affiliateUrl?: string | null;
};

function fmtMoney(amountCents?: number | null, currency?: string | null) {
  if (amountCents == null) return "";
  const v = (amountCents / 100).toFixed(0);
  return currency ? `${v} ${currency}` : v;
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function barWidth(score: number) {
  return `${Math.round(clamp01(score) * 100)}%`;
}

function dayLabel(dayIndex: number) {
  return `Day ${dayIndex + 1}`;
}

export default function PlannerTimelinePage({
  params,
}: {
  params: { planId: string };
}) {
  // Use cinematic skyline (your permanent AI planner background)
  const bgUrl = "/bg/ai-skyline.jpg";

  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [activeDayIndex, setActiveDayIndex] = useState(0);

  // Replace/Search Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [replaceTarget, setReplaceTarget] = useState<{
    dayId: string;
    itemId: string;
  } | null>(null);

  const [searchQ, setSearchQ] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchActivity[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  // Load plan
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setErr(null);
        const res = await fetch(`/api/plan/${params.planId}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data?.error || "Failed to load plan");

        if (!cancelled) {
          setPlan(data.plan);
          setActiveDayIndex(0);
        }
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
  }, [params.planId]);

  const day = useMemo(() => {
    if (!plan?.days?.length) return null;
    return plan.days[Math.min(activeDayIndex, plan.days.length - 1)];
  }, [plan, activeDayIndex]);

  const dayAlerts = useMemo(() => {
    if (!plan?.alerts?.length) return [];
    return plan.alerts.filter((a) => a.dayIndex === (day?.dayIndex ?? 0));
  }, [plan, day]);

  async function rebuildDay(mode: "balanced" | "relaxed" | "adventure") {
    if (!day) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/plan/${plan!.id}/rebuild-day`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dayIndex: day.dayIndex, mode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to rebuild day");
      setPlan(data.plan);
    } catch (e: any) {
      alert(e?.message || "Rebuild failed");
    } finally {
      setActionLoading(false);
    }
  }

  function openReplace(dayId: string, itemId: string) {
    setReplaceTarget({ dayId, itemId });
    setDrawerOpen(true);
    setSearchQ("");
    setSearchResults([]);
  }

  async function runSearch() {
    if (!plan || !day) return;
    setSearchLoading(true);
    try {
      // search endpoint can be stubbed now and improved later
      const qs = new URLSearchParams({
        destination: plan.destination,
        date: day.date,
        q: searchQ,
      });

      const res = await fetch(`/api/search/activities?${qs.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Search failed");

      // Accept either {activities: []} or {results: []}
      const list = (data.activities || data.results || []) as any[];

      const mapped: SearchActivity[] = list.map((x) => ({
        id: x.id ?? x.providerRef ?? x.activityId ?? String(Math.random()),
        title: x.title ?? x.name ?? "Activity",
        subtitle: x.subtitle ?? x.category ?? null,
        imageUrl: x.imageUrl ?? (x.images?.[0] ?? null),
        priceAmount: x.priceAmount ?? x.price?.amount ?? null,
        priceCurrency: x.priceCurrency ?? x.price?.currency ?? null,
        affiliateUrl: x.affiliateUrl ?? x.url ?? null,
      }));

      setSearchResults(mapped);
    } catch (e: any) {
      alert(e?.message || "Search failed");
    } finally {
      setSearchLoading(false);
    }
  }

  async function confirmReplace(newActivityId: string) {
    if (!plan || !replaceTarget) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/plan/${plan.id}/replace-item`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dayId: replaceTarget.dayId,
          itemId: replaceTarget.itemId,
          newActivityId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Replace failed");

      setPlan(data.plan);
      setDrawerOpen(false);
      setReplaceTarget(null);
    } catch (e: any) {
      alert(e?.message || "Replace failed");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        Loading plan…
      </div>
    );
  }

  if (err || !plan || !day) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="text-red-300">Error: {err || "Plan not found"}</div>
      </div>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden text-white">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={bgUrl}
          alt="Planner background"
          className="h-full w-full object-cover opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/72 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,122,0,0.20),transparent_45%)]" />
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
                Gene Travel • Timeline Editor
              </div>
              <div className="text-lg font-semibold">
                {plan.destination} — {dayLabel(day.dayIndex)}
              </div>
            </div>
          </div>

          {/* Day tabs */}
          <div className="hidden md:flex items-center gap-2">
            {plan.days.map((d) => (
              <button
                key={d.id}
                onClick={() => setActiveDayIndex(d.dayIndex)}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  d.dayIndex === day.dayIndex
                    ? "border-white/20 bg-white/10 text-white"
                    : "border-white/10 bg-white/5 text-white/70 hover:text-white"
                }`}
              >
                {dayLabel(d.dayIndex)}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main layout */}
      <section className="mx-auto w-full max-w-7xl px-5 pb-24 pt-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[290px,minmax(0,1fr),340px]">
          {/* LEFT: Day Summary */}
          <aside className="space-y-4">
            <Card title="Day Summary">
              <div className="space-y-3 text-sm text-white/75">
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Budget</span>
                  <span className="font-semibold">
                    {fmtMoney(day.budgetUsed, plan.currency)} /{" "}
                    {fmtMoney(day.budgetLimit, plan.currency)}
                  </span>
                </div>

                <Metric label="Fatigue" value={day.fatigueScore} />
                <Metric label="Weather" value={day.weatherScore} />
                <Metric label="Season Genius" value={day.seasonGenius} />

                <div className="flex items-center justify-between">
                  <span className="text-white/60">Travel Minutes</span>
                  <span className="font-semibold">{day.travelMinutes} min</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-white/60">Wellness</span>
                  <span className="font-semibold">
                    {Math.round(clamp01(day.wellnessScore) * 10)}/10
                  </span>
                </div>
              </div>
            </Card>

            <Card title="Quick Actions">
              <div className="grid grid-cols-2 gap-3">
                <ActionButton
                  onClick={() => rebuildDay("balanced")}
                  disabled={actionLoading}
                  label="Rebuild (Balanced)"
                />
                <ActionButton
                  onClick={() => rebuildDay("relaxed")}
                  disabled={actionLoading}
                  label="Rebuild (Relaxed)"
                />
                <ActionButton
                  onClick={() => rebuildDay("adventure")}
                  disabled={actionLoading}
                  label="Rebuild (Adventure)"
                />
                <ActionButton
                  onClick={() => (window.location.href = `/plan-summary/${plan.id}`)}
                  disabled={actionLoading}
                  label="Go to Summary"
                  highlight
                />
              </div>
            </Card>
          </aside>

          {/* CENTER: Timeline */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-[0.2em] text-white/60">
                Day Timeline
              </div>
              <div className="text-xs text-white/55">
                Drag-and-drop can be added later (v2). For now: Replace / Rebuild.
              </div>
            </div>

            {day.items.map((item) => (
              <TimelineCard
                key={item.id}
                item={item}
                currency={plan.currency}
                onReplace={() => openReplace(day.id, item.id)}
              />
            ))}

            {day.items.length === 0 && (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white/70 backdrop-blur-xl">
                No items for this day yet. Use Rebuild Day.
              </div>
            )}
          </section>

          {/* RIGHT: Alerts */}
          <aside className="space-y-4">
            <Card title="Alerts & AI Suggestions">
              {dayAlerts.length === 0 ? (
                <div className="text-sm text-white/70">
                  No alerts right now. When engines are fully enabled, budget/weather/safety
                  warnings appear here with one-click fixes.
                </div>
              ) : (
                <div className="space-y-3">
                  {dayAlerts.map((a) => (
                    <div
                      key={a.id}
                      className="rounded-2xl border border-white/10 bg-black/25 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-xs uppercase tracking-[0.2em] text-white/60">
                          {a.engine} • {a.type}
                        </div>
                        <Badge severity={a.severity} />
                      </div>
                      <div className="mt-2 text-sm text-white/80">{a.message}</div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(safeParseCtas(a.ctasJson) || []).map((cta) => (
                          <span
                            key={cta}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70"
                          >
                            {cta}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card title="Search & Replace">
              <div className="text-sm text-white/70">
                Use “Replace” on any timeline card to open the search drawer and pick a real API
                option.
              </div>
            </Card>
          </aside>
        </div>
      </section>

      {/* Bottom bar */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-3">
          <div className="text-xs text-white/60">
            {plan.destination} • {dayLabel(day.dayIndex)} • {day.items.length} items
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => rebuildDay("balanced")}
              disabled={actionLoading}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/80 hover:bg-white/10 disabled:opacity-60"
            >
              Rebuild Day
            </button>

            <button
              onClick={() => (window.location.href = `/plan-summary/${plan.id}`)}
              className="rounded-full px-4 py-2 text-xs font-semibold"
              style={{
                background: `linear-gradient(135deg, ${BRAND_ORANGE}, rgba(255,170,90,0.95))`,
                boxShadow: "0 12px 35px rgba(255,122,0,0.22)",
              }}
            >
              Final Analysis
            </button>
          </div>
        </div>
      </footer>

      {/* Replace drawer modal */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-full max-w-lg border-l border-white/10 bg-black/65 backdrop-blur-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div>
                <div className="text-[11px] uppercase tracking-[0.28em] text-white/60">
                  Replace Item
                </div>
                <div className="text-lg font-semibold">Search real options</div>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex gap-2">
                <input
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder="Search activities, attractions, tours…"
                  className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/25"
                />
                <button
                  onClick={runSearch}
                  disabled={searchLoading}
                  className="rounded-2xl px-4 py-3 text-sm font-semibold disabled:opacity-60"
                  style={{
                    background: `linear-gradient(135deg, ${BRAND_ORANGE}, rgba(255,170,90,0.95))`,
                  }}
                >
                  {searchLoading ? "…" : "Search"}
                </button>
              </div>

              <div className="text-xs text-white/55">
                Results should come from provider APIs (Viator/Booking/Trip/etc). For now this can be stubbed.
              </div>

              <div className="space-y-3 overflow-auto pb-24">
                {searchResults.map((r) => (
                  <div
                    key={r.id}
                    className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-3"
                  >
                    <div className="h-16 w-16 overflow-hidden rounded-xl bg-white/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {r.imageUrl ? (
                        <img src={r.imageUrl} alt={r.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="text-sm font-semibold">{r.title}</div>
                      <div className="text-xs text-white/60">{r.subtitle || "Activity"}</div>
                      <div className="mt-1 text-xs text-orange-200">
                        {fmtMoney(r.priceAmount ?? null, r.priceCurrency ?? null)}
                      </div>
                    </div>

                    <button
                      onClick={() => confirmReplace(r.id)}
                      disabled={actionLoading}
                      className="h-fit rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 hover:bg-white/10 disabled:opacity-60"
                    >
                      Replace
                    </button>
                  </div>
                ))}

                {searchResults.length === 0 && (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                    Search results will appear here.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/** UI helpers */

function Card({ title, children }: { title: string; children: any }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
      <div className="text-xs uppercase tracking-[0.2em] text-white/60">
        {title}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-white/60">{label}</span>
        <span className="font-semibold">
          {Math.round(clamp01(value) * 10)}/10
        </span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-white/10">
        <div
          className="h-2 rounded-full"
          style={{
            width: barWidth(value),
            backgroundColor: BRAND_ORANGE,
          }}
        />
      </div>
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  disabled,
  highlight,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  highlight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-2xl px-3 py-3 text-xs font-semibold transition disabled:opacity-60"
      style={{
        background: highlight
          ? `linear-gradient(135deg, ${BRAND_ORANGE}, rgba(255,170,90,0.95))`
          : "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.10)",
      }}
    >
      {label}
    </button>
  );
}

function Badge({ severity }: { severity: string }) {
  const isCrit = severity === "critical";
  const isWarn = severity === "warning";
  const bg = isCrit
    ? "rgba(255,70,70,0.20)"
    : isWarn
    ? "rgba(255,190,60,0.18)"
    : "rgba(255,255,255,0.08)";
  const border = isCrit
    ? "rgba(255,70,70,0.30)"
    : isWarn
    ? "rgba(255,190,60,0.25)"
    : "rgba(255,255,255,0.12)";

  return (
    <span
      className="rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.2em]"
      style={{ background: bg, border: `1px solid ${border}`, color: "rgba(255,255,255,0.85)" }}
    >
      {severity}
    </span>
  );
}

function safeParseCtas(ctasJson?: string | null): string[] {
  if (!ctasJson) return [];
  try {
    const parsed = JSON.parse(ctasJson);
    if (Array.isArray(parsed)) return parsed.map(String);
    return [];
  } catch {
    return [];
  }
}

function TimelineCard({
  item,
  currency,
  onReplace,
}: {
  item: PlanItem;
  currency: string;
  onReplace: () => void;
}) {
  return (
    <article
      className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl transition"
      style={{
        boxShadow: "0 25px 60px rgba(0,0,0,0.45)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform =
          "translateY(-6px) scale(1.01)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform =
          "translateY(0px) scale(1)";
      }}
    >
      {/* glow */}
      <div
        className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full opacity-0 blur-3xl transition group-hover:opacity-100"
        style={{ backgroundColor: "rgba(255,122,0,0.25)" }}
      />

      <div className="flex gap-4 p-4">
        <div className="h-28 w-28 flex-shrink-0 overflow-hidden rounded-2xl bg-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-[0.2em] text-white/60">
                {item.slot} • {item.startTime}–{item.endTime}
              </div>
              <h3 className="mt-1 truncate text-lg font-semibold">{item.title}</h3>
              {item.subtitle && (
                <p className="mt-1 line-clamp-2 text-sm text-white/70">{item.subtitle}</p>
              )}
            </div>

            <div className="text-right">
              {!!item.travelMinutesBefore && (
                <div className="text-xs text-white/55">{item.travelMinutesBefore} min travel</div>
              )}
              {(item.weatherTempC != null || item.weatherIcon) && (
                <div className="mt-1 text-xs text-white/55">
                  {item.weatherIcon ? `${item.weatherIcon} ` : ""}
                  {item.weatherTempC != null ? `${Math.round(item.weatherTempC)}°C` : ""}
                </div>
              )}
              {item.priceAmount != null && (
                <div className="mt-2 text-sm font-semibold text-orange-200">
                  {fmtMoney(item.priceAmount, item.priceCurrency || currency)}
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              onClick={onReplace}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 hover:bg-white/10"
            >
              Replace
            </button>

            <button
              onClick={() => alert("Remove will be implemented next (PlanService removeItem).")}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 hover:bg-white/10"
            >
              Remove
            </button>

            {item.affiliateUrl && (
              <a
                href={item.affiliateUrl}
                target="_blank"
                rel="noreferrer"
                className="ml-auto rounded-full px-4 py-2 text-xs font-semibold"
                style={{
                  background: `linear-gradient(135deg, ${BRAND_ORANGE}, rgba(255,170,90,0.95))`,
                  boxShadow: "0 12px 35px rgba(255,122,0,0.18)",
                }}
              >
                Book
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
