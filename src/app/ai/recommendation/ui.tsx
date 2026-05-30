"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeftRight,
  ArrowRight,
  Camera,
  CarFront,
  ChevronLeft,
  ChevronRight,
  Compass,
  Gem,
  Heart,
  Hotel,
  Leaf,
  MoonStar,
  Mountain,
  Pencil,
  Plane,
  Plus,
  Sparkles,
  Star,
  Ticket,
  Users,
  UtensilsCrossed,
  Wallet,
  X,
} from "lucide-react";
import AiSuiteFrame from "@/components/ai/AiSuiteFrame";
import { buildAnalysisInsights, buildAnalysisModules, generateAiDayPlan, rankRecommendationsWithAI } from "@/lib/recommendation/aiPlanner";
import { buildBudgetSettings } from "@/lib/recommendation/budget";
import { enrichRecommendationPayloadWithLiveBooking } from "@/lib/recommendation/liveBooking";
import { mockActivities, mockCars, mockFlights, mockHotels, mockRestaurants, mockTransports } from "@/lib/recommendation/mockData";
import { buildDestinationResources } from "@/lib/recommendation/resources";
import type {
  ActivityRecommendation,
  FlightRecommendation,
  HiddenGemResult,
  HotelRecommendation,
  HotelUpgrade,
  RecommendationLabel,
  RecommendationPayload,
  SelectedRecommendations,
  TripDestination,
  UserTripInput,
} from "@/lib/recommendation/types";
import { trackAnalyticsEvent } from "@/lib/analytics";

type SavedCard = { name?: string; location?: string; route?: string; category?: string; reason?: string };
type Props = {
  planId: string;
  planInput: any;
  recommendation: {
    headline: string;
    summary: string;
    hotels: SavedCard[];
    flights: SavedCard[];
    activities: SavedCard[];
    fitBullets: string[];
    rawAi?: { fallback?: boolean } | null;
  };
  hiddenGems?: HiddenGemResult[];
};

type DestinationSelectionMap = Record<string, SelectedRecommendations>;
type FlowCategory = "stays" | "flights" | "transport" | "activities" | "restaurants" | "events";
type DestinationTab = "all" | string;
type SelectionKind = "hotel" | "flight";
type ConfirmationState =
  | {
      kind: "duplicate";
      selectionType: SelectionKind;
      stopId: string;
      destinationName: string;
      item: any;
    }
  | {
      kind: "missingDestination";
      stopId: string;
      destinationName: string;
    }
  | {
      kind: "missingRequirement";
      stopId: string;
      destinationName: string;
      missing: "flight" | "hotel";
    }
  | null;
type UpgradePanelState =
  | {
      kind: "hotel" | "flight";
      stopId: string;
      itemId: string;
    }
  | null;
type ExtraSelectionsState = Record<
  string,
  {
    hotels: HotelRecommendation[];
    flights: FlightRecommendation[];
  }
>;

const EMPTY_SELECTED: SelectedRecommendations = {
  hotel: null,
  flight: null,
  activities: [],
  restaurant: null,
  transport: null,
  car: null,
  hiddenGems: [],
};

const money = (n: number, suffix = "") => `$${Math.round(n || 0).toLocaleString()}${suffix}`;
const formatTripDate = (value: string) => new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

function calculateBagCost(weight: number) {
  if (weight <= 50) return 0;
  if (weight <= 70) return 100;
  if (weight < 100) return 200;
  return 0;
}

function getCabinAllowance(cabinClass?: string) {
  if (cabinClass === "business" || cabinClass === "first") return 70;
  return 50;
}

function getBudgetLevel(customerBudget: number, selectedTotalCost: number) {
  const delta = selectedTotalCost - customerBudget;
  if (delta < -100) return { label: "Cheap", note: "Below budget" } as const;
  if (Math.abs(delta) <= 100) return { label: "Perfect", note: "Right on target" } as const;
  return { label: "High", note: "Above budget" } as const;
}

function inferStyleFromInputs(inputs: UserTripInput) {
  const stylePool = [
    ...(inputs.tripPersonality || []),
    ...(inputs.travelStyle ? inputs.travelStyle.split(/[|,]/).map((value) => value.trim()) : []),
  ].filter(Boolean);
  const normalized = stylePool.join(" ").toLowerCase();
  if (/romantic/.test(normalized)) return "Romantic";
  if (/backpacking|budget/.test(normalized)) return "Backpacking";
  if (/photography|photo/.test(normalized)) return "Photography";
  if (/foodie|food|cuisine/.test(normalized)) return "Foodie";
  if (/adventure|outdoor/.test(normalized)) return "Adventure";
  if (/family|kids|child/.test(normalized)) return "Family";
  if (/wellness|spa|relax/.test(normalized)) return "Wellness";
  return "Luxury";
}

function travelerPriceTotal({
  adultPrice,
  childPrice,
  fixedPrice,
  adults,
  kids,
  elderly,
  quantity = 1,
}: {
  adultPrice?: number | null;
  childPrice?: number | null;
  fixedPrice?: number | null;
  adults: number;
  kids: number;
  elderly: number;
  quantity?: number;
}) {
  const safeQuantity = Math.max(quantity, 1);
  const hasAdult = typeof adultPrice === "number";
  const hasChild = typeof childPrice === "number";
  const hasFixed = typeof fixedPrice === "number";
  if (!hasAdult && !hasChild && !hasFixed) return null;
  const adultCount = Math.max(adults, 0) + Math.max(elderly, 0);
  const childCount = Math.max(kids, 0);
  const adultUnit = hasAdult ? Number(adultPrice) : hasChild ? Number(childPrice) : 0;
  const childUnit = hasChild ? Number(childPrice) : adultUnit;
  return (adultUnit * adultCount + childUnit * childCount + (hasFixed ? Number(fixedPrice) : 0)) * safeQuantity;
}

function getSelectedItemCost(item: unknown, inputs: UserTripInput, category: FlowCategory | "suggestions") {
  if (!item || typeof item !== "object") return null;
  const typed = item as Record<string, any>;
  const adults = Number(inputs.adults ?? 0);
  const kids = Number(inputs.kids ?? 0);
  const elderly = Number(inputs.elderly ?? 0);
  const roomCount = Math.max(1, Number(inputs.roomCount ?? 1));
  const tripDays = Math.max(1, Math.ceil((new Date(inputs.endDate).getTime() - new Date(inputs.startDate).getTime()) / 86400000));
  if (category === "stays") {
    const nightly = typed.selectedUpgrade?.totalPrice ?? typed.totalPrice ?? typed.nightlyPrice;
    return typeof nightly === "number" ? nightly * roomCount * tripDays : null;
  }
  if (category === "transport") {
    return typeof typed.cost === "number"
      ? typed.cost
      : typeof typed.dailyPrice === "number"
        ? typed.dailyPrice * Math.max(1, tripDays)
        : typeof typed.totalPrice === "number"
          ? typed.totalPrice
          : null;
  }
  if (category === "flights") {
    return travelerPriceTotal({
      adultPrice: typed.priceAdult ?? typed.totalFare ?? typed.totalPrice ?? typed.fare,
      childPrice: typed.priceChild,
      fixedPrice: typed.fixedPrice,
      adults,
      kids,
      elderly,
    });
  }
  if (category === "restaurants") {
    return travelerPriceTotal({
      adultPrice: typed.priceAdult ?? typed.totalPrice ?? typed.pricePerPerson,
      childPrice: typed.priceChild,
      fixedPrice: typed.fixedPrice,
      adults,
      kids,
      elderly,
    });
  }
  if (category === "activities" || category === "events" || category === "suggestions") {
    return travelerPriceTotal({
      adultPrice: typed.priceAdult ?? typed.totalPrice ?? typed.price ?? typed.priceFrom,
      childPrice: typed.priceChild,
      fixedPrice: typed.fixedPrice,
      adults,
      kids,
      elderly,
    });
  }
  return typeof typed.totalPrice === "number" ? typed.totalPrice : null;
}

function badgeToneClasses(label?: string) {
  if (label === "Luxury") return "bg-[#7c4dff] text-white shadow-[0_0_18px_rgba(124,77,255,0.35)]";
  if (label === "Cheap") return "bg-[#2fbf71] text-white shadow-[0_0_18px_rgba(47,191,113,0.25)]";
  return "bg-[#ff7a00] text-black shadow-[0_0_18px_rgba(255,122,0,0.35)]";
}

function buildAiTip(itemName: string, label: RecommendationLabel, provider: string) {
  if (label === "Luxury") return `Book ${itemName} earlier to secure premium inventory. ${provider} supply is limited at peak dates.`;
  if (label === "Cheap") return `Book ${itemName} in lower-demand windows for stronger savings.`;
  return `Book ${itemName} around 2-4 weeks ahead for better value. ${provider} data supports this range.`;
}

function classifyRecommendationLabel(inputs: UserTripInput, itemTotal: number, qualitySignal: number, text: string): RecommendationLabel {
  const customerBudget = Math.max(inputs.budget || 1, 1);
  const relative = itemTotal / customerBudget;
  const prefersLuxury = /luxury|premium|5 star|business|first/i.test(`${inputs.travelStyle} ${inputs.hotelClass} ${inputs.cabinClass || ""}`);
  if (relative > 0.18 || qualitySignal >= 90 || (prefersLuxury && relative > 0.12) || /suite|spa|executive|luxury/i.test(text)) return "Luxury";
  if (relative < 0.1 || qualitySignal <= 84) return "Cheap";
  return "Best Value";
}

function buildPersonalityTags(inputs: UserTripInput, text: string) {
  const personalities = inputs.tripPersonality || [];
  const lowered = text.toLowerCase();
  const tags: string[] = [];
  if (personalities.includes("Luxury") && /luxury|suite|private|palace|premium|executive/.test(lowered)) tags.push("Luxury fit");
  if (personalities.includes("Photography Lover") && /view|sunset|rooftop|panorama|scenic|garden/.test(lowered)) tags.push("Best for photography");
  if (personalities.includes("Nightlife Lover") && /night|bar|lounge|evening|late/.test(lowered)) tags.push("Nightlife friendly");
  if (personalities.includes("Hidden Gems") && /boutique|local|market|bazaar|hidden|old town/.test(lowered)) tags.push("Hidden gem");
  if (personalities.includes("Famous Places") && /museum|pyramids|acropolis|landmark|iconic|palace/.test(lowered)) tags.push("Iconic landmark route");
  return tags;
}

function buildEnergyTags(inputs: UserTripInput, text: string) {
  const signals = inputs.energyFatigueSignals || [];
  const lowered = text.toLowerCase();
  const tags: string[] = [];
  if (signals.includes("Walking Overload") && /indoor|private|central|easy|museum|lounge/.test(lowered)) tags.push("Low walking plan");
  if (signals.includes("Heat Stress") && /indoor|cafe|museum|lounge|cruise/.test(lowered)) tags.push("Heat-safe timing");
  if (signals.includes("Kid Fatigue") && /family|garden|easy|cruise|cafe/.test(lowered)) tags.push("Kid-friendly pacing");
  if (signals.includes("Elderly Fatigue") && /private|comfort|central|easy|executive/.test(lowered)) tags.push("Elderly comfort");
  if (signals.includes("Jet Lag Effect") && /hotel|lounge|cafe|transfer/.test(lowered)) tags.push("Jet lag recovery");
  return tags;
}

function buildHotelUpgrades(item: HotelRecommendation): HotelUpgrade[] {
  const names = ["Deluxe Room", "Sea View", "Breakfast included", "Suite", "Free cancellation"];
  const prices = [25, 40, 18, 85, 14];
  return names.map((name, index) => ({
    id: `${item.id}-upgrade-${index + 1}`,
    name,
    extraPrice: prices[index],
    totalPrice: item.nightlyPrice + prices[index],
    available: true,
    providerData: { provider: item.provider },
  }));
}

function buildFlightUpgrades(item: FlightRecommendation) {
  return [
    { id: `${item.id}-flight-upgrade-1`, name: "Premium seat", extraPrice: 28, reason: "More comfort on longer travel windows." },
    { id: `${item.id}-flight-upgrade-2`, name: "Priority baggage", extraPrice: 34, reason: "Faster airport flow with less waiting." },
    { id: `${item.id}-flight-upgrade-3`, name: "Flexible change", extraPrice: 42, reason: "Useful if your route timing may shift." },
  ].map((upgrade) => ({
    ...upgrade,
    totalPrice: item.fare + upgrade.extraPrice,
    available: true,
  }));
}

function buildBaggageInfo(weight: number, allowance: number, fee: number) {
  const extraWeight = Math.max(weight - allowance, 0);
  return {
    allowedWeight: allowance,
    customerWeight: weight,
    extraWeight,
    extraPrice: fee,
    note: extraWeight > 0 ? `Your selected baggage exceeds economy allowance by ${extraWeight}lb.` : "Your selected baggage is within the included allowance.",
  };
}

function toTripInput(planInput: any): UserTripInput {
  const raw = planInput.rawInput || {};
  const rawDestinations = Array.isArray(raw?.trip?.destinations) ? raw.trip.destinations : [];
  return {
    destination: planInput.destination,
    departureCity: planInput.departureCity,
    startDate: planInput.startDate,
    endDate: planInput.endDate,
    budget: planInput.totalBudget,
    currency: "USD",
    travelStyle: raw?.style?.travelStyles?.join(", ") || planInput.travelLevel || "balanced",
    travelersCount: planInput.travelersCount,
    travelerType: planInput.travelersType,
    hotelClass: raw?.stay?.hotelStars ? `${raw.stay.hotelStars} star` : "4 star",
    interests: Array.isArray(planInput.interests) ? planInput.interests : [],
    preferredTransport: planInput.transportType || raw?.transport?.transportType || "taxi",
    walkingTolerance: planInput.walkingTolerance ?? raw?.constraints?.walkingTolerance ?? 60,
    specialRequests: [planInput.specialOccasion, raw?.constraints?.hardConstraints].filter(Boolean).join(" | "),
    multiDestinations: Boolean(raw?.trip?.multiDestinations || rawDestinations.length > 1),
    destinations: rawDestinations.map((item: any, index: number) => ({
      id: item?.id || `destination-${index + 1}`,
      country: item?.country || "",
      city: item?.city || "",
      preferredHotel: item?.preferredHotel || "",
      startDate: item?.startDate || "",
      endDate: item?.endDate || "",
      durationNights: Number(item?.durationNights ?? 0),
      transportType: item?.transportType || "",
      shoppingFocus: item?.shoppingFocus || "",
    })),
    tripsPerDay: Number(raw?.trip?.tripsPerDay ?? 3),
    noTripDays: Number(raw?.trip?.noTripDays ?? 0),
    daysWithoutTrips: Array.isArray(raw?.trip?.daysWithoutTrips) ? raw.trip.daysWithoutTrips : [],
    preferredHotels: Array.isArray(raw?.stay?.preferredHotels) ? raw.stay.preferredHotels : [],
    flexibleDates: Boolean(raw?.trip?.flexibleDates ?? raw?.trip?.isFlexibleDates),
    budgetIncludesFlights: Boolean(raw?.budget?.budgetIncludesFlights ?? raw?.budget?.includeFlights),
    flightBudget: Number(raw?.budget?.flightBudget ?? 0),
    baggageWeight: Number(raw?.budget?.baggageWeight ?? 0),
    shoppingBudget: Number(raw?.budget?.shoppingBudget ?? planInput.shoppingBudget ?? 0),
    emergencyBufferEnabled: Boolean(raw?.budget?.emergencyBuffer),
    paceLevel: Number(raw?.style?.paceLevel ?? planInput.paceLevel ?? 50),
    priorities: Array.isArray(raw?.style?.priorities) ? raw.style.priorities : [],
    tripPersonality: Array.isArray(raw?.style?.tripPersonality) ? raw.style.tripPersonality : [],
    stayType: raw?.stay?.stayType || "",
    roomCount: Number(raw?.stay?.roomCount ?? planInput.roomCount ?? 1),
    breakfastIncluded: Boolean(raw?.stay?.breakfastIncluded),
    amenities: Array.isArray(raw?.stay?.amenities) ? raw.stay.amenities : [],
    directFlightsOnly: Boolean(raw?.flight?.directFlightsOnly),
    preferredAirlines: raw?.flight?.preferredAirlines || "",
    cabinClass: raw?.flight?.cabinClass || "",
    flightTimePreference: raw?.flight?.flightTimePreference || "",
    maxLayoverHours: Number(raw?.flight?.maxLayoverHours ?? 0),
    maxTravelTimeBetweenPlaces: Number(raw?.transport?.maxTravelTimeBetweenPlaces ?? 0),
    mustDoList: raw?.activities?.mustDoList || "",
    avoidList: raw?.activities?.avoidList || "",
    activityIntensity: raw?.activities?.activityIntensity || "",
    mobilityNeeds: raw?.constraints?.mobilityNeeds || "",
    wakeUpTime: raw?.constraints?.wakeUpTime || "",
    dailyActiveHours: Number(raw?.constraints?.dailyActiveHours ?? 0),
    needsRestTime: Boolean(raw?.constraints?.needsRestTime),
    foodPreferences: Array.isArray(raw?.constraints?.foodPreferences) ? raw.constraints.foodPreferences : [],
    energyFatigueSignals: Array.isArray(raw?.constraints?.energyFatigueSignals) ? raw.constraints.energyFatigueSignals : [],
    adults: Number(planInput.adults ?? raw?.trip?.adults ?? 0),
    kids: Number(planInput.kids ?? raw?.trip?.kids ?? 0),
    elderly: Number(planInput.elderly ?? raw?.trip?.elderly ?? 0),
    fullInput: raw,
  };
}

function buildGroups(inputs: UserTripInput, recommendation: Props["recommendation"], hiddenGems: HiddenGemResult[] = []) {
  const destinations = inputs.destinations?.length ? inputs.destinations : [{ id: "primary-destination", city: inputs.departureCity || inputs.destination, country: inputs.destination }];
  const allowance = getCabinAllowance(inputs.cabinClass);
  const baggageWeight = Number(inputs.baggageWeight ?? 0);
  const baggageFee = inputs.budgetIncludesFlights && baggageWeight > 0 ? calculateBagCost(baggageWeight) : 0;
  const attachDestination = <T extends { id: string }>(items: T[]) =>
    items.map((item, index) => ({
      ...item,
      destinationId: destinations[Math.min(index, destinations.length - 1)]?.id,
      destinationLabel: `${destinations[Math.min(index, destinations.length - 1)]?.city}, ${destinations[Math.min(index, destinations.length - 1)]?.country}`,
    }));

  const decorate = <T extends { confidenceScore: number; provider: string; name: string }>(item: T, price: number, category: string) => {
    const aiLabel = classifyRecommendationLabel(inputs, price, item.confidenceScore, `${category} ${item.name}`);
    return {
      ...item,
      aiLabel,
      badge: aiLabel,
      aiTip: buildAiTip(item.name, aiLabel, item.provider),
      fitTags: [
        ...buildPersonalityTags(inputs, `${item.name} ${category}`),
      ...buildEnergyTags(inputs, `${item.name} ${category}`),
        ...("fitTags" in item && Array.isArray((item as any).fitTags) ? ((item as any).fitTags as string[]) : []),
      ].slice(0, 3),
      basePrice: price,
      totalPrice: price,
      affiliateUrl: (item as any).deepLink || null,
      isBookable: Boolean((item as any).deepLink),
    };
  };

  return {
    hotels: attachDestination(
      rankRecommendationsWithAI("hotel", inputs, mockHotels).slice(0, Math.max(4, destinations.length * 2)).map((item, i) =>
        decorate({ ...item, name: recommendation.hotels?.[i]?.name || item.name, locationLabel: recommendation.hotels?.[i]?.location || item.locationLabel, aiReason: recommendation.hotels?.[i]?.reason || item.aiReason, upgrades: buildHotelUpgrades(item), selectedUpgrade: null }, item.nightlyPrice, "hotel"),
      ),
    ),
    flights: inputs.budgetIncludesFlights
      ? attachDestination(
          rankRecommendationsWithAI("flight", inputs, mockFlights).slice(0, Math.max(4, destinations.length * 2)).map((item, i) =>
            decorate(
              {
                ...item,
                name: recommendation.flights?.[i]?.name || item.name,
                route: recommendation.flights?.[i]?.route || item.route,
                aiReason: recommendation.flights?.[i]?.reason || item.aiReason,
                baggageAllowanceLbs: allowance,
                declaredBaggageWeightLbs: baggageWeight,
                baggageFee,
                baggageExtraPrice: baggageFee,
                totalFare: item.fare + baggageFee,
                baggageInfo: buildBaggageInfo(baggageWeight, allowance, baggageFee),
              },
              item.fare + baggageFee,
              "flight",
            ),
          ),
        )
      : [],
    activities: attachDestination(rankRecommendationsWithAI("activity", inputs, mockActivities).slice(0, Math.max(8, destinations.length * 4)).map((item, i) => decorate({ ...item, name: recommendation.activities?.[i]?.name || item.name, categoryLabel: recommendation.activities?.[i]?.category || item.categoryLabel, aiReason: recommendation.activities?.[i]?.reason || item.aiReason }, item.price, "activity"))),
    restaurants: attachDestination(rankRecommendationsWithAI("restaurant", inputs, mockRestaurants).slice(0, Math.max(6, destinations.length * 3)).map((item) => decorate(item, item.pricePerPerson, "restaurant"))),
    transports: attachDestination(rankRecommendationsWithAI("transport", inputs, mockTransports).slice(0, Math.max(4, destinations.length * 2)).map((item) => decorate(item, item.cost, "transport"))),
    cars: attachDestination(rankRecommendationsWithAI("car", inputs, mockCars).slice(0, Math.max(4, destinations.length * 2)).map((item) => decorate(item, item.dailyPrice, "car"))),
    hiddenGems: attachDestination(hiddenGems.map((item) => ({ ...item, name: item.title, aiTip: item.aiTip || (item.bestTime ? `Best time ${item.bestTime}.` : ""), fitTags: [...buildPersonalityTags(inputs, `${item.title} ${item.description}`), ...buildEnergyTags(inputs, `${item.title} ${item.description}`), ...(item.tags || item.fitTags || [])].slice(0, 4) }))),
  };
}

function defaultSelectedForStop(stop: any, includeFlights: boolean): SelectedRecommendations {
  return {
    hotel: stop?.hotels?.[0] ?? null,
    flight: includeFlights ? stop?.flights?.[0] ?? null : null,
    activities: stop?.activities?.slice(0, 2) ?? [],
    restaurant: stop?.restaurants?.[0] ?? null,
    transport: stop?.transport?.[0] ?? null,
    car: stop?.cars?.[0] ?? null,
    hiddenGems: stop?.hiddenGems?.slice(0, 1) ?? [],
  };
}

function TopMetricCard({
  icon,
  label,
  value,
  note,
  highlight,
  className = "",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note: string;
  highlight?: boolean;
  className?: string;
}) {
  return (
    <div className={`rounded-[22px] border px-4 py-3 ${highlight ? "border-[#ff7a00]/28 bg-[linear-gradient(180deg,rgba(255,122,0,0.14),rgba(0,0,0,0.16))]" : "border-white/10 bg-black"} ${className}`}>
      <div className="flex min-h-[68px] items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#ff7a00]/20 bg-[#ff7a00]/08 text-[#ffb256] shadow-[0_0_18px_rgba(255,122,0,0.08)]">{icon}</span>
        <div className="min-w-0">
          <div className="text-[12px] text-white/46">{label}</div>
          <div className="mt-1 text-[17px] font-semibold text-white">{value}</div>
          <div className="mt-1 text-[12px] leading-5 text-white/58">{note}</div>
        </div>
      </div>
    </div>
  );
}

function RecommendationRowCard({
  title,
  subtitle,
  imageUrl,
  badge,
  badgeTone,
  badges = [],
  price,
  priceDetail,
  meta = [],
  active,
  onSelect,
  onUpgrade,
  aiTip,
  compactNote,
}: {
  title: string;
  subtitle: string;
  imageUrl?: string;
  badge?: string;
  badgeTone?: string;
  badges?: { label: string; tone?: string }[];
  price: string;
  priceDetail?: string;
  meta?: string[];
  active?: boolean;
  onSelect: () => void;
  onUpgrade?: () => void;
  aiTip?: string;
  compactNote?: string;
}) {
  return (
    <article className={`group min-w-[246px] max-w-[246px] overflow-hidden rounded-[18px] border bg-black transition duration-300 ${active ? "border-[#ff7a00]/48 shadow-[0_0_34px_rgba(255,122,0,0.18)]" : "border-white/10 hover:border-white/18"}`}>
      <div className="relative h-[150px]">
        <img src={imageUrl || "/recommendation-bg.jpg"} alt={title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(5,5,5,0.08)_35%,rgba(5,5,5,0.82)_100%)]" />
        {badges.length || badge ? (
          <div className="absolute left-3 top-3 flex max-w-[88%] flex-wrap gap-1.5">
            {[...(badge ? [{ label: badge, tone: badgeTone }] : []), ...badges].slice(0, 3).map((badge) => (
              <div key={`${title}-${badge.label}`} className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${badge.tone || badgeToneClasses(badge.label)}`}>
                {badge.label}
              </div>
            ))}
          </div>
        ) : null}
        {aiTip ? <div className="absolute bottom-3 right-3 rounded-full border border-white/10 bg-black/55 px-2 py-1 text-[10px] text-[#ffbe7d]" title={aiTip}>Tip</div> : null}
      </div>
      <div className="p-3.5">
        <div className="text-[15px] font-medium leading-5 text-white">{title}</div>
        <div className="mt-1 text-[12px] leading-5 text-white/58">{subtitle}</div>
        <div className="mt-2.5 flex min-h-[34px] flex-wrap gap-2.5 text-[11px] text-white/58">
          {meta.filter(Boolean).slice(0, 3).map((item) => (
            <span key={`${title}-${item}`} className="inline-flex items-center gap-1">
              <Star size={11} className="text-[#ff9d4d]" />
              {item}
            </span>
          ))}
        </div>
        <div className="mt-3 min-h-[30px] text-[11px] text-white/52">{priceDetail || "\u00A0"}</div>
        {compactNote ? <div className="text-[11px] text-[#ffb15b]">{compactNote}</div> : null}
        <div className="mt-1.5 flex items-end justify-between gap-3">
          <div className="text-[17px] font-semibold text-white">{price}</div>
          <div className="flex items-center gap-2">
            {onUpgrade ? (
              <button type="button" onClick={onUpgrade} className="rounded-[10px] border border-[#ff7a00]/45 px-3 py-1.5 text-[12px] font-medium text-[#ffae57] transition hover:bg-[#ff7a00]/10">
                Upgrade
              </button>
            ) : null}
            <button type="button" onClick={onSelect} className={`rounded-[10px] border px-3.5 py-1.5 text-[13px] font-medium transition ${active ? "border-[#ff7a00] bg-[#ff7a00] text-black shadow-[0_0_16px_rgba(255,122,0,0.2)]" : "border-[#ff7a00]/52 bg-transparent text-[#ffae57] hover:bg-[#ff7a00]/10 hover:shadow-[0_0_14px_rgba(255,122,0,0.12)]"}`}>
              {active ? "Selected" : "Add"}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function RecommendationRow({ icon, title, count, children }: { icon: React.ReactNode; title: string; count: number; children: React.ReactNode }) {
  return (
    <section className="rounded-[24px] border border-white/10 bg-black p-[18px] shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#ff7a00]/22 bg-[#ff7a00]/08 text-[#ffb256] shadow-[0_0_16px_rgba(255,122,0,0.08)]">{icon}</span>
          <div className="flex items-center gap-3">
            <h2 className="text-[18px] font-medium leading-none text-white md:text-[19px]">{title}</h2>
            <span className="text-[13px] font-medium text-[#ffb15b] drop-shadow-[0_0_10px_rgba(255,122,0,0.22)]">See all ({count})</span>
          </div>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <button type="button" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70"><ChevronLeft size={15} /></button>
          <button type="button" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70"><ChevronRight size={15} /></button>
        </div>
      </div>
      <div className="mt-5 flex gap-3.5 overflow-x-auto pb-2 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.18)_transparent]">{children}</div>
    </section>
  );
}

function ConfirmationModal({
  title,
  description,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
}: {
  title: string;
  description: string;
  primaryLabel: string;
  secondaryLabel: string;
  onPrimary: () => void;
  onSecondary: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-[520px] rounded-[24px] border border-[#ff7a00]/24 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(0,0,0,0.94))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.4)]">
        <div className="text-[24px] font-medium text-white">{title}</div>
        <p className="mt-3 text-[14px] leading-6 text-white/62">{description}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onSecondary} className="rounded-[14px] border border-white/10 bg-black px-4 py-3 text-[14px] text-white/78 transition hover:border-[#ff7a00]/34 hover:bg-[#ff7a00]/08 hover:text-white">
            {secondaryLabel}
          </button>
          <button type="button" onClick={onPrimary} className="rounded-[14px] border border-[#ff7a00] bg-[#ff7a00] px-4 py-3 text-[14px] font-medium text-black shadow-[0_0_18px_rgba(255,122,0,0.18)] transition hover:brightness-105">
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RecommendationWorkspace({ planId, planInput, recommendation, hiddenGems = [] }: Props) {
  const router = useRouter();
  const inputs = useMemo(() => toTripInput(planInput), [planInput]);
  const groups = useMemo(() => buildGroups(inputs, recommendation, hiddenGems), [hiddenGems, inputs, recommendation]);
  const destinations = useMemo(
    () =>
      inputs.destinations?.length
        ? inputs.destinations
        : [{ id: "primary-destination", city: inputs.departureCity || inputs.destination, country: inputs.destination, startDate: inputs.startDate, endDate: inputs.endDate }],
    [inputs],
  );
  const perStopSections = useMemo(
    () =>
      destinations.map((destination) => ({
        id: destination.id,
        title: `${destination.city}, ${destination.country}`,
        city: destination.city,
        country: destination.country,
        startDate: destination.startDate || inputs.startDate,
        endDate: destination.endDate || inputs.endDate,
        hotels: groups.hotels.filter((item) => item.destinationId === destination.id).slice(0, 6),
        flights: groups.flights.filter((item) => item.destinationId === destination.id).slice(0, 6),
        activities: groups.activities.filter((item) => item.destinationId === destination.id).slice(0, 6),
        restaurants: groups.restaurants.filter((item) => item.destinationId === destination.id).slice(0, 6),
        transport: groups.transports.filter((item) => item.destinationId === destination.id).slice(0, 4),
        cars: groups.cars.filter((item) => item.destinationId === destination.id).slice(0, 4),
        hiddenGems: groups.hiddenGems.filter((item) => item.destinationId === destination.id).slice(0, 4),
      })),
    [destinations, groups.activities, groups.cars, groups.flights, groups.hiddenGems, groups.hotels, groups.restaurants, groups.transports, inputs.endDate, inputs.startDate],
  );
  const [selectedByDestination, setSelectedByDestination] = useState<DestinationSelectionMap>({});
  const [activityDays, setActivityDays] = useState<Record<string, number>>({});
  const [itemDayOverrides, setItemDayOverrides] = useState<Record<string, number>>({});
  const [removedItemIds, setRemovedItemIds] = useState<string[]>([]);
  const [activeStopId, setActiveStopId] = useState<string | null>(perStopSections[0]?.id ?? null);
  const [activeDestinationTab, setActiveDestinationTab] = useState<DestinationTab>("all");
  const [selectedTripStyle, setSelectedTripStyle] = useState(() => inferStyleFromInputs(inputs));
  const [activeCategory, setActiveCategory] = useState<FlowCategory>(inputs.budgetIncludesFlights ? "flights" : "stays");
  const [expandedSections, setExpandedSections] = useState<FlowCategory[]>([inputs.budgetIncludesFlights ? "flights" : "stays"]);
  const [upgradePanel, setUpgradePanel] = useState<UpgradePanelState>(null);
  const [confirmation, setConfirmation] = useState<ConfirmationState>(null);
  const [extraSelections, setExtraSelections] = useState<ExtraSelectionsState>({});
  const [editableDayPlan, setEditableDayPlan] = useState<RecommendationPayload["dayPlan"]>([]);

  useEffect(() => {
    trackAnalyticsEvent("recommendation_viewed", {
      planId,
      destination: planInput?.destination ?? null,
      destinationsCount: inputs.destinations?.length || 0,
    });
  }, [inputs.destinations?.length, planId, planInput?.destination]);

  useEffect(() => {
    if (!activeStopId && perStopSections[0]?.id) setActiveStopId(perStopSections[0].id);
  }, [activeStopId, perStopSections]);

  useEffect(() => {
    setExpandedSections([inputs.budgetIncludesFlights ? "flights" : "stays"]);
  }, [inputs.budgetIncludesFlights]);

  useEffect(() => {
    setSelectedTripStyle(inferStyleFromInputs(inputs));
  }, [inputs]);

  useEffect(() => {
    if (!perStopSections.length) return;
    setSelectedByDestination((current) => {
      const next: DestinationSelectionMap = {};
      perStopSections.forEach((stop) => {
        next[stop.id] = current[stop.id] || defaultSelectedForStop(stop, Boolean(inputs.budgetIncludesFlights));
      });
      return next;
    });
    setActivityDays({});
    setItemDayOverrides({});
    setRemovedItemIds([]);
    setExtraSelections({});
  }, [inputs.budgetIncludesFlights, perStopSections]);

  const currentStop = useMemo(() => perStopSections.find((stop) => stop.id === activeStopId) ?? perStopSections[0] ?? null, [activeStopId, perStopSections]);
  const visibleStops = useMemo(
    () => (activeDestinationTab === "all" ? perStopSections : perStopSections.filter((stop) => stop.id === activeDestinationTab)),
    [activeDestinationTab, perStopSections],
  );
  const currentSelected = useMemo(() => (currentStop ? selectedByDestination[currentStop.id] || defaultSelectedForStop(currentStop, Boolean(inputs.budgetIncludesFlights)) : EMPTY_SELECTED), [currentStop, inputs.budgetIncludesFlights, selectedByDestination]);
  const selected = useMemo<SelectedRecommendations>(
    () => ({
      hotel: perStopSections.map((stop) => selectedByDestination[stop.id]?.hotel).find(Boolean) ?? null,
      flight: perStopSections.map((stop) => selectedByDestination[stop.id]?.flight).find(Boolean) ?? null,
      activities: perStopSections.flatMap((stop) => selectedByDestination[stop.id]?.activities || []).slice(0, 16),
      restaurant: perStopSections.map((stop) => selectedByDestination[stop.id]?.restaurant).find(Boolean) ?? null,
      transport: perStopSections.map((stop) => selectedByDestination[stop.id]?.transport).find(Boolean) ?? null,
      car: perStopSections.map((stop) => selectedByDestination[stop.id]?.car).find(Boolean) ?? null,
      hiddenGems: perStopSections.flatMap((stop) => selectedByDestination[stop.id]?.hiddenGems || []).slice(0, 10),
    }),
    [perStopSections, selectedByDestination],
  );

  useEffect(() => {
    let cancelled = false;
    generateAiDayPlan(selected, inputs, { activityDays, itemDayOverrides, hiddenItemIds: removedItemIds }).then((plan) => {
      if (!cancelled) setEditableDayPlan(plan);
    });
    return () => {
      cancelled = true;
    };
  }, [activityDays, inputs, itemDayOverrides, removedItemIds, selected]);

  const modules = useMemo(() => buildAnalysisModules(selected, inputs, editableDayPlan), [editableDayPlan, inputs, selected]);
  const analysis = useMemo(() => buildAnalysisInsights(selected, inputs, editableDayPlan), [editableDayPlan, inputs, selected]);
  const payload: RecommendationPayload = useMemo(
    () =>
      enrichRecommendationPayloadWithLiveBooking({
        inputs,
        groups,
        selected,
        selectedByDestination,
        dayPlan: editableDayPlan,
        analysis,
        modules,
        createdAt: new Date().toISOString(),
        planId,
        mode: recommendation.rawAi?.fallback ? "provider-fallback" : "ai",
        aiSummary: recommendation.summary,
        summaryState: { budget: buildBudgetSettings({ inputs, selected, dayPlan: editableDayPlan, summaryState: undefined }), resources: buildDestinationResources(destinations as TripDestination[]) },
      }),
    [analysis, destinations, editableDayPlan, groups, inputs, modules, planId, recommendation.rawAi?.fallback, recommendation.summary, selected, selectedByDestination],
  );
  const sessionPayload = useMemo(() => ({ ...payload, extraSelections, activeDestinationTab, selectedTripStyle }), [activeDestinationTab, extraSelections, payload, selectedTripStyle]);

  useEffect(() => {
    sessionStorage.setItem("gene-recommendation-payload", JSON.stringify(sessionPayload));
  }, [sessionPayload]);

  function updateStopSelection(stopId: string, updater: (current: SelectedRecommendations) => SelectedRecommendations) {
    setSelectedByDestination((current) => ({
      ...current,
      [stopId]: updater(current[stopId] || defaultSelectedForStop(perStopSections.find((stop) => stop.id === stopId), Boolean(inputs.budgetIncludesFlights))),
    }));
  }

  function getExtraSelections(stopId: string) {
    return extraSelections[stopId] || { hotels: [], flights: [] };
  }

  function getSelectedHotels(stopId: string) {
    const primary = selectedByDestination[stopId]?.hotel;
    return [primary, ...getExtraSelections(stopId).hotels].filter(Boolean) as HotelRecommendation[];
  }

  function getSelectedFlights(stopId: string) {
    const primary = selectedByDestination[stopId]?.flight;
    return [primary, ...getExtraSelections(stopId).flights].filter(Boolean) as FlightRecommendation[];
  }

  function toggleSection(section: FlowCategory) {
    setActiveCategory(section);
    setExpandedSections((current) => (current.includes(section) ? current : [...current, section]));
  }

  function openNextSection(section: FlowCategory) {
    const ordered: FlowCategory[] = inputs.budgetIncludesFlights ? ["flights", "stays", "activities", "events", "restaurants", "transport"] : ["stays", "activities", "events", "restaurants", "transport"];
    const next = ordered[ordered.indexOf(section) + 1];
    if (next) toggleSection(next);
  }

  function jumpToDestination(stopId: string) {
    setActiveDestinationTab(stopId);
    setActiveStopId(stopId);
  }

  function pickActivity(item: ActivityRecommendation) {
    if (!currentStop) return;
    updateStopSelection(currentStop.id, (current) => ({
      ...current,
      activities: current.activities.some((value) => value.id === item.id) ? current.activities.filter((value) => value.id !== item.id) : [...current.activities, item].slice(0, 5),
    }));
    toggleSection("restaurants");
  }

  function pickHiddenGem(item: HiddenGemResult) {
    if (!currentStop) return;
    updateStopSelection(currentStop.id, (current) => ({
      ...current,
      hiddenGems: current.hiddenGems.some((value) => value.id === item.id) ? current.hiddenGems.filter((value) => value.id !== item.id) : [...current.hiddenGems, item].slice(0, 3),
    }));
  }

  function selectHotel(stopId: string, item: HotelRecommendation) {
    const currentHotels = getSelectedHotels(stopId);
    const alreadySelected = currentHotels.some((hotel) => hotel.id === item.id);
    if (alreadySelected) {
      updateStopSelection(stopId, (current) => ({ ...current, hotel: current.hotel?.id === item.id ? null : current.hotel }));
      setExtraSelections((current) => ({
        ...current,
        [stopId]: {
          ...getExtraSelections(stopId),
          hotels: getExtraSelections(stopId).hotels.filter((hotel) => hotel.id !== item.id),
        },
      }));
      return;
    }
    if (currentHotels.length) {
      const stop = perStopSections.find((entry) => entry.id === stopId);
      setConfirmation({ kind: "duplicate", selectionType: "hotel", stopId, destinationName: stop?.title || "this destination", item });
      return;
    }
    updateStopSelection(stopId, (current) => ({ ...current, hotel: item }));
    toggleSection("activities");
  }

  function selectFlight(stopId: string, item: FlightRecommendation) {
    const currentFlights = getSelectedFlights(stopId);
    const alreadySelected = currentFlights.some((flight) => flight.id === item.id);
    if (alreadySelected) {
      updateStopSelection(stopId, (current) => ({ ...current, flight: current.flight?.id === item.id ? null : current.flight }));
      setExtraSelections((current) => ({
        ...current,
        [stopId]: {
          ...getExtraSelections(stopId),
          flights: getExtraSelections(stopId).flights.filter((flight) => flight.id !== item.id),
        },
      }));
      return;
    }
    if (currentFlights.length) {
      const stop = perStopSections.find((entry) => entry.id === stopId);
      setConfirmation({ kind: "duplicate", selectionType: "flight", stopId, destinationName: stop?.title || "this destination", item });
      return;
    }
    updateStopSelection(stopId, (current) => ({ ...current, flight: item }));
    toggleSection("stays");
  }

  function applyDuplicateSelection() {
    if (!confirmation || confirmation.kind !== "duplicate") return;
    if (confirmation.selectionType === "hotel") {
      const extras = getExtraSelections(confirmation.stopId);
      setExtraSelections((current) => ({
        ...current,
        [confirmation.stopId]: {
          ...extras,
          hotels: [...extras.hotels, confirmation.item as HotelRecommendation],
        },
      }));
      updateStopSelection(confirmation.stopId, (current) => ({ ...current, hotel: current.hotel || (confirmation.item as HotelRecommendation) }));
    } else {
      const extras = getExtraSelections(confirmation.stopId);
      setExtraSelections((current) => ({
        ...current,
        [confirmation.stopId]: {
          ...extras,
          flights: [...extras.flights, confirmation.item as FlightRecommendation],
        },
      }));
      updateStopSelection(confirmation.stopId, (current) => ({ ...current, flight: current.flight || (confirmation.item as FlightRecommendation) }));
    }
    setConfirmation(null);
  }

  function closeConfirmation() {
    setConfirmation(null);
  }

  function triggerBestForChoice() {
    const targetStops = activeDestinationTab === "all" ? perStopSections : visibleStops;
    targetStops.forEach((stop) => {
      const bestFlight = visibleItems(stop.flights || [], (item) => item.totalFare || item.fare)[0] || null;
      const bestHotel = visibleItems(stop.hotels || [], (item) => item.nightlyPrice)[0] || null;
      const bestTransport = visibleItems([...(stop.transport || []), ...(stop.cars || [])] as any[], (item: any) => ("cost" in item ? item.cost : item.dailyPrice))[0] || null;
      const bestActivity = visibleItems(stop.activities || [], (item) => item.price)[0] || null;
      const bestEvent = visibleItems(stop.hiddenGems || [], (item) => item.priceFrom || item.totalPrice || 0)[0] || null;
      const bestRestaurant = visibleItems(stop.restaurants || [], (item) => item.pricePerPerson)[0] || null;
      updateStopSelection(stop.id, (current) => ({
        ...current,
        flight: inputs.budgetIncludesFlights ? bestFlight || current.flight : current.flight,
        hotel: bestHotel || current.hotel,
        transport: bestTransport && "cost" in bestTransport ? bestTransport : current.transport,
        car: bestTransport && "dailyPrice" in bestTransport ? bestTransport : current.car,
        activities: bestActivity ? [bestActivity] : current.activities,
        hiddenGems: bestEvent ? [bestEvent] : current.hiddenGems,
        restaurant: bestRestaurant || current.restaurant,
      }));
    });
  }

  function goDayByDay() {
    trackAnalyticsEvent("analysis_started", {
      planId,
      source: "recommendation_page",
    });
    const incompleteStop = perStopSections.find((stop) => {
      const current = selectedByDestination[stop.id] || EMPTY_SELECTED;
      return !current.hotel && !current.flight && !current.transport && !current.car && !current.activities.length && !current.hiddenGems.length && !current.restaurant;
    });
    if (incompleteStop) {
      setConfirmation({ kind: "missingDestination", stopId: incompleteStop.id, destinationName: incompleteStop.title });
      return;
    }
    const missingRequirementStop = perStopSections.find((stop) => {
      const current = selectedByDestination[stop.id] || EMPTY_SELECTED;
      if (inputs.budgetIncludesFlights && !current.flight) return true;
      if (!current.hotel) return true;
      return false;
    });
    if (missingRequirementStop) {
      const current = selectedByDestination[missingRequirementStop.id] || EMPTY_SELECTED;
      setConfirmation({
        kind: "missingRequirement",
        stopId: missingRequirementStop.id,
        destinationName: missingRequirementStop.title,
        missing: !current.hotel ? "hotel" : "flight",
      });
      return;
    }
    sessionStorage.setItem("gene-recommendation-payload", JSON.stringify(sessionPayload));
    router.push(`/ai/day-by-day?planId=${planId}`);
  }

  const setUpgradeTargetHotelId = (itemId: string | null) => {
    if (!itemId || !currentStop) {
      setUpgradePanel(null);
      return;
    }
    setUpgradePanel({ kind: "hotel", stopId: currentStop.id, itemId });
  };

  const styleSignals = {
    "Best for your choice": /.*/,
    Luxury: /luxury|private|suite|executive|fine|premium|palace|rooftop/i,
    Romantic: /sunset|cruise|boutique|garden|rooftop|fine dining|candle/i,
    Backpacking: /budget|metro|hostel|local|market|walk/i,
    Photography: /view|sunset|panorama|scenic|photo|rooftop|island/i,
    Foodie: /food|restaurant|cuisine|chef|cafe|market|dining/i,
    Adventure: /hike|desert|safari|cruise|outdoor|tour|island/i,
    Family: /family|easy|safe|garden|museum|cruise/i,
    Wellness: /spa|calm|wellness|lounge|relax|retreat/i,
  } as const;

  const matchesStyle = (item: any) => {
    if (selectedTripStyle === "Best for your choice") return true;
    const haystack = `${item.name || item.title} ${item.aiReason || ""} ${(item.fitTags || []).join(" ")}`;
    if (selectedTripStyle === "Luxury") return styleSignals.Luxury.test(haystack);
    if (selectedTripStyle === "Romantic") return styleSignals.Romantic.test(haystack);
    if (selectedTripStyle === "Backpacking") return styleSignals.Backpacking.test(haystack);
    if (selectedTripStyle === "Photography") return styleSignals.Photography.test(haystack);
    if (selectedTripStyle === "Foodie") return styleSignals.Foodie.test(haystack);
    if (selectedTripStyle === "Adventure") return styleSignals.Adventure.test(haystack);
    if (selectedTripStyle === "Family") return styleSignals.Family.test(haystack);
    return styleSignals.Wellness.test(haystack);
  };

  const rankForView = (item: any, price = 0) => {
    let score = item.confidenceScore ?? 70;
    if (matchesStyle(item)) score += 14;
    if (selectedTripStyle === "Luxury" && item.aiLabel === "Luxury") score += 12;
    if (selectedTripStyle === "Backpacking" || /budget/i.test(inputs.travelStyle)) score += Math.max(0, 150 - price) / 6;
    if (selectedTripStyle === "Family" && /kid|family|safe|garden|easy/i.test(`${item.name} ${(item.fitTags || []).join(" ")}`)) score += 10;
    if ((inputs.energyFatigueSignals || []).includes("Walking Overload") && /low walking|comfort|easy|indoor|central/i.test(`${item.name} ${(item.fitTags || []).join(" ")}`)) score += 10;
    return score;
  };

  const visibleItems = <T extends { name?: string; title?: string }>(items: T[], getPrice: (item: T) => number) =>
    [...items]
      .sort((left, right) => rankForView(right, getPrice(right)) - rankForView(left, getPrice(left)));

  const getSectionItems = (stop: (typeof perStopSections)[number], section: FlowCategory) => {
    if (section === "flights") return visibleItems(stop.flights || [], (item) => item.totalFare || item.fare);
    if (section === "stays") return visibleItems(stop.hotels || [], (item) => item.nightlyPrice);
    if (section === "activities") return visibleItems(stop.activities || [], (item) => item.price);
    if (section === "restaurants") return visibleItems(stop.restaurants || [], (item) => item.pricePerPerson);
    if (section === "transport") return visibleItems([...(stop.transport || []), ...(stop.cars || [])] as any[], (item: any) => ("cost" in item ? item.cost : item.dailyPrice));
    return visibleItems(stop.hiddenGems || [], (item) => item.priceFrom || item.totalPrice || 0);
  };

  const selectedTotalCost = Math.round(
    perStopSections.reduce((sum, stop) => {
      const current = selectedByDestination[stop.id] || EMPTY_SELECTED;
      return (
        sum +
        (getSelectedItemCost(current.hotel, inputs, "stays") ?? 0) +
        (getSelectedItemCost(current.flight, inputs, "flights") ?? 0) +
        getExtraSelections(stop.id).hotels.reduce((innerSum, hotel) => innerSum + (getSelectedItemCost(hotel, inputs, "stays") ?? 0), 0) +
        getExtraSelections(stop.id).flights.reduce((innerSum, flight) => innerSum + (getSelectedItemCost(flight, inputs, "flights") ?? 0), 0) +
        (getSelectedItemCost(current.transport, inputs, "transport") ?? 0) +
        (getSelectedItemCost(current.car, inputs, "transport") ?? 0) +
        (getSelectedItemCost(current.restaurant, inputs, "restaurants") ?? 0) +
        current.activities.reduce((innerSum, item) => innerSum + (getSelectedItemCost(item, inputs, "activities") ?? 0), 0) +
        current.hiddenGems.reduce((innerSum, item) => innerSum + (getSelectedItemCost(item, inputs, "suggestions") ?? 0), 0)
      );
    }, 0),
  );
  const budgetLevelInfo = getBudgetLevel(inputs.budget, selectedTotalCost);
  const travelerLabel = [inputs.adults ? `${inputs.adults} Adults` : "", inputs.kids ? `${inputs.kids} Child` : "", inputs.elderly ? `${inputs.elderly} Elderly` : ""].filter(Boolean).join(", ") || `${inputs.travelersCount} Travelers`;
  const aiTipSummary = currentSelected.hotel?.aiTip || currentSelected.flight?.aiTip || currentSelected.activities[0]?.aiTip || "Book early to get the best prices";
  const activeFilter = "Best for your choice";
  const previewReady = true;
  const stopChipData = perStopSections.map((stop) => ({
    ...stop,
    imageUrl: stop.hotels[0]?.imageUrl || stop.activities[0]?.imageUrl || stop.hiddenGems[0]?.imageUrl || stop.restaurants[0]?.imageUrl || "/recommendation-bg.jpg",
    dateLabel: `${formatTripDate(stop.startDate)} - ${formatTripDate(stop.endDate)}`,
  }));
  const topPicks = useMemo(
    () =>
      visibleStops.flatMap((stop) => {
        const current = selectedByDestination[stop.id] || EMPTY_SELECTED;
        const entries = [
          inputs.budgetIncludesFlights ? current.flight || getSectionItems(stop, "flights")[0] : null,
          current.hotel || getSectionItems(stop, "stays")[0],
          current.transport || current.car || getSectionItems(stop, "transport")[0],
          current.activities[0] || getSectionItems(stop, "activities")[0],
          current.hiddenGems[0] || getSectionItems(stop, "events")[0],
          current.restaurant || getSectionItems(stop, "restaurants")[0],
        ].filter(Boolean);
        return entries.map((item: any) => ({ ...item, stopId: stop.id }));
      }),
    [inputs.budgetIncludesFlights, selectedByDestination, visibleStops],
  );
  const suggestions = useMemo(
    () =>
      visibleItems(
        [
          ...(currentStop?.hiddenGems || []),
          ...(currentStop?.activities || []),
          ...(currentStop?.restaurants || []),
        ] as any[],
        (item: any) => item.totalPrice ?? item.price ?? item.pricePerPerson ?? item.priceFrom ?? 0,
      )
        .filter((item: any) => item.destinationId === currentStop?.id)
        .slice(0, 4),
    [currentStop],
  );
  const dayOverviewCards = stopChipData.map((stop, index) => {
    const current = selectedByDestination[stop.id] || EMPTY_SELECTED;
    const highlights = [
      ...getSelectedHotels(stop.id).map((item) => `Hotel: ${item.name}`),
      ...getSelectedFlights(stop.id).map((item) => `Flight: ${item.airline}`),
      ...(current.transport ? [`Transport: ${current.transport.name}`] : []),
      ...(current.car ? [`Car: ${current.car.name}`] : []),
      ...current.activities.slice(0, 2).map((item) => `Trip: ${item.name}`),
      ...current.hiddenGems.slice(0, 1).map((item) => `Event: ${item.title}`),
      ...(current.restaurant ? [`Dining: ${current.restaurant.name}`] : []),
    ];
    const durationDays = Math.max(1, Math.round((new Date(stop.endDate).getTime() - new Date(stop.startDate).getTime()) / 86400000) + 1);
    return {
      id: stop.id,
      title: stop.title,
      imageUrl: stop.imageUrl,
      dayRange: `Day ${index === 0 ? 1 : index * 4 + 1} - ${index === 0 ? durationDays : index * 4 + durationDays}`,
      body: highlights.join(" • ") || stop.activities.slice(0, 2).map((item) => item.name).join(" • ") || "Curated destination highlights",
    };
  });
  const upgradeTargetItem =
    upgradePanel?.kind === "hotel"
      ? groups.hotels.find((item) => item.id === upgradePanel.itemId) || currentStop?.hotels.find((item) => item.id === upgradePanel.itemId) || null
      : upgradePanel?.kind === "flight"
        ? groups.flights.find((item) => item.id === upgradePanel.itemId) || currentStop?.flights.find((item) => item.id === upgradePanel.itemId) || null
        : null;
  const upgradeTargetHotel = upgradePanel?.kind === "hotel" ? (upgradeTargetItem as HotelRecommendation | null) : null;
  const flightItems = currentStop ? getSectionItems(currentStop, "flights") : [];
  const hotelItems = currentStop ? getSectionItems(currentStop, "stays") : [];
  const activityItems = currentStop ? getSectionItems(currentStop, "activities") : [];
  const restaurantItems = currentStop ? getSectionItems(currentStop, "restaurants") : [];
  const transportItems = currentStop ? getSectionItems(currentStop, "transport") : [];
  const eventItems = currentStop ? getSectionItems(currentStop, "events") : [];
  const nextDestinationStop = (() => {
    const currentIndex = perStopSections.findIndex((stop) => stop.id === currentStop?.id);
    return currentIndex >= 0 ? perStopSections[currentIndex + 1] || null : null;
  })();

  return (
    <AiSuiteFrame activePage="recommendation" planId={planId}>
      <section className="space-y-6">
        <div className="grid gap-5 xl:grid-cols-[1fr_auto] xl:items-start">
          <div>
            <h1 className="text-[36px] font-semibold leading-none text-white">Recommendations</h1>
            <div className="mt-3 inline-flex items-center gap-2 text-[15px] text-white/70">
              <Sparkles size={16} className="text-[#ff9d4d]" />
              AI curated for your perfect trip
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 xl:justify-end">
            <div className="rounded-[18px] border border-white/10 bg-black px-4 py-3 text-[13px] text-white/78 shadow-[0_20px_40px_rgba(0,0,0,0.18)]">
              <div className="flex flex-wrap items-center gap-4">
                <span>{formatTripDate(inputs.startDate)} - {formatTripDate(inputs.endDate)}</span>
                <span className="text-white/42">|</span>
                <span>{travelerLabel}</span>
              </div>
            </div>
            <Link href={`/ai-planner?planId=${planId}`} className="rounded-[16px] border border-[#ff7a00]/48 bg-transparent px-5 py-3 text-[13px] font-medium text-[#ffb15b] shadow-[0_0_18px_rgba(255,122,0,0.08)] transition hover:bg-[#ff7a00]/10 hover:shadow-[0_0_22px_rgba(255,122,0,0.12)]">
              Edit Trip
            </Link>
          </div>
        </div>

        <div className="overflow-hidden rounded-[24px] border border-white/10 bg-black px-4 py-3 shadow-[0_24px_60px_rgba(0,0,0,0.24)]">
          <div className="mb-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveDestinationTab("all")}
              className={`rounded-full border px-3.5 py-2 text-[12px] font-medium transition ${activeDestinationTab === "all" ? "border-[#ff7a00]/58 bg-[#ff7a00]/16 text-[#ffc177] shadow-[0_0_24px_rgba(255,122,0,0.14)]" : "border-white/10 bg-black text-white/70 hover:border-[#ff7a00]/34 hover:bg-[#ff7a00]/08 hover:text-white"}`}
            >
              All destinations
            </button>
            {stopChipData.map((stop) => (
              <button
                key={`destination-pill-${stop.id}`}
                type="button"
                onClick={() => jumpToDestination(stop.id)}
                className={`rounded-full border px-3.5 py-2 text-[12px] font-medium transition ${activeDestinationTab === stop.id ? "border-[#ff7a00]/58 bg-[#ff7a00]/16 text-[#ffc177] shadow-[0_0_24px_rgba(255,122,0,0.14)]" : "border-white/10 bg-black text-white/70 hover:border-[#ff7a00]/34 hover:bg-[#ff7a00]/08 hover:text-white"}`}
              >
                {stop.city}
              </button>
            ))}
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none]">
            {stopChipData.map((stop) => (
              <button key={`destination-chip-${stop.id}`} type="button" onClick={() => jumpToDestination(stop.id)} className={`group flex min-w-[248px] items-center gap-3 rounded-[18px] border px-3 py-3 text-left transition ${currentStop?.id === stop.id ? "border-[#ff7a00]/55 bg-[linear-gradient(180deg,rgba(255,122,0,0.18),rgba(255,122,0,0.06))] shadow-[0_0_26px_rgba(255,122,0,0.15)]" : "border-white/10 bg-black hover:border-[#ff7a00]/35 hover:bg-[#ff7a00]/08"}`}>
                <div className="relative h-12 w-12 overflow-hidden rounded-[12px] border border-white/10 bg-white/5">
                  <img src={stop.imageUrl} alt={stop.title} className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[17px] font-medium text-white">{stop.title}</div>
                  <div className="mt-1 text-[13px] text-white/58">{stop.dateLabel}</div>
                </div>
                <div className="flex items-center gap-2 text-white/56">
                  <Pencil size={14} />
                  <X size={14} />
                </div>
              </button>
            ))}
            <Link href={`/ai-planner?planId=${planId}`} className="flex min-w-[210px] items-center justify-center rounded-[18px] border border-white/10 bg-black px-4 py-3 text-[16px] font-medium text-[#ffb15b] transition hover:border-[#ff7a00]/38 hover:bg-[#ff7a00]/08">
              <Plus size={15} className="mr-2" />
              Add Destination
            </Link>
          </div>
        </div>

        <div className="grid gap-[1px] overflow-hidden rounded-[20px] border border-white/10 bg-black xl:grid-cols-[1.02fr_0.98fr_1fr_1.18fr]">
          <TopMetricCard className="rounded-none border-0" icon={<Wallet size={18} />} label="Total Trip Cost" value={money(selectedTotalCost)} note={`For ${inputs.travelersCount} travelers`} />
          <TopMetricCard className="rounded-none border-0" icon={<ArrowLeftRight size={18} />} label="Budget Level" value={budgetLevelInfo.label} note={budgetLevelInfo.note} />
          <TopMetricCard className="rounded-none border-0" icon={<MoonStar size={18} />} label="Days Without Trips" value={`${inputs.daysWithoutTrips?.length || inputs.noTripDays || 0} Day${(inputs.daysWithoutTrips?.length || inputs.noTripDays || 0) === 1 ? "" : "s"}`} note="Rest & relax" />
          <TopMetricCard className="rounded-none border-0" icon={<Sparkles size={18} />} label="AI Tip" value="View tips" note={aiTipSummary} highlight />
        </div>

        <div className="rounded-[24px] border border-white/10 bg-black p-4 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-3">
                <Sparkles size={16} className="text-[#ff9d4d]" />
                <h2 className="text-[18px] font-medium text-white">One Click Style Switch</h2>
              </div>
              <p className="mt-1 text-[13px] text-white/58">Instantly update your itinerary to match your travel style.</p>
            </div>
            <button type="button" className="rounded-full border border-[#ff7a00]/34 px-4 py-2 text-[13px] text-[#ffb15b] transition hover:bg-[#ff7a00]/08">How it works</button>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-9">
            {[{ label: "Best for your choice", icon: <Sparkles size={22} /> }, { label: "Luxury", icon: <Gem size={22} /> }, { label: "Romantic", icon: <Heart size={22} /> }, { label: "Backpacking", icon: <Compass size={22} /> }, { label: "Photography", icon: <Camera size={22} /> }, { label: "Foodie", icon: <UtensilsCrossed size={22} /> }, { label: "Adventure", icon: <Mountain size={22} /> }, { label: "Family", icon: <Users size={22} /> }, { label: "Wellness", icon: <Leaf size={22} /> }].map((style) => {
              const active = selectedTripStyle === style.label;
              return (
                <button key={style.label} type="button" onClick={() => { setSelectedTripStyle(style.label); if (style.label === "Best for your choice") triggerBestForChoice(); }} className={`flex min-h-[122px] flex-col items-center justify-center rounded-[18px] border px-4 py-4 text-center transition ${active ? "border-[#ff7a00]/55 bg-[linear-gradient(180deg,rgba(255,122,0,0.22),rgba(255,122,0,0.07))] text-[#ffb15b] shadow-[0_0_30px_rgba(255,122,0,0.16)]" : "border-white/10 bg-black text-white/82 hover:border-[#ff7a00]/34 hover:bg-[#ff7a00]/08"}`}>
                  <span className={`${active ? "text-[#ff9d4d]" : "text-white/80"}`}>{style.icon}</span>
                  <span className="mt-4 text-[15px] font-medium leading-5">{style.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {[{ key: "stays" as FlowCategory, title: "Stays", subtitle: "Hotels & more", icon: <Hotel size={18} className="text-[#ff9d4d]" /> }, { key: "flights" as FlowCategory, title: "Flights", subtitle: "Best options", icon: <Plane size={18} className="text-[#8ac5ff]" /> }, { key: "transport" as FlowCategory, title: "Transport", subtitle: "Transfers & more", icon: <CarFront size={18} className="text-white" /> }, { key: "activities" as FlowCategory, title: "Activities", subtitle: "Tours & tickets", icon: <Ticket size={18} className="text-white" /> }, { key: "restaurants" as FlowCategory, title: "Restaurants", subtitle: "Local & fine dining", icon: <UtensilsCrossed size={18} className="text-[#ffb15b]" /> }, { key: "events" as FlowCategory, title: "Events", subtitle: "What's happening", icon: <Sparkles size={18} className="text-[#ff77d6]" /> }].map((card) => {
            const active = activeCategory === card.key;
            return (
              <button key={card.key} type="button" onClick={() => toggleSection(card.key)} className={`rounded-[18px] border p-4 text-left transition ${active ? "border-[#ff7a00]/48 bg-[linear-gradient(180deg,rgba(255,122,0,0.14),rgba(0,0,0,0.12))] shadow-[0_0_24px_rgba(255,122,0,0.12)]" : "border-white/10 bg-black hover:border-[#ff7a00]/34 hover:bg-[#ff7a00]/08"}`}>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5">{card.icon}</span>
                  <div>
                    <div className="text-[15px] font-medium text-white">{card.title}</div>
                    <div className="mt-1 text-[12px] text-white/56">{card.subtitle}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <section className="rounded-[24px] border border-white/10 bg-black p-[18px] shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[30px] font-medium text-white">Top Picks for Your Trip</h2>
              <div className="mt-1 text-[14px] text-white/52">AI selected best for your multi-destination journey</div>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" className="text-[14px] font-medium text-[#ffb15b]">View all</button>
              <div className="hidden items-center gap-2 md:flex">
                <button type="button" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70"><ChevronLeft size={15} /></button>
                <button type="button" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70"><ChevronRight size={15} /></button>
              </div>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {topPicks.map((item: any) => (
              <RecommendationRowCard
                key={`top-pick-${item.id}`}
                title={item.name || item.title}
                subtitle={item.destinationLabel || item.locationLabel || item.neighborhood || item.area || ""}
                imageUrl={item.imageUrl}
                badges={[
                  { label: item.destinationLabel?.split(",")[0] || "Trip", tone: "bg-[#2b7fff] text-white shadow-[0_0_18px_rgba(43,127,255,0.28)]" },
                  { label: selectedTripStyle, tone: "bg-[#ff7a00] text-black shadow-[0_0_18px_rgba(255,122,0,0.28)]" },
                ]}
                price={
                  typeof getSelectedItemCost(item, inputs, "activities") === "number"
                    ? money(getSelectedItemCost(item, inputs, "activities") || 0)
                    : item.nightlyPrice
                      ? `${money(item.selectedUpgrade?.totalPrice ?? item.nightlyPrice)} / night`
                      : item.totalFare || item.fare
                        ? money(item.totalFare || item.fare)
                        : item.pricePerPerson
                          ? `${money(item.pricePerPerson)} / person`
                          : item.cost
                            ? money(item.cost)
                            : item.dailyPrice
                              ? `${money(item.dailyPrice)} / day`
                              : "Price unavailable"
                }
                priceDetail={item.categoryType || item.categoryLabel || "Top pick"}
                meta={[typeof item.rating === "number" ? `${item.rating} (${item.reviewCount || item.reviewsLabel || "reviews"})` : "", item.aiLabel || "", item.fitTags?.[0] || ""]}
                active={Boolean(
                  selected.activities.some((activity) => activity.id === item.id) ||
                    selected.hiddenGems.some((gem) => gem.id === item.id) ||
                    selected.hotel?.id === item.id ||
                    selected.restaurant?.id === item.id ||
                    selected.flight?.id === item.id ||
                    selected.transport?.id === item.id ||
                    selected.car?.id === item.id,
                )}
                onSelect={() => {
                  const targetStopId = item.destinationId || currentStop?.id || perStopSections[0]?.id;
                  if (!targetStopId) return;
                  jumpToDestination(targetStopId);
                  if ("nightlyPrice" in item) selectHotel(targetStopId, item);
                  else if ("fare" in item || "totalFare" in item) selectFlight(targetStopId, item);
                  else if ("pricePerPerson" in item) {
                    toggleSection("restaurants");
                    updateStopSelection(targetStopId, (current) => ({ ...current, restaurant: item }));
                  } else if ("categoryLabel" in item) {
                    toggleSection("activities");
                    updateStopSelection(targetStopId, (current) => ({ ...current, activities: current.activities.some((activity) => activity.id === item.id) ? current.activities : [...current.activities, item].slice(0, 5) }));
                  } else if ("cost" in item || "dailyPrice" in item) {
                    toggleSection("transport");
                    updateStopSelection(targetStopId, (current) => ("cost" in item ? { ...current, transport: item } : { ...current, car: item }));
                  } else {
                    toggleSection("events");
                    updateStopSelection(targetStopId, (current) => ({ ...current, hiddenGems: current.hiddenGems.some((gem) => gem.id === item.id) ? current.hiddenGems : [...current.hiddenGems, item].slice(0, 3) }));
                  }
                }}
              />
            ))}
          </div>
        </section>

        <div className="space-y-4">
          {[
            { key: "flights" as FlowCategory, title: "Flights", icon: <Plane size={18} />, enabled: inputs.budgetIncludesFlights },
            { key: "stays" as FlowCategory, title: "Hotels", icon: <Hotel size={18} />, enabled: true },
            { key: "transport" as FlowCategory, title: "Transportation", icon: <CarFront size={18} />, enabled: true },
            { key: "activities" as FlowCategory, title: "Trips & Activities", icon: <Ticket size={18} />, enabled: true },
            { key: "events" as FlowCategory, title: "Events", icon: <Sparkles size={18} />, enabled: true },
            { key: "restaurants" as FlowCategory, title: "Restaurants", icon: <UtensilsCrossed size={18} />, enabled: true },
          ]
            .filter((section) => section.enabled)
            .map((section) => {
              const sectionOpen = expandedSections.includes(section.key);
              return (
                <section key={`section-${section.key}`} className="rounded-[24px] border border-white/10 bg-black p-[18px] shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
                  <button type="button" onClick={() => toggleSection(section.key)} className="flex w-full items-center justify-between gap-3 text-left">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#ff7a00]/22 bg-[#ff7a00]/08 text-[#ffb256] shadow-[0_0_16px_rgba(255,122,0,0.08)]">{section.icon}</span>
                      <div>
                        <div className="text-[18px] font-medium text-white">{section.title}</div>
                        <div className="text-[12px] text-white/52">{sectionOpen ? "Showing 3 AI choices per destination" : "Open to compare the best 3 options"}</div>
                      </div>
                    </div>
                    <span className="text-[13px] text-[#ffb15b]">{sectionOpen ? "Open" : "Open section"}</span>
                  </button>

                  {sectionOpen ? (
                    <div className="mt-5 space-y-5">
                      {visibleStops.map((stop) => {
                        const items = getSectionItems(stop, section.key).slice(0, 3);
                        const current = selectedByDestination[stop.id] || EMPTY_SELECTED;
                        return (
                          <div key={`${section.key}-${stop.id}`} className="space-y-3">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <div className="text-[14px] font-medium text-white">{stop.title}</div>
                                <div className="text-[12px] text-white/50">{selectedTripStyle} • {section.title}</div>
                              </div>
                              <button type="button" onClick={() => jumpToDestination(stop.id)} className="rounded-full border border-white/10 px-3 py-1.5 text-[12px] text-white/68 transition hover:border-[#ff7a00]/34 hover:bg-[#ff7a00]/08 hover:text-white">
                                Focus
                              </button>
                            </div>
                            <div className="flex gap-3 overflow-x-auto pb-2">
                              {items.map((item: any) => {
                                const isActive =
                                  section.key === "flights"
                                    ? getSelectedFlights(stop.id).some((flight) => flight.id === item.id)
                                    : section.key === "stays"
                                      ? getSelectedHotels(stop.id).some((hotel) => hotel.id === item.id)
                                      : section.key === "activities"
                                        ? current.activities.some((activity) => activity.id === item.id)
                                        : section.key === "events"
                                          ? current.hiddenGems.some((event) => event.id === item.id)
                                          : section.key === "restaurants"
                                            ? current.restaurant?.id === item.id
                                            : current.transport?.id === item.id || current.car?.id === item.id;
                                const upgradeNote =
                                  section.key === "stays" && current.hotel?.id === item.id && current.hotel.selectedUpgrade
                                    ? current.hotel.selectedUpgrade.name
                                    : section.key === "flights" && current.flight?.id === item.id && (current.flight as any).selectedUpgrade
                                      ? (current.flight as any).selectedUpgrade.name
                                      : undefined;

                                return (
                                  <RecommendationRowCard
                                    key={`${section.key}-${stop.id}-${item.id}`}
                                    title={item.airline || item.name || item.title}
                                    subtitle={item.route || item.locationLabel || item.neighborhood || item.area || stop.title}
                                    imageUrl={item.imageUrl}
                                    badges={[
                                      { label: stop.city || stop.title, tone: "bg-[#2b7fff] text-white shadow-[0_0_18px_rgba(43,127,255,0.28)]" },
                                      { label: selectedTripStyle, tone: "bg-[#ff7a00] text-black shadow-[0_0_18px_rgba(255,122,0,0.28)]" },
                                      ...(item.aiLabel ? [{ label: item.aiLabel, tone: badgeToneClasses(item.aiLabel) }] : []),
                                    ]}
                                    price={
                                      section.key === "flights"
                                        ? money(item.totalFare || item.totalPrice || item.fare)
                                        : section.key === "stays"
                                          ? `${money(current.hotel?.id === item.id ? current.hotel.selectedUpgrade?.totalPrice ?? item.totalPrice ?? item.nightlyPrice : item.totalPrice ?? item.nightlyPrice)} / night`
                                          : section.key === "transport"
                                            ? ("cost" in item ? money(item.cost) : `${money(item.dailyPrice)} / day`)
                                            : section.key === "restaurants"
                                              ? `${money(item.pricePerPerson)} / person`
                                              : section.key === "events"
                                                ? typeof (item.priceFrom ?? item.totalPrice) === "number" ? money(item.priceFrom ?? item.totalPrice ?? 0) : "Provider price"
                                                : money(item.price)
                                    }
                                    priceDetail={item.aiTip || item.whyItFits || "AI matched to your trip"}
                                    meta={[
                                      section.key === "flights" ? `${item.departureTime} - ${item.arrivalTime}` : section.key === "stays" ? `${item.rating} (${item.reviewsLabel})` : "",
                                      section.key === "activities" ? item.duration : section.key === "restaurants" ? item.cuisine : section.key === "transport" ? item.duration || item.seats : item.bestTime || "",
                                      item.fitTags?.[0] || "",
                                    ]}
                                    active={isActive}
                                    compactNote={upgradeNote}
                                    onUpgrade={
                                      section.key === "stays" || section.key === "flights"
                                        ? () => {
                                            if (section.key === "stays") updateStopSelection(stop.id, (current) => ({ ...current, hotel: item }));
                                            if (section.key === "flights") updateStopSelection(stop.id, (current) => ({ ...current, flight: item }));
                                            setUpgradePanel({ kind: section.key === "stays" ? "hotel" : "flight", stopId: stop.id, itemId: item.id });
                                          }
                                        : undefined
                                    }
                                    onSelect={() => {
                                      if (section.key === "flights") selectFlight(stop.id, item);
                                      else if (section.key === "stays") selectHotel(stop.id, item);
                                      else if (section.key === "activities") {
                                        updateStopSelection(stop.id, (current) => ({
                                          ...current,
                                          activities: current.activities.some((activity) => activity.id === item.id) ? current.activities.filter((activity) => activity.id !== item.id) : [...current.activities, item].slice(0, 5),
                                        }));
                                      } else if (section.key === "events") {
                                        updateStopSelection(stop.id, (current) => ({
                                          ...current,
                                          hiddenGems: current.hiddenGems.some((event) => event.id === item.id) ? current.hiddenGems.filter((event) => event.id !== item.id) : [...current.hiddenGems, item].slice(0, 3),
                                        }));
                                      } else if (section.key === "restaurants") {
                                        updateStopSelection(stop.id, (current) => ({ ...current, restaurant: item }));
                                      } else {
                                        updateStopSelection(stop.id, (current) => ("cost" in item ? { ...current, transport: item } : { ...current, car: item }));
                                      }
                                    }}
                                    aiTip={item.aiTip}
                                  />
                                );
                              })}
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <button type="button" onClick={() => openNextSection(section.key)} className="rounded-[12px] border border-[#ff7a00]/42 px-4 py-2 text-[13px] font-medium text-[#ffb15b] transition hover:bg-[#ff7a00]/10">
                                Next section
                              </button>
                              {nextDestinationStop && stop.id === currentStop?.id ? (
                                <button type="button" onClick={() => jumpToDestination(nextDestinationStop.id)} className="rounded-[12px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,122,0,0.16),rgba(255,122,0,0.06))] px-4 py-2 text-[13px] font-medium text-white transition hover:border-[#ff7a00]/42">
                                  Next destination: {nextDestinationStop.city}
                                </button>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </section>
              );
            })}
        </div>

        {false && currentStop ? (
          activeCategory === "flights" && inputs.budgetIncludesFlights ? (
            <RecommendationRow icon={<Plane size={18} />} title="Flights" count={flightItems.length}>
              {flightItems.map((item) => (
                <RecommendationRowCard key={item.id} title={item.airline} subtitle={item.route} imageUrl={item.imageUrl} badge={item.aiLabel || item.fitTags?.[0] || item.sourceBadge} badgeTone={badgeToneClasses(item.aiLabel)} price={money(item.totalFare || item.totalPrice || item.fare)} priceDetail={item.baggageFee ? `${money(item.fare)} flight • +${money(item.baggageFee)} baggage` : item.aiTip} meta={[`${item.departureTime} - ${item.arrivalTime}`, `${item.stops === 0 ? "Direct" : `${item.stops} stop`}`, item.duration]} active={currentSelected.flight?.id === item.id} onSelect={() => { updateStopSelection(currentStop.id, (current) => ({ ...current, flight: item })); setActiveCategory("stays"); }} aiTip={item.baggageInfo?.note || item.aiTip} />
              ))}
            </RecommendationRow>
          ) : activeCategory === "stays" ? (
            <RecommendationRow icon={<Hotel size={18} />} title="Stays" count={hotelItems.length}>
              {hotelItems.map((item) => (
                <RecommendationRowCard key={item.id} title={item.name} subtitle={item.locationLabel || item.area} imageUrl={item.imageUrl} badge={item.aiLabel || item.fitTags?.[0] || item.sourceBadge} badgeTone={badgeToneClasses(item.aiLabel)} price={`${money(currentSelected.hotel?.id === item.id ? currentSelected.hotel.selectedUpgrade?.totalPrice ?? item.totalPrice ?? item.nightlyPrice : item.totalPrice ?? item.nightlyPrice)} / night`} priceDetail={currentSelected.hotel?.id === item.id && currentSelected.hotel.selectedUpgrade ? `Upgrade: +${money(currentSelected.hotel.selectedUpgrade.extraPrice)} • ${currentSelected.hotel.selectedUpgrade.name}` : item.aiTip} meta={[`${item.rating} (${item.reviewsLabel})`, "Exceptional", item.destinationLabel || ""]} active={currentSelected.hotel?.id === item.id} onSelect={() => { updateStopSelection(currentStop.id, (current) => ({ ...current, hotel: item })); setActiveCategory("activities"); }} onUpgrade={() => { updateStopSelection(currentStop.id, (current) => ({ ...current, hotel: item })); setUpgradeTargetHotelId(item.id); }} aiTip={item.aiTip} />
              ))}
            </RecommendationRow>
          ) : activeCategory === "activities" ? (
            <RecommendationRow icon={<Ticket size={18} />} title="Activities" count={activityItems.length}>
              {activityItems.map((item) => (
                <RecommendationRowCard key={item.id} title={item.name} subtitle={item.destinationLabel || currentStop.title} imageUrl={item.imageUrl} badge={item.aiLabel || item.fitTags?.[0] || item.sourceBadge} badgeTone={badgeToneClasses(item.aiLabel)} price={money(item.price)} priceDetail={item.aiTip} meta={[item.categoryLabel, item.duration, item.weatherFit]} active={currentSelected.activities.some((value) => value.id === item.id)} onSelect={() => pickActivity(item)} aiTip={item.aiTip} />
              ))}
            </RecommendationRow>
          ) : activeCategory === "restaurants" ? (
            <RecommendationRow icon={<UtensilsCrossed size={18} />} title="Restaurants" count={restaurantItems.length}>
              {restaurantItems.map((item) => (
                <RecommendationRowCard key={item.id} title={item.name} subtitle={item.locationLabel || currentStop.title} imageUrl={item.imageUrl} badge={item.aiLabel || item.fitTags?.[0] || item.sourceBadge} badgeTone={badgeToneClasses(item.aiLabel)} price={money(item.pricePerPerson)} priceDetail={item.aiTip} meta={[`${item.rating} stars`, item.cuisine, item.mealWindow]} active={currentSelected.restaurant?.id === item.id} onSelect={() => { updateStopSelection(currentStop.id, (current) => ({ ...current, restaurant: item })); setActiveCategory("transport"); }} aiTip={item.aiTip} />
              ))}
            </RecommendationRow>
          ) : activeCategory === "transport" ? (
            <RecommendationRow icon={<CarFront size={18} />} title="Transport" count={transportItems.length}>
              {transportItems.map((item: any) => (
                <RecommendationRowCard key={item.id} title={item.name} subtitle={item.transportType || item.carType || currentStop.title} imageUrl={item.imageUrl} badge={item.aiLabel || item.fitTags?.[0] || item.sourceBadge} badgeTone={badgeToneClasses(item.aiLabel)} price={"cost" in item ? money(item.cost) : `${money(item.dailyPrice)} / day`} priceDetail={item.aiTip} meta={["cost" in item ? item.duration : `${item.seats} seats`, "cost" in item ? item.costLabel : `${item.luggage} luggage`, item.destinationLabel || ""]} active={currentSelected.transport?.id === item.id || currentSelected.car?.id === item.id} onSelect={() => updateStopSelection(currentStop.id, (current) => ("cost" in item ? { ...current, transport: item } : { ...current, car: item }))} aiTip={item.aiTip} />
              ))}
            </RecommendationRow>
          ) : (
            <RecommendationRow icon={<Sparkles size={18} />} title="Events" count={eventItems.length}>
              {eventItems.map((item) => (
                <RecommendationRowCard key={item.id} title={item.title} subtitle={item.neighborhood || item.destinationLabel || currentStop.title} imageUrl={item.imageUrl} badge={item.fitTags?.[0] || item.sourceBadge} badgeTone={badgeToneClasses(item.aiLabel)} price={typeof (item.priceFrom ?? item.totalPrice) === "number" ? money(item.priceFrom ?? item.totalPrice ?? 0) : "Provider price"} priceDetail={item.whyItFits || item.aiReason} meta={[item.categoryLabel || item.category.replaceAll("_", " "), item.bestTime ? `Best time ${item.bestTime}` : "", item.crowdNote || (item.isBookable ? item.provider : "AI local suggestion")]} active={currentSelected.hiddenGems.some((value) => value.id === item.id)} onSelect={() => pickHiddenGem(item)} aiTip={item.isBookable ? item.aiTip : "Non-bookable local suggestion"} />
              ))}
            </RecommendationRow>
          )
        ) : null}

        <section className="rounded-[24px] border border-white/10 bg-black p-[18px] shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[30px] font-medium text-white">Day Overview <span className="text-white/48">(Multi-Destination Timeline)</span></h2>
              <div className="mt-1 text-[14px] text-white/52">See your journey at a glance</div>
            </div>
            <button type="button" className="text-[14px] font-medium text-[#ffb15b]">View full plan</button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {dayOverviewCards.map((card) => (
              <article key={`day-overview-${card.id}`} className="overflow-hidden rounded-[18px] border border-white/10 bg-black">
                <div className="relative h-[210px]">
                  <img src={card.imageUrl} alt={card.title} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.05),rgba(0,0,0,0.86))]" />
                  <div className="absolute inset-x-4 top-4">
                    <div className="text-[14px] font-medium text-white">{card.dayRange}</div>
                    <div className="mt-1 text-[20px] leading-tight text-white/86">{card.title}</div>
                  </div>
                  <div className="absolute inset-x-4 bottom-4">
                    <div className="line-clamp-2 text-[16px] leading-6 text-white">{card.body}</div>
                    <div className="mt-4 flex items-center gap-3 text-white/82">
                      <Plane size={14} className="text-[#ff9d4d]" />
                      <Hotel size={14} className="text-[#ff9d4d]" />
                      <Ticket size={14} className="text-[#ff9d4d]" />
                      <UtensilsCrossed size={14} className="text-[#ff9d4d]" />
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[24px] border border-white/10 bg-black p-[18px] shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
          <div className="mb-4">
            <h2 className="text-[30px] font-medium text-white">Smart Suggestions for You</h2>
            <div className="mt-1 text-[14px] text-white/52">For {currentStop?.title || "your current destination"} • {selectedTripStyle}</div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {suggestions.map((item: any) => (
              <article key={`smart-suggestion-${item.id}`} className="overflow-hidden rounded-[18px] border border-white/10 bg-black transition hover:border-[#ff7a00]/35">
                <div className="relative h-[170px]">
                  <img src={item.imageUrl || "/recommendation-bg.jpg"} alt={item.name || item.title} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.12),rgba(0,0,0,0.84))]" />
                  <div className="absolute left-4 top-4 flex flex-wrap gap-1.5">
                    <div className="rounded-full bg-[#2b7fff] px-2.5 py-1 text-[10px] font-medium text-white">{item.destinationLabel?.split(",")[0] || currentStop?.city || "Destination"}</div>
                    <div className="rounded-full bg-[#ff7a00] px-2.5 py-1 text-[10px] font-medium text-black">{item.fitTags?.[0] || selectedTripStyle}</div>
                  </div>
                  <div className="absolute inset-x-4 bottom-4">
                    <div className="text-[18px] font-medium text-white">{item.name || item.title}</div>
                    <div className="mt-1 text-[13px] text-white/60">{item.destinationLabel || item.locationLabel || item.neighborhood || ""}</div>
                    <div className="mt-2 text-[12px] text-white/70">{item.aiReason || item.whyItFits || "A strong optional add-on for this stop."}</div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="text-[14px] font-medium text-white">{item.priceFrom ? `from ${money(item.priceFrom)}` : item.pricePerPerson ? `from ${money(item.pricePerPerson)}` : item.price ? `from ${money(item.price)}` : "Provider price"}</div>
                      <button
                        type="button"
                        onClick={() => {
                          if (!currentStop) return;
                          if ("pricePerPerson" in item) updateStopSelection(currentStop.id, (current) => ({ ...current, restaurant: item }));
                          else if ("categoryLabel" in item) updateStopSelection(currentStop.id, (current) => ({ ...current, activities: current.activities.some((activity) => activity.id === item.id) ? current.activities : [...current.activities, item].slice(0, 5) }));
                          else updateStopSelection(currentStop.id, (current) => ({ ...current, hiddenGems: current.hiddenGems.some((event) => event.id === item.id) ? current.hiddenGems : [...current.hiddenGems, item].slice(0, 3) }));
                        }}
                        className="rounded-[10px] border border-[#ff7a00]/52 px-3.5 py-1.5 text-[12px] font-medium text-[#ffae57] transition hover:bg-[#ff7a00]/10"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {upgradeTargetItem ? (
          <div className="rounded-[24px] border border-[#ff7a00]/24 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(0,0,0,0.24))] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[18px] font-medium text-white">{upgradePanel?.kind === "flight" ? "Flight" : "Room"} upgrades for {upgradeTargetItem.name || (upgradeTargetItem as any).airline}</div>
                <div className="mt-1 text-sm text-white/56">Upgrades update your total price using the traveler count from your trip.</div>
              </div>
              <button type="button" onClick={() => setUpgradePanel(null)} className="rounded-full border border-white/10 bg-white/5 p-2 text-white/70 transition hover:bg-white/10">
                <X size={14} />
              </button>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {((upgradePanel?.kind === "hotel" ? (upgradeTargetItem as HotelRecommendation).upgrades || [] : buildFlightUpgrades(upgradeTargetItem as FlightRecommendation)) as Array<any>).map((upgrade) => {
                const travelerMultiplier = Math.max(1, Number(inputs.adults ?? 0) + Number(inputs.kids ?? 0) + Number(inputs.elderly ?? 0));
                const totalUpgradePrice = (upgrade.extraPrice || 0) * travelerMultiplier;
                const selectedUpgradeId =
                  upgradePanel?.kind === "hotel"
                    ? currentSelected.hotel?.id === upgradeTargetItem.id ? currentSelected.hotel.selectedUpgrade?.id : null
                    : currentSelected.flight?.id === upgradeTargetItem.id ? (currentSelected.flight as any).selectedUpgrade?.id : null;
                return (
                  <div key={upgrade.id} className="rounded-[18px] border border-white/10 bg-black/22 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[15px] font-medium text-white">{upgrade.name || upgrade.title}</div>
                        <div className="mt-1 text-sm text-white/56">{upgrade.reason || (upgrade.available ? "Available now" : "Limited availability")}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-[#ffb15b]">+{money(totalUpgradePrice)}</div>
                        <div className="mt-1 text-sm text-white/56">Per traveler {money(upgrade.extraPrice || 0)}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={!upgrade.available}
                      onClick={() => {
                        if (!currentStop || !upgradePanel) return;
                        if (upgradePanel.kind === "hotel") {
                          updateStopSelection(upgradePanel.stopId, (current) =>
                            current.hotel?.id === upgradeTargetItem.id
                              ? { ...current, hotel: { ...current.hotel, selectedUpgrade: upgrade, upgradePrice: totalUpgradePrice, totalPrice: (current.hotel.nightlyPrice || 0) + totalUpgradePrice } }
                              : { ...current, hotel: { ...(upgradeTargetItem as HotelRecommendation), selectedUpgrade: upgrade, upgradePrice: totalUpgradePrice, totalPrice: ((upgradeTargetItem as HotelRecommendation).nightlyPrice || 0) + totalUpgradePrice } },
                          );
                        } else {
                          updateStopSelection(upgradePanel.stopId, (current) =>
                            current.flight?.id === upgradeTargetItem.id
                              ? { ...current, flight: { ...current.flight, selectedUpgrade: upgrade, totalFare: (current.flight.totalFare || current.flight.fare || 0) + totalUpgradePrice } as any }
                              : { ...current, flight: { ...(upgradeTargetItem as FlightRecommendation), selectedUpgrade: upgrade, totalFare: (((upgradeTargetItem as FlightRecommendation).totalFare || (upgradeTargetItem as FlightRecommendation).fare || 0) + totalUpgradePrice) } as any },
                          );
                        }
                        setUpgradePanel(null);
                      }}
                      className={`mt-4 w-full rounded-[12px] border px-3 py-2 text-sm font-medium transition ${selectedUpgradeId === upgrade.id ? "border-[#ff7a00] bg-[#ff7a00] text-black" : "border-[#ff7a00]/45 text-[#ffae57] hover:bg-[#ff7a00]/10"} disabled:opacity-45`}
                    >
                      {selectedUpgradeId === upgrade.id ? "Selected" : "Select"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        <footer className="rounded-[24px] border border-white/10 bg-black p-3 shadow-[0_24px_70px_rgba(0,0,0,0.3)]">
          <div className="grid gap-[1px] overflow-hidden rounded-[18px] border border-white/10 bg-black xl:grid-cols-[1.04fr_0.96fr_0.98fr_308px] xl:items-stretch">
            <TopMetricCard className="rounded-none border-0" icon={<Wallet size={18} />} label="Total Trip Cost" value={money(selectedTotalCost)} note={`For ${inputs.travelersCount} travelers`} />
            <TopMetricCard className="rounded-none border-0" icon={<ArrowLeftRight size={18} />} label="Budget Level" value={budgetLevelInfo.label} note={budgetLevelInfo.note} />
            <TopMetricCard className="rounded-none border-0" icon={<MoonStar size={18} />} label="Days Without Trips" value={`${inputs.daysWithoutTrips?.length || inputs.noTripDays || 0} Day${(inputs.daysWithoutTrips?.length || inputs.noTripDays || 0) === 1 ? "" : "s"}`} note="Rest & relax" />
            <button type="button" onClick={goDayByDay} className="min-h-[96px] bg-[linear-gradient(135deg,#ff7a00,rgba(255,162,74,0.95))] px-7 py-4 text-left text-base font-semibold text-black shadow-[0_16px_46px_rgba(255,122,0,0.28)] transition">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div>Preview Day by Day Plan</div>
                  <div className="mt-1 text-sm text-black/72">Next Step {"->"}</div>
                </div>
                <ArrowRight size={18} />
              </div>
            </button>
          </div>
        </footer>

        {confirmation?.kind === "duplicate" ? (
          <ConfirmationModal
            title={`You selected more than one ${confirmation.selectionType} for ${confirmation.destinationName}.`}
            description={`Do you want to keep both selections for ${confirmation.destinationName}? You can continue with both, or keep only your current choice.`}
            primaryLabel="Keep both"
            secondaryLabel="Keep current selection"
            onPrimary={applyDuplicateSelection}
            onSecondary={closeConfirmation}
          />
        ) : null}

        {confirmation?.kind === "missingDestination" ? (
          <ConfirmationModal
            title={`You didn’t select any items for ${confirmation.destinationName}.`}
            description={`Do you want to continue with only your selected items, or go back and complete ${confirmation.destinationName} first?`}
            primaryLabel="Continue anyway"
            secondaryLabel={`Go back to ${confirmation.destinationName}`}
            onPrimary={() => {
              setConfirmation(null);
              sessionStorage.setItem("gene-recommendation-payload", JSON.stringify(sessionPayload));
              router.push(`/ai/day-by-day?planId=${planId}`);
            }}
            onSecondary={() => {
              jumpToDestination(confirmation.stopId);
              setConfirmation(null);
            }}
          />
        ) : null}

        {confirmation?.kind === "missingRequirement" ? (
          <ConfirmationModal
            title={`You didn’t select ${confirmation.missing} for ${confirmation.destinationName}.`}
            description={`You can continue anyway, or go back and complete the missing ${confirmation.missing} selection for ${confirmation.destinationName}.`}
            primaryLabel="Continue anyway"
            secondaryLabel="Complete selection"
            onPrimary={() => {
              setConfirmation(null);
              sessionStorage.setItem("gene-recommendation-payload", JSON.stringify(sessionPayload));
              router.push(`/ai/day-by-day?planId=${planId}`);
            }}
            onSecondary={() => {
              jumpToDestination(confirmation.stopId);
              toggleSection(confirmation.missing === "hotel" ? "stays" : "flights");
              setConfirmation(null);
            }}
          />
        ) : null}
      </section>
    </AiSuiteFrame>
  );
}
