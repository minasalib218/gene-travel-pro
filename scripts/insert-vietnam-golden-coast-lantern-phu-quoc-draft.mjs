import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import crypto from "node:crypto";

const SOURCE_ENV_PATH = new URL("../.env", import.meta.url);
const SLUG = "vietnam-golden-coast-lantern-nights-phu-quoc-blue";
const PLAN_TITLE = "Vietnam: Golden Coast, Lantern Nights & Phu Quoc Blue";

const commons = (fileName, width = 1280) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}?width=${width}`;

const images = {
  hero: commons("Cau Vang (Golden Bridge) - Ba Na Hills, Da Nang.jpg", 1440),
  daNangBeach: commons("My Khe Beach, Da Nang, Vietnam.jpg", 1280),
  goldenBridge: commons("Golden Bridge, Ba Na Hills, Da Nang, Vietnam.jpg", 1440),
  marble: commons("Marble Mountains, Da Nang, Vietnam.jpg", 1280),
  sonTra: commons("Linh Ung Pagoda, Son Tra Peninsula, Da Nang.jpg", 1280),
  hoiAn: commons("Hoi An lanterns 2019.jpg", 1280),
  coconut: commons("Basket boats at Cam Thanh coconut village, Hoi An.jpg", 1280),
  chamIsland: commons("Cham Islands, Vietnam.jpg", 1280),
  riceFields: commons("Rice fields near Hoi An, Vietnam.jpg", 1280),
  anBang: commons("An Bang Beach, Hoi An, Vietnam.jpg", 1280),
  phuQuoc: commons("Phu Quoc beach Vietnam.jpg", 1440),
  islands: commons("Phu Quoc Islands Vietnam.jpg", 1280),
  honThom: commons("Hon Thom cable car, Phu Quoc, Vietnam.jpg", 1280),
  airport: commons("Da Nang International Airport.jpg", 1280),
  resort: commons("Hyatt Regency Danang Resort and Spa.jpg", 1280),
  lanternRiver: commons("Hoi An lantern boat river.jpg", 1280),
  seafood: commons("Vietnamese seafood dinner.jpg", 1280),
};

function asId() {
  return crypto.randomUUID();
}

function item(id, type, time, title, description, extra = {}) {
  const bookable = ["hotel", "flight", "transportation", "activity", "event"].includes(type);
  return {
    id,
    type,
    time,
    title,
    description,
    imageUrl: extra.imageUrl || images.hero,
    deeplink: "",
    buttonLabel: "Book Now",
    showButton: extra.showButton ?? bookable,
    status: extra.status || (bookable ? "Affiliate pending" : "Draft"),
    badge: extra.badge || type,
    price: extra.price || (bookable ? "Live price" : ""),
    people: extra.people || "2 People",
    provider: extra.provider || "",
    affiliatePriority: extra.affiliatePriority || "",
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
  };
}

function day(data) {
  const items = data.items;
  return {
    id: `day-${data.dayNumber}`,
    dayNumber: data.dayNumber,
    title: data.title,
    destinationLabel: data.destinationLabel,
    countryLabel: "Vietnam",
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
      title: "Arrival in Da Nang - Touchdown on Vietnam's Coast",
      destinationLabel: "Da Nang",
      imageUrl: images.daNangBeach,
      routeFrom: "Da Nang International Airport",
      routeTo: "My Khe / Non Nuoc beachfront hotel",
      weatherLabel: "Arrival / Low fatigue",
      quote: "Vietnam begins softly: airport lights, beach air and a golden first sunset.",
      description:
        "A light arrival day with airport buffer, beachfront hotel check-in, full rest, a My Khe or Non Nuoc beach walk and an easy seafood dinner.",
      items: [
        item("d1-arrival", "flight", "14:00", "Arrival at Da Nang International Airport", "Land on Vietnam's central coast. Flight details stay flexible until the customer dates are known.", { imageUrl: images.airport, badge: "Arrival", showButton: false, price: "" }),
        item("d1-buffer", "transportation", "14:00-15:00", "Immigration and Baggage", "Allow one hour for airport formalities before leaving the terminal.", { imageUrl: images.airport, badge: "Airport", showButton: false, price: "" }),
        item("d1-transfer", "transportation", "15:00-15:40", "Airport to Beachfront Hotel", "Private or hotel transfer from Da Nang Airport to the beach area.", { imageUrl: images.resort, badge: "Transfer" }),
        item("d1-hotel", "hotel", "16:00", "Hyatt Regency Danang Resort & Spa Check-In", "Suggested premium coastal base on Non Nuoc Beach, positioned well between Da Nang and Hoi An.", { imageUrl: images.resort, badge: "Hotel", affiliatePriority: "High" }),
        item("d1-rest", "activity", "16:00-17:30", "Arrival Recovery", "A full rest window with no paid excursion.", { imageUrl: images.resort, badge: "Rest", showButton: false, price: "" }),
        item("d1-beach", "activity", "17:30-19:00", "My Khe / Non Nuoc Beach Sunset", "Beach walk, optional swim when conditions allow, and the first sunset on Vietnam's coast.", { imageUrl: images.daNangBeach, badge: "Beach", showButton: false, price: "" }),
        item("d1-dinner", "restaurant", "19:30-21:00", "Vietnamese Seafood Dinner", "Flexible seafood dinner near the beach.", { imageUrl: images.seafood, badge: "Dinner", showButton: false, price: "" }),
      ],
      suggestions: [
        suggestion("d1-s1", "Private Airport Transfer", "Comfort Upgrade", "A smooth arrival upgrade for travelers with luggage or long-haul fatigue.", images.resort),
        suggestion("d1-s2", "Beachfront Dinner Reservation", "Food Add-On", "Best if live restaurant inventory supports the arrival timing.", images.seafood),
      ],
      notes: [
        { id: "d1-n1", icon: "plane", title: "Arrival", text: "Keep Day 1 light and flexible." },
        { id: "d1-n2", icon: "sun", title: "Sunset", text: "The beach walk is the first visual anchor." },
        { id: "d1-n3", icon: "bed", title: "Recovery", text: "No paid tour is scheduled after the flight." },
      ],
    }),
    day({
      dayNumber: 2,
      title: "Golden Bridge Hero Day - Ba Na Hills Above the Clouds",
      destinationLabel: "Ba Na Hills",
      imageUrl: images.goldenBridge,
      routeFrom: "Da Nang",
      routeTo: "Ba Na Hills and Golden Bridge",
      weatherLabel: "Hero excursion / High fatigue",
      quote: "Above the coast, giant stone hands lift the walkway into the mountain mist.",
      description:
        "The plan's first major hero day: Ba Na Hills, Golden Bridge, cable car ascent, gardens, viewpoints and a mandatory hotel rest after return.",
      items: [
        item("d2-breakfast", "restaurant", "06:30", "Breakfast", "Early breakfast before the Ba Na Hills pickup.", { imageUrl: images.resort, badge: "Breakfast", showButton: false, price: "" }),
        item("d2-pickup", "transportation", "07:30", "Hotel Pickup", "Pickup for a Ba Na Hills and Golden Bridge day tour from Da Nang.", { imageUrl: images.goldenBridge, badge: "Pickup" }),
        item("d2-transfer", "transportation", "08:00-09:00", "Da Nang to Ba Na Hills", "Transfer into the hills before the cable car ascent.", { imageUrl: images.goldenBridge, badge: "Transfer" }),
        item("d2-bridge", "activity", "09:30-10:30", "Golden Bridge", "Hero photo moment on the famous mountain walkway above Da Nang.", { imageUrl: images.goldenBridge, badge: "Hero", provider: "Klook preferred", affiliatePriority: "Maximum" }),
        item("d2-village", "activity", "10:30-12:00", "French Village, Gardens and Viewpoints", "Explore the atmospheric Ba Na Hills complex after the bridge.", { imageUrl: images.goldenBridge, badge: "Viewpoints" }),
        item("d2-lunch", "restaurant", "12:00-13:00", "Ba Na Hills Lunch", "Lunch inside the Ba Na Hills route according to the selected provider package.", { imageUrl: images.goldenBridge, badge: "Lunch", showButton: false, price: "" }),
        item("d2-explore", "activity", "13:00-15:30", "Free Exploration", "Flexible exploration before descent.", { imageUrl: images.goldenBridge, badge: "Explore" }),
        item("d2-return", "transportation", "16:30-17:30", "Return to Da Nang", "Return transfer to the beachfront hotel.", { imageUrl: images.resort, badge: "Return" }),
        item("d2-rest", "activity", "17:30-19:00", "Mandatory Hotel Rest", "No Hoi An night trip today; this day is already full.", { imageUrl: images.resort, badge: "Rest", showButton: false, price: "" }),
      ],
      suggestions: [
        suggestion("d2-s1", "Ba Na Hills Custom Day Tour", "Private Upgrade", "Use if travelers want more control over timing and photo stops.", images.goldenBridge),
        suggestion("d2-s2", "Golden Bridge Early Access", "Photography Upgrade", "Best if live provider timing supports an earlier start.", images.goldenBridge),
      ],
      notes: [
        { id: "d2-n1", icon: "ticket", title: "Provider", text: "Use live provider inclusions for cable car and meals." },
        { id: "d2-n2", icon: "clock", title: "Pacing", text: "Do not add Hoi An at night on this day." },
        { id: "d2-n3", icon: "camera", title: "Hero Image", text: "Golden Bridge is the main visual moment." },
      ],
    }),
    day({
      dayNumber: 3,
      title: "Da Nang Coast - Marble Mountains, Son Tra and Slow Beach",
      destinationLabel: "Da Nang",
      imageUrl: images.marble,
      routeFrom: "Da Nang beachfront hotel",
      routeTo: "Marble Mountains, Son Tra Peninsula, Han River",
      weatherLabel: "Coastal icons / Moderate fatigue",
      quote: "Caves, pagodas and river lights keep the coast cinematic without rushing the day.",
      description:
        "A balanced Da Nang day with Marble Mountains, Linh Ung Pagoda / Son Tra Peninsula, lunch, beach rest and an evening around Dragon Bridge and the Han River.",
      items: [
        item("d3-breakfast", "restaurant", "07:30-09:00", "Breakfast", "Slow breakfast before the coastal icons.", { imageUrl: images.resort, badge: "Breakfast", showButton: false, price: "" }),
        item("d3-marble", "activity", "09:30-11:00", "Marble Mountains", "Explore caves, viewpoints and walkways with enough time to avoid rushing.", { imageUrl: images.marble, badge: "Culture", affiliatePriority: "Medium" }),
        item("d3-transfer", "transportation", "11:00-11:30", "Transfer to Son Tra", "Short coastal transfer from Marble Mountains toward Son Tra Peninsula.", { imageUrl: images.sonTra, badge: "Transfer" }),
        item("d3-sontra", "activity", "11:30-12:30", "Linh Ung Pagoda / Son Tra Peninsula", "Pagoda views and coastal scenery before lunch.", { imageUrl: images.sonTra, badge: "Pagoda" }),
        item("d3-lunch", "restaurant", "13:00-14:00", "Lunch", "Flexible lunch in Da Nang.", { imageUrl: images.seafood, badge: "Lunch", showButton: false, price: "" }),
        item("d3-beach", "activity", "14:30-17:30", "Beach / Pool / Rest", "Unstructured coast time after the morning sightseeing.", { imageUrl: images.daNangBeach, badge: "Beach", showButton: false, price: "" }),
        item("d3-dragon", "activity", "18:30-20:00", "Dragon Bridge and Han River Area", "Evening lights, riverside walk and photography.", { imageUrl: images.daNangBeach, badge: "Evening", showButton: false, price: "" }),
      ],
      suggestions: [
        suggestion("d3-s1", "Son Tra and Marble Mountains Guided Tour", "Culture Upgrade", "Useful if customers prefer a guided version of the active sightseeing cluster.", images.marble),
        suggestion("d3-s2", "Beach Club Sunset", "Relaxed Upgrade", "A soft sunset option if available around My Khe or Non Nuoc.", images.daNangBeach),
      ],
      notes: [
        { id: "d3-n1", icon: "sun", title: "Balance", text: "Sightseeing is finished before the afternoon heat." },
        { id: "d3-n2", icon: "water", title: "Beach", text: "Beach time is intentionally protected." },
        { id: "d3-n3", icon: "camera", title: "Night", text: "Dragon Bridge stays flexible." },
      ],
    }),
    day({
      dayNumber: 4,
      title: "Da Nang to Hoi An - Coconut Forest and Lantern Night",
      destinationLabel: "Hoi An",
      imageUrl: images.hoiAn,
      routeFrom: "Da Nang",
      routeTo: "Hoi An Old Town and Cam Thanh Coconut Forest",
      weatherLabel: "Transfer + visual evening / Moderate fatigue",
      quote: "Hoi An waits for evening: basket boats by day, lantern rivers by night.",
      description:
        "Transfer from Da Nang to Hoi An, rest, Cam Thanh coconut basket boat experience, then Old Town, dinner, lantern river experience and riverside walk.",
      items: [
        item("d4-checkout", "hotel", "09:30", "Da Nang Checkout", "Leave the beachfront base and move toward Hoi An.", { imageUrl: images.resort, badge: "Checkout" }),
        item("d4-transfer", "transportation", "10:00-10:50", "Da Nang to Hoi An", "Private transfer or live-route transport to Hoi An.", { imageUrl: images.hoiAn, badge: "Transfer" }),
        item("d4-hotel", "hotel", "11:00-12:00", "Anantara Hoi An Resort Luggage Drop", "Suggested premium Hoi An base beside the river and close to Old Town.", { imageUrl: images.hoiAn, badge: "Hotel", affiliatePriority: "High" }),
        item("d4-rest", "activity", "12:00-14:00", "Rest Window", "Quiet midday rest before the visual afternoon and night.", { imageUrl: images.hoiAn, badge: "Rest", showButton: false, price: "" }),
        item("d4-coconut", "activity", "15:00-16:30", "Coconut Basket Boat Ride", "Cam Thanh / Bay Mau coconut forest basket boat experience with local activities.", { imageUrl: images.coconut, badge: "Activity", provider: "GetYourGuide preferred", affiliatePriority: "High" }),
        item("d4-oldtown", "activity", "18:00-19:00", "Hoi An Old Town Walking", "First lantern-lit walk through Hoi An's heritage streets.", { imageUrl: images.hoiAn, badge: "Old Town", showButton: false, price: "" }),
        item("d4-lantern", "event", "20:00-20:30", "Lantern River Experience", "Short lantern boat / riverside experience after dinner.", { imageUrl: images.lanternRiver, badge: "Lanterns", provider: "GetYourGuide preferred", affiliatePriority: "High" }),
      ],
      suggestions: [
        suggestion("d4-s1", "Basket Boat + Lantern Boat Combo", "Bundled Upgrade", "Use if live provider availability combines both experiences neatly.", images.coconut),
        suggestion("d4-s2", "Private Hoi An Photographer", "Romance Upgrade", "Strong for honeymoon or couple versions.", images.hoiAn),
      ],
      notes: [
        { id: "d4-n1", icon: "hotel", title: "Base", text: "Staying in Hoi An improves the night experience." },
        { id: "d4-n2", icon: "sparkles", title: "Lanterns", text: "This is one of the plan's best visual evenings." },
        { id: "d4-n3", icon: "clock", title: "Pacing", text: "Midday rest keeps the evening enjoyable." },
      ],
    }),
    day({
      dayNumber: 5,
      title: "Cham Island - Hoi An's Ocean Escape",
      destinationLabel: "Cham Island",
      imageUrl: images.chamIsland,
      routeFrom: "Hoi An",
      routeTo: "Cham Island",
      weatherLabel: "Sea day / Moderate-high fatigue",
      quote: "Before Phu Quoc, Cham Island gives the plan a simpler local-blue ocean day.",
      description:
        "A full sea day with transfer to harbor, boat to Cham Island, snorkeling or marine-life experience, Vietnamese lunch, beach time and a slow Hoi An evening after rest.",
      items: [
        item("d5-breakfast", "restaurant", "07:00", "Breakfast", "Early breakfast before pickup.", { imageUrl: images.hoiAn, badge: "Breakfast", showButton: false, price: "" }),
        item("d5-pickup", "transportation", "08:00", "Pickup Toward Harbor", "Transfer from Hoi An hotel to the departure point.", { imageUrl: images.chamIsland, badge: "Pickup" }),
        item("d5-boat", "transportation", "08:30-09:00", "Boat to Cham Island", "Sea transfer toward Cham Island.", { imageUrl: images.chamIsland, badge: "Boat" }),
        item("d5-snorkel", "activity", "09:30-11:30", "Cham Island Snorkeling Experience", "Klook-preferred snorkeling and marine-life experience with Vietnamese lunch where available.", { imageUrl: images.chamIsland, badge: "Snorkeling", provider: "Klook preferred", affiliatePriority: "High" }),
        item("d5-lunch", "restaurant", "12:00-13:00", "Island Lunch", "Vietnamese lunch as included or locally arranged.", { imageUrl: images.chamIsland, badge: "Lunch", showButton: false, price: "" }),
        item("d5-beach", "activity", "13:00-14:30", "Beach, Swimming and Free Time", "Relaxed island beach time before return.", { imageUrl: images.chamIsland, badge: "Beach", showButton: false, price: "" }),
        item("d5-return", "transportation", "15:00-16:00", "Return to Hoi An", "Boat return and hotel transfer.", { imageUrl: images.hoiAn, badge: "Return" }),
        item("d5-evening", "activity", "18:30-20:30", "Slow Old Town Evening", "Dinner and a gentle Hoi An evening after the sea day.", { imageUrl: images.hoiAn, badge: "Evening", showButton: false, price: "" }),
      ],
      suggestions: [
        suggestion("d5-s1", "Sea Walk Upgrade", "Marine Upgrade", "Offer only if the live Cham Island product includes sea walk.", images.chamIsland),
        suggestion("d5-s2", "Private Boat Comfort Upgrade", "Comfort Upgrade", "Best for families or travelers who want more control.", images.chamIsland),
      ],
      notes: [
        { id: "d5-n1", icon: "water", title: "Ocean", text: "This sea day is different from Phu Quoc's island hopping." },
        { id: "d5-n2", icon: "sun", title: "Weather", text: "Sea conditions must be checked on customer dates." },
        { id: "d5-n3", icon: "bed", title: "Rest", text: "The evening stays intentionally slow." },
      ],
    }),
    day({
      dayNumber: 6,
      title: "Hidden Hoi An - Countryside, Rice Fields and Slow Vietnam",
      destinationLabel: "Hoi An",
      imageUrl: images.riceFields,
      routeFrom: "Hoi An",
      routeTo: "Rice fields, An Bang Beach",
      weatherLabel: "Slow day / Low fatigue",
      quote: "Rice fields, tailoring time and An Bang Beach keep the itinerary human.",
      description:
        "A deliberately calmer day after the sea: countryside cycling, rice-field views, local lunch, spa or tailor time and a sunset around An Bang Beach.",
      items: [
        item("d6-breakfast", "restaurant", "08:00-09:00", "Breakfast", "A slower morning after Cham Island.", { imageUrl: images.hoiAn, badge: "Breakfast", showButton: false, price: "" }),
        item("d6-cycling", "activity", "09:30-11:30", "Countryside Cycling and Rice Fields", "Short countryside or rice-field experience chosen from live provider availability.", { imageUrl: images.riceFields, badge: "Countryside", affiliatePriority: "Medium" }),
        item("d6-lunch", "restaurant", "12:00-13:00", "Local Lunch", "Flexible Hoi An local lunch.", { imageUrl: images.hoiAn, badge: "Lunch", showButton: false, price: "" }),
        item("d6-spa", "activity", "13:00-15:30", "Spa, Rest or Tailor Appointment", "Recovery block with optional tailor or spa appointment.", { imageUrl: images.hoiAn, badge: "Rest", showButton: false, price: "" }),
        item("d6-anbang", "activity", "16:00-18:00", "An Bang Beach", "Easy beach time and sunset near Hoi An.", { imageUrl: images.anBang, badge: "Beach", showButton: false, price: "" }),
        item("d6-dinner", "restaurant", "19:00-21:00", "Beach or Hoi An Dinner", "Dinner near An Bang or back in Hoi An.", { imageUrl: images.hoiAn, badge: "Dinner", showButton: false, price: "" }),
      ],
      suggestions: [
        suggestion("d6-s1", "My Son Sanctuary Alternative", "Culture Swap", "Replace the slow morning with My Son Sanctuary for culture-focused travelers.", images.hoiAn),
        suggestion("d6-s2", "Hoi An Cooking Class", "Food Upgrade", "Good if travelers prefer food and market culture over cycling.", images.hoiAn),
      ],
      notes: [
        { id: "d6-n1", icon: "leaf", title: "Slow Vietnam", text: "This day prevents the route from becoming tour-heavy." },
        { id: "d6-n2", icon: "beach", title: "Beach", text: "An Bang adds another calm coastal moment." },
        { id: "d6-n3", icon: "sparkles", title: "Flexible", text: "Culture and food swaps fit well here." },
      ],
    }),
    day({
      dayNumber: 7,
      title: "Hoi An to Phu Quoc - From Lantern Town to Tropical Island",
      destinationLabel: "Phu Quoc",
      imageUrl: images.phuQuoc,
      routeFrom: "Hoi An / Da Nang Airport",
      routeTo: "Phu Quoc resort",
      weatherLabel: "Flight day / Low fatigue",
      quote: "The trip leaves lantern streets behind and lands in tropical island light.",
      description:
        "Transfer from Hoi An to Da Nang Airport, fly to Phu Quoc when routes allow, then resort check-in, pool, beach and sunset. No paid excursion is scheduled on the flight day.",
      items: [
        item("d7-breakfast", "restaurant", "07:00-08:00", "Breakfast", "Simple breakfast before checkout.", { imageUrl: images.hoiAn, badge: "Breakfast", showButton: false, price: "" }),
        item("d7-checkout", "hotel", "08:30", "Hoi An Checkout", "Leave enough buffer for the airport transfer.", { imageUrl: images.hoiAn, badge: "Checkout" }),
        item("d7-airport", "transportation", "08:30-09:30", "Hoi An to Da Nang Airport", "Transfer back to Da Nang Airport.", { imageUrl: images.airport, badge: "Airport Transfer" }),
        item("d7-flight", "flight", "Midday", "Da Nang to Phu Quoc Flight", "Use a direct flight if available on customer dates; otherwise Gene rebuilds the routing.", { imageUrl: images.airport, badge: "Flight" }),
        item("d7-resort-transfer", "transportation", "14:00-15:00", "Phu Quoc Airport to Resort", "Airport exit and resort transfer.", { imageUrl: images.phuQuoc, badge: "Transfer" }),
        item("d7-hotel", "hotel", "15:00", "Regent Phu Quoc Check-In", "Luxury seed hotel for the high-end version; Pro or Standard can switch to Long Beach / Bai Truong resorts.", { imageUrl: images.phuQuoc, badge: "Hotel", affiliatePriority: "Maximum" }),
        item("d7-sunset", "activity", "17:30-18:30", "Phu Quoc Sunset", "First island sunset after the flight.", { imageUrl: images.phuQuoc, badge: "Sunset", showButton: false, price: "" }),
      ],
      suggestions: [
        suggestion("d7-s1", "Direct Flight Watch", "Flight Upgrade", "Prioritize direct Da Nang to Phu Quoc options if available.", images.airport),
        suggestion("d7-s2", "Long Beach Value Resort", "Value Swap", "A lower-cost hotel alternative while keeping island access strong.", images.phuQuoc),
      ],
      notes: [
        { id: "d7-n1", icon: "plane", title: "Flight", text: "No excursion is added on the flight day." },
        { id: "d7-n2", icon: "hotel", title: "Hotel", text: "Luxury and value hotel versions can both work." },
        { id: "d7-n3", icon: "sun", title: "Sunset", text: "The first Phu Quoc evening stays easy." },
      ],
    }),
    day({
      dayNumber: 8,
      title: "Phu Quoc Hero Day - Four Islands, Snorkeling and Cable Car",
      destinationLabel: "An Thoi Islands",
      imageUrl: images.islands,
      routeFrom: "Phu Quoc resort",
      routeTo: "An Thoi Archipelago, May Rut, Gam Ghi, Hon Thom",
      weatherLabel: "Hero island day / High fatigue",
      quote: "Turquoise water, coral stops and a cable car over the archipelago make this Vietnam's biggest blue day.",
      description:
        "The strongest affiliate day in the plan: Phu Quoc four-island speedboat tour, snorkeling, May Rut beach time and Hon Thom cable-car element depending on the chosen live product.",
      items: [
        item("d8-breakfast", "restaurant", "07:00", "Breakfast", "Early breakfast before the island tour.", { imageUrl: images.phuQuoc, badge: "Breakfast", showButton: false, price: "" }),
        item("d8-pickup", "transportation", "08:00", "Hotel Pickup", "Pickup for the Phu Quoc island-hopping tour.", { imageUrl: images.islands, badge: "Pickup" }),
        item("d8-speedboat", "transportation", "09:00", "Speedboat Departure", "Start the An Thoi archipelago route.", { imageUrl: images.islands, badge: "Speedboat" }),
        item("d8-mongtay", "activity", "09:30-10:30", "Mong Tay / Island Stop", "First island stop according to the selected provider route.", { imageUrl: images.islands, badge: "Island" }),
        item("d8-gamghi", "activity", "10:45-11:45", "Gam Ghi Island Snorkeling", "Coral reef snorkeling stop, subject to weather and provider itinerary.", { imageUrl: images.islands, badge: "Snorkeling", provider: "Klook preferred", affiliatePriority: "Maximum" }),
        item("d8-lunch", "restaurant", "12:00-13:00", "Island Lunch", "Lunch included or arranged by the selected tour.", { imageUrl: images.islands, badge: "Lunch", showButton: false, price: "" }),
        item("d8-mayrut", "activity", "13:00-14:30", "May Rut Island Beach", "White sand, beach time and swimming.", { imageUrl: images.islands, badge: "Beach", affiliatePriority: "Maximum" }),
        item("d8-cable", "activity", "15:00+", "Hon Thom Cable Car Element", "Cable-car or Aquatopia element if included in the selected product.", { imageUrl: images.honThom, badge: "Cable Car", provider: "Klook preferred", affiliatePriority: "Maximum" }),
        item("d8-return", "transportation", "17:30-18:30", "Return to Resort", "Return from the tour, shower and rest.", { imageUrl: images.phuQuoc, badge: "Return" }),
      ],
      suggestions: [
        suggestion("d8-s1", "4 Islands + Cable Car + Aquatopia", "Hero Upgrade", "Best commercial product when available for customer dates.", images.honThom),
        suggestion("d8-s2", "Private Speedboat Upgrade", "Luxury Upgrade", "Ideal for honeymooners or travelers who want more space.", images.islands),
      ],
      notes: [
        { id: "d8-n1", icon: "water", title: "Hero Day", text: "This is the strongest affiliate day in the Vietnam plan." },
        { id: "d8-n2", icon: "ticket", title: "Live Product", text: "Cable-car inclusion must match the provider product." },
        { id: "d8-n3", icon: "sun", title: "Weather", text: "Sea conditions control exact stops." },
      ],
    }),
    day({
      dayNumber: 9,
      title: "Phu Quoc Slow Luxury Day - Beach, Sunset and No Rush",
      destinationLabel: "Phu Quoc",
      imageUrl: images.phuQuoc,
      routeFrom: "Phu Quoc resort",
      routeTo: "Beach, spa and final sunset",
      weatherLabel: "Recovery / Very low fatigue",
      quote: "After the island-hopping rush, the final full day belongs to sand, shade and sunset.",
      description:
        "A low-fatigue luxury recovery day with resort beach, pool, lunch, spa or rest, optional coast exploration, final sunset and farewell dinner.",
      items: [
        item("d9-breakfast", "restaurant", "08:00-09:30", "Breakfast", "Slow island breakfast.", { imageUrl: images.phuQuoc, badge: "Breakfast", showButton: false, price: "" }),
        item("d9-beach", "activity", "09:30-12:30", "Resort Beach and Pool", "No scheduled paid activity; protect the final island rest.", { imageUrl: images.phuQuoc, badge: "Beach", showButton: false, price: "" }),
        item("d9-lunch", "restaurant", "12:30-13:30", "Lunch", "Flexible resort or beach lunch.", { imageUrl: images.phuQuoc, badge: "Lunch", showButton: false, price: "" }),
        item("d9-spa", "activity", "13:30-15:30", "Spa or Rest", "Optional spa/rest block.", { imageUrl: images.phuQuoc, badge: "Spa", showButton: false, price: "" }),
        item("d9-explore", "activity", "16:00-17:00", "Optional Coastal Exploration", "Light coastal exploration if the traveler wants one last outing.", { imageUrl: images.phuQuoc, badge: "Explore", showButton: false, price: "" }),
        item("d9-sunset", "activity", "17:15-18:30", "Final Phu Quoc Sunset", "The last golden island moment.", { imageUrl: images.phuQuoc, badge: "Sunset", showButton: false, price: "" }),
        item("d9-dinner", "restaurant", "19:00-21:00", "Farewell Dinner", "Final Vietnam dinner.", { imageUrl: images.seafood, badge: "Dinner", showButton: false, price: "" }),
      ],
      suggestions: [
        suggestion("d9-s1", "Trip 3: Three Islands by Boat", "Adventure Upgrade", "Optional extra sea day for travelers who want more island-hopping.", images.islands),
        suggestion("d9-s2", "Private Sunset Dinner", "Romance Upgrade", "Strong honeymoon add-on if available through hotel or provider inventory.", images.phuQuoc),
      ],
      notes: [
        { id: "d9-n1", icon: "bed", title: "Recovery", text: "Do not force another full tour by default." },
        { id: "d9-n2", icon: "water", title: "Optional", text: "Three-island tour is an upgrade, not the base plan." },
        { id: "d9-n3", icon: "sun", title: "Farewell", text: "Sunset is the day's emotional anchor." },
      ],
    }),
    day({
      dayNumber: 10,
      title: "Departure - Final Swim and Airport Buffer",
      destinationLabel: "Phu Quoc",
      imageUrl: images.phuQuoc,
      routeFrom: "Phu Quoc resort",
      routeTo: "Phu Quoc Airport",
      weatherLabel: "Departure / Low fatigue",
      quote: "The trip ends simply: breakfast, one last swim and a calm airport buffer.",
      description:
        "Departure day with breakfast, final swim or packing, checkout, airport transfer and a generous flight buffer. No paid activity is scheduled.",
      items: [
        item("d10-breakfast", "restaurant", "07:30-09:00", "Breakfast", "Final resort breakfast.", { imageUrl: images.phuQuoc, badge: "Breakfast", showButton: false, price: "" }),
        item("d10-swim", "activity", "09:00-10:30", "Final Swim and Packing", "Gentle final beach or pool time before checkout.", { imageUrl: images.phuQuoc, badge: "Beach", showButton: false, price: "" }),
        item("d10-checkout", "hotel", "11:00-12:00", "Hotel Checkout", "Checkout timing depends on the resort policy.", { imageUrl: images.phuQuoc, badge: "Checkout" }),
        item("d10-transfer", "transportation", "Flight dependent", "Resort to Phu Quoc Airport", "Gene calculates the transfer and 2.5-3 hour buffer for international departures when needed.", { imageUrl: images.airport, badge: "Airport Transfer" }),
        item("d10-departure", "flight", "Flight dependent", "Departure from Phu Quoc", "Flight details are selected live based on the customer itinerary.", { imageUrl: images.airport, badge: "Departure" }),
      ],
      suggestions: [
        suggestion("d10-s1", "Late Checkout Request", "Comfort Upgrade", "Useful if the departure flight is later in the day.", images.phuQuoc),
        suggestion("d10-s2", "Airport Fast Track", "Airport Upgrade", "Offer only if a verified service is available for the travel date.", images.airport),
      ],
      notes: [
        { id: "d10-n1", icon: "plane", title: "Buffer", text: "Airport buffer depends on flight type and hotel location." },
        { id: "d10-n2", icon: "sun", title: "No Rush", text: "No paid excursion is added." },
        { id: "d10-n3", icon: "bag", title: "Departure", text: "Packing time is protected." },
      ],
    }),
  ];

  return {
    hero: {
      backgroundImage: images.hero,
      title: PLAN_TITLE,
      subtitle:
        "Begin beside Vietnam's golden central coast, rise above the clouds on the Golden Bridge, drift through lantern-lit Hoi An, snorkel off Cham Island, then fly south for tropical Phu Quoc sunsets.",
      stats: [
        { label: "Days", value: "10" },
        { label: "Countries", value: "1" },
        { label: "Cities", value: "3" },
        { label: "Travelers", value: "2" },
        { label: "Trip Style", value: "Beach + Island" },
      ],
      primaryCtaText: "Plan Smarter With AI",
      primaryCtaHref: "/start-planning",
      secondaryCtaText: "View Full Timeline",
    },
    journeyOverview: {
      title: "Journey Overview",
      startPoint: "Da Nang International Airport",
      destinations: "Da Nang, Hoi An, Cham Island, Phu Quoc, An Thoi Islands",
      tripStyle: "Beach, Island, Culture, Adventure, Romance, Snorkeling, Luxury",
      travelers: "2 Adults",
      estimatedCost: "Live pricing",
      aiScore: "4.9",
    },
    days,
    footer: {
      backgroundImage: images.phuQuoc,
      title: "Your Vietnam journey, but smarter.",
      subtitle: "Let Gene balance golden coast energy, lantern nights and tropical island recovery.",
      ctaText: "Plan Smarter With AI",
      ctaHref: "/start-planning",
    },
  };
}

function buildDaysJson(content) {
  return content.days.map((entry) => ({
    day: entry.dayNumber,
    title: entry.title,
    theme: entry.description,
    imageUrl: entry.heroImage,
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
    location: "Da Nang, Hoi An, Cham Island, Phu Quoc",
    days: content.days.length,
    image_url: images.hero,
    created_at: timestamp,
    subtitle:
      "10 days from Da Nang's golden coast to Hoi An lantern nights and Phu Quoc's blue island finale.",
    country: "Vietnam",
    city: "Da Nang, Hoi An, Phu Quoc",
    destination: "Vietnam",
    style: "Beach, Island, Culture, Adventure, Romance, Snorkeling, Luxury",
    daysCount: content.days.length,
    heroImage: images.hero,
    coverImage: images.phuQuoc,
    summary:
      "A 10-day Vietnam Ready Plan built around Da Nang beaches, Ba Na Hills and Golden Bridge, Hoi An lanterns, coconut basket boats, Cham Island snorkeling and Phu Quoc island-hopping.",
    seoTitle: PLAN_TITLE,
    seoDescription:
      "Draft ready plan for Vietnam: Golden Coast, Lantern Nights and Phu Quoc Blue with Da Nang, Hoi An, Cham Island and Phu Quoc.",
    tags: ["Vietnam", "Da Nang", "Hoi An", "Phu Quoc", "Golden Bridge", "Cham Island", "Beach", "Snorkeling", "Luxury"],
    season: "Dry season preferred",
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
  console.error("INSERT_VIETNAM_GOLDEN_COAST_READY_PLAN_FAILED");
  console.error(error);
  process.exit(1);
});
