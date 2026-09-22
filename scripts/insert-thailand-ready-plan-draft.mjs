import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import crypto from "node:crypto";

const SOURCE_ENV_PATH = new URL("../.env", import.meta.url);
const SLUG = "thailand-island-pulse";

function asId() {
  return crypto.randomUUID();
}

function timeline(idPrefix, items, imageUrl) {
  return items.map((item, index) => ({
    id: `${idPrefix}-item-${index + 1}`,
    type: item.type,
    time: item.time,
    title: item.title,
    description: item.description,
    imageUrl,
    buttonLabel: "Book Now",
  }));
}

function buildContent() {
  const baseImage = "/bg/home-hero.png";
  const footerImage = "/bg/home-hero-bottom-optimized.jpg";

  const days = [
    {
      id: "day-1",
      dayNumber: 1,
      title: "Phuket Rainforest Zipline",
      destinationLabel: "Patong Beach, Phuket",
      countryLabel: "Thailand",
      previewImage: baseImage,
      heroImage: baseImage,
      dateLabel: "Day 1",
      routeFrom: "Patong Beach",
      routeTo: "Hanuman World",
      weatherLabel: "30C / Rainforest humidity",
      quote: "Start high in the Phuket canopy, where the week announces itself with harness clicks, jungle air, and speed.",
      description:
        "Begin from Patong with a rainforest zipline circuit, an included lunch, and a recovery afternoon before dinner by the beach.",
      timelineItems: timeline(
        "d1",
        [
          {
            type: "transportation",
            time: "07:15",
            title: "Private car from Patong to Hanuman World",
            description: "Allow 25 to 35 minutes for the road segment from central Patong to the rainforest adventure park.",
          },
          {
            type: "activity",
            time: "08:00",
            title: "Check-in, lockers, harness fitting, and briefing",
            description: "Set up safely with gear, lockers, and a professional safety briefing before the canopy circuit begins.",
          },
          {
            type: "activity",
            time: "08:20",
            title: "Hanuman World zipline and skywalk package",
            description: "A three-hour canopy session built around 32 platforms, roller elements, skywalk views, and jungle movement.",
          },
          {
            type: "restaurant",
            time: "11:20",
            title: "Included set-menu lunch and cooldown",
            description: "Use the included meal and cooldown block to reset before returning to the beach side of Phuket.",
          },
          {
            type: "transportation",
            time: "12:00",
            title: "Return to Patong for rest and dinner",
            description: "Head back to Patong for a long rest window, then keep dinner flexible and close to the hotel.",
          },
        ],
        baseImage,
      ),
      suggestions: [],
      story: {
        imageUrl: baseImage,
        quote: "The first day is deliberately active but not punishing: one big adrenaline block, then space to recover.",
        musicLabel: "Cinematic Story",
        musicUrl: "",
      },
      summary: {
        activitiesCount: "2",
        restaurantsCount: "1",
        transfersCount: "2",
        estimatedCost: "Provider priced",
        upgrades: [],
        viewDetailsText: "View Details",
        editPlanText: "Edit Plan",
      },
      notes: [
        {
          id: "d1-note-1",
          icon: "sparkles",
          title: "Pace note",
          text: "This opening day assumes travelers are already in Patong the night before, so the morning can start cleanly.",
        },
      ],
    },
    {
      id: "day-2",
      dayNumber: 2,
      title: "Racha Islands Dive Day",
      destinationLabel: "Patong Beach, Phuket",
      countryLabel: "Thailand",
      previewImage: baseImage,
      heroImage: baseImage,
      dateLabel: "Day 2",
      routeFrom: "Patong Beach",
      routeTo: "Chalong Pier and Racha Islands",
      weatherLabel: "31C / Offshore sun",
      quote: "The second day moves from beach town to blue water, with the Racha Islands carrying the marine-adventure side of Phuket.",
      description:
        "Transfer to Chalong Pier for a full scuba day around the Racha Islands, with lunch onboard and a flexible third dive or snorkel block.",
      timelineItems: timeline(
        "d2",
        [
          {
            type: "transportation",
            time: "06:30",
            title: "Private car from Patong to Chalong Pier",
            description: "Use a 20-minute road-transfer assumption for the early start toward Phuket's main dive departure area.",
          },
          {
            type: "activity",
            time: "07:00",
            title: "Pier check-in, coffee, tea, and gear setup",
            description: "Meet the dive operator at Chalong Pier, confirm packages, and prepare equipment before boarding.",
          },
          {
            type: "transportation",
            time: "07:30",
            title: "Boat transit and dive briefing",
            description: "Settle into the offshore transfer window, brief the dive plan, and prepare for the first descent.",
          },
          {
            type: "activity",
            time: "09:30",
            title: "Dive One and surface interval",
            description: "Use the first Racha dive as the main underwater orientation, followed by a measured surface interval.",
          },
          {
            type: "activity",
            time: "11:00",
            title: "Dive Two and onboard lunch",
            description: "Continue with a second dive, then pause for the included onboard lunch and rest block.",
          },
          {
            type: "activity",
            time: "13:00",
            title: "Optional third dive or snorkel",
            description: "Keep this block package-dependent so certified divers and non-divers can both fit the day.",
          },
          {
            type: "transportation",
            time: "16:00",
            title: "Return to Patong",
            description: "Transfer back from Chalong Pier and keep the evening light after the dive day.",
          },
        ],
        baseImage,
      ),
      suggestions: [],
      story: {
        imageUrl: baseImage,
        quote: "This is the cleanest marine-adventure day of the Phuket base: early road, long boat rhythm, deep water, quiet night.",
        musicLabel: "Cinematic Story",
        musicUrl: "",
      },
      summary: {
        activitiesCount: "4",
        restaurantsCount: "1",
        transfersCount: "3",
        estimatedCost: "Provider priced",
        upgrades: [],
        viewDetailsText: "View Details",
        editPlanText: "Edit Plan",
      },
      notes: [
        {
          id: "d2-note-1",
          icon: "waves",
          title: "Dive safety",
          text: "Leave the evening unscheduled and avoid alcohol-heavy plans after repetitive dives and boat motion.",
        },
      ],
    },
    {
      id: "day-3",
      dayNumber: 3,
      title: "Khao Sok Jungle Safari",
      destinationLabel: "Khao Sok",
      countryLabel: "Thailand",
      previewImage: baseImage,
      heroImage: baseImage,
      dateLabel: "Day 3",
      routeFrom: "Patong Beach",
      routeTo: "Khao Sok area",
      weatherLabel: "29C / Rainforest shade",
      quote: "Khao Sok adds the old-rainforest counterpoint: waterfalls, river movement, and a greener kind of exertion.",
      description:
        "Take a full-day jungle excursion from Phuket with a waterfall mini-trek, lunch, and a combined hiking and river activity block.",
      timelineItems: timeline(
        "d3",
        [
          {
            type: "transportation",
            time: "07:00",
            title: "Pickup and road transfer to Khao Sok",
            description: "Plan around a roughly three-hour transfer from Phuket toward the Khao Sok rainforest area.",
          },
          {
            type: "activity",
            time: "10:00",
            title: "Ton Prai Waterfall mini-trek",
            description: "Use the morning for a focused two-hour waterfall walk before the midday heat builds.",
          },
          {
            type: "restaurant",
            time: "12:15",
            title: "Lunch at a jungle lodge",
            description: "Pause for an included lunch before the afternoon park and river section.",
          },
          {
            type: "activity",
            time: "13:15",
            title: "Khao Sok hiking and river block",
            description: "Combine a rainforest walk with a river activity window such as canoeing, depending on the selected provider.",
          },
          {
            type: "transportation",
            time: "16:15",
            title: "Return transfer to Patong",
            description: "Ride back to Phuket and keep dinner simple before the next day's hotel change.",
          },
        ],
        baseImage,
      ),
      suggestions: [],
      story: {
        imageUrl: baseImage,
        quote: "The jungle day is long, but it earns its place by giving the route a real inland adventure chapter.",
        musicLabel: "Cinematic Story",
        musicUrl: "",
      },
      summary: {
        activitiesCount: "2",
        restaurantsCount: "1",
        transfersCount: "2",
        estimatedCost: "Provider priced",
        upgrades: [],
        viewDetailsText: "View Details",
        editPlanText: "Edit Plan",
      },
      notes: [
        {
          id: "d3-note-1",
          icon: "leaf",
          title: "Long day",
          text: "This is one of the biggest transfer days, so avoid adding a nightlife commitment afterward.",
        },
      ],
    },
    {
      id: "day-4",
      dayNumber: 4,
      title: "Ao Nang Transfer and Sunset Kayaking",
      destinationLabel: "Ao Nang, Krabi",
      countryLabel: "Thailand",
      previewImage: baseImage,
      heroImage: baseImage,
      dateLabel: "Day 4",
      routeFrom: "Patong Beach",
      routeTo: "Ao Nang and Ao Thalane",
      weatherLabel: "30C / Mangrove sunset",
      quote: "The trip changes base once, then rewards the move with a quiet paddle through Krabi's mangroves.",
      description:
        "Relocate by private car from Patong to Ao Nang, recover after lunch, then join an Ao Thalane sunset kayaking tour with dinner.",
      timelineItems: timeline(
        "d4",
        [
          {
            type: "transportation",
            time: "08:30",
            title: "Private car from Patong to Ao Nang",
            description: "Use the single major self-driven relocation of the week, roughly 172 to 174 km and about 2 hours 45 minutes by road.",
          },
          {
            type: "hotel",
            time: "11:15",
            title: "Ao Nang hotel check-in and refresh",
            description: "Drop luggage, reset, and use the new Krabi base to simplify the final four days.",
          },
          {
            type: "restaurant",
            time: "12:00",
            title: "Lunch and rest in Ao Nang",
            description: "Keep the early afternoon open so the transfer day does not become overloaded.",
          },
          {
            type: "transportation",
            time: "15:30",
            title: "Pickup from Ao Nang to Ao Thalane",
            description: "Pad the road segment to about 45 minutes for hotel call time and pickup variability.",
          },
          {
            type: "activity",
            time: "16:15",
            title: "Ao Thalane sunset mangrove kayaking",
            description: "A three-hour paddle through the mangrove system, timed for softer light and cooler air.",
          },
          {
            type: "restaurant",
            time: "19:15",
            title: "BBQ dinner at Ao Thalane",
            description: "Close the kayak tour with the included dinner option before returning to Ao Nang.",
          },
          {
            type: "transportation",
            time: "20:00",
            title: "Return to Ao Nang",
            description: "Finish the day with the short return transfer to the Krabi base.",
          },
        ],
        baseImage,
      ),
      suggestions: [],
      story: {
        imageUrl: baseImage,
        quote: "This is the itinerary's hinge: one efficient relocation, then the landscape changes from rainforest to limestone coast.",
        musicLabel: "Cinematic Story",
        musicUrl: "",
      },
      summary: {
        activitiesCount: "1",
        restaurantsCount: "2",
        transfersCount: "3",
        estimatedCost: "Provider priced",
        upgrades: [],
        viewDetailsText: "View Details",
        editPlanText: "Edit Plan",
      },
      notes: [
        {
          id: "d4-note-1",
          icon: "map",
          title: "Base change",
          text: "The two-base structure keeps the week adventurous without forcing a hotel move every other night.",
        },
      ],
    },
    {
      id: "day-5",
      dayNumber: 5,
      title: "Railay Limestone Climbing",
      destinationLabel: "Railay Beach, Krabi",
      countryLabel: "Thailand",
      previewImage: baseImage,
      heroImage: baseImage,
      dateLabel: "Day 5",
      routeFrom: "Ao Nang",
      routeTo: "Railay Beach",
      weatherLabel: "31C / Limestone heat",
      quote: "Railay is the vertical chapter: short boat crossing, limestone walls, chalked hands, and a beach recovery window.",
      description:
        "Cross by longtail from Ao Nang to Railay for a half-day climbing course, then leave the afternoon for lunch, rest, and recovery.",
      timelineItems: timeline(
        "d5",
        [
          {
            type: "transportation",
            time: "08:00",
            title: "Transfer to Ao Nang boat point",
            description: "Use a short local transfer to reach the longtail departure point.",
          },
          {
            type: "transportation",
            time: "08:15",
            title: "Longtail boat from Ao Nang to Railay",
            description: "The crossing is about 15 minutes and keeps the day logistically simple.",
          },
          {
            type: "activity",
            time: "09:00",
            title: "Half-day Railay rock climbing course",
            description: "A four-hour limestone climbing session suitable for the itinerary's core adventure promise.",
          },
          {
            type: "restaurant",
            time: "13:00",
            title: "Lunch on Railay",
            description: "Break on Railay after the climbing block and keep lunch self-selected.",
          },
          {
            type: "activity",
            time: "14:00",
            title: "Beach rest and recovery",
            description: "Build in a low-demand hour after a forearm-heavy climbing morning.",
          },
          {
            type: "transportation",
            time: "15:15",
            title: "Longtail back to Ao Nang",
            description: "Return to the Ao Nang base and leave the late afternoon open for a massage or rest.",
          },
        ],
        baseImage,
      ),
      suggestions: [],
      story: {
        imageUrl: baseImage,
        quote: "The magic here is how quickly Ao Nang becomes Railay: fifteen minutes by boat and the whole texture of the day changes.",
        musicLabel: "Cinematic Story",
        musicUrl: "",
      },
      summary: {
        activitiesCount: "2",
        restaurantsCount: "1",
        transfersCount: "3",
        estimatedCost: "Provider priced",
        upgrades: [],
        viewDetailsText: "View Details",
        editPlanText: "Edit Plan",
      },
      notes: [
        {
          id: "d5-note-1",
          icon: "sparkles",
          title: "Climbing fit",
          text: "The half-day format gives enough intensity for adventurous travelers without consuming the entire day.",
        },
      ],
    },
    {
      id: "day-6",
      dayNumber: 6,
      title: "Dragon Crest, ATV, and Kayaking",
      destinationLabel: "Dragon Crest, Krabi",
      countryLabel: "Thailand",
      previewImage: baseImage,
      heroImage: baseImage,
      dateLabel: "Day 6",
      routeFrom: "Ao Nang",
      routeTo: "Dragon Crest area",
      weatherLabel: "29C / Early summit start",
      quote: "This is the hardest day of the week: dawn pickup, summit effort, ATV dirt, and a lagoon kayak reset.",
      description:
        "Use an early start for Dragon Crest, then layer in ATV riding, lagoon kayaking, and a swim window before returning to Ao Nang.",
      timelineItems: timeline(
        "d6",
        [
          {
            type: "transportation",
            time: "05:30",
            title: "Ao Nang pickup",
            description: "Begin early to put the hiking effort into the cooler morning hours.",
          },
          {
            type: "transportation",
            time: "06:00",
            title: "Transfer to Dragon Crest trailhead",
            description: "Use a 30-minute transfer assumption from Ao Nang toward the Tubkaek-area trailhead zone.",
          },
          {
            type: "activity",
            time: "06:30",
            title: "Dragon Crest hiking block",
            description: "Reserve the strongest morning hours for the summit push and descent.",
          },
          {
            type: "restaurant",
            time: "11:15",
            title: "Lunch stop",
            description: "Keep lunch flexible and self-pay unless the chosen operator includes a meal.",
          },
          {
            type: "activity",
            time: "12:15",
            title: "ATV segment",
            description: "Shift from hiking to a shorter motorized adventure block.",
          },
          {
            type: "activity",
            time: "13:15",
            title: "Lagoon kayaking and swim window",
            description: "Close the hardest day with a paddle and a refreshing water break.",
          },
          {
            type: "transportation",
            time: "14:30",
            title: "Return to Ao Nang and rest",
            description: "Finish with a protected rest block back at the hotel.",
          },
        ],
        baseImage,
      ),
      suggestions: [],
      story: {
        imageUrl: baseImage,
        quote: "Day Six is intentionally the advanced day. It belongs in the plan, but travelers should know it asks more of them.",
        musicLabel: "Cinematic Story",
        musicUrl: "",
      },
      summary: {
        activitiesCount: "3",
        restaurantsCount: "1",
        transfersCount: "3",
        estimatedCost: "Provider priced",
        upgrades: [],
        viewDetailsText: "View Details",
        editPlanText: "Edit Plan",
      },
      notes: [
        {
          id: "d6-note-1",
          icon: "flame",
          title: "Hardest day",
          text: "For a broader audience, this is the easiest day to soften with rafting, ATV, or a lower-effort Krabi adventure swap.",
        },
      ],
    },
    {
      id: "day-7",
      dayNumber: 7,
      title: "Hong Islands Longtail and Kayak Finale",
      destinationLabel: "Hong Islands, Krabi",
      countryLabel: "Thailand",
      previewImage: baseImage,
      heroImage: baseImage,
      dateLabel: "Day 7",
      routeFrom: "Ao Nang",
      routeTo: "Hong Islands",
      weatherLabel: "31C / Island breeze",
      quote: "The finale keeps the adventure alive but makes it photogenic: longtail boat, snorkeling, paddling, beach time, and a viewpoint climb.",
      description:
        "End with a Hong Islands longtail-and-kayak day from Ao Nang, combining snorkel stops, buffet lunch, beach time, and a viewpoint climb.",
      timelineItems: timeline(
        "d7",
        [
          {
            type: "transportation",
            time: "08:15",
            title: "Hotel pickup in Ao Nang",
            description: "Use the operator pickup window to reach the local pier without adding separate logistics.",
          },
          {
            type: "transportation",
            time: "08:45",
            title: "Transfer to Nopparat Thara Pier",
            description: "A short local transfer sets up the island departure.",
          },
          {
            type: "transportation",
            time: "09:00",
            title: "Longtail departure and transit block",
            description: "Head out by longtail toward the Hong Islands area.",
          },
          {
            type: "activity",
            time: "10:00",
            title: "Ko Daeng snorkel stop",
            description: "Use the first island stop for a focused snorkel hour.",
          },
          {
            type: "activity",
            time: "11:15",
            title: "Koh Hong paddle section",
            description: "Add a kayak hour to keep the finale active rather than purely scenic.",
          },
          {
            type: "restaurant",
            time: "12:15",
            title: "Thai-style buffet lunch and rest",
            description: "Break the day with the included lunch before the longer beach window.",
          },
          {
            type: "activity",
            time: "13:00",
            title: "Hong Island beach, swim, kayak, and free time",
            description: "Keep two hours open for the main island beach and water window.",
          },
          {
            type: "activity",
            time: "15:00",
            title: "Hong Island viewpoint climb",
            description: "Close the island time with a short climb for the final wide-angle view.",
          },
          {
            type: "transportation",
            time: "15:30",
            title: "Return boat and transfer to Ao Nang",
            description: "Land back at the pier and return to the hotel for a relaxed final evening.",
          },
        ],
        baseImage,
      ),
      suggestions: [],
      story: {
        imageUrl: baseImage,
        quote: "The last day should feel like a reward, but still belong to the adventure story.",
        musicLabel: "Cinematic Story",
        musicUrl: "",
      },
      summary: {
        activitiesCount: "5",
        restaurantsCount: "1",
        transfersCount: "4",
        estimatedCost: "Provider priced",
        upgrades: [],
        viewDetailsText: "View Details",
        editPlanText: "Edit Plan",
      },
      notes: [
        {
          id: "d7-note-1",
          icon: "waves",
          title: "Finale logic",
          text: "This day is still active, but it has enough beach and boat rhythm to feel like a satisfying finish.",
        },
      ],
    },
  ];

  return {
    hero: {
      backgroundImage: baseImage,
      title: "Adventure-Focused Thailand Travel Plan",
      subtitle:
        "Seven high-energy days across Phuket and Krabi built around ziplining, diving, jungle trekking, kayaking, and rock climbing.",
      stats: [
        { label: "Days", value: "7" },
        { label: "Countries", value: "1" },
        { label: "Bases", value: "2" },
        { label: "Travelers", value: "2" },
        { label: "Travel Style", value: "Adventure" },
      ],
      primaryCtaText: "View Timeline",
      primaryCtaHref: "#timeline",
      secondaryCtaText: "Customize Plan",
    },
    journeyOverview: {
      title: "Journey Overview",
      startPoint: "Patong Beach, Phuket",
      destinations: "Patong Beach, Khao Sok, Ao Nang, Railay, Hong Islands",
      tripStyle: "Zipline, Diving, Jungle, Kayak, Climb",
      travelers: "2 Adults",
      estimatedCost: "Provider priced",
      aiScore: "4.8",
    },
    days,
    footer: {
      backgroundImage: footerImage,
      title: "Your journey, but smarter.",
      subtitle:
        "A Southern Thailand adventure plan ready for final editorial review, with existing images preserved and no affiliate links added.",
      ctaText: "Customize Plan",
      ctaHref: "/ai-planner",
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
      deeplink: "",
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
    title: "Adventure-Focused Thailand Travel Plan",
    location: "Patong Beach, Khao Sok, Ao Nang, Railay, Hong Islands",
    days: 7,
    image_url: "/bg/home-hero.png",
    created_at: timestamp,
    subtitle:
      "Seven high-energy days across Southern Thailand built around ziplining, diving, jungle trekking, kayaking, and rock climbing.",
    country: "Thailand",
    city: "Patong Beach, Ao Nang",
    destination: "Thailand",
    style: "Adventure, Diving, Jungle, Kayaking, Climbing",
    daysCount: 7,
    heroImage: "/bg/home-hero.png",
    coverImage: "/bg/home-hero-bottom-optimized.jpg",
    summary:
      "A Southern Thailand adventure itinerary using a two-base Patong and Ao Nang structure to cover canopy ziplining, Racha Islands diving, Khao Sok rainforest, Ao Thalane kayaking, Railay climbing, Dragon Crest, and the Hong Islands.",
    seoTitle: "Adventure-Focused Thailand Travel Plan",
    seoDescription:
      "Seven-day adventure-focused Thailand itinerary across Phuket and Krabi with ziplining, diving, jungle trekking, kayaking, and rock climbing.",
    tags: ["Thailand", "Phuket", "Krabi", "Adventure", "Diving", "Kayaking", "Climbing"],
    season: "Winter",
    showOnHome: false,
    priceFrom: null,
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
      deeplink: "",
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
        price: null,
        peopleCount: null,
        statusLabel: "Draft",
        categoryLabel: item.type,
        affiliateUrl: null,
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
  console.error("INSERT_THAILAND_READY_PLAN_FAILED");
  console.error(error);
  process.exit(1);
});
