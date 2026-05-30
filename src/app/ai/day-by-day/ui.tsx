"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  GripVertical,
  Hotel,
  Moon,
  Pencil,
  Plane,
  Plus,
  Share2,
  Sparkles,
  Sun,
  Trash2,
  UtensilsCrossed,
  WandSparkles,
  X,
} from "lucide-react";
import AiSuiteFrame from "@/components/ai/AiSuiteFrame";
import { addItineraryItem, moveItineraryItem, removeItineraryItem, updateItineraryItem } from "@/lib/recommendation/itinerary";
import { buildCinematicStoryModeFromPayload } from "@/lib/story/cinematicStoryMode";
import type {
  ActivityRecommendation,
  CinematicStoryMode,
  DayPlan,
  DayPlanItem,
  HiddenGemResult,
  RecommendationPayload,
  RestaurantRecommendation,
} from "@/lib/recommendation/types";

const visibleSlots = ["morning", "afternoon", "evening"] as const;
type VisibleSlot = (typeof visibleSlots)[number];

const slotMeta: Record<VisibleSlot, { label: string; icon: React.ReactNode }> = {
  morning: { label: "Morning", icon: <Sun size={15} className="text-[#ffb24d]" /> },
  afternoon: { label: "Afternoon", icon: <Sun size={15} className="text-[#ff9d2f]" /> },
  evening: { label: "Evening", icon: <Moon size={15} className="text-[#ffd580]" /> },
};

function normalizeDayPlan(dayPlan: DayPlan[]) {
  return dayPlan.map((day, index) => ({
    ...day,
    day: index + 1,
    items: day.items
      .map((item) => ({ ...item, day: index + 1 }))
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
  }));
}

function slotBucket(slot: DayPlanItem["slot"]): VisibleSlot {
  if (slot === "morning") return "morning";
  if (slot === "evening") return "evening";
  return "afternoon";
}

function autoArrangeDayPlan(dayPlan: DayPlan[]) {
  const targetTimes: Record<VisibleSlot, { start: string; end: string }> = {
    morning: { start: "08:30", end: "10:00" },
    afternoon: { start: "13:30", end: "15:00" },
    evening: { start: "19:00", end: "20:30" },
  };

  return normalizeDayPlan(
    dayPlan.map((day) => {
      const lockedItems = day.items
        .filter((item) => isLockedItem(item) || isBookedItem(item))
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
      const flexibleItems = day.items
        .filter((item) => !isLockedItem(item) && !isBookedItem(item))
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

      const arrangedFlexible = flexibleItems.map((item, index) => {
        const preferredBucket =
          item.type === "restaurant"
            ? "evening"
            : visibleSlots[Math.min(index, visibleSlots.length - 1)];
        return {
          ...item,
          slot: preferredBucket,
          startTime: targetTimes[preferredBucket].start,
          endTime: targetTimes[preferredBucket].end,
        };
      });

      return {
        ...day,
        items: [...lockedItems, ...arrangedFlexible].sort((a, b) => a.startTime.localeCompare(b.startTime)),
      };
    }),
  );
}

function formatHeaderDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function formatFullDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", weekday: "short" });
}

function buildDayMetrics(day: DayPlan) {
  const totalMinutes = day.items.reduce((sum, item) => {
    const [startHour = 0, startMinute = 0] = item.startTime.split(":").map(Number);
    const [endHour = 0, endMinute = 0] = item.endTime.split(":").map(Number);
    const start = startHour * 60 + startMinute;
    const end = endHour * 60 + endMinute;
    return sum + Math.max(end - start, 0);
  }, 0);
  const budget = day.items.reduce((sum, item) => sum + (item.cost || 0), 0);
  const walkingKm = Math.max(1.6, Number((day.items.length * 1.35 + budget / 180).toFixed(1)));
  return {
    duration: `${Math.floor(totalMinutes / 60)}h ${String(totalMinutes % 60).padStart(2, "0")}m`,
    walkingKm: `${walkingKm.toFixed(1)} km`,
    budget: `$${Math.round(budget || 0)}`,
    activityCount: day.items.length,
  };
}

const storyMoodGlyph: Record<string, string> = {
  adventure: "?",
  romantic: "?",
  family: "?",
  luxury: "?",
  hidden_gems: "?",
  relaxed: "?",
  nightlife: "?",
  culture: "?",
  nature: "?",
  mixed: "?",
};

type StoryModalState = {
  day: CinematicStoryMode["days"][number];
  quote: string;
  imageUrl: string | null;
  musicLabel: string;
  musicUrl: string;
};

type MoveModalState = {
  item: DayPlanItem;
  sourceDay: number;
};

type DaySuggestion = {
  id: string;
  kind: "activity" | "trip" | "event" | "restaurant";
  title: string;
  imageUrl?: string;
  price?: number;
  duration?: string;
  reason: string;
  destinationLabel?: string;
  source: ActivityRecommendation | RestaurantRecommendation | HiddenGemResult;
};

function getDayDestinationLabel(day: DayPlan, fallback: string) {
  return day.items.find((item) => item.destinationLabel)?.destinationLabel || fallback;
}

function getStoryQuote(day: CinematicStoryMode["days"][number]) {
  return day.storyLine || day.practicalSummary || day.cinematicTitle;
}

function getMoodPlaylist(day: CinematicStoryMode["days"][number]) {
  const moodMap: Record<string, string> = {
    adventure: "cinematic adventure travel",
    romantic: "cinematic romantic travel",
    family: "warm family travel",
    luxury: "luxury lounge travel",
    hidden_gems: "indie hidden gems travel",
    relaxed: "calm sunset travel",
    nightlife: "city nightlife cinematic",
    culture: "world culture cinematic",
    nature: "nature ambient travel",
    mixed: "cinematic travel soundtrack",
  };
  const moodQuery = moodMap[day.mood] || moodMap.mixed;
  const destination = [day.city, day.country].filter(Boolean).join(" ");
  const query = encodeURIComponent(`${destination} ${moodQuery}`.trim());
  return {
    label: `${day.city || "Trip"} ${day.mood.replaceAll("_", " ")}`,
    url: `https://open.spotify.com/search/${query}`,
  };
}

function resolveStoryImage(
  storyDay: CinematicStoryMode["days"][number],
  payload: RecommendationPayload,
) {
  if (storyDay.imageUrl) return storyDay.imageUrl;
  const destinationText = [storyDay.city, storyDay.country].filter(Boolean).join(", ");
  const match = payload.dayPlan.find((day) => day.day === storyDay.dayNumber);
  const imageFromDay = match?.items.find((item) => item.imageUrl)?.imageUrl;
  if (imageFromDay) return imageFromDay;
  const fromSelected = [
    payload.selected.hotel?.imageUrl,
    payload.selected.flight?.imageUrl,
    payload.selected.restaurant?.imageUrl,
    ...payload.selected.activities.map((item) => item.imageUrl),
    ...payload.selected.hiddenGems.map((item) => item.imageUrl),
  ].find(Boolean);
  if (fromSelected) return fromSelected || null;
  const destinationMatch = payload.dayPlan
    .flatMap((day) => day.items)
    .find((item) => destinationText && item.destinationLabel === destinationText && item.imageUrl)?.imageUrl;
  return destinationMatch || null;
}

function isLockedItem(item: DayPlanItem) {
  return item.type === "flight" || item.type === "hotel";
}

function isBookedItem(item: DayPlanItem) {
  return Boolean(item.deepLink || item.affiliateUrl);
}

function evaluateMoveRisk(
  item: DayPlanItem,
  sourceDay: DayPlan,
  targetDay: DayPlan,
  openBudget: boolean,
) {
  if (item.type === "flight") {
    return { allowed: false, message: "Flights stay locked to their booked travel day." };
  }
  if (item.type === "hotel") {
    return { allowed: false, message: "Hotel check-in and check-out stay locked to their original day." };
  }
  if (item.destinationLabel && targetDay.items.some((entry) => entry.destinationLabel) && getDayDestinationLabel(targetDay, "") !== item.destinationLabel) {
    return { allowed: false, message: "This stop belongs to a different destination day." };
  }
  if (isBookedItem(item)) {
    return { allowed: true, requiresConfirmation: true, message: "This looks like a fixed booking. Moving it may break the original reservation timing." };
  }
  if (item.type === "restaurant" && targetDay.items.some((entry) => entry.type === "restaurant")) {
    return { allowed: true, requiresConfirmation: true, message: "This day already has a meal stop. Double-check the timing before moving it." };
  }
  if (!openBudget) {
    const targetBudget = targetDay.items.reduce((sum, entry) => sum + Number(entry.cost || 0), 0) + Number(item.cost || 0);
    const sourceBudget = sourceDay.items.reduce((sum, entry) => sum + Number(entry.cost || 0), 0);
    if (targetBudget > Math.max(sourceBudget * 1.6, 220)) {
      return { allowed: true, requiresConfirmation: true, message: "Moving this item will make that day noticeably heavier on budget." };
    }
  }
  return { allowed: true as const };
}

function buildSuggestionPool(payload: RecommendationPayload, day: DayPlan): DaySuggestion[] {
  const destinationLabel = getDayDestinationLabel(day, payload.inputs.destination);
  const matchDestination = (label?: string) => {
    if (!label) return !payload.inputs.destinations?.length;
    return label === destinationLabel || label.includes(destinationLabel) || destinationLabel.includes(label);
  };

  const mapActivityKind = (item: ActivityRecommendation): DaySuggestion["kind"] =>
    item.categoryLabel?.toLowerCase().includes("tour") ? "trip" : "activity";

  const mapHiddenGemKind = (item: HiddenGemResult): DaySuggestion["kind"] => {
    if (item.category === "local_event") return "event";
    if (item.category === "local_activity") return "trip";
    return "activity";
  };

  const suggestions: DaySuggestion[] = [
    ...payload.groups.activities
      .filter((item) => matchDestination(item.destinationLabel || item.locationLabel))
      .slice(0, 3)
      .map<DaySuggestion>((item) => ({
        id: `activity-${item.id}`,
        kind: mapActivityKind(item),
        title: item.name,
        imageUrl: item.imageUrl,
        price: item.price,
        duration: item.duration,
        reason: item.aiReason,
        destinationLabel: item.destinationLabel || item.locationLabel,
        source: item,
      })),
    ...payload.groups.restaurants
      .filter((item) => matchDestination(item.destinationLabel || item.locationLabel))
      .slice(0, 2)
      .map<DaySuggestion>((item) => ({
        id: `restaurant-${item.id}`,
        kind: "restaurant",
        title: item.name,
        imageUrl: item.imageUrl,
        price: item.pricePerPerson,
        duration: item.mealWindow,
        reason: item.aiReason,
        destinationLabel: item.destinationLabel || item.locationLabel,
        source: item,
      })),
    ...payload.groups.hiddenGems
      .filter((item) => matchDestination(item.destinationLabel || item.destination))
      .slice(0, 3)
      .map<DaySuggestion>((item) => ({
        id: `hidden-${item.id}`,
        kind: mapHiddenGemKind(item),
        title: item.title,
        imageUrl: item.imageUrl,
        price: item.priceFrom,
        duration: item.duration,
        reason: item.aiReason,
        destinationLabel: item.destinationLabel || item.destination,
        source: item,
      })),
  ];

  const existingTitles = new Set(day.items.map((item) => item.title.toLowerCase()));
  return suggestions.filter((item) => !existingTitles.has(item.title.toLowerCase())).slice(0, 6);
}

function mapSuggestionToDayItem(
  suggestion: DaySuggestion,
  dayNumber: number,
  slot: VisibleSlot,
): Omit<DayPlanItem, "day" | "bufferMinutes"> {
  const defaultTimes: Record<VisibleSlot, { start: string; end: string }> = {
    morning: { start: "09:30", end: "11:00" },
    afternoon: { start: "14:30", end: "16:00" },
    evening: { start: "19:30", end: "21:00" },
  };
  const type =
    suggestion.kind === "restaurant"
      ? "restaurant"
      : suggestion.kind === "event"
      ? "hidden_gem"
      : "activity";
  return {
    id: `suggestion-${dayNumber}-${slot}-${Date.now()}-${suggestion.id}`,
    slot,
    type,
    title: suggestion.title,
    description: suggestion.reason,
    location: suggestion.destinationLabel,
    imageUrl: suggestion.imageUrl,
    deepLink: (suggestion.source as HiddenGemResult).sourceUrl || suggestion.source.deepLink || null,
    affiliateUrl: suggestion.source.affiliateUrl || null,
    provider: suggestion.source.provider,
    startTime: defaultTimes[slot].start,
    endTime: defaultTimes[slot].end,
    cost: suggestion.price || 0,
    destinationLabel: suggestion.destinationLabel,
  };
}

function pickSuggestionSlot(kind: DaySuggestion["kind"]): VisibleSlot {
  if (kind === "restaurant") return "evening";
  if (kind === "event") return "evening";
  return "afternoon";
}

function StoryDayCard({
  day,
  active,
  onClick,
}: {
  day: CinematicStoryMode["days"][number];
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative h-[394px] min-w-[184px] max-w-[184px] overflow-hidden rounded-[14px] border text-left transition duration-300 hover:-translate-y-1 ${
        active
          ? "border-[#ff7a00]/55 shadow-[0_0_30px_rgba(255,122,0,0.12)]"
          : "border-white/10 hover:border-[#ff7a00]/30"
      }`}
    >
      {day.imageUrl ? (
        <Image src={day.imageUrl} alt={day.cinematicTitle} fill className="object-cover transition duration-500 group-hover:scale-[1.03]" />
      ) : null}
      <div className={`absolute inset-0 ${day.imageUrl ? "bg-[linear-gradient(180deg,rgba(0,0,0,0.02),rgba(0,0,0,0.14)_34%,rgba(0,0,0,0.72)_72%,rgba(0,0,0,0.98))]" : "bg-[radial-gradient(circle_at_top,rgba(255,122,0,0.14),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(0,0,0,0.94))]"}`} />
      <div className="absolute inset-x-0 bottom-0 h-[48%] bg-[linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,0.92))]" />
      <div className="relative flex h-full flex-col justify-between p-4">
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="text-[17px] font-medium leading-none text-white">Day {day.dayNumber}</div>
            <div className="text-[18px] text-[#ffcf8f]">{storyMoodGlyph[day.mood] ?? "?"}</div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-[14px] font-medium leading-6 text-white">
            {[day.city, day.country].filter(Boolean).join(", ")}
          </div>
        </div>
      </div>
    </button>
  );
}

function ItemIcon({ type }: { type: DayPlanItem["type"] }) {
  if (type === "hotel") return <Hotel size={16} className="text-[#c78cff]" />;
  if (type === "flight") return <Plane size={16} className="text-[#5ca7ff]" />;
  if (type === "restaurant") return <UtensilsCrossed size={16} className="text-[#8dd46b]" />;
  return <Sparkles size={16} className="text-[#ff9d2f]" />;
}

function DayPlanItemCard({
  item,
  dayNumber,
  totalDays,
  onRemoveItem,
  onUpdateItem,
  onOpenMove,
}: {
  item: DayPlanItem;
  dayNumber: number;
  totalDays: number;
  onRemoveItem: (itemId: string) => void;
  onUpdateItem: (itemId: string, patch: Partial<DayPlanItem>) => void;
  onOpenMove: (item: DayPlanItem, sourceDay: number) => void;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(0,0,0,0.16))] p-3 shadow-[0_12px_36px_rgba(0,0,0,0.24)]">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border border-white/10 bg-black/30">
          <ItemIcon type={item.type} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-base font-medium text-white">{item.title}</div>
          <div className="mt-1 text-sm leading-5 text-white/56">{item.description}</div>
          {item.crowdLevel ? (
            <div className="mt-2 text-xs leading-5 text-white/66">
              Crowd: <span className="text-[#ffb36c] capitalize">{item.crowdLevel}</span>
              {typeof item.estimatedWaitMinutes === "number" ? ` • Wait ~${item.estimatedWaitMinutes}m` : ""}
              {item.bestVisitHours?.length ? ` • Best ${item.bestVisitHours.slice(0, 2).join(", ")}` : ""}
            </div>
          ) : null}
          {item.crowdNote ? <div className="mt-1 text-xs leading-5 text-white/52">{item.crowdNote}</div> : null}
          <div className="mt-2 text-sm text-white/72">
            {Math.max(
              15,
              (() => {
                const [startHour = 0, startMinute = 0] = item.startTime.split(":").map(Number);
                const [endHour = 0, endMinute = 0] = item.endTime.split(":").map(Number);
                return endHour * 60 + endMinute - (startHour * 60 + startMinute);
              })(),
            )}m
            {item.cost ? ` • $${Math.round(item.cost)}` : " • Included"}
          </div>
        </div>
        <button type="button" onClick={() => setEditing((current) => !current)} className="rounded-full p-1.5 text-white/65 transition hover:bg-white/10 hover:text-white">
          <GripVertical size={15} />
        </button>
      </div>

      {editing ? (
        <div className="mt-3 grid gap-2 rounded-[16px] border border-white/10 bg-black/24 p-3">
          <input
            value={item.title}
            onChange={(event) => onUpdateItem(item.id, { title: event.target.value })}
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-[#ff7a00]"
          />
          <textarea
            value={item.description}
            onChange={(event) => onUpdateItem(item.id, { description: event.target.value })}
            className="min-h-[72px] rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-[#ff7a00]"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              value={item.startTime}
              onChange={(event) => onUpdateItem(item.id, { startTime: event.target.value })}
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-[#ff7a00]"
            />
            <input
              value={item.endTime}
              onChange={(event) => onUpdateItem(item.id, { endTime: event.target.value })}
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-[#ff7a00]"
            />
          </div>
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setEditing((current) => !current)}
          className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/74 transition hover:bg-white/10"
        >
          <span className="inline-flex items-center gap-2">
            <Pencil size={12} />
            Edit
          </span>
        </button>
        <button
          type="button"
          onClick={() => onOpenMove(item, dayNumber)}
          className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/74 transition hover:bg-white/10"
        >
          <span className="inline-flex items-center gap-2">
            <GripVertical size={12} />
            Move
          </span>
        </button>
        <button
          type="button"
          onClick={() => onRemoveItem(item.id)}
          className="rounded-full border border-[#ff7a00]/18 bg-[#ff7a00]/8 px-3 py-1.5 text-xs text-[#ffb36c] transition hover:bg-[#ff7a00]/14"
        >
          <span className="inline-flex items-center gap-2">
            <Trash2 size={12} />
            Remove
          </span>
        </button>
      </div>
    </div>
  );
}

function DayColumn({
  slot,
  items,
  dayNumber,
  totalDays,
  onRemoveItem,
  onUpdateItem,
  onAddItem,
  onOpenMove,
}: {
  slot: VisibleSlot;
  items: DayPlanItem[];
  dayNumber: number;
  totalDays: number;
  onRemoveItem: (itemId: string) => void;
  onUpdateItem: (itemId: string, patch: Partial<DayPlanItem>) => void;
  onAddItem: (dayNumber: number, slot: VisibleSlot) => void;
  onOpenMove: (item: DayPlanItem, sourceDay: number) => void;
}) {
  return (
    <div className="border-t border-white/8 p-4 first:border-t-0 xl:border-l xl:border-t-0 xl:first:border-l-0">
      <div className="flex items-center gap-2 text-base font-medium text-white">
        {slotMeta[slot].icon}
        {slotMeta[slot].label}
      </div>
      <div className="mt-5 space-y-4">
        {items.length ? (
          items.map((item) => (
            <div key={item.id} className="grid grid-cols-[54px_1fr] gap-3">
              <div className="pt-2 text-xs text-white/60">{item.startTime}</div>
              <div className="relative">
                <div className="absolute left-[-14px] top-3 h-full border-l border-dashed border-[#ff7a00]/45" />
                <div className="absolute left-[-18px] top-2 h-2.5 w-2.5 rounded-full bg-[#ff9d2f]" />
                <DayPlanItemCard
                  item={item}
                  dayNumber={dayNumber}
                  totalDays={totalDays}
                  onRemoveItem={onRemoveItem}
                  onUpdateItem={onUpdateItem}
                  onOpenMove={onOpenMove}
                />
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-[18px] border border-dashed border-white/10 bg-black/18 p-4 text-sm text-white/45">
            Open block for a lighter pace.
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => onAddItem(dayNumber, slot)}
        className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[#ff9d4d] transition hover:text-[#ffc07c]"
      >
        <Plus size={14} />
        Add Item
      </button>
    </div>
  );
}

function OverlayModal({
  open,
  title,
  subtitle,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/72 px-4 py-6 backdrop-blur-md">
      <div className="w-full max-w-4xl overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(0,0,0,0.3))] shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div>
            <div className="text-xl font-semibold text-white">{title}</div>
            {subtitle ? <div className="mt-1 text-sm text-white/58">{subtitle}</div> : null}
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-white/10 bg-white/5 p-2 text-white/72 transition hover:bg-white/10 hover:text-white">
            <X size={16} />
          </button>
        </div>
        <div className="max-h-[78vh] overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

export default function DayByDayWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get("planId");
  const [payload, setPayload] = useState<RecommendationPayload | null>(null);
  const [note, setNote] = useState("Review, customize and perfect your trip");
  const [savePulse, setSavePulse] = useState<"idle" | "saved">("idle");
  const [swapMode, setSwapMode] = useState(true);
  const [activeDay, setActiveDay] = useState(1);
  const [dayWindowStart, setDayWindowStart] = useState(0);
  const [expandedDays, setExpandedDays] = useState<Record<number, boolean>>({});
  const [cinematicStory, setCinematicStory] = useState<CinematicStoryMode | null>(null);
  const [storyCanScrollLeft, setStoryCanScrollLeft] = useState(false);
  const [storyCanScrollRight, setStoryCanScrollRight] = useState(false);
  const [storyModal, setStoryModal] = useState<StoryModalState | null>(null);
  const [moveModal, setMoveModal] = useState<MoveModalState | null>(null);
  const [moveRiskMessage, setMoveRiskMessage] = useState<string | null>(null);
  const [suggestionDay, setSuggestionDay] = useState<number | null>(null);
  const daySectionRefs = useRef<Record<number, HTMLElement | null>>({});
  const storyScrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("gene-recommendation-payload");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as RecommendationPayload;
      setPayload(parsed);
      setCinematicStory(parsed.cinematicStory ?? buildCinematicStoryModeFromPayload(parsed));
      setExpandedDays(
        Object.fromEntries((parsed.dayPlan || []).map((day) => [day.day, true])),
      );
    } catch {
      setPayload(null);
    }
  }, []);

  useEffect(() => {
    if (!payload) return;
    sessionStorage.setItem("gene-recommendation-payload", JSON.stringify(payload));
  }, [payload]);

  useEffect(() => {
    if (!payload) return;
    if (cinematicStory) return;
    setCinematicStory(buildCinematicStoryModeFromPayload(payload));
  }, [payload, cinematicStory]);

  useEffect(() => {
    const node = storyScrollerRef.current;
    if (!node) return;

    const syncStoryScrollState = () => {
      const maxScroll = node.scrollWidth - node.clientWidth;
      setStoryCanScrollLeft(node.scrollLeft > 8);
      setStoryCanScrollRight(maxScroll - node.scrollLeft > 8);
    };

    syncStoryScrollState();
    node.addEventListener("scroll", syncStoryScrollState);
    window.addEventListener("resize", syncStoryScrollState);
    return () => {
      node.removeEventListener("scroll", syncStoryScrollState);
      window.removeEventListener("resize", syncStoryScrollState);
    };
  }, [cinematicStory]);

  const dayPlan = payload?.dayPlan ?? [];
  const totalDays = dayPlan.length;
  const visibleDayTabs = dayPlan.slice(dayWindowStart, dayWindowStart + 6);
  const tripRoute = useMemo(() => {
    if (!payload) return "";
    const destinations = payload.inputs.destinations?.length
      ? payload.inputs.destinations.map((item) => `${item.city}, ${item.country}`)
      : [payload.inputs.destination];
    return destinations.join("  →  ");
  }, [payload]);

  useEffect(() => {
    if (!dayPlan.length) return;
    const maxStart = Math.max(dayPlan.length - 6, 0);
    setDayWindowStart((current) => Math.min(current, maxStart));
  }, [dayPlan.length]);

  useEffect(() => {
    if (!dayPlan.length) return;
    const activeIndex = dayPlan.findIndex((day) => day.day === activeDay);
    if (activeIndex < 0) return;
    if (activeIndex < dayWindowStart) {
      setDayWindowStart(activeIndex);
    } else if (activeIndex > dayWindowStart + 5) {
      setDayWindowStart(Math.max(activeIndex - 5, 0));
    }
  }, [activeDay, dayPlan, dayWindowStart]);

  function updateDayPlan(nextDayPlan: DayPlan[]) {
    setPayload((current) => (current ? { ...current, dayPlan: normalizeDayPlan(nextDayPlan) } : current));
  }

  function moveItem(itemId: string, targetDay: number) {
    if (!payload) return;
    updateDayPlan(moveItineraryItem(payload.dayPlan, itemId, targetDay));
    setNote("Item moved. Gene kept the rest of the sequence stable.");
  }

  function removeItem(itemId: string) {
    if (!payload) return;
    updateDayPlan(removeItineraryItem(payload.dayPlan, itemId));
    setNote("Item removed from the plan.");
  }

  function patchItem(itemId: string, patch: Partial<DayPlanItem>) {
    if (!payload) return;
    updateDayPlan(updateItineraryItem(payload.dayPlan, { id: itemId, ...patch }));
  }

  function addItem(dayNumber: number, slot: VisibleSlot) {
    if (!payload) return;
    const seededActivity = payload.selected.activities[0];
    const times: Record<VisibleSlot, { start: string; end: string }> = {
      morning: { start: "08:00", end: "09:00" },
      afternoon: { start: "13:00", end: "14:00" },
      evening: { start: "19:00", end: "20:00" },
    };
    updateDayPlan(
      addItineraryItem(payload.dayPlan, dayNumber, {
        id: `manual-${dayNumber}-${slot}-${Date.now()}`,
        slot: slot === "afternoon" ? "afternoon" : slot,
        type: "activity",
        title: seededActivity?.name || "Custom stop",
        description: seededActivity?.aiReason || "Manual stop added to the route.",
        startTime: times[slot].start,
        endTime: times[slot].end,
        imageUrl: seededActivity?.imageUrl,
        location: seededActivity?.locationLabel || payload.inputs.destination,
        cost: seededActivity?.price || 0,
        destinationLabel: payload.inputs.destination,
        deepLink: null,
      }),
    );
    setNote("A new item was added into the selected day block.");
  }

  function autoArrange() {
    if (!payload) return;
    updateDayPlan(autoArrangeDayPlan(payload.dayPlan));
    setNote("Gene rearranged flexible items only. Flights, hotels, and fixed bookings stayed locked.");
  }

  function saveArrangement() {
    if (!payload) return;
    const nextPayload = cinematicStory ? { ...payload, cinematicStory } : payload;
    setPayload(nextPayload);
    sessionStorage.setItem("gene-recommendation-payload", JSON.stringify(nextPayload));
    setSavePulse("saved");
    setNote("Arrangement saved. You can continue to analysis when ready.");
    window.setTimeout(() => setSavePulse("idle"), 1400);
  }

  function continueToAnalysis() {
    if (!payload) return;
    const nextPayload = cinematicStory ? { ...payload, cinematicStory } : payload;
    setPayload(nextPayload);
    sessionStorage.setItem("gene-recommendation-payload", JSON.stringify(nextPayload));
    router.push(`/ai/analysis?planId=${payload.planId || planId || ""}`);
  }

  function openStoryDay(day: CinematicStoryMode["days"][number]) {
    if (!payload) return;
    const playlist = getMoodPlaylist(day);
    setStoryModal({
      day,
      quote: getStoryQuote(day),
      imageUrl: resolveStoryImage(day, payload),
      musicLabel: playlist.label,
      musicUrl: playlist.url,
    });
    setActiveDay(day.dayNumber);
  }

  async function copyStory() {
    if (!cinematicStory) return;
    const body = [
      cinematicStory.tripTitle,
      cinematicStory.intro,
      ...cinematicStory.days.map(
        (day) =>
          `Day ${day.dayNumber} — ${[day.city, day.country].filter(Boolean).join(", ")}\n${day.cinematicTitle}\n${day.storyLine}\n${day.practicalSummary}`,
      ),
      cinematicStory.endingLine,
      cinematicStory.shareCaption,
    ].join("\n\n");

    try {
      await navigator.clipboard.writeText(body);
      setNote("Story copied. You can drop it straight into a share post.");
    } catch {
      setNote("Copy was blocked here, but the story is ready to share.");
    }
  }

  async function shareStory() {
    if (!cinematicStory) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: cinematicStory.tripTitle,
          text: cinematicStory.shareCaption,
        });
        setNote("Story shared.");
        return;
      }
      await copyStory();
    } catch {
      setNote("Share was canceled. Your story is still ready.");
    }
  }

  function playStory() {
    if (!cinematicStory?.days.length) return;
    let index = 0;
    const ordered = cinematicStory.days;
    scrollToDay(ordered[0].dayNumber);
    const interval = window.setInterval(() => {
      index += 1;
      if (index >= ordered.length) {
        window.clearInterval(interval);
        return;
      }
      scrollToDay(ordered[index].dayNumber);
    }, 1100);
    setNote("Playing the trip story through your itinerary.");
  }

  function nudgeStoryRow(direction: "left" | "right") {
    const node = storyScrollerRef.current;
    if (!node) return;
    node.scrollBy({
      left: direction === "left" ? -220 : 220,
      behavior: "smooth",
    });
  }

  function scrollToDay(dayNumber: number) {
    setActiveDay(dayNumber);
    const target = daySectionRefs.current[dayNumber];
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleShareStory() {
    if (!cinematicStory) return;
    const activeStoryDay = cinematicStory.days.find((day) => day.dayNumber === activeDay) || cinematicStory.days[0];
    const shareUrl = `${window.location.origin}/ai/day-by-day?planId=${payload?.planId || planId || ""}#story-day-${activeStoryDay?.dayNumber || 1}`;
    const quote = activeStoryDay ? getStoryQuote(activeStoryDay) : cinematicStory.shareCaption;
    const shareBody = [
      cinematicStory.tripTitle,
      [activeStoryDay?.city, activeStoryDay?.country].filter(Boolean).join(", "),
      `Day ${activeStoryDay?.dayNumber || 1}`,
      quote,
      shareUrl,
    ]
      .filter(Boolean)
      .join("\n");
    try {
      if (navigator.share) {
        await navigator.share({
          title: cinematicStory.tripTitle,
          text: shareBody,
          url: shareUrl,
        });
        setNote("Story shared.");
        return;
      }
      await navigator.clipboard.writeText(shareBody);
      setNote("Story link copied.");
    } catch {
      setNote("Share was canceled. Your story is still ready.");
    }
  }

  function openMoveModal(item: DayPlanItem, sourceDay: number) {
    setMoveRiskMessage(null);
    setMoveModal({ item, sourceDay });
  }

  function confirmMove(targetDayNumber: number) {
    if (!payload || !moveModal) return;
    const sourceDay = payload.dayPlan.find((day) => day.day === moveModal.sourceDay);
    const targetDay = payload.dayPlan.find((day) => day.day === targetDayNumber);
    if (!sourceDay || !targetDay) return;
    const openBudget = Boolean((payload.inputs.fullInput as any)?.budget?.openBudget);
    const risk = evaluateMoveRisk(moveModal.item, sourceDay, targetDay, openBudget);
    if (!risk.allowed) {
      setMoveRiskMessage(risk.message || "This item cannot be moved to that day.");
      return;
    }
    const pendingMarker = `${targetDayNumber}:${risk.message || ""}`;
    if (risk.requiresConfirmation && moveRiskMessage !== pendingMarker) {
      setMoveRiskMessage(pendingMarker);
      return;
    }
    moveItem(moveModal.item.id, targetDayNumber);
    setMoveModal(null);
    setMoveRiskMessage(null);
  }

  function openSuggestions(dayNumber: number) {
    setSuggestionDay(dayNumber);
  }

  function addSuggestionToDay(suggestion: DaySuggestion) {
    if (!payload || suggestionDay == null) return;
    const slot = pickSuggestionSlot(suggestion.kind);
    updateDayPlan(addItineraryItem(payload.dayPlan, suggestionDay, mapSuggestionToDayItem(suggestion, suggestionDay, slot)));
    setSuggestionDay(null);
    setNote(`${suggestion.title} was added to Day ${suggestionDay}.`);
  }

  if (!payload) {
    return (
      <AiSuiteFrame activePage="dayByDay" planId={planId}>
        <section className="rounded-[34px] border border-white/10 bg-black/30 p-8 shadow-[0_28px_90px_rgba(0,0,0,0.38)] backdrop-blur-2xl">
          <div className="text-sm uppercase tracking-[0.2em] text-[#ffbf82]">Day by day</div>
          <h1 className="mt-4 text-[32px] font-semibold leading-tight text-white">There is no arranged trip in memory yet.</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/64">
            Start from the recommendation page first so Gene can bring your selected stay, transport, flights, and activities into the itinerary editor.
          </p>
          <Link href={planId ? `/ai/recommendation?planId=${planId}` : "/ai/recommendation"} className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-[#ff7a00] px-5 py-3 text-base font-semibold text-black">
            Return to recommendation
            <ArrowRight size={16} />
          </Link>
        </section>
      </AiSuiteFrame>
    );
  }

  const activeDayData = dayPlan.find((day) => day.day === activeDay) ?? dayPlan[0];
  const activeMetrics = activeDayData ? buildDayMetrics(activeDayData) : null;
  const suggestionOptions = activeDayData && payload ? buildSuggestionPool(payload, activeDayData) : [];

  return (
    <AiSuiteFrame activePage="dayByDay" planId={payload.planId || planId}>
      <section className="space-y-5">
        <div className="grid gap-5 xl:grid-cols-[1fr_auto] xl:items-start">
          <div>
            <h1 className="text-[34px] font-semibold leading-none text-white md:text-[40px]">Day by Day Plan <span className="text-[#ff9d4d]">✦</span></h1>
            <div className="mt-3 text-[15px] text-white/72 md:text-[16px]">{note}</div>
          </div>
          <div className="flex flex-wrap items-center gap-3 xl:justify-end">
            <div className="rounded-[18px] border border-white/10 bg-black/28 px-4 py-3 text-[13px] text-white/78">
              <div className="flex flex-wrap items-center gap-4">
                <span>{tripRoute}</span>
                <span className="text-white/42">|</span>
                <span>{formatHeaderDate(payload.inputs.startDate)} - {formatHeaderDate(payload.inputs.endDate)}</span>
                <span className="text-white/42">|</span>
                <span>{payload.inputs.adults || payload.inputs.travelersCount} Adults{payload.inputs.kids ? `, ${payload.inputs.kids} Child` : ""}</span>
              </div>
            </div>
            <Link href={`/ai-planner?planId=${payload.planId || planId || ""}`} className="rounded-[16px] border border-[#ff7a00]/40 bg-transparent px-5 py-3 text-[13px] font-medium text-[#ff9d4d] transition hover:bg-[#ff7a00]/10">
              Edit Trip
            </Link>
          </div>
        </div>

        <div className="grid gap-3 xl:grid-cols-[1.05fr_1fr_0.7fr_auto_auto]">
          <button type="button" onClick={autoArrange} className="rounded-[20px] border border-[#ff7a00]/40 bg-[radial-gradient(circle_at_center,rgba(255,122,0,0.2),rgba(255,122,0,0.08)_55%,transparent_80%)] px-4 py-3 text-left shadow-[0_0_24px_rgba(255,122,0,0.12)]">
            <div className="inline-flex items-center gap-2.5 text-[18px] font-medium text-[#ffb36c]">
              <WandSparkles size={16} />
              Auto-arrange with AI
            </div>
            <div className="mt-2 text-[13px] leading-5 text-white/62">
              AI will optimize timings, routes and sequencing for you.
            </div>
            <div className="mt-2 text-[12px] leading-5 text-[#ffcf9a]">
              Gene can rearrange flexible items only. Flights, hotels, and fixed bookings stay locked.
            </div>
          </button>

          <div className="rounded-[20px] border border-white/10 bg-black/24 px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2.5 text-[18px] font-medium text-white">
                  <GripVertical size={16} />
                  Move & Swap
                </div>
                <div className="mt-2 text-[13px] leading-5 text-white/62">
                  Move items between available days while Gene protects locked travel moments.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSwapMode((current) => !current)}
                aria-pressed={swapMode}
                className={`relative h-7 w-12 shrink-0 rounded-full border transition ${swapMode ? "border-[#ff7a00]/60 bg-[#ff7a00]" : "border-white/10 bg-white/10"}`}
              >
                <span className={`absolute top-[3px] left-[3px] h-5 w-5 rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.22)] transition-transform duration-200 ${swapMode ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 text-[13px] text-white/70 xl:justify-start">
            <span>View</span>
            <button type="button" className="inline-flex items-center gap-2 rounded-[14px] border border-white/10 bg-black/24 px-3.5 py-2.5 text-[13px] text-white">
              Timeline
              <ChevronDown size={14} />
            </button>
          </div>

          <div className="hidden xl:block" />
          <div className="hidden xl:block" />
        </div>

        <div className="rounded-[24px] border border-white/10 bg-black/24">
          <div className="flex items-stretch">
            <button
              type="button"
              onClick={() => setDayWindowStart((current) => Math.max(current - 1, 0))}
              disabled={dayWindowStart === 0}
              className="hidden w-12 items-center justify-center text-white/60 transition disabled:opacity-35 xl:flex"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="grid flex-1 grid-cols-6">
              {visibleDayTabs.map((day) => (
                <button
                  key={`day-tab-${day.day}`}
                  type="button"
                  onClick={() => scrollToDay(day.day)}
                  className={`border-l border-white/6 px-2 py-3 first:border-l-0 ${activeDay === day.day ? "bg-[radial-gradient(circle_at_center,rgba(255,122,0,0.16),rgba(255,122,0,0.04)_58%,transparent_80%)]" : ""}`}
                >
                  <div className={`mx-auto max-w-[112px] rounded-[16px] border px-2.5 py-2.5 transition ${activeDay === day.day ? "border-[#ff7a00]/45 bg-[#ff7a00]/08 text-white shadow-[0_0_24px_rgba(255,122,0,0.12)]" : "border-transparent text-white/74"}`}>
                    <div className="text-[16px] font-medium leading-none">Day {day.day}</div>
                    <div className={`mt-1.5 text-[11px] ${activeDay === day.day ? "text-[#ffb36c]" : "text-white/48"}`}>{formatHeaderDate(day.date)}</div>
                  </div>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setDayWindowStart((current) => Math.min(current + 1, Math.max(dayPlan.length - 6, 0)))}
              disabled={dayWindowStart >= Math.max(dayPlan.length - 6, 0)}
              className="hidden w-12 items-center justify-center text-white/60 transition disabled:opacity-35 xl:flex"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {cinematicStory ? (
          <section className="overflow-hidden rounded-[24px] border border-[#ff7a00]/34 bg-[linear-gradient(180deg,rgba(255,122,0,0.07),rgba(0,0,0,0.34))] px-5 py-4 shadow-[0_0_0_1px_rgba(255,122,0,0.08),0_24px_60px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="text-[20px] text-white">🎬</span>
                  <h2 className="text-[18px] font-medium text-white md:text-[20px]">Cinematic Story Mode</h2>
                  <span className="rounded-[8px] border border-[#ff7a00]/28 bg-[#ff7a00]/12 px-2 py-[3px] text-[11px] font-medium uppercase tracking-[0.08em] text-[#ffb36c]">
                    NEW
                  </span>
                </div>
                <div className="mt-1.5 pl-8 text-sm text-white/66">Your trip, told like a movie</div>
              </div>
              <div className="flex flex-wrap gap-2" />
            </div>

            <div className="relative mt-5">
              {storyCanScrollLeft ? (
                <button
                  type="button"
                  onClick={() => nudgeStoryRow("left")}
                  className="absolute left-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/70 text-white/78 shadow-[0_10px_30px_rgba(0,0,0,0.34)] backdrop-blur-md lg:flex"
                >
                  <ChevronLeft size={18} />
                </button>
              ) : null}
              {storyCanScrollRight ? (
                <button
                  type="button"
                  onClick={() => nudgeStoryRow("right")}
                  className="absolute right-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/70 text-white/78 shadow-[0_10px_30px_rgba(0,0,0,0.34)] backdrop-blur-md lg:flex"
                >
                  <ChevronRight size={18} />
                </button>
              ) : null}
              <div className="pointer-events-none absolute inset-y-0 left-0 z-[1] hidden w-20 bg-[linear-gradient(90deg,rgba(0,0,0,0.92),rgba(0,0,0,0.48),transparent)] lg:block" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-[1] hidden w-20 bg-[linear-gradient(270deg,rgba(0,0,0,0.92),rgba(0,0,0,0.48),transparent)] lg:block" />
              <div ref={storyScrollerRef} className="overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex min-w-max gap-[14px]">
                  {cinematicStory.days.map((day) => (
                    <StoryDayCard
                      key={`story-day-${day.dayNumber}`}
                      day={day}
                      active={day.dayNumber === activeDay}
                      onClick={() => openStoryDay(day)}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-[18px] bg-[linear-gradient(180deg,rgba(0,0,0,0.08),rgba(0,0,0,0.22))] px-3 py-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#ff7a00] bg-black/48 text-[#ffb36c] shadow-[0_0_18px_rgba(255,122,0,0.16)]">
                    <Sparkles size={18} />
                  </span>
                  <div className="text-[15px] text-white/84">Your journey, beautifully crafted.</div>
                </div>
                <div className="min-w-[220px] flex-1">
                  <div className="flex items-center gap-3 overflow-hidden">
                    {cinematicStory.days.map((day) => (
                      <div key={`story-progress-${day.dayNumber}`} className="flex flex-1 items-center gap-3">
                        <span className={`h-4 w-4 shrink-0 rounded-full border-2 ${day.dayNumber === activeDay ? "border-[#ff7a00] bg-[#ff7a00]/30 shadow-[0_0_14px_rgba(255,122,0,0.2)]" : "border-[#ff7a00]/80 bg-black/30"}`} />
                        <span className="h-px flex-1 bg-[linear-gradient(90deg,rgba(255,122,0,0.65),rgba(255,122,0,0.18),rgba(255,122,0,0.65))]" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={handleShareStory} className="inline-flex items-center gap-2 text-sm font-medium text-[#ff9d4d]">
                    Share Story
                    <Share2 size={14} />
                  </button>
                </div>
              </div>
              <div className="pointer-events-none mt-2 h-[2px] w-full rounded-full bg-[linear-gradient(90deg,rgba(255,122,0,0.14),rgba(255,122,0,0.6),rgba(255,122,0,0.14))]" />
              <div className="pointer-events-none mt-1 h-[12px] w-full bg-[radial-gradient(circle_at_4%_55%,rgba(255,122,0,0.9)_0_2px,transparent_3px),radial-gradient(circle_at_24%_42%,rgba(255,122,0,0.8)_0_1.5px,transparent_3px),radial-gradient(circle_at_44%_60%,rgba(255,122,0,0.85)_0_2px,transparent_3px),radial-gradient(circle_at_64%_46%,rgba(255,122,0,0.8)_0_1.5px,transparent_3px),radial-gradient(circle_at_84%_38%,rgba(255,122,0,0.85)_0_2px,transparent_3px)] opacity-75" />
            </div>
          </section>
        ) : null}

        <div className="space-y-4">
          {dayPlan.map((day) => {
            const metrics = buildDayMetrics(day);
            const expanded = expandedDays[day.day] ?? true;
            const slotItems = {
              morning: day.items.filter((item) => slotBucket(item.slot) === "morning"),
              afternoon: day.items.filter((item) => slotBucket(item.slot) === "afternoon"),
              evening: day.items.filter((item) => slotBucket(item.slot) === "evening"),
            };

            return (
              <section
                key={`day-${day.day}`}
                ref={(element) => {
                  daySectionRefs.current[day.day] = element;
                }}
                className="scroll-mt-6 overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(0,0,0,0.18))] shadow-[0_24px_70px_rgba(0,0,0,0.28)]"
              >
                <div className="border-b border-white/10 px-5 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#ff7a00]/18 bg-[#ff7a00]/08 text-[#ffb36c]">
                        <Sun size={16} />
                      </span>
                      <div className="text-[36px] font-medium leading-none text-white">Day {day.day}</div>
                      <div className="text-lg text-white/52">• {formatFullDate(day.date)} • {day.items.find((item) => item.destinationLabel)?.destinationLabel || payload.inputs.destination}</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-5 text-sm text-white/70">
                      <span>Est. Time <strong className="ml-2 text-white">{metrics.duration}</strong></span>
                      <span>Walk <strong className="ml-2 text-white">{metrics.walkingKm}</strong></span>
                      <span>Budget <strong className="ml-2 text-white">{metrics.budget}</strong></span>
                      <button
                        type="button"
                        onClick={() => openSuggestions(day.day)}
                        className="rounded-full border border-[#ff7a00]/30 bg-[#ff7a00]/10 px-3 py-1.5 text-xs font-medium text-[#ffb36c] transition hover:bg-[#ff7a00]/16"
                      >
                        AI Suggestions
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpandedDays((current) => ({ ...current, [day.day]: !expanded }))}
                        className="text-[#ffb36c]"
                      >
                        <ChevronDown size={16} className={`transition ${expanded ? "" : "-rotate-90"}`} />
                      </button>
                    </div>
                  </div>
                </div>

                {expanded ? (
                  <div className="grid xl:grid-cols-3">
                    <DayColumn
                      slot="morning"
                      items={slotItems.morning}
                      dayNumber={day.day}
                      totalDays={totalDays}
                      onRemoveItem={removeItem}
                      onUpdateItem={patchItem}
                      onAddItem={addItem}
                      onOpenMove={openMoveModal}
                    />
                    <DayColumn
                      slot="afternoon"
                      items={slotItems.afternoon}
                      dayNumber={day.day}
                      totalDays={totalDays}
                      onRemoveItem={removeItem}
                      onUpdateItem={patchItem}
                      onAddItem={addItem}
                      onOpenMove={openMoveModal}
                    />
                    <DayColumn
                      slot="evening"
                      items={slotItems.evening}
                      dayNumber={day.day}
                      totalDays={totalDays}
                      onRemoveItem={removeItem}
                      onUpdateItem={patchItem}
                      onAddItem={addItem}
                      onOpenMove={openMoveModal}
                    />
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>

        <div className="rounded-[28px] border border-[#ff7a00]/30 bg-[linear-gradient(180deg,rgba(255,122,0,0.12),rgba(0,0,0,0.18))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
          <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr_1fr_1fr_1fr_auto] xl:items-center">
            <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
              <div className="text-[34px] font-medium leading-none text-white">Day {activeDayData?.day} Summary</div>
              <div className="mt-2 text-base text-white/68">You are all set for a great day!</div>
              <button type="button" onClick={() => activeDayData && openSuggestions(activeDayData.day)} className="mt-4 rounded-full border border-[#ff7a00]/35 px-4 py-2 text-sm text-[#ffb36c]">AI Suggestions</button>
            </div>
            <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
              <div className="text-sm uppercase tracking-[0.16em] text-white/45">Total Time</div>
              <div className="mt-2 text-[34px] font-medium leading-none text-white">{activeMetrics?.duration}</div>
              <div className="mt-2 text-sm text-white/56">Good pace</div>
            </div>
            <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
              <div className="text-sm uppercase tracking-[0.16em] text-white/45">Walking</div>
              <div className="mt-2 text-[34px] font-medium leading-none text-white">{activeMetrics?.walkingKm}</div>
              <div className="mt-2 text-sm text-white/56">Moderate</div>
            </div>
            <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
              <div className="text-sm uppercase tracking-[0.16em] text-white/45">Activities</div>
              <div className="mt-2 text-[34px] font-medium leading-none text-white">{activeMetrics?.activityCount}</div>
              <div className="mt-2 text-sm text-white/56">Great mix</div>
            </div>
            <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
              <div className="text-sm uppercase tracking-[0.16em] text-white/45">Budget</div>
              <div className="mt-2 text-[34px] font-medium leading-none text-white">{activeMetrics?.budget}</div>
              <div className="mt-2 text-sm text-white/56">On track</div>
            </div>
            <button type="button" onClick={saveArrangement} className={`rounded-[20px] px-5 py-4 text-sm font-medium transition ${savePulse === "saved" ? "bg-[#ff7a00] text-black" : "border border-white/10 bg-black/22 text-white/84 hover:bg-white/10"}`}>
              {savePulse === "saved" ? "Saved" : "Save arrangement"}
            </button>
          </div>
        </div>

        <div className="rounded-[22px] border border-white/10 bg-black/24 p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#ff7a00]/18 bg-[#ff7a00]/08 text-[#ffb36c]">
                <Sparkles size={16} />
              </span>
              <div className="text-base text-white/74">
                <span className="mr-3 font-medium text-[#ffb36c]">Tip from AI</span>
                Start early to avoid crowds and keep the timing lighter through the busiest blocks.
              </div>
            </div>
            <button
              type="button"
              onClick={continueToAnalysis}
              className="inline-flex items-center justify-center gap-2 rounded-[16px] border border-[#ff7a00]/30 bg-[#ff7a00]/10 px-5 py-3 text-sm font-medium text-[#ffb36c]"
            >
              Continue to Analysis
              <ArrowRight size={15} />
            </button>
          </div>
        </div>

        <OverlayModal
          open={Boolean(storyModal)}
          title={storyModal?.day.cinematicTitle || "Cinematic Story"}
          subtitle={storyModal ? `Day ${storyModal.day.dayNumber} • ${[storyModal.day.city, storyModal.day.country].filter(Boolean).join(", ")}` : undefined}
          onClose={() => setStoryModal(null)}
        >
          {storyModal ? (
            <div className="grid gap-5 md:grid-cols-[1.05fr_0.95fr]">
              <div className="relative min-h-[320px] overflow-hidden rounded-[22px] border border-white/10 bg-black/30">
                {storyModal.imageUrl ? (
                  <Image src={storyModal.imageUrl} alt={storyModal.day.cinematicTitle} fill className="object-cover" />
                ) : null}
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.04),rgba(0,0,0,0.74))]" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <div className="rounded-[18px] border border-white/10 bg-black/38 p-4 backdrop-blur-md">
                    <div className="text-xs uppercase tracking-[0.16em] text-[#ffb36c]">AI Quote</div>
                    <p className="mt-3 text-lg leading-8 text-white/88">“{storyModal.quote}”</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="rounded-[22px] border border-white/10 bg-black/24 p-4">
                  <div className="text-sm font-medium text-white">Story mood</div>
                  <div className="mt-2 text-sm leading-6 text-white/62">
                    {storyModal.day.practicalSummary}
                  </div>
                </div>
                <div className="rounded-[22px] border border-white/10 bg-black/24 p-4">
                  <div className="text-sm font-medium text-white">Matching music</div>
                  <div className="mt-2 text-sm leading-6 text-white/62">
                    Open a mood-matched soundtrack for this stop.
                  </div>
                  <a
                    href={storyModal.musicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center gap-2 rounded-[14px] border border-[#ff7a00]/30 bg-[#ff7a00]/10 px-4 py-2.5 text-sm text-[#ffb36c]"
                  >
                    <ExternalLink size={14} />
                    {storyModal.musicLabel}
                  </a>
                </div>
                <div className="rounded-[22px] border border-white/10 bg-black/24 p-4">
                  <div className="text-sm font-medium text-white">Share this chapter</div>
                  <button type="button" onClick={handleShareStory} className="mt-4 inline-flex items-center gap-2 rounded-[14px] border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/80 transition hover:bg-white/10">
                    <Share2 size={14} />
                    Share Story
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </OverlayModal>

        <OverlayModal
          open={Boolean(moveModal)}
          title={moveModal ? `Move ${moveModal.item.title}` : "Move item"}
          subtitle="Choose the target day. Gene will protect locked travel moments and warn you before risky moves."
          onClose={() => {
            setMoveModal(null);
            setMoveRiskMessage(null);
          }}
        >
          {moveModal ? (
            <div className="space-y-4">
              {moveRiskMessage ? (
                <div className="rounded-[18px] border border-[#ff7a00]/22 bg-[#ff7a00]/10 p-4 text-sm text-[#ffcf99]">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                    <div>
                      {moveRiskMessage.includes(":") ? moveRiskMessage.split(":").slice(1).join(":") : moveRiskMessage}
                      {moveRiskMessage.includes(":") ? <div className="mt-2 text-white/58">Choose the same day again to confirm this risky move.</div> : null}
                    </div>
                  </div>
                </div>
              ) : null}
              <div className="grid gap-3 md:grid-cols-2">
                {dayPlan.map((day) => (
                  <button
                    key={`move-day-${day.day}`}
                    type="button"
                    onClick={() => confirmMove(day.day)}
                    className={`rounded-[18px] border px-4 py-4 text-left transition ${
                      day.day === moveModal.sourceDay
                        ? "border-[#ff7a00]/35 bg-[#ff7a00]/10 text-[#ffb36c]"
                        : "border-white/10 bg-black/22 text-white/84 hover:bg-white/8"
                    }`}
                  >
                    <div className="text-base font-medium">Day {day.day}</div>
                    <div className="mt-1 text-sm text-white/58">{getDayDestinationLabel(day, payload.inputs.destination)}</div>
                    <div className="mt-3 text-xs text-white/48">{day.items.length} timeline items</div>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </OverlayModal>

        <OverlayModal
          open={suggestionDay != null}
          title={suggestionDay != null ? `AI Suggestions for Day ${suggestionDay}` : "AI Suggestions"}
          subtitle={suggestionDay != null ? getDayDestinationLabel(dayPlan.find((day) => day.day === suggestionDay) || activeDayData, payload.inputs.destination) : undefined}
          onClose={() => setSuggestionDay(null)}
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {suggestionOptions.length ? (
              suggestionOptions.map((suggestion) => (
                <div key={suggestion.id} className="overflow-hidden rounded-[22px] border border-white/10 bg-black/24">
                  <div className="relative h-[180px]">
                    {suggestion.imageUrl ? <Image src={suggestion.imageUrl} alt={suggestion.title} fill className="object-cover" /> : null}
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08),rgba(0,0,0,0.7))]" />
                    <div className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/44 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-[#ffb36c]">
                      {suggestion.kind}
                    </div>
                  </div>
                  <div className="space-y-3 p-4">
                    <div>
                      <div className="text-base font-medium text-white">{suggestion.title}</div>
                      <div className="mt-1 text-xs text-white/48">{suggestion.destinationLabel || payload.inputs.destination}</div>
                    </div>
                    <div className="text-sm leading-6 text-white/62">{suggestion.reason}</div>
                    <div className="flex flex-wrap gap-2 text-xs text-white/58">
                      {suggestion.price ? <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">${Math.round(suggestion.price)}</span> : null}
                      {suggestion.duration ? <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{suggestion.duration}</span> : null}
                    </div>
                    <button type="button" onClick={() => addSuggestionToDay(suggestion)} className="inline-flex items-center gap-2 rounded-[14px] border border-[#ff7a00]/30 bg-[#ff7a00]/10 px-4 py-2.5 text-sm text-[#ffb36c]">
                      <Plus size={14} />
                      Add
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[20px] border border-dashed border-white/10 bg-black/20 p-5 text-sm text-white/58">
                Gene doesn’t have extra destination-specific suggestions for this day yet.
              </div>
            )}
          </div>
        </OverlayModal>
      </section>
    </AiSuiteFrame>
  );
}

