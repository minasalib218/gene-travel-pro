import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import crypto from "node:crypto";

const SOURCE_ENV_PATH = new URL("../.env", import.meta.url);
const SLUG = "adventure-travel-plan-for-morocco";
const LEGACY_SLUGS = ["morocco-desert-and-royal-cities", SLUG];
const PLAN_TITLE = "Adventure-Focused Morocco Road Trip";

function asId() {
  return crypto.randomUUID();
}

function planItem(id, type, time, title, description, extra = {}) {
  return {
    id,
    type,
    time,
    title,
    description,
    imageUrl: extra.imageUrl || "/bg/home-hero.png",
    price: extra.price || "",
    people: extra.people || "",
    badge: extra.badge || prettyType(type),
    status: extra.status || "Draft",
    deeplink: "",
    buttonLabel: "Book Now",
  };
}

function prettyType(type) {
  if (type === "transportation") return "Transport";
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function buildDay({
  dayNumber,
  title,
  destinationLabel,
  routeFrom,
  routeTo,
  weatherLabel,
  quote,
  description,
  items,
  estimatedCost,
}) {
  const image = "/bg/home-hero.png";
  return {
    id: `day-${dayNumber}`,
    dayNumber,
    title,
    destinationLabel,
    countryLabel: "Morocco",
    previewImage: image,
    heroImage: image,
    dateLabel: `Day ${dayNumber}`,
    routeFrom,
    routeTo,
    weatherLabel,
    quote,
    description,
    timelineItems: items,
    suggestions: [],
    story: {
      imageUrl: image,
      quote,
      musicLabel: "Cinematic Story",
      musicUrl: "",
    },
    summary: {
      activitiesCount: String(items.filter((item) => item.type === "activity").length),
      restaurantsCount: String(items.filter((item) => item.type === "restaurant").length),
      transfersCount: String(items.filter((item) => item.type === "transportation" || item.type === "flight").length),
      estimatedCost,
      upgrades: [],
      viewDetailsText: "View Details",
      editPlanText: "Edit Plan",
    },
    notes: [
      {
        id: `d${dayNumber}-note-1`,
        icon: "sparkles",
        title: "Booking note",
        text: "Add final images and item-level affiliate links in the admin editor before publishing.",
      },
      {
        id: `d${dayNumber}-note-2`,
        icon: "map",
        title: "Road timing",
        text: "Drive times include base estimates; keep meal, fuel, photo, and fatigue buffers visible in the final edit.",
      },
    ],
  };
}

function buildContent() {
  const baseImage = "/bg/home-hero.png";
  const footerImage = "/bg/home-hero-bottom-optimized.jpg";

  const days = [
    buildDay({
      dayNumber: 1,
      title: "Marrakech Sunrise Ballooning",
      destinationLabel: "Marrakech",
      routeFrom: "Marrakech",
      routeTo: "Marrakech",
      weatherLabel: "31C / Clear sunrise",
      quote: "Morocco begins above the Atlas light, then slows down into a luxury Marrakech reset.",
      description:
        "Start with a pre-dawn hot-air-balloon experience outside Marrakech, then keep the rest of the day intentionally soft at La Mamounia.",
      estimatedCost: "USD 520",
      items: [
        planItem(
          "d1-item-1",
          "activity",
          "04:20-10:00",
          "Atlas Mountains Hot Air Balloon Ride",
          "Provider-operated pickup from central Marrakech with a planned 04:20 pickup and 06:00 activity-start assumption. Exact pickup is confirmed by WhatsApp after weather review.",
          { badge: "Balloon" },
        ),
        planItem(
          "d1-item-2",
          "hotel",
          "10:00-12:30",
          "La Mamounia Recovery Window",
          "Rest, shower, content capture, and terrace downtime after the very early balloon start.",
          { badge: "Hotel" },
        ),
        planItem(
          "d1-item-3",
          "restaurant",
          "12:30-14:00",
          "On-property Lunch near Bab Jdid",
          "Keep lunch on-property or nearby to avoid unnecessary transfers after the sunrise activity.",
          { badge: "Lunch" },
        ),
        planItem(
          "d1-item-4",
          "hotel",
          "15:00-18:30",
          "La Mamounia Check-in and Medina Drift",
          "Official check-in is 15:00. Use the afternoon for light medina drifting, spa time, or a calm luxury reset.",
          { badge: "Hotel" },
        ),
      ],
    }),
    buildDay({
      dayNumber: 2,
      title: "Atlas Villages and Valley Culture",
      destinationLabel: "Atlas Mountains",
      routeFrom: "Marrakech",
      routeTo: "Atlas Valleys",
      weatherLabel: "27C / Mountain air",
      quote: "The second day trades city polish for Berber villages, valley views, and a gentler outdoor rhythm.",
      description:
        "Use a full-day Atlas villages tour with hotel pickup, then return to Marrakech for recovery before the coastal transfer.",
      estimatedCost: "USD 420",
      items: [
        planItem("d2-item-1", "restaurant", "07:30-08:15", "Breakfast at La Mamounia", "Easy breakfast because the Atlas tour pickup begins at 08:30.", { badge: "Breakfast" }),
        planItem(
          "d2-item-2",
          "activity",
          "08:30-16:30",
          "Berber Villages, 3 Valleys and Camel Ride",
          "An 8-hour Atlas Mountains day trip with hotel or riad pickup, Berber villages, valley scenery, and a camel-ride component.",
          { badge: "Atlas" },
        ),
        planItem("d2-item-3", "hotel", "17:00-19:00", "Pool, Rest and Photo Ingest", "A necessary buffer before the route begins moving toward the coast and desert.", { badge: "Reset" }),
        planItem("d2-item-4", "restaurant", "20:00-21:30", "Early Marrakech Dinner", "Keep dinner early to preserve sleep before the next transfer day.", { badge: "Dinner" }),
      ],
    }),
    buildDay({
      dayNumber: 3,
      title: "Atlantic Transfer to Essaouira",
      destinationLabel: "Essaouira",
      routeFrom: "Marrakech",
      routeTo: "Essaouira",
      weatherLabel: "24C / Atlantic breeze",
      quote: "The road west opens into sea wind, blue doors, old port textures, and a slower Atlantic chapter.",
      description:
        "Drive from Marrakech to Essaouira, use the pre-check-in window for lunch and port walking, then settle into Heure Bleue Palais.",
      estimatedCost: "USD 560",
      items: [
        planItem("d3-item-1", "transportation", "09:00-11:22", "Drive Marrakech to Essaouira", "A clean premium road transfer of around 174 km, with a base drive time of about 2 hours 22 minutes.", { badge: "Road" }),
        planItem("d3-item-2", "restaurant", "11:30-14:30", "Old Port Lunch and Walk", "Use the pre-check-in window for a seafood lunch, old-port walk, and first coastal photos.", { badge: "Lunch" }),
        planItem("d3-item-3", "hotel", "15:00-18:30", "Heure Bleue Palais Check-in", "Check in, rest on the rooftop, and use the golden hour for medina photography. Standard check-in is 15:00.", { badge: "Hotel" }),
      ],
    }),
    buildDay({
      dayNumber: 4,
      title: "Essaouira Surf and Slow Coast",
      destinationLabel: "Essaouira",
      routeFrom: "Heure Bleue Palais",
      routeTo: "Essaouira Beach",
      weatherLabel: "23C / Windy coast",
      quote: "Essaouira deserves room to breathe: one active surf block, then hammam, beach, and medina edit time.",
      description:
        "Keep the day spacious around a late-morning surf lesson so the coastal chapter feels premium rather than rushed.",
      estimatedCost: "USD 380",
      items: [
        planItem("d4-item-1", "restaurant", "09:00-10:30", "Breakfast and Slow Morning", "A quiet start because the surf slot works better without rush.", { badge: "Breakfast" }),
        planItem(
          "d4-item-2",
          "activity",
          "11:00-13:00",
          "Surf Lesson with Local Surfer",
          "A 2-hour Essaouira surf lesson using the selected 11:00 planning slot. Meeting point: ESSAOUIRA WATERSPORTS, 11 Av. Princesse Lalla Amina.",
          { badge: "Surf" },
        ),
        planItem("d4-item-3", "restaurant", "13:15-15:00", "Beach Lunch", "Post-surf lunch near the beach before a calmer afternoon.", { badge: "Lunch" }),
        planItem("d4-item-4", "activity", "15:00-18:30", "Hammam, Beach or Medina Edit Time", "A deliberately spacious afternoon for recovery, photo editing, and slow coastal wandering.", { badge: "Recovery" }),
      ],
    }),
    buildDay({
      dayNumber: 5,
      title: "Return to Marrakech and Agafay Night",
      destinationLabel: "Marrakech and Agafay",
      routeFrom: "Essaouira",
      routeTo: "Agafay Desert",
      weatherLabel: "30C / Desert sunset",
      quote: "The route returns to Marrakech, then slips into Agafay for quad-bike dust, camel silhouettes, pool time, and dinner-show energy.",
      description:
        "Drive back to Marrakech, leave a check-in buffer at La Mamounia, then take the afternoon Agafay desert adventure.",
      estimatedCost: "USD 690",
      items: [
        planItem("d5-item-1", "transportation", "09:00-11:22", "Drive Essaouira back to Marrakech", "Same base road transfer: about 174 km and 2 hours 22 minutes.", { badge: "Road" }),
        planItem("d5-item-2", "restaurant", "11:30-14:00", "Lunch and La Mamounia Check-in Buffer", "La Mamounia check-in is 15:00, so leave bags if arriving early and keep lunch nearby.", { badge: "Lunch" }),
        planItem(
          "d5-item-3",
          "activity",
          "14:20-21:30",
          "Luxury Agafay Desert: Quad Bike, Camel Ride, Pool and Dinner Show",
          "Published operating hour is 14:30. The driver arrives about 10 minutes before pickup; Marrakech to Agafay is roughly 27 km by road.",
          { badge: "Agafay" },
        ),
      ],
    }),
    buildDay({
      dayNumber: 6,
      title: "Ait Benhaddou Road and Quad Ride",
      destinationLabel: "Ait Benhaddou",
      routeFrom: "Marrakech",
      routeTo: "Ait Benhaddou",
      weatherLabel: "29C / Dry kasbah light",
      quote: "The mountain road becomes cinema country: red-earth bends, kasbah walls, and a quad ride near Ait Benhaddou.",
      description:
        "Cross from Marrakech to Ait Benhaddou, check into Ksar Ighnda, then ride the late-afternoon quad slot.",
      estimatedCost: "USD 610",
      items: [
        planItem("d6-item-1", "transportation", "08:00-11:05", "Drive Marrakech to Ait Benhaddou", "Base route is about 173 km and 3 hours. Add view-stop buffers on the mountain crossing.", { badge: "Road" }),
        planItem("d6-item-2", "hotel", "14:00-15:45", "Ksar Ighnda Check-in and Rest", "Standard check-in from 14:00. Use this block to reset before the quad activity.", { badge: "Hotel" }),
        planItem("d6-item-3", "activity", "16:30-18:30", "2-hour Guided Quad Tour of Ait Ben Haddou", "A flexible-time Viator product; 16:30 is the selected slot for better light and temperature.", { badge: "Quad" }),
      ],
    }),
    buildDay({
      dayNumber: 7,
      title: "Ouarzazate Road to Dades",
      destinationLabel: "Boumalne Dades",
      routeFrom: "Ait Benhaddou",
      routeTo: "Dades Valley",
      weatherLabel: "26C / Canyon afternoon",
      quote: "The road draws a clean line from kasbah country through Ouarzazate into Dades switchbacks and canyon air.",
      description:
        "Move from Ait Benhaddou to Boumalne Dades, keep the afternoon soft, and use Hotel Xaluca Dades as the recovery base.",
      estimatedCost: "USD 470",
      items: [
        planItem("d7-item-1", "transportation", "09:00-11:30", "Drive Ait Benhaddou to Boumalne Dades", "Direct routing via Ouarzazate is about 145 km and 2 hours 28 minutes.", { badge: "Road" }),
        planItem("d7-item-2", "restaurant", "12:00-13:15", "Boumalne Lunch", "Keep lunch near Boumalne so the afternoon stays soft and practical.", { badge: "Lunch" }),
        planItem("d7-item-3", "hotel", "14:00-15:30", "Hotel Xaluca Dades Check-in", "Standard check-in from 14:00 with spa and pool recovery value.", { badge: "Hotel" }),
        planItem("d7-item-4", "activity", "15:30-18:00", "Optional Dades Canyon Drive", "Pool, rest, or a short canyon drive depending on energy and light.", { badge: "Canyon" }),
      ],
    }),
    buildDay({
      dayNumber: 8,
      title: "Dades to Merzouga Luxury Camp",
      destinationLabel: "Merzouga",
      routeFrom: "Dades Valley",
      routeTo: "Merzouga Desert",
      weatherLabel: "34C / Sahara evening",
      quote: "The Sahara day needs patience: road rhythm first, then tea, camel movement, tent light, dinner, and stars.",
      description:
        "Drive from Dades to Merzouga, manage stops calmly, then begin the luxury desert-camp overnight flow at 17:00.",
      estimatedCost: "USD 760",
      items: [
        planItem("d8-item-1", "transportation", "09:00-12:55", "Drive Boumalne Dades to Merzouga", "Base route is around 242 km and 3 hours 55 minutes before meal and photo stops.", { badge: "Road" }),
        planItem("d8-item-2", "restaurant", "13:00-16:45", "Lunch, Stop Management and Arrival Tea", "A calm runway into the desert experience, leaving space for roadside stops and arrival tea.", { badge: "Lunch" }),
        planItem(
          "d8-item-3",
          "activity",
          "17:00-next morning",
          "Superior Luxury Camp in Merzouga Desert",
          "Includes private nomad luxury tent, dinner, breakfast, camel ride, and a sunrise-oriented overnight flow.",
          { badge: "Camp" },
        ),
      ],
    }),
    buildDay({
      dayNumber: 9,
      title: "Merzouga Recovery and Quad Biking",
      destinationLabel: "Merzouga",
      routeFrom: "Desert Camp",
      routeTo: "Dar Morocco",
      weatherLabel: "33C / Desert gold",
      quote: "The second Merzouga day is what makes this version superior: recovery, lunch, then one sharp hour of quad energy.",
      description:
        "Return from camp, recover at Dar Morocco, then take the selected 17:00 quad-biking slot inside the published operating window.",
      estimatedCost: "USD 430",
      items: [
        planItem("d9-item-1", "activity", "08:30-14:00", "Return from Camp, Shower and Recovery Lunch", "The morning return is part of the camp flow; this spacious recovery block protects the whole itinerary.", { badge: "Recovery" }),
        planItem("d9-item-2", "hotel", "14:00-15:30", "Dar Morocco Check-in and Rest", "Official check-in is 14:00-23:00. The property is coherent because the camp activity meets at Dar Morocco.", { badge: "Hotel" }),
        planItem(
          "d9-item-3",
          "activity",
          "17:00-18:00",
          "1 Hour Quad Biking in Merzouga",
          "Selected 17:00 slot inside the 06:00-18:00 operating window to avoid midday heat. Pickup can be requested.",
          { badge: "Quad" },
        ),
      ],
    }),
    buildDay({
      dayNumber: 10,
      title: "Long Return to Marrakech",
      destinationLabel: "Marrakech",
      routeFrom: "Merzouga",
      routeTo: "Marrakech",
      weatherLabel: "32C / Long road day",
      quote: "The final chapter is honest road cinema: long distances, desert memory, and the return to Marrakech.",
      description:
        "Return from Merzouga to Marrakech. This is the hardest road day and should be presented transparently in the customer plan.",
      estimatedCost: "USD 310",
      items: [
        planItem(
          "d10-item-1",
          "transportation",
          "08:00-18:30",
          "Drive Merzouga to Marrakech",
          "Base route is about 550 km and 9 hours 3 minutes, plus lunch, fuel, and comfort stops. Do not under-sell this road day.",
          { badge: "Road" },
        ),
      ],
    }),
  ];

  return {
    hero: {
      title: PLAN_TITLE,
      subtitle:
        "A premium 10-day Morocco adventure loop from Marrakech to Essaouira, Agafay, Ait Benhaddou, Dades, Merzouga, and back.",
      backgroundImage: baseImage,
      primaryCtaText: "Plan Smarter With AI",
      primaryCtaHref: "/start-planning",
      secondaryCtaText: "View Full Timeline",
      stats: [
        { label: "Days", value: "10" },
        { label: "Countries", value: "1" },
        { label: "Cities", value: "6" },
        { label: "Travelers", value: "2" },
        { label: "Travel Style", value: "Adventure" },
      ],
    },
    journeyOverview: {
      title: "Journey Overview",
      startingPoint: "Marrakech, Morocco",
      destinations: "Marrakech, Essaouira, Agafay, Ait Benhaddou, Dades, Merzouga",
      tripStyle: "Premium Adventure Road Trip",
      travelers: "2 Adults",
      estimatedCost: "USD 5,180",
      aiScore: "4.9",
    },
    days,
    footer: {
      title: "Your journey, but smarter.",
      subtitle: "Use this draft as the Morocco road-trip base, then add final images and affiliate links before publishing.",
      backgroundImage: footerImage,
      ctaText: "Plan Smarter With AI",
      ctaHref: "/start-planning",
    },
  };
}

function buildDaysJson(content) {
  return content.days.map((day) => ({
    id: day.id,
    dayNumber: day.dayNumber,
    title: day.title,
    city: day.destinationLabel,
    country: day.countryLabel,
    date: day.dateLabel,
    temperature: day.weatherLabel,
    mainImageUrl: day.heroImage,
    locationName: day.routeTo || day.destinationLabel,
    locationDescription: day.description,
    notes: day.notes,
    items: day.timelineItems.map((item) => ({
      id: item.id,
      time: item.time || "",
      title: item.title,
      note: item.description,
      type: item.type === "transportation" ? "transport" : item.type,
      imageUrl: item.imageUrl || "",
      deeplink: item.deeplink || "",
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
    location: "Marrakech, Essaouira, Agafay, Ait Benhaddou, Dades, Merzouga",
    days: 10,
    image_url: "/bg/home-hero.png",
    created_at: timestamp,
    subtitle:
      "Premium 10-day Morocco road trip with Marrakech sunrise ballooning, Atlantic surf, Agafay desert, kasbah roads, Dades, Merzouga camp, and quad biking.",
    country: "Morocco",
    city: "Marrakech, Essaouira, Agafay, Ait Benhaddou, Dades, Merzouga",
    destination: "Morocco",
    style: "Premium Adventure Road Trip",
    daysCount: 10,
    heroImage: "/bg/home-hero.png",
    coverImage: "/bg/home-hero-bottom-optimized.jpg",
    summary:
      "A stronger publication-ready Morocco adventure loop built from the new attached road-trip document, ready for final images and per-item affiliate links.",
    seoTitle: `${PLAN_TITLE} | Gene Travel`,
    seoDescription:
      "Draft ready plan for a 10-day Morocco adventure road trip across Marrakech, Essaouira, Agafay, Ait Benhaddou, Dades, and Merzouga.",
    tags: ["Morocco", "Marrakech", "Essaouira", "Agafay", "Merzouga", "Adventure", "Road Trip"],
    season: "All Season",
    showOnHome: false,
    priceFrom: 5180,
    currency: "USD",
    daysJson,
    contentJson: content,
    updatedAt: timestamp,
  };

  const existingResult = await supabase
    .from("ready_plans")
    .select("id, slug")
    .in("slug", LEGACY_SLUGS)
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

  const dayRows = content.days.map((day, index) => ({
    id: asId(),
    readyPlanId: planId,
    dayNumber: day.dayNumber,
    title: day.title,
    city: day.destinationLabel,
    country: day.countryLabel,
    date: day.dateLabel,
    temperature: day.weatherLabel,
    mainImageUrl: day.heroImage || day.previewImage || null,
    locationName: day.routeTo || day.destinationLabel,
    locationDescription: day.description || null,
    description: day.quote || null,
    notesJson: day.notes,
    sortOrder: index,
    items: day.timelineItems.map((item) => ({
      time: item.time || "",
      title: item.title,
      note: item.description,
      type: item.type === "transportation" ? "transport" : item.type,
      imageUrl: item.imageUrl || "",
      deeplink: item.deeplink || "",
      buttonLabel: "Book Now",
    })),
  }));

  const insertDays = await supabase.from("ready_plan_days").insert(dayRows).select("id, dayNumber");
  if (insertDays.error) throw insertDays.error;

  const itemRows = [];
  for (const day of content.days) {
    const dayRecord = insertDays.data.find((row) => row.dayNumber === day.dayNumber);
    if (!dayRecord) continue;

    day.timelineItems.forEach((item, index) => {
      itemRows.push({
        id: asId(),
        readyPlanDayId: dayRecord.id,
        type: item.type,
        title: item.title,
        description: item.description || null,
        imageUrl: item.imageUrl || null,
        price: item.price || null,
        peopleCount: item.people || null,
        statusLabel: item.status || "Draft",
        categoryLabel: item.badge || item.type,
        affiliateUrl: item.deeplink || null,
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
  console.error("INSERT_MOROCCO_READY_PLAN_FAILED");
  console.error(error);
  process.exit(1);
});
