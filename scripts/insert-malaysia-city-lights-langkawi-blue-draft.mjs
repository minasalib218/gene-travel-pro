import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import crypto from "node:crypto";

const SOURCE_ENV_PATH = new URL("../.env", import.meta.url);
const SLUG = "malaysia-city-lights-heritage-bites-langkawi-blue";
const PLAN_TITLE = "Malaysia: City Lights, Heritage Bites & Langkawi Blue";

const commons = (fileName, width = 1280) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}?width=${width}`;

const images = {
  hero: commons("Langkawi, Malaysia - panoramio (2).jpg", 1440),
  kl: commons("Kuala Lumpur Malaysia Skyline-03.jpg", 1440),
  petronas: commons("Kuala Lumpur Malaysia Petronas-Twin-Towers-01.jpg", 1280),
  batu: commons("Gombak Selangor Batu-Caves-01.jpg", 1280),
  genting: commons("Genting-Highlands Malaysia First-World-Hotel-01.jpg", 1280),
  georgetown: commons("Still Life with Public Art - Armenian Street - George Town - Penang - Malaysia (35295517972).jpg", 1280),
  penangFood: commons("Penang laksa (2013).jpg", 1280),
  kekLokSi: commons("Penang Malaysia Kek-Lok-Si-Temple-03.jpg", 1280),
  penangHill: commons("Funicular to the top of the Penang Hill, Georgetown, Penang, Malaysia.JPG", 1280),
  langkawiBeach: commons("Seat on the beach, Langkawi, Kedah, Malaysia (10226179266).jpg", 1280),
  kilim: commons("Langkawi Mangrove Forest.jpg", 1280),
  langkawiIsland: commons("Langkawi Malaysia Beach-service-truck-01.jpg", 1280),
  airport: commons("KLIA Terminal 1 Departure Hall.jpg", 1280),
  hotelKl: commons("Kuala Lumpur Malaysia Skyline-03.jpg", 1280),
  hotelPenang: commons("Lanterns and street art in laneway off Jalan Doktor Lim Chwee Leong in George Town, Penang - 53782309972.jpg", 1280),
  hotelLangkawi: commons("Langkawi, Malaysia - panoramio (2).jpg", 1280),
  food: commons("Penang laksa (2013).jpg", 1280),
  transfer: commons("KLIA Ekspres train at KL Sentral.jpg", 1280),
};

function asId() {
  return crypto.randomUUID();
}

function item(id, type, time, title, description, extra = {}) {
  const bookable = ["hotel", "activity", "transportation", "event", "flight", "boat"].includes(type);
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
    countryLabel: "Malaysia",
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
      title: "Kuala Lumpur Arrival - First Night Beneath the Towers",
      destinationLabel: "Kuala Lumpur",
      imageUrl: images.petronas,
      routeFrom: "Kuala Lumpur International Airport",
      routeTo: "JW Marriott Hotel Kuala Lumpur, KLCC",
      weatherLabel: "Arrival / Low fatigue",
      quote: "Malaysia begins under city lights, glass towers and an easy first-night rhythm.",
      description:
        "An intentionally light arrival day: KLIA buffer, transfer to JW Marriott Hotel Kuala Lumpur, rest, then a first evening around KLCC and the Petronas Twin Towers.",
      items: [
        item("d1-arrival", "flight", "14:00", "Arrival at Kuala Lumpur International Airport", "Land at KLIA and allow immigration, baggage and airport buffer. The plan is not bound to a specific flight.", { imageUrl: images.airport, badge: "Arrival", showButton: false }),
        item("d1-buffer", "transportation", "14:00-15:30", "Immigration and Airport Buffer", "A 90-minute planning allowance before leaving the airport.", { imageUrl: images.airport, badge: "Airport" }),
        item("d1-transfer", "transportation", "15:30-16:30", "KLIA to JW Marriott Kuala Lumpur", "Gene should replace planning duration with live maps or transport data when customized.", { imageUrl: images.transfer, badge: "Transfer" }),
        item("d1-hotel", "hotel", "16:30", "JW Marriott Hotel Kuala Lumpur Check-In", "Premium central Kuala Lumpur base for the first three nights. Use live hotel inventory and pricing.", { imageUrl: images.hotelKl, badge: "Hotel", affiliatePriority: "Very High" }),
        item("d1-rest", "rest", "16:30-18:00", "Arrival Recovery", "Check in, refresh and recover from the flight before experiencing Kuala Lumpur after dark.", { imageUrl: images.hotelKl, badge: "Rest", showButton: false, price: "" }),
        item("d1-klcc", "activity", "19:00-20:15", "Petronas Twin Towers and KLCC Evening", "KLCC exterior, Petronas Twin Towers views, KLCC Park and photography. Observation deck remains optional if a verified provider product exists.", { imageUrl: images.petronas, badge: "Skyline" }),
        item("d1-dinner", "restaurant", "20:15-21:15", "Flexible Kuala Lumpur Dinner", "Use free choice or Gene restaurant recommendation; do not fabricate a restaurant reservation.", { imageUrl: images.food, badge: "Dinner", showButton: false, price: "" }),
      ],
      suggestions: [
        suggestion("d1-s1", "Petronas Observation Deck Upgrade", "Skyline Add-On", "Show only if a verified provider product is available.", images.petronas),
        suggestion("d1-s2", "Private KLIA Transfer", "Comfort Upgrade", "Useful after a long flight or for families with luggage.", images.transfer),
      ],
      notes: [
        { icon: "plane", text: "Arrival day stays intentionally easy." },
        { icon: "camera", text: "Petronas views are the first-night visual anchor." },
        { icon: "food", text: "Dinner remains flexible around arrival fatigue." },
      ],
    }),
    day({
      dayNumber: 2,
      title: "Kuala Lumpur Icons - Modern Malaysia & Old Kuala Lumpur",
      destinationLabel: "Kuala Lumpur",
      imageUrl: images.kl,
      routeFrom: "JW Marriott Kuala Lumpur",
      routeTo: "Merdeka Square, Chinatown, Central Market, KLCC",
      weatherLabel: "City culture / Moderate fatigue",
      quote: "Old civic streets and modern towers tell Kuala Lumpur in two voices.",
      description:
        "A city-icon day with Merdeka Square, Sultan Abdul Samad exterior, River of Life area, Central Market, Chinatown, a mandatory rest block and skyline photography.",
      items: [
        item("d2-breakfast", "restaurant", "07:30-08:30", "Breakfast", "Start steady before the old-city section.", { imageUrl: images.food, badge: "Breakfast", showButton: false, price: "" }),
        item("d2-merdeka", "activity", "09:00-10:30", "Merdeka Square and Historic Kuala Lumpur", "Merdeka Square, Sultan Abdul Samad Building exterior and River of Life area where practical.", { imageUrl: images.kl, badge: "Culture" }),
        item("d2-transfer", "transportation", "10:30-11:00", "Historic Core Transfer", "Short transfer between the historic core and Central Market/Chinatown.", { imageUrl: images.transfer, badge: "Transfer" }),
        item("d2-market", "activity", "11:00-12:30", "Central Market and Chinatown", "Central Market, Petaling Street and cultural streets. Shopping stops are not paid tours unless a provider product exists.", { imageUrl: images.kl, badge: "Heritage" }),
        item("d2-lunch", "restaurant", "12:30-13:30", "Kuala Lumpur Lunch", "Flexible lunch around Chinatown or Central Market.", { imageUrl: images.food, badge: "Lunch", showButton: false, price: "" }),
        item("d2-rest", "rest", "13:30-15:30", "Hotel Rest", "Mandatory recovery block before the late-afternoon skyline.", { imageUrl: images.hotelKl, badge: "Rest", showButton: false, price: "" }),
        item("d2-observation", "activity", "16:00-17:30", "KLCC or City Observation Experience", "Show Book Now only if a verified tower or observation product is available from provider data.", { imageUrl: images.petronas, badge: "Observation" }),
        item("d2-sunset", "activity", "18:00-19:00", "Sunset Skyline Photography", "Kuala Lumpur skyline photography before dinner.", { imageUrl: images.petronas, badge: "Photography" }),
        item("d2-dinner", "restaurant", "19:00-20:30", "Dinner", "Flexible city dinner.", { imageUrl: images.food, badge: "Dinner", showButton: false, price: "" }),
      ],
      suggestions: [
        suggestion("d2-s1", "Kuala Lumpur Private City Tour", "City Upgrade", "Useful if the traveler wants guided context instead of self-guided city blocks.", images.kl),
        suggestion("d2-s2", "Street Food Add-On", "Food Lover", "Best if live restaurant or food-tour availability supports the timing.", images.food),
      ],
      notes: [
        { icon: "city", text: "Keep city stops realistic and not overfilled." },
        { icon: "bed", text: "The afternoon rest block is mandatory." },
        { icon: "ticket", text: "Observation products require live verification." },
      ],
    }),
    day({
      dayNumber: 3,
      title: "Batu Caves and Genting Highlands Hero Tour",
      destinationLabel: "Batu Caves, Genting Highlands",
      imageUrl: images.batu,
      routeFrom: "Kuala Lumpur",
      routeTo: "Batu Caves, Genting Highlands",
      weatherLabel: "Full-day excursion / High fatigue",
      quote: "Limestone shrines rise in color, then the road climbs toward Malaysia's highland air.",
      description:
        "A full-day hero excursion. Use the verified Klook product details for Genting Highlands and Batu Caves, including exact title, duration, itinerary, inclusions and pickup.",
      items: [
        item("d3-breakfast", "restaurant", "06:30-07:15", "Early Breakfast", "Prepare for a long full-day excursion.", { imageUrl: images.food, badge: "Breakfast", showButton: false, price: "" }),
        item("d3-pickup", "transportation", "07:30 target", "Provider Pickup or Meeting Point", "Exact pickup time and location must come from the live product.", { imageUrl: images.transfer, badge: "Pickup" }),
        item("d3-hero", "activity", "Full day", "Genting Highlands and Batu Caves Day Tour", "Klook-preferred full-day seed product. Use provider itinerary rather than overriding it; claim cable car or Chin Swee Caves Temple only if included live.", { imageUrl: images.batu, badge: "Hero Tour", provider: "Klook preferred", affiliatePriority: "Maximum" }),
        item("d3-batu", "activity", "Morning", "Batu Caves", "Allow sufficient exploration time at the limestone shrine and stairs within the provider itinerary.", { imageUrl: images.batu, badge: "Attraction" }),
        item("d3-genting", "activity", "Afternoon", "Genting Highlands", "Free exploration or included attractions according to the selected live product.", { imageUrl: images.genting, badge: "Highlands" }),
        item("d3-return", "transportation", "17:30-18:30 target", "Return to Kuala Lumpur", "Expected return window depends on live itinerary and traffic.", { imageUrl: images.transfer, badge: "Return" }),
        item("d3-dinner", "restaurant", "19:00-20:30", "Light Dinner", "No night tour after this high-fatigue day.", { imageUrl: images.food, badge: "Dinner", showButton: false, price: "" }),
      ],
      suggestions: [
        suggestion("d3-s1", "Private Genting and Batu Caves Upgrade", "Comfort Upgrade", "Offer if private provider inventory exists.", images.batu),
        suggestion("d3-s2", "Skip Evening Plans", "Recovery Choice", "Recommended because this is a full 10-hour excursion.", images.hotelKl),
      ],
      notes: [
        { icon: "clock", text: "Do not add another major excursion." },
        { icon: "ticket", text: "Provider itinerary wins over seed assumptions." },
        { icon: "mountain", text: "Cable car is included only if product confirms it." },
      ],
    }),
    day({
      dayNumber: 4,
      title: "Kuala Lumpur to Penang - Skyscrapers to Heritage Streets",
      destinationLabel: "George Town, Penang",
      imageUrl: images.georgetown,
      routeFrom: "Kuala Lumpur",
      routeTo: "Penang and George Town",
      weatherLabel: "Transfer / Low-moderate fatigue",
      quote: "The route leaves tower glass behind and lands in George Town's painted lanes.",
      description:
        "A transfer day from Kuala Lumpur to Penang. Prefer flight when live data makes it practical, with ETS train as an alternative if it better fits the traveler.",
      items: [
        item("d4-breakfast", "restaurant", "07:30-08:30", "Breakfast", "Simple morning before checkout and travel.", { imageUrl: images.food, badge: "Breakfast", showButton: false, price: "" }),
        item("d4-checkout", "hotel", "10:00", "JW Marriott Checkout Preparation", "Official checkout seed allows until 12:00, but leave early enough for transport.", { imageUrl: images.hotelKl, badge: "Hotel" }),
        item("d4-airport", "transportation", "10:30", "Hotel to Airport", "Airport transfer with buffers for the Kuala Lumpur to Penang flight plan.", { imageUrl: images.transfer, badge: "Airport Transfer" }),
        item("d4-flight", "flight", "12:30-14:00 target", "Kuala Lumpur to Penang Flight", "Use live flight API for airline, fare, baggage rules, airport and timing. Do not hard-code a flight number.", { imageUrl: images.airport, badge: "Flight" }),
        item("d4-penang-transfer", "transportation", "15:00-16:00", "Penang Arrival to Hotel", "Transfer to Courtyard by Marriott Penang or selected Penang base.", { imageUrl: images.georgetown, badge: "Transfer" }),
        item("d4-hotel", "hotel", "16:00", "Courtyard by Marriott Penang Check-In", "Penang base for George Town, street food, Penang Hill and heritage walks.", { imageUrl: images.hotelPenang, badge: "Hotel", affiliatePriority: "High" }),
        item("d4-walk", "activity", "17:30-19:00", "George Town First Walk", "Armenian Street, heritage lanes and street art without turning the evening into a full tour.", { imageUrl: images.georgetown, badge: "Heritage" }),
        item("d4-dinner", "restaurant", "19:00-20:30", "Hawker Food Dinner", "Flexible hawker or dinner choice in George Town.", { imageUrl: images.food, badge: "Dinner", showButton: false, price: "" }),
      ],
      suggestions: [
        suggestion("d4-s1", "ETS Train Alternative", "Transport Alternative", "Use if live train data is significantly more practical than flying.", images.transfer),
        suggestion("d4-s2", "George Town Night Food Preview", "Food Add-On", "A light add-on only if the traveler arrives early and rested.", images.food),
      ],
      notes: [
        { icon: "plane", text: "Flight is preferred but live data decides." },
        { icon: "street", text: "Keep George Town evening light." },
        { icon: "hotel", text: "Penang hotel can be replaced by admin later." },
      ],
    }),
    day({
      dayNumber: 5,
      title: "George Town Hero Day - UNESCO Streets and Penang on a Plate",
      destinationLabel: "George Town, Penang",
      imageUrl: images.georgetown,
      routeFrom: "Courtyard by Marriott Penang",
      routeTo: "George Town heritage and food neighborhoods",
      weatherLabel: "Culture + food / Moderate fatigue",
      quote: "Penang tells its story through clan houses, murals, mosques, temples and food smoke.",
      description:
        "A high-value Penang day with one heritage walking tour and one food tour only if exact product times support no overlap and enough recovery.",
      items: [
        item("d5-breakfast", "restaurant", "08:00-09:00", "Breakfast", "Start steady before the heritage tour.", { imageUrl: images.food, badge: "Breakfast", showButton: false, price: "" }),
        item("d5-heritage", "activity", "09:30-13:30", "Private George Town UNESCO Heritage Walking Tour", "Viator-preferred seed product. Choose one verified live heritage product; do not book both alternatives.", { imageUrl: images.georgetown, badge: "Heritage Tour", provider: "Viator preferred", affiliatePriority: "Very High" }),
        item("d5-lunch", "restaurant", "13:30-14:30", "George Town Lunch", "Flexible lunch after the walking tour.", { imageUrl: images.food, badge: "Lunch", showButton: false, price: "" }),
        item("d5-rest", "rest", "14:30-16:30", "Hotel Rest", "Mandatory recovery before the evening food tour.", { imageUrl: images.hotelPenang, badge: "Rest", showButton: false, price: "" }),
        item("d5-food-tour", "activity", "17:00-20:00", "Eat Like A Local: Penang Street Food Tour", "Viator-preferred food hero. Use exact live product; switch to the Heritage on a Plate dinner hop only if schedule and availability are better.", { imageUrl: images.penangFood, badge: "Food Tour", provider: "Viator preferred", affiliatePriority: "Maximum" }),
        item("d5-return", "transportation", "20:00-20:30", "Return to Hotel", "No second evening activity after the food tour.", { imageUrl: images.georgetown, badge: "Return" }),
      ],
      suggestions: [
        suggestion("d5-s1", "Shorter Heritage Walk", "Schedule Fix", "Use if the food tour creates overlap or not enough recovery.", images.georgetown),
        suggestion("d5-s2", "Food Lover Penang Extension", "Food Variant", "Keep Penang at minimum three nights and prioritize food neighborhoods.", images.penangFood),
      ],
      notes: [
        { icon: "clock", text: "Heritage and food tours must not overlap." },
        { icon: "food", text: "Do not invent exact dishes or stalls." },
        { icon: "bed", text: "Keep at least 90 minutes recovery." },
      ],
    }),
    day({
      dayNumber: 6,
      title: "Penang Heights and Coast - Temple Hills to Island Sunset",
      destinationLabel: "Penang",
      imageUrl: images.kekLokSi,
      routeFrom: "George Town",
      routeTo: "Kek Lok Si Temple, Penang Hill, Gurney coastline",
      weatherLabel: "Temple + coast / Moderate fatigue",
      quote: "Temple color rises into hill air before Penang slips back toward the sea.",
      description:
        "A balanced Penang day with Kek Lok Si Temple, Penang Hill, rest and a practical coastal sunset block selected by traffic and hotel location.",
      items: [
        item("d6-breakfast", "restaurant", "08:00-09:00", "Breakfast", "Start before the hill and temple section.", { imageUrl: images.food, badge: "Breakfast", showButton: false, price: "" }),
        item("d6-depart", "transportation", "09:30", "Departure to Kek Lok Si", "Use live routing from the selected Penang hotel.", { imageUrl: images.transfer, badge: "Transfer" }),
        item("d6-kek-lok-si", "activity", "10:00-11:30", "Kek Lok Si Temple", "Use real attraction information and do not guess ticket sections or lift pricing.", { imageUrl: images.kekLokSi, badge: "Temple" }),
        item("d6-penang-hill", "activity", "12:00-14:00", "Penang Hill", "Use current attraction and transport data; allow Book Now only if a verified provider ticket exists.", { imageUrl: images.penangHill, badge: "Hill" }),
        item("d6-lunch", "restaurant", "14:00-15:00", "Lunch", "Flexible lunch after Penang Hill.", { imageUrl: images.food, badge: "Lunch", showButton: false, price: "" }),
        item("d6-rest", "rest", "15:00-16:30", "Hotel Rest", "Protect recovery before the coast.", { imageUrl: images.hotelPenang, badge: "Rest", showButton: false, price: "" }),
        item("d6-coast", "activity", "17:00-19:00", "Gurney Coastline or Practical Sunset Spot", "Choose according to hotel location and traffic. Do not force Batu Ferringhi if inefficient.", { imageUrl: images.langkawiBeach, badge: "Coast" }),
        item("d6-dinner", "restaurant", "19:30-21:00", "Dinner", "Flexible Penang dinner.", { imageUrl: images.food, badge: "Dinner", showButton: false, price: "" }),
      ],
      suggestions: [
        suggestion("d6-s1", "Penang Hill Ticket", "Attraction Add-On", "Only show when a verified provider ticket exists.", images.penangHill),
        suggestion("d6-s2", "Batu Ferringhi Sunset Alternative", "Beach Alternative", "Use only if travel time stays practical.", images.langkawiBeach),
      ],
      notes: [
        { icon: "ticket", text: "Do not invent funicular operating hours." },
        { icon: "sun", text: "Coastal block should follow live traffic." },
        { icon: "temple", text: "Kek Lok Si needs real attraction imagery." },
      ],
    }),
    day({
      dayNumber: 7,
      title: "Penang to Langkawi - Heritage Island to Tropical Island",
      destinationLabel: "Langkawi",
      imageUrl: images.langkawiBeach,
      routeFrom: "Penang",
      routeTo: "The St. Regis Langkawi and Andaman beach",
      weatherLabel: "Island transfer / Low fatigue",
      quote: "Heritage lanes fade into rainforest edges, resort calm and Andaman blue.",
      description:
        "Use the most practical verified connection for the travel date. Prefer flight by default for operational certainty, with ferry only if verified and practical.",
      items: [
        item("d7-breakfast", "restaurant", "07:30-08:30", "Breakfast", "Start before packing and transfer.", { imageUrl: images.food, badge: "Breakfast", showButton: false, price: "" }),
        item("d7-checkout", "hotel", "10:00", "Penang Hotel Checkout Preparation", "Prepare for the Penang to Langkawi connection.", { imageUrl: images.hotelPenang, badge: "Hotel" }),
        item("d7-transport", "flight", "Live schedule", "Penang to Langkawi Connection", "Use live flight or verified ferry data for departure, baggage rules, duration, terminal, price and affiliate support.", { imageUrl: images.airport, badge: "Flight / Ferry" }),
        item("d7-arrival", "transportation", "13:00-14:30 target", "Langkawi Arrival Transfer", "Transfer from airport or terminal to the selected Langkawi resort.", { imageUrl: images.langkawiBeach, badge: "Transfer" }),
        item("d7-st-regis", "hotel", "15:00 target", "The St. Regis Langkawi Check-In", "Luxury beachfront resort positioned between rainforest and the Andaman Sea. Use current provider data for policy and pricing.", { imageUrl: images.hotelLangkawi, badge: "Luxury Hotel", affiliatePriority: "Maximum" }),
        item("d7-rest", "rest", "15:00-17:00", "Resort Rest", "Relax after the transfer.", { imageUrl: images.hotelLangkawi, badge: "Rest", showButton: false, price: "" }),
        item("d7-beach", "activity", "17:00-18:30", "Hotel Beachfront or Nearby Beach", "First Langkawi beach block with local safety guidance.", { imageUrl: images.langkawiBeach, badge: "Beach" }),
        item("d7-sunset", "activity", "18:30-19:15", "Andaman Sunset", "Slow sunset block before resort dinner.", { imageUrl: images.langkawiBeach, badge: "Sunset" }),
        item("d7-dinner", "restaurant", "19:30-21:00", "Resort Dinner", "No excursion on this low-fatigue island arrival day.", { imageUrl: images.food, badge: "Dinner", showButton: false, price: "" }),
      ],
      suggestions: [
        suggestion("d7-s1", "Langkawi SkyCab / SkyBridge", "Optional Sky Experience", "Only add if arrival is early and live availability supports it.", images.langkawiIsland),
        suggestion("d7-s2", "Less Expensive Langkawi Beach Resort", "Value Hotel", "Offer through Gene's existing recommendation system.", images.langkawiBeach),
      ],
      notes: [
        { icon: "ship", text: "Never assume ferry availability." },
        { icon: "hotel", text: "St. Regis remains the premium base unless admin changes it." },
        { icon: "water", text: "No excursion on arrival day." },
      ],
    }),
    day({
      dayNumber: 8,
      title: "Langkawi Nature Hero - Kilim Geoforest and Tanjung Rhu",
      destinationLabel: "Langkawi",
      imageUrl: images.kilim,
      routeFrom: "The St. Regis Langkawi",
      routeTo: "Kilim Geoforest, Tanjung Rhu",
      weatherLabel: "Mangroves + beach / Moderate fatigue",
      quote: "Mangrove channels cut through limestone before the afternoon opens onto beach light.",
      description:
        "A Langkawi nature hero day with Kilim mangrove boat tour and Tanjung Rhu. Wildlife is observational and never guaranteed.",
      items: [
        item("d8-breakfast", "restaurant", "07:30-08:30", "Breakfast", "Prepare for the half-day mangrove tour.", { imageUrl: images.food, badge: "Breakfast", showButton: false, price: "" }),
        item("d8-kilim", "boat", "09:00-13:00", "Langkawi: Kilim Mangrove Boat Tour with Lunch and Pickup", "GetYourGuide-preferred seed listing. Fetch exact live duration, itinerary, pickup and inclusions.", { imageUrl: images.kilim, badge: "Mangrove Boat", provider: "GetYourGuide preferred", affiliatePriority: "Maximum" }),
        item("d8-lunch", "restaurant", "13:00-14:00", "Lunch or Return Buffer", "Use provider data to decide whether lunch is included.", { imageUrl: images.food, badge: "Lunch", showButton: false, price: "" }),
        item("d8-rest", "rest", "14:00-15:30", "Hotel Rest", "Recovery after the mangrove tour.", { imageUrl: images.hotelLangkawi, badge: "Rest", showButton: false, price: "" }),
        item("d8-tanjung", "activity", "16:00-18:30", "Tanjung Rhu Beach", "Beach, scenery, photography and relaxation. Swimming only according to local conditions and safety guidance.", { imageUrl: images.langkawiBeach, badge: "Beach" }),
        item("d8-sunset", "activity", "18:30", "Tanjung Rhu Sunset", "Sunset coastal photography.", { imageUrl: images.langkawiBeach, badge: "Sunset" }),
        item("d8-dinner", "restaurant", "19:30-21:00", "Dinner", "Flexible Langkawi dinner.", { imageUrl: images.food, badge: "Dinner", showButton: false, price: "" }),
      ],
      suggestions: [
        suggestion("d8-s1", "Mangrove Boat and Kayak Variant", "Adventure Alternative", "Use only if currently bookable; do not combine with another full mangrove tour.", images.kilim),
        suggestion("d8-s2", "Private Mangrove Upgrade", "Comfort Upgrade", "Good for couples or families if provider inventory exists.", images.kilim),
      ],
      notes: [
        { icon: "leaf", text: "Wildlife sightings are never guaranteed." },
        { icon: "water", text: "Never promote feeding or disturbing wildlife." },
        { icon: "sun", text: "Tanjung Rhu is the relaxed sunset block." },
      ],
    }),
    day({
      dayNumber: 9,
      title: "Langkawi Island Hopping - Islands, Forest and Andaman Blue",
      destinationLabel: "Langkawi Islands",
      imageUrl: images.langkawiIsland,
      routeFrom: "The St. Regis Langkawi",
      routeTo: "Langkawi island-hopping route",
      weatherLabel: "Island hopping / Moderate fatigue",
      quote: "The Andaman turns into a chain of beaches, forested islands and boat-light horizons.",
      description:
        "A bookable island-hopping hero day. Provider itinerary wins; possible stops appear only when included in the selected live product.",
      items: [
        item("d9-breakfast", "restaurant", "07:30-08:30", "Breakfast", "Prepare for a half-day boat route.", { imageUrl: images.food, badge: "Breakfast", showButton: false, price: "" }),
        item("d9-island-hop", "boat", "09:00-13:30", "Langkawi: Island Hopping Shared Boat Tour", "GetYourGuide-preferred seed product. Retrieve exact route, itinerary, timing and inclusions at runtime.", { imageUrl: images.langkawiIsland, badge: "Island Hopping", provider: "GetYourGuide preferred", affiliatePriority: "Maximum" }),
        item("d9-lunch", "restaurant", "13:30-14:30", "Lunch", "Flexible lunch after the boat tour.", { imageUrl: images.food, badge: "Lunch", showButton: false, price: "" }),
        item("d9-rest", "rest", "14:30-16:30", "Mandatory Rest", "Required buffer before any optional late-afternoon add-on.", { imageUrl: images.hotelLangkawi, badge: "Rest", showButton: false, price: "" }),
        item("d9-skycab", "activity", "Optional late afternoon", "Optional Langkawi SkyCab / SkyBridge", "Show only if customer energy is high and live opening/availability creates at least a 90-minute buffer after the boat tour.", { imageUrl: images.langkawiIsland, badge: "Optional Sky", affiliatePriority: "Very High" }),
        item("d9-beach", "activity", "17:00-18:30", "Resort Beach or Sunset", "Default option when SkyCab/SkyBridge does not fit.", { imageUrl: images.langkawiBeach, badge: "Beach" }),
        item("d9-dinner", "restaurant", "19:30-21:00", "Farewell Dinner", "Final Langkawi dinner.", { imageUrl: images.food, badge: "Dinner", showButton: false, price: "" }),
      ],
      suggestions: [
        suggestion("d9-s1", "Private Island-Hopping Boat", "Luxury Upgrade", "Use only where exact provider inventory exists.", images.langkawiIsland),
        suggestion("d9-s2", "Skip SkyCab for Beach Time", "Slow Travel Choice", "Recommended if the boat tour returns late.", images.langkawiBeach),
      ],
      notes: [
        { icon: "ship", text: "Provider itinerary wins over assumed island stops." },
        { icon: "clock", text: "SkyCab requires a 90-minute buffer." },
        { icon: "bed", text: "Mandatory rest is part of the day design." },
      ],
    }),
    day({
      dayNumber: 10,
      title: "Departure - Final Morning by the Andaman Sea",
      destinationLabel: "Langkawi",
      imageUrl: images.hotelLangkawi,
      routeFrom: "The St. Regis Langkawi",
      routeTo: "Langkawi International Airport",
      weatherLabel: "Departure / Very low fatigue",
      quote: "The trip closes quietly: beach air, packing, and one last look at Andaman blue.",
      description:
        "Departure day only: breakfast, final resort or beach time, packing, hotel checkout and airport transfer with flight-specific buffer.",
      items: [
        item("d10-breakfast", "restaurant", "07:30-09:00", "Breakfast", "Slow final breakfast.", { imageUrl: images.food, badge: "Breakfast", showButton: false, price: "" }),
        item("d10-beach", "activity", "09:00-10:30", "Final Resort or Beach Time", "A gentle last morning by the Andaman Sea.", { imageUrl: images.langkawiBeach, badge: "Beach", showButton: false, price: "" }),
        item("d10-pack", "rest", "10:30-11:30", "Pack", "Final packing and room check.", { imageUrl: images.hotelLangkawi, badge: "Packing", showButton: false, price: "" }),
        item("d10-checkout", "hotel", "Live policy", "The St. Regis Langkawi Checkout", "Use live hotel policy for checkout timing.", { imageUrl: images.hotelLangkawi, badge: "Hotel" }),
        item("d10-transfer", "transportation", "Flight-specific", "Hotel to Langkawi International Airport", "Fetch live maps duration and apply Gene's airport-buffer rules.", { imageUrl: images.airport, badge: "Airport Transfer" }),
      ],
      suggestions: [
        suggestion("d10-s1", "Late Checkout Request", "Comfort Upgrade", "Only offer when hotel/provider confirms availability.", images.hotelLangkawi),
        suggestion("d10-s2", "Extra Langkawi Night", "Beach Lover Variant", "Best for travelers who want a longer island ending.", images.langkawiBeach),
      ],
      notes: [
        { icon: "plane", text: "No paid activity on departure day." },
        { icon: "clock", text: "Airport buffer depends on the real flight." },
        { icon: "water", text: "Keep the final morning relaxed." },
      ],
    }),
  ];

  return {
    hero: {
      eyebrow: "Level 1 • Plan #8 • Malaysia",
      title: PLAN_TITLE,
      subtitle:
        "Rise beneath Kuala Lumpur's glittering towers, climb into the limestone world of Batu Caves, taste your way through Penang's heritage streets, then trade city lights for Langkawi's rainforest, mangrove waterways and turquoise Andaman beaches.",
      imageUrl: images.hero,
      badge: "Beach • Island • City • Culture • Food • Nature • Luxury",
      stats: [
        { label: "Days", value: "10" },
        { label: "Countries", value: "1" },
        { label: "Cities", value: "4" },
        { label: "Travelers", value: "2" },
        { label: "Trip Style", value: "City Island" },
      ],
    },
    overview: {
      startingPoint: "Kuala Lumpur International Airport",
      destinations: "Kuala Lumpur, Batu Caves, Genting Highlands, Penang, George Town, Langkawi, Kilim Geoforest, Langkawi Islands",
      tripStyle: "Beach, island, city, culture, food, nature, luxury, adventure-light, couple, family, photography",
      travelers: "2 Adults",
      estimatedCost: "Live pricing",
      aiScore: "4.9",
    },
    days,
    commercialScore: {
      beach: "5/5",
      islands: "5/5",
      culture: "5/5",
      food: "5/5",
      nature: "5/5",
      city: "5/5",
      adventure: "4/5",
      luxury: "5/5",
      couples: "5/5",
      family: "4/5",
      photography: "5/5",
      affiliatePotential: "5/5",
      variety: "5/5",
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
    location: "Kuala Lumpur, Batu Caves, Genting Highlands, Penang, George Town, Langkawi",
    days: content.days.length,
    image_url: images.hero,
    created_at: timestamp,
    subtitle:
      "10 days from Kuala Lumpur's towers to Penang heritage food and Langkawi's Andaman beaches.",
    country: "Malaysia",
    city: "Kuala Lumpur, Penang, George Town, Langkawi",
    destination: "Malaysia",
    style: "Beach, Island, City, Culture, Food, Nature, Luxury, Adventure-Light, Couple, Family, Photography",
    daysCount: content.days.length,
    heroImage: images.hero,
    coverImage: images.hero,
    summary:
      "A 10-day Malaysia Ready Plan built around Kuala Lumpur, Batu Caves, Genting Highlands, Penang, George Town, Langkawi, Kilim Geoforest and island-hopping in the Andaman Sea.",
    seoTitle: PLAN_TITLE,
    seoDescription:
      "Draft ready plan for Malaysia: City Lights, Heritage Bites and Langkawi Blue with Kuala Lumpur, Penang and Langkawi.",
    tags: ["Malaysia", "Kuala Lumpur", "Penang", "George Town", "Langkawi", "Kilim Geoforest", "Batu Caves", "Beach", "Food"],
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
  console.error("INSERT_MALAYSIA_READY_PLAN_FAILED");
  console.error(error);
  process.exit(1);
});
