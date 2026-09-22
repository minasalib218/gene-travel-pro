import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import crypto from "node:crypto";

const SOURCE_ENV_PATH = new URL("../.env", import.meta.url);
const SLUG = "japan-golden-soul-escape";

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
      title: "Arrival in Tokyo",
      destinationLabel: "Tokyo",
      countryLabel: "Japan",
      previewImage: baseImage,
      heroImage: baseImage,
      dateLabel: "Day 1",
      routeFrom: "Cairo",
      routeTo: "Tokyo",
      weatherLabel: "18C / Light breeze",
      quote: "The first night in Tokyo feels like stepping into a glowing future.",
      description: "Land in Tokyo, settle into your hotel, and ease into the city with a calm evening walk and first taste of Japanese dining.",
      timelineItems: [
        {
          id: "d1-item-1",
          type: "flight",
          time: "08:30",
          title: "Arrival transfer to hotel",
          description: "Private or airport limousine bus transfer into central Tokyo.",
          imageUrl: baseImage,
          buttonLabel: "Book Now",
        },
        {
          id: "d1-item-2",
          type: "hotel",
          time: "15:00",
          title: "Hotel check-in",
          description: "Check in, refresh, and enjoy a relaxed recovery window after the flight.",
          imageUrl: baseImage,
          buttonLabel: "Book Now",
        },
        {
          id: "d1-item-3",
          type: "restaurant",
          time: "19:30",
          title: "Welcome dinner in Shinjuku",
          description: "A soft-opening dinner with skyline mood and classic Tokyo energy.",
          imageUrl: baseImage,
          buttonLabel: "Book Now",
        },
      ],
      suggestions: [
        {
          id: "d1-suggestion-1",
          title: "Tokyo night photo walk",
          category: "Experience",
          imageUrl: baseImage,
          matchReason: "Low-effort, high-atmosphere first evening activity.",
          matchScore: "Excellent fit",
          ctaText: "Book Now",
        },
      ],
      story: {
        imageUrl: baseImage,
        quote: "Tokyo does not greet you quietly; it welcomes you in light.",
        musicLabel: "Cinematic Story",
        musicUrl: "",
      },
      summary: {
        activitiesCount: "2",
        restaurantsCount: "1",
        transfersCount: "1",
        estimatedCost: "USD 420",
        upgrades: [],
        viewDetailsText: "View Details",
        editPlanText: "Edit Plan",
      },
      notes: [
        {
          id: "d1-note-1",
          icon: "sun",
          title: "Arrival pace",
          text: "Keep the first evening light so the body adjusts to the new time zone.",
        },
      ],
    },
    {
      id: "day-2",
      dayNumber: 2,
      title: "Tokyo Icons",
      destinationLabel: "Tokyo",
      countryLabel: "Japan",
      previewImage: baseImage,
      heroImage: baseImage,
      dateLabel: "Day 2",
      routeFrom: "Tokyo",
      routeTo: "Tokyo",
      weatherLabel: "20C / Clear",
      quote: "A city of contrast: silence in shrines, neon in the skyline.",
      description: "A classic Tokyo day balancing heritage, fashion districts, and skyline viewpoints.",
      timelineItems: [
        {
          id: "d2-item-1",
          type: "activity",
          time: "09:00",
          title: "Senso-ji and Asakusa walk",
          description: "Begin with Tokyo's most iconic temple district before the city fully wakes.",
          imageUrl: baseImage,
          buttonLabel: "Book Now",
        },
        {
          id: "d2-item-2",
          type: "activity",
          time: "13:00",
          title: "Shibuya and Harajuku discovery",
          description: "Move from fashion culture into the pulse of modern Tokyo.",
          imageUrl: baseImage,
          buttonLabel: "Book Now",
        },
        {
          id: "d2-item-3",
          type: "event",
          time: "18:30",
          title: "Sunset skyline view",
          description: "Choose a rooftop or tower experience for the city lights moment.",
          imageUrl: baseImage,
          buttonLabel: "Book Now",
        },
      ],
      suggestions: [],
      story: {
        imageUrl: baseImage,
        quote: "Tokyo is never one mood; it is many worlds stacked together.",
        musicLabel: "Cinematic Story",
        musicUrl: "",
      },
      summary: {
        activitiesCount: "3",
        restaurantsCount: "0",
        transfersCount: "0",
        estimatedCost: "USD 260",
        upgrades: [],
        viewDetailsText: "View Details",
        editPlanText: "Edit Plan",
      },
      notes: [
        {
          id: "d2-note-1",
          icon: "map",
          title: "Transport",
          text: "Cluster the day by district to reduce backtracking and preserve energy.",
        },
      ],
    },
    {
      id: "day-3",
      dayNumber: 3,
      title: "Modern Tokyo and Free Choice",
      destinationLabel: "Tokyo",
      countryLabel: "Japan",
      previewImage: baseImage,
      heroImage: baseImage,
      dateLabel: "Day 3",
      routeFrom: "Tokyo",
      routeTo: "Tokyo",
      weatherLabel: "21C / Mild",
      quote: "The city gives you structure, then invites you to improvise.",
      description: "A more flexible Tokyo day with room for shopping, museums, food lanes, or anime culture depending on mood.",
      timelineItems: [
        {
          id: "d3-item-1",
          type: "activity",
          time: "10:00",
          title: "Choice block: teamLab, Ginza, or Akihabara",
          description: "Use this day for the version of Tokyo you want most to remember.",
          imageUrl: baseImage,
          buttonLabel: "Book Now",
        },
        {
          id: "d3-item-2",
          type: "restaurant",
          time: "19:00",
          title: "Omakase or casual izakaya dinner",
          description: "Set the tone from refined tasting to laid-back nightlife.",
          imageUrl: baseImage,
          buttonLabel: "Book Now",
        },
      ],
      suggestions: [
        {
          id: "d3-suggestion-1",
          title: "Tokyo design cafe stop",
          category: "Lifestyle",
          imageUrl: baseImage,
          matchReason: "Good reset point between heavy walking blocks.",
          matchScore: "Strong fit",
          ctaText: "Book Now",
        },
      ],
      story: {
        imageUrl: baseImage,
        quote: "A city this layered rewards curiosity more than speed.",
        musicLabel: "Cinematic Story",
        musicUrl: "",
      },
      summary: {
        activitiesCount: "2",
        restaurantsCount: "1",
        transfersCount: "0",
        estimatedCost: "USD 310",
        upgrades: [],
        viewDetailsText: "View Details",
        editPlanText: "Edit Plan",
      },
      notes: [
        {
          id: "d3-note-1",
          icon: "clock",
          title: "Flex day",
          text: "Keep this day open enough to absorb delays or add a personal favorite.",
        },
      ],
    },
    {
      id: "day-4",
      dayNumber: 4,
      title: "Tokyo to Kyoto by Shinkansen",
      destinationLabel: "Kyoto",
      countryLabel: "Japan",
      previewImage: baseImage,
      heroImage: baseImage,
      dateLabel: "Day 4",
      routeFrom: "Tokyo",
      routeTo: "Kyoto",
      weatherLabel: "19C / Comfortable",
      quote: "The train itself becomes part of the romance of Japan.",
      description: "Travel south by bullet train, check into Kyoto, then open the city with a gentler cultural evening.",
      timelineItems: [
        {
          id: "d4-item-1",
          type: "transportation",
          time: "09:30",
          title: "Shinkansen to Kyoto",
          description: "A fast, polished transfer that turns movement into part of the experience.",
          imageUrl: baseImage,
          buttonLabel: "Book Now",
        },
        {
          id: "d4-item-2",
          type: "hotel",
          time: "14:00",
          title: "Kyoto hotel check-in",
          description: "Settle into a slower rhythm after Tokyo's high-intensity pace.",
          imageUrl: baseImage,
          buttonLabel: "Book Now",
        },
        {
          id: "d4-item-3",
          type: "activity",
          time: "17:30",
          title: "Evening in Gion",
          description: "Laneways, atmosphere, and a first soft reading of Kyoto's identity.",
          imageUrl: baseImage,
          buttonLabel: "Book Now",
        },
      ],
      suggestions: [],
      story: {
        imageUrl: baseImage,
        quote: "Japan changes tone quickly, and that change is part of its beauty.",
        musicLabel: "Cinematic Story",
        musicUrl: "",
      },
      summary: {
        activitiesCount: "2",
        restaurantsCount: "0",
        transfersCount: "1",
        estimatedCost: "USD 350",
        upgrades: [],
        viewDetailsText: "View Details",
        editPlanText: "Edit Plan",
      },
      notes: [
        {
          id: "d4-note-1",
          icon: "train",
          title: "Luggage",
          text: "Consider forwarding luggage if you want a lighter Kyoto arrival.",
        },
      ],
    },
    {
      id: "day-5",
      dayNumber: 5,
      title: "Kyoto Heritage Day",
      destinationLabel: "Kyoto",
      countryLabel: "Japan",
      previewImage: baseImage,
      heroImage: baseImage,
      dateLabel: "Day 5",
      routeFrom: "Kyoto",
      routeTo: "Kyoto",
      weatherLabel: "18C / Soft sun",
      quote: "Kyoto asks you to slow down enough to notice texture and ritual.",
      description: "Temple landmarks, quiet streets, and traditional rhythm shape the full day.",
      timelineItems: [
        {
          id: "d5-item-1",
          type: "activity",
          time: "08:00",
          title: "Fushimi Inari early visit",
          description: "Go early for the most cinematic and least crowded version of the path.",
          imageUrl: baseImage,
          buttonLabel: "Book Now",
        },
        {
          id: "d5-item-2",
          type: "activity",
          time: "12:00",
          title: "Kiyomizu and Higashiyama",
          description: "Historic Kyoto with strong architecture and layered street scenes.",
          imageUrl: baseImage,
          buttonLabel: "Book Now",
        },
        {
          id: "d5-item-3",
          type: "restaurant",
          time: "19:00",
          title: "Traditional Kyoto dinner",
          description: "A calm, locally rooted dinner to complete the heritage day.",
          imageUrl: baseImage,
          buttonLabel: "Book Now",
        },
      ],
      suggestions: [],
      story: {
        imageUrl: baseImage,
        quote: "Some places do not ask to be photographed; they ask to be felt.",
        musicLabel: "Cinematic Story",
        musicUrl: "",
      },
      summary: {
        activitiesCount: "2",
        restaurantsCount: "1",
        transfersCount: "0",
        estimatedCost: "USD 240",
        upgrades: [],
        viewDetailsText: "View Details",
        editPlanText: "Edit Plan",
      },
      notes: [
        {
          id: "d5-note-1",
          icon: "camera",
          title: "Timing",
          text: "Early start pays off heavily for Kyoto photography and comfort.",
        },
      ],
    },
    {
      id: "day-6",
      dayNumber: 6,
      title: "Arashiyama and Osaka Energy",
      destinationLabel: "Osaka",
      countryLabel: "Japan",
      previewImage: baseImage,
      heroImage: baseImage,
      dateLabel: "Day 6",
      routeFrom: "Kyoto",
      routeTo: "Osaka",
      weatherLabel: "22C / Bright",
      quote: "The plan moves from poetic quiet to electric nightlife in one day.",
      description: "Begin with Arashiyama's softer scenery, then transition to Osaka for street-life, food, and energy.",
      timelineItems: [
        {
          id: "d6-item-1",
          type: "activity",
          time: "08:30",
          title: "Arashiyama bamboo and riverside",
          description: "A scenic morning before shifting into Osaka's louder personality.",
          imageUrl: baseImage,
          buttonLabel: "Book Now",
        },
        {
          id: "d6-item-2",
          type: "transportation",
          time: "14:00",
          title: "Transfer to Osaka",
          description: "Short intercity move with time to reset before the final night mood.",
          imageUrl: baseImage,
          buttonLabel: "Book Now",
        },
        {
          id: "d6-item-3",
          type: "restaurant",
          time: "20:00",
          title: "Dotonbori evening food crawl",
          description: "A high-energy closing night with classic Osaka flavor.",
          imageUrl: baseImage,
          buttonLabel: "Book Now",
        },
      ],
      suggestions: [
        {
          id: "d6-suggestion-1",
          title: "River cruise add-on",
          category: "Upgrade",
          imageUrl: baseImage,
          matchReason: "Adds a softer premium layer before the nightlife block.",
          matchScore: "Optional upgrade",
          ctaText: "Book Now",
        },
      ],
      story: {
        imageUrl: baseImage,
        quote: "Osaka reminds you that joy can be loud and deeply local.",
        musicLabel: "Cinematic Story",
        musicUrl: "",
      },
      summary: {
        activitiesCount: "2",
        restaurantsCount: "1",
        transfersCount: "1",
        estimatedCost: "USD 280",
        upgrades: ["River cruise"],
        viewDetailsText: "View Details",
        editPlanText: "Edit Plan",
      },
      notes: [
        {
          id: "d6-note-1",
          icon: "sparkles",
          title: "Contrast day",
          text: "This day works because the pacing contrasts nature and city nightlife.",
        },
      ],
    },
    {
      id: "day-7",
      dayNumber: 7,
      title: "Departure from Osaka",
      destinationLabel: "Osaka",
      countryLabel: "Japan",
      previewImage: baseImage,
      heroImage: baseImage,
      dateLabel: "Day 7",
      routeFrom: "Osaka",
      routeTo: "Home",
      weatherLabel: "20C / Calm",
      quote: "A good closing day leaves space to feel the trip before leaving it.",
      description: "A final easy-paced morning with checkout and airport departure from Osaka.",
      timelineItems: [
        {
          id: "d7-item-1",
          type: "hotel",
          time: "09:00",
          title: "Slow final breakfast",
          description: "Keep the morning relaxed and lightly structured.",
          imageUrl: baseImage,
          buttonLabel: "Book Now",
        },
        {
          id: "d7-item-2",
          type: "transportation",
          time: "12:30",
          title: "Airport transfer",
          description: "Move to the airport with strong timing margin for an international departure.",
          imageUrl: baseImage,
          buttonLabel: "Book Now",
        },
      ],
      suggestions: [],
      story: {
        imageUrl: baseImage,
        quote: "The best journeys stay with you because they change your tempo.",
        musicLabel: "Cinematic Story",
        musicUrl: "",
      },
      summary: {
        activitiesCount: "1",
        restaurantsCount: "0",
        transfersCount: "1",
        estimatedCost: "USD 110",
        upgrades: [],
        viewDetailsText: "View Details",
        editPlanText: "Edit Plan",
      },
      notes: [
        {
          id: "d7-note-1",
          icon: "plane",
          title: "Departure timing",
          text: "Keep the last morning protected from extra sightseeing pressure.",
        },
      ],
    },
  ];

  return {
    hero: {
      backgroundImage: baseImage,
      title: "Your Cinematic Ready Plan",
      subtitle: "A polished seven-day route through Tokyo, Kyoto, and Osaka, blending culture, food, atmosphere, and cinematic pacing.",
      stats: [
        { label: "Days", value: "7" },
        { label: "Countries", value: "1" },
        { label: "Cities", value: "3" },
        { label: "Travelers", value: "2" },
        { label: "Travel Style", value: "Culture + Luxury" },
      ],
      primaryCtaText: "Book Now",
      primaryCtaHref: "/api/affiliate/redirect",
      secondaryCtaText: "Book Now",
    },
    journeyOverview: {
      title: "Journey Overview",
      startPoint: "Cairo",
      destinations: "Tokyo, Kyoto, Osaka",
      tripStyle: "Culture, Food, Urban Discovery",
      travelers: "2 Adults",
      estimatedCost: "USD 1,980",
      aiScore: "4.9",
    },
    days,
    footer: {
      backgroundImage: footerImage,
      title: "Your journey, but smarter.",
      subtitle: "Let the draft stay hidden until you finish images, affiliate links, and final polish.",
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
    title: "Japan Golden Soul Escape",
    location: "Tokyo, Kyoto, Osaka",
    days: 7,
    image_url: "/bg/home-hero.png",
    created_at: timestamp,
    subtitle:
      "Seven cinematic days across Tokyo, Kyoto, and Osaka shaped around culture, food, and urban discovery.",
    country: "Japan",
    city: "Tokyo, Kyoto, Osaka",
    destination: "Japan",
    style: "Culture, Food, Urban Discovery",
    daysCount: 7,
    heroImage: "/bg/home-hero.png",
    coverImage: "/bg/home-hero-bottom-optimized.jpg",
    summary:
      "A polished week through Japan with Tokyo icons, Kyoto rituals, and Osaka energy, ready for final imagery and affiliate links.",
    seoTitle: "Japan Golden Soul Escape",
    seoDescription:
      "Draft ready plan spanning Tokyo, Kyoto, and Osaka, awaiting images and affiliate links before publishing.",
    tags: ["Japan", "Tokyo", "Kyoto", "Osaka", "Luxury", "Culture"],
    season: "Spring or Autumn",
    showOnHome: false,
    priceFrom: 1980,
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

  if (existingResult.error) {
    throw existingResult.error;
  }

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

  const insertDays = await supabase
    .from("ready_plan_days")
    .insert(dayRows)
    .select("id, dayNumber");

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

  console.log(JSON.stringify({
    ok: true,
    slug: SLUG,
    planId,
    daysInserted: dayRows.length,
    itemsInserted: itemRows.length,
  }, null, 2));
}

main().catch((error) => {
  console.error("INSERT_JAPAN_READY_PLAN_FAILED");
  console.error(error);
  process.exit(1);
});
