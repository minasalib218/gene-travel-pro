import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import crypto from "node:crypto";

const SOURCE_ENV_PATH = new URL("../.env", import.meta.url);
const SLUG = "china-imperial-walls-terracotta-legends-shanghai-glow";
const PLAN_TITLE = "China: Imperial Walls, Terracotta Legends & Shanghai Glow";

const commons = (fileName, width = 1280) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}?width=${width}`;

const images = {
  hero: commons("Great wall of china-mutianyu 4.JPG", 1440),
  beijing: commons("Tiananmen Square & Forbidden City- Beijing, China, Sept 28 2017 (38023600581).jpg", 1280),
  wangfujing: commons("Wangfujing Intime in88 (20170808134750).jpg", 1280),
  forbidden: commons("Tiananmen Square & Forbidden City- Beijing, China, Sept 28 2017 (38089895276).jpg", 1280),
  temple: commons("Temple of Heaven, Beijing, China - 010 edit.jpg", 1280),
  wall: commons("The Mutianyu section of the Great Wall of China.jpg", 1440),
  rail: commons("CR400BF-C-2213 at Yabaolu (20230911142310).jpg", 1280),
  xian: commons("Xian China Terracotta-Army-Museum-01.jpg", 1280),
  terracotta: commons("Xian China Terracotta-Army-Museum-04.jpg", 1280),
  shanghai: commons("Lujiazui skyline by night from Bund, fully illuminated.jpg", 1440),
  bund: commons("THE BUND SHANGHAI AT NIGHT CHINA OCT 2012 3 (8154174510).jpg", 1280),
  yuyuan: commons("Shanghai - Yu Garden - 0035.jpg", 1280),
  zhujiajiao: commons("Zhujiajiao ancient water town, Nr. Shanghai, China - 1.jpg", 1280),
  disney: commons("Shanghai disneyland castle.jpg", 1280),
  food: commons("Peking duck at Quanjude.jpg", 1280),
  airport: commons("Beijing Daxing International Airport terminal.jpg", 1280),
};

function asId() {
  return crypto.randomUUID();
}

function item(id, type, time, title, description, extra = {}) {
  const bookable = ["hotel", "activity", "transportation", "flight", "event"].includes(type);
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
    countryLabel: "China",
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
      title: "Beijing Arrival - First Night in Imperial China",
      destinationLabel: "Beijing",
      imageUrl: images.wangfujing,
      routeFrom: "Beijing airport",
      routeTo: "JW Marriott Hotel Beijing Central, Wangfujing",
      weatherLabel: "Arrival / Low fatigue",
      quote: "The first evening keeps Beijing soft: arrival, rest and a flexible central walk.",
      description:
        "A low-fatigue arrival day with airport buffer, hotel transfer, recovery, Wangfujing or central Beijing evening walk and dinner.",
      items: [
        item("d1-arrival", "flight", "14:00", "Arrival in Beijing", "Arrival target without binding the plan to a specific flight.", { imageUrl: images.airport, badge: "Arrival", showButton: false }),
        item("d1-buffer", "transportation", "14:00-15:30", "Immigration, Baggage and Airport Buffer", "Arrival processing before leaving the airport.", { imageUrl: images.airport, badge: "Airport" }),
        item("d1-transfer", "transportation", "15:30-17:00", "Airport to Hotel", "Keep 60-90 minutes as planning allowance and replace it with live map data.", { imageUrl: images.beijing, badge: "Transfer" }),
        item("d1-hotel", "hotel", "17:00", "JW Marriott Hotel Beijing Central Check-In", "Premium central base for Beijing's historical section. Use live hotel API for room inventory and prices.", { imageUrl: images.beijing, badge: "Hotel", affiliatePriority: "Very High" }),
        item("d1-rest", "rest", "17:00-18:30", "Arrival Recovery", "Rest after travel. No paid activity.", { imageUrl: images.beijing, badge: "Rest", showButton: false, price: "" }),
        item("d1-wangfujing", "activity", "18:45-20:00", "Wangfujing / Central Beijing Evening Walk", "Flexible sightseeing rather than a timed booking.", { imageUrl: images.wangfujing, badge: "Evening Walk", showButton: false, price: "" }),
        item("d1-dinner", "restaurant", "20:00-21:00", "Dinner", "Flexible first Beijing dinner.", { imageUrl: images.food, badge: "Dinner", showButton: false, price: "" }),
      ],
      suggestions: [
        suggestion("d1-s1", "Private Airport Transfer", "Comfort Upgrade", "Useful after an international arrival.", images.airport),
        suggestion("d1-s2", "Peking Duck Dinner Upgrade", "Food Add-On", "Offer only if live restaurant/provider availability fits arrival timing.", images.food),
      ],
      notes: [
        { icon: "plane", text: "Arrival day stays light." },
        { icon: "bed", text: "No paid activity on Day 1." },
        { icon: "city", text: "Wangfujing remains flexible." },
      ],
    }),
    day({
      dayNumber: 2,
      title: "Forbidden City and Imperial Beijing",
      destinationLabel: "Beijing",
      imageUrl: images.forbidden,
      routeFrom: "Beijing hotel",
      routeTo: "Forbidden City, Tiananmen area, Temple of Heaven",
      weatherLabel: "Imperial city / Moderate fatigue",
      quote: "Palace courtyards, ceremonial space and temple gardens open China's imperial scale.",
      description:
        "A major Beijing culture day with Forbidden City/Tiananmen area and Temple of Heaven, using live provider meeting times and ticket availability.",
      items: [
        item("d2-breakfast", "restaurant", "07:00-08:00", "Breakfast", "Start early for access procedures.", { imageUrl: images.food, badge: "Breakfast", showButton: false, price: "" }),
        item("d2-transfer", "transportation", "08:15-08:45", "Transfer to Meeting Point", "Exact meeting point should come from the provider.", { imageUrl: images.forbidden, badge: "Transfer" }),
        item("d2-forbidden", "activity", "09:00-12:30", "Forbidden City, Tiananmen Square and Treasure Museum Small Group Tour", "Klook-preferred English-guided product. Give enough time for security/access procedures.", { imageUrl: images.forbidden, badge: "Imperial Tour", provider: "Klook preferred", affiliatePriority: "Maximum" }),
        item("d2-lunch", "restaurant", "12:30-13:30", "Lunch", "Flexible lunch after the palace section.", { imageUrl: images.food, badge: "Lunch", showButton: false, price: "" }),
        item("d2-temple-transfer", "transportation", "13:30-14:15", "Transfer to Temple of Heaven", "Transfer between major sightseeing zones.", { imageUrl: images.temple, badge: "Transfer" }),
        item("d2-temple", "activity", "14:30-16:30", "Temple of Heaven", "Use current Temple of Heaven admission/provider availability when bookable.", { imageUrl: images.temple, badge: "Temple", provider: "Klook if available", affiliatePriority: "High" }),
        item("d2-rest", "rest", "17:15-19:00", "Hotel Rest", "Recovery before dinner.", { imageUrl: images.beijing, badge: "Rest", showButton: false, price: "" }),
        item("d2-dinner", "restaurant", "19:00-20:30", "Dinner", "Free evening after dinner.", { imageUrl: images.food, badge: "Dinner", showButton: false, price: "" }),
      ],
      suggestions: [
        suggestion("d2-s1", "Treasure Museum Focus", "Culture Upgrade", "Use where provider package includes it.", images.forbidden),
        suggestion("d2-s2", "Evening Free Time", "Recovery Choice", "Recommended before the Great Wall hero day.", images.beijing),
      ],
      notes: [
        { icon: "ticket", text: "Provider meeting time and access rules must be live." },
        { icon: "temple", text: "Temple admission must be verified." },
        { icon: "bed", text: "Free evening protects Day 3 energy." },
      ],
    }),
    day({
      dayNumber: 3,
      title: "Great Wall Hero Day - Mutianyu Above the Mountains",
      destinationLabel: "Mutianyu Great Wall",
      imageUrl: images.wall,
      routeFrom: "Beijing",
      routeTo: "Mutianyu Great Wall",
      weatherLabel: "Hero excursion / High fatigue",
      quote: "The wall rises over ridges and valleys, the plan's biggest Beijing affiliate moment.",
      description:
        "A full-day Mutianyu Great Wall experience. Package inclusions such as shuttle, cable car, ropeway or toboggan must come from the selected provider.",
      items: [
        item("d3-breakfast", "restaurant", "06:30-07:15", "Breakfast", "Early breakfast before pickup.", { imageUrl: images.food, badge: "Breakfast", showButton: false, price: "" }),
        item("d3-pickup", "transportation", "07:30-08:00", "Meeting / Pickup", "Exact pickup time depends on live product.", { imageUrl: images.wall, badge: "Pickup" }),
        item("d3-drive", "transportation", "08:00-10:00", "Beijing to Mutianyu", "Travel time varies by pickup point and traffic.", { imageUrl: images.wall, badge: "Transfer" }),
        item("d3-wall", "activity", "10:00-13:30", "Beijing Mutianyu Great Wall Full-Day Exploration", "Klook-preferred full-day hero product. Do not claim cable car, ropeway, shuttle or toboggan unless selected package includes it.", { imageUrl: images.wall, badge: "Great Wall", provider: "Klook preferred", affiliatePriority: "Maximum" }),
        item("d3-lunch", "restaurant", "13:30-14:30", "Lunch", "Lunch according to selected tour package or free choice.", { imageUrl: images.food, badge: "Lunch", showButton: false, price: "" }),
        item("d3-final-wall", "activity", "14:30-15:30", "Final Wall / Viewpoint Time", "Extra wall/viewpoint time where provider schedule permits.", { imageUrl: images.wall, badge: "Viewpoint" }),
        item("d3-return", "transportation", "15:30-17:30", "Return to Beijing", "Return transfer to hotel/meeting point.", { imageUrl: images.wall, badge: "Return" }),
        item("d3-rest", "rest", "18:00-19:30", "Mandatory Rest", "No evening tour after the Great Wall.", { imageUrl: images.beijing, badge: "Rest", showButton: false, price: "" }),
        item("d3-dinner", "restaurant", "20:00", "Light Dinner", "Simple dinner after a high-fatigue day.", { imageUrl: images.food, badge: "Dinner", showButton: false, price: "" }),
      ],
      suggestions: [
        suggestion("d3-s1", "Cable Car / Toboggan Package", "Wall Upgrade", "Only show if selected product includes or offers it.", images.wall),
        suggestion("d3-s2", "Private Mutianyu Upgrade", "Comfort Upgrade", "Good for families or photographers if live inventory exists.", images.wall),
      ],
      notes: [
        { icon: "mountain", text: "This is one of the largest affiliate cards." },
        { icon: "clock", text: "No evening tour after the wall." },
        { icon: "ticket", text: "Package inclusions must be exact." },
      ],
    }),
    day({
      dayNumber: 4,
      title: "Beijing to Xi'an - From Imperial Capital to the Silk Road",
      destinationLabel: "Xi'an",
      imageUrl: images.rail,
      routeFrom: "Beijing",
      routeTo: "Xi'an",
      weatherLabel: "Rail transfer / Low-moderate fatigue",
      quote: "High-speed rail carries the story from imperial Beijing toward Silk Road Xi'an.",
      description:
        "A lighter travel day by high-speed rail to Xi'an, followed by a moderate City Wall and Muslim Quarter evening.",
      items: [
        item("d4-breakfast", "restaurant", "07:30-08:30", "Breakfast", "Start before checkout and station transfer.", { imageUrl: images.food, badge: "Breakfast", showButton: false, price: "" }),
        item("d4-checkout", "hotel", "09:00", "Beijing Hotel Checkout / Station Transfer", "Leaving early creates railway buffer even though checkout is officially noon.", { imageUrl: images.beijing, badge: "Hotel" }),
        item("d4-rail", "transportation", "10:00-15:00", "Beijing to Xi'an High-Speed Rail", "Gene should query live rail inventory for station, departure, arrival, seat class, baggage rules and current fare.", { imageUrl: images.rail, badge: "High-Speed Rail", affiliatePriority: "Medium" }),
        item("d4-transfer", "transportation", "15:00-16:00", "Xi'an Station to Hotel", "Transfer from arrival station to Grand Hyatt Xi'an.", { imageUrl: images.xian, badge: "Transfer" }),
        item("d4-hotel", "hotel", "16:00", "Grand Hyatt Xi'an Check-In", "Premium Xi'an base. Use live room inventory and prices.", { imageUrl: images.xian, badge: "Hotel", affiliatePriority: "Medium" }),
        item("d4-rest", "rest", "16:00-17:30", "Rest", "Recovery after train travel.", { imageUrl: images.xian, badge: "Rest", showButton: false, price: "" }),
        item("d4-wall", "activity", "18:00-19:00", "Xi'an City Wall Area", "Keep the wall walk moderate after the train day.", { imageUrl: images.xian, badge: "City Wall" }),
        item("d4-muslim", "activity", "19:15-20:30", "Muslim Quarter and Dinner", "Evening atmosphere and dinner in the Muslim Quarter.", { imageUrl: images.food, badge: "Food Street", showButton: false, price: "" }),
      ],
      suggestions: [
        suggestion("d4-s1", "First-Class Rail Upgrade", "Transport Upgrade", "Use if live rail inventory supports it.", images.rail),
        suggestion("d4-s2", "Easy Xi'an Evening", "Recovery Choice", "Skip the wall walk if train arrival is delayed.", images.xian),
      ],
      notes: [
        { icon: "train", text: "Do not hard-code train number." },
        { icon: "clock", text: "Keep evening moderate." },
        { icon: "hotel", text: "Xi'an hotel data remains live." },
      ],
    }),
    day({
      dayNumber: 5,
      title: "Xi'an Hero Day - Terracotta Army and Tang-Era Night",
      destinationLabel: "Xi'an",
      imageUrl: images.terracotta,
      routeFrom: "Grand Hyatt Xi'an",
      routeTo: "Terracotta Army, Giant Wild Goose Pagoda, Great Tang All Day Mall",
      weatherLabel: "Hero culture / Moderate fatigue",
      quote: "Terracotta ranks stand underground, then Xi'an glows into Tang-era atmosphere at night.",
      description:
        "A Terracotta Army hero day using GetYourGuide's guided product where live data supports it, followed by rest and a moderate evening district.",
      items: [
        item("d5-breakfast", "restaurant", "07:00-08:00", "Breakfast", "Start before pickup.", { imageUrl: images.food, badge: "Breakfast", showButton: false, price: "" }),
        item("d5-pickup", "transportation", "08:00", "Provider Pickup", "Hotel pickup according to selected product.", { imageUrl: images.terracotta, badge: "Pickup" }),
        item("d5-terracotta", "activity", "09:00-12:15", "Xi'an: Exclusive Terracotta Army Tour and Local Family Lunch", "GetYourGuide-preferred product with admission, pickup/drop-off, local lunch, transport and English-speaking guide where confirmed by provider.", { imageUrl: images.terracotta, badge: "Terracotta Army", provider: "GetYourGuide preferred", affiliatePriority: "Maximum" }),
        item("d5-lunch", "restaurant", "12:30-13:30", "Local Family Lunch", "Only include where selected package confirms lunch.", { imageUrl: images.food, badge: "Lunch", showButton: false, price: "" }),
        item("d5-return", "transportation", "13:30-15:00", "Return to Xi'an", "Return timing depends on selected product.", { imageUrl: images.xian, badge: "Return" }),
        item("d5-rest", "rest", "15:00-17:00", "Mandatory Hotel Rest", "Recovery before evening.", { imageUrl: images.xian, badge: "Rest", showButton: false, price: "" }),
        item("d5-pagoda", "activity", "17:30-18:30", "Giant Wild Goose Pagoda Area", "Light evening culture block.", { imageUrl: images.xian, badge: "Pagoda" }),
        item("d5-tang", "activity", "18:30-20:30", "Great Tang All Day Mall", "Tang-style pedestrian district and evening atmosphere.", { imageUrl: images.xian, badge: "Tang Night" }),
        item("d5-dinner", "restaurant", "20:30", "Dinner or Light Snack", "As required after the evening walk.", { imageUrl: images.food, badge: "Dinner", showButton: false, price: "" }),
      ],
      suggestions: [
        suggestion("d5-s1", "Private Terracotta Army Upgrade", "Culture Upgrade", "Best for travelers wanting deeper guide time.", images.terracotta),
        suggestion("d5-s2", "Skip Tang Evening", "Recovery Choice", "Useful if the museum day runs long.", images.xian),
      ],
      notes: [
        { icon: "ticket", text: "Admission and lunch must come from provider inclusions." },
        { icon: "bed", text: "Mandatory hotel rest before night walk." },
        { icon: "camera", text: "Terracotta Army is a hero visual card." },
      ],
    }),
    day({
      dayNumber: 6,
      title: "Xi'an to Shanghai - Ancient China to Future China",
      destinationLabel: "Shanghai",
      imageUrl: images.shanghai,
      routeFrom: "Xi'an",
      routeTo: "W Shanghai - The Bund",
      weatherLabel: "Flight transfer / Moderate fatigue",
      quote: "The route jumps from ancient capital to river lights and Shanghai's future skyline.",
      description:
        "A lighter flight-transfer day to Shanghai with Bund evening and optional Huangpu River cruise only if timing allows.",
      items: [
        item("d6-breakfast", "restaurant", "07:30-08:30", "Breakfast", "Breakfast before checkout.", { imageUrl: images.food, badge: "Breakfast", showButton: false, price: "" }),
        item("d6-checkout", "hotel", "09:00", "Xi'an Checkout", "Official checkout is noon, leaving flexibility.", { imageUrl: images.xian, badge: "Hotel" }),
        item("d6-airport", "transportation", "09:30-10:30", "Hotel to Airport", "Airport transfer before the Shanghai flight.", { imageUrl: images.airport, badge: "Airport Transfer" }),
        item("d6-flight", "flight", "Midday", "Xi'an to Shanghai Flight", "Gene must query the flight API rather than commit to an airline or flight number.", { imageUrl: images.shanghai, badge: "Flight", affiliatePriority: "Medium" }),
        item("d6-hotel", "hotel", "15:00", "W Shanghai - The Bund Check-In", "Strong premium visual option because of its Bund positioning. Use live hotel inventory and prices.", { imageUrl: images.shanghai, badge: "Hotel", affiliatePriority: "Maximum" }),
        item("d6-rest", "rest", "15:00-17:00", "Rest", "Recovery after flight and check-in.", { imageUrl: images.shanghai, badge: "Rest", showButton: false, price: "" }),
        item("d6-bund", "activity", "17:30-19:00", "The Bund", "Historic waterfront and Pudong skyline.", { imageUrl: images.bund, badge: "Waterfront", showButton: false, price: "" }),
        item("d6-dinner", "restaurant", "19:00-20:00", "Dinner", "Flexible Shanghai dinner.", { imageUrl: images.food, badge: "Dinner", showButton: false, price: "" }),
        item("d6-cruise", "activity", "20:00-21:00", "Optional Shanghai Huangpu River Night Cruise", "Klook-preferred optional product. Add only if actual flight and check-in timing leave sufficient buffer.", { imageUrl: images.bund, badge: "Optional Cruise", provider: "Klook preferred", affiliatePriority: "Very High" }),
      ],
      suggestions: [
        suggestion("d6-s1", "Huangpu River Night Cruise", "River Add-On", "Only if flight and check-in timing leave enough buffer.", images.bund),
        suggestion("d6-s2", "Slow Bund Dinner", "Luxury Choice", "Good for couples after travel.", images.shanghai),
      ],
      notes: [
        { icon: "plane", text: "Flight data must be live." },
        { icon: "ship", text: "Cruise is optional and timing-dependent." },
        { icon: "city", text: "Bund view is Shanghai's first-night anchor." },
      ],
    }),
    day({
      dayNumber: 7,
      title: "Shanghai Old and New - Yu Garden, French Streets and Neon River",
      destinationLabel: "Shanghai",
      imageUrl: images.yuyuan,
      routeFrom: "W Shanghai - The Bund",
      routeTo: "Yu Garden, Former French Concession, Lujiazui, Bund",
      weatherLabel: "City contrast / Moderate fatigue",
      quote: "Shanghai shifts from old gardens to tree-lined streets and neon skyline water.",
      description:
        "A city day balancing Yu Garden and Old City, Former French Concession, hotel rest, Lujiazui, dinner and Bund night photography.",
      items: [
        item("d7-breakfast", "restaurant", "08:00-09:00", "Breakfast", "Start before the Old City section.", { imageUrl: images.food, badge: "Breakfast", showButton: false, price: "" }),
        item("d7-yuyuan", "activity", "09:30-11:30", "Yu Garden and Old City", "Adequate time for walking, photos and old Shanghai atmosphere.", { imageUrl: images.yuyuan, badge: "Old City" }),
        item("d7-lunch", "restaurant", "11:30-12:30", "Lunch", "Flexible lunch.", { imageUrl: images.food, badge: "Lunch", showButton: false, price: "" }),
        item("d7-french", "activity", "13:00-15:00", "Former French Concession", "Tree-lined streets, architecture and cafes.", { imageUrl: images.shanghai, badge: "Streets" }),
        item("d7-rest", "rest", "15:00-16:30", "Hotel Rest", "Rest before the skyline evening.", { imageUrl: images.shanghai, badge: "Rest", showButton: false, price: "" }),
        item("d7-lujiazui", "activity", "17:00-18:30", "Lujiazui / Skyline Zone", "Modern skyline views and river atmosphere.", { imageUrl: images.shanghai, badge: "Skyline" }),
        item("d7-dinner", "restaurant", "18:30-19:30", "Dinner", "Flexible Shanghai dinner.", { imageUrl: images.food, badge: "Dinner", showButton: false, price: "" }),
        item("d7-photo", "activity", "20:00-21:00", "Bund Night Photography", "No need for another full tour.", { imageUrl: images.bund, badge: "Photography", showButton: false, price: "" }),
      ],
      suggestions: [
        suggestion("d7-s1", "Shanghai Tower Viewpoint", "Skyline Upgrade", "Only add if it does not duplicate or overload the day.", images.shanghai),
        suggestion("d7-s2", "Cafe-Hopping French Concession", "Slow City", "Good for couples or luxury travelers.", images.shanghai),
      ],
      notes: [
        { icon: "city", text: "This day balances old and new Shanghai." },
        { icon: "camera", text: "Bund night photography is enough for the evening." },
        { icon: "bed", text: "Hotel rest prevents crowd fatigue." },
      ],
    }),
    day({
      dayNumber: 8,
      title: "Hidden-Water Shanghai - Zhujiajiao Ancient Water Town",
      destinationLabel: "Zhujiajiao, Shanghai",
      imageUrl: images.zhujiajiao,
      routeFrom: "Shanghai hotel",
      routeTo: "Zhujiajiao Ancient Water Town",
      weatherLabel: "Water town / Moderate fatigue",
      quote: "Canals and stone bridges soften Shanghai's skyline story into old-water quiet.",
      description:
        "A half-day Zhujiajiao private water-town and boat ride product, separated from central Shanghai sightseeing to avoid repetition.",
      items: [
        item("d8-breakfast", "restaurant", "08:00-09:00", "Breakfast", "Breakfast before pickup.", { imageUrl: images.food, badge: "Breakfast", showButton: false, price: "" }),
        item("d8-pickup", "transportation", "09:00", "Hotel Pickup", "Pickup according to selected Viator product.", { imageUrl: images.zhujiajiao, badge: "Pickup" }),
        item("d8-zhujiajiao", "activity", "10:00-13:00", "Shanghai Private Tour: Zhujiajiao Water Town and Boat Ride", "Viator-preferred half-day product with private guiding, transfers and a boat ride where included live.", { imageUrl: images.zhujiajiao, badge: "Water Town", provider: "Viator preferred", affiliatePriority: "Very High" }),
        item("d8-lunch", "restaurant", "13:00-14:00", "Lunch", "Lunch if selected package includes or permits it.", { imageUrl: images.food, badge: "Lunch", showButton: false, price: "" }),
        item("d8-return", "transportation", "14:00-15:00", "Return to Shanghai", "Return from water town.", { imageUrl: images.zhujiajiao, badge: "Return" }),
        item("d8-rest", "rest", "15:00-17:00", "Mandatory Rest", "Recovery after the water-town tour.", { imageUrl: images.shanghai, badge: "Rest", showButton: false, price: "" }),
        item("d8-free", "activity", "17:30-19:00", "Free Riverfront / Shopping Block", "Light free block before dinner.", { imageUrl: images.bund, badge: "Free Time", showButton: false, price: "" }),
        item("d8-dinner", "restaurant", "19:00-20:30", "Dinner", "Flexible dinner.", { imageUrl: images.food, badge: "Dinner", showButton: false, price: "" }),
      ],
      suggestions: [
        suggestion("d8-s1", "Zhujiajiao + Shanghai Highlights Alternative", "Tour Alternative", "Avoid duplicating places already visited in the base itinerary.", images.zhujiajiao),
        suggestion("d8-s2", "Private Boat Emphasis", "Photo Upgrade", "Good for photographers if included by provider.", images.zhujiajiao),
      ],
      notes: [
        { icon: "ship", text: "Boat ride must be included by selected product." },
        { icon: "city", text: "Do not duplicate central Shanghai highlights." },
        { icon: "bed", text: "Rest follows the half-day tour." },
      ],
    }),
    day({
      dayNumber: 9,
      title: "Shanghai Choice Day - Disney Hero or Slow Shanghai",
      destinationLabel: "Shanghai",
      imageUrl: images.disney,
      routeFrom: "Shanghai hotel",
      routeTo: "Shanghai Disneyland or slow city route",
      weatherLabel: "Choice day / Flexible fatigue",
      quote: "The final full day can go big with Disney or slow down into luxury Shanghai.",
      description:
        "A mutually exclusive choice day. Commercial version uses Shanghai Disneyland; calmer luxury version uses museum, shopping, hotel rest, Bund sunset and farewell dinner.",
      items: [
        item("d9-breakfast", "restaurant", "07:00-08:00", "Breakfast", "Start early if choosing Disney; slow breakfast if choosing the city option.", { imageUrl: images.food, badge: "Breakfast", showButton: false, price: "" }),
        item("d9-disney-transfer", "transportation", "08:00-09:00", "Hotel to Shanghai Disneyland", "Disney route and entry buffer for Option A.", { imageUrl: images.disney, badge: "Disney Transfer" }),
        item("d9-disney", "activity", "09:00-19:00", "Shanghai Disneyland Ticket", "Klook-preferred product with one-day ticket packages and Premier Access combinations where selected. Use live operating hours.", { imageUrl: images.disney, badge: "Disney Hero", provider: "Klook preferred", affiliatePriority: "Maximum" }),
        item("d9-slow", "activity", "Option B", "Slow Shanghai Alternative", "For travelers not interested in theme parks: museum/cultural attraction, shopping, cafes, hotel rest, Bund sunset and farewell dinner.", { imageUrl: images.shanghai, badge: "Alternative", showButton: false, price: "" }),
        item("d9-return", "transportation", "20:00 target", "Return Hotel", "No other tour after Disney.", { imageUrl: images.shanghai, badge: "Return" }),
        item("d9-dinner", "restaurant", "Evening", "Farewell Dinner", "Dinner according to selected option.", { imageUrl: images.food, badge: "Dinner", showButton: false, price: "" }),
      ],
      suggestions: [
        suggestion("d9-s1", "Premier Access Combination", "Disney Upgrade", "Only if selected Klook package confirms it.", images.disney),
        suggestion("d9-s2", "Slow Luxury Shanghai", "Couple Choice", "Default for calmer luxury itinerary.", images.shanghai),
      ],
      notes: [
        { icon: "ticket", text: "Disney and Slow Shanghai are mutually exclusive." },
        { icon: "clock", text: "Use selected-date Disney hours." },
        { icon: "bed", text: "No other tour after Disney." },
      ],
    }),
    day({
      dayNumber: 10,
      title: "Departure - Last Morning Above the Huangpu",
      destinationLabel: "Shanghai",
      imageUrl: images.shanghai,
      routeFrom: "W Shanghai - The Bund",
      routeTo: "PVG or SHA airport",
      weatherLabel: "Departure / Low fatigue",
      quote: "One final Huangpu morning, bags ready, then Shanghai fades into the flight home.",
      description:
        "Departure day with breakfast, final walk or packing, checkout and airport transfer calculated from the real flight.",
      items: [
        item("d10-breakfast", "restaurant", "07:30-09:00", "Breakfast", "Final breakfast.", { imageUrl: images.food, badge: "Breakfast", showButton: false, price: "" }),
        item("d10-walk", "activity", "09:00-10:30", "Final Walk or Packing", "Short final walk only if flight timing permits.", { imageUrl: images.bund, badge: "Morning", showButton: false, price: "" }),
        item("d10-bags", "rest", "11:00", "Bags Ready", "Prepare for checkout and airport transfer.", { imageUrl: images.shanghai, badge: "Packing", showButton: false, price: "" }),
        item("d10-checkout", "hotel", "12:00 target", "W Shanghai Checkout", "Official checkout is noon; use live hotel policy.", { imageUrl: images.shanghai, badge: "Hotel" }),
        item("d10-airport", "transportation", "Flight-specific", "Hotel to Airport", "Gene must determine PVG or SHA from the actual flight and calculate transfer with international airport buffer.", { imageUrl: images.airport, badge: "Airport Transfer" }),
      ],
      suggestions: [
        suggestion("d10-s1", "Late Checkout Request", "Comfort Upgrade", "Only if hotel/provider confirms availability.", images.shanghai),
        suggestion("d10-s2", "Shanghai Stopover Extension", "City Variant", "Adds another slow Shanghai day if the traveler wants more city time.", images.bund),
      ],
      notes: [
        { icon: "plane", text: "No paid activity on departure day." },
        { icon: "airport", text: "PVG or SHA depends on real flight." },
        { icon: "clock", text: "Build backwards from departure time." },
      ],
    }),
  ];

  return {
    hero: {
      eyebrow: "Level 1 • Plan #11 • China",
      title: PLAN_TITLE,
      subtitle:
        "Walk the Great Wall above Beijing's mountain ridges, step into the underground world of Xi'an's Terracotta Army, race east by high-speed rail and finish among Shanghai's neon towers, river lights and the quiet canals of an ancient water town.",
      imageUrl: images.hero,
      badge: "Culture • History • City • Food • Family • Photography • Luxury",
      stats: [
        { label: "Days", value: "10" },
        { label: "Countries", value: "1" },
        { label: "Cities", value: "4" },
        { label: "Travelers", value: "2" },
        { label: "Trip Style", value: "Imperial City" },
      ],
    },
    overview: {
      startingPoint: "Beijing",
      destinations: "Beijing, Mutianyu, Xi'an, Terracotta Army, Shanghai, Zhujiajiao",
      tripStyle: "Culture, history, city, food, family, photography, luxury, adventure-light",
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

  const existingResult = await supabase.from("ready_plans").select("id, slug").eq("slug", SLUG).maybeSingle();
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
    location: "Beijing, Mutianyu, Xi'an, Shanghai, Zhujiajiao",
    days: content.days.length,
    image_url: images.hero,
    created_at: timestamp,
    subtitle: "10 days from Beijing's imperial icons to Xi'an's Terracotta Army and Shanghai's river glow.",
    country: "China",
    city: "Beijing, Xi'an, Shanghai, Zhujiajiao",
    destination: "China",
    style: "Culture, History, City, Food, Family, Photography, Luxury, Adventure-Light",
    daysCount: content.days.length,
    heroImage: images.hero,
    coverImage: images.hero,
    summary:
      "A 10-day China Ready Plan built around Beijing, Mutianyu Great Wall, Xi'an Terracotta Army, Shanghai, Zhujiajiao water town and optional Shanghai Disneyland.",
    seoTitle: PLAN_TITLE,
    seoDescription:
      "Draft ready plan for China: Imperial Walls, Terracotta Legends and Shanghai Glow with Beijing, Xi'an, Shanghai and Zhujiajiao.",
    tags: ["China", "Beijing", "Great Wall", "Mutianyu", "Xi'an", "Terracotta Army", "Shanghai", "Zhujiajiao", "Disneyland"],
    season: "Spring, autumn and selected year-round dates",
    showOnHome: false,
    priceFrom: 0,
    currency: "USD",
    daysJson,
    contentJson: content,
    updatedAt: timestamp,
  };

  const insertResult = await supabase.from("ready_plans").insert(payload).select("id, slug, status").single();
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
  console.error("INSERT_CHINA_READY_PLAN_FAILED");
  console.error(error);
  process.exit(1);
});
