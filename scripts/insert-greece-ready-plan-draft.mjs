import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import crypto from "node:crypto";

const SOURCE_ENV_PATH = new URL("../.env", import.meta.url);
const SLUG = "greece-blue-island-romance";
const PLAN_TITLE = "Greece Blue Island Romance";
const baseImage = "/bg/home-hero.png";
const footerImage = "/bg/home-hero-bottom-optimized.jpg";

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
    imageUrl: baseImage,
    buttonLabel: "Book Now",
    status: "Draft",
    badge: type,
    ...extra,
  };
}

function buildSummary(items, estimatedCost, upgrades = []) {
  const count = (types) => items.filter((entry) => types.includes(entry.type)).length;
  return {
    activitiesCount: String(count(["activity", "event"])),
    restaurantsCount: String(count(["restaurant"])),
    transfersCount: String(count(["transportation", "transfer", "flight"])),
    estimatedCost,
    upgrades,
    viewDetailsText: "View Details",
    editPlanText: "Edit Plan",
  };
}

function day({
  dayNumber,
  title,
  destinationLabel,
  routeFrom,
  routeTo,
  weatherLabel,
  quote,
  description,
  items,
  notes,
  suggestions = [],
  storyQuote,
  estimatedCost,
  upgrades = [],
}) {
  return {
    id: `day-${dayNumber}`,
    dayNumber,
    title,
    destinationLabel,
    countryLabel: "Greece",
    previewImage: baseImage,
    heroImage: baseImage,
    dateLabel: `Day ${dayNumber}`,
    routeFrom,
    routeTo,
    weatherLabel,
    quote,
    description,
    timelineItems: items,
    suggestions,
    story: {
      imageUrl: baseImage,
      quote: storyQuote || quote,
      musicLabel: "Cinematic Story",
      musicUrl: "",
    },
    summary: buildSummary(items, estimatedCost, upgrades),
    notes,
  };
}

function buildContent() {
  const days = [
    day({
      dayNumber: 1,
      title: "Athens to Santorini and Caldera Sunset",
      destinationLabel: "Santorini",
      routeFrom: "Athens",
      routeTo: "Santorini, Imerovigli, Fira, Oia",
      weatherLabel: "28C / Caldera light",
      quote:
        "The romance begins fast: Athens runway, Santorini cliffs, blue water, a private catamaran, and sunset dinner in Oia.",
      description:
        "Fly from Athens to Santorini, transfer to Imerovigli, settle into a luxury cliffside hotel, explore Akrotiri or Red Beach, cruise the caldera, and close with dinner in Oia.",
      estimatedCost: "USD 520-820",
      items: [
        item(
          "d1-item-1",
          "flight",
          "07:00",
          "Flight Athens to Santorini",
          "Morning ATH-JTR flight, about 50 minutes in the air and roughly 250 km between Athens and Santorini.",
          { price: "Flight varies", people: "2 People", badge: "Aegean" },
        ),
        item(
          "d1-item-2",
          "transportation",
          "08:00",
          "Private car transfer to Grace Hotel",
          "Meet the driver at Santorini Airport and transfer about 6.4 km to Imerovigli in roughly 15 minutes.",
          { price: "Private transfer varies", people: "2 People", badge: "VIP Transfer" },
        ),
        item(
          "d1-item-3",
          "hotel",
          "08:15",
          "Grace Hotel early check-in / freshen-up buffer",
          "Early check-in if available or a 45-minute freshen-up contingency. Grace Hotel standard check-in is listed at 15:00 and checkout at 11:00.",
          { price: "Hotel booked separately", people: "2 People", badge: "Luxury Hotel" },
        ),
        item(
          "d1-item-4",
          "restaurant",
          "09:00",
          "Breakfast in Imerovigli or Fira",
          "One-hour breakfast at the hotel or a local cafe before the first island exploration block.",
          { price: "USD 30-60", people: "2 People", badge: "Breakfast" },
        ),
        item(
          "d1-item-5",
          "activity",
          "10:00",
          "Red Beach or short Akrotiri visit",
          "Two-hour visit around the Akrotiri area. Red Beach and a short Akrotiri stop are about 10 km from Fira with roughly 20 minutes by car.",
          { price: "Entry / transfer varies", people: "2 People", badge: "Santorini" },
        ),
        item(
          "d1-item-6",
          "restaurant",
          "12:30",
          "Traditional taverna lunch in Fira",
          "One-hour lunch in Fira before the afternoon caldera cruise.",
          { price: "USD 45-75", people: "2 People", badge: "Lunch" },
        ),
        item(
          "d1-item-7",
          "activity",
          "14:00",
          "Half-Day Exclusive Catamaran Cruise",
          "Five-hour Santorini caldera sunset cruise with meal and open bar, based on the Viator Half-Day Exclusive Catamaran Cruise listing.",
          { price: "Provider price varies", people: "2 People", badge: "Viator" },
        ),
        item(
          "d1-item-8",
          "transportation",
          "19:30",
          "Transfer Fira to Oia",
          "Scenic road transfer from Fira to Oia, about 11 km and roughly 20-30 minutes.",
          { price: "Transfer varies", people: "2 People", badge: "Sunset Transfer" },
        ),
        item(
          "d1-item-9",
          "restaurant",
          "20:00",
          "Romantic sunset dinner in Oia",
          "Ninety-minute cliffside dinner in Oia after the cruise and sunset transfer.",
          { price: "USD 90-160", people: "2 People", badge: "Dinner" },
        ),
      ],
      suggestions: [
        {
          id: "d1-suggestion-1",
          title: "Mystique or Katikies Santorini upgrade",
          category: "Luxury Stay",
          imageUrl: baseImage,
          matchReason: "The source lists Mystique, Katikies Garden, and Grace Hotel as premium Santorini options.",
          matchScore: "Luxury",
          ctaText: "Book Now",
        },
      ],
      notes: [
        {
          id: "d1-note-1",
          icon: "clock",
          title: "Check-in detail",
          text: "Santorini luxury hotels commonly list 15:00 check-in and 11:00 checkout, so keep early arrival flexible.",
        },
      ],
    }),
    day({
      dayNumber: 2,
      title: "Santorini ATV, Akrotiri and Wine",
      destinationLabel: "Santorini",
      routeFrom: "Imerovigli",
      routeTo: "Perissa, Akrotiri, Santo Winery, Imerovigli",
      weatherLabel: "29C / Dry island breeze",
      quote:
        "Santorini turns adventurous: black-sand routes, quad trails, ancient ruins, wine tasting, and one more cliffside sunset.",
      description:
        "A full Santorini adventure day with hotel breakfast, ATV/quad tour, seafood lunch, Akrotiri Archaeological Site, boutique winery tasting, and sunset dinner in Imerovigli.",
      estimatedCost: "USD 380-620",
      items: [
        item(
          "d2-item-1",
          "restaurant",
          "08:00",
          "Breakfast at hotel or restaurant",
          "One-hour breakfast in Imerovigli before the off-road activity block.",
          { price: "USD 25-50", people: "2 People", badge: "Breakfast" },
        ),
        item(
          "d2-item-2",
          "activity",
          "09:00",
          "Santorini ATV / Quad Experience Tour",
          "Three-and-a-half-hour Santorini ATV/Quad adventure around the black-sand Perissa area, based on the Viator 10 Years Santorini ATV/Quad Experience Tour with free transportation.",
          { price: "Provider price varies", people: "2 People", badge: "Viator" },
        ),
        item(
          "d2-item-3",
          "restaurant",
          "12:30",
          "Seafood lunch in Perissa or Fira",
          "Ninety-minute seafood tavern lunch after the quad tour.",
          { price: "USD 50-85", people: "2 People", badge: "Lunch" },
        ),
        item(
          "d2-item-4",
          "activity",
          "14:00",
          "Akrotiri Archaeological Site",
          "Three-hour visit to the ancient Minoan ruins at Akrotiri, about 13 km from Fira with roughly 25 minutes by car.",
          { price: "Entry / guide varies", people: "2 People", badge: "Culture" },
        ),
        item(
          "d2-item-5",
          "activity",
          "17:30",
          "Santorini boutique winery tasting",
          "One-hour wine tasting at a boutique winery such as Santo Winery.",
          { price: "USD 40-80", people: "2 People", badge: "Wine" },
        ),
        item(
          "d2-item-6",
          "restaurant",
          "19:00",
          "Sunset dinner in Imerovigli",
          "Two-hour sunset dinner at an Imerovigli cliffside restaurant with caldera views.",
          { price: "USD 90-150", people: "2 People", badge: "Dinner" },
        ),
      ],
      notes: [
        {
          id: "d2-note-1",
          icon: "sun",
          title: "ATV comfort",
          text: "Keep sunscreen, sunglasses, and closed shoes visible in the final admin notes for this active Santorini day.",
        },
      ],
    }),
    day({
      dayNumber: 3,
      title: "Santorini to Paros and Greek Cooking",
      destinationLabel: "Paros",
      routeFrom: "Santorini",
      routeTo: "Parikia, Naoussa, Parasporos Beach",
      weatherLabel: "27C / Blue ferry day",
      quote:
        "The romance moves island-to-island: high-speed ferry, Paros old town, Greek cooking, wine, beach rest, and Naoussa dinner.",
      description:
        "Check out of Santorini, transfer to Athinios Port, ferry to Paros, settle into Parikia/Naoussa, join a Greek cooking class, rest at Parasporos Beach, and dine seaside in Naoussa.",
      estimatedCost: "USD 360-610",
      items: [
        item(
          "d3-item-1",
          "restaurant",
          "08:00",
          "Breakfast and hotel checkout",
          "Breakfast and checkout in Imerovigli. The source notes typical Santorini checkout by 11:00.",
          { price: "Included / varies", people: "2 People", badge: "Checkout" },
        ),
        item(
          "d3-item-2",
          "transportation",
          "09:00",
          "Transfer to Athinios Port",
          "Thirty-minute transfer from Imerovigli to Athinios Port, about 10 km south.",
          { price: "Transfer varies", people: "2 People", badge: "Port Transfer" },
        ),
        item(
          "d3-item-3",
          "transportation",
          "10:00",
          "High-speed ferry Santorini to Paros",
          "Hellenic Seaways high-speed ferry from Santorini to Paros, about 82 km and roughly 1 hour 50 minutes via the Naxos route.",
          { price: "Ferry varies", people: "2 People", badge: "Ferry" },
        ),
        item(
          "d3-item-4",
          "transportation",
          "12:00",
          "Transfer to Paros hotel",
          "Thirty-minute transfer from Parikia Port to the hotel area, with Parikia town only about 2 km from the port.",
          { price: "Transfer varies", people: "2 People", badge: "Hotel Transfer" },
        ),
        item(
          "d3-item-5",
          "restaurant",
          "12:30",
          "Lunch in Parikia old town",
          "Ninety-minute lunch and first walk through Parikia old town.",
          { price: "USD 45-75", people: "2 People", badge: "Lunch" },
        ),
        item(
          "d3-item-6",
          "activity",
          "14:00",
          "Paros Cooking Class with Greek Meal and Wine",
          "Three-and-a-half-hour cooking class in Naoussa with Greek meal and wine, based on the Viator Paros Cooking Class listing.",
          { price: "Provider price varies", people: "2 People", badge: "Viator" },
        ),
        item(
          "d3-item-7",
          "activity",
          "18:00",
          "Parasporos Beach rest",
          "Two-hour beach and rest block at Parasporos Beach after the cooking class.",
          { price: "Free / beach spend", people: "2 People", badge: "Beach" },
        ),
        item(
          "d3-item-8",
          "restaurant",
          "20:00",
          "Seaside tavern dinner in Naoussa",
          "Ninety-minute dinner in Naoussa with Paros seaside atmosphere.",
          { price: "USD 60-100", people: "2 People", badge: "Dinner" },
        ),
      ],
      suggestions: [
        {
          id: "d3-suggestion-1",
          title: "Yria Island Boutique Hotel or Poseidon Paros",
          category: "Paros Stay",
          imageUrl: baseImage,
          matchReason: "The source lists Yria Island Boutique Hotel, Poseidon of Paros, and Parian Chronicle as Paros options.",
          matchScore: "Recommended",
          ctaText: "Book Now",
        },
      ],
      notes: [
        {
          id: "d3-note-1",
          icon: "ship",
          title: "Ferry timing",
          text: "Keep port transfers buffered because ferry schedules and boarding windows can shift in high season.",
        },
      ],
    }),
    day({
      dayNumber: 4,
      title: "Antiparos and Blue Lagoon Catamaran",
      destinationLabel: "Paros and Antiparos",
      routeFrom: "Parikia",
      routeTo: "Parikia Harbor, Antiparos, Blue Lagoon",
      weatherLabel: "28C / Sailing day",
      quote:
        "This is the pure blue day: full-day catamaran, Antiparos water, Blue Lagoon swimming, and a slow Paros dinner.",
      description:
        "Breakfast in Parikia, transfer to Parikia Harbor, spend the day on a catamaran cruise to Antiparos and Blue Lagoon, then relax and dine on Paros.",
      estimatedCost: "USD 420-720",
      items: [
        item(
          "d4-item-1",
          "restaurant",
          "08:00",
          "Breakfast in Parikia",
          "One-hour breakfast before the full-day cruise.",
          { price: "USD 25-50", people: "2 People", badge: "Breakfast" },
        ),
        item(
          "d4-item-2",
          "transportation",
          "09:30",
          "Transfer to Parikia port",
          "Thirty-minute transfer from the hotel to Parikia Harbor, about 3 km and roughly 10 minutes by car.",
          { price: "Transfer varies", people: "2 People", badge: "Port Transfer" },
        ),
        item(
          "d4-item-3",
          "activity",
          "10:00",
          "Full-Day Catamaran Cruise to Antiparos and Blue Lagoon",
          "Eight-hour catamaran cruise covering Antiparos and Blue Lagoon / Kato Antiparos, based on the Viator full-day catamaran listing.",
          { price: "Provider price varies", people: "2 People", badge: "Viator" },
        ),
        item(
          "d4-item-4",
          "activity",
          "18:30",
          "Return to Parikia and relax",
          "Ninety-minute return and decompression block along the Paros coast.",
          { price: "Included / flexible", people: "2 People", badge: "Relax" },
        ),
        item(
          "d4-item-5",
          "restaurant",
          "20:00",
          "Paros cuisine dinner",
          "Dinner in Parikia or Naoussa after the Blue Lagoon cruise.",
          { price: "USD 60-100", people: "2 People", badge: "Dinner" },
        ),
      ],
      notes: [
        {
          id: "d4-note-1",
          icon: "water",
          title: "Cruise day",
          text: "This is a long water day, so keep the evening simple and close to Parikia or Naoussa.",
        },
      ],
    }),
    day({
      dayNumber: 5,
      title: "Paros to Mykonos, Rhenia and Delos",
      destinationLabel: "Mykonos",
      routeFrom: "Paros",
      routeTo: "Mykonos Town, Rhenia, Delos",
      weatherLabel: "29C / Aegean wind",
      quote:
        "The final island brings movement and mythology: ferry to Mykonos, Little Venice lunch, Rhenia waters, Delos ruins, and a sunset dinner.",
      description:
        "Check out of Paros, ferry to Mykonos, transfer and check in, lunch in Little Venice, then sail to Rhenia and Delos with guided ruins and dinner in Mykonos Town.",
      estimatedCost: "USD 430-760",
      items: [
        item(
          "d5-item-1",
          "restaurant",
          "08:00",
          "Breakfast and Paros hotel checkout",
          "Breakfast and checkout from the Paros hotel. The source notes typical Paros hotel checkout by 11:00.",
          { price: "Included / varies", people: "2 People", badge: "Checkout" },
        ),
        item(
          "d5-item-2",
          "transportation",
          "09:30",
          "Transfer to Parikia port",
          "Thirty-minute hotel-to-port transfer, about 3 km and roughly 10 minutes by car.",
          { price: "Transfer varies", people: "2 People", badge: "Port Transfer" },
        ),
        item(
          "d5-item-3",
          "transportation",
          "10:00",
          "High-speed ferry Paros to Mykonos",
          "Seajets high-speed ferry from Paros to Mykonos via Naxos route, about 52 km and roughly 50 minutes.",
          { price: "Ferry varies", people: "2 People", badge: "Ferry" },
        ),
        item(
          "d5-item-4",
          "hotel",
          "11:30",
          "Transfer and check in at Mykonos hotel",
          "Transfer about 4 km to Mykonos Town / Chora and check in or leave luggage. The source lists Zannis, Petasos, and Kouros as Mykonos hotel options.",
          { price: "Hotel booked separately", people: "2 People", badge: "Hotel" },
        ),
        item(
          "d5-item-5",
          "restaurant",
          "12:30",
          "Lunch in Little Venice",
          "One-hour Mykonian cuisine lunch around Little Venice / Mykonos Town.",
          { price: "USD 55-90", people: "2 People", badge: "Lunch" },
        ),
        item(
          "d5-item-6",
          "activity",
          "13:00",
          "Mykonos Sail Cruise to Rhenia and Delos",
          "Six-hour sailing cruise to Rhenia and Delos with guided Delos tour, lunch and drinks, based on the Viator Mykonos Sail Cruise listing.",
          { price: "Provider price varies", people: "2 People", badge: "Viator" },
        ),
        item(
          "d5-item-7",
          "restaurant",
          "19:30",
          "Sunset dinner in Mykonos Town",
          "Ninety-minute dinner in Mykonos Town / Chora after the sailing day.",
          { price: "USD 80-140", people: "2 People", badge: "Dinner" },
        ),
      ],
      suggestions: [
        {
          id: "d5-suggestion-1",
          title: "Half Day Delos Tour from Mykonos",
          category: "Klook Alternative",
          imageUrl: baseImage,
          matchReason: "A shorter Delos-focused option if the full Rhenia and Delos sail is too long.",
          matchScore: "Alternative",
          ctaText: "Book Now",
        },
      ],
      notes: [
        {
          id: "d5-note-1",
          icon: "wind",
          title: "Aegean wind",
          text: "Mykonos sailing is weather-sensitive; keep a backup Delos tour option visible in admin notes.",
        },
      ],
    }),
    day({
      dayNumber: 6,
      title: "Mykonos Highlights and Return to Athens",
      destinationLabel: "Mykonos and Athens",
      routeFrom: "Mykonos",
      routeTo: "Mykonos Town, Mykonos Airport, Athens",
      weatherLabel: "28C / Last island morning",
      quote:
        "The route closes with windmills, Little Venice, one last lunch, and the short flight back to Athens.",
      description:
        "Breakfast in Mykonos, morning highlights tour, lunch, airport transfer, Mykonos to Athens flight, and arrival at Athens airport.",
      estimatedCost: "USD 240-430",
      items: [
        item(
          "d6-item-1",
          "restaurant",
          "08:00",
          "Breakfast at Mykonos hotel",
          "One-hour breakfast before the final island tour.",
          { price: "Included / varies", people: "2 People", badge: "Breakfast" },
        ),
        item(
          "d6-item-2",
          "activity",
          "09:30",
          "Mykonos Highlights Tour",
          "Three-hour highlights tour around Mykonos Town including windmills and Little Venice.",
          { price: "Tour varies", people: "2 People", badge: "Highlights" },
        ),
        item(
          "d6-item-3",
          "restaurant",
          "12:30",
          "Lunch in Mykonos",
          "One-hour final lunch on Mykonos before airport transfer.",
          { price: "USD 45-75", people: "2 People", badge: "Lunch" },
        ),
        item(
          "d6-item-4",
          "transportation",
          "14:00",
          "Transfer to Mykonos Airport",
          "One-hour airport transfer block from hotel to Mykonos Airport, about 4 km and roughly 15 minutes driving time with buffer.",
          { price: "Transfer varies", people: "2 People", badge: "Airport Transfer" },
        ),
        item(
          "d6-item-5",
          "flight",
          "15:00",
          "Flight Mykonos to Athens",
          "JMK-ATH flight, about 45 minutes in the schedule and around 308 km back to Athens.",
          { price: "Flight varies", people: "2 People", badge: "Aegean" },
        ),
        item(
          "d6-item-6",
          "transportation",
          "16:30",
          "End of trip at Athens Airport",
          "Arrival at Athens International Airport and end of the Greece Blue Island Romance route.",
          { price: "Included / flexible", people: "2 People", badge: "Arrival" },
        ),
      ],
      notes: [
        {
          id: "d6-note-1",
          icon: "plane",
          title: "Departure buffer",
          text: "The final day has airport timing, so keep the highlights tour compact and leave luggage logistics simple.",
        },
      ],
    }),
  ];

  return {
    hero: {
      backgroundImage: baseImage,
      title: "Your Cinematic Ready Plan",
      subtitle:
        "A six-day Cyclades romance across Santorini, Paros, and Mykonos with private sailing, ATV adventure, cooking, blue lagoons, Delos, and island-to-island transfers.",
      stats: [
        { label: "Days", value: "6" },
        { label: "Countries", value: "1" },
        { label: "Cities", value: "4" },
        { label: "Travelers", value: "2" },
        { label: "Travel Style", value: "Blue Island Romance" },
      ],
      primaryCtaText: "Book Now",
      primaryCtaHref: "/api/affiliate/redirect",
      secondaryCtaText: "Book Now",
    },
    journeyOverview: {
      title: "Journey Overview",
      startPoint: "Athens",
      destinations: "Santorini, Paros, Mykonos, Athens",
      tripStyle: "Romance, sailing, ATV adventure, cooking, beaches, ruins",
      travelers: "2 Adults",
      estimatedCost: "Provider-dependent, excluding international flights",
      aiScore: "4.9",
    },
    days,
    footer: {
      backgroundImage: footerImage,
      title: "Your journey, but smarter.",
      subtitle:
        "This Greece draft is ready for your final image uploads and item-level affiliate links before publishing.",
      ctaText: "Book Now",
      ctaHref: "/api/affiliate/redirect",
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
    location: "Athens, Santorini, Paros, Mykonos",
    days: content.days.length,
    image_url: baseImage,
    created_at: timestamp,
    subtitle:
      "A detailed Cyclades romance route with flights, ferries, VIP transfers, sailing, ATV adventure, cooking class, beaches, Delos, hotels, and provider-backed tours.",
    country: "Greece",
    city: "Athens, Santorini, Paros, Mykonos",
    destination: "Greece",
    style: "Romance, Islands, Sailing, Adventure, Luxury",
    daysCount: content.days.length,
    heroImage: baseImage,
    coverImage: footerImage,
    summary:
      "A six-day Greece Blue Island Romance route from Athens to Santorini, Paros, Mykonos, and back to Athens, ready for final images and item-level affiliate links.",
    seoTitle: PLAN_TITLE,
    seoDescription:
      "Draft ready plan for Greece Blue Island Romance with detailed timed items, flights, ferries, hotels, tours, transfers, and booking placeholders.",
    tags: ["Greece", "Santorini", "Paros", "Mykonos", "Athens", "Cyclades", "Romance", "Sailing"],
    season: "Summer",
    showOnHome: false,
    priceFrom: 3200,
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

  let planId = existingResult.data?.id ?? null;

  if (planId) {
    const updateResult = await supabase
      .from("ready_plans")
      .update(payload)
      .eq("id", planId)
      .select("id, slug, status")
      .single();

    if (updateResult.error) throw updateResult.error;
    planId = updateResult.data.id;
  } else {
    const insertResult = await supabase
      .from("ready_plans")
      .insert(payload)
      .select("id, slug, status")
      .single();

    if (insertResult.error) throw insertResult.error;
    planId = insertResult.data.id;
  }

  const deleteLinks = await supabase.from("ready_plan_links").delete().eq("readyPlanId", planId);
  if (deleteLinks.error) throw deleteLinks.error;

  const deleteDays = await supabase.from("ready_plan_days").delete().eq("readyPlanId", planId);
  if (deleteDays.error) throw deleteDays.error;

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
        daysInserted: dayRows.length,
        itemsInserted: itemRows.length,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("INSERT_GREECE_READY_PLAN_FAILED");
  console.error(error);
  process.exit(1);
});
