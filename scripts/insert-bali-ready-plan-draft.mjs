import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import crypto from "node:crypto";

const SOURCE_ENV_PATH = new URL("../.env", import.meta.url);
const SLUG = "bali-spirit-and-island-glow";
const PLAN_TITLE = "Bali Spirit & Island Glow";
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
    countryLabel: "Indonesia",
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
      title: "Ubud Temples and Waterfalls",
      destinationLabel: "Ubud",
      routeFrom: "Ubud",
      routeTo: "Tirta Empul, Kanto Lampo, Tibumana, Tegalalang",
      weatherLabel: "27C / Jungle morning",
      quote:
        "Bali Spirit opens with holy water, jungle falls, rice terraces, and a slow Ubud evening.",
      description:
        "A Bali Spirit day through Tirta Empul, Kanto Lampo Waterfall, Tibumana Waterfall, Tegalalang Rice Terraces, local brunch, Ubud rest, and optional evening culture.",
      estimatedCost: "USD 180-320",
      items: [
        item(
          "d1-item-1",
          "transportation",
          "06:30",
          "Depart Ubud hotel",
          "Leave the Ubud base by private car and drive about 30 minutes to Tirta Empul Temple in Tampaksiring.",
          { price: "Private driver varies", people: "2 People", badge: "Private Car" },
        ),
        item(
          "d1-item-2",
          "activity",
          "07:00",
          "Tirta Empul holy spring temple",
          "Explore Tirta Empul for about one hour and see the morning holy spring rituals. This aligns with Klook and Viator Ubud holy spring tour content.",
          { price: "Entry / tour varies", people: "2 People", badge: "Klook / Viator" },
        ),
        item(
          "d1-item-3",
          "transportation",
          "08:00",
          "Drive to Kanto Lampo Waterfall",
          "Drive about 30 minutes toward Kanto Lampo Waterfall for the first jungle waterfall stop.",
          { price: "Included with driver", people: "2 People", badge: "Drive" },
        ),
        item(
          "d1-item-4",
          "activity",
          "09:00",
          "Kanto Lampo Waterfall photo stop",
          "Thirty-minute photo and waterfall stop at Kanto Lampo, part of the Explore Ubud Klook route.",
          { price: "Entry varies", people: "2 People", badge: "Waterfall" },
        ),
        item(
          "d1-item-5",
          "transportation",
          "09:30",
          "Drive to Tibumana Waterfall",
          "Short 15-minute transfer from Kanto Lampo toward Tibumana Waterfall.",
          { price: "Included with driver", people: "2 People", badge: "Drive" },
        ),
        item(
          "d1-item-6",
          "activity",
          "09:45",
          "Tibumana Waterfall trek and swim",
          "Short trek and swim at Tibumana Waterfall for about 30 minutes.",
          { price: "Entry varies", people: "2 People", badge: "Waterfall" },
        ),
        item(
          "d1-item-7",
          "transportation",
          "10:15",
          "Drive back to Ubud center",
          "Drive about 15 minutes back toward Ubud center for brunch and rest.",
          { price: "Included with driver", people: "2 People", badge: "Drive" },
        ),
        item(
          "d1-item-8",
          "restaurant",
          "11:00",
          "Balinese brunch in Ubud",
          "One-hour brunch at a local warung with Balinese dishes and a quiet rest break.",
          { price: "USD 20-40", people: "2 People", badge: "Brunch" },
        ),
        item(
          "d1-item-9",
          "transportation",
          "12:00",
          "Drive to Tegalalang Rice Terraces",
          "Drive around 30 minutes from Ubud toward Tegalalang Rice Terraces.",
          { price: "Included with driver", people: "2 People", badge: "Drive" },
        ),
        item(
          "d1-item-10",
          "activity",
          "12:30",
          "Tegalalang Rice Terraces and coffee plantation",
          "Walk the iconic Tegalalang terraces and add a short coffee plantation visit.",
          { price: "Entry / tasting varies", people: "2 People", badge: "Rice Terrace" },
        ),
        item(
          "d1-item-11",
          "hotel",
          "14:00",
          "Leisure time at Ubud hotel",
          "Return to Ubud for one hour of rest, pool time, or spa after the morning route.",
          { price: "Hotel booked separately", people: "2 People", badge: "Rest" },
        ),
        item(
          "d1-item-12",
          "activity",
          "15:00",
          "Optional Ubud Town visit",
          "Optional Ubud Town block for Monkey Forest or market if energy is good.",
          { price: "Optional", people: "2 People", badge: "Optional" },
        ),
        item(
          "d1-item-13",
          "restaurant",
          "17:00",
          "Dinner in Ubud",
          "Early dinner in Ubud with extra rest after a full day of temples, waterfalls, and terraces.",
          { price: "USD 35-70", people: "2 People", badge: "Dinner" },
        ),
        item(
          "d1-item-14",
          "event",
          "19:00",
          "Optional Balinese dance or temple ceremony",
          "Optional self-arranged evening Balinese dance or nighttime temple ceremony after dark.",
          { price: "Optional", people: "2 People", badge: "Evening Culture" },
        ),
      ],
      suggestions: [
        {
          id: "d1-suggestion-1",
          title: "Explore Ubud Rice Terrace, Temple and Waterfalls Private Tour",
          category: "Klook",
          imageUrl: baseImage,
          matchReason: "Matches Tirta Empul, Kanto Lampo, Tibumana and Tegalalang in one provider-backed day.",
          matchScore: "Best Fit",
          ctaText: "Book Now",
        },
      ],
      notes: [
        {
          id: "d1-note-1",
          icon: "water",
          title: "Temple timing",
          text: "The itinerary assumes about one hour at Tirta Empul and thirty minutes at each waterfall.",
        },
      ],
    }),
    day({
      dayNumber: 2,
      title: "Purification Ritual and Ubud Culture",
      destinationLabel: "Ubud and Sebatu",
      routeFrom: "Ubud",
      routeTo: "Pura Dalem Pingit, Goa Gajah, Bali Pulina",
      weatherLabel: "28C / Spiritual Ubud",
      quote:
        "This is the healing chapter: purification pools, Elephant Cave, coffee terraces, and an unhurried Ubud night.",
      description:
        "A Bali Spirit day centered on melukat purification at Pura Dalem Pingit, lunch in Ubud, Goa Gajah, Bali Pulina coffee tasting, rest, and optional evening culture.",
      estimatedCost: "USD 180-340",
      items: [
        item(
          "d2-item-1",
          "transportation",
          "09:00",
          "Hotel pickup from Ubud",
          "Private pickup from the Ubud area and drive about 30 minutes to Pura Dalem Pingit in Sebatu Village.",
          { price: "Private driver varies", people: "2 People", badge: "Pickup" },
        ),
        item(
          "d2-item-2",
          "activity",
          "09:30",
          "Pura Dalem Pingit purification ceremony",
          "Two-hour guided melukat purification ceremony at Pura Dalem Pingit, using four to five temple pools for the cleansing ritual.",
          { price: "Tour varies", people: "2 People", badge: "Klook" },
        ),
        item(
          "d2-item-3",
          "transportation",
          "11:30",
          "Return drive to Ubud",
          "Drive about 30 minutes back from Sebatu toward Ubud center.",
          { price: "Included with driver", people: "2 People", badge: "Drive" },
        ),
        item(
          "d2-item-4",
          "restaurant",
          "12:00",
          "Lunch in Ubud center",
          "One-hour lunch in Ubud center after the purification ceremony.",
          { price: "USD 25-50", people: "2 People", badge: "Lunch" },
        ),
        item(
          "d2-item-5",
          "transportation",
          "13:00",
          "Drive to Goa Gajah",
          "Short 10-minute drive to Goa Gajah, the Elephant Cave Temple.",
          { price: "Included with driver", people: "2 People", badge: "Drive" },
        ),
        item(
          "d2-item-6",
          "activity",
          "13:15",
          "Goa Gajah Elephant Cave Temple",
          "Forty-five-minute visit to the historic Goa Gajah temple site, included in Kuta Bali Healers and Holy Springs tour references.",
          { price: "Entry varies", people: "2 People", badge: "Temple" },
        ),
        item(
          "d2-item-7",
          "transportation",
          "14:00",
          "Drive to Bali Pulina Coffee Plantation",
          "Drive about 20 minutes toward Bali Pulina near Tegalalang.",
          { price: "Included with driver", people: "2 People", badge: "Drive" },
        ),
        item(
          "d2-item-8",
          "activity",
          "14:30",
          "Coffee tasting and plantation tour",
          "Thirty-minute coffee tasting and plantation tour near Tegalalang.",
          { price: "Tasting varies", people: "2 People", badge: "Coffee" },
        ),
        item(
          "d2-item-9",
          "hotel",
          "15:00",
          "Return to hotel and unwind",
          "Drive back to the Ubud hotel for pool or spa time after the spiritual route.",
          { price: "Hotel booked separately", people: "2 People", badge: "Rest" },
        ),
        item(
          "d2-item-10",
          "restaurant",
          "17:00",
          "Early dinner or spa evening",
          "Early dinner or a spa-led evening to keep the day calm after the ceremony.",
          { price: "USD 40-90", people: "2 People", badge: "Dinner" },
        ),
        item(
          "d2-item-11",
          "event",
          "19:00",
          "Optional Kecak dance or Ubud market stroll",
          "Optional evening Kecak dance performance or Ubud market walk.",
          { price: "Optional", people: "2 People", badge: "Evening" },
        ),
      ],
      suggestions: [
        {
          id: "d2-suggestion-1",
          title: "Bali Eat Pray Love Day Tour",
          category: "Klook",
          imageUrl: baseImage,
          matchReason: "A strong alternative if you want holy spring, healer and terrace content in one provider-backed format.",
          matchScore: "Alternative",
          ctaText: "Book Now",
        },
      ],
      notes: [
        {
          id: "d2-note-1",
          icon: "spark",
          title: "Purification focus",
          text: "This day emphasizes the Bali Spirit theme, so keep pacing quiet and respectful around the ceremony.",
        },
      ],
    }),
    day({
      dayNumber: 3,
      title: "Travel to North Bali and Lovina Glow",
      destinationLabel: "Lovina",
      routeFrom: "Ubud",
      routeTo: "Lovina, Banjar Hot Springs, Lovina Bay",
      weatherLabel: "29C / Northern coast",
      quote:
        "The island changes mood on the road north: mountain curves, hot springs, black-sand beach, and glowing water after dark.",
      description:
        "Transfer from Ubud to Lovina, check in near the beach, rest, visit Banjar Hot Springs, enjoy a beachside dinner, and add a local bioluminescent plankton kayak or boat experience.",
      estimatedCost: "USD 220-420",
      items: [
        item(
          "d3-item-1",
          "transportation",
          "07:00",
          "Depart Ubud for Lovina",
          "Drive north from Ubud to Lovina, about 120 km and roughly 3 hours via the Singaraja-Denpasar route.",
          { price: "Private driver varies", people: "2 People", badge: "Drive" },
        ),
        item(
          "d3-item-2",
          "hotel",
          "10:00",
          "Check in or luggage drop at Lovina hotel",
          "Arrive Lovina and check in if available. Recommended options include The Lovina Bali Resort and Puri Bagus Lovina.",
          { price: "The Lovina from about USD 124 / Puri Bagus from about USD 106", people: "2 People", badge: "Hotel" },
        ),
        item(
          "d3-item-3",
          "activity",
          "10:30",
          "Relax at hotel or beach",
          "Ninety-minute rest block at the hotel or beach after the long drive.",
          { price: "Free", people: "2 People", badge: "Rest" },
        ),
        item(
          "d3-item-4",
          "restaurant",
          "12:00",
          "Lunch in Lovina",
          "One-hour lunch at a local Lovina cafe.",
          { price: "USD 25-50", people: "2 People", badge: "Lunch" },
        ),
        item(
          "d3-item-5",
          "transportation",
          "13:00",
          "Drive to Banjar Hot Springs",
          "Drive about 15 minutes from Lovina toward Banjar Natural Hot Springs.",
          { price: "Included with driver", people: "2 People", badge: "Drive" },
        ),
        item(
          "d3-item-6",
          "activity",
          "14:00",
          "Banjar Natural Hot Springs",
          "Soak at Banjar Natural Hot Springs and enjoy the mountain view for about one hour.",
          { price: "Entry varies", people: "2 People", badge: "Hot Springs" },
        ),
        item(
          "d3-item-7",
          "transportation",
          "15:00",
          "Return to Lovina",
          "Return to Lovina for rest, swim time, and dinner setup.",
          { price: "Included with driver", people: "2 People", badge: "Drive" },
        ),
        item(
          "d3-item-8",
          "activity",
          "16:00",
          "Lovina Beach swim and leisure",
          "Leisure block for swimming at Lovina Beach or resting at the resort.",
          { price: "Free", people: "2 People", badge: "Beach" },
        ),
        item(
          "d3-item-9",
          "restaurant",
          "17:30",
          "Beachside dinner in Lovina",
          "Early beachside dinner before the night-glow activity.",
          { price: "USD 35-70", people: "2 People", badge: "Dinner" },
        ),
        item(
          "d3-item-10",
          "activity",
          "19:30",
          "Bioluminescent plankton kayak or boat",
          "Two-hour local night kayak or boat experience to see bioluminescent plankton in Lovina Bay. The document notes this as a local guide activity, not a formal Viator/Klook listing.",
          { price: "Local guide varies", people: "2 People", badge: "Local Guide" },
        ),
      ],
      notes: [
        {
          id: "d3-note-1",
          icon: "moon",
          title: "Glow activity note",
          text: "The plankton activity is local-guide based, so add your preferred affiliate/provider link manually before publishing.",
        },
      ],
    }),
    day({
      dayNumber: 4,
      title: "Lovina Dolphins and North Bali Highlights",
      destinationLabel: "North Bali",
      routeFrom: "Lovina",
      routeTo: "Lovina Beach, Handara Gate, Wanagiri, Brahma Vihara, Gitgit",
      weatherLabel: "28C / Dawn sea and mountain lakes",
      quote:
        "Dawn dolphins begin the day, then North Bali unfolds through gates, lake viewpoints, a Buddhist temple, and waterfall mist.",
      description:
        "Rise early for dolphin watching at Lovina, breakfast by the sea, then continue through Handara Gate, Wanagiri Twin Lake, Brahma Vihara Arama, optional Gitgit Waterfall, and return or relax.",
      estimatedCost: "USD 240-430",
      items: [
        item(
          "d4-item-1",
          "transportation",
          "05:00",
          "Drive to Lovina Beach pier",
          "Early 10-minute transfer from the hotel to Lovina Beach pier.",
          { price: "Included with driver", people: "2 People", badge: "Dawn Transfer" },
        ),
        item(
          "d4-item-2",
          "activity",
          "05:30",
          "Lovina dolphin-watching boat tour",
          "Dawn dolphin-watching boat tour on Lovina Beach, returning by around 07:00. Based on Klook Lovina Dolphin Watching tour content.",
          { price: "Tour varies", people: "2 People", badge: "Klook" },
        ),
        item(
          "d4-item-3",
          "restaurant",
          "07:00",
          "Breakfast by the sea",
          "One-hour breakfast after the dolphin boat returns.",
          { price: "USD 20-40", people: "2 People", badge: "Breakfast" },
        ),
        item(
          "d4-item-4",
          "hotel",
          "08:00",
          "Checkout from Lovina hotel",
          "Check out and prepare for the North Bali highlights route.",
          { price: "Hotel booked separately", people: "2 People", badge: "Checkout" },
        ),
        item(
          "d4-item-5",
          "transportation",
          "08:00",
          "Drive to Handara Gate",
          "Drive about one hour through the mountainous lakeside route to Handara Gate near Bedugul.",
          { price: "Private driver varies", people: "2 People", badge: "Drive" },
        ),
        item(
          "d4-item-6",
          "activity",
          "09:00",
          "Handara Gate photo stop",
          "Twenty-minute photo stop at Handara Gate, the famous North Bali sky-gate visual.",
          { price: "Entry/photo fee varies", people: "2 People", badge: "Photo Stop" },
        ),
        item(
          "d4-item-7",
          "activity",
          "09:20",
          "Wanagiri Twin Lake Viewpoint",
          "Short transfer and viewpoint stop overlooking the twin lakes.",
          { price: "Entry varies", people: "2 People", badge: "Viewpoint" },
        ),
        item(
          "d4-item-8",
          "transportation",
          "10:30",
          "Drive to Brahma Vihara Arama",
          "Drive about 20 minutes to Brahma Vihara Arama Buddhist temple.",
          { price: "Included with driver", people: "2 People", badge: "Drive" },
        ),
        item(
          "d4-item-9",
          "activity",
          "11:00",
          "Brahma Vihara Arama Buddhist temple",
          "Forty-five-minute visit through stupas and gardens at Bali's largest Buddhist monastery.",
          { price: "Entry / donation varies", people: "2 People", badge: "Temple" },
        ),
        item(
          "d4-item-10",
          "restaurant",
          "12:00",
          "Late lunch in Bedugul or North Bali",
          "Late lunch in Bedugul or back toward the Lovina region depending on routing.",
          { price: "USD 30-55", people: "2 People", badge: "Lunch" },
        ),
        item(
          "d4-item-11",
          "activity",
          "13:30",
          "Optional Gitgit Waterfall hike",
          "Optional short hike at Gitgit Waterfall if time and energy allow.",
          { price: "Entry varies", people: "2 People", badge: "Optional" },
        ),
        item(
          "d4-item-12",
          "transportation",
          "15:00",
          "Return to Ubud, Denpasar, or rest in Lovina",
          "Conclude the route with a 2-3 hour drive back to Ubud/Denpasar or stay relaxed in Lovina.",
          { price: "Private driver varies", people: "2 People", badge: "Return Drive" },
        ),
      ],
      suggestions: [
        {
          id: "d4-suggestion-1",
          title: "Lovina Dolphin Watching and North Bali Day Trip",
          category: "Klook",
          imageUrl: baseImage,
          matchReason: "Provider-backed route covering Lovina dolphins, Banjar, Handara, Wanagiri and Brahma Vihara.",
          matchScore: "Best Fit",
          ctaText: "Book Now",
        },
      ],
      notes: [
        {
          id: "d4-note-1",
          icon: "sunrise",
          title: "Early start",
          text: "The dolphin boat needs a very early wake-up, so keep the previous night simple.",
        },
      ],
    }),
    day({
      dayNumber: 5,
      title: "Cultural Finale or Departure Buffer",
      destinationLabel: "Bali",
      routeFrom: "Lovina or Ubud",
      routeTo: "Mount Batur, Ubud, or Ngurah Rai Airport",
      weatherLabel: "27C / Flexible finale",
      quote:
        "The final day stays open: sunrise mountain glow, missed cultural stops, or a clean airport transfer.",
      description:
        "Optional buffer day for Mount Batur sunrise trekking, any missed Bali Spirit activities, or a transfer to Ngurah Rai Airport with enough road time from Lovina.",
      estimatedCost: "USD 160-360",
      items: [
        item(
          "d5-item-1",
          "activity",
          "02:30",
          "Optional Mount Batur Sunrise Trekking",
          "Optional 8-12 hour Mount Batur sunrise trekking experience with views toward Lake Batur and Mount Agung, based on Klook Mount Batur Sunrise Trekking content.",
          { price: "Tour varies", people: "2 People", badge: "Klook" },
        ),
        item(
          "d5-item-2",
          "restaurant",
          "09:30",
          "Post-hike breakfast or hotel breakfast",
          "Breakfast after the trek or a slower hotel breakfast if skipping the sunrise hike.",
          { price: "USD 20-40", people: "2 People", badge: "Breakfast" },
        ),
        item(
          "d5-item-3",
          "activity",
          "11:00",
          "Missed activity buffer",
          "Use this slot for any missed activity such as Monkey Forest, Ubud market, spa, or extra temple time.",
          { price: "Flexible", people: "2 People", badge: "Buffer" },
        ),
        item(
          "d5-item-4",
          "restaurant",
          "13:00",
          "Final Bali lunch",
          "Final lunch in Ubud, Lovina, or en route depending on departure plan.",
          { price: "USD 30-60", people: "2 People", badge: "Lunch" },
        ),
        item(
          "d5-item-5",
          "transportation",
          "14:30",
          "Transfer to Ngurah Rai Airport or next hotel",
          "Allow about 3 hours from Lovina to Ngurah Rai Airport, or shorter if departing from Ubud.",
          { price: "Private driver varies", people: "2 People", badge: "Airport Transfer" },
        ),
      ],
      notes: [
        {
          id: "d5-note-1",
          icon: "plane",
          title: "Departure buffer",
          text: "The source recommends allowing around three hours from Lovina to Ngurah Rai Airport.",
        },
      ],
    }),
  ];

  return {
    hero: {
      backgroundImage: baseImage,
      title: "Your Cinematic Ready Plan",
      subtitle:
        "A Bali Spirit and Island Glow route through Ubud temples, waterfalls, purification rituals, Lovina dolphins, hot springs, bioluminescent waters, and North Bali highlights.",
      stats: [
        { label: "Days", value: "5" },
        { label: "Countries", value: "1" },
        { label: "Cities", value: "3" },
        { label: "Travelers", value: "2" },
        { label: "Travel Style", value: "Spirit + Glow" },
      ],
      primaryCtaText: "Book Now",
      primaryCtaHref: "/api/affiliate/redirect",
      secondaryCtaText: "Book Now",
    },
    journeyOverview: {
      title: "Journey Overview",
      startPoint: "Ubud",
      destinations: "Ubud, Sebatu, Tegalalang, Lovina, North Bali",
      tripStyle: "Culture, purification, waterfalls, dolphins, night glow, hot springs",
      travelers: "2 Adults",
      estimatedCost: "Provider-dependent, excluding flights",
      aiScore: "4.8",
    },
    days,
    footer: {
      backgroundImage: footerImage,
      title: "Your journey, but smarter.",
      subtitle:
        "This Bali draft is ready for your final image uploads and item-level affiliate links before publishing.",
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
    location: "Ubud, Lovina, North Bali",
    days: content.days.length,
    image_url: baseImage,
    created_at: timestamp,
    subtitle:
      "A detailed Bali Spirit and Island Glow route with Ubud temples, waterfalls, purification, Lovina dolphins, hot springs, night glow, hotels, transfers, and provider-backed tour notes.",
    country: "Indonesia",
    city: "Ubud, Lovina, North Bali",
    destination: "Bali",
    style: "Culture, Wellness, Nature, Night Glow, Adventure",
    daysCount: content.days.length,
    heroImage: baseImage,
    coverImage: footerImage,
    summary:
      "A Bali Spirit and Island Glow itinerary across Ubud, Sebatu, Tegalalang, Lovina, and North Bali, ready for final images and item-level affiliate links.",
    seoTitle: PLAN_TITLE,
    seoDescription:
      "Draft ready plan for Bali Spirit and Island Glow with detailed timed items, temples, waterfalls, purification, dolphins, hotels, tours, transfers, and booking placeholders.",
    tags: ["Bali", "Ubud", "Lovina", "Tegalalang", "Tirta Empul", "Dolphins", "Waterfalls", "Wellness"],
    season: "Year-round",
    showOnHome: false,
    priceFrom: 1800,
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
  console.error("INSERT_BALI_READY_PLAN_FAILED");
  console.error(error);
  process.exit(1);
});
