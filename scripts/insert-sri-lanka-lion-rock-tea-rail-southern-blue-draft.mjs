import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import crypto from "node:crypto";

const SOURCE_ENV_PATH = new URL("../.env", import.meta.url);
const SLUG = "sri-lanka-lion-rock-tea-rail-dreams-southern-blue";
const PLAN_TITLE = "Sri Lanka: Lion Rock, Tea-Rail Dreams & Southern Blue";

const commons = (fileName, width = 1280) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}?width=${width}`;

const images = {
  hero: commons("Secret Beach Mirissa.jpg", 1440),
  negombo: commons("Negombo, Beach, 2025-08 CN-01.jpg", 1280),
  airport: commons("Bandaranaike International Airport Terminal.JPG", 1280),
  sigiriya: commons("Sigiriya 02.jpg", 1280),
  dambulla: commons("Dambulla Rajamaha Viharaya.- Entrance to Dambulla Cave Temple.jpg", 1280),
  minneriya: commons("Minneriya National Park, Sri Lanka.jpg", 1280),
  kandy: commons("Kandy Lake - Temple of the Tooth.jpg", 1280),
  train: commons("Nine arch bridge, Ella, Sri lanka.jpg", 1280),
  ella: commons("Little adams peak, Ella Sri Lanka.jpg", 1280),
  nineArches: commons("Nine arch bridge, Ella, Sri lanka.jpg", 1280),
  tea: commons("Tea plantations in Sri Lanka.jpg", 1280),
  yala: commons("Safari in Yala National park Sri Lanka (29446546593).jpg", 1280),
  mirissa: commons("Secret Beach Mirissa.jpg", 1280),
  galle: commons("Lighthouse Galle, Sri Lanka.jpg", 1280),
  food: commons("Sri Lankan rice and curry.jpg", 1280),
  transfer: commons("Sri Lanka road.jpg", 1280),
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
    countryLabel: "Sri Lanka",
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
      title: "Arrival - Indian Ocean Soft Landing",
      destinationLabel: "Negombo",
      imageUrl: images.negombo,
      routeFrom: "Bandaranaike International Airport",
      routeTo: "Negombo beachfront hotel",
      weatherLabel: "Arrival / Low fatigue",
      quote: "The journey begins softly beside the Indian Ocean, close enough to rest before the inland road begins.",
      description:
        "A low-fatigue arrival day built around airport buffer, a short transfer to Negombo, rest, beach walk and an easy dinner.",
      items: [
        item("d1-arrival", "flight", "14:00", "Arrival at Bandaranaike International Airport", "Land in Sri Lanka without binding the plan to a specific flight.", { imageUrl: images.airport, badge: "Arrival", showButton: false }),
        item("d1-buffer", "transportation", "14:00-15:30", "Immigration, Baggage and Arrival Buffer", "A 90-minute arrival allowance before leaving the airport.", { imageUrl: images.airport, badge: "Airport" }),
        item("d1-transfer", "transportation", "15:30-16:15", "Airport to Negombo Beachfront Hotel", "Use live Maps data when customized.", { imageUrl: images.negombo, badge: "Transfer" }),
        item("d1-hotel", "hotel", "16:30", "Negombo Beachfront Hotel Check-In", "Gene should select the best available quality 4-5 star beachfront hotel for the traveler's dates.", { imageUrl: images.negombo, badge: "Hotel" }),
        item("d1-rest", "rest", "16:30-18:00", "Arrival Recovery", "Check in, refresh and recover from the flight.", { imageUrl: images.negombo, badge: "Rest", showButton: false, price: "" }),
        item("d1-beach", "activity", "18:00-19:00", "Negombo Beach Walk", "A gentle first walk beside the Indian Ocean.", { imageUrl: images.negombo, badge: "Beach", showButton: false, price: "" }),
        item("d1-dinner", "restaurant", "19:15-20:30", "Easy Negombo Dinner", "Flexible dinner with no paid tour on arrival day.", { imageUrl: images.food, badge: "Dinner", showButton: false, price: "" }),
      ],
      suggestions: [
        suggestion("d1-s1", "Airport Transfer Upgrade", "Comfort Upgrade", "Useful after a long international arrival.", images.negombo),
        suggestion("d1-s2", "Extra Negombo Beach Night", "Slow Travel", "Adds more rest before the Cultural Triangle.", images.negombo),
      ],
      notes: [
        { icon: "plane", text: "Do not force a long inland drive on arrival day." },
        { icon: "bed", text: "First night is designed for recovery." },
        { icon: "water", text: "Keep the evening simple and coastal." },
      ],
    }),
    day({
      dayNumber: 2,
      title: "Negombo to Sigiriya - Into Sri Lanka's Cultural Triangle",
      destinationLabel: "Dambulla, Sigiriya",
      imageUrl: images.dambulla,
      routeFrom: "Negombo",
      routeTo: "Dambulla Cave Temple, Sigiriya hotel",
      weatherLabel: "Culture transfer / Moderate fatigue",
      quote: "The coast gives way to temple caves, jungle roads and the first glimpse of Sri Lanka's ancient heart.",
      description:
        "Transfer from Negombo toward Sigiriya/Dambulla with lunch, Dambulla Cave Temple, hotel check-in, pool rest and a jungle-sunset evening.",
      items: [
        item("d2-breakfast", "restaurant", "07:30-08:30", "Breakfast", "Start before checkout.", { imageUrl: images.food, badge: "Breakfast", showButton: false, price: "" }),
        item("d2-checkout", "hotel", "09:00", "Negombo Checkout", "Leave the coast for Sri Lanka's Cultural Triangle.", { imageUrl: images.negombo, badge: "Hotel" }),
        item("d2-transfer", "transportation", "09:00-12:30", "Private Transfer to Sigiriya/Dambulla", "Use live routing data rather than hard-coding road duration; include one short rest break.", { imageUrl: images.transfer, badge: "Transfer" }),
        item("d2-lunch", "restaurant", "12:30-13:30", "Lunch", "Flexible lunch on the way inland.", { imageUrl: images.food, badge: "Lunch", showButton: false, price: "" }),
        item("d2-dambulla", "activity", "14:00-16:00", "Dambulla Cave Temple", "Create as attraction or bookable guided activity depending current provider availability. Do not invent entrance-fee inclusion.", { imageUrl: images.dambulla, badge: "UNESCO" }),
        item("d2-sigiriya-transfer", "transportation", "16:00-16:45", "Dambulla to Sigiriya Hotel", "Short transfer to the Sigiriya/Dambulla-area property.", { imageUrl: images.sigiriya, badge: "Transfer" }),
        item("d2-hotel", "hotel", "17:00", "Sigiriya Nature Hotel Check-In", "Use Jetwing Vil Uyana or another verified premium Sigiriya/Dambulla-area property subject to live availability.", { imageUrl: images.sigiriya, badge: "Hotel" }),
        item("d2-rest", "rest", "17:00-18:30", "Pool and Rest", "Recover after the road transfer.", { imageUrl: images.sigiriya, badge: "Rest", showButton: false, price: "" }),
        item("d2-sunset", "activity", "18:30-19:15", "Jungle Sunset", "Hotel grounds or nearby safe viewpoint depending property layout.", { imageUrl: images.sigiriya, badge: "Sunset", showButton: false, price: "" }),
      ],
      suggestions: [
        suggestion("d2-s1", "Premium Sigiriya Jungle Lodge", "Hotel Upgrade", "Useful for strong nature and photography appeal.", images.sigiriya),
        suggestion("d2-s2", "Dambulla Guided Context", "Culture Add-On", "Only show if current provider inventory supports the routing.", images.dambulla),
      ],
      notes: [
        { icon: "car", text: "Road timing must use live maps when customized." },
        { icon: "temple", text: "Dambulla entry details require live/official verification." },
        { icon: "bed", text: "Pool rest protects the next hero day." },
      ],
    }),
    day({
      dayNumber: 3,
      title: "Sigiriya Hero Day - Lion Rock and Wild Elephants",
      destinationLabel: "Sigiriya, Minneriya",
      imageUrl: images.sigiriya,
      routeFrom: "Sigiriya hotel",
      routeTo: "Sigiriya Lion Rock, Minneriya or current safari park",
      weatherLabel: "Hero excursion / High fatigue",
      quote: "Ancient stone rises over jungle, then the afternoon opens into wild-country silence.",
      description:
        "One of the plan's commercial hero days: Sigiriya Lion Rock followed by a wildlife safari, using the current Klook product where available.",
      items: [
        item("d3-breakfast", "restaurant", "06:30", "Breakfast", "Start early before heat and climb timing.", { imageUrl: images.food, badge: "Breakfast", showButton: false, price: "" }),
        item("d3-depart", "transportation", "07:30", "Departure", "Transfer to the Lion Rock start point.", { imageUrl: images.sigiriya, badge: "Transfer" }),
        item("d3-lion-rock", "activity", "08:00-11:00", "Sigiriya Lion Rock", "Use the current Klook Sigiriya Lion Rock and Minneriya Full-Day Safari Experience where live data supports it. Allow enough time for the climb.", { imageUrl: images.sigiriya, badge: "Hero Climb", provider: "Klook preferred", affiliatePriority: "Maximum" }),
        item("d3-lunch", "restaurant", "11:30-12:30", "Lunch", "Lunch after the climb.", { imageUrl: images.food, badge: "Lunch", showButton: false, price: "" }),
        item("d3-rest", "rest", "12:30-13:30", "Rest", "Recovery before the safari block.", { imageUrl: images.sigiriya, badge: "Rest", showButton: false, price: "" }),
        item("d3-safari", "activity", "14:00-17:30", "Minneriya / Kaudulla / Hurulu Wildlife Safari", "The selected park must follow provider live itinerary and operating conditions. Wildlife is observational and never guaranteed.", { imageUrl: images.minneriya, badge: "Wildlife", provider: "Klook preferred", affiliatePriority: "Maximum" }),
        item("d3-return", "transportation", "18:00", "Return to Hotel", "Return for rest and shower.", { imageUrl: images.sigiriya, badge: "Return" }),
        item("d3-dinner", "restaurant", "19:30", "Dinner", "No night tour after this high-fatigue day.", { imageUrl: images.food, badge: "Dinner", showButton: false, price: "" }),
      ],
      suggestions: [
        suggestion("d3-s1", "Private Safari Jeep Upgrade", "Wildlife Upgrade", "Only where a verified provider product exists.", images.yala),
        suggestion("d3-s2", "Late Morning Recovery Variant", "Comfort Choice", "Useful if the traveler wants to skip the afternoon safari.", images.sigiriya),
      ],
      notes: [
        { icon: "mountain", text: "Do not add another climb this morning." },
        { icon: "paw", text: "Never promise elephant or wildlife sightings." },
        { icon: "moon", text: "No night tour after the safari." },
      ],
    }),
    day({
      dayNumber: 4,
      title: "Sigiriya to Kandy - Temples, Spice Country and Sacred Kandy",
      destinationLabel: "Kandy",
      imageUrl: images.kandy,
      routeFrom: "Sigiriya",
      routeTo: "Kandy, Temple of the Tooth, Kandy Lake",
      weatherLabel: "Culture transfer / Moderate fatigue",
      quote: "The road bends toward sacred Kandy, lake light and the city that launches the blue train.",
      description:
        "Transfer from Sigiriya to Kandy with appropriate stops, hotel rest, Temple of the Tooth, Kandy Lake and early preparation for the train journey.",
      items: [
        item("d4-breakfast", "restaurant", "07:30", "Breakfast", "Simple breakfast before checkout.", { imageUrl: images.food, badge: "Breakfast", showButton: false, price: "" }),
        item("d4-checkout", "hotel", "09:00", "Sigiriya Checkout", "Leave the Cultural Triangle for Kandy.", { imageUrl: images.sigiriya, badge: "Hotel" }),
        item("d4-transfer", "transportation", "09:00-12:30", "Sigiriya to Kandy Transfer", "Use GetYourGuide transfer products only if routing matches; because Dambulla was already visited, do not duplicate it unnecessarily.", { imageUrl: images.transfer, badge: "Transfer", provider: "Gene transfer / GetYourGuide if matched" }),
        item("d4-lunch", "restaurant", "12:30-13:30", "Lunch", "Flexible lunch en route or in Kandy.", { imageUrl: images.food, badge: "Lunch", showButton: false, price: "" }),
        item("d4-hotel", "hotel", "14:00", "Kandy Central or Lake-Area Hotel Check-In", "Select a high-quality hotel with practical access to Temple of the Tooth, Kandy Lake and the railway station.", { imageUrl: images.kandy, badge: "Hotel" }),
        item("d4-rest", "rest", "14:00-15:30", "Rest", "Short recovery before the Kandy culture block.", { imageUrl: images.kandy, badge: "Rest", showButton: false, price: "" }),
        item("d4-temple", "activity", "16:00-17:30", "Temple of the Tooth and Central Kandy", "Use live official opening and access rules.", { imageUrl: images.kandy, badge: "Temple" }),
        item("d4-lake", "activity", "17:30-18:30", "Kandy Lake Walk", "Gentle walk near the lake.", { imageUrl: images.kandy, badge: "Lake", showButton: false, price: "" }),
        item("d4-dinner", "restaurant", "19:00-20:30", "Dinner", "Return early and prepare luggage for the train journey.", { imageUrl: images.food, badge: "Dinner", showButton: false, price: "" }),
      ],
      suggestions: [
        suggestion("d4-s1", "Private Sigiriya to Kandy Transfer", "Comfort Transfer", "Best if it avoids unnecessary duplicate Dambulla stops.", images.transfer),
        suggestion("d4-s2", "Kandy Cultural Guide", "Culture Add-On", "Only if live opening/access and timing fit.", images.kandy),
      ],
      notes: [
        { icon: "train", text: "Prepare luggage for Day 5's scenic train." },
        { icon: "temple", text: "Temple access must use official/live rules." },
        { icon: "route", text: "Do not duplicate Dambulla." },
      ],
    }),
    day({
      dayNumber: 5,
      title: "Kandy to Ella - The Blue Train Through Tea Country",
      destinationLabel: "Ella",
      imageUrl: images.train,
      routeFrom: "Kandy",
      routeTo: "Ella",
      weatherLabel: "Hero rail / Moderate fatigue",
      quote: "The train slips through tea country, viaducts and mountain mist toward Ella.",
      description:
        "Hero Product #2: Kandy to Ella scenic train with live seat, station, class, departure and arrival details from provider/rail data.",
      items: [
        item("d5-breakfast", "restaurant", "06:30-07:30", "Breakfast", "Early breakfast before checkout.", { imageUrl: images.food, badge: "Breakfast", showButton: false, price: "" }),
        item("d5-checkout", "hotel", "07:30", "Kandy Hotel Checkout", "Transfer to Kandy railway station.", { imageUrl: images.kandy, badge: "Hotel" }),
        item("d5-station", "transportation", "Morning", "Hotel to Kandy Railway Station", "Station transfer with luggage buffer.", { imageUrl: images.train, badge: "Station Transfer" }),
        item("d5-train", "transportation", "Live schedule", "Kandy to Ella Scenic Train Reserved Seat", "Klook-preferred listing. Do not hard-code departure; store actual train, class, station, departure, arrival and reserved-seat status from live data.", { imageUrl: images.train, badge: "Scenic Train", provider: "Klook preferred", affiliatePriority: "Maximum" }),
        item("d5-snacks", "restaurant", "During journey", "Simple Meal or Snacks", "Do not promise dining service onboard.", { imageUrl: images.food, badge: "Snacks", showButton: false, price: "" }),
        item("d5-ella-arrival", "transportation", "15:00-16:00 target", "Ella Arrival and Hotel Transfer", "Arrival depends on live railway schedule.", { imageUrl: images.ella, badge: "Arrival Transfer" }),
        item("d5-hotel", "hotel", "16:00", "Ella Hill-View Hotel Check-In", "Use 98 Acres Resort & Spa or another verified hill-view property subject to live availability.", { imageUrl: images.ella, badge: "Hotel" }),
        item("d5-recovery", "rest", "16:00-18:00", "Mandatory Recovery", "No full excursion after the train.", { imageUrl: images.ella, badge: "Rest", showButton: false, price: "" }),
        item("d5-town", "activity", "18:00-19:00", "Easy Ella Town Walk", "A light walk before dinner.", { imageUrl: images.ella, badge: "Easy Walk", showButton: false, price: "" }),
      ],
      suggestions: [
        suggestion("d5-s1", "Premium Reserved Seat Option", "Train Upgrade", "Use when live inventory supports better seating.", images.train),
        suggestion("d5-s2", "Skip Evening Walk", "Recovery Choice", "Best if train arrival is delayed.", images.ella),
      ],
      notes: [
        { icon: "train", text: "Sri Lankan rail schedules and ticket availability must be verified." },
        { icon: "clock", text: "Do not add another full-day excursion." },
        { icon: "food", text: "Do not promise onboard dining." },
      ],
    }),
    day({
      dayNumber: 6,
      title: "Ella Hero Day - Nine Arches, Little Adam's Peak and Tea",
      destinationLabel: "Ella",
      imageUrl: images.nineArches,
      routeFrom: "Ella hotel",
      routeTo: "Little Adam's Peak, Nine Arches Bridge, tea country",
      weatherLabel: "Hill-country hero / Moderate-high fatigue",
      quote: "Ella is green movement: a soft climb, a stone bridge, tea leaves and mountain air.",
      description:
        "Choose one live GetYourGuide Ella product combining Little Adam's Peak, Nine Arches Bridge and tea factory or waterfalls. Never insert both alternatives.",
      items: [
        item("d6-breakfast", "restaurant", "07:00", "Breakfast", "Start before the hill-country route.", { imageUrl: images.food, badge: "Breakfast", showButton: false, price: "" }),
        item("d6-depart", "transportation", "08:00", "Departure", "Transfer or walk based on selected product pickup.", { imageUrl: images.ella, badge: "Departure" }),
        item("d6-little-adams", "activity", "08:00-09:30", "Little Adam's Peak", "Soft adventure-light climb with hill-country views.", { imageUrl: images.ella, badge: "Viewpoint", provider: "GetYourGuide preferred", affiliatePriority: "Maximum" }),
        item("d6-nine-arches", "activity", "10:00-11:30", "Nine Arches Bridge", "One of Sri Lanka's strongest rail-country photo moments.", { imageUrl: images.nineArches, badge: "Bridge" }),
        item("d6-lunch", "restaurant", "12:30-13:30", "Lunch", "Lunch during the Ella route.", { imageUrl: images.food, badge: "Lunch", showButton: false, price: "" }),
        item("d6-tea", "activity", "14:00-15:30", "Tea Factory or Tea-Country Experience", "Use exact provider inclusion and avoid inventing tasting details.", { imageUrl: images.tea, badge: "Tea Country" }),
        item("d6-return", "transportation", "16:00", "Return to Hotel", "Return before rest.", { imageUrl: images.ella, badge: "Return" }),
        item("d6-rest", "rest", "16:00-18:30", "Pool and Rest", "No Ella Rock on this same day.", { imageUrl: images.ella, badge: "Rest", showButton: false, price: "" }),
        item("d6-dinner", "restaurant", "19:00", "Dinner", "Flexible Ella dinner.", { imageUrl: images.food, badge: "Dinner", showButton: false, price: "" }),
      ],
      suggestions: [
        suggestion("d6-s1", "Ella Rock Hiking Variant", "Adventure Alternative", "Add only by replacing another Ella activity, not stacking it onto this full itinerary.", images.ella),
        suggestion("d6-s2", "Waterfall Variant", "Nature Alternative", "Use if selected live product includes waterfalls instead of tea.", images.ella),
      ],
      notes: [
        { icon: "mountain", text: "Do not add Ella Rock on the same day." },
        { icon: "ticket", text: "Choose one live Ella product only." },
        { icon: "leaf", text: "Tea experience details come from provider inclusions." },
      ],
    }),
    day({
      dayNumber: 7,
      title: "Ella to Yala - Waterfalls to Wilderness",
      destinationLabel: "Yala, Tissamaharama",
      imageUrl: images.yala,
      routeFrom: "Ella",
      routeTo: "Yala or Tissamaharama",
      weatherLabel: "Safari transfer / Moderate-high fatigue",
      quote: "The road drops from mountain green toward dry-zone wilderness and safari dust.",
      description:
        "Transfer from Ella to Yala/Tissamaharama, then an afternoon half-day safari. Do not use a full-day safari after the Ella transfer.",
      items: [
        item("d7-breakfast", "restaurant", "07:30", "Breakfast", "Begin before checkout.", { imageUrl: images.food, badge: "Breakfast", showButton: false, price: "" }),
        item("d7-checkout", "hotel", "09:00", "Ella Checkout", "Leave hill country for Yala.", { imageUrl: images.ella, badge: "Hotel" }),
        item("d7-transfer", "transportation", "09:00-12:00", "Ella to Yala/Tissamaharama", "Use live Maps route; optional scenic stop only if it does not compromise safari time.", { imageUrl: images.transfer, badge: "Transfer" }),
        item("d7-lunch", "restaurant", "12:00-13:00", "Lunch", "Lunch before check-in and safari.", { imageUrl: images.food, badge: "Lunch", showButton: false, price: "" }),
        item("d7-hotel", "hotel", "13:00-14:00", "Yala / Tissamaharama Safari Hotel Check-In", "Use Cinnamon Wild Yala or another verified premium base subject to provider validation.", { imageUrl: images.yala, badge: "Safari Hotel" }),
        item("d7-safari", "activity", "14:30-18:30", "Yala National Park Afternoon Safari", "Use an afternoon/half-day GetYourGuide or Klook product. Store live pickup, duration, jeep, guide, park-entry and inclusion details.", { imageUrl: images.yala, badge: "Safari", provider: "GetYourGuide / Klook", affiliatePriority: "Maximum" }),
        item("d7-dinner", "restaurant", "19:30-20:30", "Dinner", "Early dinner and sleep after safari.", { imageUrl: images.food, badge: "Dinner", showButton: false, price: "" }),
      ],
      suggestions: [
        suggestion("d7-s1", "Private Safari Jeep", "Wildlife Upgrade", "Good for photographers if provider inventory exists.", images.yala),
        suggestion("d7-s2", "Morning Safari Swap", "Timing Alternative", "Only if the route is adjusted and live products support it.", images.yala),
      ],
      notes: [
        { icon: "paw", text: "Never promise leopards or specific wildlife." },
        { icon: "clock", text: "No full-day safari after the Ella transfer." },
        { icon: "bed", text: "Plan an early sleep." },
      ],
    }),
    day({
      dayNumber: 8,
      title: "Yala to Mirissa - From Safari Dust to Indian Ocean Blue",
      destinationLabel: "Mirissa, Weligama",
      imageUrl: images.mirissa,
      routeFrom: "Yala",
      routeTo: "Mirissa or Weligama coast",
      weatherLabel: "Recovery transfer / Low fatigue",
      quote: "Safari dust gives way to palms, beach light and the slow sound of the southern coast.",
      description:
        "A deliberate recovery and transition day from Yala to Mirissa/Weligama with beach time and no paid tour.",
      items: [
        item("d8-breakfast", "restaurant", "07:30-08:30", "Breakfast", "Slow breakfast before checkout.", { imageUrl: images.food, badge: "Breakfast", showButton: false, price: "" }),
        item("d8-checkout", "hotel", "09:00", "Yala Hotel Checkout", "Leave Yala for the southern coast.", { imageUrl: images.yala, badge: "Hotel" }),
        item("d8-transfer", "transportation", "09:00-12:00", "Transfer to Mirissa/Weligama", "Use normal private transfer. Do not add another safari because Yala was already used.", { imageUrl: images.transfer, badge: "Transfer" }),
        item("d8-lunch", "restaurant", "12:00-13:00", "Lunch", "Flexible lunch before coastal hotel check-in.", { imageUrl: images.food, badge: "Lunch", showButton: false, price: "" }),
        item("d8-hotel", "hotel", "14:00", "Mirissa / Weligama Beachfront Hotel Check-In", "Use a high-quality beachfront property with Mirissa activities accessible without excessive transfers.", { imageUrl: images.mirissa, badge: "Beach Hotel" }),
        item("d8-rest", "rest", "14:00-16:00", "Check-In and Rest", "Mandatory recovery after Yala.", { imageUrl: images.mirissa, badge: "Rest", showButton: false, price: "" }),
        item("d8-beach", "activity", "16:00-18:30", "Mirissa Beach", "Beach time with optional Parrot Rock or Coconut Tree Hill only when timing and access are practical.", { imageUrl: images.mirissa, badge: "Beach", showButton: false, price: "" }),
        item("d8-dinner", "restaurant", "19:00-20:30", "Seafood or Local Dinner", "No paid tour on this transition day.", { imageUrl: images.food, badge: "Dinner", showButton: false, price: "" }),
      ],
      suggestions: [
        suggestion("d8-s1", "Weligama Surf Intro", "Beach Add-On", "Only add with verified provider and safe conditions.", images.mirissa),
        suggestion("d8-s2", "Pure Recovery Evening", "Slow Travel", "Recommended after Yala safari.", images.mirissa),
      ],
      notes: [
        { icon: "water", text: "This is intentionally a recovery beach day." },
        { icon: "paw", text: "Do not add another safari." },
        { icon: "camera", text: "Coconut Tree Hill is optional, not forced." },
      ],
    }),
    day({
      dayNumber: 9,
      title: "Mirissa Ocean Morning - Marine Wildlife and Slow Beach Afternoon",
      destinationLabel: "Mirissa",
      imageUrl: images.mirissa,
      routeFrom: "Mirissa/Weligama hotel",
      routeTo: "Mirissa Harbour and beach",
      weatherLabel: "Ocean wildlife / Moderate fatigue",
      quote: "The ocean morning starts early, then the coast slows back into barefoot time.",
      description:
        "An early marine wildlife cruise if a responsible current product is available, followed by mandatory rest and beach time.",
      items: [
        item("d9-wake", "rest", "05:45-06:15", "Wake and Light Breakfast", "Early start for the ocean morning.", { imageUrl: images.food, badge: "Early Start", showButton: false, price: "" }),
        item("d9-harbour", "transportation", "06:30", "Transfer to Mirissa Harbour", "Use live pickup details from selected provider.", { imageUrl: images.mirissa, badge: "Harbour Transfer" }),
        item("d9-whale", "boat", "07:00-11:00 target", "Mirissa Whale-Watching Cruise", "Use exact live GetYourGuide product with responsible operator, safety, reviews, pickup and cancellation terms. Wildlife is never guaranteed.", { imageUrl: images.mirissa, badge: "Marine Wildlife", provider: "GetYourGuide preferred", affiliatePriority: "Very High" }),
        item("d9-return", "transportation", "11:30", "Return to Hotel", "Return timing depends on the live listing.", { imageUrl: images.mirissa, badge: "Return" }),
        item("d9-lunch", "restaurant", "12:00-13:00", "Lunch", "Lunch after the cruise.", { imageUrl: images.food, badge: "Lunch", showButton: false, price: "" }),
        item("d9-rest", "rest", "13:00-16:00", "Mandatory Rest", "The early start requires recovery.", { imageUrl: images.mirissa, badge: "Rest", showButton: false, price: "" }),
        item("d9-beach", "activity", "16:00-18:30", "Mirissa Beach or Hotel Pool", "Slow afternoon by the coast.", { imageUrl: images.mirissa, badge: "Beach", showButton: false, price: "" }),
        item("d9-dinner", "restaurant", "19:00", "Dinner", "Flexible coast dinner.", { imageUrl: images.food, badge: "Dinner", showButton: false, price: "" }),
      ],
      suggestions: [
        suggestion("d9-s1", "Turtle Snorkeling Add-On", "Beach Lover", "Only if conditions and verified provider data permit.", images.mirissa),
        suggestion("d9-s2", "Skip Cruise for Slow Beach Morning", "Slow Travel", "Good if the traveler dislikes early starts.", images.mirissa),
      ],
      notes: [
        { icon: "whale", text: "Never guarantee whales or dolphins." },
        { icon: "clock", text: "Cruise products usually require an early start." },
        { icon: "bed", text: "Mandatory rest follows the cruise." },
      ],
    }),
    day({
      dayNumber: 10,
      title: "Galle and South Coast - Fort Walls, Hidden Beaches and Final Sunset",
      destinationLabel: "Galle, South Coast",
      imageUrl: images.galle,
      routeFrom: "Mirissa/Weligama",
      routeTo: "Galle Fort and selected southern beach",
      weatherLabel: "Culture + beach / Moderate fatigue",
      quote: "Dutch walls, lighthouse wind and southern beaches close the story with warm coast light.",
      description:
        "A final south-coast day with Galle Fort walking tour, lunch, one selected beach block and farewell dinner.",
      items: [
        item("d10-breakfast", "restaurant", "08:00-09:00", "Breakfast", "Start before the Galle excursion.", { imageUrl: images.food, badge: "Breakfast", showButton: false, price: "" }),
        item("d10-depart", "transportation", "09:30", "Departure to Galle", "Transfer from Mirissa/Weligama to Galle.", { imageUrl: images.transfer, badge: "Transfer" }),
        item("d10-fort", "activity", "10:15-11:45", "Galle Fort Walking Tour", "GetYourGuide-preferred current product. Choose one: Galle Fort walking tour or Mirissa-to-Galle coastal highlights, not both.", { imageUrl: images.galle, badge: "Fort Walk", provider: "GetYourGuide preferred", affiliatePriority: "High" }),
        item("d10-lunch", "restaurant", "12:00-13:00", "Lunch in or Near Galle", "Lunch inside/near the fort area.", { imageUrl: images.food, badge: "Lunch", showButton: false, price: "" }),
        item("d10-beach-transfer", "transportation", "13:15-14:00", "Transfer to Selected Southern Beach", "Choose one beach according to weather, customer preference and traffic.", { imageUrl: images.mirissa, badge: "Transfer" }),
        item("d10-beach", "activity", "14:00-17:00", "South Coast Beach Block", "Choose Unawatuna, Dalawella/Mihiripenna or return to Mirissa. Do not add all beaches just to increase item count.", { imageUrl: images.mirissa, badge: "Beach", showButton: false, price: "" }),
        item("d10-sunset", "activity", "17:00-18:30", "Final South-Coast Sunset", "Final sunset by the Indian Ocean.", { imageUrl: images.mirissa, badge: "Sunset", showButton: false, price: "" }),
        item("d10-dinner", "restaurant", "19:00-20:30", "Farewell Dinner", "Last dinner on the southern coast.", { imageUrl: images.food, badge: "Dinner", showButton: false, price: "" }),
      ],
      suggestions: [
        suggestion("d10-s1", "Private Galle Fort Guide", "Culture Upgrade", "Good for travelers wanting deeper context.", images.galle),
        suggestion("d10-s2", "Unawatuna Beach Variant", "Beach Variant", "Use only when traffic and weather make it practical.", images.mirissa),
      ],
      notes: [
        { icon: "fort", text: "Choose one Galle product only." },
        { icon: "water", text: "Do not force multiple beaches." },
        { icon: "sun", text: "Final sunset should stay relaxed." },
      ],
    }),
    day({
      dayNumber: 11,
      title: "Departure - One Last Indian Ocean Morning",
      destinationLabel: "Mirissa/Weligama, Colombo Airport",
      imageUrl: images.mirissa,
      routeFrom: "Mirissa/Weligama",
      routeTo: "Colombo Airport",
      weatherLabel: "Departure / Low fatigue",
      quote: "One last ocean morning, then the long road back toward the flight home.",
      description:
        "Departure day with beach or pool time if flight permits, packing, checkout and a significant transfer to Colombo Airport calculated backwards from the real flight.",
      items: [
        item("d11-breakfast", "restaurant", "07:30-09:00", "Breakfast", "Slow final breakfast.", { imageUrl: images.food, badge: "Breakfast", showButton: false, price: "" }),
        item("d11-beach", "activity", "09:00-10:00", "Beach or Pool If Flight Permits", "Only if the real flight timing allows.", { imageUrl: images.mirissa, badge: "Morning", showButton: false, price: "" }),
        item("d11-pack", "rest", "10:00", "Packing", "Final packing and room check.", { imageUrl: images.mirissa, badge: "Packing", showButton: false, price: "" }),
        item("d11-checkout", "hotel", "Live policy", "Coastal Hotel Checkout", "Use live hotel policy.", { imageUrl: images.mirissa, badge: "Hotel" }),
        item("d11-transfer", "transportation", "Flight-specific", "Mirissa/Weligama to Colombo Airport", "Use live traffic data and calculate departure backwards from the real international flight with Gene airport-buffer rules.", { imageUrl: images.transfer, badge: "Airport Transfer" }),
      ],
      suggestions: [
        suggestion("d11-s1", "Extra South-Coast Night", "Beach Lover", "Adds real beach time rather than another excursion.", images.mirissa),
        suggestion("d11-s2", "Colombo Stopover Alternative", "Logistics Variant", "Use only if flight timing makes the coast-to-airport road too tight.", images.transfer),
      ],
      notes: [
        { icon: "plane", text: "No paid activity on departure day." },
        { icon: "car", text: "Airport transfer is a significant road journey." },
        { icon: "clock", text: "Calculate backwards from the real flight." },
      ],
    }),
  ];

  return {
    hero: {
      eyebrow: "Level 1 • Plan #9 • Sri Lanka",
      title: PLAN_TITLE,
      subtitle:
        "Climb above Sri Lanka's jungle from an ancient rock kingdom, cross emerald tea country aboard the legendary blue train, wake among misty mountains and waterfalls, search the wilderness of Yala, then finish barefoot beside the golden beaches of the Indian Ocean.",
      imageUrl: images.hero,
      badge: "Beach • Wildlife • Culture • Scenic Train • Nature • Photography",
      stats: [
        { label: "Days", value: "11" },
        { label: "Countries", value: "1" },
        { label: "Cities", value: "7" },
        { label: "Travelers", value: "2" },
        { label: "Trip Style", value: "Wild Coast" },
      ],
    },
    overview: {
      startingPoint: "Bandaranaike International Airport",
      destinations: "Negombo, Sigiriya, Dambulla, Minneriya, Kandy, Ella, Yala, Mirissa, Galle",
      tripStyle: "Beach, wildlife, culture, scenic train, nature, adventure-light, food, honeymoon, photography",
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
    location: "Negombo, Sigiriya, Kandy, Ella, Yala, Mirissa, Galle",
    days: content.days.length,
    image_url: images.hero,
    created_at: timestamp,
    subtitle:
      "11 days from Lion Rock and the blue train to Yala safari, Mirissa beaches and Galle Fort.",
    country: "Sri Lanka",
    city: "Negombo, Sigiriya, Kandy, Ella, Yala, Mirissa, Galle",
    destination: "Sri Lanka",
    style: "Beach, Wildlife, Culture, Scenic Train, Nature, Adventure-Light, Food, Honeymoon, Photography",
    daysCount: content.days.length,
    heroImage: images.hero,
    coverImage: images.hero,
    summary:
      "An 11-day Sri Lanka Ready Plan built around Sigiriya Lion Rock, Dambulla, Kandy, the Kandy to Ella train, Nine Arches Bridge, tea country, Yala safari, Mirissa, and Galle Fort.",
    seoTitle: PLAN_TITLE,
    seoDescription:
      "Draft ready plan for Sri Lanka: Lion Rock, Tea-Rail Dreams and Southern Blue with Sigiriya, Kandy, Ella, Yala, Mirissa and Galle.",
    tags: ["Sri Lanka", "Sigiriya", "Kandy", "Ella", "Yala", "Mirissa", "Galle", "Scenic Train", "Wildlife", "Beach"],
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
  console.error("INSERT_SRI_LANKA_READY_PLAN_FAILED");
  console.error(error);
  process.exit(1);
});
