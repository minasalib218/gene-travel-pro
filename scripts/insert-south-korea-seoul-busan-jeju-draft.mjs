import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import crypto from "node:crypto";

const SOURCE_ENV_PATH = new URL("../.env", import.meta.url);
const SLUG = "south-korea-seoul-pulse-busan-blue-jeju-volcano-coast";
const PLAN_TITLE = "South Korea: Seoul Pulse, Busan Blue & Jeju Volcano Coast";

const JAPAN_ROOT = "/images/Japan Golden Soul Escape";
const THAILAND_ROOT = "/images/Thailand Island Pulse";
const images = {
  hero: `${JAPAN_ROOT}/skytree walk.jpg`,
  seoul: `${JAPAN_ROOT}/skytree.jpg`,
  palace: `${JAPAN_ROOT}/kyoto historical.jfif`,
  nature: `${JAPAN_ROOT}/Arashiyama bamboo and riverside.jpg`,
  train: `${JAPAN_ROOT}/flight.jpg`,
  busan: `${THAILAND_ROOT}/ao nang hotel.jpg`,
  coast: `${THAILAND_ROOT}/kayak.jpg`,
  jeju: `${THAILAND_ROOT}/hong island cover.jpg`,
  food: `${JAPAN_ROOT}/dinning.jpg`,
  hotel: `${JAPAN_ROOT}/hyatt regency tokyo.jpg`,
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

function suggestion(id, title, category, matchReason, imageUrl = images.hero) {
  return {
    id,
    title,
    category,
    imageUrl,
    matchReason,
    matchScore: "Excellent Route Fit",
    price: "Live price",
    duration: "Flexible",
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
    countryLabel: "South Korea",
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
      title: "Seoul Arrival - From Runway to Neon Seoul",
      destinationLabel: "Seoul",
      imageUrl: images.seoul,
      routeFrom: "ICN or GMP airport",
      routeTo: "Grand Hyatt Seoul, Myeongdong",
      weatherLabel: "Arrival / Low fatigue",
      quote: "The first night is neon, street food and a soft landing into Seoul.",
      description:
        "Arrival day stays easy: airport buffer, transfer to the Seoul hotel, rest, then a light first evening in Myeongdong for street-food streets, shopping and Seoul atmosphere. No paid tour is scheduled on arrival day.",
      items: [
        item("d1-arrival", "flight", "14:00", "Arrival in Seoul", "Land at ICN or GMP and allow immigration, baggage and airport buffer before leaving the terminal.", { imageUrl: images.seoul, badge: "Arrival" }),
        item("d1-transfer", "transportation", "15:30", "Airport to Seoul Hotel", "Gene should calculate the real transfer time based on airport, traffic and selected transport.", { imageUrl: images.train, badge: "Transfer" }),
        item("d1-hotel", "hotel", "17:00", "Grand Hyatt Seoul Check-In", "Premium Seoul base between Namsan and central Seoul, close to Myeongdong and Itaewon. A 4-star Myeongdong hotel can be used as a value alternative.", { imageUrl: images.hotel, badge: "Hotel" }),
        item("d1-myeongdong", "activity", "19:00", "Myeongdong First Evening", "Street-food lanes, shopping and the first Seoul atmosphere without a heavy tour.", { imageUrl: images.seoul, badge: "K-Culture" }),
        item("d1-dinner", "restaurant", "20:00", "Easy Seoul Dinner", "Simple dinner before returning to the hotel.", { imageUrl: images.food, badge: "Dinner" }),
      ],
      suggestions: [
        suggestion("d1-s1", "Airport Private Transfer Upgrade", "Comfort Upgrade", "Useful for late arrivals or families.", images.train),
        suggestion("d1-s2", "Myeongdong Dessert Stop", "Food Add-On", "A light first-night add-on if energy is good.", images.food),
      ],
      notes: [
        { icon: "clock", text: "Do not add a paid tour on arrival day." },
        { icon: "plane", text: "Transfer timing depends on ICN or GMP and live traffic." },
        { icon: "food", text: "Keep dinner flexible around flight fatigue." },
      ],
    }),
    day({
      dayNumber: 2,
      title: "Seoul Icons - Palaces, Hanok Streets & Modern Seoul",
      destinationLabel: "Seoul",
      imageUrl: images.palace,
      routeFrom: "Seoul hotel",
      routeTo: "Gyeongbokgung Palace, Bukchon, Insadong, Namsan, Hongdae",
      weatherLabel: "Culture / Moderate fatigue",
      quote: "Royal gates, hanok rooftops and city lights show Seoul in contrast.",
      description:
        "A balanced Seoul icon day: start early at Gyeongbokgung Palace, continue to Bukchon Hanok Village, lunch, Insadong culture and cafes, rest, then N Seoul Tower or Namsan. Hongdae stays optional for evening energy.",
      items: [
        item("d2-breakfast", "restaurant", "07:30", "Breakfast", "Start early before visitor peaks.", { imageUrl: images.food, badge: "Breakfast" }),
        item("d2-palace", "activity", "09:00", "Gyeongbokgung Palace", "Begin the culture route at Seoul's flagship palace before crowds build.", { imageUrl: images.palace, badge: "Palace" }),
        item("d2-bukchon", "activity", "10:45", "Bukchon Hanok Village", "Traditional streets, viewpoints and photo stops.", { imageUrl: images.palace, badge: "Hanok" }),
        item("d2-insadong", "activity", "13:30", "Insadong Culture Walk", "Culture shops, cafes and a gentle afternoon Seoul rhythm.", { imageUrl: images.palace, badge: "Culture" }),
        item("d2-namsan", "activity", "16:00", "N Seoul Tower and Namsan", "Grand Hyatt Seoul fits this section well because of its Namsan location.", { imageUrl: images.seoul, badge: "Viewpoint" }),
        item("d2-hongdae", "activity", "20:00", "Optional Hongdae Evening", "Music, shopping and street atmosphere only if the traveler still has energy.", { imageUrl: images.seoul, badge: "Optional" }),
      ],
      suggestions: [
        suggestion("d2-s1", "Hanbok Photo Upgrade", "Photo Upgrade", "A strong cultural photo add-on around the palace district.", images.palace),
        suggestion("d2-s2", "Korean Food Tasting", "Food Add-On", "Good for travelers who prefer food over Hongdae at night.", images.food),
      ],
      notes: [
        { icon: "sun", text: "Start the palace early." },
        { icon: "shoe", text: "This day includes meaningful walking." },
        { icon: "moon", text: "Hongdae is optional, not required." },
      ],
    }),
    day({
      dayNumber: 3,
      title: "Seoul Nature Escape - Nami Island & Rail Bike",
      destinationLabel: "Nami Island",
      imageUrl: images.nature,
      routeFrom: "Seoul",
      routeTo: "Nami Island, Gangchon Rail Bike, Garden of Morning Calm",
      weatherLabel: "Full-day nature / High affiliate priority",
      quote: "Trees, river scenery and rail-bike movement give Seoul a softer nature chapter.",
      description:
        "Use a bookable full-day tour rather than building the route manually. The day can combine Nami Island, rail bike and Garden of Morning Calm or the destination included in the selected package. Do not add another night tour afterward.",
      items: [
        item("d3-breakfast", "restaurant", "06:30", "Early Breakfast", "Prepare for a full-day departure.", { imageUrl: images.food, badge: "Breakfast" }),
        item("d3-depart", "transportation", "07:30", "Tour Meeting Point Departure", "Meet the selected Klook or provider tour in Seoul.", { imageUrl: images.train, badge: "Tour Transfer" }),
        item("d3-nami", "activity", "09:30", "Nami Island", "Tree-lined paths, river scenery and free photography time.", { imageUrl: images.nature, badge: "Nature" }),
        item("d3-railbike", "activity", "13:00", "Gangchon Rail Bike", "Adds a real activity element instead of sightseeing only.", { imageUrl: images.nature, badge: "Rail Bike" }),
        item("d3-garden", "activity", "15:00", "Garden of Morning Calm or Included Stop", "Final destination depends on the chosen package.", { imageUrl: images.nature, badge: "Garden" }),
        item("d3-dinner", "restaurant", "20:30", "Light Seoul Dinner", "Keep dinner light after the full-day tour.", { imageUrl: images.food, badge: "Light Dinner" }),
      ],
      suggestions: [
        suggestion("d3-s1", "Alpaca World Variant", "Family Add-On", "Good for families when included in the chosen tour package.", images.nature),
        suggestion("d3-s2", "Skip Evening Plans", "Recovery Choice", "Recommended because this is already a full day.", images.hotel),
      ],
      notes: [
        { icon: "clock", text: "No second night tour after Nami Island." },
        { icon: "tree", text: "Use weather to decide the best package variant." },
        { icon: "bus", text: "Exact return time depends on the final tour itinerary." },
      ],
    }),
    day({
      dayNumber: 4,
      title: "Seoul to Busan - From Megacity to the Sea",
      destinationLabel: "Busan",
      imageUrl: images.busan,
      routeFrom: "Seoul",
      routeTo: "Busan Station, Haeundae beachfront hotel, Haeundae Beach",
      weatherLabel: "Transfer / Low fatigue",
      quote: "The route drops south by KTX and opens onto the Busan sea.",
      description:
        "A light transfer day: breakfast, checkout, Seoul Station, KTX to Busan, transfer to a Haeundae beachfront hotel, rest, then Haeundae Beach and promenade. This gentle rhythm matters after the previous full-day tour.",
      items: [
        item("d4-breakfast", "restaurant", "07:00", "Breakfast and Checkout", "Prepare for the KTX transfer day.", { imageUrl: images.food, badge: "Breakfast" }),
        item("d4-station", "transportation", "09:00", "Transfer to Seoul Station", "Buffer for luggage and station navigation.", { imageUrl: images.train, badge: "Station" }),
        item("d4-ktx", "transportation", "10:00", "KTX Seoul to Busan", "Use live KTX schedules at booking time; the Ready Plan uses about three hours including station buffers.", { imageUrl: images.train, badge: "KTX" }),
        item("d4-hotel", "hotel", "15:00", "Haeundae Beachfront Hotel Check-In", "Gene prefers Haeundae over central Busan because Days 5 and 6 are coastal.", { imageUrl: images.busan, badge: "Beach Hotel" }),
        item("d4-beach", "activity", "17:00", "Haeundae Beach Walk", "Beach walk, Dongbaek or coastal views depending on the hotel and sunset timing.", { imageUrl: images.busan, badge: "Beach" }),
        item("d4-dinner", "restaurant", "19:00", "Seafood or Korean Dinner", "Easy dinner near Haeundae.", { imageUrl: images.food, badge: "Dinner" }),
      ],
      suggestions: [
        suggestion("d4-s1", "Ocean-View Room Upgrade", "Hotel Upgrade", "Strong fit for the Busan coast section.", images.busan),
        suggestion("d4-s2", "Dongbaek Coastal Walk", "Easy Add-On", "Use if hotel location and daylight make it practical.", images.coast),
      ],
      notes: [
        { icon: "train", text: "Use live KTX data for exact train selection." },
        { icon: "water", text: "Keep the afternoon coastal and easy." },
        { icon: "bed", text: "This is a lighter transition day by design." },
      ],
    }),
    day({
      dayNumber: 5,
      title: "Busan Coastal Hero Day - Haedong Temple, Sky Capsule & Villages",
      destinationLabel: "Busan",
      imageUrl: images.coast,
      routeFrom: "Haeundae",
      routeTo: "Haedong Yonggungsa, Cheongsapo, Sky Capsule, Huinnyeoul, Gamcheon",
      weatherLabel: "Coastal hero / Maximum affiliate priority",
      quote: "Temple stones meet the sea, then the railway floats above Busan blue.",
      description:
        "One of the plan's strongest commercial experiences: a coastal full-day tour combining Haedong Yonggungsa, Haeundae or Cheongsapo coast, Sky Capsule, Huinnyeoul Culture Village and Gamcheon Culture Village depending on the selected provider.",
      items: [
        item("d5-breakfast", "restaurant", "08:00", "Breakfast", "Start steady before the coastal tour.", { imageUrl: images.food, badge: "Breakfast" }),
        item("d5-pickup", "transportation", "09:00", "Pickup or Meeting Point", "Final pickup depends on the selected GetYourGuide or provider product.", { imageUrl: images.coast, badge: "Pickup" }),
        item("d5-temple", "activity", "09:30", "Haedong Yonggungsa", "A sea-facing temple that strongly supports Gene's coastal Korea positioning.", { imageUrl: images.coast, badge: "Temple" }),
        item("d5-sky", "activity", "12:00", "Haeundae Sky Capsule", "Coastal railway over the sea and the strongest visual card for Busan.", { imageUrl: images.coast, badge: "Hero Card" }),
        item("d5-villages", "activity", "14:30", "Huinnyeoul and Gamcheon Culture Villages", "Cliffside coast and colorful hillside culture in one Busan story.", { imageUrl: images.coast, badge: "Villages" }),
        item("d5-dinner", "restaurant", "19:30", "Busan Dinner", "Return and keep the evening simple after the full-day route.", { imageUrl: images.food, badge: "Dinner" }),
      ],
      suggestions: [
        suggestion("d5-s1", "Oryukdo Skywalk Add-On", "Coastal Add-On", "Use when included by the selected Busan coastal tour.", images.coast),
        suggestion("d5-s2", "Private Busan Coastal Tour", "Comfort Upgrade", "Best for travelers who want more control over pacing and photo stops.", images.coast),
      ],
      notes: [
        { icon: "camera", text: "Sky Capsule is one of the five hero images for this Ready Plan." },
        { icon: "water", text: "This is the highest-priority affiliate day in Busan." },
        { icon: "clock", text: "Do not add another paid evening tour." },
      ],
    }),
    day({
      dayNumber: 6,
      title: "Busan Blue - Beach, Yacht Option & Gwangan Lights",
      destinationLabel: "Busan",
      imageUrl: images.busan,
      routeFrom: "Haeundae",
      routeTo: "Haeundae Beach, Gwangalli Beach, Gwangan Bridge",
      weatherLabel: "Beach / Low fatigue",
      quote: "After the hero tour, Busan slows into beaches, cafes and bridge lights.",
      description:
        "The morning stays slow after the full-day coastal tour. Haeundae beach time leads into Gwangalli, sunset cafes, dinner and Gwangan Bridge night views. A coastal yacht is optional only when weather and availability fit.",
      items: [
        item("d6-breakfast", "restaurant", "08:30", "Late Breakfast", "Slower start after Day 5.", { imageUrl: images.food, badge: "Breakfast" }),
        item("d6-haeundae", "activity", "10:00", "Haeundae Beach", "Swimming or beach time depending on season and conditions.", { imageUrl: images.busan, badge: "Beach" }),
        item("d6-rest", "activity", "13:30", "Rest Block", "Protect downtime before the evening coast.", { imageUrl: images.hotel, badge: "Recovery" }),
        item("d6-gwangalli", "activity", "16:30", "Gwangalli Beach", "Beach, cafes and sunset atmosphere.", { imageUrl: images.busan, badge: "Coast" }),
        item("d6-bridge", "activity", "20:00", "Gwangan Bridge Night View", "Night view from the beach; yacht tour can be offered as an optional add-on.", { imageUrl: images.busan, badge: "Night View" }),
      ],
      suggestions: [
        suggestion("d6-s1", "Optional Busan Coastal Yacht", "Activity Add-On", "Offer only if weather and availability are suitable.", images.busan),
        suggestion("d6-s2", "Beach Cafe Upgrade", "Soft Add-On", "Good low-fatigue alternative to a yacht.", images.food),
      ],
      notes: [
        { icon: "sun", text: "Morning is intentionally slower." },
        { icon: "boat", text: "Yacht is optional, not mandatory." },
        { icon: "moon", text: "Gwangan Bridge gives the evening its visual finish." },
      ],
    }),
    day({
      dayNumber: 7,
      title: "Busan to Jeju - Island Shift",
      destinationLabel: "Jeju",
      imageUrl: images.jeju,
      routeFrom: "Busan",
      routeTo: "Jeju Airport, Grand Hyatt Jeju, Jeju coast",
      weatherLabel: "Flight / Low fatigue",
      quote: "A short flight changes the rhythm from coast city to volcanic island.",
      description:
        "A light flight day: breakfast, checkout, airport transfer, Busan to Jeju flight, baggage, hotel transfer, lunch, Grand Hyatt Jeju check-in, pool/rest and a coastal sunset. No excursion is added on flight day.",
      items: [
        item("d7-breakfast", "restaurant", "07:30", "Breakfast", "Simple start before airport transfer.", { imageUrl: images.food, badge: "Breakfast" }),
        item("d7-airport", "transportation", "09:00", "Transfer to Busan Airport", "Buffer for domestic flight check-in.", { imageUrl: images.train, badge: "Airport" }),
        item("d7-flight", "flight", "11:30", "Busan to Jeju Flight", "Use live flight options for the customer's date and budget.", { imageUrl: images.train, badge: "Flight" }),
        item("d7-hotel", "hotel", "15:00", "Grand Hyatt Jeju Check-In", "Three-night Jeju base; official check-in aligns with the afternoon arrival rhythm.", { imageUrl: images.hotel, badge: "Hotel" }),
        item("d7-sunset", "activity", "17:30", "Jeju Coastal Sunset", "Easy coastal sunset and dinner without adding a paid excursion.", { imageUrl: images.jeju, badge: "Sunset" }),
      ],
      suggestions: [
        suggestion("d7-s1", "Ocean-View Jeju Room Upgrade", "Hotel Upgrade", "Best for couples and coast-focused travelers.", images.jeju),
        suggestion("d7-s2", "Early Dinner Reservation", "Comfort Add-On", "Useful if the flight timing shifts later.", images.food),
      ],
      notes: [
        { icon: "plane", text: "Do not add an excursion on flight day." },
        { icon: "bed", text: "Protect pool and rest time after arrival." },
        { icon: "sun", text: "Use sunset as the only planned evening highlight." },
      ],
    }),
    day({
      dayNumber: 8,
      title: "Jeju Hero Day - Volcano, Waterfalls & UNESCO Landscapes",
      destinationLabel: "Jeju",
      imageUrl: images.jeju,
      routeFrom: "Grand Hyatt Jeju",
      routeTo: "Seongsan Ilchulbong, Seopjikoji, waterfalls or lava landscapes",
      weatherLabel: "Jeju hero / Maximum affiliate priority",
      quote: "Volcanic craters, sea cliffs and blue coast make Jeju feel like another world.",
      description:
        "A full Jeju hero day. Gene should prefer an East Jeju version when Seongsan is available because it is visually stronger, while live provider products may also use South UNESCO routes with waterfalls, Oedolgae, Olle Trail or Yakcheonsa Temple.",
      items: [
        item("d8-breakfast", "restaurant", "07:00", "Breakfast", "Prepare for a full Jeju day.", { imageUrl: images.food, badge: "Breakfast" }),
        item("d8-depart", "transportation", "08:00", "Jeju Day Tour Departure", "Provider route depends on live product availability.", { imageUrl: images.jeju, badge: "Tour Transfer" }),
        item("d8-seongsan", "activity", "09:00", "Seongsan Ilchulbong", "Volcanic crater, coastal landscape and ocean views.", { imageUrl: images.jeju, badge: "Volcano" }),
        item("d8-coast", "activity", "10:45", "Seopjikoji or Nearby Coast", "Coastal views depending on selected route.", { imageUrl: images.jeju, badge: "Coast" }),
        item("d8-waterfall", "activity", "13:30", "Waterfall or Lava-Landscape Stop", "Selected according to the provider package and weather.", { imageUrl: images.jeju, badge: "UNESCO" }),
        item("d8-dinner", "restaurant", "20:00", "Jeju Dinner", "Return, rest and finish with dinner.", { imageUrl: images.food, badge: "Dinner" }),
      ],
      suggestions: [
        suggestion("d8-s1", "South UNESCO Route", "Alternative Route", "Use when the East Jeju route is unavailable or weather is better south.", images.jeju),
        suggestion("d8-s2", "Private Jeju Driver Upgrade", "Comfort Upgrade", "Strong for families and travelers who want flexible pacing.", images.jeju),
      ],
      notes: [
        { icon: "mountain", text: "Seongsan is preferred when available because it is visually strongest." },
        { icon: "cloud", text: "Weather should decide East vs South route." },
        { icon: "camera", text: "Jeju volcanic coast is one of the plan's hero visuals." },
      ],
    }),
    day({
      dayNumber: 9,
      title: "Jeju Hidden Coast - Waterfalls, Cliffs & Slow Island Life",
      destinationLabel: "Jeju",
      imageUrl: images.jeju,
      routeFrom: "Grand Hyatt Jeju",
      routeTo: "Yongmeori Coast, Sanbangsan views, beach cafes, final sunset",
      weatherLabel: "Slow coast / Low fatigue",
      quote: "The final Jeju day is calmer: cliffs, cafes and one last volcanic sunset.",
      description:
        "A slower second Jeju day focused on coastal landscapes such as Yongmeori Coast if open and safe, Sanbangsan views, lunch, a beach or coastal cafe, rest and final Jeju sunset. Gene must check site access and weather before confirming.",
      items: [
        item("d9-breakfast", "restaurant", "08:00", "Breakfast", "Slow start after the full Jeju tour.", { imageUrl: images.food, badge: "Breakfast" }),
        item("d9-yongmeori", "activity", "10:00", "Yongmeori Coast Area", "Visit only if access is open and conditions are safe on the travel day.", { imageUrl: images.jeju, badge: "Hidden Coast" }),
        item("d9-sanbangsan", "activity", "11:45", "Sanbangsan Views", "Volcanic views and a slower landscape stop.", { imageUrl: images.jeju, badge: "Viewpoint" }),
        item("d9-cafe", "restaurant", "14:00", "Beach or Coastal Cafe", "Relaxed island-life stop instead of another full-day tour.", { imageUrl: images.food, badge: "Cafe" }),
        item("d9-sunset", "activity", "17:30", "Final Jeju Sunset", "Final island sunset before farewell dinner.", { imageUrl: images.jeju, badge: "Sunset" }),
        item("d9-dinner", "restaurant", "19:30", "Farewell Korean Dinner", "Final dinner in Jeju.", { imageUrl: images.food, badge: "Farewell" }),
      ],
      suggestions: [
        suggestion("d9-s1", "Jeju UNESCO Day Tour", "Full-Day Alternative", "Offer if the traveler wants more structure instead of a slow coastal day.", images.jeju),
        suggestion("d9-s2", "Seafood Dinner Upgrade", "Food Upgrade", "Strong final-night fit.", images.food),
      ],
      notes: [
        { icon: "water", text: "Check coastal access and weather before confirming Yongmeori." },
        { icon: "sun", text: "This day should feel slower and more coastal." },
        { icon: "food", text: "Reserve farewell dinner if possible." },
      ],
    }),
    day({
      dayNumber: 10,
      title: "Departure - Jeju Goodbye",
      destinationLabel: "Jeju",
      imageUrl: images.jeju,
      routeFrom: "Grand Hyatt Jeju",
      routeTo: "Jeju Airport and onward flight",
      weatherLabel: "Departure only",
      quote: "Leave the island cleanly, without forcing one more paid plan.",
      description:
        "Departure day stays simple: breakfast, packing, Grand Hyatt Jeju checkout and transfer to Jeju Airport for onward flight. Gene should set the buffer based on domestic or international flight timing.",
      items: [
        item("d10-breakfast", "restaurant", "07:30", "Breakfast", "Final breakfast before packing.", { imageUrl: images.food, badge: "Breakfast" }),
        item("d10-pack", "activity", "09:00", "Packing", "Keep the morning practical and flexible.", { imageUrl: images.hotel, badge: "Packing" }),
        item("d10-checkout", "hotel", "11:00", "Grand Hyatt Jeju Checkout", "Official checkout target.", { imageUrl: images.hotel, badge: "Checkout" }),
        item("d10-transfer", "transportation", "TBD", "Hotel to Jeju Airport", "Set buffer according to domestic or international onward flight.", { imageUrl: images.train, badge: "Airport Transfer" }),
        item("d10-flight", "flight", "TBD", "Onward Flight", "No paid excursion on departure day.", { imageUrl: images.train, badge: "Flight" }),
      ],
      suggestions: [
        suggestion("d10-s1", "Late Checkout Request", "Comfort Upgrade", "Useful if the onward flight leaves later.", images.hotel),
      ],
      notes: [
        { icon: "plane", text: "No paid excursion on departure day." },
        { icon: "clock", text: "Flight buffer depends on domestic vs international routing." },
        { icon: "bag", text: "Keep the morning clean and practical." },
      ],
    }),
  ];

  return {
    version: 1,
    title: PLAN_TITLE,
    subtitle: "10 days from Seoul's neon streets to Busan's coast and Jeju's volcanic blue.",
    badge: "Ready Plan",
    hero: {
      imageUrl: images.hero,
      eyebrow: "South Korea Ready Plan",
      title: PLAN_TITLE,
      subtitle:
        "Move from Seoul's neon streets and ancient palaces to Busan's railway above the sea, then fly south to Jeju for volcanic peaks, waterfalls and wild coastlines.",
      stats: [
        { label: "Days", value: "10" },
        { label: "Countries", value: "1" },
        { label: "Cities", value: "3" },
        { label: "Travelers", value: "2" },
        { label: "Trip Style", value: "Coastal Culture" },
      ],
    },
    overview: {
      startingPoint: "Seoul",
      destinations: "Seoul, Nami Island, Busan, Haeundae, Sky Capsule, Jeju, Seongsan, volcanic coast",
      tripStyle: "Coastal, culture, island, nature, K-culture, food, adventure-light",
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

  const payload = {
    status: "DRAFT",
    slug: SLUG,
    title: PLAN_TITLE,
    location: "Seoul, Nami Island, Busan, Haeundae, Jeju",
    days: content.days.length,
    image_url: images.hero,
    created_at: timestamp,
    subtitle: "10 days from Seoul's neon streets to Busan's coast and Jeju's volcanic blue.",
    country: "South Korea",
    city: "Seoul, Busan, Jeju",
    destination: "South Korea",
    style: "Coastal, Culture, Island, Nature, K-Culture, Food, Adventure-Light",
    daysCount: content.days.length,
    heroImage: images.hero,
    coverImage: images.hero,
    summary:
      "A 10-day South Korea Ready Plan built around Seoul culture, Nami Island nature, Busan beaches and Sky Capsule, then Jeju volcanic coast, waterfalls and island-life pacing.",
    seoTitle: PLAN_TITLE,
    seoDescription:
      "Draft ready plan for South Korea: Seoul Pulse, Busan Blue and Jeju Volcano Coast with Seoul, Nami Island, Busan, Haeundae, Sky Capsule and Jeju.",
    tags: ["South Korea", "Seoul", "Busan", "Jeju", "Nami Island", "Sky Capsule", "Haeundae", "K-Culture", "Coast"],
    season: "Spring, summer, autumn",
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
  console.error("INSERT_SOUTH_KOREA_READY_PLAN_FAILED");
  console.error(error);
  process.exit(1);
});
