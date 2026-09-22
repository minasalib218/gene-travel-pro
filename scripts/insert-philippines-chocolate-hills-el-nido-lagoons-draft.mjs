import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import crypto from "node:crypto";

const SOURCE_ENV_PATH = new URL("../.env", import.meta.url);
const SLUG = "philippines-chocolate-hills-island-blues-el-nido-lagoons";
const PLAN_TITLE = "Philippines: Chocolate Hills, Island Blues & El Nido Lagoons";

const commons = (fileName, width = 1280) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}?width=${width}`;

const images = {
  hero: commons("Big Lagoon at El Nido, Palawan, Philippines.jpg", 1440),
  mactan: commons("BB Blue Waters Mactan beach 2.jpg", 1280),
  cebu: commons("Magellan’s Cross.jpg", 1280),
  ferry: commons("Cebu Pier 1 Terminal.jpg", 1280),
  panglao: commons("Alona Beach, Panglao Island, Bohol, Philippines.jpg", 1280),
  chocolate: commons("Chocolate Hills - edit.jpg", 1280),
  tarsier: commons("Philippine tarsier (Carlito syrichta fraterculus) Bohol 3.jpg", 1280),
  loboc: commons("Loboc River Cruise (Poblacion, Loboc, Bohol; 01-12-2023).jpg", 1280),
  balicasag: commons("Balicasag island, Bohol.jpg", 1280),
  elNido: commons("Limestone island in Bacuit Bay, El Nido, Palawan, Philippines.jpg", 1440),
  bigLagoon: commons("Big Lagoon at El Nido, Palawan, Philippines.jpg", 1280),
  secretLagoon: commons("Island lagoon in Bacuit Bay, El Nido, Palawan, Philippines.jpg", 1280),
  sevenCommando: commons("El Nido Bay, Desert tropical island, Coastline, Palawan Island, Philippines.jpg", 1280),
  hiddenBeach: commons("Matinloc Island, El Nido - ElNido2089.jpg", 1280),
  lio: commons("Beach with pier view.jpg", 1280),
  food: commons("Lechon Cebu.jpg", 1280),
  airport: commons("Mactan-Cebu International Airport (Terminal 2).jpg", 1280),
};

function asId() {
  return crypto.randomUUID();
}

function item(id, type, time, title, description, extra = {}) {
  const bookable = ["hotel", "activity", "transportation", "flight", "boat", "event"].includes(type);
  return {
    id,
    type,
    time,
    title,
    description,
    imageUrl: extra.imageUrl || images.hero,
    buttonLabel: "Book Now",
    showButton: extra.showButton ?? bookable,
    status: extra.status || (bookable ? "Affiliate pending" : "Draft"),
    badge: extra.badge || type,
    price: extra.price || (bookable ? "Live price" : ""),
    people: extra.people || "2 People",
    deeplink: "",
    provider: extra.provider || "",
    affiliatePriority: extra.affiliatePriority || "",
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
    countryLabel: "Philippines",
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
    story: { imageUrl: data.imageUrl, quote: data.quote, musicLabel: "Cinematic Story", musicUrl: "" },
    summary: {
      activitiesCount: String(items.filter((entry) => ["activity", "event", "boat"].includes(entry.type)).length),
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
      title: "Cebu Arrival - From Runway to Mactan Blue",
      destinationLabel: "Mactan, Cebu",
      imageUrl: images.mactan,
      routeFrom: "Mactan-Cebu International Airport",
      routeTo: "Shangri-La Mactan, Cebu",
      weatherLabel: "Arrival / Low fatigue",
      quote: "The Philippines begins with a soft landing: airport, resort pool and Mactan blue.",
      description:
        "A gentle arrival day with airport buffer, transfer to Shangri-La Mactan, recovery, beachfront time and dinner. No paid tour.",
      items: [
        item("d1-arrival", "flight", "14:00", "Arrival at Mactan-Cebu International Airport", "Land in Cebu without binding the plan to a specific flight.", { imageUrl: images.airport, badge: "Arrival", showButton: false }),
        item("d1-buffer", "transportation", "14:00-15:15", "Immigration, Baggage and Arrival Buffer", "Arrival processing and luggage time before leaving the airport.", { imageUrl: images.airport, badge: "Airport" }),
        item("d1-transfer", "transportation", "15:15-15:45", "Airport to Shangri-La Mactan", "Gene should replace this planning allowance with current Maps data.", { imageUrl: images.mactan, badge: "Transfer" }),
        item("d1-hotel", "hotel", "16:00", "Shangri-La Mactan, Cebu Check-In", "Premium coastal-resort base that starts the journey with beach energy instead of a city business hotel.", { imageUrl: images.mactan, badge: "Hotel", affiliatePriority: "Very High" }),
        item("d1-recovery", "rest", "16:00-17:30", "Arrival Recovery", "Shower, room and pool time after the flight.", { imageUrl: images.mactan, badge: "Rest", showButton: false, price: "" }),
        item("d1-beach", "activity", "17:30-19:00", "Private Resort Beachfront Time", "First evening by Mactan's coast.", { imageUrl: images.mactan, badge: "Beach", showButton: false, price: "" }),
        item("d1-dinner", "restaurant", "19:00-20:30", "Dinner", "Flexible resort dinner.", { imageUrl: images.food, badge: "Dinner", showButton: false, price: "" }),
      ],
      suggestions: [
        suggestion("d1-s1", "Standard Mactan Beachfront Hotel", "Value Hotel", "Gene can dynamically offer a less expensive Mactan beach hotel.", images.mactan),
        suggestion("d1-s2", "Airport Transfer Upgrade", "Comfort Upgrade", "Useful after an international arrival.", images.mactan),
      ],
      notes: [
        { icon: "plane", text: "Arrival day avoids paid tours." },
        { icon: "water", text: "Resort coast time anchors the first night." },
        { icon: "bed", text: "Keep fatigue low." },
      ],
    }),
    day({
      dayNumber: 2,
      title: "Cebu Heritage and Resort - Old Philippines, Tropical Evening",
      destinationLabel: "Cebu City, Mactan",
      imageUrl: images.cebu,
      routeFrom: "Mactan",
      routeTo: "Magellan's Cross, Basilica area, Mactan coast",
      weatherLabel: "Culture + resort / Low-moderate fatigue",
      quote: "Cebu gives a short heritage chapter, then returns to coast and resort light.",
      description:
        "A lighter culture day after arrival: Magellan's Cross and historic Cebu, lunch, then mandatory resort and beach time.",
      items: [
        item("d2-breakfast", "restaurant", "07:30-08:30", "Breakfast", "Start before the heritage block.", { imageUrl: images.food, badge: "Breakfast", showButton: false, price: "" }),
        item("d2-depart", "transportation", "09:00", "Depart Mactan", "Transfer from resort toward central Cebu.", { imageUrl: images.cebu, badge: "Transfer" }),
        item("d2-cross", "activity", "09:45-10:30", "Magellan's Cross and Basilica Area", "Historic Cebu landmark block with respectful, light pacing.", { imageUrl: images.cebu, badge: "Heritage" }),
        item("d2-walk", "activity", "10:30-11:15", "Historic Central Cebu Walk", "Short walking block through the central heritage area.", { imageUrl: images.cebu, badge: "Culture" }),
        item("d2-lunch", "restaurant", "11:30-12:30", "Lunch", "Flexible Cebu lunch.", { imageUrl: images.food, badge: "Lunch", showButton: false, price: "" }),
        item("d2-return", "transportation", "12:30-13:15", "Return Toward Mactan", "Transfer back to resort area.", { imageUrl: images.mactan, badge: "Return" }),
        item("d2-resort", "rest", "13:30-16:30", "Mandatory Resort and Beach Time", "Keeps the day from becoming overloaded after international arrival.", { imageUrl: images.mactan, badge: "Recovery", showButton: false, price: "" }),
        item("d2-sunset", "activity", "17:00-18:30", "Mactan Coast Sunset", "Easy coast or resort sunset.", { imageUrl: images.mactan, badge: "Sunset", showButton: false, price: "" }),
        item("d2-dinner", "restaurant", "19:00-20:30", "Dinner", "Flexible dinner.", { imageUrl: images.food, badge: "Dinner", showButton: false, price: "" }),
      ],
      suggestions: [
        suggestion("d2-s1", "Private Cebu Heritage Guide", "Culture Upgrade", "Use only when verified provider inventory fits the short block.", images.cebu),
        suggestion("d2-s2", "Extra Resort Evening", "Slow Travel", "Good for families or honeymooners.", images.mactan),
      ],
      notes: [
        { icon: "temple", text: "Culture block is intentionally short." },
        { icon: "water", text: "Beach time stays part of the design." },
        { icon: "clock", text: "Avoid a long cross-island excursion." },
      ],
    }),
    day({
      dayNumber: 3,
      title: "Cebu to Panglao - From Cebu to Bohol Island Life",
      destinationLabel: "Panglao, Bohol",
      imageUrl: images.panglao,
      routeFrom: "Cebu",
      routeTo: "Panglao, Bohol",
      weatherLabel: "Ferry transfer / Low fatigue",
      quote: "The route crosses from Cebu into Bohol's softer island rhythm.",
      description:
        "A ferry-transfer day to Panglao with live ferry selection, Amorita Resort check-in, infinity-pool rest and Alona Beach sunset.",
      items: [
        item("d3-breakfast", "restaurant", "07:00-08:00", "Breakfast", "Prepare for checkout and ferry transfer.", { imageUrl: images.food, badge: "Breakfast", showButton: false, price: "" }),
        item("d3-checkout", "hotel", "08:30", "Shangri-La Checkout Preparation", "Official checkout is noon, but leaving earlier creates transport buffer.", { imageUrl: images.mactan, badge: "Hotel" }),
        item("d3-terminal", "transportation", "09:00", "Hotel to Cebu Ferry Terminal", "Use the appropriate Cebu ferry terminal from live transport data.", { imageUrl: images.ferry, badge: "Transfer" }),
        item("d3-ferry", "boat", "Late morning / early afternoon", "Cebu to Bohol Ferry", "Do not hard-code company or departure. Retrieve route, departure, arrival, luggage rules, terminal, fare and availability live.", { imageUrl: images.ferry, badge: "Ferry", affiliatePriority: "High" }),
        item("d3-bohol-transfer", "transportation", "13:00-14:00", "Bohol Arrival to Panglao", "Transfer from Bohol arrival point to Panglao.", { imageUrl: images.panglao, badge: "Transfer" }),
        item("d3-lunch", "restaurant", "14:00-15:00", "Lunch", "Flexible lunch before check-in.", { imageUrl: images.food, badge: "Lunch", showButton: false, price: "" }),
        item("d3-hotel", "hotel", "15:00 target", "Amorita Resort Check-In", "Panglao base at Alona Beach with rooms, suites, villas, dining and infinity-pool facilities. Use live hotel data.", { imageUrl: images.panglao, badge: "Hotel", affiliatePriority: "Very High" }),
        item("d3-rest", "rest", "15:00-17:30", "Hotel Rest and Infinity Pool", "Recovery after the ferry day.", { imageUrl: images.panglao, badge: "Rest", showButton: false, price: "" }),
        item("d3-sunset", "activity", "17:30-18:45", "Alona Beach Sunset", "First Bohol beach evening.", { imageUrl: images.panglao, badge: "Beach", showButton: false, price: "" }),
        item("d3-dinner", "restaurant", "19:00-20:30", "Dinner", "Flexible Panglao dinner.", { imageUrl: images.food, badge: "Dinner", showButton: false, price: "" }),
      ],
      suggestions: [
        suggestion("d3-s1", "Private Ferry Transfer Assistance", "Comfort Upgrade", "Useful for families and luggage-heavy travelers.", images.ferry),
        suggestion("d3-s2", "Alona Beach Dinner Upgrade", "Beach Lover", "A relaxed beachfront dining variant.", images.panglao),
      ],
      notes: [
        { icon: "ship", text: "Ferry data must be live." },
        { icon: "hotel", text: "Amorita details come from hotel provider data." },
        { icon: "water", text: "Arrival day stays beach-focused." },
      ],
    }),
    day({
      dayNumber: 4,
      title: "Bohol Hero Day - Chocolate Hills, Tarsiers and Loboc River",
      destinationLabel: "Bohol",
      imageUrl: images.chocolate,
      routeFrom: "Panglao",
      routeTo: "Chocolate Hills, tarsier conservation stop, Loboc River",
      weatherLabel: "Nature + culture / Moderate fatigue",
      quote: "Bohol turns surreal: green hills, tiny forest eyes and a slow river lunch.",
      description:
        "The main cultural and nature product for Bohol, using a current GetYourGuide Bohol countryside tour where available.",
      items: [
        item("d4-breakfast", "restaurant", "07:00-08:00", "Breakfast", "Start before provider pickup.", { imageUrl: images.food, badge: "Breakfast", showButton: false, price: "" }),
        item("d4-pickup", "transportation", "08:30", "Provider Pickup", "Pickup time depends on selected live product.", { imageUrl: images.chocolate, badge: "Pickup" }),
        item("d4-chocolate", "activity", "10:00-11:00", "Chocolate Hills", "Core Bohol landscape experience.", { imageUrl: images.chocolate, badge: "Hero Landscape", provider: "GetYourGuide preferred", affiliatePriority: "Maximum" }),
        item("d4-tarsier", "activity", "11:15-12:00", "Tarsier Conservation Stop", "Use respectful wildlife wording and never encourage touching or disturbing animals.", { imageUrl: images.tarsier, badge: "Wildlife" }),
        item("d4-loboc", "activity", "12:30-14:00", "Loboc River and Lunch", "Lunch/cruise experience according to the selected product inclusions.", { imageUrl: images.loboc, badge: "River" }),
        item("d4-forest", "activity", "14:15-15:00", "Forest or Countryside Stop", "Only include when the selected provider itinerary includes it.", { imageUrl: images.loboc, badge: "Countryside" }),
        item("d4-return", "transportation", "16:30-17:30", "Return to Panglao", "Return timing depends on provider and traffic.", { imageUrl: images.panglao, badge: "Return" }),
        item("d4-rest", "rest", "17:30-19:00", "Rest", "Recovery after the countryside tour.", { imageUrl: images.panglao, badge: "Rest", showButton: false, price: "" }),
        item("d4-dinner", "restaurant", "19:30", "Dinner", "Flexible Panglao dinner.", { imageUrl: images.food, badge: "Dinner", showButton: false, price: "" }),
      ],
      suggestions: [
        suggestion("d4-s1", "Private Bohol Countryside Tour", "Comfort Upgrade", "Good if live provider inventory exists.", images.chocolate),
        suggestion("d4-s2", "Shorter Countryside Variant", "Family Pace", "Use if travelers want more recovery time.", images.tarsier),
      ],
      notes: [
        { icon: "paw", text: "Wildlife must be respectful and non-contact." },
        { icon: "ticket", text: "Use selected product inclusions only." },
        { icon: "leaf", text: "Chocolate Hills is a hero visual card." },
      ],
    }),
    day({
      dayNumber: 5,
      title: "Bohol Coastal Hero Day - Balicasag Reef and Panglao Blue",
      destinationLabel: "Panglao, Balicasag",
      imageUrl: images.balicasag,
      routeFrom: "Panglao",
      routeTo: "Balicasag or selected island-hopping route",
      weatherLabel: "Marine / Moderate fatigue",
      quote: "Bohol moves from green hills to reef-blue water and island air.",
      description:
        "A coastal hero day using Klook Panglao Virgin and Balicasag Islands snorkeling or a private island-hopping alternative where live data supports it.",
      items: [
        item("d5-wake", "restaurant", "05:45-06:15", "Wake and Light Breakfast", "Early marine departure.", { imageUrl: images.food, badge: "Early Breakfast", showButton: false, price: "" }),
        item("d5-islands", "boat", "06:30-12:00", "Panglao Virgin and Balicasag Islands Snorkeling Tour", "Use current Klook product or private island-hopping alternative. Possible sightings are never guaranteed.", { imageUrl: images.balicasag, badge: "Island Hopping", provider: "Klook preferred", affiliatePriority: "Very High" }),
        item("d5-lunch", "restaurant", "12:30-13:30", "Lunch", "Lunch after the marine excursion.", { imageUrl: images.food, badge: "Lunch", showButton: false, price: "" }),
        item("d5-rest", "rest", "13:30-16:30", "Mandatory Recovery", "Protect recovery after the early boat morning.", { imageUrl: images.panglao, badge: "Rest", showButton: false, price: "" }),
        item("d5-beach", "activity", "16:30-18:30", "Alona Beach or Resort Pool", "Slow beach/pool block after recovery.", { imageUrl: images.panglao, badge: "Beach", showButton: false, price: "" }),
        item("d5-dinner", "restaurant", "19:00-20:30", "Dinner", "Flexible dinner.", { imageUrl: images.food, badge: "Dinner", showButton: false, price: "" }),
      ],
      suggestions: [
        suggestion("d5-s1", "Private Panglao Island-Hopping Tour", "Marine Upgrade", "Klook private option may fit couples or families.", images.balicasag),
        suggestion("d5-s2", "Skip Snorkeling for Beach Recovery", "Slow Travel", "Good if sea conditions or energy are not ideal.", images.panglao),
      ],
      notes: [
        { icon: "water", text: "Dolphins and turtles are possible, not guaranteed." },
        { icon: "paw", text: "Do not promote feeding wildlife." },
        { icon: "bed", text: "Recovery is mandatory." },
      ],
    }),
    day({
      dayNumber: 6,
      title: "Bohol to El Nido - Into Palawan",
      destinationLabel: "El Nido, Palawan",
      imageUrl: images.elNido,
      routeFrom: "Panglao / Bohol",
      routeTo: "Seda Lio, El Nido",
      weatherLabel: "Flight transfer / Low-moderate fatigue",
      quote: "The journey bends west toward Palawan, where limestone and turquoise take over.",
      description:
        "A transfer day to El Nido. Gene must compare direct flight if operating versus connections via Cebu or Manila, using total time, price and baggage rules.",
      items: [
        item("d6-breakfast", "restaurant", "07:30-08:30", "Breakfast", "Start before checkout and travel.", { imageUrl: images.food, badge: "Breakfast", showButton: false, price: "" }),
        item("d6-checkout", "hotel", "09:00", "Amorita Checkout Preparation", "Prepare for airport/flight connection.", { imageUrl: images.panglao, badge: "Hotel" }),
        item("d6-flight", "flight", "Midday reserved", "Bohol/Panglao to El Nido Flight Combination", "Compare direct flight if operating versus connection via Cebu or Manila. Do not assume nonstop service on every date.", { imageUrl: images.airport, badge: "Flight", affiliatePriority: "High" }),
        item("d6-hotel", "hotel", "15:00-17:00 target", "Seda Lio Check-In", "Practical premium beachfront base in Lio Tourism Estate; avoids repeated private-island boat transfers.", { imageUrl: images.lio, badge: "El Nido Hotel", affiliatePriority: "Maximum" }),
        item("d6-lio", "activity", "17:00-18:30", "Lio Beach", "First easy Palawan beach block.", { imageUrl: images.lio, badge: "Beach", showButton: false, price: "" }),
        item("d6-sunset", "activity", "18:30-19:15", "Lio Sunset", "Soft sunset after travel.", { imageUrl: images.lio, badge: "Sunset", showButton: false, price: "" }),
        item("d6-dinner", "restaurant", "19:30-21:00", "Dinner", "No paid island tour on flight day.", { imageUrl: images.food, badge: "Dinner", showButton: false, price: "" }),
      ],
      suggestions: [
        suggestion("d6-s1", "Pangulasian Island Resort Upgrade", "Luxury Couple", "Offer as Gene's luxury upgrade, not default.", images.elNido),
        suggestion("d6-s2", "Stay at Lio for Easy Logistics", "Smart Routing", "Keeps boat-day transfers practical.", images.lio),
      ],
      notes: [
        { icon: "plane", text: "Flight routing must be live." },
        { icon: "hotel", text: "Seda Lio is the practical default El Nido base." },
        { icon: "water", text: "No island tour on transfer day." },
      ],
    }),
    day({
      dayNumber: 7,
      title: "El Nido Hero #1 - Big Lagoon and Tour A",
      destinationLabel: "El Nido, Palawan",
      imageUrl: images.bigLagoon,
      routeFrom: "Seda Lio / El Nido",
      routeTo: "Big Lagoon, Shimizu Island, Secret Lagoon, Seven Commando Beach",
      weatherLabel: "Island-hopping hero / Moderate fatigue",
      quote: "Palawan turns cinematic: cliffs rising from turquoise water, lagoons, lunch and open-sea light.",
      description:
        "The main homepage image/product for the Philippines plan: Klook El Nido Tour A Lagoons and Islands, with exact inclusions pulled live.",
      items: [
        item("d7-breakfast", "restaurant", "07:00-08:00", "Breakfast", "Start before boat check-in.", { imageUrl: images.food, badge: "Breakfast", showButton: false, price: "" }),
        item("d7-checkin", "transportation", "08:00-08:30", "Tour Check-In / Transfer", "Exact meeting point and transfer depend on selected provider package.", { imageUrl: images.elNido, badge: "Check-In" }),
        item("d7-tour-a", "boat", "09:00-16:00", "El Nido Tour A Lagoons and Islands", "Klook-preferred hero product. Use current package inclusions for Big Lagoon, Shimizu Island, Secret Lagoon, Seven Commando Beach, lunch and equipment.", { imageUrl: images.bigLagoon, badge: "Tour A", provider: "Klook preferred", affiliatePriority: "Maximum" }),
        item("d7-big-lagoon", "activity", "Morning", "Big Lagoon", "Lagoon and coastal exploration according to live route.", { imageUrl: images.bigLagoon, badge: "Lagoon" }),
        item("d7-shimizu", "activity", "Midday", "Shimizu Island and Tour Lunch", "Lunch only where included by the selected package.", { imageUrl: images.elNido, badge: "Island Lunch" }),
        item("d7-secret", "activity", "Afternoon", "Secret Lagoon and Seven Commando Beach", "Core Tour A locations when confirmed by provider itinerary.", { imageUrl: images.secretLagoon, badge: "Lagoon / Beach" }),
        item("d7-rest", "rest", "17:00-18:30", "Shower and Rest", "No second tour after Tour A.", { imageUrl: images.lio, badge: "Rest", showButton: false, price: "" }),
        item("d7-dinner", "restaurant", "19:00", "Dinner", "Flexible El Nido dinner.", { imageUrl: images.food, badge: "Dinner", showButton: false, price: "" }),
      ],
      suggestions: [
        suggestion("d7-s1", "Private Tour A Upgrade", "Luxury Upgrade", "Good for couples if live inventory exists.", images.bigLagoon),
        suggestion("d7-s2", "Shorter Lagoon Day", "Family Pace", "Use if travelers need less time on the boat.", images.secretLagoon),
      ],
      notes: [
        { icon: "ship", text: "No second tour after Tour A." },
        { icon: "ticket", text: "Package inclusions must be read live." },
        { icon: "camera", text: "Big Lagoon is the hero homepage image." },
      ],
    }),
    day({
      dayNumber: 8,
      title: "El Nido Hero #2 - Hidden Beaches and Helicopter Island",
      destinationLabel: "El Nido, Palawan",
      imageUrl: images.hiddenBeach,
      routeFrom: "El Nido",
      routeTo: "Hidden Beach, Helicopter Island, Matinloc area",
      weatherLabel: "Island-hopping / Moderate fatigue",
      quote: "The second boat day changes the rhythm: hidden beaches, sharp limestone and snorkeling blue.",
      description:
        "A different El Nido route from Tour A: Viator Tour C or current hidden-beach/snorkeling product, with exact route pulled live.",
      items: [
        item("d8-breakfast", "restaurant", "07:30-08:30", "Breakfast", "Start before the second boat day.", { imageUrl: images.food, badge: "Breakfast", showButton: false, price: "" }),
        item("d8-depart", "boat", "09:00", "El Nido Tour C Departure", "Departure according to selected live provider itinerary.", { imageUrl: images.hiddenBeach, badge: "Departure", provider: "Viator preferred", affiliatePriority: "Maximum" }),
        item("d8-tour-c", "boat", "09:00-16:00", "El Nido Tour C - Hidden Beaches and Snorkeling", "Use the live Tour C itinerary. Possible components include Helicopter Island, Hidden Beach, Matinloc-area stops and snorkeling zones.", { imageUrl: images.hiddenBeach, badge: "Tour C", provider: "Viator preferred", affiliatePriority: "Maximum" }),
        item("d8-hidden", "activity", "Provider itinerary", "Hidden Beach / Matinloc Area", "Only display locations confirmed by the live product.", { imageUrl: images.hiddenBeach, badge: "Hidden Beach" }),
        item("d8-lunch", "restaurant", "Inside tour where included", "Tour Lunch", "Lunch only where included by provider package.", { imageUrl: images.food, badge: "Tour Lunch", showButton: false, price: "" }),
        item("d8-return", "transportation", "16:00-17:00", "Return to El Nido", "Return after the boat route.", { imageUrl: images.elNido, badge: "Return" }),
        item("d8-rest", "rest", "17:00-19:00", "Mandatory Rest", "Recovery after two consecutive boat days.", { imageUrl: images.lio, badge: "Rest", showButton: false, price: "" }),
        item("d8-dinner", "restaurant", "19:30", "Dinner", "Flexible dinner.", { imageUrl: images.food, badge: "Dinner", showButton: false, price: "" }),
      ],
      suggestions: [
        suggestion("d8-s1", "Private Tour C Upgrade", "Luxury Upgrade", "Good if live provider has private/shared options.", images.hiddenBeach),
        suggestion("d8-s2", "Tour B or Tour D Alternative", "Hidden-Island Variant", "Offer as an alternative, not stacked after Tours A and C.", images.elNido),
      ],
      notes: [
        { icon: "ship", text: "Route must differ from Tour A." },
        { icon: "ticket", text: "Use live product itinerary only." },
        { icon: "bed", text: "Rest is mandatory after return." },
      ],
    }),
    day({
      dayNumber: 9,
      title: "Slow Palawan - Lio Beach, El Nido Town and Sunset",
      destinationLabel: "El Nido, Palawan",
      imageUrl: images.lio,
      routeFrom: "Seda Lio",
      routeTo: "Lio Beach, El Nido town, coastal cafes",
      weatherLabel: "Recovery / Very low fatigue",
      quote: "After the boat days, Palawan slows into beach shade, cafe stops and one final sunset.",
      description:
        "A deliberate recovery day after two island-hopping days: late breakfast, Lio Beach, pool/spa/rest, El Nido town/cafes and sunset.",
      items: [
        item("d9-breakfast", "restaurant", "08:30-10:00", "Late Breakfast", "Slow morning after boat days.", { imageUrl: images.food, badge: "Breakfast", showButton: false, price: "" }),
        item("d9-lio", "activity", "10:00-12:30", "Lio Beach or Hotel Beach", "Low-intensity beach time.", { imageUrl: images.lio, badge: "Beach", showButton: false, price: "" }),
        item("d9-lunch", "restaurant", "12:30-13:30", "Lunch", "Flexible lunch.", { imageUrl: images.food, badge: "Lunch", showButton: false, price: "" }),
        item("d9-rest", "rest", "13:30-15:30", "Pool, Spa or Rest", "Keep this day low intensity.", { imageUrl: images.lio, badge: "Rest", showButton: false, price: "" }),
        item("d9-town", "activity", "16:00-17:30", "El Nido Town and Coastal Cafes", "Light town/coast walk.", { imageUrl: images.elNido, badge: "Town", showButton: false, price: "" }),
        item("d9-sunset", "activity", "17:30-18:45", "Final Palawan Sunset", "Final sunset before farewell dinner.", { imageUrl: images.lio, badge: "Sunset", showButton: false, price: "" }),
        item("d9-dinner", "restaurant", "19:00-21:00", "Farewell Dinner", "Flexible farewell dinner.", { imageUrl: images.food, badge: "Dinner", showButton: false, price: "" }),
      ],
      suggestions: [
        suggestion("d9-s1", "El Nido Via Ferrata / Canopy Walk", "Optional Activity", "Only if traveler suitability and provider safety requirements fit.", images.elNido),
        suggestion("d9-s2", "Add One Extra El Nido Resort Day", "Beach Lover", "Make this an 11-day beach-heavy variant.", images.lio),
      ],
      notes: [
        { icon: "bed", text: "This is not another full excursion day." },
        { icon: "water", text: "Beach Lover variant adds another El Nido night." },
        { icon: "ticket", text: "Via Ferrata remains optional." },
      ],
    }),
    day({
      dayNumber: 10,
      title: "Departure - Last Morning in Palawan",
      destinationLabel: "El Nido, Palawan",
      imageUrl: images.elNido,
      routeFrom: "Seda Lio",
      routeTo: "El Nido Airport",
      weatherLabel: "Departure / Low fatigue",
      quote: "One last Palawan morning, then the route folds back toward the sky.",
      description:
        "Departure day with breakfast, beach/pool if flight permits, packing, checkout and airport transfer. No paid excursion.",
      items: [
        item("d10-breakfast", "restaurant", "07:30-09:00", "Breakfast", "Final breakfast.", { imageUrl: images.food, badge: "Breakfast", showButton: false, price: "" }),
        item("d10-beach", "activity", "09:00-10:30", "Beach or Pool If Flight Permits", "Only if the airport-departure window allows.", { imageUrl: images.lio, badge: "Morning", showButton: false, price: "" }),
        item("d10-pack", "rest", "10:30", "Packing", "Final packing and room check.", { imageUrl: images.lio, badge: "Packing", showButton: false, price: "" }),
        item("d10-checkout", "hotel", "Live policy", "Seda Lio Checkout", "Use live hotel policy.", { imageUrl: images.lio, badge: "Hotel" }),
        item("d10-airport", "transportation", "Flight-specific", "Hotel to El Nido Airport", "Calculate with current Maps and flight information. No activity once required airport-departure window starts.", { imageUrl: images.airport, badge: "Airport Transfer" }),
      ],
      suggestions: [
        suggestion("d10-s1", "Late Checkout Request", "Comfort Upgrade", "Only if hotel/provider confirms availability.", images.lio),
        suggestion("d10-s2", "Palawan Extension", "Beach Lover", "Add another El Nido resort night.", images.elNido),
      ],
      notes: [
        { icon: "plane", text: "No paid excursion on departure day." },
        { icon: "clock", text: "Airport timing depends on real flight." },
        { icon: "water", text: "Beach/pool only if time permits." },
      ],
    }),
  ];

  return {
    hero: {
      eyebrow: "Level 1 • Plan #10 • Philippines",
      title: PLAN_TITLE,
      subtitle:
        "Begin beside Cebu's tropical coast, cross to Bohol's surreal green hills and island waters, then disappear into Palawan where limestone cliffs rise from turquoise lagoons, hidden beaches wait beyond the open sea, and every evening ends beneath an El Nido sunset.",
      imageUrl: images.hero,
      badge: "Beach • Island Hopping • Nature • Culture • Luxury • Wildlife",
      stats: [
        { label: "Days", value: "10" },
        { label: "Countries", value: "1" },
        { label: "Cities", value: "3" },
        { label: "Travelers", value: "2" },
        { label: "Trip Style", value: "Island Blue" },
      ],
    },
    overview: {
      startingPoint: "Mactan-Cebu International Airport",
      destinations: "Cebu, Mactan, Panglao, Chocolate Hills, Balicasag, El Nido, Big Lagoon, Hidden Beach",
      tripStyle: "Beach, island hopping, nature, culture, luxury, honeymoon, wildlife, photography",
      travelers: "2 Adults",
      estimatedCost: "Live pricing",
      aiScore: "4.9",
    },
    days,
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
    location: "Cebu, Panglao/Bohol, El Nido, Palawan",
    days: content.days.length,
    image_url: images.hero,
    created_at: timestamp,
    subtitle:
      "10 days from Cebu's coast to Bohol's Chocolate Hills and Palawan's El Nido lagoons.",
    country: "Philippines",
    city: "Cebu, Panglao, Bohol, El Nido",
    destination: "Philippines",
    style: "Beach, Island Hopping, Nature, Culture, Luxury, Honeymoon, Wildlife, Photography",
    daysCount: content.days.length,
    heroImage: images.hero,
    coverImage: images.hero,
    summary:
      "A 10-day Philippines Ready Plan built around Cebu, Panglao/Bohol, Chocolate Hills, tarsiers, Loboc River, Balicasag, El Nido Tour A, Tour C, Lio Beach and Palawan lagoon sunsets.",
    seoTitle: PLAN_TITLE,
    seoDescription:
      "Draft ready plan for the Philippines: Chocolate Hills, Island Blues and El Nido Lagoons with Cebu, Bohol, Panglao and Palawan.",
    tags: ["Philippines", "Cebu", "Bohol", "Panglao", "Chocolate Hills", "Balicasag", "El Nido", "Palawan", "Big Lagoon", "Island Hopping"],
    season: "Dry season and shoulder season",
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
  console.error("INSERT_PHILIPPINES_READY_PLAN_FAILED");
  console.error(error);
  process.exit(1);
});
