import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import crypto from "node:crypto";

const SOURCE_ENV_PATH = new URL("../.env", import.meta.url);
const SLUG = "iceland-fire-and-ice-road";
const PLAN_TITLE = "Iceland Fire & Ice Road";
const baseImage = "/bg/home-hero.png";
const footerImage = "/bg/home-hero-bottom-optimized.jpg";

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
    imageUrl: baseImage,
    buttonLabel: "Book Now",
    status: "Draft",
    badge: type,
    ...extra,
  };
}

function buildSummary(items, estimatedCost, upgrades = []) {
  const count = (types) => items.filter((entry) => types.includes(entry.type)).length;
  return {
    activitiesCount: String(count(["activity", "event"])),
    restaurantsCount: String(count(["restaurant"])),
    transfersCount: String(count(["transportation", "transfer", "flight"])),
    estimatedCost,
    upgrades,
    viewDetailsText: "View Details",
    editPlanText: "Edit Plan",
  };
}

function day({
  dayNumber,
  title,
  destinationLabel,
  routeFrom,
  routeTo,
  weatherLabel,
  quote,
  description,
  items,
  notes,
  suggestions = [],
  storyQuote,
  estimatedCost,
  upgrades = [],
}) {
  return {
    id: `day-${dayNumber}`,
    dayNumber,
    title,
    destinationLabel,
    countryLabel: "Iceland",
    previewImage: baseImage,
    heroImage: baseImage,
    dateLabel: `Day ${dayNumber}`,
    routeFrom,
    routeTo,
    weatherLabel,
    quote,
    description,
    timelineItems: items,
    suggestions,
    story: {
      imageUrl: baseImage,
      quote: storyQuote || quote,
      musicLabel: "Cinematic Story",
      musicUrl: "",
    },
    summary: buildSummary(items, estimatedCost, upgrades),
    notes,
  };
}

function buildContent() {
  const days = [
    day({
      dayNumber: 1,
      title: "Golden Circle to Selfoss",
      destinationLabel: "Golden Circle and Selfoss",
      routeFrom: "Reykjavik",
      routeTo: "Thingvellir, Geysir, Gullfoss, Kerid, Selfoss",
      weatherLabel: "10C / Fresh volcanic air",
      quote:
        "The Fire and Ice Road begins with tectonic rifts, steaming earth, waterfall thunder, and a calm Selfoss evening.",
      description:
        "Depart Reykjavik early in a rental SUV for the Golden Circle loop, visiting Thingvellir, Geysir, Gullfoss, optional Kerid crater, and ending at Hotel Selfoss.",
      estimatedCost: "USD 320-480",
      items: [
        item(
          "d1-item-1",
          "transportation",
          "07:30",
          "Pick up rental SUV and depart Reykjavik",
          "Collect the rental SUV in Reykjavik. The itinerary assumes a 4x4 for Iceland roads and summer road access.",
          { price: "Rental cost varies", people: "2-4 People", badge: "4x4 SUV" },
        ),
        item(
          "d1-item-2",
          "transportation",
          "07:30",
          "Drive Reykjavik to Thingvellir",
          "Drive about 45-50 km from Reykjavik to Thingvellir, allowing roughly 35-40 minutes on summer roads.",
          { price: "Included in rental", people: "2-4 People", badge: "Drive" },
        ),
        item(
          "d1-item-3",
          "activity",
          "07:45",
          "Thingvellir National Park",
          "Spend about 1 hour 15 minutes at the UNESCO national park. Walk the rift landscape independently or connect with a Golden Circle Classic Day Tour from Reykjavik.",
          { price: "Tour from about USD 96-119 pp", people: "2-4 People", badge: "Viator / Klook" },
        ),
        item(
          "d1-item-4",
          "transportation",
          "09:00",
          "Drive Thingvellir to Geysir",
          "Drive roughly 50-60 km to the Geysir geothermal area, allowing around 40-45 minutes.",
          { price: "Included in rental", people: "2-4 People", badge: "Drive" },
        ),
        item(
          "d1-item-5",
          "activity",
          "09:50",
          "Geysir geothermal area",
          "Watch Strokkur erupt and explore the geothermal field for about 1 hour 15 minutes. This can pair with Klook's Golden Circle and Fridheimar Greenhouse Tour.",
          { price: "Tour from about USD 96 pp", people: "2-4 People", badge: "Geothermal" },
        ),
        item(
          "d1-item-6",
          "restaurant",
          "11:05",
          "Lunch at Fridheimar Tomato Farm",
          "Lunch at the tomato greenhouse. Reservations are advised; allow around 60 minutes for soup and warm greenhouse atmosphere.",
          { price: "USD 35-55", people: "2-4 People", badge: "Lunch" },
        ),
        item(
          "d1-item-7",
          "transportation",
          "12:15",
          "Drive to Gullfoss",
          "Short 10 km drive to Gullfoss waterfall, around 10 minutes.",
          { price: "Included in rental", people: "2-4 People", badge: "Drive" },
        ),
        item(
          "d1-item-8",
          "activity",
          "12:25",
          "Gullfoss waterfall",
          "Stay around 1 hour 15 minutes for the waterfall viewpoints and photo stops, longer than standard group-tour timing.",
          { price: "Included / tour option", people: "2-4 People", badge: "Waterfall" },
        ),
        item(
          "d1-item-9",
          "transportation",
          "13:40",
          "Drive to Kerid crater",
          "Drive about 57 km toward Kerid volcanic crater, allowing roughly 35-40 minutes.",
          { price: "Included in rental", people: "2-4 People", badge: "Drive" },
        ),
        item(
          "d1-item-10",
          "activity",
          "14:20",
          "Kerid volcanic crater",
          "Optional 45-minute walk around the crater rim before continuing to Selfoss.",
          { price: "Low entry fee", people: "2-4 People", badge: "Optional" },
        ),
        item(
          "d1-item-11",
          "transportation",
          "15:05",
          "Drive Kerid to Selfoss",
          "Continue about 36-40 km to Selfoss, allowing around 30-40 minutes.",
          { price: "Included in rental", people: "2-4 People", badge: "Drive" },
        ),
        item(
          "d1-item-12",
          "hotel",
          "15:45",
          "Check in at Hotel Selfoss",
          "Check in at Hotel Selfoss, Eyravegur 2. The source lists check-in from 15:00 and checkout around 11:00.",
          { price: "Hotel booked separately", people: "2-4 People", badge: "Hotel" },
        ),
        item(
          "d1-item-13",
          "restaurant",
          "19:00",
          "Dinner at Riverside Restaurant or local bistro",
          "Dinner at the hotel's Riverside Restaurant / Bar and Grill or a nearby Selfoss bistro.",
          { price: "USD 45-80", people: "2-4 People", badge: "Dinner" },
        ),
      ],
      notes: [
        {
          id: "d1-note-1",
          icon: "car",
          title: "Self-drive assumption",
          text: "The plan assumes summer roads and an SUV/4x4, with buffer time for photo stops.",
        },
        {
          id: "d1-note-2",
          icon: "clock",
          title: "Tour alignment",
          text: "Golden Circle provider options usually meet around BSÍ in Reykjavik, but this draft is structured as self-drive.",
        },
      ],
    }),
    day({
      dayNumber: 2,
      title: "Waterfalls to Vik",
      destinationLabel: "South Coast and Vik",
      routeFrom: "Selfoss",
      routeTo: "Seljalandsfoss, Skogafoss, Reynisfjara, Dyrholaey, Vik",
      weatherLabel: "9C / Mist and black-sand drama",
      quote:
        "The South Coast is Iceland in motion: waterfalls, sea stacks, cliffs, black sand, and a night in Vik.",
      description:
        "Drive from Selfoss through Seljalandsfoss, Skogafoss, Reynisfjara, Dyrholaey, and into Vik for lunch, rest, and dinner.",
      estimatedCost: "USD 220-380",
      items: [
        item(
          "d2-item-1",
          "restaurant",
          "08:00",
          "Breakfast at Hotel Selfoss",
          "Breakfast and packing before leaving Selfoss for the South Coast.",
          { price: "Included / varies", people: "2-4 People", badge: "Breakfast" },
        ),
        item(
          "d2-item-2",
          "transportation",
          "08:30",
          "Drive Selfoss to Seljalandsfoss",
          "Drive about 60-72 km from Selfoss to Seljalandsfoss, allowing 40-55 minutes.",
          { price: "Included in rental", people: "2-4 People", badge: "Drive" },
        ),
        item(
          "d2-item-3",
          "activity",
          "09:20",
          "Seljalandsfoss waterfall",
          "A 45-minute waterfall stop with the famous walk behind the falls. Bring rain gear.",
          { price: "Free / parking varies", people: "2-4 People", badge: "Waterfall" },
        ),
        item(
          "d2-item-4",
          "activity",
          "09:55",
          "Optional Gljufrabui canyon waterfall",
          "Optional nearby 10-minute walk into the canyon behind rock to see Gljufrabui.",
          { price: "Free", people: "2-4 People", badge: "Optional" },
        ),
        item(
          "d2-item-5",
          "transportation",
          "10:05",
          "Drive to Skogafoss",
          "Drive about 30 km from Seljalandsfoss to Skogafoss, around 20-25 minutes.",
          { price: "Included in rental", people: "2-4 People", badge: "Drive" },
        ),
        item(
          "d2-item-6",
          "activity",
          "10:40",
          "Skogafoss waterfall",
          "Spend an hour at Skogafoss and climb the steps for the top view if conditions allow.",
          { price: "Free / parking varies", people: "2-4 People", badge: "Waterfall" },
        ),
        item(
          "d2-item-7",
          "transportation",
          "11:40",
          "Drive to Reynisfjara",
          "Drive about 18 km toward Reynisfjara black-sand beach.",
          { price: "Included in rental", people: "2-4 People", badge: "Drive" },
        ),
        item(
          "d2-item-8",
          "activity",
          "12:00",
          "Reynisfjara black-sand beach",
          "One hour at Reynisfjara for basalt sea stacks and black sand. Use caution around dangerous sneaker waves.",
          { price: "Included / South Coast tours from USD 134 pp", people: "2-4 People", badge: "Klook / Coast" },
        ),
        item(
          "d2-item-9",
          "transportation",
          "13:00",
          "Drive to Dyrholaey",
          "Short 10 km drive toward the Dyrholaey arch and lighthouse viewpoint.",
          { price: "Included in rental", people: "2-4 People", badge: "Drive" },
        ),
        item(
          "d2-item-10",
          "activity",
          "13:15",
          "Dyrholaey arch and lighthouse viewpoint",
          "A 45-minute stop for cliffs, sea views, and summer bird cliffs.",
          { price: "Free", people: "2-4 People", badge: "Viewpoint" },
        ),
        item(
          "d2-item-11",
          "transportation",
          "14:00",
          "Drive to Vik village",
          "Short 5 km drive into Vik village.",
          { price: "Included in rental", people: "2-4 People", badge: "Drive" },
        ),
        item(
          "d2-item-12",
          "restaurant",
          "14:10",
          "Late lunch in Vik",
          "Lunch in Vik at a local option such as Sudur-Vik or Halldorskaffi.",
          { price: "USD 35-60", people: "2-4 People", badge: "Lunch" },
        ),
        item(
          "d2-item-13",
          "hotel",
          "15:00",
          "Check in at Hotel Vik i Myrdal",
          "Check in at Hotel Vik i Myrdal, Klettsvegur 1-5. The source lists check-in from 15:00 and checkout around 12:00.",
          { price: "Hotel booked separately", people: "2-4 People", badge: "Hotel" },
        ),
        item(
          "d2-item-14",
          "activity",
          "16:00",
          "Rest or Reyniskirkja viewpoint walk",
          "Free time in Vik or an optional short hike to the Reynisfjall / Reyniskirkja viewpoint.",
          { price: "Free", people: "2-4 People", badge: "Free Time" },
        ),
        item(
          "d2-item-15",
          "restaurant",
          "18:00",
          "Dinner in Vik",
          "Dinner in Vik, such as Strondin Pub or Smidjan Brugghus, then overnight in Vik.",
          { price: "USD 45-75", people: "2-4 People", badge: "Dinner" },
        ),
      ],
      suggestions: [
        {
          id: "d2-suggestion-1",
          title: "South Coast guided tour backup",
          category: "Provider-backed",
          imageUrl: baseImage,
          matchReason: "Useful if the traveler prefers minibus guidance instead of self-drive for the waterfall and black-sand route.",
          matchScore: "Klook / Viator option",
          ctaText: "Book Now",
        },
      ],
      notes: [
        {
          id: "d2-note-1",
          icon: "alert",
          title: "Wave safety",
          text: "Reynisfjara has dangerous waves. Keep this warning visible when polishing the customer copy.",
        },
      ],
    }),
    day({
      dayNumber: 3,
      title: "Skaftafell Glacier Hike and Glacier Lagoon",
      destinationLabel: "Skaftafell and Jokulsarlon",
      routeFrom: "Vik",
      routeTo: "Skaftafell, Jokulsarlon, Hnappavellir",
      weatherLabel: "7C / Glacier air",
      quote:
        "Day three steps onto the ice: crampons, glacier textures, drifting icebergs, and a night near the lagoon.",
      description:
        "Drive from Vik to Skaftafell for a guided glacier hike, then continue to Jokulsarlon Glacier Lagoon, Diamond Beach, and Fosshotel Glacier Lagoon.",
      estimatedCost: "USD 360-540",
      items: [
        item(
          "d3-item-1",
          "transportation",
          "07:00",
          "Drive Vik to Skaftafell",
          "Drive about 145 km from Vik to Skaftafell, allowing around 1 hour 45 minutes to 1 hour 50 minutes.",
          { price: "Included in rental", people: "2-4 People", badge: "Drive" },
        ),
        item(
          "d3-item-2",
          "activity",
          "09:00",
          "Skaftafell Glacier Hike",
          "Three-hour guided glacier hike meeting at Troll Expeditions Skaftafell. Includes technical briefing, crampons, guide, and glacier walking on an outlet of Vatnajokull.",
          { price: "USD 105-113 pp", people: "2-4 People", badge: "Viator / Klook" },
        ),
        item(
          "d3-item-3",
          "restaurant",
          "12:00",
          "Lunch at Skaftafell visitor center",
          "Lunch at the Skaftafell / National Park visitor center cafeteria with a short rest after the hike.",
          { price: "USD 25-45", people: "2-4 People", badge: "Lunch" },
        ),
        item(
          "d3-item-4",
          "transportation",
          "13:30",
          "Drive Skaftafell to Jokulsarlon",
          "Drive about 46 km from Skaftafell to Jokulsarlon Glacier Lagoon, allowing around 35-40 minutes.",
          { price: "Included in rental", people: "2-4 People", badge: "Drive" },
        ),
        item(
          "d3-item-5",
          "activity",
          "14:15",
          "Jokulsarlon Glacier Lagoon and Diamond Beach",
          "Spend about one hour viewing drifting icebergs and walking Diamond Beach across the road. Zodiac or boat tours can be added if desired.",
          { price: "Free / boat optional", people: "2-4 People", badge: "Lagoon" },
        ),
        item(
          "d3-item-6",
          "transportation",
          "15:15",
          "Drive to Fosshotel Glacier Lagoon",
          "Drive from the lagoon area to the accommodation near Hnappavellir / Oraefi.",
          { price: "Included in rental", people: "2-4 People", badge: "Drive" },
        ),
        item(
          "d3-item-7",
          "hotel",
          "16:00",
          "Check in at Fosshotel Glacier Lagoon",
          "Check in at Fosshotel Glacier Lagoon in Hnappavellir, Oraefi. The source lists check-in from 15:00 and checkout around 12:00.",
          { price: "Hotel booked separately", people: "2-4 People", badge: "Hotel" },
        ),
        item(
          "d3-item-8",
          "activity",
          "17:00",
          "Optional Svinafellsjokull walk or hotel spa",
          "Optional walk toward a nearby glacier outlet or relax in the hotel spa before dinner.",
          { price: "Free / spa varies", people: "2-4 People", badge: "Optional" },
        ),
        item(
          "d3-item-9",
          "restaurant",
          "19:00",
          "Dinner at Glacier Lagoon Restaurant",
          "Dinner at the hotel's Glacier Lagoon Restaurant or a local guesthouse option.",
          { price: "USD 55-90", people: "2-4 People", badge: "Dinner" },
        ),
      ],
      suggestions: [
        {
          id: "d3-suggestion-1",
          title: "Jokulsarlon boat or Zodiac upgrade",
          category: "Adventure",
          imageUrl: baseImage,
          matchReason: "Adds a closer glacier-lagoon perspective after the hike if timing and season allow.",
          matchScore: "Optional upgrade",
          ctaText: "Book Now",
        },
      ],
      notes: [
        {
          id: "d3-note-1",
          icon: "boot",
          title: "Glacier gear",
          text: "Guided glacier hikes usually provide crampons and safety equipment, but warm layers and waterproof boots matter.",
        },
      ],
    }),
    day({
      dayNumber: 4,
      title: "Ice Cave Tour and Return to Vik",
      destinationLabel: "Jokulsarlon and Vik",
      routeFrom: "Fosshotel Glacier Lagoon",
      routeTo: "Jokulsarlon, Diamond Beach, Vik",
      weatherLabel: "6C / Ice and coastal wind",
      quote:
        "The day goes under the glacier, then follows the same coast back west with ice still in the mind.",
      description:
        "Morning ice cave tour from Jokulsarlon, lunch and lagoon time, then drive back to Vik for a free evening.",
      estimatedCost: "USD 330-520",
      items: [
        item(
          "d4-item-1",
          "restaurant",
          "08:00",
          "Breakfast at Fosshotel",
          "Breakfast at the hotel before the ice cave tour departure.",
          { price: "Included / varies", people: "2-4 People", badge: "Breakfast" },
        ),
        item(
          "d4-item-2",
          "activity",
          "09:00",
          "Original Ice Cave or Crystal Ice Cave tour",
          "Two-and-a-half to three-hour ice cave tour meeting at Jokulsarlon parking. Super Jeep transport takes travelers under Vatnajokull ice.",
          { price: "USD 150-157 pp", people: "2-4 People", badge: "Viator / Klook" },
        ),
        item(
          "d4-item-3",
          "activity",
          "12:00",
          "Lagoon and Diamond Beach sightseeing",
          "Extra time at the glacier lagoon and Diamond Beach if not completed the previous day.",
          { price: "Free", people: "2-4 People", badge: "Lagoon" },
        ),
        item(
          "d4-item-4",
          "restaurant",
          "12:30",
          "Lunch at Jokulsarlon cafe",
          "Simple lunch at the Jokulsarlon cafe before the long return drive west.",
          { price: "USD 25-45", people: "2-4 People", badge: "Lunch" },
        ),
        item(
          "d4-item-5",
          "transportation",
          "13:00",
          "Drive Jokulsarlon to Vik",
          "Drive about 145 km back along the coast to Vik, allowing roughly 2 hours 15 minutes.",
          { price: "Included in rental", people: "2-4 People", badge: "Drive" },
        ),
        item(
          "d4-item-6",
          "hotel",
          "15:15",
          "Check in at Hotel Vik i Myrdal",
          "Return to Hotel Vik i Myrdal for the night after the glacier lagoon section.",
          { price: "Hotel booked separately", people: "2-4 People", badge: "Hotel" },
        ),
        item(
          "d4-item-7",
          "activity",
          "16:00",
          "Free time or Reynisfjall viewpoint",
          "Free time in Vik, optional hike to a nearby Reynisfjall viewpoint, or hotel rest.",
          { price: "Free", people: "2-4 People", badge: "Free Time" },
        ),
        item(
          "d4-item-8",
          "restaurant",
          "19:00",
          "Dinner in Vik",
          "Dinner in Vik and overnight at Hotel Vik.",
          { price: "USD 45-75", people: "2-4 People", badge: "Dinner" },
        ),
      ],
      notes: [
        {
          id: "d4-note-1",
          icon: "snow",
          title: "Season detail",
          text: "The source notes winter is best for many ice caves; summer alternatives can include blue ice caves and glacier walks.",
        },
      ],
    }),
    day({
      dayNumber: 5,
      title: "Blue Lagoon and Reykjavik Return",
      destinationLabel: "Blue Lagoon and Reykjavik",
      routeFrom: "Vik",
      routeTo: "Fludir, Blue Lagoon, Reykjavik",
      weatherLabel: "11C / Geothermal calm",
      quote:
        "After fire roads and glacier days, the route softens into mineral water, lava fields, and a final Reykjavik dinner.",
      description:
        "Drive from Vik toward the Blue Lagoon with optional Secret Lagoon stop, spend three hours at the Blue Lagoon, then return to Reykjavik Centrum for a farewell evening.",
      estimatedCost: "USD 420-680",
      items: [
        item(
          "d5-item-1",
          "restaurant",
          "08:00",
          "Breakfast at Vik hotel",
          "Breakfast at the Vik hotel before the return route begins.",
          { price: "Included / varies", people: "2-4 People", badge: "Breakfast" },
        ),
        item(
          "d5-item-2",
          "transportation",
          "08:30",
          "Drive Vik to Fludir / Secret Lagoon",
          "Drive about 115 km from Vik toward Fludir, allowing around 1 hour 30 minutes.",
          { price: "Included in rental", people: "2-4 People", badge: "Drive" },
        ),
        item(
          "d5-item-3",
          "activity",
          "10:00",
          "Optional Secret Lagoon soak",
          "Optional one-hour geothermal soak near Fludir before continuing to the Reykjanes Peninsula.",
          { price: "Entry varies", people: "2-4 People", badge: "Optional Spa" },
        ),
        item(
          "d5-item-4",
          "transportation",
          "10:30",
          "Drive Fludir to Blue Lagoon",
          "Drive about 135 km toward the Blue Lagoon via Thingvallavatn, allowing roughly 1 hour 30 minutes. Alternative is Vik to Reykjavik straight with a stop en route.",
          { price: "Included in rental", people: "2-4 People", badge: "Drive" },
        ),
        item(
          "d5-item-5",
          "activity",
          "12:00",
          "Blue Lagoon comfort or premium entry",
          "Three-hour Blue Lagoon visit with spa facilities. Use Klook Comfort/Premium entry or Viator Blue Lagoon Comfort/Deluxe options.",
          { price: "USD 98-236 pp", people: "2-4 People", badge: "Klook / Viator" },
        ),
        item(
          "d5-item-6",
          "restaurant",
          "13:30",
          "Lunch at Lava Restaurant",
          "Lunch during the Blue Lagoon visit at Lava Restaurant or an on-site cafe.",
          { price: "USD 45-90", people: "2-4 People", badge: "Lunch" },
        ),
        item(
          "d5-item-7",
          "transportation",
          "15:00",
          "Return to Reykjavik",
          "Drive about 50 km from the Blue Lagoon to Reykjavik, allowing around 35-40 minutes.",
          { price: "Included in rental", people: "2-4 People", badge: "Drive" },
        ),
        item(
          "d5-item-8",
          "hotel",
          "15:30",
          "Check in at Hotel Reykjavik Centrum",
          "Check in at Hotel Reykjavik Centrum, Adalstraeti 16. The source lists check-in between 15:00 and 24:00 and checkout around 12:00.",
          { price: "Hotel booked separately", people: "2-4 People", badge: "Hotel" },
        ),
        item(
          "d5-item-9",
          "restaurant",
          "19:00",
          "Farewell dinner in Reykjavik",
          "Farewell dinner in Reykjavik, such as Grillmarkadurinn or Fiskmarkadurinn. The itinerary ends; next day departure or extension.",
          { price: "USD 60-110", people: "2-4 People", badge: "Dinner" },
        ),
      ],
      suggestions: [
        {
          id: "d5-suggestion-1",
          title: "Blue Lagoon premium package",
          category: "Spa Upgrade",
          imageUrl: baseImage,
          matchReason: "Best comfort upgrade for the final travel day after long road sections.",
          matchScore: "Recommended",
          ctaText: "Book Now",
        },
      ],
      notes: [
        {
          id: "d5-note-1",
          icon: "spa",
          title: "Ending pace",
          text: "Blue Lagoon is intentionally placed at the end to turn the road trip into a softer landing.",
        },
      ],
    }),
  ];

  return {
    hero: {
      backgroundImage: baseImage,
      title: "Your Cinematic Ready Plan",
      subtitle:
        "A self-drive Fire and Ice Road through Reykjavik, Golden Circle, South Coast waterfalls, glacier country, Jokulsarlon, and Blue Lagoon.",
      stats: [
        { label: "Days", value: "5" },
        { label: "Countries", value: "1" },
        { label: "Cities", value: "5" },
        { label: "Travelers", value: "2-4" },
        { label: "Travel Style", value: "Fire + Ice Road" },
      ],
      primaryCtaText: "Book Now",
      primaryCtaHref: "/api/affiliate/redirect",
      secondaryCtaText: "Book Now",
    },
    journeyOverview: {
      title: "Journey Overview",
      startPoint: "Reykjavik",
      destinations: "Golden Circle, Selfoss, Vik, Skaftafell, Jokulsarlon, Blue Lagoon",
      tripStyle: "Self-drive, adventure, waterfalls, glaciers, geothermal spa",
      travelers: "2-4 Adults",
      estimatedCost: "Activity-dependent, excluding flights",
      aiScore: "4.9",
    },
    days,
    footer: {
      backgroundImage: footerImage,
      title: "Your journey, but smarter.",
      subtitle:
        "This Iceland draft is ready for your final image uploads and item-level affiliate links before publishing.",
      ctaText: "Book Now",
      ctaHref: "/api/affiliate/redirect",
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
    location: "Reykjavik, Golden Circle, Selfoss, Vik, Skaftafell, Jokulsarlon, Blue Lagoon",
    days: content.days.length,
    image_url: baseImage,
    created_at: timestamp,
    subtitle:
      "A detailed self-drive Iceland route with waterfalls, glacier hikes, ice caves, lagoon stops, hotels, provider-backed tours, and road timing.",
    country: "Iceland",
    city: "Reykjavik, Selfoss, Vik, Skaftafell, Jokulsarlon",
    destination: "Iceland",
    style: "Self-Drive Adventure, Nature, Glacier, Geothermal",
    daysCount: content.days.length,
    heroImage: baseImage,
    coverImage: footerImage,
    summary:
      "A Fire and Ice Road adventure from Reykjavik through Golden Circle, South Coast waterfalls, Vik, Skaftafell, Jokulsarlon, and Blue Lagoon, ready for final images and item-level affiliate links.",
    seoTitle: PLAN_TITLE,
    seoDescription:
      "Draft ready plan for Iceland Fire and Ice Road with detailed timed items, driving legs, hotel logistics, tours, costs, and booking placeholders.",
    tags: ["Iceland", "Reykjavik", "Golden Circle", "South Coast", "Vik", "Skaftafell", "Jokulsarlon", "Blue Lagoon"],
    season: "June-August / winter-adjustable",
    showOnHome: false,
    priceFrom: 2800,
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
        daysInserted: dayRows.length,
        itemsInserted: itemRows.length,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("INSERT_ICELAND_READY_PLAN_FAILED");
  console.error(error);
  process.exit(1);
});
