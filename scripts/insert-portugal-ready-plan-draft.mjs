import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import crypto from "node:crypto";

const SOURCE_ENV_PATH = new URL("../.env", import.meta.url);
const SLUG = "portugal-atlantic-charm";
const PLAN_TITLE = "Portugal Atlantic Charm";
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
    countryLabel: "Portugal",
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
      title: "Lisbon City Sights",
      destinationLabel: "Lisbon",
      routeFrom: "Lisbon",
      routeTo: "Lisbon",
      weatherLabel: "24C / Atlantic city light",
      quote:
        "Lisbon opens the Atlantic route with tiled streets, viewpoints, Belem icons, and an easy Bairro Alto evening.",
      description:
        "A culture-rich first day in Lisbon with old-town tuk-tuk exploring, Belem highlights, coffee breaks, Chiado/Bairro Alto free time, and dinner in the historic center.",
      estimatedCost: "USD 180-260",
      items: [
        item(
          "d1-item-1",
          "restaurant",
          "07:30",
          "Breakfast and car rental preparation",
          "Breakfast at the Lisbon hotel, then finalize car rental details before the city route begins.",
          { price: "USD 25", people: "2 People", badge: "Breakfast" },
        ),
        item(
          "d1-item-2",
          "activity",
          "09:00",
          "Lisbon electric tuk-tuk tour",
          "A 1.5-hour electric tuk-tuk ride through Alfama, Mouraria, and Graca with miradouro viewpoints and a local ginjinha tasting.",
          { price: "USD 50-75", people: "2 People", badge: "Viator / Klook" },
        ),
        item(
          "d1-item-3",
          "activity",
          "10:30",
          "Sao Jorge Castle viewpoint walk",
          "Walk about 15 minutes to the Sao Jorge Castle viewpoint for a panoramic look over Lisbon before heading west.",
          { price: "Optional entry", people: "2 People", badge: "Viewpoint" },
        ),
        item(
          "d1-item-4",
          "transportation",
          "11:00",
          "Drive to Belem",
          "Drive roughly 10 km from central Lisbon to Belem, allowing about 20 minutes depending on city traffic.",
          { price: "Car rental", people: "2 People", badge: "Drive" },
        ),
        item(
          "d1-item-5",
          "restaurant",
          "12:00",
          "Lunch in Belem",
          "Lunch in Belem with a classic pasteis de nata stop folded into the afternoon sightseeing rhythm.",
          { price: "USD 30-45", people: "2 People", badge: "Lunch" },
        ),
        item(
          "d1-item-6",
          "activity",
          "13:00",
          "Jeronimos Monastery or Belem Tower",
          "Choose Jeronimos Monastery or Belem Tower for a 45-minute visit that anchors Lisbon's age-of-discovery story.",
          { price: "Entry varies", people: "2 People", badge: "Landmark" },
        ),
        item(
          "d1-item-7",
          "restaurant",
          "14:30",
          "Coffee break at Praca do Comercio",
          "Rest with coffee near Praca do Comercio before moving into a lighter afternoon block.",
          { price: "USD 15", people: "2 People", badge: "Cafe" },
        ),
        item(
          "d1-item-8",
          "activity",
          "15:00",
          "Chiado and Bairro Alto free time",
          "Wander Chiado and Bairro Alto shops, viewpoints, and side streets at a relaxed pace.",
          { price: "Free", people: "2 People", badge: "Free Time" },
        ),
        item(
          "d1-item-9",
          "hotel",
          "17:00",
          "Return to Hotel Mundial and rest",
          "Return to the hotel for rest before the evening dinner block. Hotel Mundial check-in is listed around 15:00 and checkout by 12:00.",
          { price: "USD 200-400/night", people: "2 People", badge: "Hotel" },
        ),
        item(
          "d1-item-10",
          "restaurant",
          "19:00",
          "Dinner in Bairro Alto",
          "Close the day with dinner in Bairro Alto, keeping the first evening atmospheric and easy.",
          { price: "USD 50-80", people: "2 People", badge: "Dinner" },
        ),
      ],
      notes: [
        {
          id: "d1-note-1",
          icon: "sun",
          title: "City pacing",
          text: "The route uses short city hops and built-in breaks so Lisbon feels cinematic rather than rushed.",
        },
        {
          id: "d1-note-2",
          icon: "car",
          title: "Driving note",
          text: "City traffic can change timing, so keep Belem and Chiado flexible.",
        },
      ],
    }),
    day({
      dayNumber: 2,
      title: "Sintra, Pena Palace and Coastline",
      destinationLabel: "Sintra and Cascais",
      routeFrom: "Lisbon",
      routeTo: "Sintra, Cabo da Roca, Cascais",
      weatherLabel: "22C / Cool hillside air",
      quote:
        "Sintra brings palace color and forest drama, then the coast turns the day toward cliffs, Cascais, and Atlantic air.",
      description:
        "A full Sintra and Cascais day with Pena Palace, Castle of the Moors, Cabo da Roca, Cascais waterfront, optional Estoril, and a return to Lisbon.",
      estimatedCost: "USD 160-260",
      items: [
        item(
          "d2-item-1",
          "transportation",
          "07:30",
          "Depart Lisbon for Sintra",
          "Check out if moving hotels, then drive about 30 km from Lisbon to Sintra in roughly 30 minutes.",
          { price: "Car rental", people: "2 People", badge: "Drive" },
        ),
        item(
          "d2-item-2",
          "activity",
          "08:00",
          "Pena National Palace and gardens",
          "A 2-hour visit through Pena Palace and gardens, one of Sintra's UNESCO World Heritage highlights with panoramic forest and castle architecture.",
          { price: "USD 50 group tour / EUR 14 entry", people: "2 People", badge: "Klook / Entry" },
        ),
        item(
          "d2-item-3",
          "transportation",
          "10:15",
          "Drive to Castle of the Moors",
          "Short 5 km transfer to the Castle of the Moors, allowing about 10 minutes.",
          { price: "Car rental", people: "2 People", badge: "Drive" },
        ),
        item(
          "d2-item-4",
          "activity",
          "10:20",
          "Castle of the Moors visit",
          "Explore the ruins and ridge views for about 40 minutes before continuing toward the Atlantic cliffs.",
          { price: "Entry varies", people: "2 People", badge: "Castle" },
        ),
        item(
          "d2-item-5",
          "transportation",
          "11:00",
          "Scenic drive to Cabo da Roca",
          "Drive about 18 km from Sintra to Cabo da Roca via the scenic coastal route in roughly 25 minutes.",
          { price: "Car rental", people: "2 People", badge: "Drive" },
        ),
        item(
          "d2-item-6",
          "activity",
          "11:30",
          "Cabo da Roca cliff stop",
          "Stand at Europe's westernmost point for a 30-minute cliff-view stop over the Atlantic.",
          { price: "Included in tour", people: "2 People", badge: "Coast" },
        ),
        item(
          "d2-item-7",
          "transportation",
          "12:00",
          "Drive to Cascais",
          "Drive about 20 km from Cabo da Roca to Cascais in approximately 25 minutes.",
          { price: "Car rental", people: "2 People", badge: "Drive" },
        ),
        item(
          "d2-item-8",
          "restaurant",
          "12:30",
          "Lunch in Cascais",
          "Lunch around the Cascais marina or town center before a light waterfront walk.",
          { price: "USD 45-70", people: "2 People", badge: "Lunch" },
        ),
        item(
          "d2-item-9",
          "activity",
          "13:30",
          "Cascais waterfront and Praia da Duquesa",
          "Stroll the Cascais waterfront and Praia da Duquesa for about 45 minutes.",
          { price: "Free", people: "2 People", badge: "Waterfront" },
        ),
        item(
          "d2-item-10",
          "activity",
          "14:15",
          "Optional Estoril Casino viewpoint",
          "Quick optional stop near Estoril Casino viewpoint before returning to Lisbon.",
          { price: "Free", people: "2 People", badge: "Optional" },
        ),
        item(
          "d2-item-11",
          "transportation",
          "14:30",
          "Drive Cascais to Lisbon",
          "Return along the A5 from Cascais to Lisbon, about 30 km and roughly 30 minutes.",
          { price: "Car rental", people: "2 People", badge: "Drive" },
        ),
        item(
          "d2-item-12",
          "hotel",
          "15:00",
          "Arrive Lisbon and rest",
          "Return to the Lisbon hotel for a free afternoon and rest after the palace-and-coast route.",
          { price: "Hotel booked separately", people: "2 People", badge: "Rest" },
        ),
      ],
      suggestions: [
        {
          id: "d2-suggestion-1",
          title: "Private Sintra-Cascais-Estoril guide",
          category: "Luxury",
          imageUrl: baseImage,
          matchReason: "Best upgrade if you want smoother timing and less parking friction around Sintra.",
          matchScore: "Highly Recommended",
          ctaText: "Book Now",
        },
      ],
      notes: [
        {
          id: "d2-note-1",
          icon: "map",
          title: "Traffic buffer",
          text: "Sintra roads can slow down in summer, so keep Cabo da Roca and Cascais timing flexible.",
        },
      ],
    }),
    day({
      dayNumber: 3,
      title: "Mafra Palace and Ericeira Surf Town",
      destinationLabel: "Mafra and Ericeira",
      routeFrom: "Lisbon",
      routeTo: "Mafra, Ericeira, Azenhas do Mar",
      weatherLabel: "23C / Ocean village breeze",
      quote:
        "Mafra gives the day grandeur, Ericeira gives it surf-town texture, and Azenhas do Mar adds the cliffside postcard.",
      description:
        "A coastal day north of Lisbon with Mafra Palace, Ericeira village and beach, Jose Franco folk village, and the Azenhas do Mar viewpoint.",
      estimatedCost: "USD 300-430",
      items: [
        item(
          "d3-item-1",
          "transportation",
          "08:00",
          "Depart Lisbon for Mafra",
          "Drive about 45 km from Lisbon to Mafra, allowing around 40 minutes.",
          { price: "Car rental", people: "2 People", badge: "Drive" },
        ),
        item(
          "d3-item-2",
          "activity",
          "08:40",
          "Palacio Nacional de Mafra",
          "Tour the monastery-palace complex for about 2 hours, the cultural anchor of the Mafra-Ericeira day.",
          { price: "Tour from USD 270 pp private", people: "2 People", badge: "Viator" },
        ),
        item(
          "d3-item-3",
          "transportation",
          "10:40",
          "Drive Mafra to Ericeira",
          "Transfer about 15 km from Mafra to Ericeira in roughly 20 minutes.",
          { price: "Car rental", people: "2 People", badge: "Drive" },
        ),
        item(
          "d3-item-4",
          "activity",
          "11:05",
          "Ericeira old town and Praia dos Pescadores",
          "Explore Ericeira's fishermen's village atmosphere, cafes, and beach for about 55 minutes.",
          { price: "Free", people: "2 People", badge: "Surf Town" },
        ),
        item(
          "d3-item-5",
          "restaurant",
          "12:00",
          "Fresh seafood lunch in Ericeira",
          "A short seafood lunch in Ericeira before heading to the folk village stop.",
          { price: "USD 40-60", people: "2 People", badge: "Lunch" },
        ),
        item(
          "d3-item-6",
          "transportation",
          "12:30",
          "Drive to Jose Franco Village",
          "Drive about 10 km from Ericeira to Museu Aldeia Tipica Jose Franco in around 15 minutes.",
          { price: "Car rental", people: "2 People", badge: "Drive" },
        ),
        item(
          "d3-item-7",
          "activity",
          "12:45",
          "Jose Franco folk village",
          "Spend about an hour exploring folk crafts and old-country atmosphere at Jose Franco village.",
          { price: "Low / optional", people: "2 People", badge: "Culture" },
        ),
        item(
          "d3-item-8",
          "transportation",
          "13:45",
          "Drive to Azenhas do Mar",
          "Short 7 km drive to Azenhas do Mar, allowing about 15 minutes.",
          { price: "Car rental", people: "2 People", badge: "Drive" },
        ),
        item(
          "d3-item-9",
          "activity",
          "14:00",
          "Azenhas do Mar viewpoint",
          "A 15-minute photo stop at the cliffside seaside hamlet of Azenhas do Mar.",
          { price: "Free", people: "2 People", badge: "Viewpoint" },
        ),
        item(
          "d3-item-10",
          "transportation",
          "14:15",
          "Return Ericeira to Lisbon",
          "Drive back toward Lisbon in about 45 minutes, arriving for rest and an open evening.",
          { price: "Car rental", people: "2 People", badge: "Drive" },
        ),
      ],
      notes: [
        {
          id: "d3-note-1",
          icon: "wave",
          title: "Tour source",
          text: "The document highlights private Ericeira-Mafra tours as the premium upgrade for this day.",
        },
      ],
    }),
    day({
      dayNumber: 4,
      title: "Nazare, Obidos and Peniche Surf",
      destinationLabel: "Nazare and Peniche",
      routeFrom: "Lisbon",
      routeTo: "Nazare, Obidos, Peniche",
      weatherLabel: "21C / Big-wave coast",
      quote:
        "This is the giant-wave chapter: Nazare cliffs, medieval Obidos streets, and a surf-town afternoon in Peniche.",
      description:
        "A long coastal day covering Nazare Praia do Norte viewpoint, O Sitio, Obidos medieval town, Baleal Beach in Peniche, and seafood lunch.",
      estimatedCost: "USD 140-230",
      items: [
        item(
          "d4-item-1",
          "transportation",
          "07:00",
          "Depart Lisbon for Nazare",
          "Early drive from Lisbon to Nazare, about 125 km and roughly 1 hour 30 minutes.",
          { price: "Car rental", people: "2 People", badge: "Drive" },
        ),
        item(
          "d4-item-2",
          "activity",
          "08:30",
          "Nazare Praia do Norte viewpoint",
          "Thirty minutes at the famous big-wave viewpoint overlooking the Atlantic power of Praia do Norte.",
          { price: "Free", people: "2 People", badge: "Viewpoint" },
        ),
        item(
          "d4-item-3",
          "activity",
          "09:00",
          "O Sitio upper Nazare overlook",
          "Short walk through upper Nazare for another panoramic cliff angle before continuing south.",
          { price: "Free", people: "2 People", badge: "Cliff" },
        ),
        item(
          "d4-item-4",
          "transportation",
          "09:30",
          "Drive Nazare to Obidos",
          "Drive about 15 km from Nazare to Obidos in roughly 15 minutes.",
          { price: "Car rental", people: "2 People", badge: "Drive" },
        ),
        item(
          "d4-item-5",
          "activity",
          "09:45",
          "Obidos medieval town walk",
          "Walk Obidos' cobblestone streets and castle walls for about 45 minutes.",
          { price: "Free", people: "2 People", badge: "Medieval" },
        ),
        item(
          "d4-item-6",
          "transportation",
          "10:30",
          "Drive Obidos to Peniche",
          "Continue about 32 km to Peniche via coastal roads in roughly 35 minutes.",
          { price: "Car rental", people: "2 People", badge: "Drive" },
        ),
        item(
          "d4-item-7",
          "activity",
          "11:15",
          "Baleal Beach free time or surf lesson",
          "Two hours at Baleal Beach for swimming, beach time, or an optional Peniche surf lesson.",
          { price: "Surf lesson about USD 50", people: "2 People", badge: "Surf" },
        ),
        item(
          "d4-item-8",
          "restaurant",
          "13:15",
          "Seafood lunch in Peniche",
          "One-hour seafood lunch in Peniche before the return drive to Lisbon.",
          { price: "USD 45-70", people: "2 People", badge: "Lunch" },
        ),
        item(
          "d4-item-9",
          "transportation",
          "14:15",
          "Drive Peniche to Lisbon",
          "Return from Peniche to Lisbon, about 100 km and roughly 1 hour 15 minutes.",
          { price: "Car rental", people: "2 People", badge: "Drive" },
        ),
        item(
          "d4-item-10",
          "hotel",
          "15:30",
          "Arrive Lisbon and rest",
          "Late afternoon rest or free time after the long surf-coast route.",
          { price: "Hotel booked separately", people: "2 People", badge: "Rest" },
        ),
      ],
      suggestions: [
        {
          id: "d4-suggestion-1",
          title: "Peniche surf lesson",
          category: "Adventure",
          imageUrl: baseImage,
          matchReason: "Adds the strongest active travel moment to the Nazare and Peniche day.",
          matchScore: "Recommended",
          ctaText: "Book Now",
        },
      ],
      notes: [
        {
          id: "d4-note-1",
          icon: "clock",
          title: "Early start",
          text: "This is one of the longest driving days, so the 07:00 departure keeps it comfortable.",
        },
      ],
    }),
    day({
      dayNumber: 5,
      title: "Drive to Lagos and Algarve Beaches",
      destinationLabel: "Lagos, Algarve",
      routeFrom: "Lisbon",
      routeTo: "Lagos",
      weatherLabel: "27C / Algarve sun",
      quote:
        "The itinerary turns south to the Algarve: marina water, golden cliffs, grottoes, and a seafood evening in Lagos.",
      description:
        "A major transfer day from Lisbon to Lagos with a Setubal coffee stop, Lagos lunch, kayaking or paddleboard, Ponta da Piedade boat trip, Praia Dona Ana, and Praia do Camilo.",
      estimatedCost: "USD 260-420",
      items: [
        item(
          "d5-item-1",
          "hotel",
          "06:30",
          "Lisbon checkout and early breakfast",
          "Check out of the Lisbon hotel and take an early breakfast before the Algarve transfer.",
          { price: "Included / varies", people: "2 People", badge: "Checkout" },
        ),
        item(
          "d5-item-2",
          "transportation",
          "07:00",
          "Drive Lisbon to Lagos",
          "Drive roughly 300 km from Lisbon to Lagos via the A2 motorway, allowing about 3 hours plus stops.",
          { price: "Car rental", people: "2 People", badge: "Drive" },
        ),
        item(
          "d5-item-3",
          "restaurant",
          "10:00",
          "Coffee stop near Setubal",
          "Short coffee break on the southbound route to keep the drive comfortable.",
          { price: "USD 10-15", people: "2 People", badge: "Break" },
        ),
        item(
          "d5-item-4",
          "restaurant",
          "12:30",
          "Arrive Lagos and lunch",
          "Arrive in Lagos, settle into town, and take a one-hour lunch before water activities.",
          { price: "USD 45-70", people: "2 People", badge: "Lunch" },
        ),
        item(
          "d5-item-5",
          "activity",
          "13:30",
          "Kayak or paddleboard from Lagos marina",
          "One-hour kayak or paddleboard session from Lagos marina.",
          { price: "USD 35-60", people: "2 People", badge: "Water" },
        ),
        item(
          "d5-item-6",
          "activity",
          "14:30",
          "Ponta da Piedade boat tour",
          "A 1 hour 15 minute boat trip to see the famous Ponta da Piedade grottoes and cliffs.",
          { price: "EUR 20 / about USD 22", people: "2 People", badge: "Viator" },
        ),
        item(
          "d5-item-7",
          "activity",
          "15:45",
          "Praia Dona Ana cliff overlook",
          "Thirty-minute stop at Praia Dona Ana for cliff and beach views.",
          { price: "Free", people: "2 People", badge: "Beach" },
        ),
        item(
          "d5-item-8",
          "activity",
          "16:15",
          "Praia do Camilo",
          "Forty-five minutes at Praia do Camilo before returning to Lagos.",
          { price: "Free", people: "2 People", badge: "Beach" },
        ),
        item(
          "d5-item-9",
          "hotel",
          "17:00",
          "Check in at Lagos Avenida Hotel",
          "Check in and rest at Lagos Avenida Hotel. The document lists check-in around 15:00 and checkout by 12:00.",
          { price: "USD 200-400/night", people: "2 People", badge: "Hotel" },
        ),
        item(
          "d5-item-10",
          "restaurant",
          "19:30",
          "Fresh seafood dinner in Lagos",
          "Relaxed seafood dinner after the Algarve water and beach afternoon.",
          { price: "USD 55-85", people: "2 People", badge: "Dinner" },
        ),
      ],
      notes: [
        {
          id: "d5-note-1",
          icon: "sun",
          title: "Beach timing",
          text: "The Algarve activities work best with sunscreen, water, and a flexible check-in window.",
        },
      ],
    }),
    day({
      dayNumber: 6,
      title: "Sagres and Return to Lisbon",
      destinationLabel: "Sagres and Lisbon",
      routeFrom: "Lagos",
      routeTo: "Sagres, Lisbon",
      weatherLabel: "24C / Cape wind",
      quote:
        "The journey closes at Portugal's wild southwestern edge before the long return north to Lisbon.",
      description:
        "A final Algarve morning at Cabo de Sao Vicente and Sagres Fortress, followed by the return drive to Lisbon, rental car drop-off, and a free final evening.",
      estimatedCost: "USD 120-220",
      items: [
        item(
          "d6-item-1",
          "transportation",
          "08:00",
          "Drive Lagos to Cabo de Sao Vicente",
          "Drive about 30 km from Lagos to Cabo de Sao Vicente, allowing around 30 minutes.",
          { price: "Car rental", people: "2 People", badge: "Drive" },
        ),
        item(
          "d6-item-2",
          "activity",
          "08:30",
          "Cabo de Sao Vicente lighthouse and cliffs",
          "Spend 45 minutes at Cape St. Vincent's lighthouse and cliffs, one of the trip's strongest Atlantic viewpoints.",
          { price: "Free / low entry", people: "2 People", badge: "Cape" },
        ),
        item(
          "d6-item-3",
          "activity",
          "09:15",
          "Fortaleza de Sagres",
          "Visit Sagres Fortress for about 45 minutes before starting the return toward Lisbon.",
          { price: "Entry varies", people: "2 People", badge: "Fortress" },
        ),
        item(
          "d6-item-4",
          "transportation",
          "10:00",
          "Drive Algarve toward Lisbon",
          "Begin the 300 km return drive from the Algarve to Lisbon, around 3 hours plus lunch stop.",
          { price: "Car rental", people: "2 People", badge: "Drive" },
        ),
        item(
          "d6-item-5",
          "restaurant",
          "12:30",
          "Lunch break in Albufeira or Setubal",
          "One-hour lunch break in Albufeira or Setubal depending on routing and energy.",
          { price: "USD 40-65", people: "2 People", badge: "Lunch" },
        ),
        item(
          "d6-item-6",
          "transportation",
          "13:30",
          "Continue to Lisbon",
          "Continue the return journey to Lisbon after lunch.",
          { price: "Car rental", people: "2 People", badge: "Drive" },
        ),
        item(
          "d6-item-7",
          "transportation",
          "17:30",
          "Arrive Lisbon and return rental car",
          "Arrive in Lisbon and return the rental car by around 17:30.",
          { price: "Rental return", people: "2 People", badge: "Car Return" },
        ),
        item(
          "d6-item-8",
          "activity",
          "18:00",
          "Final Lisbon evening",
          "Free evening for final shopping, dinner, or departure depending on flight timing.",
          { price: "Flexible", people: "2 People", badge: "Free Evening" },
        ),
      ],
      notes: [
        {
          id: "d6-note-1",
          icon: "car",
          title: "Return drive",
          text: "The final day is drive-heavy, so keep lunch and evening plans flexible.",
        },
        {
          id: "d6-note-2",
          icon: "spark",
          title: "Optional extension",
          text: "The source document supports relaxed, active, and luxury 5-7 day variants, so an extra rest night can be added before publishing if desired.",
        },
      ],
    }),
  ];

  return {
    hero: {
      backgroundImage: baseImage,
      title: "Your Cinematic Ready Plan",
      subtitle:
        "A detailed Atlantic Portugal route from Lisbon through Sintra, Cascais, Ericeira, Nazare, Peniche, Lagos, and Sagres.",
      stats: [
        { label: "Days", value: "6" },
        { label: "Countries", value: "1" },
        { label: "Cities", value: "8" },
        { label: "Travelers", value: "2" },
        { label: "Travel Style", value: "Atlantic Adventure" },
      ],
      primaryCtaText: "Book Now",
      primaryCtaHref: "/api/affiliate/redirect",
      secondaryCtaText: "Book Now",
    },
    journeyOverview: {
      title: "Journey Overview",
      startPoint: "Lisbon",
      destinations: "Lisbon, Sintra, Cascais, Ericeira, Nazare, Peniche, Lagos, Sagres",
      tripStyle: "Atlantic coast, culture, surf towns, cliffs, food",
      travelers: "2 Adults",
      estimatedCost: "USD 2,500-3,000",
      aiScore: "4.8",
    },
    days,
    footer: {
      backgroundImage: footerImage,
      title: "Your journey, but smarter.",
      subtitle:
        "This Portugal draft is ready for your final images and item-level affiliate links before publishing.",
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
    location: "Lisbon, Sintra, Cascais, Ericeira, Nazare, Peniche, Lagos, Sagres",
    days: content.days.length,
    image_url: baseImage,
    created_at: timestamp,
    subtitle:
      "A provider-backed Atlantic Portugal route with detailed timings, driving legs, hotels, tours, meals, beaches, and surf-town stops.",
    country: "Portugal",
    city: "Lisbon, Sintra, Cascais, Ericeira, Nazare, Peniche, Lagos, Sagres",
    destination: "Portugal",
    style: "Atlantic Adventure, Culture, Coast, Surf, Food",
    daysCount: content.days.length,
    heroImage: baseImage,
    coverImage: footerImage,
    summary:
      "A detailed Portugal Atlantic itinerary from Lisbon through Sintra, Cascais, Ericeira, Nazare, Peniche, Lagos, and Sagres, ready for final image uploads and per-item affiliate links.",
    seoTitle: PLAN_TITLE,
    seoDescription:
      "Draft ready plan for Portugal Atlantic Charm with detailed timed items, driving legs, activities, hotels, costs, and booking placeholders.",
    tags: ["Portugal", "Lisbon", "Sintra", "Cascais", "Ericeira", "Nazare", "Peniche", "Lagos", "Sagres"],
    season: "Spring / Summer",
    showOnHome: false,
    priceFrom: 2500,
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
  console.error("INSERT_PORTUGAL_READY_PLAN_FAILED");
  console.error(error);
  process.exit(1);
});
