import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import crypto from "node:crypto";

const SOURCE_ENV_PATH = new URL("../.env", import.meta.url);
const SLUG = "singapore-skyline-glow-sentosa-shores-southern-islands";
const PLAN_TITLE = "Singapore: Skyline Glow, Sentosa Shores & Southern Islands";

const commons = (fileName, width = 1280) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}?width=${width}`;

const images = {
  hero: commons("Gardens by the Bay Marina Bay Sands.jpg", 1440),
  marina: commons("Panorama of Marina Bay, Singapore - 20181026.jpg", 1440),
  hotelMarina: commons("Marina Bays Sands Hotel from the bridge connecting to the Gardens By The Bay in Singapore.jpg", 1280),
  gardens: commons("Gardens by the Bay, Singapore (54150067279).jpg", 1280),
  skypark: commons("1 marina bay sands skypark night view CBD skyline.jpg", 1280),
  chinatown: commons("Buddha Tooth Relic Temple and Museum in Chinatown, Singapore, 2023.jpg", 1280),
  littleIndia: commons("Sri Veeramakaliamman Temple, Singapore - 20100418.jpg", 1280),
  nightSafari: commons("Singapore Night Safari (7448742056).jpg", 1280),
  sentosa: commons("Palawan Beach Sentosa Singapore (36712573736).jpg", 1280),
  cableCar: commons("Sentosa Singapore Cable cars.jpg", 1280),
  universal: commons("Universal Studios Singapore Gate.jpg", 900),
  lazarus: commons("Lazarus Island Beach.jpg", 1280),
  airport: commons("Jewel Changi Airport and Rain Vortex 2019.jpg", 1280),
  food: commons("Chicken rice at Maxwell Food Centre, Singapore - 20140622.jpg", 1280),
};

const isBookable = new Set(["hotel", "activity", "transportation", "event"]);

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
    showButton: isBookable.has(type),
    status: extra.status || (isBookable.has(type) ? "Affiliate pending" : "Draft"),
    badge: extra.badge || type,
    price: extra.price || (isBookable.has(type) ? "Live price" : ""),
    people: extra.people || "2 People",
    deeplink: "",
    provider: extra.provider || "",
    affiliatePriority: extra.affiliatePriority || "",
    notes: extra.notes || "",
    ...extra,
  };
}

function suggestion(id, title, category, matchReason, imageUrl = images.hero, extra = {}) {
  return {
    id,
    title,
    category,
    imageUrl,
    matchReason,
    matchScore: extra.matchScore || "Strong Route Fit",
    price: extra.price || "Live price",
    duration: extra.duration || "Flexible",
    ctaText: "Book Now",
    affiliateStatus: "Pending",
  };
}

function day(data) {
  const items = data.items;
  return {
    id: `day-${data.dayNumber}`,
    dayNumber: data.dayNumber,
    title: data.title,
    destinationLabel: data.destinationLabel,
    countryLabel: "Singapore",
    previewImage: data.imageUrl,
    heroImage: data.imageUrl,
    dateLabel: `Day ${data.dayNumber}`,
    routeFrom: data.routeFrom,
    routeTo: data.routeTo,
    weatherLabel: data.weatherLabel,
    quote: data.quote,
    description: data.description,
    timelineItems: items,
    suggestions: data.suggestions,
    story: {
      imageUrl: data.imageUrl,
      quote: data.quote,
      musicLabel: "Cinematic Story",
      musicUrl: "",
    },
    summary: {
      activitiesCount: String(items.filter((entry) => ["activity", "event"].includes(entry.type)).length),
      restaurantsCount: String(items.filter((entry) => entry.type === "restaurant").length),
      transfersCount: String(items.filter((entry) => ["transportation", "flight"].includes(entry.type)).length),
      estimatedCost: "Live pricing",
      upgrades: [],
      viewDetailsText: "View Details",
      editPlanText: "Edit Plan",
    },
    notes: data.notes,
  };
}

function buildContent() {
  const days = [
    day({
      dayNumber: 1,
      title: "Arrival - Marina Bay First Glow",
      destinationLabel: "Marina Bay",
      imageUrl: images.marina,
      routeFrom: "Singapore Changi Airport",
      routeTo: "Marina Bay Sands and Marina Bay waterfront",
      weatherLabel: "Arrival / Low fatigue",
      quote: "The first night is skyline light, harbour air and a soft landing into Singapore.",
      description:
        "A deliberately light arrival day: Changi Airport buffer, transfer to Marina Bay Sands, rest, then a gentle Marina Bay waterfront walk with dinner kept flexible around flight fatigue.",
      items: [
        item("d1-arrival", "flight", "14:00", "Arrival at Singapore Changi Airport", "Land at Changi Airport and allow time for immigration, baggage and airport orientation. The plan is not tied to a specific flight.", { imageUrl: images.airport, badge: "Arrival", showButton: false }),
        item("d1-buffer", "transportation", "14:00-15:30", "Immigration and Airport Buffer", "A 90-minute planning allowance for arrival formalities before leaving the terminal.", { imageUrl: images.airport, badge: "Airport" }),
        item("d1-transfer", "transportation", "15:30-16:15", "Airport to Marina Bay Hotel", "Use live maps or transfer data when the traveler activates the plan; reserve 30 to 45 minutes plus traffic buffer.", { imageUrl: images.marina, badge: "Transfer" }),
        item("d1-hotel", "hotel", "16:15", "Marina Bay Sands Check-In", "Premium Marina Bay base close to Gardens by the Bay, ArtScience Museum and the waterfront.", { imageUrl: images.hotelMarina, badge: "Hotel", provider: "Hotel provider", affiliatePriority: "Maximum" }),
        item("d1-rest", "rest", "16:15-17:45", "Arrival Recovery", "Check in, shower and relax before the first Singapore evening.", { imageUrl: images.hotelMarina, badge: "Rest", showButton: false, price: "" }),
        item("d1-walk", "activity", "18:00-19:00", "Marina Bay Waterfront Walk", "A light walk around the waterfront, Helix Bridge exterior and Merlion-area views if the route remains practical.", { imageUrl: images.marina, badge: "Walking" }),
        item("d1-dinner", "restaurant", "19:00-20:00", "Flexible Marina Bay Dinner", "Gene AI can recommend a real restaurant dynamically later based on mood, budget and availability.", { imageUrl: images.food, badge: "Dinner", showButton: false, price: "" }),
        item("d1-evening", "activity", "20:00-21:00", "Marina Bay Evening", "Free evening around the bay. Do not hard-code show timing unless checked live for the selected date.", { imageUrl: images.marina, badge: "Night Walk" }),
      ],
      suggestions: [
        suggestion("d1-s1", "Private Airport Transfer", "Comfort Upgrade", "Helpful for families, late arrivals or travelers carrying luggage.", images.marina),
        suggestion("d1-s2", "ArtScience Museum Preview", "Light Culture Add-On", "Only add if arrival is early and energy is good.", images.gardens),
      ],
      notes: [
        { icon: "plane", text: "Arrival day intentionally stays light." },
        { icon: "clock", text: "Do not guarantee light-show timing without live verification." },
        { icon: "food", text: "Dinner should remain flexible around flight fatigue." },
      ],
    }),
    day({
      dayNumber: 2,
      title: "Gardens, Skyline & Future Singapore",
      destinationLabel: "Marina Bay",
      imageUrl: images.gardens,
      routeFrom: "Marina Bay hotel",
      routeTo: "Gardens by the Bay and Marina Bay Sands SkyPark",
      weatherLabel: "City icons / Moderate fatigue",
      quote: "Glass domes, glowing Supertrees and skyline height make Singapore feel almost cinematic.",
      description:
        "A high-commercial-value day built around Gardens by the Bay and Marina Bay Sands SkyPark. Packages, conservatory inclusions and time slots must come from live provider data.",
      items: [
        item("d2-breakfast", "restaurant", "07:30-08:30", "Breakfast", "Start early before the main attraction window.", { imageUrl: images.food, badge: "Breakfast", showButton: false, price: "" }),
        item("d2-transfer", "transportation", "09:00-09:15", "Hotel to Gardens by the Bay", "Short transfer or walk depending on the selected Marina Bay hotel and weather.", { imageUrl: images.gardens, badge: "Transfer" }),
        item("d2-gardens", "activity", "09:15-12:30", "Gardens by the Bay Ticket", "Book the current Klook or provider package. Include Cloud Forest and Flower Dome only when the live package confirms those inclusions.", { imageUrl: images.gardens, badge: "Attraction", provider: "Klook preferred", affiliatePriority: "Very High" }),
        item("d2-lunch", "restaurant", "12:30-13:30", "Lunch Near Marina Bay", "Lunch around Marina Bay or Gardens by the Bay.", { imageUrl: images.food, badge: "Lunch", showButton: false, price: "" }),
        item("d2-guided-alt", "activity", "14:30-17:00", "Optional Gardens by the Bay Guided Tour", "Represent as an alternative to the normal ticket, never as a duplicate booking. Use the current 2.5-hour guided tour only if selected.", { imageUrl: images.gardens, badge: "Alternative", provider: "Klook preferred", affiliatePriority: "High" }),
        item("d2-rest", "rest", "17:00-18:00", "Hotel Rest", "Protect recovery before the evening skyline.", { imageUrl: images.hotelMarina, badge: "Rest", showButton: false, price: "" }),
        item("d2-skypark", "activity", "18:15-19:15", "Marina Bay Sands SkyPark Observation Deck", "Use live time-slot availability and current ticket/package data.", { imageUrl: images.skypark, badge: "Skyline", provider: "Klook preferred", affiliatePriority: "Very High" }),
        item("d2-photo", "activity", "20:30-21:30", "Night Photography Around Marina Bay", "Gardens or Marina Bay night photography depending on what is operating on the selected date.", { imageUrl: images.marina, badge: "Photography" }),
      ],
      suggestions: [
        suggestion("d2-s1", "ArtScience Museum Ticket", "Art & Future", "Best placed in the afternoon only if Gardens timing leaves enough space.", images.gardens),
        suggestion("d2-s2", "Marina Bay Private Photo Walk", "Photography Upgrade", "Good for couples and travelers who want cinematic city images.", images.marina),
      ],
      notes: [
        { icon: "ticket", text: "Do not assume Gardens package inclusions." },
        { icon: "camera", text: "SkyPark and Gardens are hero visual cards." },
        { icon: "clock", text: "Use selected-date time slots for paid entries." },
      ],
    }),
    day({
      dayNumber: 3,
      title: "Heritage Singapore & Night Wildlife",
      destinationLabel: "Chinatown, Little India, Mandai",
      imageUrl: images.nightSafari,
      routeFrom: "Marina Bay",
      routeTo: "Chinatown, Little India, Night Safari",
      weatherLabel: "Culture + night wildlife / Moderate fatigue",
      quote: "Old streets carry the day, then Mandai opens into the wild after dark.",
      description:
        "A later-start culture day with mandatory afternoon rest before Night Safari. Wildlife is observational and never guaranteed.",
      items: [
        item("d3-breakfast", "restaurant", "08:30-09:30", "Breakfast", "Start later because the evening runs late.", { imageUrl: images.food, badge: "Breakfast", showButton: false, price: "" }),
        item("d3-chinatown", "activity", "10:00-11:30", "Chinatown Heritage Walk", "Historic streets, market atmosphere and temple visits where appropriate without inventing entry requirements.", { imageUrl: images.chinatown, badge: "Culture" }),
        item("d3-little-india", "activity", "11:45-13:00", "Little India", "Colorful streets, cultural landmarks and local market energy.", { imageUrl: images.littleIndia, badge: "Culture" }),
        item("d3-lunch", "restaurant", "13:00-14:00", "Heritage District Lunch", "Flexible lunch in Chinatown, Little India or nearby.", { imageUrl: images.food, badge: "Lunch", showButton: false, price: "" }),
        item("d3-rest", "rest", "14:15-16:00", "Mandatory Hotel Rest", "Recovery block before the late wildlife experience.", { imageUrl: images.hotelMarina, badge: "Rest", showButton: false, price: "" }),
        item("d3-night-safari", "activity", "17:00-22:00", "Night Safari Guided Tour with Hotel Pickup and Drop-off", "Use the current GetYourGuide product details, live pickup time and duration. Includes tram and walking-trail style experience where confirmed by provider.", { imageUrl: images.nightSafari, badge: "Wildlife", provider: "GetYourGuide preferred", affiliatePriority: "Maximum" }),
      ],
      suggestions: [
        suggestion("d3-s1", "Food Lover Heritage Tour", "Food Add-On", "A current food tour can replace part of the heritage block if the traveler prioritizes cuisine.", images.food),
        suggestion("d3-s2", "River Wonders + Night Safari Combo", "Wildlife Upgrade", "Only show when verified current products support the schedule.", images.nightSafari),
      ],
      notes: [
        { icon: "moon", text: "No second night activity after Night Safari." },
        { icon: "paw", text: "Do not guarantee animal sightings." },
        { icon: "bed", text: "Afternoon rest is mandatory." },
      ],
    }),
    day({
      dayNumber: 4,
      title: "Marina Bay to Sentosa",
      destinationLabel: "Sentosa Island",
      imageUrl: images.sentosa,
      routeFrom: "Marina Bay Sands",
      routeTo: "Capella Singapore, Palawan or Siloso Beach",
      weatherLabel: "Island transfer / Low fatigue",
      quote: "The city softens into resort greenery, beach air and Sentosa's evening glow.",
      description:
        "Hotel transition day from Marina Bay to Sentosa with luggage buffer, Capella check-in, rest, a selected Sentosa coast block and optional Wings of Time only if live availability supports it.",
      items: [
        item("d4-breakfast", "restaurant", "08:00-09:00", "Breakfast", "Slow breakfast before checkout.", { imageUrl: images.food, badge: "Breakfast", showButton: false, price: "" }),
        item("d4-pack", "rest", "09:00-10:30", "Packing and Final Marina Bay Time", "Keep the morning easy before checkout.", { imageUrl: images.hotelMarina, badge: "Free Time", showButton: false, price: "" }),
        item("d4-checkout", "hotel", "11:00", "Marina Bay Sands Checkout", "Official checkout seed is 11:00; validate current hotel policy at booking time.", { imageUrl: images.hotelMarina, badge: "Hotel" }),
        item("d4-transfer", "transportation", "11:00-12:00", "Marina Bay to Sentosa", "Allow luggage and traffic buffer for the resort transfer.", { imageUrl: images.sentosa, badge: "Transfer" }),
        item("d4-lunch", "restaurant", "12:00-13:00", "Sentosa Lunch", "Flexible lunch before check-in.", { imageUrl: images.food, badge: "Lunch", showButton: false, price: "" }),
        item("d4-capella", "hotel", "15:00", "Capella Singapore Check-In", "Luxury Sentosa resort base with greenery, island atmosphere and premium affiliate potential.", { imageUrl: images.sentosa, badge: "Hotel", provider: "Hotel provider", affiliatePriority: "Maximum" }),
        item("d4-beach", "activity", "17:00-19:00", "Sentosa Coast: Palawan or Siloso Beach", "Select one beach based on traveler preferences and live access/operating conditions. Do not unnecessarily include both.", { imageUrl: images.sentosa, badge: "Beach" }),
        item("d4-wings", "event", "20:40 approx", "Optional Wings of Time", "Only include if operating and available on the selected date. Query session time from provider data.", { imageUrl: images.sentosa, badge: "Optional Show", provider: "Klook preferred", affiliatePriority: "High" }),
      ],
      suggestions: [
        suggestion("d4-s1", "4/5-Star Sentosa Hotel Alternative", "Value Hotel", "Offer a less expensive Sentosa option through the existing hotel recommendation system.", images.sentosa),
        suggestion("d4-s2", "Beachfront Dinner Upgrade", "Couple Upgrade", "A relaxed dinner can replace the optional show if the traveler wants slower pacing.", images.sentosa),
      ],
      notes: [
        { icon: "hotel", text: "Do not replace Capella unless provider validation fails." },
        { icon: "water", text: "Choose Palawan or Siloso, not both." },
        { icon: "ticket", text: "Wings of Time remains optional." },
      ],
    }),
    day({
      dayNumber: 5,
      title: "Sentosa Adventure Day",
      destinationLabel: "Sentosa Island",
      imageUrl: images.universal,
      routeFrom: "Capella Singapore",
      routeTo: "Singapore Cable Car and Universal Studios Singapore",
      weatherLabel: "Entertainment / High fatigue",
      quote: "Cable cars cross the harbour, then Sentosa turns into a full-day theme-park chapter.",
      description:
        "A major family and entertainment day: Singapore Cable Car SkyPass followed by Universal Studios Singapore. Do not add another paid activity after the full park day.",
      items: [
        item("d5-breakfast", "restaurant", "08:00-09:00", "Breakfast", "Fuel up before a full Sentosa day.", { imageUrl: images.food, badge: "Breakfast", showButton: false, price: "" }),
        item("d5-cable-car", "transportation", "09:30-10:15", "Singapore Cable Car SkyPass", "Use live operation times and current ticket/package data from the provider.", { imageUrl: images.cableCar, badge: "Cable Car", provider: "Klook preferred", affiliatePriority: "High" }),
        item("d5-universal", "activity", "10:30-17:00", "Universal Studios Singapore Ticket", "Book current package from provider data. Do not hard-code park opening or closing time; reserve meal and rest time inside the park.", { imageUrl: images.universal, badge: "Theme Park", provider: "Klook preferred", affiliatePriority: "Maximum" }),
        item("d5-rest", "rest", "17:00-18:30", "Return to Hotel and Rest", "Recovery after the full theme-park day.", { imageUrl: images.sentosa, badge: "Rest", showButton: false, price: "" }),
        item("d5-dinner", "restaurant", "19:00-20:30", "Sentosa Dinner", "Keep dinner flexible around energy levels.", { imageUrl: images.food, badge: "Dinner", showButton: false, price: "" }),
        item("d5-free", "free-time", "20:30+", "Free Evening", "No additional paid activity after Universal Studios.", { imageUrl: images.sentosa, badge: "Free Time", showButton: false, price: "" }),
      ],
      suggestions: [
        suggestion("d5-s1", "Universal Express Upgrade", "Theme Park Upgrade", "Only offer when provider data confirms current availability and inclusions.", images.universal),
        suggestion("d5-s2", "Resort Recovery Evening", "Slow Travel Choice", "Recommended if families are tired after the park.", images.sentosa),
      ],
      notes: [
        { icon: "ticket", text: "Universal Studios is the hero booking item." },
        { icon: "clock", text: "Use live provider opening data." },
        { icon: "bed", text: "No second paid evening activity." },
      ],
    }),
    day({
      dayNumber: 6,
      title: "Southern Islands Hero Day",
      destinationLabel: "St. John's Island, Lazarus Island, Kusu Island",
      imageUrl: images.lazarus,
      routeFrom: "Sentosa",
      routeTo: "Marina South Pier, St. John's Island, Lazarus Island",
      weatherLabel: "Hidden coast / Moderate fatigue",
      quote: "This is Singapore's quieter tropical side: ferry light, island paths and Lazarus blue.",
      description:
        "A key Gene differentiator for Singapore: St. John's Island and Lazarus Island by ferry, with Kusu included only if the real ferry schedule makes it practical.",
      items: [
        item("d6-breakfast", "restaurant", "07:30-08:30", "Breakfast", "Eat before leaving Sentosa because island facilities may be limited.", { imageUrl: images.food, badge: "Breakfast", showButton: false, price: "" }),
        item("d6-pier", "transportation", "08:30", "Hotel to Marina South Pier", "Allow 30 to 45 minutes plus boarding buffer.", { imageUrl: images.marina, badge: "Transfer" }),
        item("d6-ferry", "transportation", "09:30 target", "Southern Islands Ferry", "Use the current Klook listing for Singapore - St. John, Lazarus and Kusu Islands Ferry. Exact departure and return times must come from live schedule.", { imageUrl: images.lazarus, badge: "Ferry", provider: "Klook preferred", affiliatePriority: "Very High" }),
        item("d6-st-john", "activity", "10:00-11:00", "St. John's Island Nature Walk", "Coastal exploration and quiet island time after arrival.", { imageUrl: images.lazarus, badge: "Island" }),
        item("d6-lazarus", "activity", "11:20-14:30", "Lazarus Island Beach", "Primary coastal hero section: beach, walking, photography and relaxed free time. Swimming only where conditions and local guidance permit.", { imageUrl: images.lazarus, badge: "Beach", affiliatePriority: "Very High" }),
        item("d6-picnic", "restaurant", "12:30-13:15", "Picnic Lunch", "Advise travelers to arrange food beforehand if selected-date facilities are limited.", { imageUrl: images.food, badge: "Picnic", showButton: false, price: "" }),
        item("d6-kusu", "activity", "14:30+", "Optional Kusu Island", "Skip if ferry timing makes Kusu impractical. Do not force the schedule to add another destination.", { imageUrl: images.lazarus, badge: "Optional" }),
        item("d6-return", "transportation", "16:30-17:30 target", "Return Ferry to Mainland", "Exact ferry time must come from current schedule.", { imageUrl: images.lazarus, badge: "Ferry" }),
        item("d6-dinner", "restaurant", "19:30-21:00", "Final Sentosa Dinner", "A relaxed final island dinner after the Southern Islands day.", { imageUrl: images.food, badge: "Dinner", showButton: false, price: "" }),
      ],
      suggestions: [
        suggestion("d6-s1", "Royal Albatross Sunset Sailing", "Luxury Alternative", "Use as an alternative variant, not together with a conflicting full Southern Islands schedule.", images.sentosa),
        suggestion("d6-s2", "Earlier Return Ferry", "Family Pace", "Recommended when heat or fatigue is high.", images.lazarus),
      ],
      notes: [
        { icon: "ship", text: "Ferry schedule must be checked live." },
        { icon: "water", text: "Do not assume lifeguards or safe swimming." },
        { icon: "food", text: "Plan food ahead if island facilities are limited." },
      ],
    }),
    day({
      dayNumber: 7,
      title: "Slow Sentosa Morning & Departure",
      destinationLabel: "Sentosa and Changi Airport",
      imageUrl: images.sentosa,
      routeFrom: "Capella Singapore",
      routeTo: "Singapore Changi Airport",
      weatherLabel: "Departure / Very low fatigue",
      quote: "One last island morning keeps the journey calm before the airport.",
      description:
        "A very low-fatigue departure day with breakfast, pool or coastal walk, packing, Capella checkout and airport transfer based on live flight timing.",
      items: [
        item("d7-breakfast", "restaurant", "08:00-09:30", "Breakfast", "A slow final breakfast.", { imageUrl: images.food, badge: "Breakfast", showButton: false, price: "" }),
        item("d7-walk", "activity", "09:30-10:45", "Pool, Resort or Light Coastal Walk", "Keep the morning calm and flexible.", { imageUrl: images.sentosa, badge: "Slow Morning", showButton: false, price: "" }),
        item("d7-pack", "rest", "10:45-11:30", "Packing", "Final packing and room check.", { imageUrl: images.sentosa, badge: "Packing", showButton: false, price: "" }),
        item("d7-checkout", "hotel", "12:00", "Capella Singapore Checkout", "Validate current checkout policy at booking time.", { imageUrl: images.sentosa, badge: "Hotel" }),
        item("d7-transfer", "transportation", "After checkout", "Hotel to Changi Airport", "Calculate transfer and airport buffer dynamically from the traveler's actual flight.", { imageUrl: images.airport, badge: "Airport Transfer" }),
      ],
      suggestions: [
        suggestion("d7-s1", "Late Checkout Request", "Comfort Upgrade", "Only offer when hotel/provider confirms availability.", images.sentosa),
        suggestion("d7-s2", "Jewel Changi Airport Buffer", "Airport Add-On", "Useful if the departure flight allows extra time.", images.airport),
      ],
      notes: [
        { icon: "plane", text: "Airport buffer depends on international departure time." },
        { icon: "hotel", text: "Checkout policy must be verified live." },
        { icon: "leaf", text: "No paid excursion on departure day." },
      ],
    }),
  ];

  return {
    hero: {
      eyebrow: "Level 1 • Plan #7 • Singapore",
      title: PLAN_TITLE,
      subtitle:
        "Step into Singapore's futuristic skyline, wander beneath glowing Supertrees, cross above the harbour to Sentosa, escape the city for the quiet beaches of Lazarus Island, then finish the journey among Singapore's extraordinary wildlife after dark.",
      imageUrl: images.hero,
      badge: "City • Coastal • Island • Family • Luxury • Food • Nature",
      stats: [
        { label: "Days", value: "7" },
        { label: "Countries", value: "1" },
        { label: "Cities", value: "5" },
        { label: "Travelers", value: "2" },
        { label: "Trip Style", value: "City Coast" },
      ],
    },
    overview: {
      startingPoint: "Singapore Changi Airport",
      destinations: "Marina Bay, Heritage Singapore, Sentosa, Southern Islands, Mandai",
      tripStyle: "City, coastal, island, family, luxury, food, nature, entertainment, couple, photography",
      travelers: "2 Adults",
      estimatedCost: "Live pricing",
      aiScore: "4.9",
    },
    days,
    commercialScore: {
      beach: "4/5",
      city: "5/5",
      culture: "4/5",
      nature: "4/5",
      family: "5/5",
      couples: "4/5",
      luxury: "5/5",
      food: "5/5",
      photography: "5/5",
      affiliatePotential: "5/5",
      overallVariety: "5/5",
    },
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

  const payload = {
    status: "DRAFT",
    slug: SLUG,
    title: PLAN_TITLE,
    location: "Marina Bay, Heritage Singapore, Sentosa, Southern Islands, Mandai",
    days: content.days.length,
    image_url: images.hero,
    created_at: timestamp,
    subtitle:
      "7 days from Singapore's futuristic skyline to Sentosa's shores, Lazarus Island and Mandai night wildlife.",
    country: "Singapore",
    city: "Marina Bay, Sentosa, Southern Islands, Mandai",
    destination: "Singapore",
    style: "City, Coastal, Island, Family, Luxury, Food, Nature, Entertainment, Couple, Photography",
    daysCount: content.days.length,
    heroImage: images.hero,
    coverImage: images.hero,
    summary:
      "A 7-day Singapore Ready Plan built around Marina Bay, Gardens by the Bay, SkyPark, heritage districts, Night Safari, Sentosa, Universal Studios and the Southern Islands.",
    seoTitle: PLAN_TITLE,
    seoDescription:
      "Draft ready plan for Singapore: Skyline Glow, Sentosa Shores and Southern Islands with Marina Bay, Sentosa, Lazarus Island and Night Safari.",
    tags: ["Singapore", "Marina Bay", "Sentosa", "Lazarus Island", "Night Safari", "Gardens by the Bay", "Universal Studios", "Family", "Luxury"],
    season: "Year-round",
    showOnHome: false,
    priceFrom: 0,
    currency: "USD",
    daysJson,
    contentJson: content,
    updatedAt: timestamp,
  };

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
  console.error("INSERT_SINGAPORE_READY_PLAN_FAILED");
  console.error(error);
  process.exit(1);
});
