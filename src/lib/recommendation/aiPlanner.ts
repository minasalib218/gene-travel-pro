import type {
  ActivityRecommendation,
  AnalysisInsight,
  AnalysisModule,
  DayPlan,
  DayPlanItem,
  RecommendationBase,
  SelectedRecommendations,
  UserTripInput,
} from "@/lib/recommendation/types";
import { annotateDayPlanWithCrowd } from "@/lib/crowd/crowdPredictor";

function dateRange(startDate: string, endDate: string) {
  const dates: string[] = [];
  const cursor = new Date(startDate);
  const end = new Date(endDate);

  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates.length ? dates : [new Date().toISOString().slice(0, 10)];
}

function scoreText(category: string, inputs: UserTripInput, item: RecommendationBase) {
  const style = inputs.travelStyle.toLowerCase();
  const personalities = (inputs.tripPersonality || []).join(" ").toLowerCase();
  const fatigueSignals = (inputs.energyFatigueSignals || []).join(" ").toLowerCase();
  const family = inputs.travelerType === "family";
  const couple = inputs.travelerType === "couple";

  if (category === "hotel") {
    if (family) return "Chosen because it keeps transfer stress lower and fits a more comfort-focused stay.";
    if (couple) return "Chosen because it supports a calmer romantic rhythm with stronger evening atmosphere.";
    if (style.includes("luxury")) return "Chosen because it gives the cleanest premium base for the rest of the itinerary.";
  }

  if (category === "activity" && inputs.walkingTolerance < 45) {
    return "Kept high because it limits unnecessary walking strain while still delivering a strong experience.";
  }

  if (fatigueSignals.includes("walking overload") && /walk|hike|outdoor|stairs/.test(item.name.toLowerCase())) {
    return "Adjusted to lower walking strain and keep nearby movement more manageable.";
  }

  if (fatigueSignals.includes("heat stress") && /indoor|museum|cafe|cruise|lounge/.test(item.name.toLowerCase())) {
    return "Chosen because it gives a more heat-safe rhythm with stronger indoor or lower-exposure coverage.";
  }

  if (fatigueSignals.includes("jet lag effect") && category !== "activity") {
    return "Kept because it supports a softer arrival rhythm with less pressure on the first day.";
  }

  if (fatigueSignals.includes("elderly fatigue") && /private|comfort|executive|central/.test(item.name.toLowerCase())) {
    return "Chosen because it supports comfort, lower strain, and easier transfers.";
  }

  if (fatigueSignals.includes("kid fatigue") && /family|easy|indoor|cruise|garden/.test(item.name.toLowerCase())) {
    return "Chosen because it fits a shorter, more family-friendly energy pattern.";
  }

  if (personalities.includes("photography lover") && /view|sunset|rooftop|panorama|scenic/.test(item.name.toLowerCase())) {
    return "Chosen because it supports scenic timing, viewpoint access, and stronger photo moments.";
  }

  if (personalities.includes("nightlife lover") && /night|lounge|evening|cruise|bar/.test(item.name.toLowerCase())) {
    return "Chosen because it keeps the plan stronger in the evening without forcing rushed mornings.";
  }

  if (personalities.includes("hidden gems") && /boutique|bazaar|local|market|old town/.test(item.name.toLowerCase())) {
    return "Chosen because it leans more local, less generic, and fits a hidden-gems travel style.";
  }

  if (category === "transport" && inputs.preferredTransport.toLowerCase().includes("private")) {
    return "Ranked high because your comfort-first transport preference reduces friction across the plan.";
  }

  return item.aiReason;
}

function sortByRank<T extends RecommendationBase>(items: T[], scoreFn: (item: T) => number) {
  return [...items].sort((a, b) => scoreFn(b) - scoreFn(a));
}

export function rankRecommendationsWithAI<T extends RecommendationBase>(
  category: "hotel" | "flight" | "activity" | "restaurant" | "transport" | "car",
  inputs: UserTripInput,
  items: T[],
) {
  return sortByRank(items, (item) => {
    let score = item.confidenceScore || 50;
    const name = item.name.toLowerCase();
    const style = inputs.travelStyle.toLowerCase();
    const personalities = (inputs.tripPersonality || []).join(" ").toLowerCase();
    const fatigueSignals = (inputs.energyFatigueSignals || []).join(" ").toLowerCase();

    if (style.includes("romantic") && /sunset|boutique|cruise|river|lumiere/.test(name)) score += 12;
    if (style.includes("shopping") && /center|district|metro|opera/.test(name)) score += 10;
    if (style.includes("food") && /food|cafe|saveurs/.test(name)) score += 10;
    if (inputs.travelerType === "family" && /suv|family|residence/.test(name)) score += 12;
    if (inputs.travelerType === "solo" && /compact|metro|walk/.test(name)) score += 8;
    if (inputs.preferredTransport.toLowerCase().includes("private") && /private|executive|luxury/.test(name)) score += 10;
    if (inputs.walkingTolerance < 45 && item.fitTags.some((tag) => /low walking|comfort|indoor/i.test(tag))) score += 8;
    if (personalities.includes("luxury") && /luxury|palace|four seasons|suite|executive|private/.test(name)) score += 12;
    if (personalities.includes("exploration") && /center|district|old town|market|metro|walk/.test(name)) score += 10;
    if (personalities.includes("adventure") && /hike|desert|safari|cruise|outdoor|tour/.test(name)) score += 12;
    if (personalities.includes("photography lover") && /view|sunset|rooftop|panorama|scenic|garden/.test(name)) score += 12;
    if (personalities.includes("nightlife lover") && /night|lounge|bar|late|evening|cruise/.test(name)) score += 11;
    if (personalities.includes("hidden gems") && /boutique|local|market|bazaar|hidden|old/.test(name)) score += 10;
    if (personalities.includes("famous places") && /museum|pyramids|acropolis|landmark|palace|nile/.test(name)) score += 11;
    if (fatigueSignals.includes("walking overload") && /low walking|comfort|indoor|private|central/.test(`${name} ${item.fitTags.join(" ").toLowerCase()}`)) score += 12;
    if (fatigueSignals.includes("heat stress") && /indoor|museum|cafe|lounge|cruise/.test(name)) score += 12;
    if (fatigueSignals.includes("overstimulation") && /quiet|garden|boutique|calm|spa/.test(name)) score += 10;
    if (fatigueSignals.includes("kid fatigue") && /family|easy|garden|cruise|cafe/.test(name)) score += 10;
    if (fatigueSignals.includes("elderly fatigue") && /private|executive|comfort|central|easy/.test(name)) score += 11;
    if (fatigueSignals.includes("jet lag effect") && /airport|transfer|hotel|lounge|cafe/.test(name)) score += 8;
    if (fatigueSignals.includes("exhaustion probability") && /comfort|spa|lounge|private|resort/.test(name)) score += 10;

    return score;
  }).map((item) => ({
    ...item,
    aiReason: scoreText(category, inputs, item),
  }));
}

function makeItem(
  id: string,
  day: number,
  slot: DayPlanItem["slot"],
  type: DayPlanItem["type"],
  title: string,
  description: string,
  startTime: string,
  endTime: string,
  location?: string,
  imageUrl?: string,
  deepLink?: string | null,
  cost?: number,
  destinationId?: string,
  destinationLabel?: string,
): DayPlanItem {
  const [startHour = 0, startMinute = 0] = startTime.split(":").map(Number);
  const [endHour = 0, endMinute = 0] = endTime.split(":").map(Number);
  return {
    id,
    day,
    slot,
    type,
    title,
    description,
    startTime,
    endTime,
    location,
    imageUrl,
    deepLink,
    cost,
    destinationId,
    destinationLabel,
    bufferMinutes: Math.max(endHour * 60 + endMinute - (startHour * 60 + startMinute), 0),
  };
}

function themeForDay(day: number, totalDays: number) {
  if (day === 1) return "Arrival and soft landing";
  if (day === totalDays) return "Final highlights and clean departure";
  if (day === 2) return "Signature moments";
  return "Balanced exploration";
}

function distributeActivities(
  activities: ActivityRecommendation[],
  totalDays: number,
  activityDays: Record<string, number> = {},
  tripsPerDay = 3,
  noTripDays = 0,
  lockedRestDays: number[] = [],
) {
  const grouped: Record<number, ActivityRecommendation[]> = {};
  const blockedDays = new Set<number>();
  if (lockedRestDays.length) {
    lockedRestDays.forEach((day) => {
      if (day >= 1 && day <= totalDays) {
        blockedDays.add(day);
      }
    });
  } else {
    for (let index = 0; index < Math.max(noTripDays, 0); index += 1) {
      blockedDays.add(totalDays - index);
    }
  }
  activities.forEach((activity, index) => {
    const preferredDay = activityDays[activity.id];
    const computedDay = (index % Math.max(totalDays - 1, 1)) + 1;
    let targetDay = Math.min(totalDays, Math.max(1, preferredDay ?? computedDay));
    while (blockedDays.has(targetDay) && targetDay > 1) {
      targetDay -= 1;
    }
    if (blockedDays.has(targetDay)) {
      const fallbackDay = Array.from({ length: totalDays }, (_, offset) => offset + 1).find((day) => !blockedDays.has(day));
      if (!fallbackDay) return;
      targetDay = fallbackDay;
    }
    const currentDayItems = grouped[targetDay] || [];
    if (currentDayItems.length >= tripsPerDay) {
      const nextDay =
        Array.from({ length: totalDays }, (_, offset) => targetDay + offset + 1)
          .map((day) => ((day - 1) % totalDays) + 1)
          .find((day) => !blockedDays.has(day)) ?? targetDay;
      grouped[nextDay] = [...(grouped[nextDay] || []), activity];
      return;
    }
    grouped[targetDay] = [...currentDayItems, activity];
  });
  return grouped;
}

export async function generateAiDayPlan(
  selected: SelectedRecommendations,
  inputs: UserTripInput,
  options?: {
    activityDays?: Record<string, number>;
    itemDayOverrides?: Record<string, number>;
    hiddenItemIds?: string[];
  },
): Promise<DayPlan[]> {
  const dates = dateRange(inputs.startDate, inputs.endDate);
  const totalDays = Math.max(dates.length, 1);
  const destinations = inputs.destinations?.length
    ? inputs.destinations
    : [
        {
          id: "primary-destination",
          country: inputs.destination.split(", ").slice(-1)[0] || inputs.destination,
          city: inputs.departureCity || inputs.destination,
          preferredHotel: inputs.preferredHotels?.[0] || "",
        },
      ];
  const tripsPerDay = Math.max(inputs.tripsPerDay ?? 3, 1);
  const noTripDays = Math.max(inputs.noTripDays ?? 0, 0);
  const lockedRestDays = [...new Set((inputs.daysWithoutTrips ?? []).filter((day) => day >= 1 && day <= totalDays))].sort((a, b) => a - b);
  const lockedRestDaySet = new Set<number>(lockedRestDays);
  const fatigueSignals = new Set(inputs.energyFatigueSignals || []);
  const isJetLag = fatigueSignals.has("Jet Lag Effect");
  const isWalkingOverload = fatigueSignals.has("Walking Overload");
  const isHeatStress = fatigueSignals.has("Heat Stress");
  const isKidFatigue = fatigueSignals.has("Kid Fatigue");
  const isElderlyFatigue = fatigueSignals.has("Elderly Fatigue");
  const isExhaustionRisk = fatigueSignals.has("Exhaustion Probability");
  const needsCalmerPacing = fatigueSignals.has("Overstimulation") || isExhaustionRisk || isKidFatigue || isElderlyFatigue;

  const plan: DayPlan[] = dates.map((date, index) => ({
    day: index + 1,
    date,
    theme:
      lockedRestDaySet.has(index + 1)
        ? "Rest and reset"
        : destinations[index] && index > 0
        ? `${destinations[index].city} transition`
        : themeForDay(index + 1, totalDays),
    items: [],
  }));

  const itemDayOverrides = options?.itemDayOverrides ?? {};
  const hiddenItemIds = new Set(options?.hiddenItemIds ?? []);
  const clampDay = (value?: number) => Math.min(totalDays, Math.max(1, value ?? 1));
  const pushItem = (fallbackDay: number, item: DayPlanItem) => {
    if (hiddenItemIds.has(item.id)) return;
    const targetDay = clampDay(itemDayOverrides[item.id] ?? fallbackDay);
    plan[targetDay - 1].items.push({ ...item, day: targetDay });
  };

  if (selected.flight) {
    pushItem(
      1,
      makeItem(
        "arrival-flight",
        1,
        isJetLag ? "afternoon" : "morning",
        "flight",
        selected.flight.name,
        `${selected.flight.airline} • ${selected.flight.route}`,
        isJetLag ? "12:30" : selected.flight.departureTime,
        isJetLag ? "15:15" : selected.flight.arrivalTime,
        selected.flight.locationLabel,
        selected.flight.imageUrl,
        selected.flight.deepLink,
      ),
    );
  }

  if (selected.transport) {
    pushItem(
      1,
      makeItem(
        "arrival-transport",
        1,
        isJetLag ? "evening" : "midday",
        "transport",
        selected.transport.name,
        `${selected.transport.transportType} arranged to reduce arrival friction.${isWalkingOverload || isElderlyFatigue ? " Lower walking transfer plan." : ""}`,
        isJetLag ? "16:00" : "12:45",
        isJetLag ? "16:45" : "13:30",
        selected.transport.locationLabel,
        selected.transport.imageUrl,
        selected.transport.deepLink,
      ),
    );
  }

  if (selected.hotel) {
    pushItem(
      1,
      makeItem(
        "hotel-check-in",
        1,
        isJetLag ? "evening" : "afternoon",
        "hotel",
        `Check in • ${selected.hotel.name}`,
        `${selected.hotel.area} • ${selected.hotel.amenities.slice(0, 2).join(" • ")}`,
        isJetLag ? "17:15" : "14:30",
        isJetLag ? "18:00" : "15:30",
        selected.hotel.area,
        selected.hotel.imageUrl,
        selected.hotel.deepLink,
      ),
    );
  }

  if (selected.car) {
    pushItem(
      1,
      makeItem(
        "car-pickup",
        1,
        "evening",
        "car",
        `Pick up • ${selected.car.name}`,
        `${selected.car.carType} • ${selected.car.transmission} • ${selected.car.seats} seats`,
        "17:00",
        "17:30",
        selected.car.locationLabel,
        selected.car.imageUrl,
        selected.car.deepLink,
      ),
    );
  }

  const groupedActivities = distributeActivities(
    selected.activities,
    totalDays,
    options?.activityDays,
    tripsPerDay,
    noTripDays,
    lockedRestDays,
  );

  Object.entries(groupedActivities).forEach(([dayKey, acts]) => {
    const dayIndex = Number(dayKey) - 1;
    const cappedActivities = acts.slice(0, needsCalmerPacing ? 2 : 3);
    cappedActivities.forEach((activity, idx) => {
      const timeline: Array<{ slot: DayPlanItem["slot"]; start: string; end: string }> = [
        {
          slot: "morning",
          start: isJetLag && dayIndex === 0 ? "10:45" : "09:30",
          end: isJetLag && dayIndex === 0 ? "12:00" : "11:30",
        },
        {
          slot: isHeatStress ? "evening" : "afternoon",
          start: isHeatStress ? "16:45" : "13:30",
          end: isHeatStress ? "18:15" : "15:30",
        },
        {
          slot: "evening",
          start: isKidFatigue ? "17:45" : "18:30",
          end: isKidFatigue ? "19:00" : "20:30",
        },
      ];
      const timing = timeline[idx] || timeline[2];
      pushItem(
        dayIndex + 1,
        makeItem(
          activity.id,
          dayIndex + 1,
          timing.slot,
          "activity",
          activity.name,
          `${activity.categoryLabel} • ${activity.duration} • ${activity.bestTimeOfDay}${isHeatStress ? " • Heat-safe timing" : ""}${isWalkingOverload ? " • Low walking plan" : ""}`,
          timing.start,
          timing.end,
          activity.locationLabel,
          activity.imageUrl,
          activity.deepLink,
        ),
      );
    });
  });

  selected.hiddenGems.forEach((gem, index) => {
    const targetDay = Math.min(totalDays, Math.max(1, (index % Math.max(totalDays - 1, 1)) + 1));
    if (lockedRestDaySet.has(targetDay)) return;
    const gemStart =
      /sunset|evening|night/i.test(`${gem.bestTime || ""} ${gem.title} ${gem.description}`)
        ? "17:30"
        : isHeatStress && /beach|outdoor|market/i.test(`${gem.title} ${gem.description}`.toLowerCase())
        ? "18:00"
        : "15:30";
    const gemEnd = gemStart === "17:30" ? "18:30" : gemStart === "18:00" ? "19:00" : "16:30";
    pushItem(
      targetDay,
      {
        ...makeItem(
          gem.id,
          targetDay,
          /sunset|evening|night/i.test(`${gem.bestTime || ""} ${gem.title} ${gem.description}`) ? "evening" : "afternoon",
          "hidden_gem",
          gem.title,
          `${gem.whyItFits || gem.aiReason}${gem.bestTime ? ` • Best ${gem.bestTime}` : ""}${gem.crowdNote ? ` • ${gem.crowdNote}` : ""}`,
          gemStart,
          gemEnd,
          gem.locationLabel || gem.destinationLabel,
          gem.imageUrl,
          gem.deepLink,
          gem.priceFrom ?? gem.totalPrice,
          gem.destinationId,
          gem.destinationLabel,
        ),
        affiliateUrl: gem.affiliateUrl,
        provider: gem.provider,
      },
    );
  });

  if (selected.restaurant && !lockedRestDaySet.has(Math.min(totalDays, 2))) {
    const targetDay = Math.min(totalDays, isJetLag ? 1 : 2);
    pushItem(
      targetDay,
      makeItem(
        "dining-highlight",
        targetDay,
        isKidFatigue ? "afternoon" : "evening",
        "restaurant",
        selected.restaurant.name,
        `${selected.restaurant.cuisine} • ${selected.restaurant.mealWindow} • ${selected.restaurant.pricePerPerson} per person${fatigueSignals.size ? " • Rest window added" : ""}`,
        isKidFatigue ? "17:30" : "20:45",
        isKidFatigue ? "18:30" : "22:00",
        selected.restaurant.locationLabel,
        selected.restaurant.imageUrl,
        selected.restaurant.deepLink,
      ),
    );
  }

  destinations.slice(1).forEach((destination, index) => {
    const transferDay = Math.min(totalDays, index + 2 + (isJetLag && index === 0 ? 1 : 0));
    if (lockedRestDaySet.has(transferDay)) return;
    pushItem(
      transferDay,
      makeItem(
        `segment-flight-${destination.id}`,
        transferDay,
        "morning",
        "flight",
        `Continue to ${destination.city}`,
        `Inter-city transfer into ${destination.city}, ${destination.country}.`,
        "09:00",
        "10:30",
        `${destination.city}, ${destination.country}`,
        selected.flight?.imageUrl,
        selected.flight?.deepLink ?? null,
        selected.flight?.fare,
        destination.id,
        `${destination.city}, ${destination.country}`,
      ),
    );

    pushItem(
      transferDay,
      makeItem(
        `segment-hotel-${destination.id}`,
        transferDay,
        "afternoon",
        "hotel",
        destination.preferredHotel
          ? `Check in • ${destination.preferredHotel}`
          : `Check in • ${selected.hotel?.name || "Selected hotel"}`,
        destination.preferredHotel
          ? `${destination.preferredHotel} in ${destination.city}`
          : `${selected.hotel?.area || "Local stay"} • ${destination.city}`,
        "14:00",
        "15:00",
        `${destination.city}, ${destination.country}`,
        selected.hotel?.imageUrl,
        selected.hotel?.deepLink ?? null,
        selected.hotel?.nightlyPrice,
        destination.id,
        `${destination.city}, ${destination.country}`,
      ),
    );
  });

  if (selected.transport && totalDays > 1 && !lockedRestDaySet.has(totalDays)) {
    pushItem(
      totalDays,
      makeItem(
        "departure-transfer",
        totalDays,
        "afternoon",
        "transport",
        `${selected.transport.name} for departure`,
        "Reserved to keep the final movement safe and on time.",
        "15:30",
        "16:15",
        selected.transport.locationLabel,
        selected.transport.imageUrl,
        selected.transport.deepLink,
      ),
    );
  }

  if (selected.flight && totalDays > 1) {
    pushItem(
      totalDays,
      makeItem(
        "return-flight",
        totalDays,
        "evening",
        "flight",
        `Return • ${selected.flight.name}`,
        "Final-day departure block with protected transfer timing.",
        "18:30",
        "21:15",
        selected.flight.locationLabel,
        selected.flight.imageUrl,
        selected.flight.deepLink,
      ),
    );
  }

  const stabilizedPlan = plan.map((day) => {
    const sortedItems = day.items.sort((a, b) => a.startTime.localeCompare(b.startTime));
    if (!lockedRestDaySet.has(day.day)) {
      return {
        ...day,
        items: sortedItems,
      };
    }

    const hasProtectedTravel = sortedItems.some((item) => item.type === "flight" || item.type === "transport");
    return {
      ...day,
      theme: hasProtectedTravel ? `${day.theme} (travel-protected)` : day.theme,
      items:
        sortedItems.length > 0
          ? sortedItems
          : [
              makeItem(
                `rest-day-${day.day}`,
                day.day,
                "afternoon",
                "activity",
                "Rest / free day",
                "Locked from the planner inputs, so Gene keeps this day open for recovery, flexibility, or light local time.",
                "12:00",
                "14:00",
                destinations[Math.min(day.day - 1, destinations.length - 1)]
                  ? `${destinations[Math.min(day.day - 1, destinations.length - 1)]!.city}, ${destinations[Math.min(day.day - 1, destinations.length - 1)]!.country}`
                  : inputs.destination,
                undefined,
                null,
                0,
                destinations[Math.min(day.day - 1, destinations.length - 1)]?.id,
                destinations[Math.min(day.day - 1, destinations.length - 1)]
                  ? `${destinations[Math.min(day.day - 1, destinations.length - 1)]!.city}, ${destinations[Math.min(day.day - 1, destinations.length - 1)]!.country}`
                  : inputs.destination,
              ),
        ],
    };
  });

  const crowdAwarePlan = await Promise.all(
    stabilizedPlan.map(async (day) => {
      const crowdAdjustedItems = await annotateDayPlanWithCrowd(day.items, day.date, inputs);
      const reorderedItems = crowdAdjustedItems.map((item) => {
        if (
          item.type === "activity" &&
          item.crowdLevel &&
          (item.crowdLevel === "high" || item.crowdLevel === "very-high") &&
          item.bestVisitHours?.length
        ) {
          const betterStart = item.bestVisitHours[0];
          const endHour = Number((item.endTime.split(":")[0] || "0"));
          const endMinute = Number((item.endTime.split(":")[1] || "0"));
          const startHour = Number((item.startTime.split(":")[0] || "0"));
          const startMinute = Number((item.startTime.split(":")[1] || "0"));
          const duration = Math.max((endHour * 60 + endMinute) - (startHour * 60 + startMinute), 60);
          const betterStartHour = Number((betterStart.split(":")[0] || "0"));
          const betterStartMinute = Number((betterStart.split(":")[1] || "0"));
          const betterEndMinutes = betterStartHour * 60 + betterStartMinute + duration;
          const adjustedEnd = `${String(Math.floor(betterEndMinutes / 60)).padStart(2, "0")}:${String(betterEndMinutes % 60).padStart(2, "0")}`;
          return {
            ...item,
            startTime: betterStart,
            endTime: adjustedEnd,
            crowdNote: item.crowdNote || "Timing moved to a lower-crowd hour.",
          };
        }
        return item;
      });

      return {
        ...day,
        items: reorderedItems.sort((a, b) => a.startTime.localeCompare(b.startTime)),
      };
    }),
  );

  return crowdAwarePlan;
}

export function buildAnalysisModules(selected: SelectedRecommendations, inputs: UserTripInput, dayPlan: DayPlan[]): AnalysisModule[] {
  const activityCount = selected.activities.length;
  const fatigueSignals = new Set(inputs.energyFatigueSignals || []);
  const realism = Math.max(58, 92 - Math.max(activityCount - dayPlan.length * 2, 0) * 5);
  const fatigue = Math.max(42, 88 - Math.max(activityCount - 3, 0) * 7 - (inputs.walkingTolerance < 40 ? 10 : 0) - (fatigueSignals.has("Exhaustion Probability") ? 10 : 0) - (fatigueSignals.has("Jet Lag Effect") ? 8 : 0));
  const walking = Math.max(38, (inputs.walkingTolerance < 45 ? 62 : 84) - (fatigueSignals.has("Walking Overload") ? 18 : 0) - (fatigueSignals.has("Elderly Fatigue") ? 10 : 0));
  const transfer = (selected.transport?.transportType.toLowerCase().includes("private") ? 88 : 73) - (fatigueSignals.has("Walking Overload") ? 6 : 0) - (fatigueSignals.has("Jet Lag Effect") ? 5 : 0);
  const budget = inputs.budget > 0 ? Math.max(60, 90 - (selected.hotel?.nightlyPrice || 0) / 20) : 78;
  const fragility = Math.max(40, 88 - Math.max(activityCount - 4, 0) * 8 - (fatigueSignals.has("Overstimulation") ? 8 : 0) - (fatigueSignals.has("Kid Fatigue") ? 6 : 0));

  return [
    { key: "realism", title: "Realism", value: realism, label: `${realism}/100`, description: "How executable this trip looks in real conditions." },
    { key: "fatigue", title: "Fatigue", value: fatigue, label: `${fatigue}/100`, description: "How demanding the current pacing feels across the selected days." },
    { key: "walking", title: "Walking", value: walking, label: `${walking}/100`, description: "How well the plan matches your walking tolerance and comfort needs." },
    { key: "transfer", title: "Transfer Stress", value: transfer, label: `${transfer}/100`, description: "How much friction the trip creates between major blocks." },
    { key: "budget", title: "Budget Fit", value: budget, label: `${Math.round(budget)}/100`, description: "How closely the plan stays aligned with the intended spend." },
    { key: "fragility", title: "Fragility", value: fragility, label: `${fragility}/100`, description: "How easily the day plan could break if one part changes." },
  ];
}

export function buildAnalysisInsights(selected: SelectedRecommendations, inputs: UserTripInput, dayPlan: DayPlan[]): AnalysisInsight[] {
  const modules = buildAnalysisModules(selected, inputs, dayPlan);
  const fatigueSignals = new Set(inputs.energyFatigueSignals || []);
  return [
    {
      key: "realism",
      title: "Realism score",
      icon: "RS",
      status: modules[0].value > 80 ? "good" : modules[0].value > 65 ? "warn" : "bad",
      text: selected.flight
        ? fatigueSignals.has("Jet Lag Effect")
          ? "Day 1 is intentionally lighter because jet lag recovery was selected as a hard planning rule."
          : "Arrival, transfer, and hotel handoff are aligned well enough to keep the first day realistic."
        : "The trip structure is balanced, but adding a confirmed arrival block would strengthen realism.",
      value: modules[0].value,
    },
    {
      key: "fatigue",
      title: "Fatigue meter",
      icon: "FM",
      status: modules[1].value > 80 ? "good" : modules[1].value > 65 ? "warn" : "bad",
      text: selected.activities.length > 4
        ? "The itinerary is attractive, but the density of experiences raises the risk of late-day fatigue."
        : fatigueSignals.size
        ? `The selected cadence is being softened because ${Array.from(fatigueSignals).slice(0, 2).join(" and ")} was selected.`
        : "The selected cadence keeps enough breathing room between signature moments.",
      value: modules[1].value,
    },
    {
      key: "weather",
      title: "Weather fit",
      icon: "WF",
      status: selected.activities.some((activity) => activity.fitTags.some((tag) => /indoor/i.test(tag))) ? "good" : "warn",
      text: selected.activities.some((activity) => activity.weatherFit.toLowerCase().includes("rain"))
        ? "The plan includes at least one indoor or weather-safe block, which protects the day from disruption."
        : "Most selected experiences lean outdoor, so a backup indoor swap should be kept ready.",
      value: selected.activities.some((activity) => activity.weatherFit.toLowerCase().includes("excellent")) ? 84 : 68,
    },
    {
      key: "safety",
      title: "AI safety note",
      icon: "SN",
      status: "good",
      text: selected.transport
        ? fatigueSignals.has("Walking Overload") || fatigueSignals.has("Elderly Fatigue")
          ? "Transport choices are being used to reduce walking strain and make transfers more comfortable."
          : "A dedicated arrival/departure transport layer lowers the chance of missed transitions and rushed final-day movement."
        : "Add a confirmed transport option to reduce uncertainty between airport, hotel, and major activity zones.",
      value: selected.transport ? 86 : 63,
    },
    {
      key: "why",
      title: "Why this works",
      icon: "WT",
      status: "good",
      text: `The current plan works because ${selected.hotel ? "the hotel zone" : "the stay base"} supports ${selected.activities.length} selected experiences with manageable movement cost, a ${inputs.travelStyle} rhythm, and the fatigue rules ${inputs.energyFatigueSignals?.join(", ") || "remain optional"}.`,
      value: 88,
    },
  ];
}
