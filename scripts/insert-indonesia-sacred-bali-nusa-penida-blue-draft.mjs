import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import crypto from "node:crypto";

const SOURCE_ENV_PATH = new URL("../.env", import.meta.url);
const SLUG = "indonesia-sacred-bali-nusa-penida-blue";
const PLAN_TITLE = "Indonesia: Sacred Bali & Nusa Penida Blue";

const commons = (fileName, width = 1280) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}?width=${width}`;

const images = {
  hero: commons("Kelingking Beach Nusa Penida Bali Indonesia.jpg", 1440),
  airport: commons("Ngurah Rai International Airport Bali.jpg", 1280),
  sanur: commons("Sanur Beach Bali Indonesia.jpg", 1280),
  andaz: commons("Sanur Beach Bali Indonesia.jpg", 1280),
  nusaPenida: commons("Kelingking Beach Nusa Penida Bali Indonesia.jpg", 1440),
  brokenBeach: commons("Broken Beach Nusa Penida Bali.jpg", 1280),
  manta: commons("Manta ray Nusa Penida Bali.jpg", 1280),
  riceTerrace: commons("Tegalalang Rice Terrace Ubud Bali.jpg", 1280),
  ubud: commons("Ubud Bali rice fields.jpg", 1280),
  batur: commons("Mount Batur sunrise Bali Indonesia.jpg", 1440),
  blackLava: commons("Mount Batur black lava Bali.jpg", 1280),
  monkeyForest: commons("Sacred Monkey Forest Sanctuary Ubud Bali.jpg", 1280),
  waterfall: commons("Tegenungan Waterfall Bali Indonesia.jpg", 1280),
  uluwatu: commons("Uluwatu Temple Bali sunset.jpg", 1440),
  kecak: commons("Kecak dance Uluwatu Bali.jpg", 1280),
  southBeach: commons("Melasti Beach Bali Indonesia.jpg", 1280),
  dinner: commons("Jimbaran seafood Bali.jpg", 1280),
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
    countryLabel: "Indonesia",
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
      title: "Arrival in Bali - Sanur Soft Landing",
      destinationLabel: "Sanur",
      imageUrl: images.sanur,
      routeFrom: "Ngurah Rai International Airport",
      routeTo: "Sanur beachfront hotel",
      weatherLabel: "Arrival / Low fatigue",
      quote: "Bali begins softly: airport arrival, warm coast air and Sanur's calm shoreline.",
      description:
        "A gentle arrival day with immigration buffer, transfer to Sanur, Andaz Bali check-in, rest, pool time, sunset beachfront walk and an easy coastal dinner.",
      items: [
        item("d1-arrival", "flight", "14:00", "Arrival at Ngurah Rai International Airport", "Land in Bali. Flight details remain flexible until customer travel dates are selected.", { imageUrl: images.airport, badge: "Arrival", showButton: false, price: "" }),
        item("d1-buffer", "transportation", "14:00-15:00", "Immigration, Baggage and Airport Buffer", "One-hour arrival allowance before leaving the airport.", { imageUrl: images.airport, badge: "Airport", showButton: false, price: "" }),
        item("d1-transfer", "transportation", "15:00-15:45", "Airport to Sanur", "Use live map timing because Bali traffic can change transfer duration significantly.", { imageUrl: images.sanur, badge: "Transfer" }),
        item("d1-hotel", "hotel", "16:00", "Andaz Bali Check-In", "Suggested Sanur beachfront base for three nights with official check-in around 15:00.", { imageUrl: images.andaz, badge: "Hotel", affiliatePriority: "High" }),
        item("d1-rest", "activity", "16:00-17:30", "Rest, Shower and Pool", "No paid excursion on arrival day.", { imageUrl: images.andaz, badge: "Rest", showButton: false, price: "" }),
        item("d1-walk", "activity", "17:30-18:45", "Sanur Beachfront Sunset Walk", "A quiet first sunset on Bali's east coast.", { imageUrl: images.sanur, badge: "Beach", showButton: false, price: "" }),
        item("d1-dinner", "restaurant", "19:00-20:30", "Sanur Coastal Dinner", "Flexible dinner in the beachfront area.", { imageUrl: images.sanur, badge: "Dinner", showButton: false, price: "" }),
      ],
      suggestions: [
        suggestion("d1-s1", "Private Airport Transfer", "Comfort Upgrade", "Useful after a long-haul arrival with luggage.", images.airport),
        suggestion("d1-s2", "Sanur Welcome Dinner", "Food Add-On", "A calm first-night dinner option if live restaurant availability fits.", images.sanur),
      ],
      notes: [
        { id: "d1-n1", icon: "plane", title: "Arrival", text: "No paid excursion is scheduled after landing." },
        { id: "d1-n2", icon: "sun", title: "Sunset", text: "Sanur gives the plan a gentle coastal opening." },
        { id: "d1-n3", icon: "route", title: "Traffic", text: "Transfer timing should come from live maps." },
      ],
    }),
    day({
      dayNumber: 2,
      title: "Nusa Penida Hero Day - Manta Coast, Kelingking and Broken Beach",
      destinationLabel: "Nusa Penida",
      imageUrl: images.nusaPenida,
      routeFrom: "Sanur",
      routeTo: "Manta Point, Kelingking, Broken Beach, Angel's Billabong",
      weatherLabel: "Hero excursion / High fatigue",
      quote: "Turquoise water, wild cliffs and the manta coast make this Bali's first major hero day.",
      description:
        "A full Nusa Penida day built around a guided marine portion, Manta Point or Gamat Bay snorkeling, Kelingking viewpoint, Broken Beach and Angel's Billabong.",
      items: [
        item("d2-breakfast", "restaurant", "06:30", "Breakfast", "Early breakfast before the harbor transfer.", { imageUrl: images.andaz, badge: "Breakfast", showButton: false, price: "" }),
        item("d2-transfer", "transportation", "07:00", "Hotel to Sanur Harbor", "Transfer from Sanur hotel to fast-boat check-in.", { imageUrl: images.sanur, badge: "Harbor Transfer" }),
        item("d2-boat", "transportation", "08:30", "Fast Boat to Nusa Penida", "Fast-boat crossing with boarding buffer.", { imageUrl: images.nusaPenida, badge: "Boat" }),
        item("d2-snorkel", "activity", "09:00-11:30", "Manta Point Snorkel Boat and West Coast Tour", "GetYourGuide or Klook preferred hero product. Manta sightings are wildlife-based and never guaranteed.", { imageUrl: images.manta, badge: "Hero Tour", provider: "GetYourGuide / Klook", affiliatePriority: "Maximum" }),
        item("d2-lunch", "restaurant", "12:00-13:00", "Lunch and Rest", "Short lunch buffer before the cliff viewpoints.", { imageUrl: images.nusaPenida, badge: "Lunch", showButton: false, price: "" }),
        item("d2-kelingking", "activity", "13:00-14:00", "Kelingking Beach Viewpoint", "The day's strongest cliff image and Gene card candidate.", { imageUrl: images.nusaPenida, badge: "Cliff View", affiliatePriority: "Maximum" }),
        item("d2-broken", "activity", "14:15-15:00", "Broken Beach", "West coast viewpoint and dramatic natural arch scenery.", { imageUrl: images.brokenBeach, badge: "Viewpoint" }),
        item("d2-billabong", "activity", "15:00-15:40", "Angel's Billabong Viewpoint", "Final west-coast viewpoint before returning toward harbor.", { imageUrl: images.brokenBeach, badge: "Viewpoint" }),
        item("d2-return", "transportation", "17:00-18:00", "Fast Boat Return to Sanur", "Return crossing and transfer back to the hotel.", { imageUrl: images.sanur, badge: "Return" }),
      ],
      suggestions: [
        suggestion("d2-s1", "Private Nusa Penida Upgrade", "Comfort Upgrade", "Better pacing and less waiting on a demanding excursion day.", images.nusaPenida),
        suggestion("d2-s2", "East + West Nusa Penida Split", "Island Lover", "Best if the customer adds a real overnight on Nusa Penida.", images.brokenBeach),
      ],
      notes: [
        { id: "d2-n1", icon: "water", title: "Hero Product", text: "Treat this as Hero Product #1 for affiliate priority." },
        { id: "d2-n2", icon: "wildlife", title: "Mantas", text: "Manta sightings are not guaranteed." },
        { id: "d2-n3", icon: "clock", title: "Pacing", text: "No Uluwatu or second major tour today." },
      ],
    }),
    day({
      dayNumber: 3,
      title: "Slow Bali Coast - Beach Recovery and Bali Lifestyle",
      destinationLabel: "Sanur",
      imageUrl: images.sanur,
      routeFrom: "Andaz Bali",
      routeTo: "Sanur Beach and promenade",
      weatherLabel: "Recovery / Very low fatigue",
      quote: "After Nusa Penida, the best luxury is space: beach, pool and unhurried Sanur light.",
      description:
        "A deliberately slow recovery day with Sanur Beach, pool, lunch, spa or free time, coastal cafés, promenade walk, sunset and dinner.",
      items: [
        item("d3-breakfast", "restaurant", "08:00-09:30", "Breakfast", "Late breakfast after the full Nusa Penida day.", { imageUrl: images.andaz, badge: "Breakfast", showButton: false, price: "" }),
        item("d3-beach", "activity", "09:30-12:00", "Sanur Beach and Hotel Pool", "Beach and pool time without major transport.", { imageUrl: images.sanur, badge: "Beach", showButton: false, price: "" }),
        item("d3-lunch", "restaurant", "12:00-13:00", "Lunch", "Flexible Sanur lunch.", { imageUrl: images.sanur, badge: "Lunch", showButton: false, price: "" }),
        item("d3-spa", "activity", "13:00-15:00", "Rest, Spa or Free Time", "Recovery block after the previous day.", { imageUrl: images.andaz, badge: "Rest", showButton: false, price: "" }),
        item("d3-cafes", "activity", "15:30-17:30", "Coastal Cafes and Sanur Promenade", "Low-pressure lifestyle block along the coast.", { imageUrl: images.sanur, badge: "Lifestyle", showButton: false, price: "" }),
        item("d3-sunset", "activity", "18:00-19:00", "Sunset", "Simple sunset moment before dinner.", { imageUrl: images.sanur, badge: "Sunset", showButton: false, price: "" }),
      ],
      suggestions: [
        suggestion("d3-s1", "Sanur Coastal Snorkeling", "Short Add-On", "Optional short provider activity for travelers who do not want a full rest day.", images.sanur),
        suggestion("d3-s2", "Spa Recovery Upgrade", "Wellness", "Good for honeymoon or luxury versions.", images.andaz),
      ],
      notes: [
        { id: "d3-n1", icon: "bed", title: "Recovery", text: "This day protects the trip from becoming exhausting." },
        { id: "d3-n2", icon: "water", title: "Coast", text: "Sanur works because the hotel is already beachfront." },
        { id: "d3-n3", icon: "sparkles", title: "Optional", text: "Snorkeling is an AI suggestion, not the default." },
      ],
    }),
    day({
      dayNumber: 4,
      title: "Sanur to Ubud - Rice Terraces and Sacred Bali",
      destinationLabel: "Ubud",
      imageUrl: images.riceTerrace,
      routeFrom: "Sanur",
      routeTo: "Tegallalang Rice Terraces and Ubud",
      weatherLabel: "Transfer + nature / Moderate fatigue",
      quote: "The route turns inland: ocean air gives way to rice terraces and emerald Ubud.",
      description:
        "A transition day from Sanur to Ubud, using the route for Tegallalang Rice Terraces, lunch, hotel check-in, rest and an easy Ubud center evening.",
      items: [
        item("d4-checkout", "hotel", "09:00", "Andaz Bali Checkout and Bags Ready", "Early checkout is recommended even though official checkout may be later.", { imageUrl: images.andaz, badge: "Checkout" }),
        item("d4-transfer", "transportation", "09:15-10:30", "Sanur to Ubud Area", "Transfer inland with Bali traffic buffer.", { imageUrl: images.riceTerrace, badge: "Transfer" }),
        item("d4-rice", "activity", "10:45-12:15", "Tegallalang Rice Terraces", "Light walking, photos and landscape time.", { imageUrl: images.riceTerrace, badge: "Nature", affiliatePriority: "Medium" }),
        item("d4-lunch", "restaurant", "12:30-13:30", "Lunch", "Flexible lunch before hotel check-in.", { imageUrl: images.ubud, badge: "Lunch", showButton: false, price: "" }),
        item("d4-hotel", "hotel", "15:00", "Mandapa, a Ritz-Carlton Reserve Check-In", "Premium Ubud seed hotel in Kedewatan on the Ayung River.", { imageUrl: images.ubud, badge: "Hotel", affiliatePriority: "High" }),
        item("d4-rest", "activity", "15:00-17:00", "Rest", "Hotel recovery after the transfer and terrace visit.", { imageUrl: images.ubud, badge: "Rest", showButton: false, price: "" }),
        item("d4-center", "activity", "17:15-18:30", "Ubud Center / Palace Area", "Easy evening around central Ubud.", { imageUrl: images.ubud, badge: "Culture", showButton: false, price: "" }),
      ],
      suggestions: [
        suggestion("d4-s1", "Rice Terrace Photographer", "Photography Upgrade", "Best for couples or premium versions.", images.riceTerrace),
        suggestion("d4-s2", "Ubud Private Transfer with Stops", "Comfort Upgrade", "Useful if travelers want cleaner pacing between hotels.", images.riceTerrace),
      ],
      notes: [
        { id: "d4-n1", icon: "route", title: "Contrast", text: "Ocean to rice terraces gives the plan a strong shift." },
        { id: "d4-n2", icon: "hotel", title: "Check-In", text: "Ubud check-in target stays around 15:00." },
        { id: "d4-n3", icon: "leaf", title: "Sacred Bali", text: "This starts the nature-focused middle section." },
      ],
    }),
    day({
      dayNumber: 5,
      title: "Mount Batur Sunrise - Volcano Morning Without Overpacking",
      destinationLabel: "Mount Batur",
      imageUrl: images.batur,
      routeFrom: "Ubud",
      routeTo: "Kintamani and Mount Batur black lava",
      weatherLabel: "Sunrise / Medium-high fatigue",
      quote: "Before the island wakes, the volcano turns gold above the Kintamani highlands.",
      description:
        "An early Mount Batur Jeep sunrise day with photographer-style product preference, black-lava scenery and a mandatory afternoon recovery block.",
      items: [
        item("d5-pickup", "transportation", "03:00-03:30", "Hotel Pickup", "Pickup time depends on the live Mount Batur product and hotel location.", { imageUrl: images.batur, badge: "Pickup" }),
        item("d5-sunrise", "activity", "05:30-06:30", "Mount Batur Sunrise Jeep Viewpoint", "Klook-preferred 4WD Jeep sunrise experience for travelers who want sunrise without trekking.", { imageUrl: images.batur, badge: "Sunrise", provider: "Klook preferred", affiliatePriority: "High" }),
        item("d5-breakfast", "restaurant", "06:30-07:30", "Light Breakfast / Refreshments", "Included only if confirmed by the selected provider package.", { imageUrl: images.batur, badge: "Breakfast", showButton: false, price: "" }),
        item("d5-lava", "activity", "07:30-08:30", "Black-Lava Scenery", "Volcanic landscape stop when included in the selected package.", { imageUrl: images.blackLava, badge: "Volcano" }),
        item("d5-return", "transportation", "09:00-10:30", "Return to Ubud", "Return transfer to the Ubud hotel.", { imageUrl: images.ubud, badge: "Return" }),
        item("d5-recovery", "activity", "13:00-17:00", "Mandatory Recovery Block", "No second tour is scheduled after the sunrise start.", { imageUrl: images.ubud, badge: "Recovery", showButton: false, price: "" }),
        item("d5-dinner", "restaurant", "17:30-19:00", "Easy Ubud Dinner", "Early dinner and early night.", { imageUrl: images.ubud, badge: "Dinner", showButton: false, price: "" }),
      ],
      suggestions: [
        suggestion("d5-s1", "Mount Batur Sunrise Trek Swap", "Adventure Upgrade", "Offer only for travelers who actively want trekking.", images.batur),
        suggestion("d5-s2", "Hot Springs Recovery", "Wellness Add-On", "Add only if timing and provider availability keep the afternoon light.", images.batur),
      ],
      notes: [
        { id: "d5-n1", icon: "clock", title: "Early Start", text: "The day starts around 03:00-03:30." },
        { id: "d5-n2", icon: "bed", title: "Recovery", text: "The afternoon is intentionally protected." },
        { id: "d5-n3", icon: "mountain", title: "Jeep", text: "Jeep sunrise is adventure-light, not a hard trek." },
      ],
    }),
    day({
      dayNumber: 6,
      title: "Ubud Icons - Temple, Jungle and Waterfall",
      destinationLabel: "Ubud",
      imageUrl: images.monkeyForest,
      routeFrom: "Ubud hotel",
      routeTo: "Monkey Forest, Ubud/Gianyar waterfall",
      weatherLabel: "Ubud sightseeing / Moderate fatigue",
      quote: "Jungle paths, temple energy and waterfall mist keep Ubud vivid but not overcrowded.",
      description:
        "A moderate Ubud icons day beginning later after Mount Batur: Monkey Forest or central Ubud area, lunch, one waterfall chosen by weather and crowds, coffee/rest and hotel pool time.",
      items: [
        item("d6-breakfast", "restaurant", "08:30-09:30", "Breakfast", "Late start to compensate for the sunrise day.", { imageUrl: images.ubud, badge: "Breakfast", showButton: false, price: "" }),
        item("d6-monkey", "activity", "10:15-11:30", "Sacred Monkey Forest / Central Ubud Area", "Ubud jungle-temple atmosphere without overloading the day.", { imageUrl: images.monkeyForest, badge: "Jungle", affiliatePriority: "Medium" }),
        item("d6-lunch", "restaurant", "12:00-13:00", "Lunch", "Flexible Ubud lunch.", { imageUrl: images.ubud, badge: "Lunch", showButton: false, price: "" }),
        item("d6-transfer", "transportation", "13:00-13:45", "Transfer to Waterfall Area", "Transfer to the waterfall chosen from live conditions.", { imageUrl: images.waterfall, badge: "Transfer" }),
        item("d6-waterfall", "activity", "14:00-15:30", "Ubud / Gianyar Waterfall Stop", "Gene chooses the exact waterfall based on weather, crowding and route fit.", { imageUrl: images.waterfall, badge: "Waterfall" }),
        item("d6-coffee", "activity", "15:30-16:30", "Coffee / Rest Stop", "Light pause before returning to the hotel.", { imageUrl: images.ubud, badge: "Coffee", showButton: false, price: "" }),
        item("d6-pool", "activity", "17:00-18:30", "Pool and Rest", "Hotel recovery before dinner.", { imageUrl: images.ubud, badge: "Rest", showButton: false, price: "" }),
      ],
      suggestions: [
        suggestion("d6-s1", "Ubud Private Highlights Tour", "Guided Upgrade", "Good if travelers prefer guided structure.", images.monkeyForest),
        suggestion("d6-s2", "Bali Swing Photo Add-On", "Photo Upgrade", "Offer only if it does not overcrowd the day.", images.riceTerrace),
      ],
      notes: [
        { id: "d6-n1", icon: "leaf", title: "Not Overpacked", text: "Avoid stacking five temples and waterfalls in one day." },
        { id: "d6-n2", icon: "water", title: "Weather", text: "Waterfall choice depends on actual conditions." },
        { id: "d6-n3", icon: "bed", title: "Rest", text: "Pool time remains part of the plan." },
      ],
    }),
    day({
      dayNumber: 7,
      title: "Ubud to Uluwatu - From Jungle to Clifftop Bali",
      destinationLabel: "South Bali / Uluwatu",
      imageUrl: images.southBeach,
      routeFrom: "Ubud",
      routeTo: "South Bali and Uluwatu",
      weatherLabel: "Transfer + coast / Low-moderate fatigue",
      quote: "The route leaves the jungle and opens toward Bali's southern cliffs.",
      description:
        "A transfer day from Ubud to South Bali with traffic buffer, lunch, Renaissance Bali Uluwatu check-in, pool recovery and a light Bingin, Balangan or Gunung Payung coastal evening.",
      items: [
        item("d7-breakfast", "restaurant", "07:30-08:30", "Breakfast", "Simple breakfast before moving south.", { imageUrl: images.ubud, badge: "Breakfast", showButton: false, price: "" }),
        item("d7-checkout", "hotel", "09:00", "Ubud Checkout", "Bags ready and departure from Ubud.", { imageUrl: images.ubud, badge: "Checkout" }),
        item("d7-transfer", "transportation", "09:00-11:30", "Ubud to South Bali / Uluwatu", "Traffic-buffered transfer to the south coast.", { imageUrl: images.southBeach, badge: "Transfer" }),
        item("d7-lunch", "restaurant", "11:30-12:30", "Lunch", "Lunch before hotel check-in.", { imageUrl: images.southBeach, badge: "Lunch", showButton: false, price: "" }),
        item("d7-hotel", "hotel", "15:00", "Renaissance Bali Uluwatu Resort & Spa Check-In", "Suggested two-night South Bali base close to Uluwatu Temple, Bingin and Gunung Payung.", { imageUrl: images.southBeach, badge: "Hotel", affiliatePriority: "Medium" }),
        item("d7-pool", "activity", "15:00-17:00", "Pool and Recovery", "Protect energy after the long transfer.", { imageUrl: images.southBeach, badge: "Rest", showButton: false, price: "" }),
        item("d7-coast", "activity", "17:00-18:30", "Bingin / Balangan Coastal Area", "Light coastal evening depending on traffic.", { imageUrl: images.southBeach, badge: "Coast", showButton: false, price: "" }),
      ],
      suggestions: [
        suggestion("d7-s1", "Nusa Dua Luxury Swap", "Luxury Alternative", "Use The Ritz-Carlton Bali style ending for travelers who prefer resort polish.", images.southBeach),
        suggestion("d7-s2", "Private South Bali Transfer", "Comfort Upgrade", "Useful due to Bali traffic and luggage.", images.southBeach),
      ],
      notes: [
        { id: "d7-n1", icon: "route", title: "Traffic", text: "Ubud to Uluwatu needs a generous road buffer." },
        { id: "d7-n2", icon: "hotel", title: "Check-In", text: "Official check-in target is 15:00." },
        { id: "d7-n3", icon: "water", title: "Coast", text: "The evening stays light before the finale." },
      ],
    }),
    day({
      dayNumber: 8,
      title: "Bali Finale - South Bali Beach, Uluwatu Sunset and Kecak",
      destinationLabel: "Uluwatu",
      imageUrl: images.uluwatu,
      routeFrom: "South Bali hotel",
      routeTo: "Melasti / Bingin / Gunung Payung, Uluwatu Temple",
      weatherLabel: "Finale / Moderate fatigue",
      quote: "Cliffs, ocean, sunset and fire dance give Bali its cinematic finale.",
      description:
        "Hero Day #2: a relaxed South Bali beach block, hotel rest, Uluwatu Temple cliff views, sunset positioning, Kecak performance and dinner around South Bali or Jimbaran.",
      items: [
        item("d8-breakfast", "restaurant", "08:00-09:30", "Breakfast", "Slow final full-day breakfast.", { imageUrl: images.southBeach, badge: "Breakfast", showButton: false, price: "" }),
        item("d8-beach", "activity", "10:00-12:30", "South Bali Beach Block", "Gene chooses Melasti, Bingin or Gunung Payung based on weather, traffic and traveler style.", { imageUrl: images.southBeach, badge: "Beach", showButton: false, price: "" }),
        item("d8-lunch", "restaurant", "12:30-13:30", "Lunch", "Flexible South Bali lunch.", { imageUrl: images.southBeach, badge: "Lunch", showButton: false, price: "" }),
        item("d8-rest", "activity", "13:30-15:30", "Hotel Rest", "Recovery before the Uluwatu evening.", { imageUrl: images.southBeach, badge: "Rest", showButton: false, price: "" }),
        item("d8-transfer", "transportation", "15:30", "Transfer to Uluwatu", "Transfer toward Uluwatu Temple.", { imageUrl: images.uluwatu, badge: "Transfer" }),
        item("d8-temple", "activity", "16:00-17:30", "Uluwatu Temple and Cliff Views", "Temple and cliff scenery before sunset.", { imageUrl: images.uluwatu, badge: "Temple", affiliatePriority: "Maximum" }),
        item("d8-kecak", "event", "18:00-19:00", "Uluwatu Kecak Fire Dance", "Viator-preferred sunset and Kecak product or private Uluwatu evening tour.", { imageUrl: images.kecak, badge: "Kecak", provider: "Viator preferred", affiliatePriority: "Maximum" }),
        item("d8-dinner", "restaurant", "19:30-21:00", "South Bali / Jimbaran Dinner", "Dinner according to selected tour flow and timing.", { imageUrl: images.dinner, badge: "Dinner", showButton: false, price: "" }),
      ],
      suggestions: [
        suggestion("d8-s1", "Private Uluwatu Temple Kecak Fire Dance Evening Tour", "Private Upgrade", "Premium alternative for better pacing and transport comfort.", images.kecak),
        suggestion("d8-s2", "Jimbaran Seafood Finale", "Food Upgrade", "Strong ending if live availability and timing fit.", images.dinner),
      ],
      notes: [
        { id: "d8-n1", icon: "sun", title: "Finale", text: "This is Hero Product #2 for affiliate priority." },
        { id: "d8-n2", icon: "ticket", title: "Tickets", text: "Kecak session and ticket timing must be checked live." },
        { id: "d8-n3", icon: "water", title: "Beach", text: "Beach choice depends on traffic and weather." },
      ],
    }),
    day({
      dayNumber: 9,
      title: "Departure - Pool, Packing and Airport Transfer",
      destinationLabel: "South Bali",
      imageUrl: images.southBeach,
      routeFrom: "South Bali hotel",
      routeTo: "Ngurah Rai International Airport",
      weatherLabel: "Departure / Low fatigue",
      quote: "The final morning stays clean: breakfast, pool, bags and a calm airport buffer.",
      description:
        "Departure day with breakfast, pool or packing, official checkout, airport transfer based on flight time and no paid excursion.",
      items: [
        item("d9-breakfast", "restaurant", "07:30-09:00", "Breakfast", "Final Bali breakfast.", { imageUrl: images.southBeach, badge: "Breakfast", showButton: false, price: "" }),
        item("d9-pool", "activity", "09:00-10:30", "Pool and Packing", "Final relaxed block before checkout.", { imageUrl: images.southBeach, badge: "Pool", showButton: false, price: "" }),
        item("d9-checkout", "hotel", "12:00", "Hotel Checkout", "Official checkout target around noon.", { imageUrl: images.southBeach, badge: "Checkout" }),
        item("d9-transfer", "transportation", "Flight dependent", "Hotel to Ngurah Rai International Airport", "Airport transfer timing depends on the customer's flight and Bali traffic.", { imageUrl: images.airport, badge: "Airport Transfer" }),
        item("d9-departure", "flight", "Flight dependent", "Departure from Bali", "No paid activity is added on departure day.", { imageUrl: images.airport, badge: "Departure" }),
      ],
      suggestions: [
        suggestion("d9-s1", "Late Checkout Request", "Comfort Upgrade", "Useful for later flights.", images.southBeach),
        suggestion("d9-s2", "Airport Fast Track", "Airport Upgrade", "Offer only if a verified airport service is available.", images.airport),
      ],
      notes: [
        { id: "d9-n1", icon: "bag", title: "Departure", text: "No excursion on the departure day." },
        { id: "d9-n2", icon: "clock", title: "Buffer", text: "Airport timing should use live traffic." },
        { id: "d9-n3", icon: "sun", title: "Easy End", text: "Keep the morning calm." },
      ],
    }),
  ];

  return {
    hero: {
      backgroundImage: images.hero,
      title: PLAN_TITLE,
      subtitle:
        "Wake beside Bali's tropical coast, cross turquoise water to Nusa Penida's dramatic cliffs, chase sunrise beneath Mount Batur, disappear into Ubud's emerald landscape, then finish above the Indian Ocean beneath Uluwatu's glowing sunset.",
      stats: [
        { label: "Days", value: "9" },
        { label: "Countries", value: "1" },
        { label: "Cities", value: "4" },
        { label: "Travelers", value: "2" },
        { label: "Trip Style", value: "Island + Sacred Bali" },
      ],
      primaryCtaText: "Plan Smarter With AI",
      primaryCtaHref: "/start-planning",
      secondaryCtaText: "View Full Timeline",
    },
    journeyOverview: {
      title: "Journey Overview",
      startPoint: "Ngurah Rai International Airport",
      destinations: "Sanur, Nusa Penida, Ubud, Mount Batur, Uluwatu",
      tripStyle: "Beach, Island, Nature, Culture, Luxury, Adventure-light, Honeymoon",
      travelers: "2 Adults",
      estimatedCost: "Live pricing",
      aiScore: "4.9",
    },
    days,
    footer: {
      backgroundImage: images.uluwatu,
      title: "Your Bali journey, but smarter.",
      subtitle: "Let Gene balance sacred landscapes, island blues and a cinematic clifftop finale.",
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
    location: "Sanur, Nusa Penida, Ubud, Mount Batur, Uluwatu",
    days: content.days.length,
    image_url: images.hero,
    created_at: timestamp,
    subtitle: "9 days from Sanur's soft coast to Nusa Penida cliffs, Ubud jungle and Uluwatu sunset fire.",
    country: "Indonesia",
    city: "Sanur, Nusa Penida, Ubud, Uluwatu",
    destination: "Indonesia",
    style: "Beach, Island, Nature, Culture, Luxury, Adventure-light, Honeymoon",
    daysCount: content.days.length,
    heroImage: images.hero,
    coverImage: images.uluwatu,
    summary:
      "A 9-day Indonesia Ready Plan built around Sanur, Nusa Penida, Mount Batur, Ubud and South Bali's Uluwatu finale.",
    seoTitle: PLAN_TITLE,
    seoDescription:
      "Draft ready plan for Indonesia: Sacred Bali and Nusa Penida Blue with Sanur, Nusa Penida, Ubud, Mount Batur and Uluwatu.",
    tags: ["Indonesia", "Bali", "Sanur", "Nusa Penida", "Ubud", "Mount Batur", "Uluwatu", "Beach", "Luxury"],
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
  console.error("INSERT_INDONESIA_READY_PLAN_FAILED");
  console.error(error);
  process.exit(1);
});
