"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  CarFront,
  CloudSun,
  Hotel,
  MapPin,
  Music4,
  Plane,
  Sparkles,
  Star,
  UtensilsCrossed,
  Waves,
  ChevronLeft,
  ChevronRight,
  Plus,
  Ticket,
} from "lucide-react";
import type {
  ReadyPlanContent,
  ReadyPlanDayContent,
  ReadyPlanSuggestion,
  ReadyPlanTimelineItem,
} from "@/lib/ready-plan-content";

type Props = {
  planId?: string;
  slug: string;
  logoUrl?: string;
  content: ReadyPlanContent;
};

const ease = [0.22, 1, 0.36, 1] as const;

function itemIcon(type: ReadyPlanTimelineItem["type"]) {
  if (type === "hotel") return Hotel;
  if (type === "flight") return Plane;
  if (type === "transportation") return CarFront;
  if (type === "restaurant") return UtensilsCrossed;
  if (type === "event") return Ticket;
  return Waves;
}

function noteIcon(icon?: string) {
  if (icon === "map") return MapPin;
  if (icon === "food") return UtensilsCrossed;
  if (icon === "music") return Music4;
  return Sparkles;
}

function Img({
  src,
  alt,
  className,
  eager = false,
}: {
  src?: string;
  alt: string;
  className?: string;
  eager?: boolean;
}) {
  return (
    <img
      src={src || "/bg/home-hero.png"}
      alt={alt}
      className={className}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={eager ? "high" : "auto"}
    />
  );
}

export default function CinematicReadyPlanPage({ planId, slug, logoUrl = "/images/logo.png", content }: Props) {
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [storyOpen, setStoryOpen] = useState(false);
  const [heroOffset, setHeroOffset] = useState(0);

  const days = content.days;
  const activeDay = days[activeDayIndex] ?? days[0];

  function getReadyPlanBookingHref(itemId: string, hasBookingLink: boolean) {
    if (!hasBookingLink || !planId) return undefined;
    return `/api/affiliate/redirect?itemId=${encodeURIComponent(`${planId}:${itemId}`)}`;
  }

  useEffect(() => {
    const onScroll = () => setHeroOffset(Math.min(window.scrollY * 0.18, 90));
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setActiveDayIndex((current) => Math.min(current, Math.max(days.length - 1, 0)));
  }, [days.length]);

  const overviewLines = useMemo(
    () => [
      { label: "Starting Point", value: content.journeyOverview.startPoint },
      { label: "Destinations", value: content.journeyOverview.destinations },
      { label: "Trip Style", value: content.journeyOverview.tripStyle },
      { label: "Travelers", value: content.journeyOverview.travelers },
      { label: "Estimated Cost", value: content.journeyOverview.estimatedCost },
    ],
    [content.journeyOverview],
  );

  if (!activeDay) return null;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#040404_0%,#07101a_42%,#050505_100%)] text-white">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <motion.div
            style={{ y: heroOffset * -1 }}
            className="absolute inset-0"
            transition={{ duration: 0.55, ease }}
          >
            <Img
              src={content.hero.backgroundImage}
              alt={content.hero.title}
              className="h-full w-full object-cover"
              eager
            />
          </motion.div>
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,6,11,0.88)_0%,rgba(7,10,18,0.55)_45%,rgba(4,4,4,0.72)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_18%,rgba(255,122,0,0.28),transparent_22%),radial-gradient(circle_at_20%_12%,rgba(255,207,138,0.12),transparent_24%),linear-gradient(180deg,rgba(3,3,3,0.05)_0%,rgba(3,3,3,0.68)_100%)]" />
        </div>

        <div className="relative mx-auto max-w-[1680px] px-4 pb-12 pt-6 md:px-6 lg:px-8 lg:pb-16">
          <div className="flex items-center justify-between gap-4">
            <Link href="/ready-plans" className="inline-flex items-center gap-3">
              <Img src={logoUrl} alt="Gene Travel" className="h-12 w-auto object-contain md:h-14" eager />
            </Link>
            <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm text-white/82 backdrop-blur-xl">
              <Music4 size={16} className="text-[#ffb066]" />
              <span>Cinematic Story</span>
            </div>
          </div>

          <div className="mt-10 grid gap-8 xl:grid-cols-[1.2fr_360px] xl:items-start">
            <div className="max-w-4xl">
              <motion.h1
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease }}
                className="max-w-3xl text-[44px] font-semibold leading-[0.95] tracking-tight text-white md:text-[72px]"
              >
                {content.hero.title.split("Ready Plan")[0]}
                <span className="text-[#ff7a00]">Ready Plan</span>
                {content.hero.title.includes("Ready Plan") ? "" : " "}
                <span className="text-[#ffcc93]">✦</span>
              </motion.h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-white/76">
                {content.hero.subtitle}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {content.hero.stats.map((stat) => (
                  <motion.div
                    key={`${stat.label}-${stat.value}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease }}
                    className="min-w-[112px] rounded-[22px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04))] px-4 py-3 backdrop-blur-xl"
                  >
                    <div className="text-2xl font-semibold text-white">{stat.value}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.22em] text-white/58">{stat.label}</div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href={content.hero.primaryCtaHref}
                  className="rounded-[20px] bg-[linear-gradient(135deg,#ff7a00,#ffb347)] px-7 py-4 text-sm font-semibold text-white shadow-[0_0_36px_rgba(255,122,0,0.42)] transition duration-300 hover:scale-[1.01] hover:shadow-[0_0_44px_rgba(255,122,0,0.52)]"
                >
                  {content.hero.primaryCtaText}
                </Link>
                <a
                  href="#timeline"
                  className="inline-flex items-center gap-3 rounded-full border border-white/18 bg-black/28 px-5 py-3 text-sm text-white/86 backdrop-blur-xl transition hover:border-[#ffb066]/45 hover:bg-white/10"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#ffb066]/40 bg-[#ff7a00]/12 text-[#ffcf9b]">
                    ▶
                  </span>
                  {content.hero.secondaryCtaText}
                </a>
              </div>
            </div>

            <motion.aside
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease }}
              className="rounded-[28px] border border-white/18 bg-[linear-gradient(180deg,rgba(255,248,239,0.92),rgba(246,231,214,0.88))] p-5 text-[#2f1d12] shadow-[0_26px_70px_rgba(0,0,0,0.24)] backdrop-blur-2xl"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-xl font-semibold">{content.journeyOverview.title}</div>
                <Sparkles size={18} className="text-[#ff7a00]" />
              </div>
              <div className="mt-5 space-y-4">
                {overviewLines.map((line) => (
                  <div key={line.label} className="flex items-start gap-3 border-b border-black/8 pb-3 last:border-b-0">
                    <span className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#ff7a00]/12 text-[#ff7a00]">
                      <MapPin size={15} />
                    </span>
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.18em] text-[#6b5443]">{line.label}</div>
                      <div className="mt-1 text-sm font-medium text-[#2f1d12]">{line.value}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-[20px] border border-black/8 bg-white/45 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-[#6b5443]">AI Score</div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1 text-[#ff7a00]">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={index} size={16} fill="currentColor" />
                    ))}
                  </div>
                  <div className="text-lg font-semibold">{content.journeyOverview.aiScore}</div>
                </div>
              </div>
            </motion.aside>
          </div>
        </div>
      </section>

      <section className="mx-auto -mt-10 max-w-[1680px] px-4 pb-14 md:px-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[310px_minmax(0,1fr)_340px]">
          <aside className="rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(10,13,20,0.72))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
            <div className="mb-5 text-lg font-semibold text-white/92">Your Journey</div>
            <div className="space-y-3">
              {days.map((day, index) => (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => setActiveDayIndex(index)}
                  className={`flex w-full items-center gap-3 rounded-[24px] border p-3 text-left transition duration-300 ${
                    activeDayIndex === index
                      ? "border-[#ff7a00]/55 bg-[#ff7a00]/12 shadow-[0_0_26px_rgba(255,122,0,0.18)]"
                      : "border-white/10 bg-white/[0.03] hover:border-white/18 hover:bg-white/[0.05]"
                  }`}
                >
                  <div className="relative h-20 w-20 overflow-hidden rounded-[18px] border border-white/10">
                    <Img src={day.previewImage || day.heroImage} alt={day.title} className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs uppercase tracking-[0.22em] text-[#ffbf82]">Day {day.dayNumber}</div>
                    <div className="mt-2 text-lg font-semibold text-white">{day.destinationLabel}</div>
                    <div className="mt-1 text-sm text-white/56">{day.countryLabel || day.title}</div>
                  </div>
                </button>
              ))}
            </div>
            <a
              href="#timeline"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-[20px] border border-white/12 bg-white/[0.05] px-4 py-3 text-sm text-white/82 transition hover:border-[#ffb066]/35 hover:bg-white/[0.08]"
            >
              View Full Timeline <ChevronRight size={16} />
            </a>
          </aside>

          <div className="space-y-6" id="timeline">
            <section className="rounded-[36px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,245,234,0.96),rgba(245,233,218,0.94))] p-6 text-[#2b1e18] shadow-[0_24px_80px_rgba(0,0,0,0.24)] backdrop-blur-2xl">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="text-[15px] font-medium text-[#7c5d4b]">
                    Day {activeDay.dayNumber} • {activeDay.destinationLabel}
                  </div>
                  <h2 className="mt-2 text-4xl font-semibold leading-tight">
                    {activeDay.title}
                  </h2>
                  <p className="mt-3 max-w-2xl text-base leading-7 text-[#4d3b31]">
                    {activeDay.description}
                  </p>
                </div>
                <div className="rounded-[22px] border border-black/8 bg-white/45 px-5 py-4 text-right">
                  <div className="inline-flex items-center gap-2 text-[#ff7a00]">
                    <CloudSun size={18} />
                    <span className="text-2xl font-semibold">{activeDay.weatherLabel || "26°C"}</span>
                  </div>
                  <div className="mt-2 text-sm text-[#6e5748]">{activeDay.dateLabel || "May 20, 2026"}</div>
                </div>
              </div>

              <div className="mt-6 overflow-hidden rounded-[30px] border border-black/8 bg-black/8">
                <div className="relative h-[420px]">
                  <Img src={activeDay.heroImage} alt={activeDay.title} className="h-full w-full object-cover" eager />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08),rgba(0,0,0,0.72))]" />
                  <button
                    type="button"
                    onClick={() => setStoryOpen(true)}
                    className="absolute inset-0 text-left"
                    aria-label={`Open cinematic story for ${activeDay.title}`}
                  />
                  <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="inline-flex items-center gap-2 text-[#ffb066]">
                          <MapPin size={16} />
                          <span className="text-xl font-semibold">{activeDay.routeTo || activeDay.destinationLabel}</span>
                        </div>
                        <p className="mt-2 max-w-2xl text-sm leading-7 text-white/82">
                          {activeDay.quote || "The best stories begin with a beautiful first frame."}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {["Gallery", "Story", "Map"].map((label) => (
                          <span
                            key={label}
                            className="rounded-full border border-white/16 bg-black/28 px-4 py-2 text-xs uppercase tracking-[0.18em] text-white/82"
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[36px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,248,238,0.95),rgba(245,233,220,0.92))] p-6 text-[#2b1e18] shadow-[0_24px_80px_rgba(0,0,0,0.24)] backdrop-blur-2xl">
              <div className="text-2xl font-semibold">Today's Plan</div>
              <div className="mt-5 grid gap-4 xl:grid-cols-2">
                {activeDay.timelineItems.map((item) => {
                  const Icon = itemIcon(item.type);
                  const bookingHref = getReadyPlanBookingHref(item.id, Boolean(item.deeplink));
                  return (
                    <motion.a
                      key={item.id}
                      href={bookingHref}
                      target={bookingHref ? "_blank" : undefined}
                      rel={bookingHref ? "noreferrer" : undefined}
                      whileHover={{ y: -6, scale: 1.01 }}
                      transition={{ duration: 0.35, ease }}
                      className="group grid gap-4 rounded-[24px] border border-black/8 bg-white/58 p-4 shadow-[0_12px_38px_rgba(0,0,0,0.08)]"
                    >
                      <div className="flex items-center gap-4">
                        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#ff7a00]/12 text-[#ff7a00] shadow-[0_0_24px_rgba(255,122,0,0.15)]">
                          <Icon size={24} />
                        </span>
                        <div className="text-sm font-medium text-[#7d604c]">{item.time || "Flexible"}</div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-[190px_1fr_auto]">
                        <div className="overflow-hidden rounded-[18px]">
                          <Img src={item.imageUrl} alt={item.title} className="h-32 w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-[#ff7a00]/14 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#ff7a00]">
                              {item.badge || item.type}
                            </span>
                            {item.status ? (
                              <span className="rounded-full bg-emerald-500/12 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-emerald-700">
                                {item.status}
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-3 text-2xl font-semibold">{item.title}</div>
                          <p className="mt-2 text-sm leading-7 text-[#5f4a3d]">{item.description}</p>
                        </div>
                        <div className="text-right">
                          {item.price ? <div className="text-2xl font-semibold">{item.price}</div> : null}
                          {item.people ? <div className="mt-2 text-sm text-[#705749]">{item.people}</div> : null}
                        </div>
                      </div>
                    </motion.a>
                  );
                })}
              </div>
            </section>

            <section className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,248,238,0.95),rgba(245,233,220,0.92))] p-6 text-[#2b1e18] shadow-[0_24px_80px_rgba(0,0,0,0.24)] backdrop-blur-2xl">
              <div className="text-xl font-semibold">Notes for Today</div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {activeDay.notes.map((note) => {
                  const Icon = noteIcon(note.icon);
                  return (
                    <div key={note.id} className="rounded-[22px] border border-black/8 bg-white/52 p-4">
                      <div className="flex items-center gap-3 text-[#ff7a00]">
                        <Icon size={18} />
                        <div className="text-sm font-semibold text-[#3c2a20]">{note.title}</div>
                      </div>
                      <p className="mt-3 text-sm leading-7 text-[#5b463a]">{note.text}</p>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-[30px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,246,236,0.96),rgba(245,232,219,0.94))] p-5 text-[#2b1e18] shadow-[0_24px_70px_rgba(0,0,0,0.22)] backdrop-blur-2xl">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-2xl font-semibold">AI Suggestions</div>
                  <div className="mt-1 text-sm text-[#705749]">Handpicked for this day by Gene AI</div>
                </div>
                <Sparkles size={18} className="text-[#ff7a00]" />
              </div>
              <div className="mt-5 space-y-4">
                {activeDay.suggestions.map((suggestion) => (
                  <SuggestionCard key={suggestion.id} suggestion={suggestion} />
                ))}
              </div>
            </section>

            <section className="rounded-[30px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,246,236,0.96),rgba(245,232,219,0.94))] p-5 text-[#2b1e18] shadow-[0_24px_70px_rgba(0,0,0,0.22)] backdrop-blur-2xl">
              <div className="flex items-center justify-between gap-3">
                <div className="text-2xl font-semibold">Cinematic Story</div>
                <Music4 size={18} className="text-[#ff7a00]" />
              </div>
              <button type="button" onClick={() => setStoryOpen(true)} className="mt-4 block w-full text-left">
                <div className="overflow-hidden rounded-[24px] border border-black/8">
                  <Img src={activeDay.story.imageUrl || activeDay.heroImage} alt={`Story for ${activeDay.title}`} className="h-56 w-full object-cover transition duration-500 hover:scale-[1.02]" />
                </div>
                <p className="mt-4 text-lg leading-8 text-[#3b281d]">{activeDay.story.quote}</p>
                <div className="mt-3 inline-flex items-center gap-2 text-sm text-[#8c6348]">
                  <Music4 size={16} />
                  {activeDay.story.musicLabel || "Matching music"}
                </div>
              </button>
            </section>

            <section className="rounded-[30px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,246,236,0.96),rgba(245,232,219,0.94))] p-5 text-[#2b1e18] shadow-[0_24px_70px_rgba(0,0,0,0.22)] backdrop-blur-2xl">
              <div className="text-2xl font-semibold">Day Summary</div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <SummaryMetric label="Activities" value={activeDay.summary.activitiesCount || "0"} />
                <SummaryMetric label="Restaurants" value={activeDay.summary.restaurantsCount || "0"} />
                <SummaryMetric label="Transfers" value={activeDay.summary.transfersCount || "0"} />
                <SummaryMetric label="Est. Cost" value={activeDay.summary.estimatedCost || "—"} />
              </div>
              {activeDay.summary.upgrades?.length ? (
                <div className="mt-4 rounded-[22px] border border-black/8 bg-white/52 p-4 text-sm text-[#5b463a]">
                  <div className="font-semibold text-[#2b1e18]">Selected upgrades</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {activeDay.summary.upgrades.map((upgrade) => (
                      <span key={upgrade} className="rounded-full bg-[#ff7a00]/12 px-3 py-1 text-[#ff7a00]">
                        {upgrade}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="mt-5 flex gap-3">
                <button className="flex-1 rounded-[18px] border border-black/10 bg-white/70 px-4 py-3 text-sm font-medium text-[#2b1e18] transition hover:bg-white">
                  {activeDay.summary.viewDetailsText || "View Details"}
                </button>
                <Link href={`/ai-planner?readyPlan=${slug}`} className="flex-1 rounded-[18px] bg-[#1d1510] px-4 py-3 text-center text-sm font-medium text-white shadow-[0_0_30px_rgba(255,122,0,0.16)] transition hover:bg-black">
                  {activeDay.summary.editPlanText || "Edit Plan"}
                </Link>
              </div>
            </section>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-white/8">
        <div className="absolute inset-0">
          <Img src={content.footer.backgroundImage} alt={content.footer.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,8,12,0.88)_0%,rgba(8,12,19,0.58)_50%,rgba(6,8,12,0.86)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_60%,rgba(255,122,0,0.2),transparent_25%)]" />
        </div>
        <div className="relative mx-auto flex max-w-[1680px] flex-col gap-6 px-4 py-12 md:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="max-w-2xl">
            <div className="text-[42px] font-semibold leading-tight text-white md:text-[56px]">
              {content.footer.title}
            </div>
            <p className="mt-4 text-lg leading-8 text-white/74">{content.footer.subtitle}</p>
          </div>
          <Link
            href={content.footer.ctaHref}
            className="inline-flex items-center justify-center rounded-[24px] bg-[linear-gradient(135deg,#ff7a00,#ffb24a)] px-8 py-5 text-lg font-semibold text-white shadow-[0_0_42px_rgba(255,122,0,0.45)] transition duration-300 hover:scale-[1.01] hover:shadow-[0_0_54px_rgba(255,122,0,0.55)]"
          >
            {content.footer.ctaText}
          </Link>
        </div>
      </section>

      <AnimatePresence>
        {storyOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/72 px-4"
            onClick={() => setStoryOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.34, ease }}
              className="w-full max-w-4xl overflow-hidden rounded-[34px] border border-white/14 bg-[linear-gradient(180deg,rgba(17,19,26,0.98),rgba(11,13,19,0.96))] shadow-[0_32px_120px_rgba(0,0,0,0.42)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="relative h-[340px] lg:h-[560px]">
                  <Img src={activeDay.story.imageUrl || activeDay.heroImage} alt={activeDay.title} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.04),rgba(0,0,0,0.44))]" />
                </div>
                <div className="flex flex-col justify-between p-6 lg:p-8">
                  <div>
                    <div className="text-xs uppercase tracking-[0.26em] text-[#ffb066]">Cinematic Story</div>
                    <h3 className="mt-4 text-3xl font-semibold text-white">{activeDay.title}</h3>
                    <p className="mt-5 text-lg leading-9 text-white/82">
                      {activeDay.story.quote || activeDay.quote}
                    </p>
                  </div>
                  <div className="mt-6 space-y-4">
                    <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                      <div className="flex items-center gap-3 text-[#ffb066]">
                        <Music4 size={18} />
                        <span className="text-sm uppercase tracking-[0.2em]">Matching Music</span>
                      </div>
                      <div className="mt-3 text-white/82">
                        {activeDay.story.musicUrl ? (
                          <a
                            href={activeDay.story.musicUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 text-white transition hover:text-[#ffcf9d]"
                          >
                            {activeDay.story.musicLabel || "Open soundtrack"}
                          </a>
                        ) : (
                          <span>{activeDay.story.musicLabel || "Curated ambient score"}</span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStoryOpen(false)}
                      className="w-full rounded-[18px] border border-white/12 bg-white/[0.05] px-4 py-3 text-sm font-medium text-white transition hover:bg-white/[0.09]"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-black/8 bg-white/55 p-4">
      <div className="text-[11px] uppercase tracking-[0.18em] text-[#7d604c]">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function SuggestionCard({ suggestion }: { suggestion: ReadyPlanSuggestion }) {
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.01 }}
      transition={{ duration: 0.3, ease }}
      className="overflow-hidden rounded-[24px] border border-black/8 bg-white/62 shadow-[0_12px_38px_rgba(0,0,0,0.08)]"
    >
      <div className="relative h-52">
        <Img src={suggestion.imageUrl} alt={suggestion.title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.02),rgba(0,0,0,0.54))]" />
        <div className="absolute inset-x-0 bottom-0 p-4 text-white">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[#ffcf9d]">
            <span className="rounded-full bg-[#ff7a00]/18 px-2 py-1 text-[#ffd9b3]">{suggestion.category}</span>
            <span>{suggestion.matchScore || "Highly Recommended"}</span>
          </div>
          <div className="mt-3 text-2xl font-semibold">{suggestion.title}</div>
        </div>
      </div>
      <div className="p-4 text-[#2b1e18]">
        <p className="text-sm leading-7 text-[#5b463a]">{suggestion.matchReason}</p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <div>
            {suggestion.price ? <div className="text-2xl font-semibold">{suggestion.price}</div> : null}
            {suggestion.duration ? <div className="text-sm text-[#705749]">{suggestion.duration}</div> : null}
          </div>
          <button className="inline-flex items-center gap-2 rounded-[16px] bg-[linear-gradient(135deg,#ff7a00,#ffb347)] px-4 py-3 text-sm font-semibold text-white shadow-[0_0_26px_rgba(255,122,0,0.26)] transition hover:shadow-[0_0_34px_rgba(255,122,0,0.34)]">
            <Plus size={16} />
            {suggestion.ctaText || "Add to Plan"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
