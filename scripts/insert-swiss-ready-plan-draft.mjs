import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import crypto from "node:crypto";

const SOURCE_ENV_PATH = new URL("../.env", import.meta.url);
const SLUG = "swiss-alpine-dream";
const PLAN_TITLE = "Adventure-Focused Swiss Alpine Escape";

function asId() {
  return crypto.randomUUID();
}

function prettyType(type) {
  if (type === "transportation") return "Transport";
  return type.charAt(0).toUpperCase() + type.slice(1);
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

function buildDay({
  dayNumber,
  title,
  destinationLabel,
  routeFrom,
  routeTo,
  weatherLabel,
  quote,
  description,
  estimatedCost,
  items,
}) {
  const image = "/bg/home-hero.png";
  return {
    id: `day-${dayNumber}`,
    dayNumber,
    title,
    destinationLabel,
    countryLabel: "Switzerland",
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
        title: "Admin note",
        text: "Add final images and item-level affiliate links in the admin editor before publishing.",
      },
      {
        id: `d${dayNumber}-note-2`,
        icon: "map",
        title: "Swiss timing",
        text: "Mountain and adventure timings depend on operating hours, weather, and provider confirmation.",
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
      title: "Zurich Arrival to Interlaken Jetboat",
      destinationLabel: "Interlaken",
      routeFrom: "Zurich Airport",
      routeTo: "Interlaken and Bonigen",
      weatherLabel: "20C / Lakeside adventure",
      quote: "Switzerland starts fast: airport precision, alpine roads, Lake Brienz spray, and Interlaken calm.",
      description:
        "Land in Zurich, collect the rental car, drive to Interlaken, settle at Hotel Jnterlaken, then ride the Lake Brienz jetboat from Bonigen.",
      estimatedCost: "USD 690",
      items: [
        planItem("d1-item-1", "flight", "11:00-11:45", "Zurich Airport Arrival and Rental Car Pickup", "Land, clear arrivals, pick up the rental car, and make a quick supplies stop at Zurich Airport.", { badge: "Arrival" }),
        planItem("d1-item-2", "transportation", "11:45-13:30", "Drive Zurich Airport to Interlaken", "A 129 km transfer planned at 1 hour 45 minutes from Zurich Airport into Interlaken.", { badge: "Road" }),
        planItem("d1-item-3", "restaurant", "13:30-14:15", "Lunch in Central Interlaken", "A short walkable lunch block before the hotel bag drop.", { badge: "Lunch" }),
        planItem("d1-item-4", "hotel", "14:15-15:00", "Hotel Jnterlaken Bag Drop", "Settle at the hotel before formal room access. The report notes check-in from 3:00 PM.", { badge: "Hotel" }),
        planItem("d1-item-5", "transportation", "15:35-15:45", "Transfer to Bonigen Jetboat Base", "Short 4 km transfer from Interlaken to the Am Quai jetboat base in Bonigen.", { badge: "Transfer" }),
        planItem("d1-item-6", "activity", "15:50-16:00", "Jetboat Early Arrival Buffer", "Mandatory early arrival buffer at the jetboat base before the ride.", { badge: "Briefing" }),
        planItem("d1-item-7", "activity", "16:00-17:15", "Jetboat on Lake Brienz", "Adventure block from the Bonigen base on Lake Brienz, planned for 1 hour 15 minutes.", { badge: "Jetboat" }),
        planItem("d1-item-8", "transportation", "17:15-17:25", "Return to Hotel", "Short return transfer to Interlaken after the jetboat ride.", { badge: "Transfer" }),
        planItem("d1-item-9", "restaurant", "18:30-19:45", "Interlaken Dinner", "Walkable dinner in Interlaken after the first adventure block.", { badge: "Dinner" }),
        planItem("d1-item-10", "activity", "20:00-21:00", "Promenade Walk and Recovery", "Easy promenade walk and recovery block to close the arrival day.", { badge: "Recovery" }),
      ],
    }),
    buildDay({
      dayNumber: 2,
      title: "Grindelwald First and Bachalpsee",
      destinationLabel: "Grindelwald First",
      routeFrom: "Interlaken",
      routeTo: "Grindelwald First",
      weatherLabel: "17C / Alpine ridge",
      quote: "Day two climbs into the postcard: Grindelwald, First Cliff Walk, Bachalpsee trail, and summit ridge air.",
      description:
        "Drive from Interlaken to Grindelwald, use the First cable car, walk the cliff route, hike Bachalpsee, and keep the afternoon flexible for alpine add-ons.",
      estimatedCost: "USD 540",
      items: [
        planItem("d2-item-1", "restaurant", "07:00-07:45", "Breakfast and Gear Check", "Prepare layers, water, camera gear, and hiking basics before the Grindelwald day.", { badge: "Breakfast" }),
        planItem("d2-item-2", "transportation", "07:45-08:10", "Drive Interlaken to Grindelwald", "A 20 km transfer planned at about 25 minutes.", { badge: "Road" }),
        planItem("d2-item-3", "activity", "08:10-08:25", "Park and Walk to First Valley Station", "Short village walk from parking to the First valley station.", { badge: "Setup" }),
        planItem("d2-item-4", "transportation", "08:30-08:55", "Gondola to First", "Klook-supported mountain access from Grindelwald to First, planned at 25 minutes.", { badge: "Gondola" }),
        planItem("d2-item-5", "activity", "09:00-09:20", "First Cliff Walk", "A short summit-area cliff walk with dramatic alpine viewpoints.", { badge: "Cliff Walk" }),
        planItem("d2-item-6", "activity", "09:25-11:25", "Bachalpsee Out-and-Back Hike", "Two-hour trail window from First to Bachalpsee and back.", { badge: "Hike" }),
        planItem("d2-item-7", "activity", "11:25-12:10", "Summit Ridge Photo and Rest Block", "Scenic, photo, and recovery time on the summit ridge.", { badge: "Photo" }),
        planItem("d2-item-8", "restaurant", "12:10-13:10", "Lunch at First", "A one-hour alpine lunch block at First.", { badge: "Lunch" }),
        planItem("d2-item-9", "activity", "13:10-14:40", "Flexible Alpine Activity Block", "Extra walking, photography, or on-site add-ons if available.", { badge: "Alpine" }),
        planItem("d2-item-10", "transportation", "14:45-15:10", "Gondola Down to Grindelwald", "Return from First to Grindelwald by gondola.", { badge: "Gondola" }),
        planItem("d2-item-11", "transportation", "15:10-15:35", "Drive Back to Interlaken", "Return 20 km from Grindelwald to Interlaken.", { badge: "Road" }),
        planItem("d2-item-12", "hotel", "16:00-18:00", "Recovery, Spa or Cafe Time", "Two-hour soft block after the mountain day.", { badge: "Recovery" }),
        planItem("d2-item-13", "restaurant", "19:00-20:30", "Dinner in Interlaken", "Walkable dinner after the First and Bachalpsee day.", { badge: "Dinner" }),
      ],
    }),
    buildDay({
      dayNumber: 3,
      title: "Interlaken Paragliding and Canyoning",
      destinationLabel: "Interlaken and Wilderswil",
      routeFrom: "Interlaken",
      routeTo: "Beatenberg and Wilderswil",
      weatherLabel: "19C / Adventure sky",
      quote: "This is the high-adrenaline Interlaken day: sky first, canyon second, recovery dinner last.",
      description:
        "Pair tandem paragliding over Interlaken with an afternoon beginner canyoning block from Wilderswil.",
      estimatedCost: "USD 820",
      items: [
        planItem("d3-item-1", "restaurant", "07:15-08:00", "Breakfast and Prep", "Early breakfast and adventure gear prep before paragliding.", { badge: "Breakfast" }),
        planItem("d3-item-2", "transportation", "08:50-09:10", "Transfer to Paragliding Meeting Point", "Walk or short transfer to the central Interlaken paragliding meeting point.", { badge: "Transfer" }),
        planItem("d3-item-3", "activity", "09:20-10:50", "Tandem Paragliding from Interlaken", "A 1 hour 30 minute tandem paragliding experience with Interlaken to Beatenberg transfer included.", { badge: "Paragliding" }),
        planItem("d3-item-4", "activity", "11:00-12:00", "Coffee, Rest and Photo Review", "Post-flight rest, coffee, and photo purchase decision window.", { badge: "Recovery" }),
        planItem("d3-item-5", "restaurant", "12:00-13:00", "Lunch in Interlaken", "Walkable lunch between paragliding and canyoning.", { badge: "Lunch" }),
        planItem("d3-item-6", "transportation", "13:20-13:30", "Drive to Wilderswil Base", "Short 4 km transfer to the canyoning base.", { badge: "Transfer" }),
        planItem("d3-item-7", "activity", "13:30-13:50", "Canyoning Gear Check and Briefing", "Check in and complete the safety briefing at Wilderswil.", { badge: "Briefing" }),
        planItem("d3-item-8", "activity", "14:00-17:00", "Beginner Canyoning Interlaken", "Three-hour canyoning block from the Wilderswil base with short canyon transfer included.", { badge: "Canyoning" }),
        planItem("d3-item-9", "transportation", "17:10-17:20", "Return to Hotel", "Short return transfer after canyoning.", { badge: "Transfer" }),
        planItem("d3-item-10", "restaurant", "18:30-20:00", "Big Recovery Dinner", "A larger dinner block after the most intense Interlaken adventure day.", { badge: "Dinner" }),
      ],
    }),
    buildDay({
      dayNumber: 4,
      title: "Road to Zermatt and Glacier Paradise",
      destinationLabel: "Zermatt",
      routeFrom: "Interlaken",
      routeTo: "Zermatt",
      weatherLabel: "12C / High alpine",
      quote: "The route narrows into mountain theater: Tash parking, Zermatt shuttle, then a climb toward Matterhorn Glacier Paradise.",
      description:
        "Drive from Interlaken to Tash, shuttle into car-free Zermatt, bag drop at SCHLOSS Zermatt, then ascend to Matterhorn Glacier Paradise.",
      estimatedCost: "USD 760",
      items: [
        planItem("d4-item-1", "restaurant", "07:30-08:15", "Breakfast and Pack", "Final Interlaken breakfast and packing block.", { badge: "Breakfast" }),
        planItem("d4-item-2", "transportation", "08:30-10:55", "Drive Interlaken to Tash", "A 151 km drive planned at 2 hours 25 minutes.", { badge: "Road" }),
        planItem("d4-item-3", "transportation", "10:55-11:15", "Matterhorn Terminal Parking and Luggage Transfer", "Park at Matterhorn Terminal Tash and transfer luggage for the shuttle train.", { badge: "Terminal" }),
        planItem("d4-item-4", "transportation", "11:20-11:32", "Shuttle Train Tash to Zermatt", "12-minute rail link into car-free Zermatt.", { badge: "Train" }),
        planItem("d4-item-5", "hotel", "11:35-11:45", "Walk to SCHLOSS Zermatt and Bag Drop", "Short walk to the hotel near the station before formal room access.", { badge: "Hotel" }),
        planItem("d4-item-6", "restaurant", "12:00-13:00", "Lunch in Zermatt", "Walkable lunch in Zermatt village.", { badge: "Lunch" }),
        planItem("d4-item-7", "transportation", "13:10-13:25", "Transfer to Glacier Paradise Valley Station", "Local walk or e-bus to the valley station.", { badge: "Village" }),
        planItem("d4-item-8", "activity", "13:30-17:00", "Matterhorn Glacier Paradise Ascent", "High-alpine cable-car ascent and summit time using the roundtrip ticket from Zermatt Valley Station.", { badge: "Summit" }),
        planItem("d4-item-9", "hotel", "17:10-17:30", "Return to SCHLOSS Zermatt and Formal Check-in", "Return to the hotel and complete formal check-in.", { badge: "Hotel" }),
        planItem("d4-item-10", "restaurant", "19:00-20:30", "Dinner in Zermatt", "Walkable dinner after the Glacier Paradise block.", { badge: "Dinner" }),
      ],
    }),
    buildDay({
      dayNumber: 5,
      title: "Zermatt Paragliding and Matterhorn Village",
      destinationLabel: "Zermatt",
      routeFrom: "SCHLOSS Zermatt",
      routeTo: "Zermatt",
      weatherLabel: "14C / Matterhorn views",
      quote: "The second Zermatt day lets the Matterhorn stay center stage: fly in the morning, recover slowly, dine well.",
      description:
        "Start with VIP tandem paragliding in Zermatt, then keep the afternoon flexible for village wandering, spa, viewpoint walking, or weather contingency.",
      estimatedCost: "USD 690",
      items: [
        planItem("d5-item-1", "restaurant", "07:30-08:15", "Breakfast", "Simple breakfast before the Zermatt paragliding block.", { badge: "Breakfast" }),
        planItem("d5-item-2", "transportation", "09:20-09:25", "Walk to Station Meeting Point", "Very short walk to the meeting point by the station.", { badge: "Walk" }),
        planItem("d5-item-3", "activity", "09:30-11:30", "Zermatt Tandem Paragliding", "Two-hour FLYMATTERHORN VIP tandem paragliding experience with Matterhorn views.", { badge: "Paragliding" }),
        planItem("d5-item-4", "activity", "11:45-12:45", "Recovery Coffee and Photo Review", "Station-area recovery, coffee, and photo review block after flight.", { badge: "Recovery" }),
        planItem("d5-item-5", "restaurant", "13:00-14:15", "Lunch in Zermatt", "Walkable lunch in Zermatt village.", { badge: "Lunch" }),
        planItem("d5-item-6", "activity", "14:30-17:30", "Flexible Zermatt Half-Day", "Village wander, spa, easy viewpoint walk, or weather contingency time.", { badge: "Flexible" }),
        planItem("d5-item-7", "restaurant", "19:00-20:30", "Final Zermatt Dinner", "A relaxed final Zermatt dinner before departure day.", { badge: "Dinner" }),
      ],
    }),
    buildDay({
      dayNumber: 6,
      title: "Zermatt to Lucerne Extension Night",
      destinationLabel: "Lucerne",
      routeFrom: "Zermatt",
      routeTo: "Lucerne",
      weatherLabel: "18C / Lake city evening",
      quote: "Instead of ending too abruptly, the route opens one more Swiss chapter: Zermatt descent, valley roads, and Lucerne evening light.",
      description:
        "Use the report's Zermatt departure logistics, then take the Lucerne extension route and check into AMERON Luzern Hotel Flora.",
      estimatedCost: "USD 520",
      items: [
        planItem("d6-item-1", "restaurant", "07:30-08:15", "Breakfast and Final Pack", "Breakfast and final pack at SCHLOSS Zermatt.", { badge: "Breakfast" }),
        planItem("d6-item-2", "hotel", "08:45-09:00", "Checkout and Walk to Station", "SCHLOSS Zermatt checkout and very short walk to the station.", { badge: "Hotel" }),
        planItem("d6-item-3", "transportation", "09:00-09:12", "Shuttle Zermatt to Tash", "12-minute shuttle rail link back to the car terminal.", { badge: "Train" }),
        planItem("d6-item-4", "transportation", "09:15-09:30", "Pick Up Car and Depart Terminal", "Collect the car at Tash and prepare for the road leg.", { badge: "Terminal" }),
        planItem("d6-item-5", "transportation", "09:30-12:15", "Drive Tash to Lucerne", "The report's route table lists Tash to Lucerne at 173 km and about 2 hours 42 minutes.", { badge: "Road" }),
        planItem("d6-item-6", "restaurant", "12:30-14:30", "Lucerne Lunch and Old Town Walk", "A soft arrival block in Lucerne before hotel check-in.", { badge: "Lunch" }),
        planItem("d6-item-7", "hotel", "15:15-15:45", "AMERON Luzern Hotel Flora Check-in", "Lucerne extension night with check-in from 3:00 PM and checkout at noon.", { badge: "Hotel" }),
        planItem("d6-item-8", "activity", "16:00-18:30", "Lucerne Lakeside Evening", "Use the evening for Chapel Bridge, lakefront walking, and recovery before Pilatus.", { badge: "Lucerne" }),
      ],
    }),
    buildDay({
      dayNumber: 7,
      title: "Pilatus Adventure and Zurich Airport",
      destinationLabel: "Pilatus and Zurich Airport",
      routeFrom: "Lucerne",
      routeTo: "Zurich Airport",
      weatherLabel: "16C / Mountain morning",
      quote: "The final extension day climbs Pilatus, descends through Kriens, then closes cleanly at Zurich Airport.",
      description:
        "Follow the report's Lucerne/Pilatus extension day with bus, gondola, summit views, rope-park window, descent, and Zurich Airport drive.",
      estimatedCost: "USD 480",
      items: [
        planItem("d7-item-1", "transportation", "08:00-08:20", "Walk to Bus or Hotel Transfer", "Central Lucerne walk to bus or hotel breakfast-to-bus transfer.", { badge: "Walk" }),
        planItem("d7-item-2", "transportation", "08:23-08:30", "Bus Lucerne to Kriens", "Seven-minute urban bus transfer over about 3 km.", { badge: "Bus" }),
        planItem("d7-item-3", "transportation", "08:35-09:15", "Ascent to Pilatus from Kriens", "Gondola and Dragon Ride ascent to Pilatus.", { badge: "Gondola" }),
        planItem("d7-item-4", "activity", "09:15-10:45", "Pilatus Summit Views and Dragon Path", "Summit views, Dragon Path, and coffee at Pilatus Kulm.", { badge: "Summit" }),
        planItem("d7-item-5", "activity", "11:00-12:30", "Frakmuntegg Rope Park or Dragon Glider", "Adventure window for rope park or Dragon Glider if operating.", { badge: "Adventure" }),
        planItem("d7-item-6", "restaurant", "12:30-13:30", "Pilatus Lunch", "Lunch at Frakmuntegg or on the summit.", { badge: "Lunch" }),
        planItem("d7-item-7", "transportation", "13:45-14:30", "Descent to Kriens", "Mountain descent by Pilatus route back toward Kriens.", { badge: "Descent" }),
        planItem("d7-item-8", "transportation", "15:00-15:15", "Return to Lucerne Center", "Bus return to Lucerne center.", { badge: "Bus" }),
        planItem("d7-item-9", "transportation", "16:00-16:45", "Drive Lucerne to Zurich Airport", "Final 63 km road leg to Zurich Airport, planned at 45 minutes.", { badge: "Airport" }),
      ],
    }),
  ];

  return {
    hero: {
      title: PLAN_TITLE,
      subtitle:
        "Seven adventure-focused Swiss days from Zurich Airport to Interlaken, Grindelwald First, Zermatt, Lucerne, Pilatus, and Zurich Airport.",
      backgroundImage: baseImage,
      primaryCtaText: "Plan Smarter With AI",
      primaryCtaHref: "/start-planning",
      secondaryCtaText: "View Full Timeline",
      stats: [
        { label: "Days", value: "7" },
        { label: "Countries", value: "1" },
        { label: "Cities", value: "5" },
        { label: "Travelers", value: "2" },
        { label: "Travel Style", value: "Adventure" },
      ],
    },
    journeyOverview: {
      title: "Journey Overview",
      startingPoint: "Zurich Airport, Switzerland",
      destinations: "Interlaken, Grindelwald First, Zermatt, Lucerne, Pilatus",
      tripStyle: "Adventure Alpine Road Trip",
      travelers: "2 Adults",
      estimatedCost: "USD 4,500",
      aiScore: "4.9",
    },
    days,
    footer: {
      title: "Your journey, but smarter.",
      subtitle: "Use this Swiss draft as the adventure base, then add final images and affiliate links before publishing.",
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
    location: "Zurich Airport, Interlaken, Grindelwald, Zermatt, Lucerne, Pilatus",
    days: 7,
    image_url: "/bg/home-hero.png",
    created_at: timestamp,
    subtitle:
      "Adventure-focused Swiss itinerary with Interlaken jetboat, Grindelwald First, paragliding, canyoning, Glacier Paradise, Zermatt flight, and Pilatus extension.",
    country: "Switzerland",
    city: "Interlaken, Grindelwald, Zermatt, Lucerne",
    destination: "Switzerland",
    style: "Adventure Alpine Road Trip",
    daysCount: 7,
    heroImage: "/bg/home-hero.png",
    coverImage: "/bg/home-hero-bottom-optimized.jpg",
    summary:
      "A Swiss adventure itinerary rebuilt from the attached research report, ready for final images and item-level affiliate links.",
    seoTitle: `${PLAN_TITLE} | Gene Travel`,
    seoDescription:
      "Draft ready plan for an adventure-focused Swiss route across Interlaken, Grindelwald First, Zermatt, Lucerne, and Pilatus.",
    tags: ["Switzerland", "Interlaken", "Grindelwald", "Zermatt", "Lucerne", "Pilatus", "Adventure"],
    season: "Summer",
    showOnHome: false,
    priceFrom: 4500,
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
  console.error("INSERT_SWISS_READY_PLAN_FAILED");
  console.error(error);
  process.exit(1);
});
