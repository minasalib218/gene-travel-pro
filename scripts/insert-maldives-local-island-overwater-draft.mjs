import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import crypto from "node:crypto";

const SOURCE_ENV_PATH = new URL("../.env", import.meta.url);
const SLUG = "maldives-local-island-soul-and-overwater-blue";
const PLAN_TITLE = "Maldives: Local Island Soul & Overwater Blue";

const THAILAND_ROOT = "/images/Thailand Island Pulse";
const BALI_ROOT = "/images/Bali Spirit & Island Glow";
const images = {
  hero: `${BALI_ROOT}/card.jpg`,
  localIsland: `${THAILAND_ROOT}/phuket hotel.jpg`,
  reef: `${THAILAND_ROOT}/dive 1.jpg`,
  sandbank: `${BALI_ROOT}/Nusa Penida Day Tour in Bali.jfif`,
  lagoon: `${THAILAND_ROOT}/ao nang hotel.jpg`,
  sunset: `${BALI_ROOT}/eat on sea.jpg`,
  suggestion: `${THAILAND_ROOT}/3 monkeys sugg 2.jfif`,
};

function asId() {
  return crypto.randomUUID();
}

function item(id, type, time, title, description, extra = {}) {
  return {
    id,
    type,
    time,
    title,
    description,
    imageUrl: extra.imageUrl || images.hero,
    buttonLabel: "Book Now",
    showButton: true,
    status: "Draft",
    badge: extra.badge || type,
    price: extra.price || "Live price",
    people: extra.people || "2 People",
    deeplink: "",
    ...extra,
  };
}

function suggestion(id, title, category, matchReason, extra = {}) {
  return {
    id,
    title,
    category,
    imageUrl: extra.imageUrl || images.suggestion,
    matchReason,
    matchScore: extra.matchScore || "Excellent Route Fit",
    price: extra.price || "Live price",
    duration: extra.duration || "Flexible",
    ctaText: "Book Now",
  };
}

function buildSummary(items, estimatedCost = "Live pricing") {
  const count = (types) => items.filter((entry) => types.includes(entry.type)).length;
  return {
    activitiesCount: String(count(["activity", "event"])),
    restaurantsCount: String(count(["restaurant"])),
    transfersCount: String(count(["transportation", "transfer", "flight"])),
    estimatedCost,
    upgrades: [],
    viewDetailsText: "View Details",
    editPlanText: "Edit Plan",
  };
}

function day({ dayNumber, title, destinationLabel, countryLabel, imageUrl, routeFrom, routeTo, weatherLabel, quote, description, items, suggestions, notes }) {
  return {
    id: `day-${dayNumber}`,
    dayNumber,
    title,
    destinationLabel,
    countryLabel,
    previewImage: imageUrl,
    heroImage: imageUrl,
    dateLabel: `Day ${dayNumber}`,
    routeFrom,
    routeTo,
    weatherLabel,
    quote,
    description,
    timelineItems: items,
    suggestions,
    story: {
      imageUrl,
      quote,
      musicLabel: "Cinematic Story",
      musicUrl: "",
    },
    summary: buildSummary(items),
    notes,
  };
}

function buildContent() {
  const days = [
    day({
      dayNumber: 1,
      title: "Arrival - From Airport to Island Life",
      destinationLabel: "Maafushi",
      countryLabel: "Maldives",
      imageUrl: images.localIsland,
      routeFrom: "Velana International Airport",
      routeTo: "Maafushi, Kaani Palm Beach, Bikini Beach",
      weatherLabel: "Arrival / Very low fatigue",
      quote: "The Maldives begins gently: speedboat spray, island streets and a slow sunset.",
      description:
        "Arrive at Velana International Airport, allow immigration and baggage time, connect to the Maafushi speedboat, check into Kaani Palm Beach, then keep the evening easy with Bikini Beach, local-island streets and dinner.",
      items: [
        item("d1-arrival", "flight", "12:00", "Arrival at Velana International Airport", "Use live flight timing and allow immigration, baggage and a realistic arrival buffer.", { imageUrl: images.localIsland, badge: "Arrival" }),
        item("d1-speedboat", "transportation", "14:00", "Velana to Maafushi Speedboat", "Plan around 35 minutes by speedboat when conditions are suitable, with a check-in and waiting buffer before departure.", { imageUrl: images.localIsland, badge: "Speedboat" }),
        item("d1-hotel", "hotel", "15:00", "Kaani Palm Beach Check-In", "Begin the first four nights on Maafushi with beachfront access, ocean-view room options and local-island atmosphere.", { imageUrl: images.localIsland, badge: "Hotel" }),
        item("d1-beach", "activity", "17:00", "Bikini Beach and Island Walk", "No paid excursion on arrival day: beach, Maafushi streets, small shops and waterfront sunset.", { imageUrl: images.localIsland, badge: "Beach" }),
        item("d1-dinner", "restaurant", "19:30", "Easy Maafushi Dinner", "A relaxed first dinner before an early sleep.", { imageUrl: images.localIsland, badge: "Dinner" }),
      ],
      suggestions: [
        suggestion("d1-s1", "Ocean-View Room Upgrade", "Hotel Upgrade", "Strong fit for couples who want the local-island section to still feel premium.", { imageUrl: images.localIsland }),
        suggestion("d1-s2", "Private Airport Transfer Help", "Comfort Upgrade", "Useful when arrival timing is tight or the traveler wants less transfer stress.", { imageUrl: images.localIsland }),
      ],
      notes: [
        { icon: "clock", text: "Do not schedule a paid excursion on arrival day." },
        { icon: "boat", text: "Speedboat timing must be confirmed for the customer's exact flight." },
        { icon: "sun", text: "Keep sunscreen and light clothes ready for the first island walk." },
      ],
    }),
    day({
      dayNumber: 2,
      title: "Coral & Turtle Day - The First Maldives Blue",
      destinationLabel: "Maafushi",
      countryLabel: "Maldives",
      imageUrl: images.reef,
      routeFrom: "Maafushi",
      routeTo: "Coral Garden, turtle reef area, sandbank if included",
      weatherLabel: "Marine excursion / Moderate fatigue",
      quote: "The first true blue arrives beneath the surface, among coral and turtle waters.",
      description:
        "A short marine excursion day built around coral garden snorkeling, a turtle reef area and possible sandbank time depending on the operator schedule. Wildlife sightings are never guaranteed.",
      items: [
        item("d2-breakfast", "restaurant", "07:30", "Breakfast", "Start with a steady breakfast before the harbor walk.", { imageUrl: images.reef, badge: "Breakfast" }),
        item("d2-harbor", "transportation", "08:30", "Walk or Transfer to Harbor", "Short movement from the hotel to the excursion meeting point.", { imageUrl: images.localIsland, badge: "Harbor" }),
        item("d2-main", "activity", "09:00", "Coral Garden and Turtle Snorkeling Boat Tour", "A roughly four-hour Maafushi boat tour with coral reef snorkeling, a turtle reef area and sandbank time if included by the operator.", { imageUrl: images.reef, badge: "Snorkeling", duration: "4 Hours" }),
        item("d2-lunch", "restaurant", "13:15", "Maafushi Lunch", "Return to Maafushi for lunch after the boat tour.", { imageUrl: images.localIsland, badge: "Lunch" }),
        item("d2-rest", "activity", "14:30", "Mandatory Rest Block", "Beach or pool time only after the marine activity.", { imageUrl: images.localIsland, badge: "Recovery" }),
      ],
      suggestions: [
        suggestion("d2-s1", "Private Snorkeling Guide Upgrade", "Marine Upgrade", "Best for nervous swimmers or travelers who want more attention in the water.", { imageUrl: images.reef }),
        suggestion("d2-s2", "Underwater Photo Package", "Photo Upgrade", "Strong add-on for honeymoon and social-media-focused travelers.", { imageUrl: images.reef }),
      ],
      notes: [
        { icon: "water", text: "Do not promise turtle sightings; nature is never guaranteed." },
        { icon: "sun", text: "Use reef-safe sunscreen and hydrate." },
        { icon: "clock", text: "This day stays intentionally shorter than a 10-hour boat day." },
      ],
    }),
    day({
      dayNumber: 3,
      title: "Sandbank Cinematic Day - White Sand in the Middle of the Ocean",
      destinationLabel: "Maafushi",
      countryLabel: "Maldives",
      imageUrl: images.sandbank,
      routeFrom: "Maafushi",
      routeTo: "Sandbank, reef snorkeling and open-ocean photo stops",
      weatherLabel: "Visual hero / Medium fatigue",
      quote: "A white strip of sand, nothing but Indian Ocean blue around it.",
      description:
        "A slow morning leads into a three-hour sandbank and snorkeling experience. This is one of the plan's strongest visual moments and should become a hero card after final images are added.",
      items: [
        item("d3-breakfast", "restaurant", "08:00", "Breakfast", "A relaxed start before the afternoon sandbank trip.", { imageUrl: images.localIsland, badge: "Breakfast" }),
        item("d3-beach", "activity", "09:30", "Slow Maafushi Beach Morning", "Light beach time and no heavy morning tour.", { imageUrl: images.localIsland, badge: "Beach" }),
        item("d3-main", "activity", "14:00", "Sandbank Tour with Snorkeling", "A roughly three-hour experience with reef snorkeling, sandbank time, swimming and photos according to the selected operator.", { imageUrl: images.sandbank, badge: "Hero Card", duration: "3 Hours" }),
        item("d3-sunset", "activity", "18:15", "Maafushi Sunset", "Return, shower, rest and catch sunset.", { imageUrl: images.sunset, badge: "Sunset" }),
        item("d3-dinner", "restaurant", "19:00", "Island Dinner", "Easy dinner after the sandbank experience.", { imageUrl: images.localIsland, badge: "Dinner" }),
      ],
      suggestions: [
        suggestion("d3-s1", "Private Sandbank Picnic", "Luxury Upgrade", "Ideal for honeymooners who want a more private visual moment.", { imageUrl: images.sandbank }),
        suggestion("d3-s2", "Drone Photo Add-On", "Photo Upgrade", "Offer only where legal, safe and available through the provider.", { imageUrl: images.sandbank }),
      ],
      notes: [
        { icon: "camera", text: "This is one of the top five hero-image moments for the plan." },
        { icon: "boat", text: "Meeting point must be checked against the customer's exact hotel." },
        { icon: "water", text: "Weather and tide conditions can change the sandbank timing." },
      ],
    }),
    day({
      dayNumber: 4,
      title: "Maldives Local-Island Day - Slow Ocean & Optional Sunset Cruise",
      destinationLabel: "Maafushi",
      countryLabel: "Maldives",
      imageUrl: images.localIsland,
      routeFrom: "Maafushi",
      routeTo: "Bikini Beach, hotel pool, optional dolphin sunset cruise",
      weatherLabel: "Low fatigue / Optional marine add-on",
      quote: "The Maldives should feel like a holiday, not a daily checklist.",
      description:
        "A deliberately slow local-island day with beach, pool, spa or cafe time. The sunset and dolphin-watching cruise is optional, and dolphin sightings are not guaranteed.",
      items: [
        item("d4-breakfast", "restaurant", "08:00", "Breakfast", "Slow breakfast before a relaxed island day.", { imageUrl: images.localIsland, badge: "Breakfast" }),
        item("d4-beach", "activity", "09:30", "Bikini Beach, Swimming and Pool", "Enjoy the beach and hotel pool with no morning excursion.", { imageUrl: images.localIsland, badge: "Beach" }),
        item("d4-free", "activity", "13:00", "Spa, Nap, Cafe or Free Time", "Unstructured downtime keeps the plan from feeling overbuilt.", { imageUrl: images.localIsland, badge: "Free Time" }),
        item("d4-cruise", "activity", "16:00", "Optional Sunset Cruise with Dolphin Watching", "A roughly two-hour sunset cruise option; dolphin sightings depend on nature and should never be guaranteed.", { imageUrl: images.sunset, badge: "Optional" }),
        item("d4-pack", "activity", "21:00", "Pack for Luxury Resort Transfer", "Prepare bags for the move to the South Male Atoll resort on Day 5.", { imageUrl: images.localIsland, badge: "Pack" }),
      ],
      suggestions: [
        suggestion("d4-s1", "Skip Cruise and Keep Sunset Free", "Recovery Option", "Recommended when the traveler wants a true rest day.", { imageUrl: images.sunset }),
        suggestion("d4-s2", "Couples Beach Dinner", "Romantic Upgrade", "A soft romantic option without adding a long excursion.", { imageUrl: images.sunset }),
      ],
      notes: [
        { icon: "heart", text: "Make the sunset cruise optional, not mandatory." },
        { icon: "bag", text: "Pack before sleeping to protect the transfer morning." },
        { icon: "water", text: "Wildlife sightings are never guaranteed." },
      ],
    }),
    day({
      dayNumber: 5,
      title: "Maafushi to Luxury Maldives - Local Island to Overwater Villa",
      destinationLabel: "South Male Atoll",
      countryLabel: "Maldives",
      imageUrl: images.lagoon,
      routeFrom: "Maafushi",
      routeTo: "Male or Velana transfer point, Anantara Veli Maldives Resort",
      weatherLabel: "Transfer / Low fatigue",
      quote: "This is the selling turn: local island soul becomes overwater blue.",
      description:
        "Move safely from Maafushi to the luxury resort using a confirmed transfer path through Male or Velana. The day is intentionally free of excursions so the customer enjoys the resort they paid for.",
      items: [
        item("d5-breakfast", "restaurant", "07:30", "Breakfast", "Start calmly before checkout.", { imageUrl: images.localIsland, badge: "Breakfast" }),
        item("d5-checkout", "hotel", "09:00", "Kaani Palm Beach Checkout Preparation", "Prepare for the transfer from Maafushi to the luxury resort.", { imageUrl: images.localIsland, badge: "Checkout" }),
        item("d5-transfer1", "transportation", "09:30", "Maafushi to Male or Velana Transfer Point", "Do not assume a direct hotel-to-hotel transfer; Gene should confirm the safe connection route before travel.", { imageUrl: images.lagoon, badge: "Speedboat" }),
        item("d5-transfer2", "transportation", "12:30", "Anantara Speedboat Connection", "Plan around 30 minutes from Velana to Anantara Veli when conditions are suitable.", { imageUrl: images.lagoon, badge: "Resort Transfer" }),
        item("d5-resort", "hotel", "14:00", "Anantara Veli Maldives Resort Check-In", "Three nights of overwater-villa and lagoon-focused luxury. For families, Gene should switch to Anantara Dhigu.", { imageUrl: images.lagoon, badge: "Luxury Hotel" }),
        item("d5-dinner", "restaurant", "19:30", "Resort Dinner", "No excursions today; enjoy the overwater villa, beach, lagoon and resort sunset.", { imageUrl: images.sunset, badge: "Dinner" }),
      ],
      suggestions: [
        suggestion("d5-s1", "Over Water Villa Upgrade", "Honeymoon Upgrade", "The most important premium upgrade for this plan.", { imageUrl: images.lagoon }),
        suggestion("d5-s2", "Family Variant: Anantara Dhigu", "Family Alternative", "Use for families because Anantara Veli is primarily adults/couples focused.", { imageUrl: images.lagoon }),
      ],
      notes: [
        { icon: "boat", text: "Confirm boat times before travel day." },
        { icon: "heart", text: "This transfer is the plan's main commercial story." },
        { icon: "sun", text: "Do not fill the resort arrival day with extra activities." },
      ],
    }),
    day({
      dayNumber: 6,
      title: "Lagoon & Reef Luxury Day - Wake Above the Indian Ocean",
      destinationLabel: "South Male Atoll",
      countryLabel: "Maldives",
      imageUrl: images.lagoon,
      routeFrom: "Anantara Veli",
      routeTo: "Lagoon, resort reef, spa, villa and beach",
      weatherLabel: "Very low fatigue / Luxury resort",
      quote: "Wake above the lagoon and let the resort become the itinerary.",
      description:
        "A resort-centered day: breakfast, villa and lagoon time, guided snorkeling or a resort-supported water activity if available, lunch, spa, pool, beach and premium dinner.",
      items: [
        item("d6-breakfast", "restaurant", "07:30", "Resort Breakfast", "A slow luxury breakfast above or near the lagoon.", { imageUrl: images.lagoon, badge: "Breakfast" }),
        item("d6-lagoon", "activity", "09:00", "Villa and Lagoon Time", "Use the overwater-villa experience rather than leaving the resort.", { imageUrl: images.lagoon, badge: "Lagoon" }),
        item("d6-snorkel", "activity", "10:30", "Resort-Guided Snorkeling or Water Activity", "Optional resort-supported snorkeling or water activity depending on availability, weather and safety.", { imageUrl: images.reef, badge: "Snorkeling" }),
        item("d6-spa", "activity", "13:30", "Spa, Villa, Pool and Nap", "A premium low-fatigue block designed around the resort.", { imageUrl: images.lagoon, badge: "Spa" }),
        item("d6-dinner", "restaurant", "19:30", "Premium Resort Dinner", "End with a polished resort dinner.", { imageUrl: images.sunset, badge: "Dinner" }),
      ],
      suggestions: [
        suggestion("d6-s1", "Couples Spa Ritual", "Honeymoon Upgrade", "A strong add-on without disrupting the rest rhythm.", { imageUrl: images.lagoon }),
        suggestion("d6-s2", "Private Lagoon Photography", "Photo Upgrade", "Useful for honeymoon and social content.", { imageUrl: images.lagoon }),
      ],
      notes: [
        { icon: "water", text: "The second half of the trip is intentionally resort-focused." },
        { icon: "sun", text: "Check weather before confirming water activities." },
        { icon: "heart", text: "This day should feel premium and unhurried." },
      ],
    }),
    day({
      dayNumber: 7,
      title: "Ultimate Maldives Day - Nothing But Blue",
      destinationLabel: "South Male Atoll",
      countryLabel: "Maldives",
      imageUrl: images.lagoon,
      routeFrom: "Anantara Veli",
      routeTo: "Overwater villa, beach, spa, optional resort water activity",
      weatherLabel: "Very low fatigue / Final blue day",
      quote: "Do not over-plan paradise: this is the day for blue, quiet and farewell light.",
      description:
        "A final full resort day with breakfast, swimming, villa time, lunch, spa or rest, optional water activity, beach sunset and farewell dinner.",
      items: [
        item("d7-breakfast", "restaurant", "08:00", "Slow Resort Breakfast", "A relaxed final full morning.", { imageUrl: images.lagoon, badge: "Breakfast" }),
        item("d7-swim", "activity", "09:30", "Overwater Villa and Swimming", "Let the customer use the villa and lagoon as the main experience.", { imageUrl: images.lagoon, badge: "Lagoon" }),
        item("d7-rest", "activity", "13:30", "Spa or Rest", "Keep this block open for rest, spa or quiet villa time.", { imageUrl: images.lagoon, badge: "Recovery" }),
        item("d7-water", "activity", "15:00", "Optional Resort Water Activity", "Offer a resort water activity only if the traveler wants one; no booking is also a valid choice.", { imageUrl: images.reef, badge: "Optional" }),
        item("d7-dinner", "restaurant", "19:00", "Farewell Dinner", "Final resort dinner before packing.", { imageUrl: images.sunset, badge: "Farewell" }),
      ],
      suggestions: [
        suggestion("d7-s1", "No Booking At All", "Recovery Choice", "Recommended for travelers who want one perfect unstructured Maldives day.", { imageUrl: images.lagoon }),
        suggestion("d7-s2", "Private Farewell Dinner", "Romantic Upgrade", "Strong final-night honeymoon add-on.", { imageUrl: images.sunset }),
      ],
      notes: [
        { icon: "heart", text: "This is a key day for learning not to over-plan." },
        { icon: "bag", text: "Pack bags after dinner." },
        { icon: "camera", text: "Final sunset is one of the plan's hero content moments." },
      ],
    }),
    day({
      dayNumber: 8,
      title: "Departure - Last Morning Above the Lagoon",
      destinationLabel: "South Male Atoll",
      countryLabel: "Maldives",
      imageUrl: images.lagoon,
      routeFrom: "Anantara Veli",
      routeTo: "Velana International Airport",
      weatherLabel: "Departure only",
      quote: "One last swim, then a clean transfer home.",
      description:
        "Departure day stays simple: breakfast, final swim and photographs, packing, official checkout and resort-confirmed speedboat transfer to Velana with at least a three-hour international flight buffer.",
      items: [
        item("d8-breakfast", "restaurant", "07:30", "Breakfast", "Final breakfast at the resort.", { imageUrl: images.lagoon, badge: "Breakfast" }),
        item("d8-swim", "activity", "09:00", "Final Swim and Photographs", "A soft final lagoon moment before packing.", { imageUrl: images.lagoon, badge: "Lagoon" }),
        item("d8-checkout", "hotel", "12:00", "Official Resort Checkout", "Checkout timing follows the resort's confirmed policy.", { imageUrl: images.lagoon, badge: "Checkout" }),
        item("d8-transfer", "transportation", "TBD", "Resort to Velana Airport Speedboat", "Use the resort-confirmed transfer time from the previous night, and protect a 3+ hour buffer before international departure.", { imageUrl: images.lagoon, badge: "Speedboat" }),
        item("d8-flight", "flight", "TBD", "Flight Home", "No paid activity is scheduled on departure day.", { imageUrl: images.lagoon, badge: "Flight" }),
      ],
      suggestions: [
        suggestion("d8-s1", "Late Checkout Request", "Comfort Upgrade", "Useful if the confirmed flight is later in the day.", { imageUrl: images.lagoon }),
      ],
      notes: [
        { icon: "plane", text: "No paid activity on departure day." },
        { icon: "boat", text: "Use the resort-confirmed boat time, not an assumed transfer." },
        { icon: "clock", text: "Keep at least three hours before an international flight." },
      ],
    }),
  ];

  return {
    version: 1,
    title: PLAN_TITLE,
    subtitle: "8 days from local-island life to overwater-villa blue.",
    badge: "Ready Plan",
    hero: {
      imageUrl: images.hero,
      eyebrow: "Maldives Ready Plan",
      title: PLAN_TITLE,
      subtitle:
        "Begin among the palms and turquoise beaches of a real Maldivian island, drift above reefs, step onto a white sandbank, then trade island streets for an overwater villa.",
      stats: [
        { label: "Days", value: "8" },
        { label: "Countries", value: "1" },
        { label: "Islands", value: "2" },
        { label: "Travelers", value: "2" },
        { label: "Trip Style", value: "Beach Luxury" },
      ],
    },
    overview: {
      startingPoint: "Velana International Airport",
      destinations: "Maafushi, coral reefs, sandbank, South Male Atoll, overwater villa",
      tripStyle: "Beach, honeymoon, luxury, local island, snorkeling, relaxation, nature",
      travelers: "2 Adults",
      estimatedCost: "Live pricing",
      aiScore: "4.9",
    },
    days,
    cta: {
      title: "Your journey, but smarter.",
      subtitle: "Let AI handle the details while you focus on the memories.",
      imageUrl: images.hero,
      ctaText: "Plan Smarter With AI",
      ctaHref: "/ai-planner",
    },
  };
}

function buildDaysJson(content) {
  return content.days.map((entry) => ({
    day: entry.dayNumber,
    title: entry.title,
    theme: entry.quote || entry.description || "",
    imageUrl: entry.heroImage || entry.previewImage || "",
    items: entry.timelineItems.map((timelineItem) => ({
      time: timelineItem.time || "",
      title: timelineItem.title,
      note: timelineItem.description,
      type: timelineItem.type === "transportation" ? "transport" : timelineItem.type,
      imageUrl: timelineItem.imageUrl || "",
      deeplink: timelineItem.deeplink || "",
      buttonLabel: "Book Now",
    })),
  }));
}

function parseEnvFile(raw) {
  const map = new Map();
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) continue;
    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();
    if (
      value.length >= 2 &&
      ((value.startsWith("\"") && value.endsWith("\"")) ||
        (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1);
    }
    if (!map.has(key)) map.set(key, value);
  }
  return map;
}

async function loadAdminClient() {
  const envRaw = await readFile(SOURCE_ENV_PATH, "utf8");
  const env = parseEnvFile(envRaw);
  const url = env.get("NEXT_PUBLIC_SUPABASE_URL") || env.get("SUPABASE_URL");
  const serviceRoleKey = env.get("SUPABASE_SERVICE_ROLE_KEY") || env.get("SUPABASE_SECRET_KEY");

  if (!url || !serviceRoleKey) {
    throw new Error("Missing Supabase URL or service role key in .env");
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function main() {
  const supabase = await loadAdminClient();
  const content = buildContent();
  const daysJson = buildDaysJson(content);
  const timestamp = new Date().toISOString();

  const payload = {
    status: "DRAFT",
    slug: SLUG,
    title: PLAN_TITLE,
    location: "Velana, Maafushi, Coral Reefs, Sandbank, South Male Atoll",
    days: content.days.length,
    image_url: images.hero,
    created_at: timestamp,
    subtitle: "8 days from local-island life to overwater-villa blue.",
    country: "Maldives",
    city: "Maafushi, South Male Atoll",
    destination: "Maldives",
    style: "Beach, Honeymoon, Luxury, Local Island, Snorkeling, Relaxation, Nature",
    daysCount: content.days.length,
    heroImage: images.hero,
    coverImage: images.hero,
    summary:
      "An 8-day Maldives Ready Plan balancing four nights on Maafushi with coral reefs, turtle snorkeling and sandbank moments, followed by three nights of overwater-villa luxury in South Male Atoll.",
    seoTitle: PLAN_TITLE,
    seoDescription:
      "Draft ready plan for Maldives: Local Island Soul and Overwater Blue with Maafushi, coral reefs, sandbank, South Male Atoll and overwater-villa luxury.",
    tags: ["Maldives", "Maafushi", "Sandbank", "Snorkeling", "Overwater Villa", "Honeymoon", "Luxury", "Beach"],
    season: "Dry season and shoulder season",
    showOnHome: false,
    priceFrom: 0,
    currency: "USD",
    daysJson,
    contentJson: content,
    updatedAt: timestamp,
  };

  const existingResult = await supabase
    .from("ready_plans")
    .select("id, slug")
    .eq("slug", SLUG)
    .maybeSingle();

  if (existingResult.error) throw existingResult.error;
  if (existingResult.data?.id) {
    throw new Error(
      `Ready plan slug "${SLUG}" already exists. Aborting without updating, deleting, or overwriting any existing content.`,
    );
  }

  const insertResult = await supabase
    .from("ready_plans")
    .insert(payload)
    .select("id, slug, status")
    .single();

  if (insertResult.error) throw insertResult.error;
  const planId = insertResult.data.id;

  const dayRows = content.days.map((entry, index) => ({
    id: asId(),
    readyPlanId: planId,
    dayNumber: entry.dayNumber,
    title: entry.title,
    city: entry.destinationLabel,
    country: entry.countryLabel,
    date: entry.dateLabel,
    temperature: entry.weatherLabel,
    mainImageUrl: entry.heroImage || entry.previewImage || null,
    locationName: entry.routeTo || entry.destinationLabel,
    locationDescription: entry.description || null,
    description: entry.quote || null,
    notesJson: entry.notes,
    sortOrder: index,
    items: entry.timelineItems.map((timelineItem) => ({
      time: timelineItem.time || "",
      title: timelineItem.title,
      note: timelineItem.description,
      type: timelineItem.type === "transportation" ? "transport" : timelineItem.type,
      imageUrl: timelineItem.imageUrl || "",
      deeplink: timelineItem.deeplink || "",
      buttonLabel: "Book Now",
    })),
  }));

  const insertDays = await supabase.from("ready_plan_days").insert(dayRows).select("id, dayNumber");
  if (insertDays.error) throw insertDays.error;

  const itemRows = [];
  for (const entry of content.days) {
    const dayRecord = insertDays.data.find((row) => row.dayNumber === entry.dayNumber);
    if (!dayRecord) continue;

    entry.timelineItems.forEach((timelineItem, index) => {
      itemRows.push({
        id: asId(),
        readyPlanDayId: dayRecord.id,
        type: timelineItem.type === "transportation" ? "transport" : timelineItem.type,
        title: timelineItem.title,
        description: timelineItem.description || null,
        imageUrl: timelineItem.imageUrl || null,
        price: timelineItem.price || null,
        peopleCount: timelineItem.people || null,
        statusLabel: timelineItem.status || "Draft",
        categoryLabel: timelineItem.badge || timelineItem.type,
        affiliateUrl: timelineItem.deeplink || null,
        buttonLabel: "Book Now",
        sortOrder: index,
      });
    });
  }

  if (itemRows.length) {
    const insertItems = await supabase.from("ready_plan_items").insert(itemRows);
    if (insertItems.error) throw insertItems.error;
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        title: PLAN_TITLE,
        slug: SLUG,
        planId,
        status: "DRAFT",
        daysInserted: dayRows.length,
        itemsInserted: itemRows.length,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("INSERT_MALDIVES_READY_PLAN_FAILED");
  console.error(error);
  process.exit(1);
});
