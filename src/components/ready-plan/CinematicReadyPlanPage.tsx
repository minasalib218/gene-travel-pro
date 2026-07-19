"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  CarFront,
  ChevronLeft,
  ChevronRight,
  CloudSun,
  Heart,
  Hotel,
  ImageIcon,
  MapPin,
  Music4,
  Plane,
  Play,
  X,
  Sparkles,
  Star,
  Ticket,
  UtensilsCrossed,
  Waves,
  BookOpenText,
} from "lucide-react";
import type {
  ReadyPlanContent,
  ReadyPlanSuggestion,
  ReadyPlanTimelineItem,
} from "@/lib/ready-plan-content";

type Props = {
  planId?: string;
  slug: string;
  logoUrl?: string;
  content: ReadyPlanContent;
  bookableItemIds?: string[];
};

const ease = [0.22, 1, 0.36, 1] as const;
const BOOK_NOW_LABEL = "Book Now";
const PAGE_MAX_WIDTH = "max-w-[1520px]";
const PAGE_PADDING = "px-6";
const ITEM_IMAGE_CLASS = "h-[120px] w-[160px] shrink-0 object-cover rounded-l-[12px]";
const ITEM_BUTTON_CLASS =
  "inline-flex h-8 min-w-[88px] items-center justify-center rounded-[8px] border border-[#ff7a00] bg-transparent px-[14px] text-[12px] font-semibold text-[#ff7a00] transition hover:bg-[#ff7a00] hover:text-white";

function itemIcon(type: ReadyPlanTimelineItem["type"]) {
  if (type === "hotel") return Hotel;
  if (type === "flight") return Plane;
  if (type === "transportation") return CarFront;
  if (type === "restaurant") return UtensilsCrossed;
  if (type === "event") return Ticket;
  return Waves;
}

function overviewIcon(label: string) {
  if (label === "Starting Point") return MapPin;
  if (label === "Destinations") return ImageIcon;
  if (label === "Trip Style") return Sparkles;
  if (label === "Travelers") return Heart;
  return Ticket;
}

function noteIcon(label: string) {
  if (label.toLowerCase().includes("sun")) return CloudSun;
  if (label.toLowerCase().includes("route")) return MapPin;
  if (label.toLowerCase().includes("airport")) return Plane;
  return Sparkles;
}

function splitHeroTitle(title: string) {
  const trimmed = title.trim();
  if (!trimmed) return { lead: "Your Cinematic", accent: "Ready Plan" };

  if (trimmed.includes(":")) {
    const [lead, ...rest] = trimmed.split(":");
    return { lead: lead.trim(), accent: rest.join(":").trim() };
  }

  if (trimmed.includes("Ready Plan")) {
    const [lead, accent] = trimmed.split("Ready Plan");
    return { lead: lead.trim() || "Your Cinematic", accent: `Ready Plan${accent ? ` ${accent.trim()}` : ""}`.trim() };
  }

  const words = trimmed.split(/\s+/);
  if (words.length <= 3) {
    return { lead: trimmed, accent: "" };
  }

  const mid = Math.ceil(words.length / 2);
  return {
    lead: words.slice(0, mid).join(" "),
    accent: words.slice(mid).join(" "),
  };
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

export default function CinematicReadyPlanPage({
  planId,
  slug,
  logoUrl = "/images/logo.png",
  content,
  bookableItemIds = [],
}: Props) {
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [storyOpen, setStoryOpen] = useState(false);
  const [heroOffset, setHeroOffset] = useState(0);

  const days = content.days;
  const activeDay = days[activeDayIndex] ?? days[0];
  const bookableItemIdSet = useMemo(() => new Set(bookableItemIds), [bookableItemIds]);

  const firstBookableItem = useMemo(
    () => days.flatMap((day) => day.timelineItems).find((item) => bookableItemIdSet.has(item.id)),
    [bookableItemIdSet, days],
  );

  const readyPlanBookingHref =
    planId && firstBookableItem
      ? `/api/affiliate/redirect?itemId=${encodeURIComponent(`${planId}:${firstBookableItem.id}`)}`
      : "#timeline";

  const heroTitle = splitHeroTitle(content.hero.title);

  function getReadyPlanBookingHref(itemId: string, shouldShowButton: boolean) {
    if (!shouldShowButton || !planId || !bookableItemIdSet.has(itemId)) return undefined;
    return `/api/affiliate/redirect?itemId=${encodeURIComponent(`${planId}:${itemId}`)}`;
  }

  useEffect(() => {
    const onScroll = () => setHeroOffset(Math.min(window.scrollY * 0.16, 78));
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

  const suggestions = activeDay?.suggestions ?? [];
  const primarySuggestion =
    suggestions[0] ??
    (activeDay?.timelineItems[0]
      ? {
          id: `${activeDay.timelineItems[0].id}-fallback`,
          title: activeDay.timelineItems[0].title,
          category: activeDay.timelineItems[0].badge || activeDay.timelineItems[0].type,
          imageUrl: activeDay.timelineItems[0].imageUrl,
          matchReason: activeDay.timelineItems[0].description,
          matchScore: activeDay.timelineItems[0].status || "Recommended",
          price: activeDay.timelineItems[0].price,
          duration: activeDay.timelineItems[0].people,
          ctaText: BOOK_NOW_LABEL,
        }
      : null);

  if (!activeDay) return null;

  return (
    <main className="min-h-screen overflow-hidden bg-[linear-gradient(180deg,#080707_0%,#130f0a_34%,#0a0908_100%)] text-white">
      <MobileReadyPlanView
        activeDay={activeDay}
        activeDayIndex={activeDayIndex}
        content={content}
        days={days}
        getReadyPlanBookingHref={getReadyPlanBookingHref}
        logoUrl={logoUrl}
        overviewLines={overviewLines}
        primarySuggestion={primarySuggestion}
        readyPlanBookingHref={readyPlanBookingHref}
        setActiveDayIndex={setActiveDayIndex}
        setStoryOpen={setStoryOpen}
        slug={slug}
      />

      <div className="hidden lg:block">
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
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(22,15,12,0.82)_0%,rgba(22,15,12,0.54)_36%,rgba(9,8,7,0.68)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_58%_22%,rgba(255,153,76,0.22),transparent_18%),radial-gradient(circle_at_22%_14%,rgba(255,255,255,0.08),transparent_24%),linear-gradient(180deg,rgba(15,10,8,0.12)_0%,rgba(9,7,6,0.78)_100%)]" />
        </div>

        <div className={`relative mx-auto ${PAGE_MAX_WIDTH} ${PAGE_PADDING} pb-14 pt-6 lg:pb-24`}>
          <div className="flex items-center justify-between gap-4">
            <Link href="/ready-plans" className="inline-flex items-center gap-3">
              <Img src={logoUrl} alt="Gene Travel" className="h-12 w-auto object-contain md:h-14" eager />
            </Link>
            <div className="flex items-center gap-4 text-white/86">
              <div className="inline-flex items-center gap-2 text-sm">
                <Music4 size={16} className="text-[#ffd2a7]" />
                <span>Cinematic Story</span>
              </div>
              <Heart size={16} className="text-white/90" />
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/10 text-sm font-semibold backdrop-blur-xl">
                G
              </div>
            </div>
          </div>

          <div className="mt-12 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
            <div className="max-w-4xl">
              <motion.h1
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.72, ease }}
                className="max-w-3xl font-serif text-[52px] leading-[0.94] tracking-[-0.03em] text-white md:text-[72px]"
              >
                <span className="block">{heroTitle.lead || content.hero.title}</span>
                {heroTitle.accent ? (
                  <span className="mt-2 block text-[#ff8a1f]">
                    {heroTitle.accent}
                    <span className="ml-3 text-[#ffc78c]">+</span>
                  </span>
                ) : null}
              </motion.h1>

              <p className="mt-6 max-w-2xl text-[15px] leading-7 text-white/82">
                {content.hero.subtitle}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {content.hero.stats.slice(0, 5).map((stat) => (
                  <div
                    key={`${stat.label}-${stat.value}`}
                    className="min-w-[100px] rounded-[16px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.11),rgba(255,255,255,0.03))] px-4 py-3 shadow-[0_12px_28px_rgba(0,0,0,0.15)] backdrop-blur-xl"
                  >
                    <div className="text-[24px] font-semibold leading-none text-white">{stat.value}</div>
                    <div className="mt-2 text-xs text-white/76">{stat.label}</div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href={readyPlanBookingHref}
                  className="inline-flex items-center gap-3 rounded-[18px] bg-[linear-gradient(135deg,#ff7a00,#ffab3d)] px-6 py-4 text-sm font-semibold text-white shadow-[0_0_34px_rgba(255,122,0,0.42)] transition hover:shadow-[0_0_46px_rgba(255,122,0,0.54)]"
                >
                  {content.hero.primaryCtaText || "Plan Smarter With AI"}
                  <Sparkles size={15} />
                </Link>

                <a
                  href="#timeline"
                  className="inline-flex items-center gap-3 rounded-full border border-white/18 bg-black/30 px-4 py-3 text-sm text-white/88 backdrop-blur-xl transition hover:border-[#ffc088]/40"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#ffc088]/35 bg-white/5">
                    <Play size={16} className="ml-0.5 text-[#ffc088]" />
                  </span>
                  <span>View Full Timeline</span>
                </a>
              </div>
            </div>

            <motion.aside
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease }}
              className="rounded-[16px] border border-[#f2ddcb]/65 bg-[linear-gradient(180deg,rgba(248,237,225,0.95),rgba(242,225,208,0.91))] p-6 text-[#32211a] shadow-[0_28px_80px_rgba(0,0,0,0.18)] backdrop-blur-2xl"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-[18px] font-semibold tracking-[-0.02em]">{content.journeyOverview.title}</h2>
                <Sparkles size={16} className="text-[#ff7a00]" />
              </div>

              <div className="mt-4 space-y-4">
                {overviewLines.map((line) => {
                  const Icon = overviewIcon(line.label);
                  return (
                    <div key={line.label} className="flex gap-3 border-b border-black/8 pb-3 last:border-b-0">
                      <span className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#ff7a00]/12 text-[#ff7a00]">
                        <Icon size={15} />
                      </span>
                      <div className="min-w-0">
                        <div className="text-[11px] uppercase tracking-[0.16em] text-[#7c6453]">{line.label}</div>
                        <div className="mt-1 text-[13px] font-medium leading-5 text-[#2f2118]">{line.value || "Not set"}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 rounded-[18px] border border-black/8 bg-white/50 p-4">
                <div className="text-[11px] uppercase tracking-[0.16em] text-[#7c6453]">AI Score</div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[#ff7a00]">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star key={idx} size={16} fill="currentColor" />
                    ))}
                  </div>
                  <div className="text-xl font-semibold">{content.journeyOverview.aiScore}</div>
                </div>
              </div>
            </motion.aside>
          </div>
        </div>
      </section>

      <section className={`relative z-10 mx-auto -mt-12 ${PAGE_MAX_WIDTH} ${PAGE_PADDING} pb-16`}>
        <div className="grid gap-6 xl:grid-cols-[240px_960px_320px] xl:justify-center xl:items-start">
          <aside className="rounded-[16px] border border-white/10 bg-[linear-gradient(180deg,rgba(34,27,23,0.96),rgba(16,14,14,0.95))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur-2xl">
            <div className="mb-5 text-base font-semibold text-white">Your Journey</div>
            <div className="relative pl-8">
              <div className="absolute left-[10px] top-1 bottom-12 w-px bg-[linear-gradient(180deg,rgba(255,149,65,0.55),rgba(255,255,255,0.18))]" />
              <div className="space-y-3">
                {days.map((day, index) => (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => setActiveDayIndex(index)}
                    className="group relative flex w-full items-center gap-3 rounded-[22px] px-2 py-1 text-left"
                  >
                    <span
                      className={`absolute -left-[22px] top-9 h-3 w-3 rounded-full border ${
                        index === activeDayIndex
                          ? "border-[#ff8a1f] bg-[#ff8a1f] shadow-[0_0_18px_rgba(255,122,0,0.9)]"
                          : "border-white/30 bg-[#1f1814]"
                      }`}
                    />
                    <div
                      className={`h-16 w-16 overflow-hidden rounded-[10px] border transition ${
                        index === activeDayIndex
                          ? "border-[#ff8a1f]/60 shadow-[0_0_0_1px_rgba(255,122,0,0.2)]"
                          : "border-white/10"
                      }`}
                    >
                      <Img src={day.previewImage || day.heroImage} alt={day.title} className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <div className={`text-[13px] font-semibold ${index === activeDayIndex ? "text-[#ff9f50]" : "text-white/55"}`}>Day {day.dayNumber}</div>
                      <div className="mt-1 text-[13px] font-medium leading-4 text-white">{day.destinationLabel || day.title}</div>
                      <div className="mt-1 text-[12px] leading-4 text-white/62">{day.countryLabel || day.title}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <a
              href="#timeline"
              className="mt-5 inline-flex w-full items-center justify-between rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/88 transition hover:bg-white/[0.08]"
            >
              <span>View Full Timeline</span>
              <ChevronRight size={16} />
            </a>
          </aside>

          <div className="space-y-6" id="timeline">
            <section className="rounded-[16px] border border-[#e9d7c5]/70 bg-[linear-gradient(180deg,rgba(252,244,235,0.97),rgba(247,236,224,0.95))] p-6 text-[#2d1f18] shadow-[0_24px_80px_rgba(0,0,0,0.18)] backdrop-blur-2xl">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="font-serif text-[24px] font-bold leading-none tracking-[-0.03em] text-[#261812]">
                    Day {activeDay.dayNumber} · {activeDay.destinationLabel}
                    {activeDay.countryLabel ? `, ${activeDay.countryLabel}` : ""}
                  </h2>
                  <p className="mt-3 max-w-2xl text-[14px] leading-6 text-[#5a4638]">
                    {activeDay.description || activeDay.quote}
                  </p>
                </div>
                <div className="grid gap-2 text-right text-[#5d4839] sm:min-w-[160px]">
                  <div className="inline-flex items-center justify-end gap-2 text-[#ff7a00]">
                    <CloudSun size={20} />
                    <span className="text-[16px] font-semibold leading-none">{activeDay.weatherLabel || "28C"}</span>
                  </div>
                  <div className="inline-flex items-center justify-end gap-2 text-[12px]">
                    <CalendarDays size={16} className="text-[#c27a43]" />
                    <span>{activeDay.dateLabel || "Travel day"}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 overflow-hidden rounded-[16px] border border-black/8 bg-black/10">
                <div className="relative h-[280px]">
                  <Img src={activeDay.heroImage} alt={activeDay.title} className="h-full w-full object-cover" eager />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.04),rgba(0,0,0,0.62)_72%,rgba(0,0,0,0.74)_100%)]" />
                  <div className="absolute inset-x-0 bottom-0 flex flex-col gap-4 p-6 text-white lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <div className="inline-flex items-center gap-2 text-[#ffb36b]">
                        <MapPin size={20} />
                        <span className="text-[22px] font-semibold">{activeDay.routeTo || activeDay.destinationLabel}</span>
                      </div>
                      <div className="mt-2 text-[12px] text-white/80">The most iconic scene in the route</div>
                      <p className="mt-2 max-w-xl text-[12px] italic text-white/88">
                        "{activeDay.quote || "The best view comes after the hardest climb."}"
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <HeroChip icon={<ImageIcon size={14} />} label="Gallery" />
                      <HeroChip icon={<BookOpenText size={14} />} label="Story" />
                      <HeroChip icon={<MapPin size={14} />} label="Map" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <div className="text-[24px] font-medium tracking-[-0.03em] text-[#7b4215]">Today's Plan</div>
                <div className="relative mt-5 pl-16">
                  <div className="absolute left-[31px] top-0 bottom-0 w-[2px] bg-[linear-gradient(180deg,rgba(255,149,65,0.35),rgba(0,0,0,0.12))]" />
                  <div className="space-y-4">
                    {activeDay.timelineItems.map((item) => {
                      const Icon = itemIcon(item.type);
                      const bookingHref = getReadyPlanBookingHref(
                        item.id,
                        (item as any).showButton !== false && Boolean(item.buttonLabel?.trim() || BOOK_NOW_LABEL),
                      );
                      return (
                        <div key={item.id} className="relative">
                          <div className="absolute -left-[64px] top-[42px] w-12 text-right text-[12px] font-normal leading-4 tracking-[0.08em] text-[#8f7563]">
                            {item.time || "Open"}
                          </div>
                          <span className="absolute -left-[37px] top-[53px] h-[10px] w-[10px] rounded-full border-[2px] border-[#ff7a00] bg-[#ff7a00] shadow-[0_0_10px_rgba(255,122,0,0.45)]" />
                          <TimelinePlanCard item={item} bookingHref={bookingHref} Icon={Icon} />
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="mt-5 flex justify-center">
                  <a
                    href="#timeline"
                    className="inline-flex items-center gap-2 rounded-full border border-[#e5ccb7] bg-white/80 px-5 py-3 text-sm text-[#6f5240] shadow-[0_10px_28px_rgba(0,0,0,0.06)]"
                  >
                    <span>View Full Day Details</span>
                    <ChevronRight size={15} />
                  </a>
                </div>
              </div>

              <div className="mt-6 rounded-[16px] border border-black/8 bg-white/45 p-6">
                <div className="text-[14px] font-semibold tracking-[-0.02em] text-[#2a1d17]">Notes for Today</div>
                <div className="mt-4 grid gap-6 md:grid-cols-3">
                  {activeDay.notes.slice(0, 3).map((note) => {
                    const NoteIcon = noteIcon(note.title);
                    return (
                      <div key={note.id} className="flex items-start gap-3 rounded-[12px] bg-white/72 px-4 py-4">
                        <span className="mt-0.5 text-[#ff7a00]">
                          <NoteIcon size={24} />
                        </span>
                        <div className="text-[12px] leading-5 text-[#5e483a]">{note.text}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-[16px] border border-[#e9d7c5]/70 bg-[linear-gradient(180deg,rgba(252,244,235,0.97),rgba(247,236,224,0.95))] p-6 text-[#2d1f18] shadow-[0_24px_70px_rgba(0,0,0,0.18)] backdrop-blur-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[18px] font-semibold tracking-[-0.03em] text-[#7b4215]">AI Suggestions</div>
                  <div className="mt-1 text-[13px] text-[#786151]">Handpicked for this day by GENE AI</div>
                </div>
                <Sparkles size={16} className="text-[#ff7a00]" />
              </div>
              <div className="mt-4">
                {primarySuggestion ? (
                  <SuggestionCard suggestion={primarySuggestion} />
                ) : (
                  <div className="rounded-[22px] border border-black/8 bg-white/55 p-5 text-sm text-[#70594a]">
                    No suggestions for this day yet.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-[16px] border border-[#e9d7c5]/70 bg-[linear-gradient(180deg,rgba(252,244,235,0.97),rgba(247,236,224,0.95))] p-6 text-[#2d1f18] shadow-[0_24px_70px_rgba(0,0,0,0.18)] backdrop-blur-2xl">
              <div className="flex items-center justify-between">
                <div className="text-[18px] font-semibold tracking-[-0.03em]">Cinematic Story</div>
                <Sparkles size={16} className="text-[#ff7a00]" />
              </div>
              <button type="button" onClick={() => setStoryOpen(true)} className="mt-4 block w-full text-left">
                <div className="overflow-hidden rounded-[22px] border border-black/8">
                  <Img
                    src={activeDay.story.imageUrl || activeDay.heroImage}
                    alt={`Story for ${activeDay.title}`}
                    className="h-[120px] w-full object-cover transition duration-500 hover:scale-[1.02]"
                  />
                </div>
                <p className="mt-4 text-[13px] leading-7 text-[#47352b]">
                  "{activeDay.story.quote || activeDay.quote}"
                </p>
                <div className="mt-2 text-[13px] text-[#7a604f]">- GENE AI</div>
              </button>
              <button
                type="button"
                onClick={() => setStoryOpen(true)}
                className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-[linear-gradient(135deg,#ff7a00,#ffab3d)] px-4 py-3 text-[14px] font-semibold text-white shadow-[0_0_28px_rgba(255,122,0,0.26)]"
              >
                <Music4 size={15} />
                Open Story
              </button>
            </section>

            <section className="rounded-[16px] border border-[#e9d7c5]/70 bg-[linear-gradient(180deg,rgba(252,244,235,0.97),rgba(247,236,224,0.95))] p-6 text-[#2d1f18] shadow-[0_24px_70px_rgba(0,0,0,0.18)] backdrop-blur-2xl">
              <div className="text-[18px] font-semibold tracking-[-0.03em]">Day Summary</div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <SummaryMetric label="Activities" value={activeDay.summary.activitiesCount || "0"} />
                <SummaryMetric label="Restaurants" value={activeDay.summary.restaurantsCount || "0"} />
                <SummaryMetric label="Transfers" value={activeDay.summary.transfersCount || "0"} />
                <SummaryMetric label="Est. Cost" value={activeDay.summary.estimatedCost || "-"} />
              </div>
              <div className="mt-5 flex gap-3">
                <button className="flex-1 rounded-[16px] border border-black/12 bg-white/75 px-4 py-3 text-sm font-medium text-[#2d1f18]">
                  {activeDay.summary.viewDetailsText || "View Details"}
                </button>
                <Link
                  href={`/start-planning?readyPlan=${encodeURIComponent(slug)}`}
                  className="flex-1 rounded-[16px] bg-[#201712] px-4 py-3 text-center text-sm font-medium text-white"
                >
                  {activeDay.summary.editPlanText || "Edit Plan"}
                </Link>
              </div>
            </section>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden pb-8">
        <div className="absolute inset-0">
          <Img src={content.footer.backgroundImage} alt={content.footer.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(16,11,9,0.85)_0%,rgba(18,14,11,0.45)_42%,rgba(16,11,9,0.82)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_62%_50%,rgba(255,122,0,0.23),transparent_18%)]" />
        </div>
        <div className={`relative mx-auto ${PAGE_MAX_WIDTH} ${PAGE_PADDING}`}>
          <div className="grid items-center gap-5 rounded-[24px] border border-white/10 bg-black/18 px-6 py-6 shadow-[0_22px_64px_rgba(0,0,0,0.24)] backdrop-blur-sm lg:grid-cols-[1fr_auto] lg:px-8 lg:py-7">
            <div>
              <div className="font-serif text-[34px] leading-none tracking-[-0.03em] text-white md:text-[42px]">
                {content.footer.title}
              </div>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/80 md:text-base md:leading-7">{content.footer.subtitle}</p>
            </div>
            <div className="flex justify-start lg:justify-end">
              <Link
                href={readyPlanBookingHref}
                className="inline-flex items-center gap-3 rounded-[16px] bg-[linear-gradient(135deg,#ff7a00,#ffab3d)] px-6 py-4 text-sm font-semibold text-white shadow-[0_0_32px_rgba(255,122,0,0.36)] transition hover:shadow-[0_0_42px_rgba(255,122,0,0.48)]"
              >
                {content.footer.ctaText || "Plan Smarter With AI"}
                <Sparkles size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>
      </div>

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
              initial={{ opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 12 }}
              transition={{ duration: 0.32, ease }}
              className="w-full max-w-5xl overflow-hidden rounded-[34px] border border-white/14 bg-[linear-gradient(180deg,rgba(17,15,15,0.98),rgba(11,10,9,0.97))] shadow-[0_32px_120px_rgba(0,0,0,0.42)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
                <div className="relative h-[340px] lg:h-[560px]">
                  <Img src={activeDay.story.imageUrl || activeDay.heroImage} alt={activeDay.title} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.04),rgba(0,0,0,0.42))]" />
                </div>
                <div className="flex flex-col justify-between p-7 lg:p-9">
                  <div>
                    <div className="text-xs uppercase tracking-[0.24em] text-[#ffc088]">Cinematic Story</div>
                    <h3 className="mt-4 font-serif text-4xl tracking-[-0.03em] text-white">{activeDay.title}</h3>
                    <p className="mt-5 text-lg leading-9 text-white/82">
                      {activeDay.story.quote || activeDay.quote}
                    </p>
                  </div>
                  <div className="mt-8 space-y-4">
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
                            rel="noopener noreferrer sponsored"
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

type MobileOverlay = null | "timeline" | "gallery" | "map" | "details" | "overview" | "added";

function MobileReadyPlanView({
  activeDay,
  activeDayIndex,
  content,
  days,
  getReadyPlanBookingHref,
  logoUrl,
  overviewLines,
  primarySuggestion,
  readyPlanBookingHref,
  setActiveDayIndex,
  setStoryOpen,
  slug,
}: {
  activeDay: ReadyPlanContent["days"][number];
  activeDayIndex: number;
  content: ReadyPlanContent;
  days: ReadyPlanContent["days"];
  getReadyPlanBookingHref: (itemId: string, shouldShowButton: boolean) => string | undefined;
  logoUrl: string;
  overviewLines: Array<{ label: string; value: string }>;
  primarySuggestion: ReadyPlanSuggestion | null;
  readyPlanBookingHref: string;
  setActiveDayIndex: (value: number | ((current: number) => number)) => void;
  setStoryOpen: (value: boolean) => void;
  slug: string;
}) {
  const [overlay, setOverlay] = useState<MobileOverlay>(null);
  const lastDay = activeDayIndex >= days.length - 1;

  function goToDay(index: number) {
    setActiveDayIndex(Math.min(Math.max(index, 0), Math.max(days.length - 1, 0)));
    window.requestAnimationFrame(() => {
      document.getElementById("mobile-day-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <div className="lg:hidden">
      <div className="space-y-6 px-3 pb-28 pt-3">
        <section className="relative overflow-hidden rounded-[16px] border border-white/10 bg-black/30 shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
          <Img src={content.hero.backgroundImage} alt={content.hero.title} className="h-[280px] w-full object-cover" eager />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08)_0%,rgba(0,0,0,0.26)_44%,rgba(0,0,0,0.86)_100%)]" />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
            <Link href="/ready-plans" className="inline-flex h-10 items-center">
              <Img src={logoUrl} alt="Gene Travel" className="h-10 w-auto object-contain" eager />
            </Link>
            <button
              type="button"
              onClick={() => goToDay(activeDayIndex - 1)}
              disabled={activeDayIndex === 0}
              className="inline-flex h-11 w-11 items-center justify-center rounded-[12px] border border-white/20 bg-black/30 text-white backdrop-blur disabled:opacity-40"
              aria-label="Previous day"
            >
              <ChevronLeft size={22} />
            </button>
          </div>
          <div className="absolute inset-x-0 bottom-0 p-4 text-center">
            <h1 className="text-[22px] font-bold leading-7 text-white">Your Cinematic Ready Plan <span className="text-[#ff9a3d]">+</span></h1>
            <p className="mx-auto mt-2 max-w-[310px] text-[14px] leading-5 text-white/82">{content.hero.subtitle}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {content.hero.stats.slice(0, 5).map((stat) => (
                <div key={`${stat.label}-${stat.value}`} className="rounded-[12px] border border-white/15 bg-white/10 px-3 py-2 backdrop-blur">
                  <div className="text-[12px] font-bold leading-none text-white">{stat.value}</div>
                  <div className="mt-1 text-[11px] text-white/72">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="space-y-3">
          <Link
            href={readyPlanBookingHref}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-[#ff7a00] px-4 text-[14px] font-bold text-white shadow-[0_0_28px_rgba(255,122,0,0.34)]"
          >
            Plan Smarter With AI <Sparkles size={18} />
          </Link>
          <button
            type="button"
            onClick={() => setOverlay("timeline")}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[12px] border border-white/14 bg-white/[0.06] text-[14px] font-medium text-white"
          >
            <Play size={16} /> View Full Timeline
          </button>
        </div>

        <button
          type="button"
          onClick={() => setOverlay("overview")}
          className="w-full rounded-[16px] border border-[#f2ddcb]/55 bg-[linear-gradient(180deg,rgba(248,237,225,0.97),rgba(242,225,208,0.94))] p-4 text-left text-[#2d1f18] shadow-[0_14px_40px_rgba(0,0,0,0.18)]"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] font-bold">Journey Overview <span className="text-[#ff7a00]">+</span></h2>
            <span className="rounded-full border border-black/10 px-2 py-1 text-[11px] font-semibold text-black/55">Edit</span>
          </div>
          <div className="mt-3 divide-y divide-black/10">
            {[...overviewLines, { label: "AI Score", value: content.journeyOverview.aiScore }].map((line) => (
              <div key={line.label} className="flex items-start justify-between gap-4 py-3 text-[14px]">
                <span className="text-black/55">{line.label}</span>
                <span className="max-w-[55%] text-right font-semibold text-[#2d1f18]">{line.value || "Not set"}</span>
              </div>
            ))}
          </div>
        </button>

        <section id="mobile-day-card" className="rounded-[16px] border border-[#e9d7c5]/70 bg-[linear-gradient(180deg,rgba(252,244,235,0.98),rgba(247,236,224,0.96))] p-4 text-[#2d1f18] shadow-[0_20px_58px_rgba(0,0,0,0.18)]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-[20px] font-bold leading-6">Day {activeDay.dayNumber} • {activeDay.destinationLabel}</h2>
              <p className="mt-1 text-[12px] text-black/55">{activeDay.dateLabel || "Travel day"}</p>
            </div>
            <div className="inline-flex shrink-0 items-center gap-1 text-[14px] font-semibold text-[#ff7a00]">
              <CloudSun size={18} />
              <span>{activeDay.weatherLabel || "28C"}</span>
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-[16px]">
            <Img src={activeDay.heroImage} alt={activeDay.title} className="h-[200px] w-full object-cover" eager />
          </div>
          <p className="mt-4 text-[14px] leading-6 text-black/72">{activeDay.description || activeDay.quote}</p>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <button type="button" onClick={() => setOverlay("gallery")} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[12px] border border-black/10 bg-white/60 text-[13px] font-semibold text-[#2d1f18]">
              <ImageIcon size={24} /> Gallery
            </button>
            <button type="button" onClick={() => setStoryOpen(true)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[12px] border border-black/10 bg-white/60 text-[13px] font-semibold text-[#2d1f18]">
              <BookOpenText size={24} /> Story
            </button>
            <button type="button" onClick={() => setOverlay("map")} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[12px] border border-black/10 bg-white/60 text-[13px] font-semibold text-[#2d1f18]">
              <MapPin size={24} /> Map
            </button>
          </div>

          <div className="mt-6">
            <h3 className="text-[20px] font-bold text-[#7b4215]">Today's Plan</h3>
            <div className="relative mt-4 pl-9 min-[390px]:pl-11 sm:pl-14">
              <div className="absolute left-[15px] top-0 bottom-0 w-[2px] bg-black/12 min-[390px]:left-[19px] sm:left-[25px]" />
              <div className="space-y-4">
                {activeDay.timelineItems.map((item) => {
                  const Icon = itemIcon(item.type);
                  const bookingHref = getReadyPlanBookingHref(
                    item.id,
                    (item as any).showButton !== false && Boolean(item.buttonLabel?.trim() || BOOK_NOW_LABEL),
                  );
                  return (
                    <div key={item.id} className="relative">
                      <span className="absolute -left-[24px] top-[8px] h-[8px] w-[8px] rounded-full bg-[#ff7a00] shadow-[0_0_10px_rgba(255,122,0,0.45)] min-[390px]:-left-[28px] sm:-left-[38px]" />
                      <div className="absolute -left-9 top-[24px] w-7 text-center text-[10px] leading-3 text-black/60 min-[390px]:-left-11 min-[390px]:w-9 min-[390px]:text-[11px] min-[390px]:leading-4 sm:-left-14 sm:w-11 sm:text-[12px]">{formatMobileTime(item.time)}</div>
                      <MobileTimelineItem item={item} bookingHref={bookingHref} Icon={Icon} />
                    </div>
                  );
                })}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOverlay("details")}
              className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-[12px] border border-black/10 bg-white/65 text-[14px] font-semibold text-[#2d1f18]"
            >
              View Full Day Details
            </button>
          </div>

          <div className="mt-6 rounded-[16px] border border-black/8 bg-white/50 p-4">
            <h3 className="text-[14px] font-bold">Notes for Today</h3>
            <div className="mt-4 space-y-4">
              {activeDay.notes.slice(0, 3).map((note) => {
                const NoteIcon = noteIcon(note.title);
                return (
                  <div key={note.id} className="flex gap-3">
                    <NoteIcon size={20} className="mt-0.5 shrink-0 text-[#ff7a00]" />
                    <p className="text-[12px] leading-5 text-black/65">{note.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="rounded-[16px] border border-[#e9d7c5]/70 bg-[linear-gradient(180deg,rgba(252,244,235,0.98),rgba(247,236,224,0.96))] p-4 text-[#2d1f18] shadow-[0_20px_58px_rgba(0,0,0,0.16)]">
          <h2 className="text-[18px] font-bold text-[#7b4215]">AI Suggestions <span className="text-[#ff7a00]">+</span></h2>
          {primarySuggestion ? (
            <div className="mt-4">
              <Img src={primarySuggestion.imageUrl} alt={primarySuggestion.title} className="h-[120px] w-full rounded-[12px] object-cover" />
              <h3 className="mt-3 text-[16px] font-bold">{primarySuggestion.title}</h3>
              <p className="mt-2 text-[14px] leading-6 text-black/68">{primarySuggestion.matchReason}</p>
              <button
                type="button"
                onClick={() => setOverlay("added")}
                className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-[12px] bg-[#ff7a00] text-[14px] font-bold text-white"
              >
                Add to Plan
              </button>
            </div>
          ) : (
            <p className="mt-3 text-[14px] text-black/60">No suggestions for this day yet.</p>
          )}
        </section>

        <section className="rounded-[16px] border border-[#e9d7c5]/70 bg-[linear-gradient(180deg,rgba(252,244,235,0.98),rgba(247,236,224,0.96))] p-4 text-[#2d1f18] shadow-[0_20px_58px_rgba(0,0,0,0.16)]">
          <h2 className="text-[18px] font-bold">Cinematic Story <span className="text-[#ff7a00]">+</span></h2>
          <Img src={activeDay.story.imageUrl || activeDay.heroImage} alt={activeDay.title} className="mt-4 h-[160px] w-full rounded-[12px] object-cover" />
          <p className="mt-4 text-[14px] italic leading-6 text-black/70">"{activeDay.story.quote || activeDay.quote}"</p>
          <button
            type="button"
            onClick={() => setStoryOpen(true)}
            className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[12px] bg-[#ff7a00] text-[14px] font-bold text-white"
          >
            <Music4 size={18} /> Open Story
          </button>
        </section>

        <section className="rounded-[16px] border border-[#e9d7c5]/70 bg-[linear-gradient(180deg,rgba(252,244,235,0.98),rgba(247,236,224,0.96))] p-4 text-[#2d1f18] shadow-[0_20px_58px_rgba(0,0,0,0.16)]">
          <h2 className="text-[18px] font-bold">Day Summary</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <MobileSummaryMetric label="Activities" value={activeDay.summary.activitiesCount || "0"} />
            <MobileSummaryMetric label="Restaurants" value={activeDay.summary.restaurantsCount || "0"} />
            <MobileSummaryMetric label="Transfers" value={activeDay.summary.transfersCount || "0"} />
            <MobileSummaryMetric label="Est. Cost" value={activeDay.summary.estimatedCost || "-"} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setOverlay("details")} className="h-11 rounded-[12px] border border-black/12 bg-transparent text-[14px] font-semibold text-[#2d1f18]">View Details</button>
            <Link href={`/start-planning?readyPlan=${encodeURIComponent(slug)}`} className="inline-flex h-11 items-center justify-center rounded-[12px] bg-[#ff7a00] text-[14px] font-semibold text-white">Edit Plan</Link>
          </div>
        </section>

        <section className="relative min-h-[178px] overflow-hidden rounded-[16px] border border-white/10 p-5 shadow-[0_18px_52px_rgba(0,0,0,0.24)]">
          <Img src={content.footer.backgroundImage} alt={content.footer.title} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/58" />
          <div className="relative">
            <h2 className="text-[20px] font-bold leading-6 text-white">{content.footer.title || "Your journey, but smarter."}</h2>
            <p className="mt-2 text-[13px] leading-5 text-white/78">{content.footer.subtitle}</p>
            <Link href={readyPlanBookingHref} className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-[#ff7a00] text-[14px] font-bold text-white">
              Plan Smarter With AI <Sparkles size={18} />
            </Link>
          </div>
        </section>
      </div>

      <button
        type="button"
        onClick={() => goToDay(activeDayIndex + 1)}
        disabled={lastDay}
        className="fixed bottom-4 right-3 z-40 h-11 w-[120px] rounded-[12px] bg-[#ff7a00] text-[14px] font-bold text-white shadow-[0_14px_36px_rgba(0,0,0,0.28)] disabled:bg-white/20 disabled:text-white/45"
      >
        Next Day →
      </button>

      <MobileOverlaySheet overlay={overlay} setOverlay={setOverlay} activeDay={activeDay} days={days} goToDay={goToDay} />
    </div>
  );
}

function MobileTimelineItem({
  item,
  bookingHref,
  Icon,
}: {
  item: ReadyPlanTimelineItem;
  bookingHref?: string;
  Icon: ReturnType<typeof itemIcon>;
}) {
  return (
    <div className="grid h-[132px] grid-cols-[96px_minmax(0,1fr)] overflow-hidden rounded-[12px] border border-black/8 bg-white/78 text-[#1f1f1f] shadow-[0_8px_24px_rgba(0,0,0,0.08)] min-[390px]:h-[128px] min-[390px]:grid-cols-[112px_minmax(0,1fr)] min-[430px]:grid-cols-[120px_minmax(0,1fr)] min-[520px]:h-[120px] min-[520px]:grid-cols-[180px_minmax(0,1fr)]">
      <div className="relative h-full w-full shrink-0">
        <Img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
        <span className="absolute right-[-14px] top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#ff7a00] shadow-[0_8px_18px_rgba(0,0,0,0.14)] min-[390px]:right-[-16px] min-[390px]:h-10 min-[390px]:w-10 min-[520px]:right-[-18px] min-[520px]:h-12 min-[520px]:w-12">
          <Icon size={20} className="min-[390px]:h-[22px] min-[390px]:w-[22px] min-[520px]:h-6 min-[520px]:w-6" />
        </span>
      </div>
      <div className="relative min-w-0 py-3 pl-5 pr-2 min-[390px]:pl-6 min-[520px]:pl-8 min-[520px]:pr-4">
        <h3 className="line-clamp-2 pr-[76px] text-[14px] font-extrabold leading-[17px] text-[#141414] min-[390px]:pr-[84px] min-[390px]:text-[15px] min-[390px]:leading-[19px] min-[520px]:pr-[102px] min-[520px]:text-[16px] min-[520px]:leading-5">
          {item.title}
        </h3>
        <div className="mt-1.5 flex min-w-0 flex-wrap gap-1 overflow-hidden pr-[70px] min-[390px]:gap-1.5 min-[390px]:pr-[78px] min-[520px]:pr-[100px]">
          <span className="max-w-full truncate rounded-[5px] bg-[#ff7a00] px-1.5 py-0.5 text-[9px] font-bold leading-4 text-white min-[390px]:px-2 min-[390px]:text-[10px] min-[520px]:rounded-[6px] min-[520px]:text-[12px]">{item.badge || prettyType(item.type)}</span>
          {item.status ? <span className="hidden max-w-full truncate rounded-[5px] bg-black/5 px-1.5 py-0.5 text-[9px] font-bold leading-4 text-black/60 min-[430px]:inline min-[520px]:rounded-[6px] min-[520px]:px-2 min-[520px]:text-[12px]">{item.status}</span> : null}
        </div>
        <p className="mt-1.5 line-clamp-3 pr-[4px] text-[11.5px] font-medium leading-[15px] text-black/72 min-[390px]:line-clamp-2 min-[390px]:text-[12.5px] min-[390px]:leading-[17px] min-[520px]:text-[13px] min-[520px]:leading-5">{item.description}</p>
        {bookingHref ? (
          <a href={bookingHref} target="_blank" rel="noopener noreferrer sponsored" className="absolute right-2 top-3 inline-flex h-8 min-w-[66px] items-center justify-center rounded-[8px] border border-[#ff7a00] bg-transparent px-1.5 text-[10.5px] font-bold text-[#ff7a00] transition active:bg-[#ff7a00] active:text-white min-[390px]:min-w-[76px] min-[390px]:text-[11px] min-[520px]:right-4 min-[520px]:min-w-[88px] min-[520px]:px-2 min-[520px]:text-[12px]">
            Book Now
          </a>
        ) : (
          <button type="button" disabled className="absolute right-2 top-3 inline-flex h-8 min-w-[66px] items-center justify-center rounded-[8px] border border-black/10 bg-black/5 px-1.5 text-[9px] font-bold text-black/35 min-[390px]:min-w-[76px] min-[390px]:text-[9.5px] min-[520px]:right-4 min-[520px]:min-w-[88px] min-[520px]:px-2 min-[520px]:text-[10px]">
            Booking unavailable
          </button>
        )}
        <div className="absolute bottom-3 right-2 text-right min-[520px]:right-4">
          {item.price ? <div className="text-[13px] font-extrabold leading-none min-[390px]:text-[14px] min-[520px]:text-[16px]">{item.price}</div> : null}
          {item.people ? <div className="mt-1 text-[10.5px] leading-3 text-black/55 min-[390px]:text-[11px] min-[520px]:text-[12px]">{item.people}</div> : null}
        </div>
      </div>
    </div>
  );
}

function formatMobileTime(value?: string) {
  if (!value) return "Open";
  const normalized = value.trim();
  const match = normalized.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!match) return normalized;
  const hour = Number(match[1]);
  const minutes = match[2] || "00";
  const suffix = match[3]?.toUpperCase() || (hour >= 12 ? "PM" : "AM");
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${String(displayHour).padStart(2, "0")}:${minutes}\n${suffix}`;
}

function MobileSummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] border border-black/8 bg-white/58 p-3">
      <div className="text-[14px] font-bold text-[#2d1f18]">{value}</div>
      <div className="mt-1 text-[12px] text-black/55">{label}</div>
    </div>
  );
}

function MobileOverlaySheet({
  activeDay,
  days,
  goToDay,
  overlay,
  setOverlay,
}: {
  activeDay: ReadyPlanContent["days"][number];
  days: ReadyPlanContent["days"];
  goToDay: (index: number) => void;
  overlay: MobileOverlay;
  setOverlay: (value: MobileOverlay) => void;
}) {
  if (!overlay) return null;

  const title =
    overlay === "timeline"
      ? "Full Timeline"
      : overlay === "gallery"
        ? "Gallery"
        : overlay === "map"
          ? "Day Map"
          : overlay === "details"
            ? "Day Details"
            : overlay === "overview"
              ? "Journey Overview"
              : "Added to Plan";

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70 px-3 pb-3 lg:hidden" onClick={() => setOverlay(null)}>
      <div className="max-h-[82vh] w-full overflow-y-auto rounded-[16px] border border-white/12 bg-[linear-gradient(180deg,#f8eadc,#f0dfcf)] p-4 text-[#2d1f18] shadow-[0_24px_80px_rgba(0,0,0,0.38)]" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[18px] font-bold">{title}</h2>
          <button type="button" onClick={() => setOverlay(null)} className="flex h-11 w-11 items-center justify-center rounded-[12px] border border-black/10 bg-white/55">
            <X size={20} />
          </button>
        </div>

        {overlay === "timeline" ? (
          <div className="mt-4 space-y-3">
            {days.map((day, index) => (
              <button
                key={day.id}
                type="button"
                onClick={() => {
                  setOverlay(null);
                  goToDay(index);
                }}
                className="flex w-full items-center gap-3 rounded-[12px] border border-black/8 bg-white/58 p-3 text-left"
              >
                <Img src={day.previewImage || day.heroImage} alt={day.title} className="h-14 w-14 rounded-[10px] object-cover" />
                <div>
                  <div className="text-[13px] font-bold text-[#ff7a00]">Day {day.dayNumber}</div>
                  <div className="text-[14px] font-semibold">{day.destinationLabel || day.title}</div>
                  <div className="text-[12px] text-black/55">{day.countryLabel}</div>
                </div>
              </button>
            ))}
          </div>
        ) : null}

        {overlay === "gallery" ? (
          <div className="mt-4 grid gap-3">
            {[activeDay.heroImage, activeDay.story.imageUrl, ...activeDay.timelineItems.map((item) => item.imageUrl)].filter(Boolean).slice(0, 6).map((src, index) => (
              <Img key={`${src}-${index}`} src={src} alt={`${activeDay.title} gallery ${index + 1}`} className="h-44 w-full rounded-[12px] object-cover" />
            ))}
          </div>
        ) : null}

        {overlay === "map" ? (
          <div className="mt-4 rounded-[12px] border border-black/8 bg-white/60 p-4">
            <div className="flex items-center gap-2 text-[#ff7a00]"><MapPin size={22} /><span className="text-[14px] font-bold">{activeDay.routeTo || activeDay.destinationLabel}</span></div>
            <p className="mt-3 text-[14px] leading-6 text-black/65">Map view is prepared for this day route and locations. Your booking items stay connected to their saved itinerary data.</p>
          </div>
        ) : null}

        {overlay === "details" ? (
          <div className="mt-4 space-y-3">
            {activeDay.timelineItems.map((item) => (
              <div key={item.id} className="rounded-[12px] border border-black/8 bg-white/58 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[12px] font-semibold text-[#ff7a00]">{item.time || "Open"}</div>
                    <div className="mt-1 text-[14px] font-bold">{item.title}</div>
                  </div>
                  {item.price ? <div className="text-[14px] font-bold">{item.price}</div> : null}
                </div>
                <p className="mt-2 text-[13px] leading-5 text-black/65">{item.description}</p>
              </div>
            ))}
          </div>
        ) : null}

        {overlay === "overview" ? (
          <p className="mt-4 text-[14px] leading-6 text-black/65">This panel is ready for the journey overview editor flow. The public customer view keeps details readable while admin editing remains protected in the dashboard.</p>
        ) : null}

        {overlay === "added" ? (
          <p className="mt-4 text-[14px] leading-6 text-black/65">Suggestion added to this day preview. Permanent saves still happen through the editor flow.</p>
        ) : null}
      </div>
    </div>
  );
}

function HeroChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-black/28 px-4 py-2 text-xs uppercase tracking-[0.18em] text-white/86">
      {icon}
      {label}
    </span>
  );
}

function TimelinePlanCard({
  item,
  bookingHref,
  Icon,
}: {
  item: ReadyPlanTimelineItem;
  bookingHref?: string;
  Icon: ReturnType<typeof itemIcon>;
}) {
  const body = (
    <div className="grid gap-0 overflow-hidden rounded-[12px] border border-black/8 bg-white/75 shadow-[0_10px_34px_rgba(0,0,0,0.06)] md:min-h-[120px] md:grid-cols-[160px_minmax(0,1fr)_128px] md:items-stretch">
      <div className="relative overflow-visible">
        <Img src={item.imageUrl} alt={item.title} className={ITEM_IMAGE_CLASS} />
        <span className="absolute left-[136px] top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#ff7a00] shadow-[0_8px_20px_rgba(0,0,0,0.12)]">
          <Icon size={24} />
        </span>
      </div>
      <div className="min-w-0 px-6 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-[6px] bg-[#ff7a00] px-2.5 py-1 text-[12px] font-semibold text-white">
            {item.badge || prettyType(item.type)}
          </span>
          {item.status ? (
            <span className="rounded-[6px] bg-black/5 px-2.5 py-1 text-[12px] font-semibold text-black/70">
              {item.status}
            </span>
          ) : null}
        </div>
        <div className="mt-3 text-[16px] font-semibold leading-5 text-[#1f1f1f]">
          {item.title}
        </div>
        <p className="mt-2 line-clamp-2 text-[13px] leading-5 text-black/70">{item.description}</p>
      </div>
      <div className="flex h-full flex-col items-end justify-between px-4 py-4 text-right text-[#2b1e18]">
        {bookingHref ? (
          <a
            href={bookingHref}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className={ITEM_BUTTON_CLASS}
          >
            {BOOK_NOW_LABEL}
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="inline-flex h-8 min-w-[142px] items-center justify-center rounded-[8px] border border-black/10 bg-black/5 px-[14px] text-[12px] font-semibold text-black/35"
          >
            Booking unavailable
          </button>
        )}
        <div>
          {item.price ? <div className="text-[16px] font-bold leading-none">{item.price}</div> : null}
          {item.people ? <div className="mt-2 text-[12px] text-black/60">{item.people}</div> : null}
        </div>
      </div>
    </div>
  );

  return body;
}

function prettyType(type: ReadyPlanTimelineItem["type"]) {
  if (type === "transportation") return "Transport";
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-black/8 bg-white/62 p-4">
      <div className="text-[11px] uppercase tracking-[0.16em] text-[#7d604c]">{label}</div>
      <div className="mt-2 text-[30px] font-semibold leading-none text-[#2b1e18]">{value}</div>
    </div>
  );
}

function SuggestionCard({ suggestion }: { suggestion: ReadyPlanSuggestion }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.28, ease }}
      className="overflow-hidden rounded-[16px] border border-black/8 bg-white/72 shadow-[0_12px_38px_rgba(0,0,0,0.08)]"
    >
      <div className="relative h-40">
        <Img src={suggestion.imageUrl} alt={suggestion.title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.02),rgba(0,0,0,0.62))]" />
        <div className="absolute inset-x-0 bottom-0 p-4 text-white">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-[#ffd6b0]">
            <span className="rounded-full bg-[#ff7a00] px-2.5 py-1 text-white">{suggestion.category || "Activity"}</span>
            <span>{suggestion.matchScore || "Highly Recommended"}</span>
          </div>
          <div className="mt-3 text-[16px] font-semibold leading-5">{suggestion.title}</div>
        </div>
      </div>
      <div className="p-4 text-[#2d1f18]">
        <p className="text-[13px] leading-6 text-[#5a4638]">{suggestion.matchReason}</p>
        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            {suggestion.price ? <div className="text-[16px] font-bold leading-none">{suggestion.price}</div> : null}
            {suggestion.duration ? <div className="mt-2 text-[12px] text-[#705749]">{suggestion.duration}</div> : null}
          </div>
          <button className="inline-flex h-12 items-center gap-2 rounded-[12px] bg-[linear-gradient(135deg,#ff7a00,#ffab3d)] px-4 py-3 text-[14px] font-semibold text-white shadow-[0_0_26px_rgba(255,122,0,0.26)]">
            <Sparkles size={15} />
            {BOOK_NOW_LABEL}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
