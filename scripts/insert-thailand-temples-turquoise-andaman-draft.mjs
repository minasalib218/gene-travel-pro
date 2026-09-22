import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import crypto from "node:crypto";

const SOURCE_ENV_PATH = new URL("../.env", import.meta.url);
const SLUG = "thailand-temples-turquoise-and-andaman-glow";
const PLAN_TITLE = "Thailand: Temples, Turquoise & Andaman Glow";

const ASSET_ROOT = "/images/Thailand Island Pulse";
const images = {
  hero: `${ASSET_ROOT}/ao nang hotel.jpg`,
  bangkok: `${ASSET_ROOT}/Mandarin-Oriental-Bangkok-Thailand_Feat.jpg`,
  phuket: `${ASSET_ROOT}/phuket hotel.jpg`,
  islands: `${ASSET_ROOT}/dive 1.jpg`,
  canoe: `${ASSET_ROOT}/kayak.jpg`,
  krabi: `${ASSET_ROOT}/ao nang hotel.jpg`,
  suggestion: `${ASSET_ROOT}/3 monkeys sugg 2.jfif`,
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
      title: "Bangkok Arrival - River Lights & Easy Landing",
      destinationLabel: "Bangkok",
      countryLabel: "Thailand",
      imageUrl: images.bangkok,
      routeFrom: "Bangkok airport",
      routeTo: "Chao Phraya riverside and ICONSIAM area",
      weatherLabel: "Easy arrival / Low fatigue",
      quote: "Land softly, let the river lights introduce Thailand at your pace.",
      description:
        "Arrival day is intentionally gentle: baggage, transfer, hotel check-in, full rest, a riverside walk around ICONSIAM and a relaxed Thai dinner by the Chao Phraya.",
      items: [
        item("d1-arrival", "flight", "14:00", "Bangkok Arrival Buffer", "Allow at least 90 minutes after landing for baggage, immigration and transfer before committing to any activity.", { imageUrl: images.bangkok, badge: "Arrival" }),
        item("d1-hotel", "hotel", "15:30", "Bangkok Riverside Hotel Check-In", "Check in and take a full recovery block before the first evening.", { imageUrl: images.bangkok, badge: "Hotel" }),
        item("d1-river", "activity", "17:45", "Chao Phraya Riverside Walk", "Easy walk around the ICONSIAM river area with low pressure and strong first-night atmosphere.", { imageUrl: images.bangkok, badge: "River" }),
        item("d1-dinner", "restaurant", "19:00", "Thai Dinner by the River", "A relaxed river-view dinner, with no paid tour scheduled on arrival day.", { imageUrl: images.bangkok, badge: "Dinner" }),
      ],
      suggestions: [
        suggestion("d1-s1", "ICONSIAM Dessert Stop", "Easy Add-On", "A light first-night add-on if the traveler still has energy.", { imageUrl: images.bangkok }),
        suggestion("d1-s2", "Riverside Rooftop View", "Soft Upgrade", "A premium but low-effort arrival-night upgrade.", { imageUrl: images.bangkok }),
      ],
      notes: [
        { icon: "clock", text: "Keep at least a 90-minute arrival buffer before any plan." },
        { icon: "sun", text: "Stay hydrated after the flight and heat." },
        { icon: "shirt", text: "Wear light clothing for the riverside evening." },
      ],
    }),
    day({
      dayNumber: 2,
      title: "Bangkok Icons - Palaces, Temples & Old Bangkok",
      destinationLabel: "Bangkok",
      countryLabel: "Thailand",
      imageUrl: images.bangkok,
      routeFrom: "Bangkok hotel",
      routeTo: "Grand Palace, Wat Pho, Wat Arun, Chinatown",
      weatherLabel: "Culture / Moderate fatigue",
      quote: "The old capital opens through gold, river crossings and evening street food.",
      description:
        "A focused Bangkok culture day: Grand Palace, Emerald Buddha, Wat Pho, Wat Arun and a lighter evening in Chinatown after a critical afternoon rest block.",
      items: [
        item("d2-breakfast", "restaurant", "07:00", "Breakfast", "Start early before the heat and crowds build.", { imageUrl: images.bangkok, badge: "Breakfast" }),
        item("d2-transfer", "transportation", "08:00", "Transfer to Grand Palace Area", "Morning transfer toward the royal temple district.", { imageUrl: images.bangkok, badge: "Transfer" }),
        item("d2-main", "activity", "09:00", "Grand Palace, Wat Pho & Wat Arun Tour", "Main cultural booking covering Grand Palace, Emerald Buddha, Wat Pho, a river crossing and Wat Arun.", { imageUrl: images.bangkok, badge: "Top Picker", duration: "4.5 Hours" }),
        item("d2-rest", "activity", "14:30", "Hotel Rest Block", "Important rest time because of heat and walking load.", { imageUrl: images.bangkok, badge: "Recovery" }),
        item("d2-chinatown", "restaurant", "17:00", "Chinatown and Yaowarat Street Food", "Explore Chinatown, then finish with dinner and a street-food experience.", { imageUrl: images.bangkok, badge: "Food" }),
      ],
      suggestions: [
        suggestion("d2-s1", "Flower Market Extension", "Local Color", "Good add-on if the traveler wants more Bangkok atmosphere after the temples.", { imageUrl: images.bangkok }),
        suggestion("d2-s2", "Private Guide Upgrade", "Comfort Upgrade", "Recommended for families or travelers who want less navigation stress.", { imageUrl: images.bangkok }),
      ],
      notes: [
        { icon: "sun", text: "Temple clothing rules matter: shoulders and knees covered." },
        { icon: "clock", text: "Protect the afternoon rest block." },
        { icon: "food", text: "Choose Chinatown timing around appetite and heat." },
      ],
    }),
    day({
      dayNumber: 3,
      title: "Ancient Thailand - Ayutthaya UNESCO Escape",
      destinationLabel: "Ayutthaya",
      countryLabel: "Thailand",
      imageUrl: images.bangkok,
      routeFrom: "Bangkok",
      routeTo: "Ayutthaya Historical Park",
      weatherLabel: "History / High fatigue",
      quote: "Ruins, temples and royal memory make this the deep-history day.",
      description:
        "A full Ayutthaya day with no second major tour. Gene can pick a longer full-day version or a shorter small-group version based on traveler stamina.",
      items: [
        item("d3-breakfast", "restaurant", "07:00", "Early Breakfast", "Prepare for a full historical day outside Bangkok.", { imageUrl: images.bangkok, badge: "Breakfast" }),
        item("d3-pickup", "transportation", "07:30", "Ayutthaya Pickup or Meeting Point", "Pickup time depends on the final provider product.", { imageUrl: images.bangkok, badge: "Transfer" }),
        item("d3-main", "activity", "08:00", "Ayutthaya Historical Park Full-Day Tour", "Visit key sites such as Wat Mahathat, Wat Phra Si Sanphet, Wat Yai Chai Mongkhon and historic ruins.", { imageUrl: images.bangkok, badge: "UNESCO", duration: "7-11.5 Hours" }),
        item("d3-lunch", "restaurant", "12:00", "Tour Lunch", "Lunch is included or arranged according to the selected package.", { imageUrl: images.bangkok, badge: "Lunch" }),
        item("d3-dinner", "restaurant", "20:00", "Light Bangkok Dinner", "Return, eat lightly, pack for Phuket and sleep early.", { imageUrl: images.bangkok, badge: "Light Dinner" }),
      ],
      suggestions: [
        suggestion("d3-s1", "Shorter Small-Group Ayutthaya", "Lower Fatigue", "Alternative for travelers who prefer a 7 to 7.5 hour day.", { imageUrl: images.bangkok }),
        suggestion("d3-s2", "Private Driver Upgrade", "Comfort Upgrade", "Useful for families and travelers who want control over pacing.", { imageUrl: images.bangkok }),
      ],
      notes: [
        { icon: "clock", text: "Do not add another paid tour after Ayutthaya." },
        { icon: "sun", text: "Carry water and sun protection." },
        { icon: "bag", text: "Pack for Phuket before sleeping." },
      ],
    }),
    day({
      dayNumber: 4,
      title: "Bangkok to Phuket - City to Andaman Sea",
      destinationLabel: "Phuket",
      countryLabel: "Thailand",
      imageUrl: images.phuket,
      routeFrom: "Bangkok",
      routeTo: "Phuket, Merlin Beach and Tri-Trang Beach",
      weatherLabel: "Travel / Low fatigue",
      quote: "The journey shifts from temple city to Andaman resort light.",
      description:
        "A travel and recovery day: Bangkok checkout, flight to Phuket, airport transfer to the Merlin Beach area, resort rest and Tri-Trang sunset.",
      items: [
        item("d4-breakfast", "restaurant", "06:30", "Breakfast and Checkout", "Simple start before the airport transfer.", { imageUrl: images.phuket, badge: "Hotel" }),
        item("d4-flight", "flight", "10:30", "Bangkok to Phuket Flight", "Gene should select the real flight by live price and customer timing, not a fixed airline or flight number.", { imageUrl: images.phuket, badge: "Flight" }),
        item("d4-transfer", "transportation", "13:30", "Phuket Airport to Merlin Beach", "Plan around 60 to 75 minutes depending on traffic and hotel location.", { imageUrl: images.phuket, badge: "Transfer" }),
        item("d4-resort", "hotel", "15:00", "Phuket Beach Resort Check-In", "Pool, beach and recovery block after travel.", { imageUrl: images.phuket, badge: "Resort" }),
        item("d4-sunset", "activity", "17:00", "Tri-Trang Beach Sunset", "A gentle beach sunset close to the resort.", { imageUrl: images.phuket, badge: "Beach" }),
      ],
      suggestions: [
        suggestion("d4-s1", "Light Resort Snorkeling", "Soft Add-On", "If sea conditions are suitable, use the resort reef instead of buying another excursion.", { imageUrl: images.phuket }),
      ],
      notes: [
        { icon: "plane", text: "Use live flight data for the final Bangkok to Phuket choice." },
        { icon: "car", text: "Traffic can stretch the airport transfer." },
        { icon: "water", text: "Keep the evening relaxed before the hero island day." },
      ],
    }),
    day({
      dayNumber: 5,
      title: "Hero Day - Phi Phi, Maya Bay & Pileh Lagoon",
      destinationLabel: "Phi Phi Islands",
      countryLabel: "Thailand",
      imageUrl: images.islands,
      routeFrom: "Phuket",
      routeTo: "Maya Bay, Pileh Lagoon, Viking Cave, Phi Phi Don",
      weatherLabel: "Hero island day / High affiliate priority",
      quote: "Turquoise water, limestone cliffs and one of Thailand's strongest visual days.",
      description:
        "The commercial hero of the plan: a full-day Phi Phi and Maya Bay speedboat experience with snorkeling, lunch and island hopping. No nightlife is scheduled afterward.",
      items: [
        item("d5-breakfast", "restaurant", "06:30", "Early Breakfast", "Eat before hotel pickup.", { imageUrl: images.islands, badge: "Breakfast" }),
        item("d5-pickup", "transportation", "07:30", "Hotel Pickup and Pier Check-In", "Pickup timing depends on the operator.", { imageUrl: images.islands, badge: "Transfer" }),
        item("d5-main", "activity", "09:00", "Phi Phi Islands and Maya Bay Speedboat Tour", "Full-day speedboat tour including Maya Bay, Pileh Lagoon, Viking Cave sightseeing, snorkeling and Phi Phi Don lunch.", { imageUrl: images.islands, badge: "Hero Card", duration: "Full Day" }),
        item("d5-lunch", "restaurant", "12:30", "Phi Phi Lunch", "Lunch on or near Phi Phi Don depending on the package.", { imageUrl: images.islands, badge: "Lunch" }),
        item("d5-return", "transportation", "18:30", "Tour Finish and Hotel Return", "Return to hotel, shower and keep dinner light.", { imageUrl: images.islands, badge: "Return" }),
      ],
      suggestions: [
        suggestion("d5-s1", "Premium Phi Phi and Bamboo Islands", "Upgrade", "Alternative premium route with Bamboo Island if sea and timing are right.", { imageUrl: images.islands }),
        suggestion("d5-s2", "Private Speedboat Upgrade", "Luxury Upgrade", "Best for honeymooners, families or photo-first travelers.", { imageUrl: images.islands }),
      ],
      notes: [
        { icon: "water", text: "This is a full day on the water." },
        { icon: "sun", text: "Use reef-safe sunscreen and a dry bag." },
        { icon: "moon", text: "No nightlife after this day." },
      ],
    }),
    day({
      dayNumber: 6,
      title: "Phang Nga Adventure - James Bond Island & Sea Canoeing",
      destinationLabel: "Phang Nga Bay",
      countryLabel: "Thailand",
      imageUrl: images.canoe,
      routeFrom: "Phuket",
      routeTo: "Phang Nga caves, sea canoeing and James Bond Island",
      weatherLabel: "Caves and canoeing / High affiliate priority",
      quote: "A different Andaman chapter: limestone caves, canoes and floating villages.",
      description:
        "Different from Phi Phi: this day focuses on caves, canoeing, James Bond Island, bay scenery and lunch, then returns early enough for a calm evening.",
      items: [
        item("d6-breakfast", "restaurant", "07:00", "Breakfast", "Start with a steady breakfast before pickup.", { imageUrl: images.canoe, badge: "Breakfast" }),
        item("d6-pickup", "transportation", "08:00", "Phang Nga Pickup", "Transfer toward the bay according to the selected operator.", { imageUrl: images.canoe, badge: "Transfer" }),
        item("d6-main", "activity", "10:00", "James Bond Island and Sea Canoe Tour", "Explore caves and bay scenery, canoe or kayak sections, James Bond Island and lunch depending on package.", { imageUrl: images.canoe, badge: "Canoe", duration: "8-9 Hours" }),
        item("d6-lunch", "restaurant", "12:30", "Bay Lunch", "Lunch is part of the chosen tour package.", { imageUrl: images.canoe, badge: "Lunch" }),
        item("d6-dinner", "restaurant", "19:30", "Relaxed Phuket Dinner", "Dinner after rest, with no heavy evening program.", { imageUrl: images.phuket, badge: "Dinner" }),
      ],
      suggestions: [
        suggestion("d6-s1", "Speedboat Canoeing Version", "Faster Alternative", "Good for travelers who want a tighter, higher-energy version.", { imageUrl: images.canoe }),
        suggestion("d6-s2", "Floating Village Photo Stop", "Local Add-On", "Use only if the selected product includes enough time.", { imageUrl: images.canoe }),
      ],
      notes: [
        { icon: "water", text: "Weather and sea conditions affect the exact route." },
        { icon: "clock", text: "Keep evening flexible after two boat-heavy days." },
        { icon: "camera", text: "This is a strong photo day." },
      ],
    }),
    day({
      dayNumber: 7,
      title: "Phuket to Krabi - Slow Coast Transfer & Railay Sunset",
      destinationLabel: "Krabi",
      countryLabel: "Thailand",
      imageUrl: images.krabi,
      routeFrom: "Phuket",
      routeTo: "Ao Nang, Railay Beach and Krabi hotel",
      weatherLabel: "Transfer / Easy coast",
      quote: "After two boat days, the coast slows down into cliffs and sunset.",
      description:
        "A lighter transfer day from Phuket to Krabi, followed by lunch, hotel check-in and an easy longtail boat visit to Railay Beach for limestone cliffs and sunset.",
      items: [
        item("d7-breakfast", "restaurant", "07:30", "Breakfast", "A slower start after two excursion days.", { imageUrl: images.krabi, badge: "Breakfast" }),
        item("d7-transfer", "transportation", "09:30", "Private Transfer Phuket to Krabi", "Use live map data on the travel date; plan 3 to 3.5 hours as a buffer.", { imageUrl: images.krabi, badge: "Transfer" }),
        item("d7-hotel", "hotel", "14:00", "Krabi Hotel Check-In", "Lunch, check-in and a short rest before Railay.", { imageUrl: images.krabi, badge: "Hotel" }),
        item("d7-boat", "transportation", "16:00", "Longtail Boat to Railay", "Short boat ride from Ao Nang toward Railay area.", { imageUrl: images.krabi, badge: "Longtail" }),
        item("d7-railay", "activity", "16:30", "Railay Beach Sunset", "Beach, limestone cliffs and Andaman sunset without a heavy excursion.", { imageUrl: images.krabi, badge: "Beach" }),
      ],
      suggestions: [
        suggestion("d7-s1", "Ao Nang Dinner", "Easy Evening", "Simple dinner close to hotel or pier after returning from Railay.", { imageUrl: images.krabi }),
      ],
      notes: [
        { icon: "car", text: "This day is intentionally lighter." },
        { icon: "boat", text: "Railay access depends on boat and weather conditions." },
        { icon: "sun", text: "Plan Railay around sunset light." },
      ],
    }),
    day({
      dayNumber: 8,
      title: "Hidden-Lagoon Hero Day - Hong Islands Sunset & Glow Plankton",
      destinationLabel: "Hong Islands",
      countryLabel: "Thailand",
      imageUrl: images.islands,
      routeFrom: "Krabi",
      routeTo: "Hong Lagoon, Hong Island, Pakbia, sunset and bioluminescent plankton",
      weatherLabel: "Hero island day / Maximum affiliate priority",
      quote: "A late-start island day built for lagoon color, sunset and night-water magic.",
      description:
        "A late-start Hong Islands day with beach time, snorkeling or swimming, viewpoint options, sunset dinner and bioluminescent plankton if conditions and the product allow it.",
      items: [
        item("d8-breakfast", "restaurant", "08:00", "Late Breakfast", "Keep the morning soft because the tour runs into the evening.", { imageUrl: images.islands, badge: "Breakfast" }),
        item("d8-free", "activity", "09:00", "Free Morning and Pool Time", "Relax before the afternoon island tour.", { imageUrl: images.krabi, badge: "Recovery" }),
        item("d8-pickup", "transportation", "11:30", "Hong Islands Pickup", "Pickup depends on final provider timing.", { imageUrl: images.islands, badge: "Transfer" }),
        item("d8-main", "activity", "13:00", "Hong Islands Sunset and Bioluminescent Plankton Tour", "Hong Lagoon, white-sand beach, swimming, snorkeling, viewpoint, sunset, dinner and plankton if conditions permit.", { imageUrl: images.islands, badge: "Hero Card", duration: "6-8 Hours" }),
        item("d8-return", "transportation", "20:30", "Return to Krabi Hotel", "Return after the night-water experience.", { imageUrl: images.krabi, badge: "Return" }),
      ],
      suggestions: [
        suggestion("d8-s1", "Private Longtail Hong Upgrade", "Luxury Upgrade", "Great for travelers who want stronger photography control and a more private pace.", { imageUrl: images.islands }),
        suggestion("d8-s2", "Hong 360 Viewpoint Focus", "Active Add-On", "Use if the traveler wants more hiking and less beach time.", { imageUrl: images.islands }),
      ],
      notes: [
        { icon: "moon", text: "Plankton visibility depends on conditions and product inclusion." },
        { icon: "water", text: "Keep electronics protected." },
        { icon: "clock", text: "Do not schedule an early dinner outside the tour." },
      ],
    }),
    day({
      dayNumber: 9,
      title: "Krabi Slow Luxury Day - Beach, Spa & Hidden-Coast Finish",
      destinationLabel: "Krabi",
      countryLabel: "Thailand",
      imageUrl: images.krabi,
      routeFrom: "Krabi hotel",
      routeTo: "Beach, spa, Ao Nang and final Andaman sunset",
      weatherLabel: "Very low fatigue",
      quote: "The plan breathes here: beach, spa, sunset and one last premium dinner.",
      description:
        "A recovery and luxury day after the island program: resort beach, pool, lunch, rest or spa, close coastal exploration, final Andaman sunset and farewell dinner.",
      items: [
        item("d9-breakfast", "restaurant", "08:00", "Slow Breakfast", "No rush after the late-return Hong Islands day.", { imageUrl: images.krabi, badge: "Breakfast" }),
        item("d9-beach", "activity", "09:30", "Resort Beach and Pool", "Space to enjoy the hotel instead of stacking another excursion.", { imageUrl: images.krabi, badge: "Beach" }),
        item("d9-spa", "activity", "13:00", "Rest or Spa Block", "Optional spa, massage or quiet resort time.", { imageUrl: images.krabi, badge: "Spa" }),
        item("d9-coast", "activity", "15:30", "Close Coastal Exploration", "Easy exploration around the hotel or Ao Nang depending on the final property.", { imageUrl: images.krabi, badge: "Coast" }),
        item("d9-dinner", "restaurant", "19:00", "Premium Farewell Dinner", "A polished final dinner on the Andaman coast.", { imageUrl: images.krabi, badge: "Dinner" }),
      ],
      suggestions: [
        suggestion("d9-s1", "Hong Islands Day Tour and 360 Viewpoint", "Active Alternative", "Offer only as an alternative for travelers who prefer activity over rest.", { imageUrl: images.islands }),
        suggestion("d9-s2", "Couples Spa Upgrade", "Luxury Add-On", "Strong honeymoon fit without adding fatigue.", { imageUrl: images.krabi }),
      ],
      notes: [
        { icon: "sun", text: "This day intentionally lowers total trip fatigue." },
        { icon: "heart", text: "Excellent honeymoon or luxury pacing day." },
        { icon: "food", text: "Reserve the farewell dinner in advance." },
      ],
    }),
    day({
      dayNumber: 10,
      title: "Departure - Easy Andaman Goodbye",
      destinationLabel: "Krabi",
      countryLabel: "Thailand",
      imageUrl: images.krabi,
      routeFrom: "Krabi hotel",
      routeTo: "Krabi Airport or Phuket Airport",
      weatherLabel: "Departure only",
      quote: "Leave the coast cleanly, without forcing one more paid activity.",
      description:
        "Departure day stays simple: breakfast, packing, checkout and airport transfer. Gene should calculate the buffer based on Krabi or Phuket airport, flight type and departure time.",
      items: [
        item("d10-breakfast", "restaurant", "07:30", "Breakfast", "Final relaxed breakfast.", { imageUrl: images.krabi, badge: "Breakfast" }),
        item("d10-pack", "activity", "09:00", "Packing and Free Time", "Keep the morning flexible.", { imageUrl: images.krabi, badge: "Free Time" }),
        item("d10-checkout", "hotel", "11:00", "Hotel Checkout", "Checkout depends on the actual hotel policy.", { imageUrl: images.krabi, badge: "Checkout" }),
        item("d10-transfer", "transportation", "TBD", "Airport Transfer", "Calculate the buffer separately for Krabi Airport or Phuket Airport and domestic or international flights.", { imageUrl: images.krabi, badge: "Transfer" }),
        item("d10-flight", "flight", "TBD", "Flight Home", "No paid activity is scheduled on travel day.", { imageUrl: images.krabi, badge: "Flight" }),
      ],
      suggestions: [
        suggestion("d10-s1", "Late Checkout Upgrade", "Comfort Upgrade", "Useful when the customer has an evening flight.", { imageUrl: images.krabi }),
      ],
      notes: [
        { icon: "plane", text: "Use live flight time before locking the transfer." },
        { icon: "bag", text: "No paid activity on departure day." },
        { icon: "clock", text: "Airport buffer changes by airport and flight type." },
      ],
    }),
  ];

  return {
    version: 1,
    title: PLAN_TITLE,
    subtitle: "10 days from Bangkok temples to Phuket lagoons and Krabi sunsets.",
    badge: "Ready Plan",
    hero: {
      imageUrl: images.hero,
      eyebrow: "Thailand Ready Plan",
      title: PLAN_TITLE,
      subtitle: "Bangkok, Phuket, Phi Phi, Phang Nga, Krabi, Railay and Hong Islands in one cinematic Andaman route.",
      stats: [
        { label: "Days", value: "10" },
        { label: "Countries", value: "1" },
        { label: "Cities", value: "3" },
        { label: "Travelers", value: "2" },
        { label: "Trip Style", value: "Beach Adventure" },
      ],
    },
    overview: {
      startingPoint: "Bangkok",
      destinations: "Bangkok, Phuket, Phi Phi, Phang Nga, Krabi, Railay, Hong Islands",
      tripStyle: "Culture, turquoise beaches, island adventure, luxury resort pacing",
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
  const url = env.get("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
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
    location: "Bangkok, Phuket, Phi Phi, Phang Nga, Krabi, Railay, Hong Islands",
    days: content.days.length,
    image_url: images.hero,
    created_at: timestamp,
    subtitle: "10 days from Bangkok temples to Phuket lagoons and Krabi sunsets.",
    country: "Thailand",
    city: "Bangkok, Phuket, Krabi",
    destination: "Thailand",
    style: "Beach, Adventure, Culture, Luxury, Islands, Hidden Lagoons",
    daysCount: content.days.length,
    heroImage: images.hero,
    coverImage: images.hero,
    summary:
      "A 10-day Thailand route from Bangkok temples and river lights to Phuket, Phi Phi, Maya Bay, Phang Nga, Krabi, Railay and Hong Islands with balanced rest days and strong affiliate-ready experiences.",
    seoTitle: PLAN_TITLE,
    seoDescription:
      "Draft ready plan for Thailand: Temples, Turquoise and Andaman Glow with Bangkok, Phuket, Phi Phi, Phang Nga, Krabi, Railay and Hong Islands.",
    tags: ["Thailand", "Bangkok", "Phuket", "Phi Phi", "Maya Bay", "Phang Nga", "Krabi", "Railay", "Hong Islands"],
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
  console.error("INSERT_THAILAND_TEMPLES_TURQUOISE_ANDAMAN_FAILED");
  console.error(error);
  process.exit(1);
});
