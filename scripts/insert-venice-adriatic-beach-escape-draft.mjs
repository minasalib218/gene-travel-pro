import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import crypto from "node:crypto";

const SOURCE_ENV_PATH = new URL("../.env", import.meta.url);
const SLUG = "venice-beyond-the-canals-adriatic-beach-escape";
const PLAN_TITLE = "Venice Beyond the Canals: Adriatic Beach Escape";

const ASSET_ROOT = "/images/Italy Eternal Streets Alpine Skies";
const images = {
  hero: `${ASSET_ROOT}/italy-eternal-streets-alpine-skies-hero.jpg`,
  venice: `${ASSET_ROOT}/venice-lagoon-sunset.jpg`,
  coast: `${ASSET_ROOT}/tuscany-cypress-road.jpg`,
  lakes: `${ASSET_ROOT}/dolomites-seceda.jpg`,
  florence: `${ASSET_ROOT}/tuscany-cypress-road.jpg`,
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
    imageUrl: extra.imageUrl || images.hero,
    matchReason,
    matchScore: extra.matchScore || "AI Alternative",
    price: extra.price || "Live price",
    duration: extra.duration || "Flexible",
    ctaText: "Book Now",
  };
}

function buildSummary(items, estimatedCost) {
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

function day({
  dayNumber,
  title,
  destinationLabel,
  imageUrl,
  routeFrom,
  routeTo,
  weatherLabel,
  quote,
  description,
  items,
  notes,
  suggestions,
  estimatedCost = "Live pricing",
}) {
  return {
    id: `day-${dayNumber}`,
    dayNumber,
    title,
    destinationLabel,
    countryLabel: dayNumber >= 6 ? "Switzerland" : "Italy",
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
    summary: buildSummary(items, estimatedCost),
    notes,
  };
}

function buildContent() {
  const days = [
    day({
      dayNumber: 1,
      title: "Venice Arrival and Canal Evening",
      destinationLabel: "Venice",
      imageUrl: images.venice,
      routeFrom: "Venice Marco Polo VCE",
      routeTo: "San Marco, Dorsoduro, quiet canals",
      weatherLabel: "Lagoon arrival",
      quote: "Begin with water, but keep the first evening soft.",
      description:
        "Arrive in Venice, reach the hotel by water transport and walking logic, then keep the evening relaxed with quiet canals, Dorsoduro lanes and a gentle dinner rather than rushing into a heavy monument day.",
      items: [
        item("d1-transfer", "transportation", "15:00", "Venice airport or station to hotel", "Use live arrival timing and Venice-specific water transport logic. Luggage, bridges and vaporetto stops affect duration.", { imageUrl: images.venice, badge: "Water Transfer" }),
        item("d1-hotel", "hotel", "16:30", "Venice hotel check-in", "Check in, refresh and keep a buffer before the evening walk.", { imageUrl: images.venice, badge: "Hotel" }),
        item("d1-walk", "activity", "18:00", "Quiet canals and Dorsoduro walk", "A first Venice walk through quieter canal lanes instead of spending the whole evening in the busiest square.", { imageUrl: images.venice, badge: "Canals" }),
        item("d1-dinner", "restaurant", "20:00", "Lagoon-side dinner", "Slow dinner and short night canal walk before returning to the hotel.", { imageUrl: images.venice, badge: "Dinner" }),
      ],
      suggestions: [
        suggestion("d1-s1", "Private water taxi arrival", "Comfort Upgrade", "A smoother arrival option when luggage and bridges would make the transfer tiring.", { imageUrl: images.venice, duration: "Live timing" }),
      ],
      notes: [
        { id: "d1-n1", icon: "boat", title: "Venice logic", text: "Do not calculate Venice transfers like car transfers." },
        { id: "d1-n2", icon: "clock", title: "Pacing", text: "Keep arrival day light." },
        { id: "d1-n3", icon: "moon", title: "Evening", text: "Use quiet canals for the first mood." },
      ],
    }),
    day({
      dayNumber: 2,
      title: "Venice Icons and Lagoon Story",
      destinationLabel: "Venice",
      imageUrl: images.venice,
      routeFrom: "San Marco",
      routeTo: "Doge's Palace, St Mark's, Castello, hidden canals",
      weatherLabel: "Palaces and quiet lanes",
      quote: "Venice is strongest when the icons and hidden lanes breathe together.",
      description:
        "Start early around San Marco, choose a provider-backed Doge's Palace or Doge's plus St Mark's tour if the time slot fits, then rest before Castello, Arsenale surroundings and residential canals.",
      items: [
        item("d2-san-marco", "activity", "08:00", "Early Piazza San Marco", "Reach San Marco before the main congestion and keep the square cinematic.", { imageUrl: images.venice, badge: "Icon" }),
        item("d2-tour", "activity", "11:30", "Doge's Palace and St Mark's guided visit", "Use Viator or Klook based on live availability, exact departure, bundle value and affiliate logic.", { imageUrl: images.venice, badge: "Provider Tour", duration: "2-3 Hours" }),
        item("d2-lunch", "restaurant", "13:30", "Lunch away from San Marco", "Move away from the busiest zone for a calmer lunch.", { imageUrl: images.venice, badge: "Lunch" }),
        item("d2-rest", "hotel", "15:00", "Hotel recovery", "Protect energy before the hidden Venice walk.", { imageUrl: images.venice, badge: "Recovery" }),
        item("d2-hidden", "activity", "16:30", "Castello and hidden canals", "Residential canals, Arsenale surroundings and local squares over a slow 3-4 km walk.", { imageUrl: images.venice, badge: "Hidden Venice" }),
        item("d2-dinner", "restaurant", "19:30", "Venice dinner", "Dinner and optional blue-hour canal pause.", { imageUrl: images.venice, badge: "Dinner" }),
      ],
      suggestions: [
        suggestion("d2-s1", "Murano glass studio add-on", "Lagoon Craft", "A useful add-on if the customer wants more lagoon culture before the beach day.", { imageUrl: images.venice, duration: "90 min" }),
      ],
      notes: [
        { id: "d2-n1", icon: "ticket", title: "Provider", text: "Tour times must be rechecked for actual dates." },
        { id: "d2-n2", icon: "shoe", title: "Walking", text: "Hidden Venice is an easy but steady walk." },
        { id: "d2-n3", icon: "sun", title: "Rest", text: "Rest is required before the late afternoon route." },
      ],
    }),
    day({
      dayNumber: 3,
      title: "Lido di Venezia Beach Experience",
      destinationLabel: "Venice Lido",
      imageUrl: images.venice,
      routeFrom: "Venice hotel",
      routeTo: "Lido di Venezia, Florence",
      weatherLabel: "Adriatic sea / Light day",
      quote: "After the Dolomites-style intensity, the Adriatic gives the trip room to exhale.",
      description:
        "Modify the day rather than sacrificing the mountain chapter: check out, store luggage, spend the morning on Lido di Venezia as a genuine Adriatic Sea beach destination, then return for luggage and take the high-speed train toward Florence.",
      items: [
        item("d3-breakfast", "restaurant", "07:30", "Breakfast", "Keep breakfast relaxed before checkout and the sea morning.", { imageUrl: images.venice, badge: "Breakfast" }),
        item("d3-checkout", "hotel", "08:30", "Hotel checkout and luggage storage", "Store luggage before the Lido beach experience.", { imageUrl: images.venice, badge: "Checkout" }),
        item("d3-lido", "activity", "09:00", "Lido di Venezia Beach Experience", "Adriatic Sea beach morning on Venice Lido, focused on seaside air, summer pacing and recovery.", { imageUrl: images.venice, badge: "Beach", duration: "3 Hours" }),
        item("d3-lunch", "restaurant", "12:00", "Lido beach lunch", "Simple beach-area lunch before returning toward central Venice.", { imageUrl: images.venice, badge: "Lunch" }),
        item("d3-return", "transportation", "13:00", "Return to central Venice and collect luggage", "Return from Lido, collect luggage and build a station buffer.", { imageUrl: images.venice, badge: "Water Transfer" }),
        item("d3-train", "transportation", "15:00", "High-speed train Venice to Florence", "Target afternoon train from Venice to Florence. Exact time must be pulled live for customer dates.", { imageUrl: images.florence, badge: "Train" }),
        item("d3-florence", "hotel", "17:30", "Florence hotel check-in", "Check in and keep the evening relaxed.", { imageUrl: images.florence, badge: "Hotel" }),
        item("d3-evening", "activity", "19:00", "Relaxed Florence walk", "A gentle first Florence evening after the beach and train movement.", { imageUrl: images.florence, badge: "Evening Walk" }),
      ],
      suggestions: [
        suggestion("d3-s1", "Alberoni Beach", "Hidden Beach", "A quieter Lido alternative with nature and lower-crowd positioning.", { imageUrl: images.venice, duration: "Half day", matchScore: "Hidden Beach" }),
      ],
      notes: [
        { id: "d3-n1", icon: "waves", title: "Sea", text: "Lido is an Adriatic Sea beach destination, not a lake shore." },
        { id: "d3-n2", icon: "train", title: "Rail", text: "Venice to Florence train must be selected live." },
        { id: "d3-n3", icon: "clock", title: "Pacing", text: "This day is intentionally lighter." },
      ],
    }),
    day({
      dayNumber: 4,
      title: "Cinque Terre: Pastel Villages and Mediterranean Blue",
      destinationLabel: "Cinque Terre",
      imageUrl: images.coast,
      routeFrom: "Florence",
      routeTo: "Cinque Terre, Monterosso al Mare, Florence",
      weatherLabel: "Ligurian sea / Coast day",
      quote: "Pastel villages, cliffs and a real Mediterranean beach turn the trip outward to the sea.",
      description:
        "Replace the original full Tuscany tour with a stronger coast upgrade: Florence to Cinque Terre, village exploration, lunch, Monterosso al Mare beach, promenade time and evening return to Florence. Exact rail times must be pulled live.",
      items: [
        item("d4-breakfast", "restaurant", "07:00", "Breakfast", "Early breakfast before the coastal rail day.", { imageUrl: images.florence, badge: "Breakfast" }),
        item("d4-depart", "transportation", "07:30", "Depart Florence for Cinque Terre", "Rail to the Cinque Terre area. Current planners show some Florence-Monterosso trips near 2h10 and others 2.5-3 hours depending on transfers.", { imageUrl: images.coast, badge: "Train" }),
        item("d4-villages", "activity", "10:00", "Cinque Terre village exploration", "Use the regional train network to explore one or two pastel villages without overloading the day.", { imageUrl: images.coast, badge: "Villages" }),
        item("d4-lunch", "restaurant", "12:00", "Coastal lunch", "Lunch with enough time before the beach block.", { imageUrl: images.coast, badge: "Lunch" }),
        item("d4-beach", "activity", "13:30", "Monterosso al Mare Beach", "Monterosso is the Cinque Terre village most associated with a substantial beach, making it the best fit for Gene's sea upgrade.", { imageUrl: images.coast, badge: "Beach", duration: "3 Hours" }),
        item("d4-promenade", "activity", "16:30", "Promenade and village finale", "Promenade, photos and relaxed village time before the return train.", { imageUrl: images.coast, badge: "Promenade" }),
        item("d4-return", "transportation", "17:30", "Return toward Florence", "Return by rail toward Florence, target hotel around 20:30 depending on live schedules.", { imageUrl: images.florence, badge: "Train" }),
      ],
      suggestions: [
        suggestion("d4-s1", "Levanto: Liguria Without the Crowds", "AI Hidden Gem", "A relaxed sandy-beach alternative beside Cinque Terre when crowd levels are high.", { imageUrl: images.coast, duration: "Flexible", matchScore: "Beach" }),
        suggestion("d4-s2", "Val d'Orcia countryside swap", "AI Alternative", "Prefer countryside over the beach? Replace Cinque Terre with Val d'Orcia without changing the rest of the itinerary.", { imageUrl: images.florence, duration: "Full day", matchScore: "Countryside" }),
        suggestion("d4-s3", "Bagno Vignoni thermal village", "Hidden Gem", "A small Tuscan thermal village option for a quieter culture-and-water alternative.", { imageUrl: images.florence, duration: "Flexible", matchScore: "Thermal Village" }),
        suggestion("d4-s4", "Monticchiello quiet Tuscany", "Hidden Gem", "A soft countryside village option for travelers who choose culture over coastline.", { imageUrl: images.florence, duration: "Flexible", matchScore: "Quiet Tuscany" }),
      ],
      notes: [
        { id: "d4-n1", icon: "waves", title: "Sea", text: "Monterosso adds a true Ligurian Sea beach." },
        { id: "d4-n2", icon: "train", title: "Rail", text: "Exact Florence-Cinque Terre times must be pulled live." },
        { id: "d4-n3", icon: "sparkles", title: "Choice", text: "AI Suggestions preserve Tuscany as a coast-vs-countryside swap." },
      ],
    }),
    day({
      dayNumber: 5,
      title: "Lake Como Water and Villa Light",
      destinationLabel: "Lake Como",
      imageUrl: images.lakes,
      routeFrom: "Florence or Milan rail connection",
      routeTo: "Lake Como, Bellagio or Varenna",
      weatherLabel: "Lake breeze",
      quote: "After the Mediterranean, the journey turns to lake light.",
      description:
        "Move north toward Lake Como and preserve the day as a water-forward Italian lake chapter, with ferry movement, village time and relaxed evening pacing.",
      items: [
        item("d5-train", "transportation", "08:30", "Rail toward Lake Como", "Use live rail routing through Milan or the most efficient date-specific connection.", { imageUrl: images.lakes, badge: "Train" }),
        item("d5-ferry", "transportation", "12:30", "Lake ferry movement", "Use ferry timing dynamically between Como-area villages when schedules support it.", { imageUrl: images.lakes, badge: "Ferry" }),
        item("d5-lunch", "restaurant", "13:00", "Lake-view lunch", "Lunch with relaxed pacing after the rail movement.", { imageUrl: images.lakes, badge: "Lunch" }),
        item("d5-village", "activity", "14:30", "Bellagio or Varenna village walk", "Village lanes, lakefront promenade and villa-garden atmosphere depending on hotel and ferry schedule.", { imageUrl: images.lakes, badge: "Lake Como" }),
        item("d5-hotel", "hotel", "17:30", "Lake hotel check-in", "Check in and keep the evening relaxed after a transfer-heavy day.", { imageUrl: images.lakes, badge: "Hotel" }),
      ],
      suggestions: [
        suggestion("d5-s1", "Private lake boat upgrade", "Water Upgrade", "A premium option if the customer wants more water time and less ferry dependency.", { imageUrl: images.lakes, duration: "60-90 min" }),
      ],
      notes: [
        { id: "d5-n1", icon: "waves", title: "Lake", text: "This is the first major lake experience." },
        { id: "d5-n2", icon: "boat", title: "Ferry", text: "Ferry schedules must be revalidated by date." },
        { id: "d5-n3", icon: "clock", title: "Pacing", text: "Keep the evening soft after the transfer north." },
      ],
    }),
    day({
      dayNumber: 6,
      title: "Lake Lucerne and Swiss Water Calm",
      destinationLabel: "Lucerne",
      imageUrl: images.lakes,
      routeFrom: "Lake Como",
      routeTo: "Lucerne, Lake Lucerne",
      weatherLabel: "Swiss lake / Old town",
      quote: "The water changes language as Italy gives way to Switzerland.",
      description:
        "Continue into Switzerland with Lake Lucerne as the next major water chapter: old town, lakefront, bridge views and a relaxed Swiss evening.",
      items: [
        item("d6-transfer", "transportation", "08:00", "Lake Como to Lucerne rail transfer", "Use live cross-border rail routing. Avoid hard-coding train numbers before dates are known.", { imageUrl: images.lakes, badge: "Train" }),
        item("d6-hotel", "hotel", "13:00", "Lucerne hotel luggage or check-in", "Store luggage or check in depending on arrival and room readiness.", { imageUrl: images.lakes, badge: "Hotel" }),
        item("d6-lunch", "restaurant", "13:15", "Lucerne lunch", "Lunch after cross-border movement.", { imageUrl: images.lakes, badge: "Lunch" }),
        item("d6-lake", "activity", "15:00", "Lake Lucerne waterfront and old town", "Chapel Bridge, lakefront, old-town lanes and mountain-backed water views.", { imageUrl: images.lakes, badge: "Lake Lucerne" }),
        item("d6-dinner", "restaurant", "19:00", "Swiss lake dinner", "Dinner near the lake or old town with a calm evening walk.", { imageUrl: images.lakes, badge: "Dinner" }),
      ],
      suggestions: [
        suggestion("d6-s1", "Lake Lucerne boat cruise", "Water Upgrade", "Adds more lake time if arrival is early and weather is clear.", { imageUrl: images.lakes, duration: "1-2 Hours" }),
      ],
      notes: [
        { id: "d6-n1", icon: "train", title: "Cross-border", text: "Rail route must be selected live." },
        { id: "d6-n2", icon: "waves", title: "Lake", text: "Second major lake experience." },
        { id: "d6-n3", icon: "moon", title: "Evening", text: "Keep the first Swiss night relaxed." },
      ],
    }),
    day({
      dayNumber: 7,
      title: "Lake Brienz, Waterfall Valleys and Alpine Air",
      destinationLabel: "Interlaken and Brienz",
      imageUrl: images.lakes,
      routeFrom: "Lucerne",
      routeTo: "Interlaken, Lake Brienz, waterfall valleys",
      weatherLabel: "Turquoise lake / Waterfalls",
      quote: "The journey shifts from beaches to turquoise lakes and alpine valleys.",
      description:
        "Use Lake Brienz and the Interlaken region as the third major lake experience, with optional waterfall valley routing and mountain-weather flexibility.",
      items: [
        item("d7-train", "transportation", "08:30", "Lucerne to Interlaken scenic rail", "Use live train timing and preserve views as part of the experience.", { imageUrl: images.lakes, badge: "Scenic Train" }),
        item("d7-brienz", "activity", "11:00", "Lake Brienz water experience", "Turquoise-lake viewpoint, boat or shoreline movement depending on weather and schedule.", { imageUrl: images.lakes, badge: "Lake Brienz" }),
        item("d7-lunch", "restaurant", "12:30", "Lake-region lunch", "Lunch before the valley or mountain add-on.", { imageUrl: images.lakes, badge: "Lunch" }),
        item("d7-waterfall", "activity", "14:00", "Waterfall valley option", "Add a waterfall valley route if weather, fitness and travel timing support it.", { imageUrl: images.lakes, badge: "Waterfall Valley" }),
        item("d7-hotel", "hotel", "17:30", "Alpine hotel check-in", "Check in and keep the evening simple.", { imageUrl: images.lakes, badge: "Hotel" }),
      ],
      suggestions: [
        suggestion("d7-s1", "Glacier viewpoint upgrade", "Alpine Upgrade", "A weather-dependent mountain option for travelers who want a higher alpine finale.", { imageUrl: images.lakes, duration: "Half day" }),
      ],
      notes: [
        { id: "d7-n1", icon: "waves", title: "Lake", text: "Third major lake experience." },
        { id: "d7-n2", icon: "cloud", title: "Weather", text: "Mountain and waterfall add-ons must stay flexible." },
        { id: "d7-n3", icon: "sparkles", title: "Marketing", text: "Canals, beaches, lakes, valleys and alpine views are now balanced." },
      ],
    }),
  ];

  return {
    publicHtml: "",
    hero: {
      backgroundImage: images.hero,
      title: "Your Cinematic Ready Plan",
      subtitle:
        "Venice canals, Adriatic beach, Florence, Mediterranean coast, Lake Como, Swiss lakes, alpine valleys and glacier air in one water-balanced summer escape.",
      stats: [
        { label: "Days", value: "7" },
        { label: "Countries", value: "2" },
        { label: "Cities", value: "5+" },
        { label: "Travelers", value: "2" },
        { label: "Travel Style", value: "Beach, Lakes, Relaxation" },
      ],
      primaryCtaText: "Plan Smarter With AI",
      primaryCtaHref: "/ai-planner",
      secondaryCtaText: "View Full Timeline",
    },
    journeyOverview: {
      title: "Journey Overview",
      startPoint: "Venice",
      destinations: "Venice, Lido, Florence, Cinque Terre, Lake Como, Lucerne, Lake Brienz",
      tripStyle: "Beach, Sea, Relaxation, Venice, Summer, Lakes, Alpine",
      travelers: "2 Adults",
      estimatedCost: "Live pricing",
      aiScore: "4.9",
    },
    days,
    footer: {
      backgroundImage: images.hero,
      title: "Your journey, but smarter.",
      subtitle: "Let AI balance beach, lake and mountain days without losing the rhythm.",
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
    location: "Venice, Lido, Florence, Cinque Terre, Lake Como, Lucerne, Lake Brienz",
    days: content.days.length,
    image_url: images.hero,
    created_at: timestamp,
    subtitle:
      "Adriatic beach, Mediterranean coast, Venice canals, Lake Como and Swiss lake country in a lighter summer-ready Gene route.",
    country: "Italy, Switzerland",
    city: "Venice, Florence, Monterosso, Lake Como, Lucerne, Interlaken",
    destination: "Italy and Switzerland",
    style: "Beach, Sea, Relaxation, Venice, Summer, Lakes, Alpine",
    daysCount: content.days.length,
    heroImage: images.hero,
    coverImage: images.hero,
    summary:
      "Venice canals lead to Lido di Venezia's Adriatic beach, Florence, Cinque Terre and Monterosso's Ligurian Sea, then Lake Como, Lake Lucerne, Lake Brienz, waterfall valleys and alpine air.",
    seoTitle: PLAN_TITLE,
    seoDescription:
      "Draft ready plan for Venice Beyond the Canals: Adriatic Beach Escape with Lido, Cinque Terre, Tuscany AI alternatives, Lake Como, Swiss lakes and alpine valleys.",
    tags: ["Beach", "Sea", "Relaxation", "Venice", "Summer", "Cinque Terre", "Lake Como", "Switzerland"],
    season: "Summer",
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
  console.error("INSERT_VENICE_ADRIATIC_BEACH_ESCAPE_FAILED");
  console.error(error);
  process.exit(1);
});
