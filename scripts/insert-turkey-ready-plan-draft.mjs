import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import crypto from "node:crypto";

const SOURCE_ENV_PATH = new URL("../.env", import.meta.url);
const SLUG = "adventure-first-turkey-itinerary";
const LEGACY_SLUGS = ["turkey-two-continent-story", SLUG];
const PLAN_TITLE = "Beyond the Sky: Turkey's Ultimate Adventure Escape";

function asId() {
  return crypto.randomUUID();
}

function buildContent() {
  const baseImage = "/bg/home-hero.png";
  const footerImage = "/bg/home-hero-bottom-optimized.jpg";

  const days = [
    {
      id: "day-1",
      dayNumber: 1,
      title: "Gateway to Cappadocia",
      destinationLabel: "Cappadocia",
      countryLabel: "Turkey",
      previewImage: baseImage,
      heroImage: baseImage,
      dateLabel: "Day 1",
      routeFrom: "Istanbul Airport",
      routeTo: "Cappadocia",
      weatherLabel: "25C / Dry valley sunset",
      quote: "Turkey starts practically here: one airport gateway, one clean domestic hop, and then straight into stone valleys and balloon country.",
      description:
        "Use Istanbul Airport as the domestic gateway, fly to Kayseri, transfer to Goreme, check into Sultan Cave Suites, and keep the rest of the day soft for acclimatization and rooftop views.",
      timelineItems: [
        {
          id: "d1-item-1",
          type: "flight",
          time: "10:00",
          title: "Domestic flight from Istanbul to Kayseri",
          description: "A direct domestic leg of about 1 hour 30 minutes that removes unnecessary backtracking and gets the trip into Cappadocia fast.",
          imageUrl: baseImage,
          buttonLabel: "Book Now",
        },
        {
          id: "d1-item-2",
          type: "transportation",
          time: "12:00",
          title: "Kayseri Airport transfer to Goreme",
          description: "A road transfer of roughly 74 kilometers to the cave-hotel district in Goreme.",
          imageUrl: baseImage,
          buttonLabel: "Book Now",
        },
        {
          id: "d1-item-3",
          type: "hotel",
          time: "14:00",
          title: "Check-in at Sultan Cave Suites",
          description: "A balloon-view hotel base positioned well for dawn operations and sunset terrace time.",
          imageUrl: baseImage,
          buttonLabel: "Book Now",
        },
        {
          id: "d1-item-4",
          type: "activity",
          time: "16:00",
          title: "Exclusive adventure time in Goreme",
          description: "Keep this opening block unbooked for rooftop photos, a short local walk, and a gentle first-night adjustment.",
          imageUrl: baseImage,
          buttonLabel: "Book Now",
        },
      ],
      suggestions: [],
      story: {
        imageUrl: baseImage,
        quote: "Cappadocia works best when it arrives fast and then lets you slow down inside it.",
        musicLabel: "Cinematic Story",
        musicUrl: "",
      },
      summary: {
        activitiesCount: "1",
        restaurantsCount: "0",
        transfersCount: "2",
        estimatedCost: "USD 390",
        upgrades: [],
        viewDetailsText: "View Details",
        editPlanText: "Edit Plan",
      },
      notes: [
        {
          id: "d1-note-1",
          icon: "sparkles",
          title: "Route logic",
          text: "This day is about eliminating backtracking and getting the traveler into the core adventure region quickly.",
        },
      ],
    },
    {
      id: "day-2",
      dayNumber: 2,
      title: "Balloon Dawn and Sunset ATV",
      destinationLabel: "Cappadocia",
      countryLabel: "Turkey",
      previewImage: baseImage,
      heroImage: baseImage,
      dateLabel: "Day 2",
      routeFrom: "Cappadocia",
      routeTo: "Cappadocia",
      weatherLabel: "23C / Cool dawn air",
      quote: "This is the postcard day, but it still works operationally because the dawn and sunset highs are separated by a big recovery window.",
      description:
        "Fly in a dawn balloon over Cappadocia, recover through the midday hours, then head out again for a sunset ATV session across the valleys.",
      timelineItems: [
        {
          id: "d2-item-1",
          type: "activity",
          time: "04:30",
          title: "Hot Air Balloon Experience with hotel transfers",
          description: "A sunrise balloon block with operator-confirmed pickup, light breakfast, and roughly 45 to 60 minutes of air time inside a three-hour experience.",
          imageUrl: baseImage,
          buttonLabel: "Book Now",
        },
        {
          id: "d2-item-2",
          type: "hotel",
          time: "08:15",
          title: "Recovery and spa block",
          description: "Leave the late morning and midday intentionally open so the day does not become exhausting after the early balloon call.",
          imageUrl: baseImage,
          buttonLabel: "Book Now",
        },
        {
          id: "d2-item-3",
          type: "activity",
          time: "17:00",
          title: "Cappadocia Sunset ATV Tour",
          description: "A two-hour sunset ATV experience that gives the same landscape a much more kinetic and dusty personality.",
          imageUrl: baseImage,
          buttonLabel: "Book Now",
        },
      ],
      suggestions: [
        {
          id: "d2-suggestion-1",
          title: "Comfort or Deluxe balloon category",
          category: "Upgrade",
          imageUrl: baseImage,
          matchReason: "Useful for travelers who want smaller baskets or a more premium sunrise experience.",
          matchScore: "High fit",
          ctaText: "Book Now",
        },
      ],
      story: {
        imageUrl: baseImage,
        quote: "A good adventure day does not have to be nonstop. It just has to peak at the right times.",
        musicLabel: "Cinematic Story",
        musicUrl: "",
      },
      summary: {
        activitiesCount: "2",
        restaurantsCount: "0",
        transfersCount: "0",
        estimatedCost: "USD 540",
        upgrades: ["Balloon category upgrade"],
        viewDetailsText: "View Details",
        editPlanText: "Edit Plan",
      },
      notes: [
        {
          id: "d2-note-1",
          icon: "sun",
          title: "Weather-sensitive day",
          text: "Balloon pickup time is representative only and should be reconfirmed after booking.",
        },
      ],
    },
    {
      id: "day-3",
      dayNumber: 3,
      title: "Green Tour and Ihlara Trek",
      destinationLabel: "Cappadocia",
      countryLabel: "Turkey",
      previewImage: baseImage,
      heroImage: baseImage,
      dateLabel: "Day 3",
      routeFrom: "Cappadocia",
      routeTo: "Cappadocia",
      weatherLabel: "24C / Dry trekking light",
      quote: "The best Cappadocia day after the balloon is one that reveals depth rather than repeating spectacle.",
      description:
        "Take the Green Tour with trekking in Ihlara Valley, Derinkuyu Underground City, and a full-day operator-managed route before a quieter evening.",
      timelineItems: [
        {
          id: "d3-item-1",
          type: "activity",
          time: "08:30",
          title: "Green Tour with trekking in Ihlara Valley",
          description: "A 7 hour 30 minute guided circuit with hotel pickup, valley trekking, Derinkuyu, and lunch included within the tour block.",
          imageUrl: baseImage,
          buttonLabel: "Book Now",
        },
        {
          id: "d3-item-2",
          type: "restaurant",
          time: "12:30",
          title: "Lunch inside the Green Tour",
          description: "Keep the lunch tied to the operator product so the published schedule stays realistic.",
          imageUrl: baseImage,
          buttonLabel: "Book Now",
        },
        {
          id: "d3-item-3",
          type: "hotel",
          time: "16:15",
          title: "Recovery and packing prep",
          description: "Use the late afternoon for recovery, gear reset, and preparation for the next travel leg.",
          imageUrl: baseImage,
          buttonLabel: "Book Now",
        },
      ],
      suggestions: [],
      story: {
        imageUrl: baseImage,
        quote: "Cappadocia gets more impressive when it stops trying to be only scenic and starts feeling inhabited.",
        musicLabel: "Cinematic Story",
        musicUrl: "",
      },
      summary: {
        activitiesCount: "1",
        restaurantsCount: "1",
        transfersCount: "0",
        estimatedCost: "USD 240",
        upgrades: [],
        viewDetailsText: "View Details",
        editPlanText: "Edit Plan",
      },
      notes: [
        {
          id: "d3-note-1",
          icon: "map",
          title: "Moderate pacing",
          text: "This is the best place in the itinerary to shift from pure adrenaline into guided overland exploration.",
        },
      ],
    },
    {
      id: "day-4",
      dayNumber: 4,
      title: "Flight to Antalya",
      destinationLabel: "Antalya",
      countryLabel: "Turkey",
      previewImage: baseImage,
      heroImage: baseImage,
      dateLabel: "Day 4",
      routeFrom: "Cappadocia",
      routeTo: "Antalya",
      weatherLabel: "29C / Warm Mediterranean light",
      quote: "This is the clean route change: cave valleys out, city-coast staging in.",
      description:
        "Transfer back to Kayseri Airport, fly to Antalya, and reset at Akra Antalya with a soft evening rather than squeezing in another hard adventure.",
      timelineItems: [
        {
          id: "d4-item-1",
          type: "transportation",
          time: "09:00",
          title: "Road transfer from Goreme to Kayseri Airport",
          description: "A road leg of about 75 kilometers back to Kayseri before the domestic flight south.",
          imageUrl: baseImage,
          buttonLabel: "Book Now",
        },
        {
          id: "d4-item-2",
          type: "flight",
          time: "12:08",
          title: "Domestic flight from Kayseri to Antalya",
          description: "A direct domestic hop of around 1 hour 20 minutes that keeps the route efficient.",
          imageUrl: baseImage,
          buttonLabel: "Book Now",
        },
        {
          id: "d4-item-3",
          type: "hotel",
          time: "14:25",
          title: "Check-in at Akra Antalya",
          description: "A comfortable waterfront city base that works well for recovery and airport access.",
          imageUrl: baseImage,
          buttonLabel: "Book Now",
        },
        {
          id: "d4-item-4",
          type: "restaurant",
          time: "18:30",
          title: "Relaxed Antalya dinner",
          description: "Use the evening for a clean transition rather than adding a second major commitment.",
          imageUrl: baseImage,
          buttonLabel: "Book Now",
        },
      ],
      suggestions: [],
      story: {
        imageUrl: baseImage,
        quote: "Efficient travel days are underrated. They make the big days feel bigger.",
        musicLabel: "Cinematic Story",
        musicUrl: "",
      },
      summary: {
        activitiesCount: "0",
        restaurantsCount: "1",
        transfersCount: "2",
        estimatedCost: "USD 430",
        upgrades: [],
        viewDetailsText: "View Details",
        editPlanText: "Edit Plan",
      },
      notes: [
        {
          id: "d4-note-1",
          icon: "plane",
          title: "Airport buffer",
          text: "Keep the full domestic-airport lead time in place. That buffer is part of why the route stays dependable.",
        },
      ],
    },
    {
      id: "day-5",
      dayNumber: 5,
      title: "Koprulu Canyon Rafting Day",
      destinationLabel: "Koprulu Canyon",
      countryLabel: "Turkey",
      previewImage: baseImage,
      heroImage: baseImage,
      dateLabel: "Day 5",
      routeFrom: "Antalya",
      routeTo: "Koprulu Canyon",
      weatherLabel: "31C / River-canyon heat",
      quote: "This is the first real adrenaline-heavy day on the southern leg, and it earns its own space.",
      description:
        "Head from Antalya to Koprulu Canyon for a full-day whitewater rafting block with lunch and a long but worthwhile return.",
      timelineItems: [
        {
          id: "d5-item-1",
          type: "transportation",
          time: "07:30",
          title: "Road transfer to Koprulu Canyon",
          description: "A scenic drive of roughly 95 kilometers from Antalya into the canyon adventure zone.",
          imageUrl: baseImage,
          buttonLabel: "Book Now",
        },
        {
          id: "d5-item-2",
          type: "activity",
          time: "09:05",
          title: "Whitewater rafting experience",
          description: "A nine-hour operator block built around a 14-kilometer rafting course with rapids, swim spots, and return transport.",
          imageUrl: baseImage,
          buttonLabel: "Book Now",
        },
        {
          id: "d5-item-3",
          type: "restaurant",
          time: "12:15",
          title: "Riverside lunch",
          description: "Lunch is included within the rafting-day product and should stay tied to that operator block.",
          imageUrl: baseImage,
          buttonLabel: "Book Now",
        },
      ],
      suggestions: [
        {
          id: "d5-suggestion-1",
          title: "Rafting plus canyoning upgrade",
          category: "Active pace",
          imageUrl: baseImage,
          matchReason: "Best for travelers who want to turn the river day into a denser 10-hour canyon-and-raft experience.",
          matchScore: "Adventure upgrade",
          ctaText: "Book Now",
        },
      ],
      story: {
        imageUrl: baseImage,
        quote: "A real rafting day changes the tone of the whole trip. After this, the coast feels earned.",
        musicLabel: "Cinematic Story",
        musicUrl: "",
      },
      summary: {
        activitiesCount: "1",
        restaurantsCount: "1",
        transfersCount: "1",
        estimatedCost: "USD 260",
        upgrades: ["Rafting plus canyoning"],
        viewDetailsText: "View Details",
        editPlanText: "Edit Plan",
      },
      notes: [
        {
          id: "d5-note-1",
          icon: "waves",
          title: "Do not stack",
          text: "Do not put a late flight or hotel move after this canyon day. The operator block is already long enough.",
        },
      ],
    },
    {
      id: "day-6",
      dayNumber: 6,
      title: "Transfer to Oludeniz",
      destinationLabel: "Oludeniz",
      countryLabel: "Turkey",
      previewImage: baseImage,
      heroImage: baseImage,
      dateLabel: "Day 6",
      routeFrom: "Antalya",
      routeTo: "Oludeniz",
      weatherLabel: "30C / Coastline sun",
      quote: "Now the itinerary stretches west along the coast and changes again, from canyon intensity into sea and air adventure.",
      description:
        "Drive from Antalya to Oludeniz, check into Sundia By Liberty Oludeniz, and use the afternoon for a light shoreline reset near Belcekiz Beach.",
      timelineItems: [
        {
          id: "d6-item-1",
          type: "transportation",
          time: "09:30",
          title: "Private transfer from Antalya to Oludeniz",
          description: "A road transfer of about 198 kilometers and roughly 2 hours 49 minutes to the final coast base.",
          imageUrl: baseImage,
          buttonLabel: "Book Now",
        },
        {
          id: "d6-item-2",
          type: "hotel",
          time: "14:00",
          title: "Check-in at Sundia By Liberty Oludeniz",
          description: "A central Oludeniz base with Belcekiz Beach just a short walk away, ideal for paragliding and boat-day logistics.",
          imageUrl: baseImage,
          buttonLabel: "Book Now",
        },
        {
          id: "d6-item-3",
          type: "activity",
          time: "16:30",
          title: "Belcekiz shoreline adventure time",
          description: "Keep the late afternoon open for a short beach block, a swim, or a light orientation walk.",
          imageUrl: baseImage,
          buttonLabel: "Book Now",
        },
      ],
      suggestions: [],
      story: {
        imageUrl: baseImage,
        quote: "A good coast arrival is never rushed. It lets the body understand that the trip has turned again.",
        musicLabel: "Cinematic Story",
        musicUrl: "",
      },
      summary: {
        activitiesCount: "1",
        restaurantsCount: "0",
        transfersCount: "1",
        estimatedCost: "USD 310",
        upgrades: [],
        viewDetailsText: "View Details",
        editPlanText: "Edit Plan",
      },
      notes: [
        {
          id: "d6-note-1",
          icon: "map",
          title: "Summer traffic",
          text: "Add extra buffer in summer because the Antalya to Oludeniz drive can stretch beyond the base route time.",
        },
      ],
    },
    {
      id: "day-7",
      dayNumber: 7,
      title: "Oludeniz Paragliding Day",
      destinationLabel: "Oludeniz",
      countryLabel: "Turkey",
      previewImage: baseImage,
      heroImage: baseImage,
      dateLabel: "Day 7",
      routeFrom: "Oludeniz",
      routeTo: "Oludeniz",
      weatherLabel: "29C / Blue-sky launch weather",
      quote: "This is the pure thrill day: mountain road up, open air down, and then a deliberately quiet afternoon after the landing.",
      description:
        "Take a tandem paragliding experience from Babadag with hotel pickup, then leave the rest of the day mostly open for recovery and shoreline time.",
      timelineItems: [
        {
          id: "d7-item-1",
          type: "activity",
          time: "08:30",
          title: "Tandem paragliding with hotel pickup",
          description: "A three-hour experience including a road transfer to Babadag and around 30 minutes of flight time over Oludeniz.",
          imageUrl: baseImage,
          buttonLabel: "Book Now",
        },
        {
          id: "d7-item-2",
          type: "restaurant",
          time: "11:30",
          title: "Post-flight lunch",
          description: "Keep lunch close to the landing window and leave the afternoon intentionally lighter.",
          imageUrl: baseImage,
          buttonLabel: "Book Now",
        },
        {
          id: "d7-item-3",
          type: "activity",
          time: "16:00",
          title: "Free shoreline recovery block",
          description: "Leave time for swimming, photos, or a low-energy beach walk rather than adding a second hard booking by default.",
          imageUrl: baseImage,
          buttonLabel: "Book Now",
        },
      ],
      suggestions: [
        {
          id: "d7-suggestion-1",
          title: "Private speed boat to Butterfly Valley",
          category: "Active pace",
          imageUrl: baseImage,
          matchReason: "A clean one-hour add-on if the traveler wants to turn this into a denser air-and-sea adventure day.",
          matchScore: "Optional add-on",
          ctaText: "Book Now",
        },
      ],
      story: {
        imageUrl: baseImage,
        quote: "Some flights are transportation. This one is just a controlled freefall into memory.",
        musicLabel: "Cinematic Story",
        musicUrl: "",
      },
      summary: {
        activitiesCount: "2",
        restaurantsCount: "1",
        transfersCount: "0",
        estimatedCost: "USD 320",
        upgrades: ["Private speed boat add-on"],
        viewDetailsText: "View Details",
        editPlanText: "Edit Plan",
      },
      notes: [
        {
          id: "d7-note-1",
          icon: "plane",
          title: "No airport same day",
          text: "Do not combine paragliding with a same-day flight out. Weather and launch timing need breathing room.",
        },
      ],
    },
    {
      id: "day-8",
      dayNumber: 8,
      title: "Butterfly Valley Boat Day",
      destinationLabel: "Butterfly Valley",
      countryLabel: "Turkey",
      previewImage: baseImage,
      heroImage: baseImage,
      dateLabel: "Day 8",
      routeFrom: "Oludeniz",
      routeTo: "Butterfly Valley",
      weatherLabel: "31C / Full marine day",
      quote: "After the air day, the smartest companion is a water day that stays scenic, slow, and expansive.",
      description:
        "Walk from the hotel to the beach departure area and spend the day on a full Butterfly Valley and St Nicholas Island boat trip with lunch.",
      timelineItems: [
        {
          id: "d8-item-1",
          type: "transportation",
          time: "08:45",
          title: "Walk from hotel to Belcekiz departure area",
          description: "A short walk from the hotel to the Oludeniz beach-front departure zone keeps the boat day low-friction.",
          imageUrl: baseImage,
          buttonLabel: "Book Now",
        },
        {
          id: "d8-item-2",
          type: "activity",
          time: "09:00",
          title: "Oludeniz Boat Trip to Butterfly Valley and St Nicholas Island",
          description: "A seven-hour marine excursion with lunch and swim stops that gives the route one full water-based adventure block.",
          imageUrl: baseImage,
          buttonLabel: "Book Now",
        },
        {
          id: "d8-item-3",
          type: "restaurant",
          time: "13:00",
          title: "Lunch on the boat",
          description: "Keep lunch inside the excursion block so the public schedule reflects the actual supplier structure.",
          imageUrl: baseImage,
          buttonLabel: "Book Now",
        },
      ],
      suggestions: [],
      story: {
        imageUrl: baseImage,
        quote: "The sea day matters because it lets the itinerary widen out after several tightly structured adventure blocks.",
        musicLabel: "Cinematic Story",
        musicUrl: "",
      },
      summary: {
        activitiesCount: "1",
        restaurantsCount: "1",
        transfersCount: "1",
        estimatedCost: "USD 210",
        upgrades: [],
        viewDetailsText: "View Details",
        editPlanText: "Edit Plan",
      },
      notes: [
        {
          id: "d8-note-1",
          icon: "waves",
          title: "Full-day water block",
          text: "Keep departure on Day 9, not the same evening, because this is already a real full-day marine commitment.",
        },
      ],
    },
    {
      id: "day-9",
      dayNumber: 9,
      title: "Departure via Dalaman Airport",
      destinationLabel: "Dalaman Airport",
      countryLabel: "Turkey",
      previewImage: baseImage,
      heroImage: baseImage,
      dateLabel: "Day 9",
      routeFrom: "Oludeniz",
      routeTo: "Home",
      weatherLabel: "30C / Quiet final morning",
      quote: "The final day does not need one more spectacle. It just needs to let the route finish cleanly.",
      description:
        "Take a slow final breakfast, check out of Sundia By Liberty Oludeniz, and transfer to Dalaman Airport with a dependable road and airport buffer.",
      timelineItems: [
        {
          id: "d9-item-1",
          type: "hotel",
          time: "08:00",
          title: "Breakfast and packing buffer",
          description: "Keep the final morning unforced so there is enough time for packing, checkout, and transfer setup.",
          imageUrl: baseImage,
          buttonLabel: "Book Now",
        },
        {
          id: "d9-item-2",
          type: "transportation",
          time: "11:30",
          title: "Road transfer to Dalaman Airport",
          description: "A road leg of about 56 kilometers and roughly 57 minutes from Oludeniz to Dalaman Airport.",
          imageUrl: baseImage,
          buttonLabel: "Book Now",
        },
        {
          id: "d9-item-3",
          type: "flight",
          time: "14:27",
          title: "Airport departure formalities",
          description: "Preserve the full domestic-airport lead time before departure to keep the end of the route dependable.",
          imageUrl: baseImage,
          buttonLabel: "Book Now",
        },
      ],
      suggestions: [],
      story: {
        imageUrl: baseImage,
        quote: "The strongest routes know when to stop pushing and simply let the traveler leave well.",
        musicLabel: "Cinematic Story",
        musicUrl: "",
      },
      summary: {
        activitiesCount: "0",
        restaurantsCount: "0",
        transfersCount: "2",
        estimatedCost: "USD 140",
        upgrades: [],
        viewDetailsText: "View Details",
        editPlanText: "Edit Plan",
      },
      notes: [
        {
          id: "d9-note-1",
          icon: "plane",
          title: "Exit logic",
          text: "Dalaman is the cleanest finish for this route because it avoids unnecessary backtracking toward Istanbul.",
        },
      ],
    },
  ];

  return {
    hero: {
      backgroundImage: baseImage,
      title: PLAN_TITLE,
      subtitle:
        "Nine adventure-first days through Cappadocia, Antalya, and the Oludeniz coast shaped around balloon dawns, canyon water, paragliding, and a clean westbound finish.",
      stats: [
        { label: "Days", value: "9" },
        { label: "Countries", value: "1" },
        { label: "Cities", value: "4" },
        { label: "Travelers", value: "2" },
        { label: "Travel Style", value: "Adventure + Coast" },
      ],
      primaryCtaText: "Book Now",
      primaryCtaHref: "/api/affiliate/redirect",
      secondaryCtaText: "Book Now",
    },
    journeyOverview: {
      title: "Journey Overview",
      startPoint: "Istanbul Airport",
      destinations: "Cappadocia, Antalya, Koprulu Canyon, Oludeniz",
      tripStyle: "Adventure, Flights, Coast, Canyon",
      travelers: "2 Adults",
      estimatedCost: "USD 2,840",
      aiScore: "4.9",
    },
    days,
    footer: {
      backgroundImage: footerImage,
      title: "Your journey, but smarter.",
      subtitle:
        "A new Turkey adventure draft ready for your image uploads, item-by-item affiliate links, and final publishing pass.",
      ctaText: "Book Now",
      ctaHref: "/api/affiliate/redirect",
    },
  };
}

function buildDaysJson(content) {
  return content.days.map((day) => ({
    day: day.dayNumber,
    title: day.title,
    theme: day.quote || day.description || "",
    imageUrl: day.heroImage || day.previewImage || "",
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
    location: "Cappadocia, Antalya, Koprulu Canyon, Oludeniz",
    days: 9,
    image_url: "/bg/home-hero.png",
    created_at: timestamp,
    subtitle:
      "Nine adventure-first days through Cappadocia, Antalya, and the Oludeniz coast built to minimize backtracking and maximize real bookable outdoor experiences.",
    country: "Turkey",
    city: "Cappadocia, Antalya, Oludeniz",
    destination: "Turkey",
    style: "Adventure, Coast, Flights",
    daysCount: 9,
    heroImage: "/bg/home-hero.png",
    coverImage: "/bg/home-hero-bottom-optimized.jpg",
    summary:
      "A Turkey itinerary blending balloon dawns, canyon rafting, coastal paragliding, and Butterfly Valley, ready for final images and per-item affiliate links.",
    seoTitle: PLAN_TITLE,
    seoDescription:
      "Draft ready plan for Turkey across Cappadocia, Antalya, and Oludeniz, waiting for image uploads and item-level affiliate links before publishing.",
    tags: ["Turkey", "Cappadocia", "Antalya", "Oludeniz", "Paragliding", "Rafting"],
    season: "Late Spring to Early Autumn",
    showOnHome: false,
    priceFrom: 2840,
    currency: "USD",
    daysJson,
    contentJson: content,
    updatedAt: timestamp,
  };

  const existingResult = await supabase
    .from("ready_plans")
    .select("id, slug")
    .in("slug", LEGACY_SLUGS)
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
  console.error("INSERT_TURKEY_READY_PLAN_FAILED");
  console.error(error);
  process.exit(1);
});
