"use client";

import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  CarFront,
  ChevronLeft,
  ChevronRight,
  CloudSun,
  Heart,
  Hotel,
  Info,
  MapPin,
  Music4,
  Plane,
  Plus,
  Sparkles,
  Star,
  Ticket,
  UtensilsCrossed,
  Waves,
} from "lucide-react";
import {
  buildDefaultReadyPlanContent,
  type ReadyPlanContent,
  type ReadyPlanDayContent,
  type ReadyPlanNote,
  type ReadyPlanSuggestion,
  type ReadyPlanTimelineItem,
} from "@/lib/ready-plan-content";

type PlanRecord = {
  id: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  slug: string;
  title: string;
  subtitle?: string | null;
  destination: string;
  country?: string | null;
  city?: string | null;
  style?: string | null;
  daysCount: number;
  heroImage?: string | null;
  coverImage?: string | null;
  summary?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  tags?: string[];
  season?: string | null;
  showOnHome?: boolean;
  priceFrom?: number | null;
  currency: string;
  contentJson?: unknown;
  daysJson?: unknown;
};

type StudioProps = {
  mode: "create" | "edit";
  planId?: string;
};

const ITEM_TYPES: ReadyPlanTimelineItem["type"][] = [
  "hotel",
  "flight",
  "transportation",
  "activity",
  "event",
  "restaurant",
];

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function timelineIcon(type: ReadyPlanTimelineItem["type"]) {
  if (type === "hotel") return Hotel;
  if (type === "flight") return Plane;
  if (type === "transportation") return CarFront;
  if (type === "restaurant") return UtensilsCrossed;
  if (type === "event") return Ticket;
  return Waves;
}

function emptyTimelineItem(): ReadyPlanTimelineItem {
  return {
    id: uid("item"),
    type: "activity",
    badge: "",
    status: "",
    time: "",
    title: "",
    description: "",
    imageUrl: "",
    deeplink: "",
    buttonLabel: "Book Now",
    price: "",
    people: "",
  };
}

function emptySuggestion(): ReadyPlanSuggestion {
  return {
    id: uid("suggestion"),
    title: "",
    category: "",
    imageUrl: "",
    matchReason: "",
    matchScore: "",
    price: "",
    duration: "",
    ctaText: "Add to Plan",
  };
}

function emptyNote(): ReadyPlanNote {
  return {
    id: uid("note"),
    icon: "sparkles",
    title: "",
    text: "",
  };
}

function createDay(dayNumber: number, destination: string, heroImage?: string | null): ReadyPlanDayContent {
  return {
    id: uid("day"),
    dayNumber,
    title: `Day ${dayNumber}`,
    destinationLabel: destination || "",
    countryLabel: "",
    previewImage: "",
    heroImage: heroImage || "",
    dateLabel: "",
    routeFrom: "",
    routeTo: "",
    weatherLabel: "",
    quote: "",
    description: "",
    timelineItems: [emptyTimelineItem(), emptyTimelineItem(), emptyTimelineItem(), emptyTimelineItem()],
    suggestions: [emptySuggestion()],
    story: {
      imageUrl: "",
      quote: "",
      musicLabel: "Open Story",
      musicUrl: "",
    },
    summary: {
      activitiesCount: "",
      restaurantsCount: "",
      transfersCount: "",
      estimatedCost: "",
      upgrades: [],
      viewDetailsText: "View Details",
      editPlanText: "Edit Plan",
    },
    notes: [emptyNote(), emptyNote(), emptyNote()],
  };
}

function moveInArray<T>(items: T[], index: number, direction: -1 | 1) {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

function createBlankPlan(): PlanRecord {
  return {
    id: "",
    status: "DRAFT",
    slug: "",
    title: "",
    subtitle: "",
    destination: "",
    country: "",
    city: "",
    style: "Luxury",
    daysCount: 1,
    heroImage: "",
    coverImage: "",
    summary: "",
    seoTitle: "",
    seoDescription: "",
    tags: [],
    season: "",
    showOnHome: false,
    priceFrom: null,
    currency: "USD",
  };
}

export default function ReadyPlanStudio({ mode, planId }: StudioProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [uploadingLabel, setUploadingLabel] = useState("");
  const [message, setMessage] = useState("");
  const [plan, setPlan] = useState<PlanRecord | null>(() => (mode === "create" ? createBlankPlan() : null));
  const [content, setContent] = useState<ReadyPlanContent | null>(() =>
    mode === "create"
      ? buildDefaultReadyPlanContent({
          title: "Your Cinematic Ready Plan",
          subtitle: "",
          destination: "",
          daysCount: 1,
          heroImage: "",
          coverImage: "",
          currency: "USD",
          priceFrom: null,
          style: "Luxury",
          daysJson: [],
          contentJson: null,
        })
      : null,
  );
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  useEffect(() => {
    if (mode !== "edit" || !planId) return;

    async function load() {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/ready-plans/${planId}`, { cache: "no-store" });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data?.ok) {
          setMessage(data?.code || "Could not load ready plan.");
          return;
        }

        setPlan(data.plan);
        setContent(
          buildDefaultReadyPlanContent({
            title: data.plan.title,
            subtitle: data.plan.subtitle,
            destination: data.plan.destination,
            daysCount: data.plan.daysCount,
            heroImage: data.plan.heroImage,
            coverImage: data.plan.coverImage,
            currency: data.plan.currency,
            priceFrom: data.plan.priceFrom,
            style: data.plan.style,
            daysJson: data.plan.daysJson,
            contentJson: data.plan.contentJson,
          }),
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [mode, planId]);

  const activeDay = content?.days[selectedDayIndex];
  const primarySuggestion = activeDay?.suggestions[0] ?? null;

  function patchPlan(patch: Partial<PlanRecord>) {
    setPlan((current) => (current ? { ...current, ...patch } : current));
  }

  function patchContent(patch: Partial<ReadyPlanContent>) {
    setContent((current) => (current ? { ...current, ...patch } : current));
  }

  function patchActiveDay(patch: Partial<ReadyPlanDayContent>) {
    setContent((current) => {
      if (!current) return current;
      return {
        ...current,
        days: current.days.map((day, index) => (index === selectedDayIndex ? { ...day, ...patch } : day)),
      };
    });
  }

  function patchDayAt(index: number, patch: Partial<ReadyPlanDayContent>) {
    setContent((current) => {
      if (!current) return current;
      return {
        ...current,
        days: current.days.map((day, dayIndex) => (dayIndex === index ? { ...day, ...patch } : day)),
      };
    });
  }

  function patchTimelineItem(itemId: string, patch: Partial<ReadyPlanTimelineItem>) {
    patchActiveDay({
      timelineItems: (activeDay?.timelineItems || []).map((item) =>
        item.id === itemId ? { ...item, ...patch } : item,
      ),
    });
  }

  function patchSuggestion(itemId: string, patch: Partial<ReadyPlanSuggestion>) {
    patchActiveDay({
      suggestions: (activeDay?.suggestions || []).map((item) =>
        item.id === itemId ? { ...item, ...patch } : item,
      ),
    });
  }

  function patchNote(noteId: string, patch: Partial<ReadyPlanNote>) {
    patchActiveDay({
      notes: (activeDay?.notes || []).map((item) => (item.id === noteId ? { ...item, ...patch } : item)),
    });
  }

  function patchHeroStat(index: number, patch: { label?: string; value?: string }) {
    if (!content) return;
    patchContent({
      hero: {
        ...content.hero,
        stats: content.hero.stats.map((stat, statIndex) => (statIndex === index ? { ...stat, ...patch } : stat)),
      },
    });
  }

  function patchJourneyOverview(key: keyof ReadyPlanContent["journeyOverview"], value: string) {
    if (!content) return;
    patchContent({
      journeyOverview: {
        ...content.journeyOverview,
        [key]: value,
      },
    });
  }

  function moveTimelineItem(index: number, direction: -1 | 1) {
    if (!activeDay) return;
    patchActiveDay({ timelineItems: moveInArray(activeDay.timelineItems, index, direction) });
  }

  function moveDay(index: number, direction: -1 | 1) {
    setContent((current) => {
      if (!current) return current;
      const target = index + direction;
      if (target < 0 || target >= current.days.length) return current;
      const next = [...current.days];
      [next[index], next[target]] = [next[target], next[index]];
      return {
        ...current,
        days: next.map((day, dayIndex) => ({ ...day, dayNumber: dayIndex + 1 })),
      };
    });
    setSelectedDayIndex((current) => current + direction);
  }

  function addDay() {
    setContent((current) => {
      if (!current || !plan) return current;
      return {
        ...current,
        days: [...current.days, createDay(current.days.length + 1, plan.destination, plan.heroImage)],
      };
    });
    setSelectedDayIndex(content?.days.length ?? 0);
  }

  function removeDay(index: number) {
    setContent((current) => {
      if (!current || current.days.length <= 1) return current;
      const next = current.days
        .filter((_, itemIndex) => itemIndex !== index)
        .map((day, dayIndex) => ({ ...day, dayNumber: dayIndex + 1 }));
      return { ...current, days: next };
    });
    setSelectedDayIndex((current) => Math.max(0, current - (current >= index ? 1 : 0)));
  }

  async function onImagePick(
    event: React.ChangeEvent<HTMLInputElement>,
    apply: (value: string) => void,
    label: string,
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingLabel(label);

    try {
      const formData = new FormData();
      formData.append("bucket", "ready-plans");
      formData.append("file", file);

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.ok || !data?.publicUrl) {
        throw new Error(data?.code || "UPLOAD_FAILED");
      }

      apply(data.publicUrl);
    } catch (error: any) {
      setMessage(error?.message || `Could not upload ${label}.`);
    } finally {
      event.target.value = "";
      setUploadingLabel("");
    }
  }

  async function save(statusOverride?: "DRAFT" | "PUBLISHED") {
    if (!plan || !content) return;

    setSaving(true);
    setMessage("");

    try {
      const payload = {
        ...plan,
        status: statusOverride ?? plan.status,
        daysCount: content.days.length,
        contentJson: content,
      };

      const response = await fetch(
        mode === "create" ? "/api/admin/ready-plans" : `/api/admin/ready-plans/${plan.id}`,
        {
          method: mode === "create" ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.ok) {
        setMessage(data?.code || "Could not save ready plan.");
        return;
      }

      setPlan(data.plan);
      setContent(
        buildDefaultReadyPlanContent({
          title: data.plan.title,
          subtitle: data.plan.subtitle,
          destination: data.plan.destination,
          daysCount: data.plan.daysCount,
          heroImage: data.plan.heroImage,
          coverImage: data.plan.coverImage,
          currency: data.plan.currency,
          priceFrom: data.plan.priceFrom,
          style: data.plan.style,
          daysJson: data.plan.daysJson,
          contentJson: data.plan.contentJson,
        }),
      );
      setMessage(mode === "create" ? "Ready Plan created." : "Ready Plan saved.");

      if (mode === "create" && data.id) {
        router.replace(`/admin/ready-plans/${data.id}/edit`);
      }
    } finally {
      setSaving(false);
    }
  }

  async function saveAsStatus(status: "DRAFT" | "PUBLISHED") {
    patchPlan({ status });
    await save(status);
  }

  async function removePlan() {
    if (!plan) return;
    if (mode === "create") {
      router.push("/admin/ready-plans");
      return;
    }

    if (!window.confirm("Permanently delete this ready plan?")) return;

    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/ready-plans/${plan.id}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.ok) {
        setMessage(data?.code || "Could not remove ready plan.");
        return;
      }
      router.push("/admin/ready-plans");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (loading || !plan || !content || !activeDay) {
    return <div className="text-white/70">Loading Ready Plan studio...</div>;
  }

  return (
    <div className="overflow-hidden rounded-[40px] border border-white/10 bg-[linear-gradient(180deg,#17120d_0%,#0b0908_100%)] shadow-[0_30px_110px_rgba(0,0,0,0.42)]">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={content.hero.backgroundImage || plan.heroImage || "/bg/home-hero.png"}
            alt={content.hero.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(13,11,10,0.84)_0%,rgba(17,13,10,0.44)_50%,rgba(10,8,7,0.78)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,122,0,0.2),transparent_22%),linear-gradient(180deg,rgba(4,4,4,0.02)_0%,rgba(4,4,4,0.58)_100%)]" />
        </div>

        <div className="relative p-5 md:p-8 xl:p-10">
          <div className="flex items-center justify-between gap-4 text-white">
            <div className="flex items-center gap-3">
              <div className="text-4xl font-black tracking-tight text-[#ff7a00]">GENE</div>
              <div className="text-xs uppercase tracking-[0.34em] text-white/78">TRAVEL</div>
            </div>
            <div className="flex items-center gap-4 text-sm text-white/82">
              <div className="inline-flex items-center gap-2">
                <Music4 size={15} className="text-[#ffb066]" />
                <span>Cinematic Story</span>
              </div>
              <Info size={16} className="text-white/75" />
              <Heart size={16} className="text-white/75" />
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 font-semibold">
                A
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-6 xl:grid-cols-[1.15fr_330px] xl:items-start">
            <div className="max-w-4xl text-white">
              <div className="flex items-start gap-3">
                <textarea
                  className="min-h-[150px] w-full resize-none bg-transparent text-[42px] font-semibold leading-[0.96] tracking-tight text-white outline-none md:text-[74px]"
                  value={content.hero.title}
                  onChange={(e) => patchContent({ hero: { ...content.hero, title: e.target.value } })}
                />
                <Info size={18} className="mt-4 shrink-0 text-white/76" />
              </div>

              <textarea
                className="mt-4 min-h-[86px] w-full max-w-2xl resize-none bg-transparent text-lg leading-8 text-white/80 outline-none"
                value={content.hero.subtitle}
                onChange={(e) => patchContent({ hero: { ...content.hero, subtitle: e.target.value } })}
              />

              <div className="mt-4 flex flex-wrap gap-2">
                <QuickUploadChip
                  label="Hero background"
                  onFileChange={(event) =>
                    onImagePick(
                      event,
                      (value) => patchContent({ hero: { ...content.hero, backgroundImage: value } }),
                      "hero background",
                    )
                  }
                />
                <QuickUploadChip
                  label="Homepage top image"
                  onFileChange={(event) => onImagePick(event, (value) => patchPlan({ heroImage: value }), "homepage top image")}
                />
                <QuickUploadChip
                  label="Card image"
                  onFileChange={(event) => onImagePick(event, (value) => patchPlan({ coverImage: value }), "card image")}
                />
              </div>

              <div className="mt-7 flex flex-wrap gap-3">
                {content.hero.stats.map((stat, index) => (
                  <div
                    key={`${stat.label}-${index}`}
                    className="min-w-[116px] rounded-[18px] border border-white/15 bg-white/[0.06] px-4 py-3 backdrop-blur-xl"
                  >
                    <input
                      className="w-full bg-transparent text-2xl font-semibold text-white outline-none"
                      value={stat.value}
                      onChange={(e) => patchHeroStat(index, { value: e.target.value })}
                    />
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        className="w-full bg-transparent text-xs uppercase tracking-[0.22em] text-white/64 outline-none"
                        value={stat.label}
                        onChange={(e) => patchHeroStat(index, { label: e.target.value })}
                      />
                      <Plus size={13} className="text-white/70" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => saveAsStatus("PUBLISHED")}
                  disabled={saving}
                  className="rounded-[18px] bg-[linear-gradient(135deg,#ff7a00,#ffb347)] px-7 py-4 text-sm font-semibold text-white shadow-[0_0_34px_rgba(255,122,0,0.34)] transition hover:scale-[1.01] disabled:opacity-60"
                >
                  {content.hero.primaryCtaText || "Plan Smarter With AI"}
                </button>
                <button
                  type="button"
                  onClick={() => window.open(plan.slug ? `/ready-plans/${plan.slug}` : "/ready-plans", "_blank")}
                  className="inline-flex items-center gap-3 rounded-full border border-white/18 bg-black/24 px-5 py-3 text-sm text-white/86 backdrop-blur-xl"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20">
                    <span className="ml-0.5 text-sm">▶</span>
                  </span>
                  {content.hero.secondaryCtaText || "View Full Timeline"}
                </button>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/14 bg-[linear-gradient(180deg,rgba(255,248,239,0.95),rgba(245,231,214,0.92))] p-5 text-[#2d1e17] shadow-[0_26px_70px_rgba(0,0,0,0.24)]">
              <div className="flex items-center justify-between gap-3">
                <input
                  className="w-full bg-transparent text-2xl font-semibold outline-none"
                  value={content.journeyOverview.title}
                  onChange={(e) => patchJourneyOverview("title", e.target.value)}
                />
                <Sparkles size={16} className="shrink-0 text-[#ff7a00]" />
                <Info size={16} className="shrink-0 text-[#6b5443]" />
              </div>

              <div className="mt-5 space-y-3">
                {[
                  ["startPoint", "Starting Point", "Add location"],
                  ["destinations", "Destinations", "Add destinations"],
                  ["tripStyle", "Trip Style", "Add trip style"],
                  ["travelers", "Travelers", "Add number"],
                  ["estimatedCost", "Estimated Cost", "Add estimated cost"],
                ].map(([key, label, placeholder]) => (
                  <div key={key} className="space-y-2">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-[#7b6352]">{label}</div>
                    <div className="flex items-center gap-2 rounded-[14px] border border-black/8 bg-white/58 px-3 py-2">
                      <input
                        className="w-full bg-transparent text-sm text-[#2d1e17] outline-none"
                        value={String(content.journeyOverview[key as keyof ReadyPlanContent["journeyOverview"]] ?? "")}
                        placeholder={placeholder}
                        onChange={(e) => patchJourneyOverview(key as keyof ReadyPlanContent["journeyOverview"], e.target.value)}
                      />
                      <Plus size={14} className="text-[#6f5746]" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-[18px] border border-black/8 bg-white/50 p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-[#7b6352]">AI Score</div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <input
                    className="w-20 bg-transparent text-sm text-[#2d1e17] outline-none"
                    value={content.journeyOverview.aiScore}
                    onChange={(e) => patchJourneyOverview("aiScore", e.target.value)}
                  />
                  <div className="flex items-center gap-1 text-[#ff7a00]">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={index} size={15} fill="currentColor" />
                    ))}
                  </div>
                  <Info size={15} className="text-[#6b5443]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 px-3 pb-4 md:px-4 xl:grid-cols-[188px_minmax(0,1fr)_282px]">
        <aside className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(0,0,0,0.28))] p-4 text-white shadow-[0_20px_70px_rgba(0,0,0,0.24)]">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm font-medium text-white/92">Your Journey</div>
            <div className="flex items-center gap-2 text-white/76">
              <Info size={14} />
              <button type="button" onClick={addDay}>
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {content.days.map((day, index) => (
              <button
                key={day.id}
                type="button"
                onClick={() => setSelectedDayIndex(index)}
                className={`flex w-full items-center gap-3 rounded-[20px] border px-3 py-3 text-left transition ${
                  index === selectedDayIndex
                    ? "border-[#ff7a00]/45 bg-[#ff7a00]/10"
                    : "border-white/10 bg-white/[0.03]"
                }`}
              >
                <MiniImageSlot
                  value={day.previewImage || day.heroImage}
                  onFileChange={(event) =>
                    onImagePick(
                      event,
                      (value) => patchDayAt(index, { previewImage: value }),
                      `day ${day.dayNumber} preview image`,
                    )
                  }
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs uppercase tracking-[0.18em] text-[#ffbf82]">Day {day.dayNumber}</div>
                  <div className="mt-1 truncate text-sm font-medium text-white">
                    {day.destinationLabel || `Day ${day.dayNumber}`}
                  </div>
                  <div className="mt-1 truncate text-xs text-white/58">{day.countryLabel || day.title}</div>
                </div>
                <Info size={13} className="shrink-0 text-white/64" />
              </button>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <button type="button" onClick={() => moveDay(selectedDayIndex, -1)} disabled={selectedDayIndex === 0} className={tinyDarkButtonClass}>
              Up
            </button>
            <button type="button" onClick={() => moveDay(selectedDayIndex, 1)} disabled={selectedDayIndex === content.days.length - 1} className={tinyDarkButtonClass}>
              Down
            </button>
            <button type="button" onClick={() => removeDay(selectedDayIndex)} disabled={content.days.length <= 1} className={tinyDangerButtonClass}>
              Remove
            </button>
          </div>

          <button type="button" className="mt-5 w-full rounded-[16px] border border-white/16 bg-white/[0.04] px-4 py-3 text-sm text-white/84">
            View Full Timeline
          </button>
        </aside>

        <div className="space-y-4">
          <section className="rounded-[32px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,248,239,0.98),rgba(245,232,218,0.96))] p-5 text-[#2d1d16] shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-[40px] font-semibold leading-none">{`Day ${activeDay.dayNumber}`}</div>
                  <InlinePillInput
                    value={activeDay.destinationLabel}
                    placeholder="Add city, country"
                    onChange={(value) => patchActiveDay({ destinationLabel: value })}
                  />
                </div>
                <textarea
                  className="mt-3 min-h-[70px] w-full max-w-2xl resize-none bg-transparent text-sm leading-7 text-[#5e4738] outline-none"
                  value={activeDay.title}
                  placeholder="Welcome to your journey! Describe what makes this day unforgettable."
                  onChange={(e) => patchActiveDay({ title: e.target.value })}
                />
              </div>

              <div className="grid gap-3">
                <InlineIconInput
                  icon={<CloudSun size={16} className="text-[#ff7a00]" />}
                  value={activeDay.weatherLabel ?? ""}
                  placeholder="Add temp"
                  onChange={(value) => patchActiveDay({ weatherLabel: value })}
                />
                <InlineIconInput
                  icon={<CalendarDays size={16} className="text-[#8c6b55]" />}
                  value={activeDay.dateLabel ?? ""}
                  placeholder="Add date"
                  onChange={(value) => patchActiveDay({ dateLabel: value })}
                />
              </div>
            </div>

            <div className="mt-5">
              <LargeImageSlot
                value={activeDay.heroImage}
                label="Upload day image"
                onFileChange={(event) => onImagePick(event, (value) => patchActiveDay({ heroImage: value }), "day image")}
              />
            </div>

            <div className="mt-5 flex flex-col gap-3">
              <InlineIconInput
                icon={<MapPin size={15} className="text-[#2f231a]" />}
                value={activeDay.routeTo ?? ""}
                placeholder="Add location name"
                onChange={(value) => patchActiveDay({ routeTo: value })}
              />
              <textarea
                className="min-h-[56px] w-full resize-none bg-transparent text-sm text-[#5e4738] outline-none"
                value={activeDay.quote ?? ""}
                placeholder="Add short description of this location or highlight"
                onChange={(e) => patchActiveDay({ quote: e.target.value })}
              />
            </div>

            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <InlinePillInput
                value={plan.country ?? ""}
                placeholder="Gallery"
                onChange={(value) => patchPlan({ country: value })}
                compact
              />
              <InlinePillInput
                value={activeDay.story.musicLabel ?? ""}
                placeholder="Story"
                onChange={(value) => patchActiveDay({ story: { ...activeDay.story, musicLabel: value } })}
                compact
              />
              <InlinePillInput
                value={plan.city ?? ""}
                placeholder="Map"
                onChange={(value) => patchPlan({ city: value })}
                compact
              />
            </div>
          </section>

          <section className="rounded-[32px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,248,239,0.98),rgba(245,232,218,0.96))] p-5 text-[#2d1d16] shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
            <div className="mb-5 flex items-center gap-2">
              <h3 className="text-3xl font-semibold">Today&apos;s Plan</h3>
              <Info size={16} className="text-[#7b6454]" />
            </div>

            <div className="space-y-5">
              {activeDay.timelineItems.map((item, index) => {
                const Icon = timelineIcon(item.type);
                return (
                  <div key={item.id} className="grid gap-3 md:grid-cols-[72px_138px_minmax(0,1fr)] md:items-start">
                    <div className="pt-5 text-center text-xs leading-5 text-[#6a5547]">
                      <input
                        className="w-full bg-transparent text-center font-medium outline-none"
                        value={item.time ?? ""}
                        placeholder="10:00 AM"
                        onChange={(e) => patchTimelineItem(item.id, { time: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <SmallImageSlot
                        value={item.imageUrl}
                        onFileChange={(event) => onImagePick(event, (value) => patchTimelineItem(item.id, { imageUrl: value }), "timeline item image")}
                      />
                      <div className="flex justify-center gap-2">
                        <button type="button" onClick={() => moveTimelineItem(index, -1)} disabled={index === 0} className={tinyCreamButtonClass}>↑</button>
                        <button type="button" onClick={() => moveTimelineItem(index, 1)} disabled={index === activeDay.timelineItems.length - 1} className={tinyCreamButtonClass}>↓</button>
                      </div>
                    </div>

                    <div className="space-y-2 rounded-[20px] border border-black/8 bg-white/45 p-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ff7a00]/12 text-[#ff7a00]">
                          <Icon size={15} />
                        </span>
                        <input
                          className="w-full bg-transparent text-sm font-medium text-[#2d1d16] outline-none"
                          value={item.title}
                          placeholder="Add activity / hotel / transfer title"
                          onChange={(e) => patchTimelineItem(item.id, { title: e.target.value })}
                        />
                        <Info size={15} className="text-[#7b6454]" />
                      </div>

                      <div className="grid gap-2 lg:grid-cols-[120px_140px_1fr_120px]">
                        <select
                          className={softInputClass}
                          value={item.type}
                          onChange={(e) => patchTimelineItem(item.id, { type: e.target.value as ReadyPlanTimelineItem["type"] })}
                        >
                          {ITEM_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                        <input
                          className={softInputClass}
                          value={item.badge ?? ""}
                          placeholder="Add category"
                          onChange={(e) => patchTimelineItem(item.id, { badge: e.target.value })}
                        />
                        <input
                          className={softInputClass}
                          value={item.description ?? ""}
                          placeholder="Add short description"
                          onChange={(e) => patchTimelineItem(item.id, { description: e.target.value })}
                        />
                        <input
                          className={softInputClass}
                          value={item.price ?? ""}
                          placeholder="Add Price"
                          onChange={(e) => patchTimelineItem(item.id, { price: e.target.value })}
                        />
                      </div>

                      <div className="grid gap-2 lg:grid-cols-[1fr_150px_150px_120px]">
                        <input
                          className={softInputClass}
                          value={item.deeplink ?? ""}
                          placeholder="Add Affiliate Link"
                          onChange={(e) => patchTimelineItem(item.id, { deeplink: e.target.value })}
                        />
                        <input
                          className={softInputClass}
                          value={item.buttonLabel ?? ""}
                          placeholder="Button label"
                          onChange={(e) => patchTimelineItem(item.id, { buttonLabel: e.target.value })}
                        />
                        <input
                          className={softInputClass}
                          value={item.status ?? ""}
                          placeholder="Status"
                          onChange={(e) => patchTimelineItem(item.id, { status: e.target.value })}
                        />
                        <button
                          type="button"
                          onClick={() => patchActiveDay({ timelineItems: activeDay.timelineItems.filter((row) => row.id !== item.id) })}
                          className={tinyDangerButtonClass}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5">
              <button
                type="button"
                onClick={() => patchActiveDay({ timelineItems: [...activeDay.timelineItems, emptyTimelineItem()] })}
                className="rounded-[16px] border border-[#ff7a00]/25 bg-[#ff7a00]/10 px-4 py-3 text-sm font-medium text-[#d46700]"
              >
                Add item
              </button>
            </div>

            <div className="mt-6 rounded-[24px] border border-black/8 bg-white/58 p-4">
              <div className="mb-3 flex items-center gap-2">
                <h4 className="text-2xl font-semibold">Notes for Today</h4>
                <Info size={15} className="text-[#7b6454]" />
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {activeDay.notes.slice(0, 3).map((note) => (
                  <div key={note.id} className="rounded-[18px] border border-black/8 bg-white/65 p-3">
                    <div className="flex items-center gap-2 text-[#ff7a00]">
                      <Sparkles size={16} />
                      <input
                        className="w-full bg-transparent text-sm font-medium text-[#2d1d16] outline-none"
                        value={note.title}
                        placeholder="Add note"
                        onChange={(e) => patchNote(note.id, { title: e.target.value })}
                      />
                    </div>
                    <textarea
                      className="mt-2 min-h-[52px] w-full resize-none bg-transparent text-sm text-[#5e4738] outline-none"
                      value={note.text}
                      placeholder="Add note"
                      onChange={(e) => patchNote(note.id, { text: e.target.value })}
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <section className="rounded-[28px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,248,239,0.98),rgba(245,232,218,0.96))] p-5 text-[#2d1d16] shadow-[0_24px_80px_rgba(0,0,0,0.2)]">
            <div className="mb-3 flex items-center gap-2">
              <h3 className="text-[32px] font-semibold">AI Suggestions</h3>
              <Sparkles size={16} className="text-[#ff7a00]" />
              <Info size={15} className="text-[#7b6454]" />
            </div>
            <p className="text-sm text-[#6d584a]">Handpicked for you by GENE AI</p>

            <div className="mt-4 rounded-[20px] border border-black/8 bg-white/45 p-3">
              <div className="mb-3 flex items-center justify-between text-[#765e4e]">
                <button type="button" className={arrowPillClass}>
                  <ChevronLeft size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => patchActiveDay({ suggestions: [...activeDay.suggestions, emptySuggestion()] })}
                  className={arrowPillClass}
                >
                  <Plus size={18} />
                </button>
                <button type="button" className={arrowPillClass}>
                  <ChevronRight size={15} />
                </button>
              </div>

              <LargeImageSlot
                value={primarySuggestion?.imageUrl}
                label="Upload suggestion image"
                compact
                onFileChange={(event) =>
                  primarySuggestion
                    ? onImagePick(event, (value) => patchSuggestion(primarySuggestion.id, { imageUrl: value }), "suggestion image")
                    : Promise.resolve()
                }
              />

              <div className="mt-4 space-y-2">
                <input
                  className={softInputClass}
                  value={primarySuggestion?.title ?? ""}
                  placeholder="Add Suggestion title"
                  onChange={(e) => primarySuggestion && patchSuggestion(primarySuggestion.id, { title: e.target.value })}
                />
                <input
                  className={softInputClass}
                  value={primarySuggestion?.category ?? ""}
                  placeholder="Add tags"
                  onChange={(e) => primarySuggestion && patchSuggestion(primarySuggestion.id, { category: e.target.value })}
                />
                <textarea
                  className={softTextareaClass}
                  value={primarySuggestion?.matchReason ?? ""}
                  placeholder="Add short description"
                  onChange={(e) => primarySuggestion && patchSuggestion(primarySuggestion.id, { matchReason: e.target.value })}
                />
                <div className="grid gap-2 grid-cols-2">
                  <input
                    className={softInputClass}
                    value={primarySuggestion?.price ?? ""}
                    placeholder="Add Price"
                    onChange={(e) => primarySuggestion && patchSuggestion(primarySuggestion.id, { price: e.target.value })}
                  />
                  <input
                    className={softInputClass}
                    value={primarySuggestion?.duration ?? ""}
                    placeholder="Add Affiliate Link"
                    onChange={(e) => primarySuggestion && patchSuggestion(primarySuggestion.id, { duration: e.target.value })}
                  />
                </div>
              </div>

              <button type="button" className="mt-4 w-full rounded-[14px] bg-[#ff7a00] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(255,122,0,0.22)]">
                {primarySuggestion?.ctaText || "Add to Plan"}
              </button>
            </div>
          </section>

          <section className="rounded-[28px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,248,239,0.98),rgba(245,232,218,0.96))] p-5 text-[#2d1d16] shadow-[0_24px_80px_rgba(0,0,0,0.2)]">
            <div className="mb-3 flex items-center gap-2">
              <h3 className="text-[32px] font-semibold">Cinematic Story</h3>
              <Sparkles size={16} className="text-[#ff7a00]" />
              <Info size={15} className="text-[#7b6454]" />
            </div>

            <LargeImageSlot
              value={activeDay.story.imageUrl}
              label="Upload story image"
              compact
              onFileChange={(event) => onImagePick(event, (value) => patchActiveDay({ story: { ...activeDay.story, imageUrl: value } }), "story image")}
            />

            <textarea
              className="mt-4 min-h-[72px] w-full resize-none bg-transparent text-sm text-[#5e4738] outline-none"
              value={activeDay.story.quote ?? ""}
              placeholder="Add cinematic quote or story"
              onChange={(e) => patchActiveDay({ story: { ...activeDay.story, quote: e.target.value } })}
            />

            <input
              className={softInputClass}
              value={activeDay.story.musicUrl ?? ""}
              placeholder="Add author"
              onChange={(e) => patchActiveDay({ story: { ...activeDay.story, musicUrl: e.target.value } })}
            />

            <button type="button" className="mt-4 w-full rounded-[14px] bg-[#ff7a00] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(255,122,0,0.22)]">
              Open Story
            </button>
          </section>

          <section className="rounded-[28px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,248,239,0.98),rgba(245,232,218,0.96))] p-5 text-[#2d1d16] shadow-[0_24px_80px_rgba(0,0,0,0.2)]">
            <div className="mb-4 flex items-center gap-2">
              <h3 className="text-[32px] font-semibold">Day Summary</h3>
              <Info size={15} className="text-[#7b6454]" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <SummaryChip
                icon={<Waves size={15} />}
                value={activeDay.summary.activitiesCount ?? ""}
                placeholder="Add Activities"
                onChange={(value) => patchActiveDay({ summary: { ...activeDay.summary, activitiesCount: value } })}
              />
              <SummaryChip
                icon={<UtensilsCrossed size={15} />}
                value={activeDay.summary.restaurantsCount ?? ""}
                placeholder="Add Restaurants"
                onChange={(value) => patchActiveDay({ summary: { ...activeDay.summary, restaurantsCount: value } })}
              />
              <SummaryChip
                icon={<Hotel size={15} />}
                value={activeDay.summary.transfersCount ?? ""}
                placeholder="Add Hotels"
                onChange={(value) => patchActiveDay({ summary: { ...activeDay.summary, transfersCount: value } })}
              />
              <SummaryChip
                icon={<Star size={15} />}
                value={activeDay.summary.estimatedCost ?? ""}
                placeholder="Add cost"
                onChange={(value) => patchActiveDay({ summary: { ...activeDay.summary, estimatedCost: value } })}
              />
            </div>

            <div className="mt-4 flex gap-2">
              <input
                className={softInputClass}
                value={activeDay.summary.viewDetailsText ?? ""}
                placeholder="View Details"
                onChange={(e) => patchActiveDay({ summary: { ...activeDay.summary, viewDetailsText: e.target.value } })}
              />
              <input
                className={softInputClass}
                value={activeDay.summary.editPlanText ?? ""}
                placeholder="Edit Plan"
                onChange={(e) => patchActiveDay({ summary: { ...activeDay.summary, editPlanText: e.target.value } })}
              />
            </div>
          </section>
        </div>
      </section>

      <section className="px-3 pb-3 md:px-4 md:pb-4">
        <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(0,0,0,0.28))] px-4 py-5 text-white shadow-[0_20px_70px_rgba(0,0,0,0.2)] md:px-6">
          <div className="grid gap-4 md:grid-cols-[130px_minmax(0,1fr)_320px_130px] md:items-center">
            <SmallBannerSlot onFileChange={(event) => onImagePick(event, (value) => patchPlan({ coverImage: value }), "left banner image")} />
            <div>
              <input
                className="w-full bg-transparent text-[44px] font-semibold leading-tight text-white outline-none"
                value={content.footer.title}
                onChange={(e) => patchContent({ footer: { ...content.footer, title: e.target.value } })}
              />
              <textarea
                className="mt-2 min-h-[58px] w-full resize-none bg-transparent text-base text-white/78 outline-none"
                value={content.footer.subtitle}
                onChange={(e) => patchContent({ footer: { ...content.footer, subtitle: e.target.value } })}
              />
            </div>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => saveAsStatus("PUBLISHED")}
                disabled={saving}
                className="w-full rounded-[18px] bg-[linear-gradient(135deg,#ff7a00,#ffb347)] px-7 py-5 text-base font-semibold text-white shadow-[0_0_36px_rgba(255,122,0,0.34)] transition hover:scale-[1.01] disabled:opacity-60"
              >
                {content.footer.ctaText || "PLAN SMARTER WITH AI"}
              </button>
              <div className="flex gap-2">
                <button type="button" onClick={() => saveAsStatus("DRAFT")} disabled={saving} className={ghostButtonClass}>
                  Save Draft
                </button>
                <button type="button" onClick={removePlan} disabled={saving} className={dangerButtonClass}>
                  Remove
                </button>
              </div>
            </div>
            <SmallBannerSlot onFileChange={(event) => onImagePick(event, (value) => patchContent({ footer: { ...content.footer, backgroundImage: value } }), "footer background")} />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <button type="button" onClick={() => router.push("/admin/ready-plans")} className={ghostButtonClass}>
              Back to Ready Plans
            </button>
            {message ? <div className="text-sm text-white/78">{message}</div> : null}
            {uploadingLabel ? <div className="text-sm text-[#ffd1a3]">Uploading {uploadingLabel}...</div> : null}
          </div>
        </div>
      </section>
    </div>
  );
}

const ghostButtonClass =
  "rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/80 transition hover:bg-white/[0.08] disabled:opacity-40";
const dangerButtonClass =
  "rounded-2xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs uppercase tracking-[0.14em] text-red-200 transition hover:bg-red-500/15 disabled:opacity-40";
const softInputClass =
  "w-full rounded-[12px] border border-black/8 bg-white/70 px-3 py-2 text-sm text-[#2d1d16] outline-none placeholder:text-[#9a8474]";
const softTextareaClass =
  "min-h-[66px] w-full rounded-[12px] border border-black/8 bg-white/70 px-3 py-2 text-sm text-[#2d1d16] outline-none placeholder:text-[#9a8474]";
const tinyDarkButtonClass =
  "rounded-[12px] border border-white/12 bg-white/[0.06] px-3 py-2 text-xs text-white/82 disabled:opacity-40";
const tinyDangerButtonClass =
  "rounded-[10px] border border-red-500/25 bg-red-500/10 px-2.5 py-1 text-xs text-red-200 disabled:opacity-40";
const tinyCreamButtonClass =
  "rounded-[10px] border border-black/8 bg-white/70 px-2 py-1 text-xs text-[#5c4739] disabled:opacity-40";
const arrowPillClass =
  "flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white/70 text-[#5f4a3b]";

function InlinePillInput({
  value,
  placeholder,
  onChange,
  compact = false,
}: {
  value?: string;
  placeholder: string;
  onChange: (value: string) => void;
  compact?: boolean;
}) {
  return (
    <div className={`inline-flex items-center gap-2 rounded-[14px] border border-black/8 bg-white/65 px-3 ${compact ? "py-2" : "py-2.5"}`}>
      <input
        className={`bg-transparent outline-none ${compact ? "w-20 text-xs text-[#4d3a2d]" : "min-w-[150px] text-sm text-[#2d1d16]"}`}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      <Plus size={13} className="text-[#6f5746]" />
    </div>
  );
}

function InlineIconInput({
  icon,
  value,
  placeholder,
  onChange,
}: {
  icon: React.ReactNode;
  value?: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-[14px] border border-black/8 bg-white/65 px-3 py-2.5">
      {icon}
      <input
        className="min-w-[120px] bg-transparent text-sm text-[#2d1d16] outline-none placeholder:text-[#9a8474]"
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      <Info size={14} className="text-[#7a6454]" />
    </div>
  );
}

function QuickUploadChip({
  label,
  onFileChange,
}: {
  label: string;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const inputId = useId();

  return (
    <>
      <input id={inputId} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
      <label htmlFor={inputId} className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-2 text-xs uppercase tracking-[0.18em] text-white/76">
        <Plus size={12} />
        {label}
      </label>
    </>
  );
}

function LargeImageSlot({
  value,
  label,
  onFileChange,
  compact = false,
}: {
  value?: string;
  label: string;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void | Promise<void>;
  compact?: boolean;
}) {
  const inputId = useId();

  return (
    <>
      <input id={inputId} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
      <label
        htmlFor={inputId}
        className={`group flex cursor-pointer items-center justify-center overflow-hidden rounded-[22px] border border-dashed border-black/18 bg-[radial-gradient(circle_at_50%_32%,#fffdf9,#f7ecdf)] ${compact ? "h-[200px]" : "h-[290px]"}`}
      >
        {value ? (
          <div className="relative h-full w-full">
            <img src={value} alt={label} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/28 via-black/6 to-transparent" />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-center text-[#594437]">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-black/35">
              <Plus size={28} />
            </div>
            <div className="text-sm">{label}</div>
          </div>
        )}
      </label>
    </>
  );
}

function SmallImageSlot({
  value,
  onFileChange,
}: {
  value?: string;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void | Promise<void>;
}) {
  const inputId = useId();
  return (
    <>
      <input id={inputId} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
      <label htmlFor={inputId} className="flex h-[110px] cursor-pointer items-center justify-center overflow-hidden rounded-[18px] border border-dashed border-black/18 bg-[radial-gradient(circle_at_50%_32%,#fffdf9,#f7ecdf)]">
        {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : <Plus size={24} className="text-[#4b3a2d]" />}
      </label>
    </>
  );
}

function MiniImageSlot({
  value,
  onFileChange,
}: {
  value?: string;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void | Promise<void>;
}) {
  const inputId = useId();
  return (
    <>
      <input id={inputId} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
      <label htmlFor={inputId} className="flex h-[58px] w-[58px] cursor-pointer items-center justify-center overflow-hidden rounded-[14px] border border-white/10 bg-[linear-gradient(180deg,#fffaf4,#f6eadb)]">
        {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : <Plus size={18} className="text-[#3f3025]" />}
      </label>
    </>
  );
}

function SmallBannerSlot({
  onFileChange,
}: {
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void | Promise<void>;
}) {
  const inputId = useId();
  return (
    <>
      <input id={inputId} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
      <label htmlFor={inputId} className="flex h-[96px] cursor-pointer items-center justify-center rounded-[18px] border border-dashed border-[#d2bcaa] bg-[linear-gradient(180deg,#fffaf4,#f6eadb)] text-[#4b3a2d]">
        <Plus size={26} />
      </label>
    </>
  );
}

function SummaryChip({
  icon,
  value,
  placeholder,
  onChange,
}: {
  icon: React.ReactNode;
  value?: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="rounded-[16px] border border-black/8 bg-white/65 p-3">
      <div className="flex items-center gap-2 text-[#ff7a00]">{icon}</div>
      <input
        className="mt-2 w-full bg-transparent text-sm text-[#2d1d16] outline-none placeholder:text-[#9a8474]"
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
