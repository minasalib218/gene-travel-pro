import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import crypto from "node:crypto";

const SOURCE_ENV_PATH = new URL("../.env", import.meta.url);
const SLUG = "vietnam-north-to-south-taste";
const PLAN_TITLE = "North-to-South Vietnam Taste Adventure";

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
    countryLabel: "Vietnam",
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
        title: "Timing note",
        text: "Flights, tours, and transfers should be rechecked before publishing because live schedules can shift.",
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
      title: "Hanoi Arrival and Old Quarter Food Ride",
      destinationLabel: "Hanoi",
      routeFrom: "Noi Bai Airport",
      routeTo: "Hanoi Old Quarter",
      weatherLabel: "29C / Humid city evening",
      quote: "Vietnam begins with scooter light, old-quarter flavor, and a first night built around food.",
      description:
        "Arrive in Hanoi, transfer to the Old Quarter, explore Hoan Kiem Lake and Ngoc Son Temple, then join a female-led motorbike foodie tour.",
      estimatedCost: "USD 520",
      items: [
        planItem("d1-item-1", "flight", "08:00-09:00", "Arrive at Noi Bai Airport", "Arrive in Hanoi and transfer to the Old Quarter hotel.", { badge: "Arrival" }),
        planItem("d1-item-2", "hotel", "09:00-11:00", "Old Quarter Hotel Bag Drop", "Check-in is later in the day, so drop bags and reset before lunch.", { badge: "Hotel" }),
        planItem("d1-item-3", "restaurant", "11:00-12:00", "Hanoi Lunch: Pho or Bun Cha", "Begin with a classic Hanoi lunch such as pho or bun cha.", { badge: "Lunch" }),
        planItem("d1-item-4", "activity", "13:00-16:30", "Hoan Kiem Lake and Ngoc Son Temple", "Explore Hanoi's lakefront, temple atmosphere, and Old Quarter streets.", { badge: "Old Quarter" }),
        planItem("d1-item-5", "restaurant", "17:00-21:00", "Hanoi Motorbike Foodie Tour", "Female-led Viator street-food ride visiting 5 to 7 local eateries at sunset.", { badge: "Food Tour" }),
        planItem("d1-item-6", "activity", "21:00-22:00", "Night Market or Spa Free Time", "Easy free time after the food ride.", { badge: "Free Time" }),
      ],
    }),
    buildDay({
      dayNumber: 2,
      title: "Hanoi Off-Road Buggy and Temple Day",
      destinationLabel: "Hanoi",
      routeFrom: "Hanoi Old Quarter",
      routeTo: "Country Park and Hanoi",
      weatherLabel: "30C / Jungle-track morning",
      quote: "The city loosens its grip as Hanoi turns into tracks, buggies, water puppets, temples, and late local dinner.",
      description:
        "Take a self-drive off-road buggy tour, then return to Hanoi for cafe time, Temple of Literature, and a relaxed dinner.",
      estimatedCost: "USD 460",
      items: [
        planItem("d2-item-1", "restaurant", "07:00-07:30", "Breakfast", "Simple early breakfast before the buggy pickup and drive.", { badge: "Breakfast" }),
        planItem("d2-item-2", "activity", "07:30-12:00", "Hanoi Self-Drive Off-Road Buggy Tour", "Klook 4.5-hour buggy tour from the Opera House area with country-park transfer, jungle ATV time, and return.", { badge: "Buggy" }),
        planItem("d2-item-3", "restaurant", "12:00-13:00", "Lunch En Route", "Lunch break after the buggy adventure.", { badge: "Lunch" }),
        planItem("d2-item-4", "activity", "13:00-16:00", "Water Puppet Museum or Street Cafe Break", "A softer culture-and-cafe block after the morning off-road activity.", { badge: "Culture" }),
        planItem("d2-item-5", "activity", "16:30-18:00", "Temple of Literature Visit", "Visit Hanoi's Temple of Literature in the late afternoon.", { badge: "Temple" }),
        planItem("d2-item-6", "restaurant", "19:00-20:30", "Dinner at Local Eatery", "Local dinner before resting for the Hue flight.", { badge: "Dinner" }),
      ],
    }),
    buildDay({
      dayNumber: 3,
      title: "Flight to Hue and Imperial City",
      destinationLabel: "Hue",
      routeFrom: "Hanoi",
      routeTo: "Hue",
      weatherLabel: "28C / River evening",
      quote: "The route pivots south into imperial Vietnam: citadel walls, royal tombs, river light, and Hue flavors.",
      description:
        "Fly from Hanoi to Hue, transfer to Ancient Hue Garden Houses, explore the Citadel and royal tombs, then cruise the Perfume River.",
      estimatedCost: "USD 610",
      items: [
        planItem("d3-item-1", "transportation", "06:30-08:30", "Transfer to Hanoi Airport", "Airport transfer and check-in buffer before the Hanoi to Hue flight.", { badge: "Airport" }),
        planItem("d3-item-2", "flight", "08:30-10:00", "Flight Hanoi to Hue", "Short domestic flight from Hanoi to Hue, planned at about 1 hour 15 minutes plus landing time.", { badge: "Flight" }),
        planItem("d3-item-3", "transportation", "10:30-11:30", "Hue Airport Transfer", "Meet at Hue airport and transfer to Ancient Hue Garden Houses; drop bags early.", { badge: "Transfer" }),
        planItem("d3-item-4", "restaurant", "12:00-13:00", "Hue Lunch: Bun Bo Hue", "Lunch built around Hue's signature noodle soup.", { badge: "Lunch" }),
        planItem("d3-item-5", "activity", "13:30-17:00", "Hue Citadel and Royal Tombs", "Explore the Imperial City and royal tombs DIY or with a guide.", { badge: "Imperial City" }),
        planItem("d3-item-6", "activity", "17:30-19:00", "Perfume River Cruise and Thien Mu Pagoda", "Cruise the Perfume River and visit Thien Mu Pagoda in the evening light.", { badge: "River" }),
        planItem("d3-item-7", "restaurant", "19:30-21:00", "Hue Dinner", "Dinner featuring banh khoai, seafood, or other Hue dishes.", { badge: "Dinner" }),
      ],
    }),
    buildDay({
      dayNumber: 4,
      title: "Hue Countryside and Cave Adventure",
      destinationLabel: "Hue",
      routeFrom: "Hue",
      routeTo: "Hue and Phong Nha Option",
      weatherLabel: "27C / Heritage day",
      quote: "Hue stretches from quiet countryside roads to big cave energy, with enough flexibility to soften the pace.",
      description:
        "Use the morning for countryside cycling and the afternoon for either a Paradise/Dark Cave adventure or an easier Hue/DMZ alternative.",
      estimatedCost: "USD 580",
      items: [
        planItem("d4-item-1", "restaurant", "07:00-08:00", "Breakfast", "Start early before the long Hue activity day.", { badge: "Breakfast" }),
        planItem("d4-item-2", "activity", "08:00-11:30", "Hue Countryside Pedal-Bike Tour", "Cycle through countryside villages, Thanh Toan Covered Bridge, and rice-field scenery.", { badge: "Cycling" }),
        planItem("d4-item-3", "restaurant", "12:00-13:00", "Riverfront Lunch", "Lunch break at a riverfront cafe.", { badge: "Lunch" }),
        planItem("d4-item-4", "activity", "13:00-17:00", "Paradise Cave and Dark Cave Option", "Optional Phong Nha cave day-tour style block with underground caves, kayaking, and zipline elements, or swap for a DMZ history tour.", { badge: "Caves" }),
        planItem("d4-item-5", "transportation", "17:30-19:00", "Return to Hue", "Return transfer and recovery after the cave or DMZ block.", { badge: "Return" }),
        planItem("d4-item-6", "restaurant", "19:30-21:00", "Hue Gourmet Dinner", "Dinner in Hue after the full day.", { badge: "Dinner" }),
      ],
    }),
    buildDay({
      dayNumber: 5,
      title: "Hue to Hoi An by Hai Van Jeep",
      destinationLabel: "Hoi An",
      routeFrom: "Hue",
      routeTo: "Hoi An",
      weatherLabel: "29C / Coastal pass",
      quote: "The central coast becomes cinematic on the Hai Van Pass: jeep roads, Marble Mountains, Lang Co Bay, and lantern streets.",
      description:
        "Travel from Hue to Hoi An by private Jeep via Hai Van Pass, with Lang Co Bay and Marble Mountains stops before an Old Town evening.",
      estimatedCost: "USD 650",
      items: [
        planItem("d5-item-1", "hotel", "07:30-08:00", "Hue Checkout", "Check out from the Hue hotel and prepare for the Jeep transfer.", { badge: "Checkout" }),
        planItem("d5-item-2", "activity", "08:00-16:00", "Private Jeep Tour: Hue to Hoi An via Hai Van Pass", "Viator 7-8 hour scenic Jeep transfer with Marble Mountains and Lang Co Bay stops.", { badge: "Jeep" }),
        planItem("d5-item-3", "restaurant", "12:00-13:00", "Lang Co Beach Lunch", "Beach lunch during the Hai Van Pass transfer.", { badge: "Lunch" }),
        planItem("d5-item-4", "hotel", "16:00-17:00", "Hoi An Hotel Check-in", "Arrive Hoi An and check into a central Old Town hotel such as La Siesta Hoi An or similar.", { badge: "Hotel" }),
        planItem("d5-item-5", "activity", "17:00-19:00", "Hoi An Old Town Walk", "Walk the UNESCO old town, Fujian Assembly Hall, and Japanese Bridge.", { badge: "Old Town" }),
        planItem("d5-item-6", "restaurant", "19:30-21:00", "Cao Lau Dinner", "Dinner built around Hoi An's signature cao lau noodles.", { badge: "Dinner" }),
      ],
    }),
    buildDay({
      dayNumber: 6,
      title: "Hoi An Biking and Cooking",
      destinationLabel: "Hoi An",
      routeFrom: "Hoi An",
      routeTo: "Tra Que Village",
      weatherLabel: "30C / Lantern evening",
      quote: "Hoi An tastes best when the day moves slowly through farms, markets, coconut groves, and lantern streets.",
      description:
        "Cycle through Tra Que Village, visit the market, cook lunch with farmers, ride a basket boat, then enjoy free Hoi An time.",
      estimatedCost: "USD 430",
      items: [
        planItem("d6-item-1", "activity", "08:30-13:30", "Biking and Cooking Experience in Hoi An", "Klook 5-hour rural cycling and cooking class through Tra Que Village, market, farm lunch, and coconut-grove basket boat.", { badge: "Cooking" }),
        planItem("d6-item-2", "restaurant", "13:30-14:30", "Cooking Class Lunch", "Eat the lunch prepared during the cooking class.", { badge: "Lunch" }),
        planItem("d6-item-3", "activity", "15:00-17:30", "Lantern Shopping and Cafe Time", "Free afternoon for cafes or lantern shopping in town.", { badge: "Free Time" }),
        planItem("d6-item-4", "restaurant", "18:00-19:30", "Hoi An Dinner", "Street-food tour or riverside cafe dinner.", { badge: "Dinner" }),
      ],
    }),
    buildDay({
      dayNumber: 7,
      title: "Hoi An to Ho Chi Minh City",
      destinationLabel: "Ho Chi Minh City",
      routeFrom: "Hoi An",
      routeTo: "Ho Chi Minh City",
      weatherLabel: "32C / Southern city",
      quote: "The journey drops south into Saigon energy: airport flow, city icons, night markets, and barbecue smoke.",
      description:
        "Transfer to Da Nang Airport, fly to Ho Chi Minh City, check in, and spend the afternoon on a classic Saigon walking route.",
      estimatedCost: "USD 620",
      items: [
        planItem("d7-item-1", "restaurant", "07:00-08:00", "Breakfast in Hoi An", "Final Hoi An breakfast before the airport transfer.", { badge: "Breakfast" }),
        planItem("d7-item-2", "transportation", "08:00-10:00", "Transfer to Da Nang Airport", "Road transfer from Hoi An to Da Nang Airport.", { badge: "Airport" }),
        planItem("d7-item-3", "flight", "10:30-12:00", "Flight Da Nang to Ho Chi Minh City", "Domestic flight planned at about 1 hour 15 minutes.", { badge: "Flight" }),
        planItem("d7-item-4", "transportation", "12:30-13:00", "Tan Son Nhat Airport Transfer", "Arrive at Tan Son Nhat Airport and transfer to the hotel.", { badge: "Transfer" }),
        planItem("d7-item-5", "restaurant", "13:00-14:00", "Lunch: Com Tam", "Southern-style lunch after arrival.", { badge: "Lunch" }),
        planItem("d7-item-6", "activity", "14:30-17:00", "Saigon Walking Icons", "Visit Notre-Dame Cathedral, Central Post Office, and Opera House.", { badge: "City Walk" }),
        planItem("d7-item-7", "hotel", "17:30-19:00", "Hotel Rest", "Rest at a 4-star HCMC hotel such as Liberty Central Saigon Citypoint.", { badge: "Hotel" }),
        planItem("d7-item-8", "restaurant", "19:30-21:00", "Vietnamese Barbecue Dinner", "Evening dinner in Ho Chi Minh City.", { badge: "Dinner" }),
      ],
    }),
    buildDay({
      dayNumber: 8,
      title: "Cu Chi Tunnels and Saigon Scooter Food",
      destinationLabel: "Ho Chi Minh City",
      routeFrom: "Ho Chi Minh City",
      routeTo: "Cu Chi and Saigon",
      weatherLabel: "32C / Historic and electric",
      quote: "Saigon's day splits perfectly: history underground by morning, scooter food by night.",
      description:
        "Visit the Cu Chi Tunnels in the morning, War Remnants Museum in the afternoon, and finish with a street-food scooter tour.",
      estimatedCost: "USD 520",
      items: [
        planItem("d8-item-1", "transportation", "06:30-07:00", "Depart Hotel for Cu Chi", "Early pickup or transfer for the Cu Chi half-day tour.", { badge: "Pickup" }),
        planItem("d8-item-2", "activity", "07:00-13:00", "Cu Chi Tunnels Half-Day Tour", "Klook approximately 6.5-hour tour exploring Viet Cong tunnel history.", { badge: "Cu Chi" }),
        planItem("d8-item-3", "restaurant", "13:00-14:00", "Vietnamese Lunch in City", "Return to HCMC and break for lunch.", { badge: "Lunch" }),
        planItem("d8-item-4", "activity", "14:30-17:00", "War Remnants Museum", "Afternoon museum visit for Vietnam War context.", { badge: "Museum" }),
        planItem("d8-item-5", "restaurant", "17:30-18:30", "Ben Thanh Coffee Break", "Coffee break near the busy Ben Thanh market area.", { badge: "Coffee" }),
        planItem("d8-item-6", "restaurant", "19:00-22:30", "Street Food on Scooter Tour", "Klook 3.5-hour scooter food tour sampling 7-12 local dishes with a female rider guide.", { badge: "Scooter Food" }),
      ],
    }),
    buildDay({
      dayNumber: 9,
      title: "Mekong Delta Cruise Day",
      destinationLabel: "Mekong Delta",
      routeFrom: "Ho Chi Minh City",
      routeTo: "My Tho and Ben Tre",
      weatherLabel: "31C / River villages",
      quote: "The Mekong chapter slows everything down: canals, sampans, fruit, folk music, and a softer farewell rhythm.",
      description:
        "Take a full-day My Tho and Ben Tre cruise with villages, lunch, sampan ride, tropical fruit, and a farewell dinner after returning to HCMC.",
      estimatedCost: "USD 480",
      items: [
        planItem("d9-item-1", "transportation", "06:30-07:00", "Depart HCMC Hotel", "Early departure from Ho Chi Minh City for the Mekong Delta tour.", { badge: "Pickup" }),
        planItem("d9-item-2", "activity", "07:00-17:30", "Mekong Delta Day Tour", "Klook 10.5-hour My Tho and Ben Tre cruise with Vinh Trang Pagoda, villages, buffet lunch, sampan ride, tropical fruits, and folk music.", { badge: "Mekong" }),
        planItem("d9-item-3", "transportation", "17:30-18:30", "Return to Ho Chi Minh City", "Return to HCMC after the delta day.", { badge: "Return" }),
        planItem("d9-item-4", "restaurant", "19:00-21:00", "Farewell Dinner", "Rooftop dinner or dining-cruise style farewell meal.", { badge: "Dinner" }),
      ],
    }),
    buildDay({
      dayNumber: 10,
      title: "Ho Chi Minh City Departure",
      destinationLabel: "Ho Chi Minh City",
      routeFrom: "Ho Chi Minh City",
      routeTo: "Tan Son Nhat Airport",
      weatherLabel: "32C / Departure day",
      quote: "The final morning is deliberately simple: breakfast, shopping, brunch, checkout, airport.",
      description:
        "Use the last morning for shopping or brunch before hotel checkout and airport transfer.",
      estimatedCost: "USD 260",
      items: [
        planItem("d10-item-1", "restaurant", "08:00-09:00", "Breakfast", "Final breakfast in Ho Chi Minh City.", { badge: "Breakfast" }),
        planItem("d10-item-2", "activity", "09:00-12:00", "Free Morning Shopping", "Shopping at Vincom, Ben Thanh, or a final city stroll.", { badge: "Free Time" }),
        planItem("d10-item-3", "restaurant", "12:00-13:00", "Departure Brunch", "Brunch before checkout and airport transfer.", { badge: "Brunch" }),
        planItem("d10-item-4", "hotel", "13:30-14:00", "Hotel Checkout", "Check out from the HCMC hotel.", { badge: "Checkout" }),
        planItem("d10-item-5", "transportation", "14:00-15:00", "Transfer to Tan Son Nhat Airport", "Airport transfer for departure or onward extension.", { badge: "Airport" }),
      ],
    }),
  ];

  return {
    hero: {
      title: PLAN_TITLE,
      subtitle:
        "A 10-day Vietnam food-and-adventure route from Hanoi to Hue, Hoi An, Ho Chi Minh City, and the Mekong Delta.",
      backgroundImage: baseImage,
      primaryCtaText: "Plan Smarter With AI",
      primaryCtaHref: "/start-planning",
      secondaryCtaText: "View Full Timeline",
      stats: [
        { label: "Days", value: "10" },
        { label: "Countries", value: "1" },
        { label: "Cities", value: "5" },
        { label: "Travelers", value: "2" },
        { label: "Travel Style", value: "Taste Adventure" },
      ],
    },
    journeyOverview: {
      title: "Journey Overview",
      startingPoint: "Hanoi, Vietnam",
      destinations: "Hanoi, Hue, Hoi An, Ho Chi Minh City, Mekong Delta",
      tripStyle: "Food, Culture, Adventure",
      travelers: "2 Adults",
      estimatedCost: "USD 5,000-7,000",
      aiScore: "4.8",
    },
    days,
    footer: {
      title: "Your journey, but smarter.",
      subtitle: "Use this Vietnam draft as the base, then add final images and item-level affiliate links before publishing.",
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
    location: "Hanoi, Hue, Hoi An, Ho Chi Minh City, Mekong Delta",
    days: 10,
    image_url: "/bg/home-hero.png",
    created_at: timestamp,
    subtitle:
      "A 10-day Vietnam north-to-south taste adventure with Hanoi food rides, off-road buggy, Hue heritage, Hoi An cooking, Saigon scooter food, and Mekong Delta cruising.",
    country: "Vietnam",
    city: "Hanoi, Hue, Hoi An, Ho Chi Minh City, Mekong Delta",
    destination: "Vietnam",
    style: "Food, Culture, Adventure",
    daysCount: 10,
    heroImage: "/bg/home-hero.png",
    coverImage: "/bg/home-hero-bottom-optimized.jpg",
    summary:
      "A Vietnam north-to-south taste adventure rebuilt from the attached Executive Summary, ready for final images and item-level affiliate links.",
    seoTitle: `${PLAN_TITLE} | Gene Travel`,
    seoDescription:
      "Draft ready plan for a 10-day Vietnam food and adventure route across Hanoi, Hue, Hoi An, Ho Chi Minh City, and the Mekong Delta.",
    tags: ["Vietnam", "Hanoi", "Hue", "Hoi An", "Ho Chi Minh City", "Mekong Delta", "Food"],
    season: "All Season",
    showOnHome: false,
    priceFrom: 5000,
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
  console.error("INSERT_VIETNAM_READY_PLAN_FAILED");
  console.error(error);
  process.exit(1);
});
