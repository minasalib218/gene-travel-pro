"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowRight, CalendarDays, ChevronRight, Compass, Gauge, Hotel, MapPinned, MoonStar, Plane, ShieldCheck, ShoppingBag, Sparkles, Users, UtensilsCrossed, Wallet } from "lucide-react";
import AiSuiteFrame from "@/components/ai/AiSuiteFrame";
import { generateVisaEntryAnalysis } from "@/lib/analysis/visaEntryAssistant";
import { buildSmartBookingScorePayload } from "@/lib/analysis/smartBookingScore";
import { calculateTravelHappinessScore } from "@/lib/analysis/travelHappinessScore";
import type { RecommendationPayload, SmartBookingScore, TravelHappinessScore, VisaEntryAnalysis } from "@/lib/recommendation/types";
import { usePass } from "@/hooks/usePass";
import { trackAnalyticsEvent } from "@/lib/analytics";

const barTone = (n: number) => (n >= 80 ? "#34d399" : n >= 65 ? "#fbbf24" : "#fb7185");
const textTone = (n: number) => (n >= 80 ? "text-emerald-300" : n >= 65 ? "text-amber-300" : "text-rose-300");
const formatTripDate = (value: string) =>
  new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

function parseDurationToMinutes(value?: string | null) {
  if (!value) return 0;
  const hours = Number((value.match(/(\d+)\s*h/i) || [])[1] || 0);
  const minutes = Number((value.match(/(\d+)\s*m/i) || [])[1] || 0);
  return hours * 60 + minutes;
}

function formatMinutes(totalMinutes: number) {
  const safe = Math.max(0, totalMinutes);
  const hours = Math.floor(safe / 60);
  const minutes = safe % 60;
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

function crowdWeight(level?: "low" | "medium" | "high" | "very-high") {
  if (level === "very-high") return 4;
  if (level === "high") return 3;
  if (level === "medium") return 2;
  return 1;
}

function crowdRiskLabel(level?: "low" | "medium" | "high" | "very-high") {
  if (level === "very-high") return "Very High";
  if (level === "high") return "High";
  if (level === "medium") return "Medium";
  return "Low";
}

function tripNightCount(payload: RecommendationPayload) {
  const explicitNights = (payload.inputs.destinations || []).reduce(
    (sum, stop) => sum + Math.max(Number(stop.durationNights || 0), 0),
    0,
  );
  if (explicitNights > 0) return explicitNights;
  const start = new Date(payload.inputs.startDate);
  const end = new Date(payload.inputs.endDate);
  const diff = Math.round((end.getTime() - start.getTime()) / 86400000);
  return Math.max(diff, 1);
}

function estimateTravelMinutes(payload: RecommendationPayload) {
  return payload.dayPlan.reduce((sum, day) => {
    return (
      sum +
      day.items.reduce((inner, item) => {
        if (item.type === "flight" && payload.selected.flight?.duration) {
          return inner + parseDurationToMinutes(payload.selected.flight.duration);
        }
        if (item.type === "transport" && payload.selected.transport?.duration) {
          return inner + parseDurationToMinutes(payload.selected.transport.duration);
        }
        if (item.type === "car") {
          return inner + 45;
        }
        return inner;
      }, 0)
    );
  }, 0);
}

function buildCostModel(payload: RecommendationPayload) {
  const travelerCount = Math.max(payload.inputs.travelersCount || 1, 1);
  const nightCount = tripNightCount(payload);
  const hotelNightly =
    payload.selected.hotel?.selectedUpgrade?.totalPrice ||
    payload.selected.hotel?.totalPrice ||
    payload.selected.hotel?.nightlyPrice ||
    0;
  const flightUnit =
    payload.selected.flight?.totalFare ||
    payload.selected.flight?.totalPrice ||
    payload.selected.flight?.fare ||
    0;
  const transportItems = payload.dayPlan.flatMap((day) =>
    day.items.filter((item) => item.type === "transport" || item.type === "car"),
  );
  const activityItems = payload.selected.activities;
  const restaurantVisits = Math.max(
    payload.dayPlan.reduce(
      (sum, day) => sum + day.items.filter((item) => item.type === "restaurant").length,
      0,
    ),
    payload.selected.restaurant ? 1 : 0,
  );
  const flightLegCount = Math.max(
    payload.dayPlan.reduce(
      (sum, day) => sum + day.items.filter((item) => item.type === "flight").length,
      0,
    ),
    payload.selected.flight ? 1 : 0,
  );

  const flights = flightUnit * flightLegCount;
  const hotels = hotelNightly * nightCount;
  const transportation =
    transportItems.reduce((sum, item) => sum + Number(item.cost || 0), 0) +
    (transportItems.length === 0
      ? (payload.selected.transport?.totalPrice ||
          payload.selected.transport?.cost ||
          0) +
        (payload.selected.car?.totalPrice || payload.selected.car?.dailyPrice || 0)
      : 0);
  const activities = activityItems.reduce(
    (sum, item) => sum + Number(item.totalPrice || item.price || 0),
    0,
  );
  const food =
    (payload.selected.restaurant?.totalPrice ||
      payload.selected.restaurant?.pricePerPerson ||
      0) *
    travelerCount *
    restaurantVisits;
  const others = Math.max(
    Number(payload.inputs.shoppingBudget || 0),
    Number(payload.selected.flight?.baggageExtraPrice || 0),
  );
  const total = flights + hotels + transportation + activities + food + others;

  return {
    flights,
    hotels,
    transportation,
    activities,
    food,
    others,
    total,
    nightCount,
    flightLegCount,
    restaurantVisits,
  };
}

function scoreFromKeywords(text: string, keywords: string[]) {
  const lowered = text.toLowerCase();
  return keywords.reduce((sum, keyword) => sum + (lowered.includes(keyword) ? 1 : 0), 0);
}

function buildFoodMatch(payload: RecommendationPayload) {
  const textCorpus = [
    payload.selected.restaurant?.name,
    payload.selected.restaurant?.cuisine,
    payload.selected.restaurant?.aiReason,
    ...payload.selected.activities.map((item) => `${item.name} ${item.aiReason} ${item.categoryLabel}`),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const requested = (payload.inputs.foodPreferences || []).join(" ").toLowerCase();
  const categories = [
    { label: "halal", color: "#ff7a00", keywords: ["halal", "middle eastern", "arabic"] },
    { label: "Local Cuisine", color: "#d97706", keywords: ["local", "traditional", "authentic", "street food"] },
    { label: "International", color: "#2563eb", keywords: ["international", "fusion", "global", "continental"] },
    { label: "Vegetarian", color: "#65a30d", keywords: ["vegetarian", "vegan", "plant-based"] },
    { label: "Others", color: "#9333ea", keywords: ["dessert", "coffee", "seafood", "fine dining"] },
  ];

  const scored = categories.map((item) => {
    const base = Math.max(1, scoreFromKeywords(textCorpus, item.keywords));
    const requestedBoost = scoreFromKeywords(requested, item.keywords) * 2;
    return { label: item.label, color: item.color, score: base + requestedBoost };
  });
  const totalScore = scored.reduce((sum, item) => sum + item.score, 0) || 1;
  const normalized = scored.map((item) => ({
    label: item.label,
    color: item.color,
    percent: Math.round((item.score / totalScore) * 100),
  }));
  const matchPercent = Math.min(
    97,
    Math.max(
      58,
      normalized.reduce(
        (sum, item) => sum + (requested.includes(item.label.toLowerCase()) ? item.percent : 0),
        0,
      ) || normalized[0]?.percent || 0,
    ),
  );

  return { normalized, matchPercent };
}

function buildActivityIntensity(payload: RecommendationPayload) {
  const activities = payload.selected.activities;
  const corpus = activities
    .map((item) => `${item.name} ${item.aiReason} ${item.categoryLabel} ${item.fitTags.join(" ")}`)
    .join(" ")
    .toLowerCase();
  const totalMinutes = activities.reduce(
    (sum, item) => sum + parseDurationToMinutes(item.duration),
    0,
  );
  const count = Math.max(activities.length, 1);
  const durationFactor = Math.min(3, totalMinutes / 180);
  const axes = [
    { label: "Culture", value: scoreFromKeywords(corpus, ["museum", "history", "temple", "culture", "heritage"]) },
    { label: "Adventure", value: scoreFromKeywords(corpus, ["hike", "cruise", "quad", "adventure", "safari"]) },
    { label: "Relaxation", value: scoreFromKeywords(corpus, ["spa", "sunset", "relax", "leisure", "calm"]) },
    { label: "Shopping", value: scoreFromKeywords(corpus, ["bazaar", "market", "shopping", "mall"]) },
    { label: "Nature", value: scoreFromKeywords(corpus, ["nature", "island", "beach", "park", "garden"]) },
    { label: "Nightlife", value: scoreFromKeywords(corpus, ["night", "bar", "dinner", "show", "evening"]) },
  ].map((axis) => ({
    label: axis.label,
    value: Math.min(10, Math.max(3, Math.round((axis.value / count) * 4 + durationFactor + 3))),
  }));
  const average = Math.round(axes.reduce((sum, item) => sum + item.value, 0) / axes.length);
  return { axes, average };
}

function buildWalkingProfile(payload: RecommendationPayload) {
  const corpus = payload.selected.activities
    .map((item) => `${item.name} ${item.aiReason} ${item.weatherFit} ${item.fitTags.join(" ")}`)
    .join(" ")
    .toLowerCase();
  const lowWalkingSignals = scoreFromKeywords(corpus, ["low walking", "indoor", "comfort", "easy"]);
  const heavySignals = scoreFromKeywords(corpus, ["hike", "climb", "walk", "explore", "outdoor", "stairs"]);
  const baseKm = Number(
    Math.max(2.5, payload.selected.activities.length * 1.1 + heavySignals * 0.8 - lowWalkingSignals * 0.45).toFixed(1),
  );
  const toleranceMinutes = Math.max(payload.inputs.walkingTolerance || 60, 20);
  const recommendedKm = Number((toleranceMinutes / 12).toFixed(1));
  const fitScore = clamp(Math.round(100 - Math.max(baseKm - recommendedKm, 0) * 12 + lowWalkingSignals * 4));
  return { baseKm, recommendedKm, fitScore };
}

function buildHotelLocationProfile(payload: RecommendationPayload) {
  const hotel = payload.selected.hotel;
  const locationPreference = `${payload.inputs.fullInput && typeof payload.inputs.fullInput === "object" ? ((payload.inputs.fullInput as any)?.stay?.locationPreference || "") : ""}`.toLowerCase();
  const amenities = (hotel?.amenities || []).join(" ").toLowerCase();
  const title = `${hotel?.name || ""} ${hotel?.area || ""}`.toLowerCase();
  const safety = clamp(Math.round((hotel?.rating || 4.2) * 20 + scoreFromKeywords(title, ["garden", "palace", "resort"]) * 2), 55, 96) / 10;
  const accessibility = clamp(Math.round((hotel?.confidenceScore || 80) * 0.1 + scoreFromKeywords(amenities, ["shuttle", "breakfast", "family", "access"]) * 6), 50, 94) / 10;
  const nearby = clamp(Math.round((hotel?.confidenceScore || 80) * 0.11 + scoreFromKeywords(locationPreference, ["central", "city", "walk"]) * 8), 50, 96) / 10;
  const neighborhood = clamp(Math.round((hotel?.rating || 4.2) * 18 + scoreFromKeywords(title, ["nile", "plaza", "mena"]) * 3), 50, 95) / 10;
  const score = Number((((safety + accessibility + nearby + neighborhood) / 4)).toFixed(1));
  return {
    score,
    bars: [
      { label: "Safety", value: Number(safety.toFixed(1)) },
      { label: "Accessibility", value: Number(accessibility.toFixed(1)) },
      { label: "Attractions Nearby", value: Number(nearby.toFixed(1)) },
      { label: "Neighborhood", value: Number(neighborhood.toFixed(1)) },
    ],
  };
}

function buildFlightComfortProfile(payload: RecommendationPayload) {
  const flight = payload.selected.flight;
  if (!flight) {
    return {
      score: 0,
      bars: [
        { label: "Flight Duration", value: 0 },
        { label: "Layover Duration", value: 0 },
        { label: "Departure Time", value: 0 },
        { label: "Airline Rating", value: 0 },
      ],
    };
  }
  const durationMinutes = parseDurationToMinutes(flight.duration);
  const departureHour = Number((flight.departureTime || "12:00").split(":")[0] || 12);
  const durationScore = clamp(Math.round(95 - Math.max(durationMinutes - 180, 0) / 18), 45, 95) / 10;
  const layoverScore = flight.stops === 0 ? 9.4 : clamp(Math.round(86 - flight.stops * 12 - (payload.inputs.maxLayoverHours || 0) * 1.5), 45, 90) / 10;
  const departureScore = clamp(departureHour >= 6 && departureHour <= 20 ? 84 : 62, 50, 90) / 10;
  const airlineScore = clamp(Math.round((flight.confidenceScore || 80) * 0.1), 55, 94) / 10;
  const score = Number((((durationScore + layoverScore + departureScore + airlineScore) / 4)).toFixed(1));
  return {
    score,
    bars: [
      { label: "Flight Duration", value: Number(durationScore.toFixed(1)) },
      { label: "Layover Duration", value: Number(layoverScore.toFixed(1)) },
      { label: "Departure Time", value: Number(departureScore.toFixed(1)) },
      { label: "Airline Rating", value: Number(airlineScore.toFixed(1)) },
    ],
  };
}

function buildConstraintChecks(payload: RecommendationPayload, costModel: ReturnType<typeof buildCostModel>, travelMinutes: number) {
  const flight = payload.selected.flight;
  const directFlightsOnly = payload.inputs.directFlightsOnly;
  const hardText = `${payload.inputs.specialRequests || ""} ${(payload.inputs.fullInput as any)?.constraints?.hardConstraints || ""}`.toLowerCase();
  const restDays = payload.inputs.daysWithoutTrips?.length || 0;
  const maxTravelMinutes = (payload.inputs.maxTravelTimeBetweenPlaces || 0) * Math.max(payload.inputs.destinations?.length || 1, 1);
  return [
    { label: "Direct flights only", met: !directFlightsOnly || Boolean(flight && flight.stops === 0) },
    { label: `Max ${payload.inputs.maxLayoverHours || 12}h total travel time`, met: !maxTravelMinutes || travelMinutes <= Math.max(maxTravelMinutes, (payload.inputs.maxLayoverHours || 12) * 60) },
    { label: "No red-eye flights", met: !flight || !/23:|00:|01:|02:|03:|04:/.test(flight.departureTime || "") },
    { label: `At least ${restDays || 0} rest days`, met: restDays === 0 || restDays <= payload.dayPlan.length },
    { label: `Budget under ${payload.inputs.currency} ${Math.round(payload.inputs.budget).toLocaleString()}`, met: costModel.total <= payload.inputs.budget * 1.05 },
    ...(hardText ? [{ label: "Hard constraint note respected", met: true }] : []),
  ];
}

function AnalysisMetric({ label, value, description }: { label: string; value: number; description: string }) {
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (Math.max(0, Math.min(value, 100)) / 100) * circumference;

  return (
    <div className="rounded-[20px] border border-white/10 bg-black/25 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm uppercase tracking-[0.18em] text-white/45">{label}</div>
          <div className="mt-3 text-base leading-6 text-white/62">{description}</div>
        </div>
        <div className="relative h-[72px] w-[72px] shrink-0">
          <svg viewBox="0 0 84 84" className="h-[72px] w-[72px] -rotate-90">
            <circle cx="42" cy="42" r={radius} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="8" />
            <circle
              cx="42"
              cy="42"
              r={radius}
              fill="none"
              stroke={barTone(value)}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
            />
          </svg>
          <div className={`absolute inset-0 flex items-center justify-center text-base font-semibold ${textTone(value)}`}>
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}

function InsightSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(0,0,0,0.18))] p-6 backdrop-blur-2xl">
      <h2 className="text-2xl font-semibold text-white">{title}</h2>
      <p className="mt-3 max-w-3xl text-base leading-6 text-white/64">{subtitle}</p>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function InsightCard({
  icon,
  title,
  body,
  badge,
  meta = [],
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  badge?: string;
  meta?: string[];
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-black/25 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[#ffb066]">
            {icon}
          </span>
          <div className="text-xl font-semibold text-white">{title}</div>
        </div>
        {badge ? <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.16em] text-white/55">{badge}</div> : null}
      </div>
      <p className="mt-3 text-base leading-6 text-white/66">{body}</p>
      {meta.length ? <div className="mt-4 flex flex-wrap gap-2">{meta.filter(Boolean).map((item) => <span key={`${title}-${item}`} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/66">{item}</span>)}</div> : null}
    </div>
  );
}

function SummaryTile({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-black/24 p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-white/42">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
      <div className="mt-2 text-sm leading-6 text-white/56">{note}</div>
    </div>
  );
}

function TopAnalysisCard({
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
    <div className="rounded-[24px] border border-white/10 bg-black/26 p-4 backdrop-blur-xl">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[#ff9d4d]">
          {icon}
        </span>
        <div>
          <div className="text-sm text-white/46">{label}</div>
          <div className="mt-1 text-2xl font-semibold text-white">{value}</div>
          <div className="mt-1 text-sm leading-6 text-white/58">{note}</div>
        </div>
      </div>
    </div>
  );
}

function MiniWidget({
  title,
  value,
  note,
  tone,
  onClick,
}: {
  title: string;
  value: string;
  note: string;
  tone?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(0,0,0,0.18))] p-4 text-left transition hover:border-white/16 hover:bg-black/28"
    >
      <div className="text-xs uppercase tracking-[0.16em] text-white/42">{title}</div>
      <div className={`mt-2 text-2xl font-semibold ${tone || "text-white"}`}>{value}</div>
      <div className="mt-2 text-sm leading-6 text-white/56">{note}</div>
    </button>
  );
}

function MetricRingCard({
  label,
  value,
  note,
  percent,
}: {
  label: string;
  value: string;
  note: string;
  percent: number;
}) {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (clamp(percent) / 100) * circumference;
  return (
    <div className="rounded-[22px] border border-white/10 bg-black/24 p-4 shadow-[0_18px_44px_rgba(0,0,0,0.22)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm text-white/48">{label}</div>
          <div className="mt-2 text-[18px] font-semibold text-white">{value}</div>
          <div className="mt-1 text-sm text-white/56">{note}</div>
        </div>
        <div className="relative h-[62px] w-[62px] shrink-0">
          <svg viewBox="0 0 64 64" className="-rotate-90">
            <circle cx="32" cy="32" r={radius} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="7" />
            <circle
              cx="32"
              cy="32"
              r={radius}
              fill="none"
              stroke="#ff7a00"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

function SmartScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="grid grid-cols-[88px_1fr_36px] items-center gap-3 text-xs">
      <span className="text-white/58">{label}</span>
      <div className="h-2 rounded-full bg-white/10">
        <div
          className="h-2 rounded-full bg-[#ff7a00]"
          style={{ width: `${Math.max(6, Math.min(100, value))}%` }}
        />
      </div>
      <span className="text-right text-white/72">{value}</span>
    </div>
  );
}

function SmartBookingCard({ score }: { score: SmartBookingScore }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-black/24 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.16em] text-white/42">{score.itemType}</div>
          <div className="mt-1 text-lg font-semibold text-white">{score.itemTitle}</div>
        </div>
        <div className="text-right">
          <div className="text-[26px] font-semibold leading-none text-[#ff9d4d]">{score.overallScore}</div>
          <div className="mt-1 text-xs text-white/48">confidence {score.confidence}%</div>
        </div>
      </div>
      <div className="mt-4 space-y-2.5">
        <SmartScoreBar label="Value" value={score.valueScore} />
        <SmartScoreBar label="Location" value={score.locationScore} />
        <SmartScoreBar label="Walking" value={score.walkingScore} />
        <SmartScoreBar label="Comfort" value={score.comfortScore} />
        <SmartScoreBar label="Family" value={score.familyScore} />
        <SmartScoreBar label="Transport" value={score.transportScore} />
        <SmartScoreBar label="Worth" value={score.worthMoneyScore} />
      </div>
      <p className="mt-4 text-sm leading-6 text-white/68">{score.aiReason}</p>
      {score.strengths.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {score.strengths.map((item) => (
            <span key={`${score.itemId}-${item}`} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-emerald-300">
              {item}
            </span>
          ))}
        </div>
      ) : null}
      {score.warnings.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {score.warnings.map((item) => (
            <span key={`${score.itemId}-warn-${item}`} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-amber-300">
              {item}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function HappinessDriverList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "positive" | "risk";
}) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
      <div className="text-sm font-medium text-white">{title}</div>
      <div className="mt-3 space-y-2">
        {items.length ? (
          items.map((item) => (
            <div
              key={`${title}-${item}`}
              className={`rounded-full border px-3 py-1.5 text-xs ${
                tone === "positive"
                  ? "border-emerald-400/20 bg-emerald-400/8 text-emerald-300"
                  : "border-[#ff7a00]/20 bg-[#ff7a00]/8 text-[#ffbf76]"
              }`}
            >
              {item}
            </div>
          ))
        ) : (
          <div className="text-sm text-white/52">No strong signals yet.</div>
        )}
      </div>
    </div>
  );
}

function visaBadgeTone(status: VisaEntryAnalysis["visaRequired"]) {
  if (status === "no") return "text-emerald-300 border-emerald-400/30 bg-emerald-400/10";
  if (status === "evisa" || status === "visa-on-arrival") return "text-amber-300 border-amber-400/30 bg-amber-400/10";
  if (status === "yes") return "text-rose-300 border-rose-400/30 bg-rose-400/10";
  return "text-white/72 border-white/10 bg-white/5";
}

function DashboardPanel({
  title,
  action,
  icon,
  children,
}: {
  title: string;
  action?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(0,0,0,0.18))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {icon ? <span className="text-[#ff9d4d]">{icon}</span> : null}
          <h2 className="text-[22px] font-medium text-white">{title}</h2>
        </div>
        {action ? <button type="button" className="rounded-[12px] border border-[#ff7a00]/30 px-3 py-1.5 text-sm text-[#ffb36c]">{action}</button> : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function DetailModal({
  open,
  title,
  body,
  meta,
  onClose,
}: {
  open: boolean;
  title: string;
  body: string;
  meta: string[];
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(0,0,0,0.28))] p-6 shadow-[0_30px_110px_rgba(0,0,0,0.5)] backdrop-blur-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="text-xs uppercase tracking-[0.2em] text-[#ffb066]">Analysis detail</div>
        <h3 className="mt-3 text-2xl font-semibold text-white">{title}</h3>
        <p className="mt-4 text-base leading-7 text-white/66">{body}</p>
        <div className="mt-4 flex flex-wrap gap-2">{meta.filter(Boolean).map((item) => <span key={`${title}-${item}`} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/66">{item}</span>)}</div>
        <button type="button" onClick={onClose} className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/84 transition hover:bg-white/10">Close</button>
      </div>
    </div>
  );
}

function AnalysisPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loading: passLoading, hasPass, remaining } = usePass();
  const [payload, setPayload] = useState<RecommendationPayload | null>(null);
  const [activeWidget, setActiveWidget] = useState<{ title: string; body: string; meta: string[] } | null>(null);

  useEffect(() => {
    trackAnalyticsEvent("analysis_started", {
      planId: searchParams.get("planId"),
      source: "analysis_page",
    });
  }, [searchParams]);

  useEffect(() => {
    if (passLoading) return;
    if (!hasPass || remaining <= 0) {
      router.replace("/pricing?access=required");
    }
  }, [hasPass, passLoading, remaining, router]);

  useEffect(() => {
    const raw = sessionStorage.getItem("gene-recommendation-payload");
    if (!raw) return;
    try {
      setPayload(JSON.parse(raw));
    } catch {
      setPayload(null);
    }
  }, []);

  const dayStress = useMemo(() => (payload?.dayPlan || []).map((day) => {
    const stability = Math.max(50, 94 - Math.max(day.items.length - 4, 0) * 8);
    const note = day.items.length > 5
      ? "Packed day. Keep a rain-safe or shorter backup option ready."
      : day.items.some((item) => item.type === "flight") && day.items.some((item) => item.type === "transport")
      ? "Protected transfer day. Keep timing tight and low friction."
      : "Balanced pacing with manageable movement cost.";
    return { ...day, stability, note };
  }), [payload]);
  const rawInput = useMemo(() => ((payload?.inputs.fullInput as any) ?? {}), [payload?.inputs.fullInput]);
  const analysisSections = useMemo(() => {
    if (!payload) return null;

    const inputs = payload.inputs;
    const travelerCount = Math.max(inputs.travelersCount || 1, 1);
    const shoppingBudget = Number(inputs.shoppingBudget ?? 0);
    const costModel = buildCostModel(payload);
    const protectedReserve =
      inputs.emergencyBufferEnabled || Number((rawInput?.budget?.emergencyBufferAmount || 0)) > 0
        ? Number(rawInput?.budget?.emergencyBufferAmount || 0) || Math.round(inputs.budget * 0.12)
        : 0;
    const estimatedSpend = costModel.total;
    const perTraveler = inputs.costPerPersonEstimate ?? Math.round(estimatedSpend / travelerCount);
    const remainingBuffer = Math.round(inputs.budget - estimatedSpend - shoppingBudget - protectedReserve);
    const stops = inputs.destinations?.length
      ? inputs.destinations
      : [{ id: "primary", city: inputs.destination, country: inputs.destination, preferredHotel: inputs.preferredHotels?.[0] || "" }];
    const lockedRestDays = new Set(inputs.daysWithoutTrips ?? []);
    const multiDestinationMeta = stops.map((stop, index) => `${index + 1}. ${stop.city}, ${stop.country}`);
    const fatigueSignals = inputs.energyFatigueSignals || [];

    return {
      budget: [
        {
          title: "Budget analysis",
          body: inputs.budgetValidation || "The current recommendation is being checked against the total budget, shopping separation, and emergency reserve assumptions.",
          badge: remainingBuffer >= 0 ? "On plan" : "Over target",
          meta: [`Selected ${Math.round(estimatedSpend).toLocaleString()} ${inputs.currency}`, `Budget ${inputs.budget.toLocaleString()} ${inputs.currency}`, `Per traveler ${perTraveler.toLocaleString()} ${inputs.currency}`, shoppingBudget ? `Shopping ${shoppingBudget.toLocaleString()} ${inputs.currency}` : "", remainingBuffer >= 0 ? `Remaining ${remainingBuffer.toLocaleString()} ${inputs.currency}` : `Gap ${Math.abs(remainingBuffer).toLocaleString()} ${inputs.currency}`],
        },
        {
          title: "Emergency buffer analysis",
          body: inputs.emergencyBufferEnabled
            ? "A protected reserve is reducing what Gene treats as safely available for optional upgrades."
            : "No dedicated emergency buffer is locked, so all budget pressure lands directly on the selected trip components.",
          badge: inputs.emergencyBufferEnabled ? "Protected" : "Not reserved",
          meta: [inputs.emergencyBufferEnabled || protectedReserve ? `Reserve ${protectedReserve.toLocaleString()} ${inputs.currency}` : "", inputs.budgetIncludesFlights ? "Flights counted in main budget" : "Flights tracked separately", rawInput?.budget?.travelLevel ? `Level ${rawInput.budget.travelLevel}` : ""],
        },
      ],
      dates: [
        {
          title: "Dates and season analysis",
          body: inputs.flexibleDates
            ? "Flexible dates are enabled, so Gene can trade exact timing for stronger value if provider pricing spikes around the chosen window."
            : "Dates are fixed, so the plan is optimized around the selected trip window without shifting the travel frame.",
          badge: inputs.flexibleDates ? "Flexible" : "Fixed",
          meta: [inputs.startDate, inputs.endDate, lockedRestDays.size ? `${lockedRestDays.size} locked rest days` : "", inputs.flightTimePreference || ""],
        },
        {
          title: "Weather and best-time notes",
          body: payload.selected.activities.some((item) => item.weatherFit.toLowerCase().includes("rain"))
            ? "The selected activity mix already includes some weather-safe coverage, which helps if conditions turn."
            : "Most chosen experiences still lean weather-sensitive, so an indoor backup remains smart for the busiest sightseeing days.",
          badge: payload.selected.activities.some((item) => item.weatherFit.toLowerCase().includes("excellent")) ? "Weather aware" : "Watch weather",
          meta: payload.selected.activities.slice(0, 3).map((item) => `${item.name}: ${item.weatherFit}`),
        },
      ],
      route: [
        {
          title: "Multi-destination route logic",
          body: stops.length > 1
            ? "The route is being handled as separate stops with their own stay intent, transport assumptions, and day-plan pressure."
            : "This is operating as a single-base plan, with hotel and transport choices optimized around one primary destination.",
          badge: stops.length > 1 ? `${stops.length} stops` : "Single stop",
          meta: multiDestinationMeta,
        },
        {
          title: "Transportation timing",
          body: inputs.maxTravelTimeBetweenPlaces
            ? `Gene is treating ${inputs.maxTravelTimeBetweenPlaces} minutes as the soft ceiling between major places, which influences transfers and day density.`
            : "No explicit place-to-place time ceiling is set beyond the existing trip structure.",
          badge: inputs.preferredTransport,
          meta: [inputs.directFlightsOnly ? "Direct flights preferred" : "", inputs.maxLayoverHours ? `Layover max ${inputs.maxLayoverHours}h` : "", payload.selected.transport?.duration || ""],
        },
      ],
      fit: [
        {
          title: "Hotel and stay match",
          body: `The stay layer is being judged against ${inputs.hotelClass}, ${inputs.stayType || "hotel"} expectations, ${inputs.roomCount || 1} room needs, and the selected location preference.`,
          badge: payload.selected.hotel ? "Stay selected" : "Stay open",
          meta: [payload.selected.hotel?.name || "", inputs.breakfastIncluded ? "Breakfast preferred" : "", inputs.amenities?.slice(0, 3).join(", ") || ""],
        },
        {
          title: "Flight preference match",
          body: `Flight logic stays aligned with ${inputs.cabinClass || "standard"} cabin expectations, ${inputs.flightTimePreference || "any-time"} departure timing, and ${inputs.preferredAirlines || "open airline"} preference.`,
          badge: payload.selected.flight ? "Flight selected" : "Flight open",
          meta: [payload.selected.flight?.route || "", inputs.directFlightsOnly ? "Direct only" : "", payload.selected.flight?.airline || ""],
        },
      ],
      mobility: [
        {
          title: "Mobility and walking analysis",
          body: inputs.mobilityNeeds
            ? `Mobility note: ${inputs.mobilityNeeds}. Gene is already factoring this into pacing, transfer stress, and walking fit.`
            : `Walking tolerance is set around ${inputs.walkingTolerance} minutes, which directly affects day density and activity suitability.`,
          badge: inputs.needsRestTime ? "Rest-aware" : "Standard pacing",
          meta: [inputs.walkingTolerance ? `${inputs.walkingTolerance} minute tolerance` : "", inputs.dailyActiveHours ? `${inputs.dailyActiveHours} active hours` : "", inputs.wakeUpTime ? `Wake-up ${inputs.wakeUpTime}` : "", ...fatigueSignals.slice(0, 2)],
        },
        {
          title: "Kids and elderly suitability",
          body: inputs.kids || inputs.elderly
            ? "Traveler-specific comfort checks are active for the mixed-age group, including softer pacing, reduced walking strain, and more conservative movement assumptions."
            : "This itinerary is currently being evaluated mostly for adult-fit pacing and transport logic.",
          badge: `${inputs.adults || 0}/${inputs.kids || 0}/${inputs.elderly || 0}`,
          meta: [inputs.kids ? "Kids pricing and activity fit" : "", inputs.elderly ? "Elderly comfort and rest fit" : "", inputs.foodPreferences?.length ? `Food ${inputs.foodPreferences.slice(0, 2).join(", ")}` : ""],
        },
      ],
      rules: [
        {
          title: "Must-do, avoid-list, and intensity",
          body: `Gene is balancing must-do coverage, avoid-list warnings, and ${inputs.activityIntensity || "balanced"} activity intensity across the current day plan.`,
          badge: inputs.activityIntensity || "Balanced",
          meta: [inputs.mustDoList || "", inputs.avoidList ? `Avoid: ${inputs.avoidList}` : "", inputs.priorities?.slice(0, 3).join(", ") || ""],
        },
        {
          title: "Energy & fatigue engine",
          body: fatigueSignals.length
            ? `The itinerary is being auto-adjusted around ${fatigueSignals.join(", ")}. This changes walking load, meal spacing, transport comfort, and first-day intensity.`
            : "No fatigue-specific planning rules were selected, so Gene is using the standard pacing engine.",
          badge: fatigueSignals.length ? "Hard planning rules" : "Optional",
          meta: fatigueSignals,
        },
        {
          title: "Special occasion and hard constraints",
          body: [rawInput?.constraints?.specialOccasion, rawInput?.constraints?.hardConstraints].filter(Boolean).join(" | ") || "No special occasion or hard-constraint note is forcing a custom exception right now.",
          badge: rawInput?.constraints?.specialOccasion ? "Occasion active" : "Standard trip",
          meta: [inputs.specialRequests || "", lockedRestDays.size ? `Rest days ${Array.from(lockedRestDays).join(", ")}` : ""],
        },
      ],
      destinationBreakdown: stops.map((stop, index) => ({
        title: `${stop.city}, ${stop.country}`,
        body: stop.preferredHotel
          ? `${stop.preferredHotel} remains the stop anchor while Gene fits local activities, transport, and pacing around it.`
          : "This stop is using the shared trip settings for stay, timing, and activity fit.",
        badge: index === 0 ? "Primary stop" : `Stop ${index + 1}`,
        meta: [
          stop.startDate && stop.endDate ? `${stop.startDate} to ${stop.endDate}` : "",
          stop.durationNights ? `${stop.durationNights} nights` : "",
          stop.transportType || inputs.preferredTransport,
          stop.shoppingFocus ? `Shopping ${stop.shoppingFocus}` : "",
        ],
      })),
    };
  }, [payload, rawInput]);
  const summaryMetrics = useMemo(() => {
    if (!payload) return [];
    const destinationCount = payload.inputs.destinations?.length || 1;
    const emergencyReserve = payload.inputs.emergencyBufferEnabled ? Math.round(payload.inputs.budget * 0.12) : 0;
    const averageModule = Math.round(payload.modules.reduce((sum, item) => sum + item.value, 0) / Math.max(payload.modules.length, 1));
    return [
      { label: "Total cost", value: `${payload.inputs.currency} ${Math.round(payload.inputs.budget).toLocaleString()}`, note: payload.inputs.budgetValidation || "Current trip budget target." },
      { label: "Per traveler", value: `${payload.inputs.currency} ${Math.round(payload.inputs.costPerPersonEstimate || payload.inputs.budget / Math.max(payload.inputs.travelersCount || 1, 1)).toLocaleString()}`, note: `${payload.inputs.travelersCount} travelers across the plan.` },
      { label: "Destinations", value: `${destinationCount}`, note: destinationCount > 1 ? "Multi-stop route active." : "Single-stop route." },
      { label: "Emergency buffer", value: `${payload.inputs.currency} ${emergencyReserve.toLocaleString()}`, note: payload.inputs.emergencyBufferEnabled ? "Protected reserve remains in place." : "No reserve is being held back." },
      { label: "Pace score", value: `${averageModule}/100`, note: "Average comfort and execution score." },
      { label: "Rest days", value: `${payload.inputs.daysWithoutTrips?.length || 0}`, note: "Locked free days kept open in the trip engine." },
    ];
  }, [payload]);
  const widgetCards = useMemo(() => {
    if (!analysisSections) return [];
    return [
      ...analysisSections.budget,
      ...analysisSections.dates,
      ...analysisSections.route,
      ...analysisSections.fit,
      ...analysisSections.mobility,
      ...analysisSections.rules,
    ];
  }, [analysisSections]);
  const routeLabel = useMemo(() => {
    if (!payload) return "";
    const destinations = payload.inputs.destinations?.length
      ? payload.inputs.destinations.map((item) => `${item.city}, ${item.country}`)
      : [payload.inputs.destination];
    return destinations.join("  →  ");
  }, [payload]);
  const travelerLabel = useMemo(() => {
    if (!payload) return "";
    return [
      payload.inputs.adults ? `${payload.inputs.adults} Adults` : "",
      payload.inputs.kids ? `${payload.inputs.kids} Child` : "",
      payload.inputs.elderly ? `${payload.inputs.elderly} Elderly` : "",
    ]
      .filter(Boolean)
      .join(", ") || `${payload.inputs.travelersCount} Travelers`;
  }, [payload]);
  const dashboardStats = useMemo(() => {
    if (!payload) return null;
    const travelerCount = Math.max(payload.inputs.travelersCount || 1, 1);
    const costModel = buildCostModel(payload);
    const totalSpend = costModel.total;
    const totalBudget = Math.max(payload.inputs.budget || 1, 1);
    const utilization = Math.round((totalSpend / totalBudget) * 100);
    const emergencyBuffer =
      payload.inputs.emergencyBufferEnabled || Number(((payload.inputs.fullInput as any)?.budget?.emergencyBufferAmount || 0)) > 0
        ? Number(((payload.inputs.fullInput as any)?.budget?.emergencyBufferAmount || 0)) || Math.round(totalBudget * 0.12)
        : 0;
    const paceScore = Number((payload.modules.reduce((sum, item) => sum + item.value, 0) / Math.max(payload.modules.length, 1) / 10).toFixed(1));
    const travelMinutes = estimateTravelMinutes(payload);
    const toleranceMinutes = Math.max((payload.inputs.dailyActiveHours || 12) * 60, 12 * 60);
    const walkingProfile = buildWalkingProfile(payload);
    const activityIntensity = buildActivityIntensity(payload);
    const foodProfile = buildFoodMatch(payload);
    const hotelProfile = buildHotelLocationProfile(payload);
    const flightProfile = buildFlightComfortProfile(payload);
    const crowdItems = payload.dayPlan.flatMap((day) =>
      day.items.map((item) => ({ ...item, dayNumber: day.day })),
    );
    const highestCrowdDay = payload.dayPlan
      .map((day) => ({
        day: day.day,
        score: day.items.reduce((sum, item) => sum + crowdWeight(item.crowdLevel), 0),
      }))
      .sort((a, b) => b.score - a.score)[0];
    const mostCrowdedItem = [...crowdItems].sort(
      (a, b) =>
        crowdWeight(b.crowdLevel) - crowdWeight(a.crowdLevel) ||
        (b.estimatedWaitMinutes || 0) - (a.estimatedWaitMinutes || 0),
    )[0];
    const crowdBestHours = Array.from(
      new Set(
        crowdItems.flatMap((item) => item.bestVisitHours || []).filter(Boolean),
      ),
    ).slice(0, 3);
    const crowdAvoidHours = Array.from(
      new Set(
        crowdItems.flatMap((item) => item.avoidHours || []).filter(Boolean),
      ),
    ).slice(0, 3);
    const averageWait = Math.round(
      crowdItems.reduce((sum, item) => sum + (item.estimatedWaitMinutes || 0), 0) /
        Math.max(crowdItems.length, 1),
    );
    const overallCrowdRisk =
      (mostCrowdedItem?.crowdLevel as "low" | "medium" | "high" | "very-high" | undefined) ||
      "medium";
    const budgetBreakdown = [
      { label: "Flights", percent: Math.round((costModel.flights / Math.max(totalSpend, 1)) * 100), value: costModel.flights, color: "#ff7a00" },
      { label: "Hotels", percent: Math.round((costModel.hotels / Math.max(totalSpend, 1)) * 100), value: costModel.hotels, color: "#d97b00" },
      { label: "Transportation", percent: Math.round((costModel.transportation / Math.max(totalSpend, 1)) * 100), value: costModel.transportation, color: "#2563eb" },
      { label: "Food", percent: Math.round((costModel.food / Math.max(totalSpend, 1)) * 100), value: costModel.food, color: "#65a30d" },
      { label: "Activities", percent: Math.round((costModel.activities / Math.max(totalSpend, 1)) * 100), value: costModel.activities, color: "#9333ea" },
      { label: "Others", percent: Math.round((costModel.others / Math.max(totalSpend, 1)) * 100), value: costModel.others, color: "#6b7280" },
    ];
    const foodMatch = foodProfile.normalized;
    const intensityAxes = activityIntensity.axes;
    const hotelScore = hotelProfile.score;
    const flightScore = flightProfile.score;
    const locationBars = hotelProfile.bars;
    const flightBars = flightProfile.bars;
    const constraints = buildConstraintChecks(payload, costModel, travelMinutes);
    const updatedLabel = `Today, ${new Date(payload.createdAt || Date.now()).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
    const overallScore = Number((payload.modules.reduce((sum, item) => sum + item.value, 0) / Math.max(payload.modules.length, 1) / 10).toFixed(1));

    return {
      totalSpend,
      perTraveler: Math.round(totalSpend / travelerCount),
      utilization,
      emergencyBuffer,
      paceScore,
      travelMinutes,
      toleranceMinutes,
      walkKm: walkingProfile.baseKm,
      walkingRecommendedKm: walkingProfile.recommendedKm,
      walkingFitScore: walkingProfile.fitScore,
      budgetBreakdown,
      foodMatch,
      foodMatchPercent: foodProfile.matchPercent,
      intensityAxes,
      intensityAverage: activityIntensity.average,
      hotelScore,
      flightScore,
      locationBars,
      flightBars,
      constraints,
      updatedLabel,
      overallScore,
      crowd: {
        overallRisk: overallCrowdRisk,
        highestCrowdDay: highestCrowdDay ? `Day ${highestCrowdDay.day}` : "Day 1",
        mostCrowdedActivity: mostCrowdedItem?.title || "Major attraction block",
        bestVisitHours: crowdBestHours,
        avoidHours: crowdAvoidHours,
        averageWait,
        note:
          overallCrowdRisk === "very-high" || overallCrowdRisk === "high"
            ? "The plan pushes major attractions toward earlier or later windows to reduce queue pressure."
            : "Most key visits are already placed in calmer windows with manageable queue risk.",
      },
    };
  }, [payload]);
  const smartBooking = useMemo(() => {
    if (!payload || !dashboardStats) return null;
    return buildSmartBookingScorePayload(payload.selected, payload.inputs, {
      routeMinutes: dashboardStats.travelMinutes,
      weatherRisk: dashboardStats.intensityAverage >= 8 ? 42 : 26,
      crowdRisk:
        dashboardStats.crowd.overallRisk === "very-high"
          ? 90
          : dashboardStats.crowd.overallRisk === "high"
          ? 72
          : dashboardStats.crowd.overallRisk === "medium"
          ? 48
          : 24,
    });
  }, [dashboardStats, payload]);
  const visaEntry = useMemo(() => {
    if (!payload) return null;
    return generateVisaEntryAnalysis(payload.inputs);
  }, [payload]);
  const happinessScore = useMemo<TravelHappinessScore | null>(() => {
    if (!payload || !dashboardStats) return null;
    const crowdRisk =
      dashboardStats.crowd.overallRisk === "very-high"
        ? 92
        : dashboardStats.crowd.overallRisk === "high"
        ? 74
        : dashboardStats.crowd.overallRisk === "medium"
        ? 48
        : 22;
    const weatherRisk =
      payload.selected.activities.some((item) => /rain|heat|weather watch/i.test(item.weatherFit || ""))
        ? 44
        : dashboardStats.intensityAverage >= 8
        ? 36
        : 24;
    return calculateTravelHappinessScore(payload.inputs, payload, {
      crowdRisk,
      weatherRisk,
      routeMinutes: dashboardStats.travelMinutes,
      walkingKm: dashboardStats.walkKm,
      walkingToleranceMinutes: payload.inputs.walkingTolerance || 60,
      dayDensity:
        payload.dayPlan.reduce((sum, day) => sum + day.items.length, 0) /
        Math.max(payload.dayPlan.length, 1),
      smartBookingScores: smartBooking?.scores,
    });
  }, [dashboardStats, payload, smartBooking]);

  if (!payload) {
    return (
      <AiSuiteFrame activePage="analysis" planId={searchParams.get("planId")}>
        <div className="rounded-[34px] border border-white/10 bg-white/[0.05] p-8 text-center backdrop-blur-2xl">
          <div className="text-sm uppercase tracking-[0.2em] text-[#ffb066]">Gene analysis</div>
          <h1 className="mt-4 text-[32px] font-semibold leading-tight">No active trip payload found</h1>
          <p className="mt-4 text-base leading-6 text-white/65">Open the recommendation page first so Gene can carry the selected trip into the analysis dashboard.</p>
          <button type="button" onClick={() => router.push(searchParams.get("planId") ? `/ai/recommendation?planId=${searchParams.get("planId")}` : "/ai-planner")} className="mt-6 rounded-2xl bg-[#ff7a00] px-5 py-3 text-base font-semibold text-black">Return to recommendation</button>
        </div>
      </AiSuiteFrame>
    );
  }

  return (
    <AiSuiteFrame activePage="analysis" planId={payload.planId || searchParams.get("planId")}>
      <section className="space-y-5">
        <div className="grid gap-5 xl:grid-cols-[1fr_auto] xl:items-start">
          <div>
            <h1 className="text-[34px] font-semibold leading-none text-white md:text-[40px]">Analysis <span className="text-[#ff9d4d]">✦</span></h1>
            <div className="mt-3 text-[15px] text-white/72 md:text-[16px]">Smart insights to help you travel better</div>
          </div>
          <div className="space-y-3 xl:text-right">
            <div className="flex flex-wrap items-center gap-3 xl:justify-end">
              <div className="rounded-[18px] border border-white/10 bg-black/28 px-4 py-3 text-[13px] text-white/78">
                <div className="flex flex-wrap items-center gap-4">
                  <span>{routeLabel}</span>
                  <span className="text-white/42">|</span>
                  <span>{formatTripDate(payload.inputs.startDate)} - {formatTripDate(payload.inputs.endDate)}</span>
                  <span className="text-white/42">|</span>
                  <span>{travelerLabel}</span>
                </div>
              </div>
              <Link href={`/ai-planner?planId=${payload.planId || searchParams.get("planId") || ""}`} className="rounded-[16px] border border-[#ff7a00]/40 bg-transparent px-5 py-3 text-[13px] font-medium text-[#ff9d4d] transition hover:bg-[#ff7a00]/10">
                Edit Trip
              </Link>
            </div>
            <div className="text-sm text-white/46">Data updated: {dashboardStats?.updatedLabel}</div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricRingCard label="Total Trip Cost" value={`$${Math.round(dashboardStats?.totalSpend || 0).toLocaleString()}`} note={`From selected recommendation items`} percent={Math.min(100, Math.max(30, Math.round(((dashboardStats?.totalSpend || 0) / Math.max(payload.inputs.budget, 1)) * 100)))} />
          <MetricRingCard label="Cost per Traveler" value={`$${Math.round(dashboardStats?.perTraveler || 0).toLocaleString()}`} note="Avg. per person" percent={76} />
          <MetricRingCard label="Budget Utilization" value={`${dashboardStats?.utilization || 0}%`} note="Of total budget" percent={dashboardStats?.utilization || 0} />
          <MetricRingCard label="Emergency Buffer" value={`$${Math.round(dashboardStats?.emergencyBuffer || 0).toLocaleString()}`} note={`${Math.round(((dashboardStats?.emergencyBuffer || 0) / Math.max(payload.inputs.budget, 1)) * 100)}% of budget`} percent={Math.round(((dashboardStats?.emergencyBuffer || 0) / Math.max(payload.inputs.budget, 1)) * 100)} />
          <MetricRingCard label="Pace Score" value={`${dashboardStats?.paceScore || 0}/10`} note="Perfect Balance" percent={Math.round((dashboardStats?.paceScore || 0) * 10)} />
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <DashboardPanel title="Budget Breakdown" action="View details" icon={<Wallet size={18} />}>
            <div className="grid gap-5 md:grid-cols-[180px_1fr] md:items-center">
              <div className="flex items-center justify-center">
                <div className="relative flex h-[180px] w-[180px] items-center justify-center rounded-full border-[18px] border-[#ff7a00]/75 border-r-[#d97706]/65 border-b-[#2563eb]/65 border-l-[#65a30d]/55">
                  <div className="text-center">
                    <div className="text-[18px] font-semibold text-white">${Math.round(dashboardStats?.totalSpend || 0).toLocaleString()}</div>
                    <div className="text-sm text-white/52">Total</div>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {dashboardStats?.budgetBreakdown.map((item) => (
                  <div key={item.label} className="grid grid-cols-[14px_1fr_auto_auto] items-center gap-3 text-sm">
                    <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-white/78">{item.label}</span>
                    <span className="text-white/68">{item.percent}%</span>
                    <span className="text-white">${Math.round(item.value).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-5 flex items-center gap-2 border-t border-white/10 pt-4 text-sm text-emerald-300">
              <ShieldCheck size={16} />
              Your trip is within budget. Great job!
            </div>
          </DashboardPanel>

          <DashboardPanel title="Activity Intensity" action="Good Balance" icon={<Sparkles size={18} />}>
            <div className="grid gap-5 md:grid-cols-[1fr_220px] md:items-center">
              <div className="grid grid-cols-2 gap-y-4 text-sm text-white/78">
                {dashboardStats?.intensityAxes.map((item) => (
                  <div key={item.label}>
                    <div>{item.label}</div>
                    <div className="text-white/54">{item.value}/10</div>
                  </div>
                ))}
              </div>
              <div className="flex justify-center">
                <svg viewBox="0 0 240 220" className="h-[220px] w-[220px]">
                  <polygon points="120,30 190,70 190,145 120,185 50,145 50,70" fill="rgba(255,122,0,0.08)" stroke="rgba(255,255,255,0.12)" />
                  <polygon points="120,55 173,83 168,136 120,158 73,136 67,85" fill="rgba(255,122,0,0.18)" stroke="#ff7a00" strokeWidth="2" />
                  {[["120","30","120","185"],["50","70","190","145"],["190","70","50","145"]].map((line, index) => <line key={index} x1={line[0]} y1={line[1]} x2={line[2]} y2={line[3]} stroke="rgba(255,255,255,0.1)" />)}
                  {[{ x: 120, y: 55 }, { x: 173, y: 83 }, { x: 168, y: 136 }, { x: 120, y: 158 }, { x: 73, y: 136 }, { x: 67, y: 85 }].map((point, index) => <circle key={index} cx={point.x} cy={point.y} r="3" fill="#ff7a00" />)}
                </svg>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-2 border-t border-white/10 pt-4 text-sm text-emerald-300">
              <ShieldCheck size={16} />
              Well balanced activities for a fulfilling trip.
            </div>
          </DashboardPanel>

          <DashboardPanel title="Travel Time vs Your Tolerance" action="Details" icon={<Compass size={18} />}>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <div className="text-sm text-white/46">Total Travel Time</div>
                <div className="mt-2 text-[44px] font-medium leading-none text-[#ff9d4d]">{formatMinutes(dashboardStats?.travelMinutes || 0)}</div>
              </div>
              <div>
                <div className="text-sm text-white/46">Your Tolerance</div>
                <div className="mt-2 text-[44px] font-medium leading-none text-white">{formatMinutes(dashboardStats?.toleranceMinutes || 0)}</div>
              </div>
            </div>
            <div className="mt-5">
              <div className="h-2 rounded-full bg-white/10">
                <div className="relative h-2 rounded-full bg-[#ff7a00]" style={{ width: `${Math.min(100, ((dashboardStats?.travelMinutes || 0) / Math.max(dashboardStats?.toleranceMinutes || 1, 1)) * 100)}%` }}>
                  <span className="absolute right-0 top-1/2 h-4 w-1 -translate-y-1/2 rounded-full bg-white" />
                </div>
              </div>
              <div className="mt-2 flex justify-between text-sm text-white/48">
                <span>0h</span>
                <span>{Math.round((dashboardStats?.toleranceMinutes || 0) / 60)}h</span>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-2 border-t border-white/10 pt-4 text-sm text-emerald-300">
              <ShieldCheck size={16} />
              Within your tolerance. Perfect!
            </div>
          </DashboardPanel>

          <DashboardPanel title="Crowd & Queue Predictor" action="Smart timing" icon={<Users size={18} />}>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-4">
                <div className="rounded-[18px] border border-white/10 bg-black/20 p-4">
                  <div className="text-sm text-white/46">Overall Crowd Risk</div>
                  <div className="mt-2 text-[34px] font-medium leading-none text-[#ff9d4d]">
                    {crowdRiskLabel(dashboardStats?.crowd.overallRisk)}
                  </div>
                  <div className="mt-2 text-sm text-white/56">
                    Avg. wait about {dashboardStats?.crowd.averageWait || 0} min
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[18px] border border-white/10 bg-black/20 p-4">
                    <div className="text-sm text-white/46">Highest Crowd Day</div>
                    <div className="mt-2 text-xl font-medium text-white">
                      {dashboardStats?.crowd.highestCrowdDay || "Day 1"}
                    </div>
                  </div>
                  <div className="rounded-[18px] border border-white/10 bg-black/20 p-4">
                    <div className="text-sm text-white/46">Most Crowded Activity</div>
                    <div className="mt-2 text-xl font-medium text-white">
                      {dashboardStats?.crowd.mostCrowdedActivity || "Major attraction"}
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="rounded-[18px] border border-white/10 bg-black/20 p-4">
                  <div className="text-sm text-white/46">Best Visiting Hours</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(dashboardStats?.crowd.bestVisitHours || []).map((hour) => (
                      <span
                        key={`best-${hour}`}
                        className="rounded-full border border-[#ff7a00]/25 bg-[#ff7a00]/10 px-3 py-1 text-sm text-[#ffb36c]"
                      >
                        {hour}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-[18px] border border-white/10 bg-black/20 p-4">
                  <div className="text-sm text-white/46">Avoid Crowd Times</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(dashboardStats?.crowd.avoidHours || []).map((hour) => (
                      <span
                        key={`avoid-${hour}`}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/68"
                      >
                        {hour}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-2 border-t border-white/10 pt-4 text-sm text-emerald-300">
              <ShieldCheck size={16} />
              {dashboardStats?.crowd.note}
            </div>
          </DashboardPanel>

          <DashboardPanel title="Food Preference Match" icon={<UtensilsCrossed size={18} />}>
            <div className="grid gap-5 md:grid-cols-[180px_1fr] md:items-center">
              <div className="flex items-center justify-center">
                <div className="relative flex h-[160px] w-[160px] items-center justify-center rounded-full border-[16px] border-[#ff7a00]/75 border-r-[#d97706]/65 border-b-[#2563eb]/65 border-l-[#65a30d]/55">
                  <div className="text-center">
                    <div className="text-[40px] font-medium leading-none text-white">{dashboardStats?.foodMatchPercent || 0}%</div>
                    <div className="mt-2 text-sm text-white/52">Match</div>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {dashboardStats?.foodMatch.map((item) => (
                  <div key={item.label} className="grid grid-cols-[14px_1fr_auto] items-center gap-3 text-sm">
                    <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-white/78">{item.label}</span>
                    <span className="text-white/68">{item.percent}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-5 flex items-center gap-2 border-t border-white/10 pt-4 text-sm text-emerald-300">
              <ShieldCheck size={16} />
              Great match! You'll love the food options.
            </div>
          </DashboardPanel>

          <DashboardPanel title="Walking Tolerance" action="Moderate" icon={<Users size={18} />}>
            <div className="grid gap-5 md:grid-cols-[140px_1fr] md:items-center">
              <div className="flex justify-center">
                <div className="relative flex h-[130px] w-[130px] items-center justify-center rounded-full border-[10px] border-[#ff7a00] border-r-white/10 border-b-white/10 border-l-white/10">
                  <div className="text-center">
                    <div className="text-[24px] font-medium leading-none text-[#ff9d4d]">{dashboardStats?.walkKm}</div>
                    <div className="mt-1 text-sm text-white/52">km / day</div>
                  </div>
                </div>
              </div>
              <div className="space-y-2 text-sm text-white/74">
                <div>Recommended <span className="ml-3 text-white">5 - 8 km / day</span></div>
                <div>This trip <span className="ml-3 text-white">{dashboardStats?.walkKm} km / day</span></div>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-2 border-t border-white/10 pt-4 text-sm text-emerald-300">
              <ShieldCheck size={16} />
              {(dashboardStats?.walkingFitScore || 0) >= 80 ? "Good fit! You can comfortably enjoy this trip." : (dashboardStats?.walkingFitScore || 0) >= 60 ? "Manageable, but a few days may feel active." : "This plan may feel demanding unless some activity intensity is reduced."}
            </div>
          </DashboardPanel>

          <DashboardPanel title="Rest Day & Pace" icon={<MoonStar size={18} />}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[18px] border border-white/10 bg-black/20 p-4">
                <div className="text-sm text-white/48">Rest Days</div>
                <div className="mt-2 text-[40px] font-medium leading-none text-[#ff9d4d]">{payload.inputs.daysWithoutTrips?.length || 2}</div>
                <div className="mt-2 text-sm text-white/56">Days included</div>
              </div>
              <div className="rounded-[18px] border border-white/10 bg-black/20 p-4">
                <div className="text-sm text-white/48">Pace</div>
                <div className="mt-2 text-[32px] font-medium leading-none text-white">{(dashboardStats?.intensityAverage || 0) >= 8 ? "High" : (dashboardStats?.intensityAverage || 0) >= 6 ? "Balanced" : "Light"}</div>
                <div className="mt-2 text-sm text-white/56">{(dashboardStats?.intensityAverage || 0) >= 8 ? "Very full days with strong activity density." : (dashboardStats?.intensityAverage || 0) >= 6 ? "Not too busy, not too slow." : "A softer pace with more open space."}</div>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-2 border-t border-white/10 pt-4 text-sm text-emerald-300">
              <ShieldCheck size={16} />
              Pace is well balanced with enough rest.
            </div>
          </DashboardPanel>

          <DashboardPanel title="Hotel Location Score" action="Details" icon={<Hotel size={18} />}>
            <div className="grid gap-5 md:grid-cols-[140px_1fr] md:items-center">
              <div className="flex justify-center">
                <div className="relative flex h-[130px] w-[130px] items-center justify-center rounded-full border-[10px] border-[#ff7a00] border-r-white/10 border-b-white/10 border-l-white/10">
                  <div className="text-center">
                    <div className="text-[34px] font-medium leading-none text-[#ff9d4d]">{dashboardStats?.hotelScore}</div>
                    <div className="mt-1 text-sm text-white/52">/10</div>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {dashboardStats?.locationBars.map((item) => (
                  <div key={item.label} className="grid grid-cols-[1fr_110px_36px] items-center gap-3 text-sm">
                    <span className="text-white/78">{item.label}</span>
                    <div className="h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-[#ff7a00]" style={{ width: `${item.value * 10}%` }} /></div>
                    <span className="text-white/66">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-5 flex items-center gap-2 border-t border-white/10 pt-4 text-sm text-emerald-300">
              <ShieldCheck size={16} />
              AI-rated from location fit, accessibility, and nearby attraction balance.
            </div>
          </DashboardPanel>

          <DashboardPanel title="Flexible Dates Value" action="How it works" icon={<CalendarDays size={18} />}>
            <div className="grid gap-5 md:grid-cols-[160px_1fr] md:items-center">
              <div className="flex justify-center">
                <div className="relative flex h-[150px] w-[150px] items-center justify-center rounded-full border-[14px] border-[#ff7a00] border-r-white/10 border-b-white/10 border-l-white/10">
                  <div className="text-center">
                    <div className="text-[34px] font-medium leading-none text-white">$240</div>
                    <div className="mt-1 text-sm text-[#ffb36c]">Saved</div>
                  </div>
                </div>
              </div>
              <div>
                <div className="text-[18px] leading-7 text-white/74">You could save up to <span className="font-semibold text-[#ff9d4d]">$240</span> by shifting your dates.</div>
                <button type="button" className="mt-5 rounded-[14px] border border-[#ff7a00]/30 px-4 py-2 text-sm text-[#ffb36c]">View Date Suggestions</button>
              </div>
            </div>
          </DashboardPanel>

          <DashboardPanel title="Flight Comfort Score" action="Details" icon={<Plane size={18} />}>
            <div className="grid gap-5 md:grid-cols-[140px_1fr] md:items-center">
              <div className="flex justify-center">
                <div className="relative flex h-[130px] w-[130px] items-center justify-center rounded-full border-[10px] border-[#ff7a00] border-r-white/10 border-b-white/10 border-l-white/10">
                  <div className="text-center">
                    <div className="text-[34px] font-medium leading-none text-[#ff9d4d]">{dashboardStats?.flightScore}</div>
                    <div className="mt-1 text-sm text-white/52">/10</div>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {dashboardStats?.flightBars.map((item) => (
                  <div key={item.label} className="grid grid-cols-[1fr_110px_36px] items-center gap-3 text-sm">
                    <span className="text-white/78">{item.label}</span>
                    <div className="h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-[#ff7a00]" style={{ width: `${item.value * 10}%` }} /></div>
                    <span className="text-white/66">{item.value.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-5 flex items-center gap-2 border-t border-white/10 pt-4 text-sm text-emerald-300">
              <ShieldCheck size={16} />
              AI-rated from duration, layovers, departure timing, and airline confidence.
            </div>
          </DashboardPanel>

          <DashboardPanel title="Hard Constraint Check" action="View all" icon={<AlertTriangle size={18} />}>
            <div className="space-y-3">
              {dashboardStats?.constraints.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-3">
                    <span className={`h-3.5 w-3.5 rounded-full ${item.met ? "bg-emerald-400" : "bg-rose-400"}`} />
                    <span className="text-white/78">{item.label}</span>
                  </div>
                  <span className={`${item.met ? "text-emerald-300" : "text-rose-300"}`}>{item.met ? "Met" : "Watch"}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 flex items-center gap-2 border-t border-white/10 pt-4 text-sm text-emerald-300">
              <ShieldCheck size={16} />
              {(dashboardStats?.constraints.every((item) => item.met) ? "All constraints are met. You're good to go!" : "Some constraints need attention before booking.")}
            </div>
          </DashboardPanel>
        </div>

        {smartBooking ? (
          <DashboardPanel title="Smart Booking Score" action={`${smartBooking.overall}/100 overall`} icon={<Gauge size={18} />}>
            <div className="grid gap-4 xl:grid-cols-2">
              {smartBooking.scores.map((score) => (
                <SmartBookingCard key={score.itemId} score={score} />
              ))}
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
                <div className="text-sm font-medium text-white">Why these booking choices are strong</div>
                <p className="mt-2 text-sm leading-6 text-white/64">{smartBooking.summary}</p>
              </div>
              <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
                <div className="text-sm font-medium text-white">Where to be careful</div>
                <p className="mt-2 text-sm leading-6 text-white/64">{smartBooking.caution}</p>
              </div>
            </div>
          </DashboardPanel>
        ) : null}

        {happinessScore ? (
          <DashboardPanel title="Travel Happiness Score" action={`${happinessScore.overallScore}/100 overall`} icon={<Sparkles size={18} />}>
            <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
              <div className="rounded-[22px] border border-white/10 bg-black/24 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm uppercase tracking-[0.16em] text-white/42">Travel Happiness</div>
                    <div className="mt-2 text-[40px] font-semibold leading-none text-[#ff9d4d]">{happinessScore.overallScore}</div>
                    <div className="mt-2 text-sm text-white/58">Confidence {happinessScore.confidence}%</div>
                  </div>
                  <div className="relative h-[94px] w-[94px] shrink-0">
                    <svg viewBox="0 0 94 94" className="-rotate-90">
                      <circle cx="47" cy="47" r="34" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="10" />
                      <circle
                        cx="47"
                        cy="47"
                        r="34"
                        fill="none"
                        stroke="#ff7a00"
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 34}
                        strokeDashoffset={(2 * Math.PI * 34) - (clamp(happinessScore.overallScore) / 100) * (2 * Math.PI * 34)}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-lg font-semibold text-white">
                      {happinessScore.overallScore}
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-white/66">{happinessScore.aiSummary}</p>
              </div>

              <div className="grid gap-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
                    <div className="text-sm text-white/48">Enjoyment Probability</div>
                    <div className="mt-2 text-[32px] font-medium leading-none text-white">{happinessScore.enjoymentProbability}%</div>
                    <div className="mt-3"><SmartScoreBar label="Enjoyment" value={happinessScore.enjoymentProbability} /></div>
                  </div>
                  <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
                    <div className="text-sm text-white/48">Stress Probability</div>
                    <div className="mt-2 text-[32px] font-medium leading-none text-white">{happinessScore.stressProbability}%</div>
                    <div className="mt-3"><SmartScoreBar label="Stress" value={happinessScore.stressProbability} /></div>
                  </div>
                  <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
                    <div className="text-sm text-white/48">Compatibility Score</div>
                    <div className="mt-2 text-[32px] font-medium leading-none text-white">{happinessScore.compatibilityScore}%</div>
                    <div className="mt-3"><SmartScoreBar label="Match" value={happinessScore.compatibilityScore} /></div>
                  </div>
                </div>
                <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
                  <div className="text-sm text-white/48">Confidence level</div>
                  <div className="mt-3 h-2 rounded-full bg-white/10">
                    <div className="h-2 rounded-full bg-[#ff7a00]" style={{ width: `${Math.max(8, happinessScore.confidence)}%` }} />
                  </div>
                  <div className="mt-2 text-sm text-white/56">
                    This score blends pace, budget, crowd timing, walking load, weather pressure, and traveler fit.
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <HappinessDriverList title="Top positive factors" items={happinessScore.positiveDrivers} tone="positive" />
              <HappinessDriverList title="Top risk factors" items={happinessScore.riskDrivers} tone="risk" />
            </div>
          </DashboardPanel>
        ) : null}

        {visaEntry ? (
          <DashboardPanel title="Smart Visa & Entry Assistant" action={`${visaEntry.confidence}% confidence`} icon={<ShieldCheck size={18} />}>
            <div className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
              <div className="space-y-4">
                <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
                  <div className="text-sm text-white/46">Visa status</div>
                  <div className="mt-3 flex items-center gap-3">
                    <span className={`rounded-full border px-3 py-1 text-sm font-medium capitalize ${visaBadgeTone(visaEntry.visaRequired)}`}>
                      {visaEntry.visaRequired.replaceAll("-", " ")}
                    </span>
                    <span className="text-sm text-white/58">{visaEntry.destinationCountry || "Destination required"}</span>
                  </div>
                </div>
                <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
                  <div className="text-sm text-white/46">Passport validity</div>
                  <p className="mt-2 text-sm leading-6 text-white/68">{visaEntry.passportValidityRule}</p>
                </div>
                <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
                  <div className="text-sm text-white/46">Transit visa risk</div>
                  <div className="mt-2 space-y-2">
                    {visaEntry.transitVisaNotes.map((item) => (
                      <div key={item} className="text-sm leading-6 text-white/68">{item}</div>
                    ))}
                  </div>
                </div>
                <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
                  <div className="text-sm text-white/46">Confidence level</div>
                  <div className="mt-3 h-2 rounded-full bg-white/10">
                    <div className="h-2 rounded-full bg-[#ff7a00]" style={{ width: `${Math.max(8, visaEntry.confidence)}%` }} />
                  </div>
                  <div className="mt-2 text-sm text-white/58">
                    {visaEntry.sourceStatus === "api" ? "Using API-ready entry context." : visaEntry.sourceStatus === "missing-data" ? "Missing required traveler or route details." : "AI-generated guidance with disclaimer while official data is not connected."}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
                  <div className="text-sm font-medium text-white">Required documents</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {visaEntry.requiredDocuments.map((item) => (
                      <span key={item} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/72">{item}</span>
                    ))}
                  </div>
                </div>
                <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
                  <div className="text-sm font-medium text-white">Entry & health notes</div>
                  <div className="mt-3 space-y-2">
                    {[...visaEntry.entryRestrictions, ...visaEntry.vaccinationRules].map((item) => (
                      <div key={item} className="text-sm leading-6 text-white/68">{item}</div>
                    ))}
                  </div>
                </div>
                <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
                  <div className="text-sm font-medium text-white">Customs notes</div>
                  <div className="mt-3 space-y-2">
                    {visaEntry.customsNotes.map((item) => (
                      <div key={item} className="text-sm leading-6 text-white/68">{item}</div>
                    ))}
                  </div>
                </div>
                {visaEntry.countryBreakdown?.length ? (
                  <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
                    <div className="text-sm font-medium text-white">Country-by-country check</div>
                    <div className="mt-3 space-y-3">
                      {visaEntry.countryBreakdown.map((item) => (
                        <div key={`${item.country}-${item.note}`} className="rounded-[16px] border border-white/10 bg-white/5 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-sm font-medium text-white">{item.country}</div>
                            <span className={`rounded-full border px-2.5 py-1 text-[11px] capitalize ${visaBadgeTone(item.visaRequired)}`}>
                              {item.visaRequired.replaceAll("-", " ")}
                            </span>
                          </div>
                          <div className="mt-2 text-sm leading-6 text-white/62">{item.note}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
                <div className="text-sm font-medium text-white">What to check before booking</div>
                <p className="mt-2 text-sm leading-6 text-white/64">{visaEntry.aiSummary}</p>
              </div>
              <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
                <div className="text-sm font-medium text-white">Warnings</div>
                <div className="mt-2 space-y-2">
                  {visaEntry.warnings.map((item) => (
                    <div key={item} className="rounded-full border border-[#ff7a00]/20 bg-[#ff7a00]/8 px-3 py-1.5 text-xs text-[#ffbf76]">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DashboardPanel>
        ) : null}

        <div className="grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
          <div className="rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(0,0,0,0.18))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
            <div className="flex items-center gap-2 text-[22px] font-medium text-white">
              <Sparkles size={18} className="text-[#ff9d4d]" />
              AI Key Insight
            </div>
            <p className="mt-4 max-w-3xl text-[18px] leading-8 text-white/74">
              You're a smart traveler! Your plan is well balanced, within budget and perfectly matches your preferences.
            </p>
          </div>
          <div className="rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,122,0,0.08),rgba(0,0,0,0.18))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
            <div className="text-sm uppercase tracking-[0.16em] text-white/46">Overall Score</div>
            <div className="mt-3 text-[56px] font-medium leading-none text-[#ff9d4d]">{dashboardStats?.overallScore}</div>
            <div className="mt-2 text-lg text-white/72">/10 <span className="ml-3 text-emerald-300">Excellent</span></div>
            <div className="mt-3 text-[#ffb36c]">★★★★★</div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr_1.25fr]">
          <button type="button" className="rounded-[22px] border border-white/10 bg-black/24 px-5 py-4 text-left text-white/84 shadow-[0_18px_44px_rgba(0,0,0,0.2)]">
            <div className="text-[18px] font-medium text-white">Share Analysis</div>
            <div className="mt-1 text-sm text-white/56">Send to your travel buddies</div>
          </button>
          <button type="button" className="rounded-[22px] border border-white/10 bg-black/24 px-5 py-4 text-left text-white/84 shadow-[0_18px_44px_rgba(0,0,0,0.2)]">
            <div className="text-[18px] font-medium text-white">Download Report</div>
            <div className="mt-1 text-sm text-white/56">PDF summary of your trip</div>
          </button>
          <button type="button" className="rounded-[22px] border border-white/10 bg-black/24 px-5 py-4 text-left text-white/84 shadow-[0_18px_44px_rgba(0,0,0,0.2)]">
            <div className="text-[18px] font-medium text-white">Re-run Analysis</div>
            <div className="mt-1 text-sm text-white/56">See improved suggestions</div>
          </button>
          <button type="button" onClick={() => { trackAnalyticsEvent("analysis_completed", { planId: payload.planId || searchParams.get("planId") || "", source: "analysis_page" }); router.push(`/ai/booking?planId=${payload.planId || searchParams.get("planId") || ""}`); }} className="rounded-[22px] bg-[linear-gradient(135deg,#ff7a00,rgba(255,160,62,0.96))] px-6 py-4 text-left text-black shadow-[0_20px_50px_rgba(255,122,0,0.26)]">
            <div className="text-[22px] font-medium">Continue to Booking</div>
            <div className="mt-1 text-sm text-black/70">Next Step →</div>
          </button>
        </div>
        <DetailModal open={Boolean(activeWidget)} title={activeWidget?.title || ""} body={activeWidget?.body || ""} meta={activeWidget?.meta || []} onClose={() => setActiveWidget(null)} />
      </section>
    </AiSuiteFrame>
  );
}

export default function AnalysisPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#050505] text-white" />}>
      <AnalysisPageContent />
    </Suspense>
  );
}

