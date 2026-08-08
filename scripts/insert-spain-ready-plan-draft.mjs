import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import crypto from "node:crypto";

const SOURCE_ENV_PATH = new URL("../.env", import.meta.url);
const SLUG = "spain-gaudi-dreams-and-andalusian-nights";
const PLAN_TITLE = "Spain: Gaudi Dreams & Andalusian Nights";
const baseImage = "/bg/home-hero-bottom-optimized.jpg";

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
    imageUrl: baseImage,
    matchReason,
    matchScore: extra.matchScore || "Highly Recommended",
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
  routeFrom,
  routeTo,
  weatherLabel,
  quote,
  description,
  items,
  notes,
  suggestions,
  estimatedCost,
}) {
  return {
    id: `day-${dayNumber}`,
    dayNumber,
    title,
    destinationLabel,
    countryLabel: "Spain",
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
      title: "Barcelona - The City Behind the Stone",
      destinationLabel: "Barcelona",
      routeFrom: "Barcelona El Prat BCN",
      routeTo: "Praktik Bakery, Passeig de Gracia, Gothic Quarter, El Born, Port Vell",
      weatherLabel: "Easy arrival / Gothic evening",
      quote: "Barcelona begins behind the stone, in medieval lanes and quiet squares.",
      description:
        "Arrive into BCN in the protected morning window, leave luggage at Praktik Bakery, rest properly, then sample Casa Mila and Casa Batllo exteriors before Gene's Secret Medieval Maze through the Gothic Quarter, El Call, El Born and Port Vell.",
      estimatedCost: "Live pricing",
      items: [
        item("d1-flight", "flight", "10:00", "Barcelona BCN arrival window", "Prioritize flights landing 08:00-11:30, acceptable before 13:30. No major prepaid tour should be placed on arrival day.", { badge: "Flight Rule" }),
        item("d1-transfer", "transportation", "11:10", "BCN to central Barcelona transfer", "Aerobus/taxi into central Barcelona. Aerobus reference journey is approximately 30-35 minutes depending on period.", { badge: "Airport Transfer" }),
        item("d1-hotel", "hotel", "12:00", "Praktik Bakery luggage and lunch", "Two-night Barcelona stay with character and central positioning near Passeig de Gracia. Store luggage if the room is not ready.", { badge: "Hotel" }),
        item("d1-rest", "hotel", "13:00", "Hotel or lounge recovery", "Protect the traveler from immediate sightseeing after arrival.", { badge: "Recovery" }),
        item("d1-gaudi", "activity", "14:30", "Passeig de Gracia Gaudi exteriors", "Casa Mila exterior, Casa Batllo exterior and Passeig de Gracia atmosphere, saving the long Gaudi experience for Day 2.", { badge: "Gaudi Preview" }),
        item("d1-maze", "activity", "16:00", "Barcelona's Secret Medieval Maze", "Barcelona Cathedral surroundings, Gothic Quarter lanes, Placa Sant Felip Neri, El Call, Roman wall fragments, Placa Reial and El Born.", { badge: "Gene Signature", duration: "2.5 Hours" }),
        item("d1-dinner", "restaurant", "19:15", "El Born dinner and Port Vell walk", "Dinner after the medieval route, then waterfront walk before taxi or metro back to the hotel.", { badge: "Dinner" }),
      ],
      suggestions: [
        suggestion("d1-s1", "Placa Sant Felip Neri pause", "Hidden Barcelona", "A compact atmospheric stop that makes arrival day feel Gene-exclusive.", { duration: "25 min" }),
      ],
      notes: [
        { id: "d1-n1", icon: "plane", title: "Arrival", text: "Avoid building major prepaid tours on arrival day." },
        { id: "d1-n2", icon: "clock", title: "Recovery", text: "Keep luggage, lunch and rest before sightseeing." },
        { id: "d1-n3", icon: "shoe", title: "Walking", text: "Expected walking is roughly 6-8 km." },
      ],
    }),
    day({
      dayNumber: 2,
      title: "Gaudi's Barcelona - Nature Turned Into Stone",
      destinationLabel: "Barcelona",
      routeFrom: "Praktik Bakery",
      routeTo: "Park Guell, Sagrada Familia, Sant Pau, Carmel, Gracia",
      weatherLabel: "Modernista morning / City overlook",
      quote: "Gaudi turns nature into stone, then Barcelona opens from above.",
      description:
        "Use a morning guided Park Guell and Sagrada Familia product, keep lunch and Sant Pau exterior gentle, protect a mandatory recovery window, then finish with Carmel/Bunkers viewpoint and Gracia dinner.",
      estimatedCost: "Live pricing",
      items: [
        item("d2-breakfast", "restaurant", "07:20", "Breakfast", "Breakfast before the major Gaudi attraction day.", { badge: "Breakfast" }),
        item("d2-transfer", "transportation", "08:00", "Travel toward Park Guell", "Allow extra time beyond perfect-case navigation for check-in and city movement.", { badge: "Transfer" }),
        item("d2-gaudi-tour", "activity", "09:00", "Park Guell + Sagrada Familia guided tour", "Klook or Viator provider-backed guided access with transport between Gaudi monuments. Prefer a 09:00 departure to protect the afternoon.", { badge: "Klook / Viator", duration: "3-5.5 Hours" }),
        item("d2-lunch", "restaurant", "12:30", "Lunch near Eixample or Sant Pau", "Lunch after the Gaudi tour without adding another immediate ticketed attraction.", { badge: "Lunch" }),
        item("d2-sant-pau", "activity", "14:15", "Hospital de Sant Pau exterior", "A spectacular Modernista exterior/courtyard surroundings stop without forcing another paid visit.", { badge: "Modernista" }),
        item("d2-recovery", "hotel", "15:15", "Mandatory Gene recovery window", "Hotel, shower, nap or coffee. Gene deliberately protects energy here.", { badge: "Recovery" }),
        item("d2-carmel", "activity", "17:30", "Barcelona Above the City", "Carmel hillside or Bunkers viewpoint depending on date access and weather. Flexible, not guaranteed ticketed.", { badge: "Hidden View" }),
        item("d2-gracia", "restaurant", "19:30", "Gracia evening", "Placa del Sol, Placa de la Vila de Gracia, neighborhood streets and dinner away from Las Ramblas.", { badge: "Dinner" }),
      ],
      suggestions: [
        suggestion("d2-s1", "Gracia neighborhood tapas trail", "Local Evening", "A softer local dinner option after the major Gaudi morning.", { duration: "90 min" }),
      ],
      notes: [
        { id: "d2-n1", icon: "ticket", title: "Provider", text: "Recheck exact Gaudi tour departure and availability." },
        { id: "d2-n2", icon: "sun", title: "Viewpoint", text: "Carmel must remain weather and access dependent." },
        { id: "d2-n3", icon: "shoe", title: "Walking", text: "Expected walking is roughly 8-11 km." },
      ],
    }),
    day({
      dayNumber: 3,
      title: "Barcelona to Granada - From Modernism to Moorish Spain",
      destinationLabel: "Granada",
      routeFrom: "Barcelona BCN",
      routeTo: "Granada GRX, Hotel Casa 1800 Granada, Albaicin, Sacromonte",
      weatherLabel: "Moorish hills / Sunset view",
      quote: "Fly south, then let Granada rise in cobbles, caves and Alhambra light.",
      description:
        "Use a morning BCN to GRX flight to avoid wasting the seven-day product on a long rail day, transfer to Hotel Casa 1800 Granada, recover, then walk Albaicin and Sacromonte toward an Alhambra sunset view.",
      estimatedCost: "Live pricing",
      items: [
        item("d3-checkout", "hotel", "07:20", "Barcelona checkout", "Check out and transfer to BCN with 30-40 minutes operating allowance from central Barcelona.", { badge: "Checkout" }),
        item("d3-flight", "flight", "10:00", "Barcelona BCN to Granada GRX", "Gene should search for a morning flight around 10:00-11:35. Current route reference is roughly 1 hour 35 minutes.", { badge: "Internal Flight" }),
        item("d3-transfer", "transportation", "12:00", "GRX to Granada center", "Airport is around 17 km from Granada center. Use 25-35 minutes by taxi or about 45 minutes for the complete airport bus route.", { badge: "Airport Transfer" }),
        item("d3-hotel", "hotel", "12:45", "Hotel Casa 1800 Granada luggage", "Two-night Granada stay around Plaza Nueva / Albaicin. Check-in starts at 15:00.", { badge: "Hotel" }),
        item("d3-lunch", "restaurant", "13:00", "Granada lunch", "Lunch and rest before the hill walking experience.", { badge: "Lunch" }),
        item("d3-walk", "activity", "17:00", "Albaicin to Sacromonte to Alhambra Sunset", "Provider-backed or self-guided route through old Muslim-quarter streets, hidden cisterns, viewpoints and Mirador de San Nicolas.", { badge: "Klook Option", duration: "2-2.5 Hours" }),
        item("d3-dinner", "restaurant", "20:00", "Granada dinner", "Dinner after walking downhill or transferring back from Albaicin/Sacromonte.", { badge: "Dinner" }),
      ],
      suggestions: [
        suggestion("d3-s1", "Cave flamenco cultural upgrade", "Cultural Performance", "Can replace the normal evening program for travelers choosing a deeper Granada night.", { duration: "3.5-4 Hours" }),
      ],
      notes: [
        { id: "d3-n1", icon: "plane", title: "Flight", text: "Do not hard-code a fake airline or fare." },
        { id: "d3-n2", icon: "shoe", title: "Difficulty", text: "Albaicin/Sacromonte has steep lanes, cobbles and stairs." },
        { id: "d3-n3", icon: "sun", title: "Sunset", text: "Target Mirador de San Nicolas near 18:30-19:00 seasonally." },
      ],
    }),
    day({
      dayNumber: 4,
      title: "Granada - Inside the Red Palace",
      destinationLabel: "Granada",
      routeFrom: "Hotel Casa 1800 Granada",
      routeTo: "Alhambra, Carrera del Darro, El Banuelo, Paseo de los Tristes",
      weatherLabel: "Palace morning / Historic lanes",
      quote: "The Red Palace deserves a full day, not a squeezed slot.",
      description:
        "Dedicate the morning to Alhambra, Nasrid Palaces and Generalife with strict ID/ticket matching, then recover before hidden Granada: Carrera del Darro, El Banuelo area and Paseo de los Tristes.",
      estimatedCost: "Live pricing",
      items: [
        item("d4-breakfast", "restaurant", "07:20", "Breakfast", "Breakfast before the Alhambra block.", { badge: "Breakfast" }),
        item("d4-transfer", "transportation", "08:00", "Travel to Alhambra meeting point", "Calculate exact hotel-to-meeting distance after the specific tour is booked.", { badge: "Transfer" }),
        item("d4-alhambra", "activity", "09:00", "Alhambra + Nasrid Palaces + Generalife", "Core Granada experience covering Nasrid Palaces, Alcazaba, Generalife, Palace of Charles V surroundings and gardens.", { badge: "Klook / Viator", duration: "3-5 Hours" }),
        item("d4-lunch", "restaurant", "13:00", "Granada lunch", "Lunch after the substantial Alhambra visit.", { badge: "Lunch" }),
        item("d4-recovery", "hotel", "14:15", "Hotel recovery", "No second major museum after several hours inside the Alhambra.", { badge: "Recovery" }),
        item("d4-darro", "activity", "16:10", "Carrera del Darro slow walk", "One of Granada's most atmospheric streets, followed by El Banuelo area and Paseo de los Tristes.", { badge: "Hidden Granada" }),
        item("d4-dinner", "restaurant", "20:00", "Dinner and tapas", "Flexible dinner/tapas after the historic Granada walk.", { badge: "Dinner" }),
      ],
      suggestions: [
        suggestion("d4-s1", "Paseo de los Tristes coffee with Alhambra views", "Slow Travel", "A quiet pause after the palace day with the Alhambra still in view.", { duration: "45 min" }),
      ],
      notes: [
        { id: "d4-n1", icon: "id", title: "ID required", text: "Passport/ID details must match Alhambra tickets." },
        { id: "d4-n2", icon: "clock", title: "Recovery", text: "Protect 14:15-16:00 after the Alhambra." },
        { id: "d4-n3", icon: "shoe", title: "Walking", text: "Expected 7-10 km with uneven terrain." },
      ],
    }),
    day({
      dayNumber: 5,
      title: "Granada to Seville - From the Alhambra to the Royal South",
      destinationLabel: "Seville",
      routeFrom: "Granada railway station",
      routeTo: "Sevilla Santa Justa, Hotel Casa 1800 Sevilla, Alcazar, Cathedral, Giralda",
      weatherLabel: "Royal Andalucia",
      quote: "Travel becomes a bridge from Moorish Granada to royal Seville.",
      description:
        "Use an early Granada-Seville train window, leave luggage at Hotel Casa 1800 Sevilla, lunch and rest, then take a guided Alcazar, Cathedral and Giralda experience before an evening Barrio Santa Cruz hidden route.",
      estimatedCost: "Live pricing",
      items: [
        item("d5-checkout", "hotel", "07:00", "Granada checkout", "Taxi to Granada railway station from Plaza Nueva zone, roughly 2 km with 15-20 minutes allowance.", { badge: "Checkout" }),
        item("d5-train", "transportation", "07:30", "Granada to Seville train", "Search early direct/fast service. Route is roughly 211 km rail with about 2-3 hours depending on service.", { badge: "Train" }),
        item("d5-hotel", "hotel", "11:00", "Hotel Casa 1800 Sevilla luggage", "Two-night Seville stay at Rodrigo Caro 6, Old Town, beside the historic monuments.", { badge: "Hotel" }),
        item("d5-lunch", "restaurant", "11:15", "Early Seville lunch", "Lunch and cafe rest before the monuments tour.", { badge: "Lunch" }),
        item("d5-royal", "activity", "13:30", "Alcazar, Cathedral and Giralda guided tour", "Viator/Klook priority-ticket tour, often around 2.5-3.5 hours depending on product.", { badge: "Viator / Klook", duration: "3.5 Hours" }),
        item("d5-rest", "hotel", "17:15", "Hotel rest", "Hotel location makes a real rest easy after the tour.", { badge: "Recovery" }),
        item("d5-santacruz", "activity", "18:45", "Barrio Santa Cruz Hidden Route", "Callejon del Agua, tiny plazas, orange-tree lanes and Murillo Gardens at a slow pace.", { badge: "Hidden Seville" }),
        item("d5-dinner", "restaurant", "20:00", "Dinner and cathedral night walk", "Dinner followed by a short night walk around the cathedral.", { badge: "Dinner" }),
      ],
      suggestions: [
        suggestion("d5-s1", "Orange-tree lanes photo route", "Hidden Seville", "A softer Seville add-on after the monument tour crowds fade.", { duration: "45 min" }),
      ],
      notes: [
        { id: "d5-n1", icon: "train", title: "Rail", text: "Use a protected travel block until the selected train is confirmed." },
        { id: "d5-n2", icon: "ticket", title: "Tour", text: "Provider duration ranges 2.5-3.5 hours." },
        { id: "d5-n3", icon: "shoe", title: "Walking", text: "Santa Cruz route is roughly 2 km at slow pace." },
      ],
    }),
    day({
      dayNumber: 6,
      title: "Ronda + White Villages - Where Andalucia Falls Into the Sky",
      destinationLabel: "Ronda and White Villages",
      routeFrom: "Seville",
      routeTo: "Zahara de la Sierra, Grazalema, Ronda, Seville",
      weatherLabel: "Mountain villages / Full-day excursion",
      quote: "The strongest hidden-gem day lifts Andalucia out of the cities.",
      description:
        "Use a provider-backed Ronda and White Villages day tour from Seville, routing through Zahara de la Sierra, Sierra de Grazalema and Ronda, with enough time for Puente Nuevo and lower gorge viewpoints if possible.",
      estimatedCost: "Live pricing",
      items: [
        item("d6-pickup", "transportation", "07:30", "Hotel departure and tour pickup", "Walk or taxi to the meeting point for an approximately 08:00 departure.", { badge: "Tour Pickup" }),
        item("d6-zahara-drive", "transportation", "08:00", "Seville to Zahara de la Sierra", "Road is roughly 100 km. Operating allowance is 1 hour 30 to 1 hour 45.", { badge: "Road" }),
        item("d6-zahara", "activity", "09:45", "Zahara de la Sierra", "White village streets, reservoir views and hilltop setting.", { badge: "White Village" }),
        item("d6-grazalema", "activity", "11:15", "Grazalema village stop", "Short exploration after mountain-road travel through Sierra de Grazalema.", { badge: "Grazalema" }),
        item("d6-lunch", "restaurant", "12:00", "Lunch or scenic transfer lunch", "Lunch timing depends on the chosen tour configuration.", { badge: "Lunch" }),
        item("d6-ronda", "activity", "13:30", "Ronda and Puente Nuevo", "Puente Nuevo, El Tajo gorge, old town, historic lanes and Alameda viewpoints, with at least 30-40 minutes for bridge viewpoints.", { badge: "Ronda", duration: "2.5 Hours" }),
        item("d6-return", "transportation", "16:00", "Ronda to Seville return", "Roughly 130 km, typically 1 hour 45 to 2 hours depending on traffic.", { badge: "Return" }),
        item("d6-dinner", "restaurant", "20:00", "Final Andalusian dinner", "Keep the night easy. No second paid tour after the full-day excursion.", { badge: "Dinner" }),
      ],
      suggestions: [
        suggestion("d6-s1", "Lower gorge viewpoint in Ronda", "Adventure View", "A Gene-style hidden addition if the tour timing allows.", { duration: "30 min" }),
      ],
      notes: [
        { id: "d6-n1", icon: "car", title: "Full day", text: "Treat this as a 10-hour excursion." },
        { id: "d6-n2", icon: "camera", title: "Ronda", text: "Do not give only 10 minutes at Puente Nuevo." },
        { id: "d6-n3", icon: "moon", title: "Evening", text: "No second major attraction tonight." },
      ],
    }),
    day({
      dayNumber: 7,
      title: "Seville - Tiles, Water & the Other Side of the River",
      destinationLabel: "Seville",
      routeFrom: "Hotel Casa 1800 Sevilla",
      routeTo: "Plaza de Espana, Maria Luisa Park, Triana, SVQ",
      weatherLabel: "Easy departure / Triana finale",
      quote: "The other side of Seville closes the story by the river.",
      description:
        "Keep departure day light: Plaza de Espana, Maria Luisa Park, Triana lanes and riverfront, then collect luggage and transfer to Seville Airport with a departure ideally at 15:30 or later.",
      estimatedCost: "Live pricing",
      items: [
        item("d7-checkout", "hotel", "08:30", "Check out and store luggage", "Cleaner operational version: check out before the morning walk, store luggage, then collect around 12:15.", { badge: "Checkout" }),
        item("d7-plaza", "activity", "09:00", "Plaza de Espana", "Photography and architecture at Plaza de Espana, reached by walk or taxi depending on pace.", { badge: "Seville Icon" }),
        item("d7-park", "activity", "09:45", "Maria Luisa Park", "Quiet final morning walk through the park.", { badge: "Park" }),
        item("d7-triana", "activity", "10:30", "Triana lanes and ceramic culture", "Triana lanes, ceramic culture, riverfront and Mercado surroundings.", { badge: "Gene Signature" }),
        item("d7-river", "activity", "11:50", "Guadalquivir river walk", "Cross Puente de Isabel II and take a short river walk before returning for luggage.", { badge: "River Walk" }),
        item("d7-airport", "transportation", "12:30", "Hotel to Seville Airport SVQ", "Road distance roughly 10-12 km. Allow 25-35 minutes plus airport buffer.", { badge: "Airport Transfer" }),
        item("d7-flight", "flight", "15:30+", "Seville SVQ to home airport", "Recommended departure after 15:30, giving roughly 2.5 hours airport buffer for international departures.", { badge: "Departure Flight" }),
      ],
      suggestions: [
        suggestion("d7-s1", "Triana ceramic workshop stop", "Local Craft", "A gentle final hidden-neighborhood detail if flight timing allows.", { duration: "30 min" }),
      ],
      notes: [
        { id: "d7-n1", icon: "plane", title: "Departure", text: "Prefer outbound SVQ flight at 15:30 or later." },
        { id: "d7-n2", icon: "bag", title: "Luggage", text: "Check out first and store bags for the cleanest timing." },
        { id: "d7-n3", icon: "shoe", title: "Walking", text: "Expected walking is roughly 4-6 km." },
      ],
    }),
  ];

  return {
    publicHtml: "",
    hero: {
      backgroundImage: baseImage,
      title: "Your Cinematic Ready Plan",
      subtitle:
        "Enter Barcelona through Gaudi's imagination, disappear into medieval lanes, fly south to Granada's Moorish hills, cross Andalucia to royal Seville and finish among white villages above dramatic gorges.",
      stats: [
        { label: "Days", value: "7" },
        { label: "Countries", value: "1" },
        { label: "Cities", value: "3" },
        { label: "Travelers", value: "2" },
        { label: "Travel Style", value: "Cultural Adventure" },
      ],
      primaryCtaText: "Plan Smarter With AI",
      primaryCtaHref: "/ai-planner",
      secondaryCtaText: "View Full Timeline",
    },
    journeyOverview: {
      title: "Journey Overview",
      startPoint: "Barcelona El Prat BCN",
      destinations: "Barcelona, Granada, Seville, Ronda, White Villages",
      tripStyle: "Gaudi icons, hidden medieval lanes, Moorish palaces, royal Andalucia, white villages",
      travelers: "2 Adults",
      estimatedCost: "Live pricing",
      aiScore: "4.9",
    },
    days,
    footer: {
      backgroundImage: baseImage,
      title: "Your journey, but smarter.",
      subtitle: "Let AI handle the details while you focus on the memories.",
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
    location: "Barcelona, Granada, Seville, Ronda",
    days: content.days.length,
    image_url: baseImage,
    created_at: timestamp,
    subtitle:
      "7 days from Barcelona's impossible architecture to Andalucia's white villages.",
    country: "Spain",
    city: "Barcelona, Granada, Seville",
    destination: "Spain",
    style: "Cultural Adventure, Architecture, Moorish Spain, White Villages",
    daysCount: content.days.length,
    heroImage: baseImage,
    coverImage: baseImage,
    summary:
      "Enter Barcelona through Gaudi's imagination, disappear into its medieval lanes, fly south to Granada's Moorish hills, wake beneath the Alhambra, cross Andalucia to royal Seville and finish among white mountain villages hanging above dramatic gorges.",
    seoTitle: PLAN_TITLE,
    seoDescription:
      "Draft ready plan for Spain: Gaudi Dreams and Andalusian Nights with Barcelona, Granada, Seville, Ronda, hotels, transfers, provider-backed tours and operational timing.",
    tags: ["Spain", "Barcelona", "Granada", "Seville", "Ronda", "Andalucia", "Gaudi", "Alhambra"],
    season: "Spring, early summer, autumn",
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
  console.error("INSERT_SPAIN_READY_PLAN_FAILED");
  console.error(error);
  process.exit(1);
});
