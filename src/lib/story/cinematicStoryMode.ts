import type {
  AnalysisInsight,
  CinematicStoryDay,
  CinematicStoryMode,
  DayPlan,
  DayPlanItem,
  RecommendationPayload,
  UserTripInput,
} from "@/lib/recommendation/types";

type CinematicStoryContext = {
  plannerInput: UserTripInput;
  itinerary: DayPlan[];
  analysis?: AnalysisInsight[];
  routeLabel: string;
};

function titleCase(value: string) {
  return value
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function formatReadableDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function formatStoryDuration(seconds: number) {
  const minutes = Math.max(1, Math.floor(seconds / 60));
  const remainder = Math.max(5, seconds % 60);
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function inferMoodFromDay(day: DayPlan, plannerInput: UserTripInput): CinematicStoryDay["mood"] {
  const personality = plannerInput.tripPersonality ?? [];
  const lowerPersonality = personality.map((item) => item.toLowerCase());
  const itemText = day.items.map((item) => `${item.title} ${item.description}`.toLowerCase()).join(" ");

  if (lowerPersonality.some((item) => item.includes("luxury"))) return "luxury";
  if (lowerPersonality.some((item) => item.includes("hidden"))) return "hidden_gems";
  if (lowerPersonality.some((item) => item.includes("nightlife")) || itemText.includes("cruise")) return "nightlife";
  if (plannerInput.travelerType === "family") return "family";
  if (itemText.includes("museum") || itemText.includes("temple") || itemText.includes("acropolis")) return "culture";
  if (itemText.includes("beach") || itemText.includes("catamaran") || itemText.includes("viewpoint")) return "nature";
  if (itemText.includes("flight") || itemText.includes("transfer")) return "adventure";
  if ((plannerInput.energyFatigueSignals ?? []).length > 0) return "relaxed";
  return "mixed";
}

function chooseLocation(day: DayPlan, plannerInput: UserTripInput) {
  const itemWithDestination = day.items.find((item) => item.destinationLabel);
  const label = itemWithDestination?.destinationLabel || plannerInput.destinations?.[0]?.city || plannerInput.destination;
  const [city, country] = label.split(",").map((part) => part.trim());
  return {
    city: city || plannerInput.destination,
    country: country || plannerInput.destinations?.find((item) => item.city === city)?.country || "",
  };
}

function getBestDayImage(day: DayPlan) {
  const withImage = day.items.find((item) => item.imageUrl);
  return withImage?.imageUrl;
}

function buildStoryTitle(day: DayPlan, city?: string, mood?: CinematicStoryDay["mood"]) {
  const notable = day.items.find((item) => item.type === "activity" || item.type === "hidden_gem") ?? day.items[0];
  if (notable?.type === "flight") {
    return `From One Horizon to the Next`;
  }
  if (mood === "hidden_gems") return `Quiet Corners of ${city || "the City"}`;
  if (mood === "luxury") return `A Refined Day in ${city || "the City"}`;
  if (mood === "family") return `A Warm Day Together in ${city || "the City"}`;
  if (mood === "nightlife") return `${city || "The City"} After Sunset`;
  if (notable?.title) {
    return titleCase(notable.title.length > 34 ? notable.title.slice(0, 34) : notable.title);
  }
  return `Day ${day.day} in ${city || "Your Journey"}`;
}

function buildStoryLine(day: DayPlan, location: { city?: string; country?: string }, plannerInput: UserTripInput, mood: CinematicStoryDay["mood"]) {
  const names = day.items
    .filter((item) => item.type !== "transport" && item.type !== "car")
    .slice(0, 3)
    .map((item) => item.title);
  const focus = names[0] || location.city || plannerInput.destination;

  if (day.items.some((item) => item.type === "flight")) {
    return `Leave ${plannerInput.destination} behind and arrive in ${location.city || "your next stop"}, where the next chapter opens with lighter skies and a fresh rhythm.`;
  }
  if (mood === "luxury") {
    return `Move through ${location.city || "the city"} with a slower, polished rhythm, balancing signature moments with comfort, views, and beautifully timed pauses.`;
  }
  if (mood === "hidden_gems") {
    return `Trade the obvious route for a more local pulse, with ${focus} setting the tone for a day that feels quietly special and deeply lived-in.`;
  }
  if (mood === "nightlife") {
    return `Ease into the day, then let ${location.city || "the city"} build toward evening energy, good tables, and a skyline that comes alive after dark.`;
  }
  if (mood === "family") {
    return `Follow a softer pace through ${location.city || "the city"}, where each stop leaves room for comfort, shared moments, and easy transitions.`;
  }
  return `Wake into ${location.city || "the city"} through ${focus}, then let the day unfold across real highlights, local texture, and a finish worth remembering.`;
}

function buildPracticalSummary(day: DayPlan) {
  const items = day.items
    .filter((item) => item.type !== "transport" && item.type !== "car")
    .slice(0, 4)
    .map((item) => item.title);
  if (!items.length) return "Flexible day with lighter pacing and room to explore.";
  return items.join(", ");
}

function buildTripTitle(plannerInput: UserTripInput, itinerary: DayPlan[]) {
  const destinations = plannerInput.destinations?.length
    ? plannerInput.destinations.map((item) => item.city)
    : [plannerInput.destination];
  if (destinations.length > 1) {
    return `${destinations[0]} to ${destinations[destinations.length - 1]}: Your Gene Journey`;
  }
  return `${destinations[0]}: Your Gene Journey`;
}

function buildIntro(context: CinematicStoryContext) {
  const personalities = context.plannerInput.tripPersonality ?? [];
  const moodHint = personalities.length ? ` shaped by ${personalities.slice(0, 2).join(" and ").toLowerCase()}` : "";
  return `A carefully paced route across ${context.routeLabel.replace(/\s+->\s+/g, " to ")},${moodHint} built from the places, timings, and real moments already in your itinerary.`;
}

function buildEndingLine(context: CinematicStoryContext) {
  const hasFlightDay = context.itinerary.some((day) => day.items.some((item) => item.type === "flight"));
  if (hasFlightDay) {
    return "From first light to final boarding call, the story stays grounded in the trip you actually chose.";
  }
  return "Every chapter stays anchored to your real itinerary, ready to be relived or shared.";
}

export function buildShareCaption(story: CinematicStoryMode) {
  return `${story.tripTitle} — ${story.days.length} cinematic days shaped by Gene Travel. ${story.endingLine}`;
}

export function buildCinematicStoryContext(
  plannerInput: UserTripInput,
  itinerary: DayPlan[],
  analysis?: AnalysisInsight[],
): CinematicStoryContext {
  const routeStops = plannerInput.destinations?.length
    ? plannerInput.destinations.map((item) => `${item.city}, ${item.country}`)
    : [plannerInput.destination];
  return {
    plannerInput,
    itinerary,
    analysis,
    routeLabel: routeStops.join(" -> "),
  };
}

export function fallbackCinematicStoryMode(context: CinematicStoryContext): CinematicStoryMode {
  const days: CinematicStoryDay[] = context.itinerary.map((day) => {
    const location = chooseLocation(day, context.plannerInput);
    const mood = inferMoodFromDay(day, context.plannerInput);
    const highlightItems = day.items.slice(0, 4).map((item) => item.title);
    const estimatedReadSeconds = Math.max(70, Math.min(120, 50 + highlightItems.length * 12));
    return {
      dayNumber: day.day,
      date: day.date,
      city: location.city,
      country: location.country,
      cinematicTitle: buildStoryTitle(day, location.city, mood),
      storyLine: buildStoryLine(day, location, context.plannerInput, mood),
      practicalSummary: buildPracticalSummary(day),
      mood,
      highlightItems,
      estimatedReadSeconds,
      imageUrl: getBestDayImage(day),
    };
  });

  const story: CinematicStoryMode = {
    tripTitle: buildTripTitle(context.plannerInput, context.itinerary),
    intro: buildIntro(context),
    days,
    endingLine: buildEndingLine(context),
    shareCaption: "",
    confidence: days.length ? 0.82 : 0.54,
    generatedAt: new Date().toISOString(),
  };

  story.shareCaption = buildShareCaption(story);
  return story;
}

export function generateCinematicStoryPrompt(context: CinematicStoryContext) {
  return [
    "Generate a cinematic but concise story mode for the final itinerary.",
    "Use only the real itinerary items, selected destinations, dates, traveler personality, weather, crowd notes, and plan context.",
    "Do not invent activities, hotels, flights, prices, or booking details.",
    "Write emotional cinematic copy, but keep it practical and short.",
    `Route: ${context.routeLabel}`,
    `Trip dates: ${formatReadableDate(context.plannerInput.startDate)} to ${formatReadableDate(context.plannerInput.endDate)}`,
    `Traveler personality: ${(context.plannerInput.tripPersonality ?? []).join(", ") || "Not specified"}`,
    `Energy signals: ${(context.plannerInput.energyFatigueSignals ?? []).join(", ") || "None"}`,
  ].join("\n");
}

export function generateCinematicStoryMode(context: CinematicStoryContext) {
  return fallbackCinematicStoryMode(context);
}

export function buildCinematicStoryModeFromPayload(payload: RecommendationPayload) {
  const context = buildCinematicStoryContext(payload.inputs, payload.dayPlan, payload.analysis);
  return generateCinematicStoryMode(context);
}

export function getStoryCardDurationLabel(seconds: number) {
  return formatStoryDuration(seconds);
}

export function getDayItemMoodIconSeed(item: DayPlanItem) {
  if (item.type === "flight") return "travel";
  if (item.type === "hotel") return "stay";
  if (item.type === "restaurant") return "dining";
  if (item.type === "hidden_gem") return "discovery";
  return "highlight";
}
