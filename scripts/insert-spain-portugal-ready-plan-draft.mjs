import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import crypto from "node:crypto";

const SOURCE_ENV_PATH = new URL("../.env", import.meta.url);
const SLUG = "spain-portugal-gaudi-royal-iberia-atlantic-rivers";
const PLAN_TITLE = "Spain & Portugal: Gaudi, Royal Iberia & Atlantic Rivers";
const baseImage = "/bg/home-hero-bottom-optimized.jpg";

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
    showButton: true,
    status: "Draft",
    badge: extra.badge || type,
    price: extra.price || "Live price",
    people: extra.people || "2 People",
    deeplink: "",
    ...extra,
  };
}

function suggestion(id, title, category, matchReason, extra = {}) {
  return {
    id,
    title,
    category,
    imageUrl: baseImage,
    matchReason,
    matchScore: extra.matchScore || "AI Route Fit",
    price: extra.price || "Live price",
    duration: extra.duration || "Flexible",
    ctaText: "Book Now",
  };
}

function buildSummary(items, estimatedCost = "Live pricing") {
  const count = (types) => items.filter((entry) => types.includes(entry.type)).length;
  return {
    activitiesCount: String(count(["activity", "event"])),
    restaurantsCount: String(count(["restaurant"])),
    transfersCount: String(count(["transportation", "transfer", "flight"])),
    estimatedCost,
    upgrades: [],
    viewDetailsText: "View Details",
    editPlanText: "Edit Plan",
  };
}

function day({ dayNumber, title, destinationLabel, countryLabel, routeFrom, routeTo, weatherLabel, quote, description, items, suggestions, notes }) {
  return {
    id: `day-${dayNumber}`,
    dayNumber,
    title,
    destinationLabel,
    countryLabel,
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
      quote,
      musicLabel: "Cinematic Story",
      musicUrl: "",
    },
    summary: buildSummary(items),
    notes,
  };
}

function buildContent() {
  const days = [
    day({
      dayNumber: 1,
      title: "Barcelona - Gaudi's Impossible City",
      destinationLabel: "Barcelona",
      countryLabel: "Spain",
      routeFrom: "Barcelona El Prat BCN",
      routeTo: "H10 Madison, Sagrada Familia, Park Guell",
      weatherLabel: "Architecture / Arrival day",
      quote: "The first chapter opens with Gaudi's impossible city, but only after the arrival is protected.",
      description:
        "Target arrival before 11:00 into BCN, store luggage at H10 Madison Barcelona, rest, then use a late-afternoon Sagrada Familia and Park Guell guided experience if the flight timing allows.",
      items: [
        item("d1-arrival", "flight", "10:00", "Home airport to Barcelona BCN", "Target an arrival before roughly 11:00. If the real flight lands later, Gene should move the main attraction to the next available slot.", { badge: "Arrival Flight" }),
        item("d1-transfer", "transportation", "10:00", "BCN airport to central Barcelona", "Airport to central Barcelona transfer block, with luggage and orientation buffer.", { badge: "Airport Transfer" }),
        item("d1-hotel", "hotel", "12:00", "H10 Madison Barcelona luggage and rest", "Nights 1-2 in central Barcelona. Standard check-in is around 15:00, so luggage storage protects the day.", { badge: "Hotel" }),
        item("d1-lunch", "restaurant", "12:00", "Luggage and lunch", "Lunch before the main attraction so the traveler is not pushed directly from airport to tour.", { badge: "Lunch" }),
        item("d1-main", "activity", "15:30", "Sagrada Familia and Park Guell guided experience", "Provider-backed Gaudi combination, approximately 4.5 hours, covering skip-the-line access, Gaudi architecture, Park Guell mosaics and panoramic Barcelona.", { badge: "Viator / Klook", duration: "4.5 Hours" }),
      ],
      suggestions: [
        suggestion("d1-s1", "Recinte Modernista de Sant Pau", "Architecture", "Hidden Gem and photography suggestion near the Gaudi route.", { duration: "60-90 min" }),
        suggestion("d1-s2", "El Born backstreets", "Local Barcelona", "Cafe streets and old lanes that remain suggestions, not extra scheduled trips.", { duration: "Flexible" }),
        suggestion("d1-s3", "Jardins de Mossen Costa i Llobera", "Garden", "Lower-crowd garden and viewpoint idea if arrival energy is strong.", { duration: "45-60 min" }),
      ],
      notes: [
        { id: "d1-n1", icon: "plane", title: "Arrival rule", text: "Do not force a major tour if the real flight lands late." },
        { id: "d1-n2", icon: "hotel", title: "Check-in", text: "H10 Madison check-in is treated as around 15:00." },
        { id: "d1-n3", icon: "sparkles", title: "Suggestions", text: "Extra Barcelona ideas stay in AI Suggestions." },
      ],
    }),
    day({
      dayNumber: 2,
      title: "Montserrat - Above the Clouds of Catalonia",
      destinationLabel: "Montserrat",
      countryLabel: "Spain",
      routeFrom: "Barcelona",
      routeTo: "Montserrat monastery and viewpoints",
      weatherLabel: "Nature + culture",
      quote: "The city gives way to mountain air, monastery stone and Catalonia above the clouds.",
      description:
        "Keep Montserrat as one main Gene trip object even if it contains rail, cable-car or vehicle components. Return to Barcelona for rest and dinner with no second booked attraction.",
      items: [
        item("d2-breakfast", "restaurant", "07:00", "Breakfast", "Breakfast before the mountain day.", { badge: "Breakfast" }),
        item("d2-transfer", "transportation", "08:00", "Barcelona to Montserrat", "Travel from Barcelona to the Montserrat mountain area using the best live routing.", { badge: "Mountain Transfer" }),
        item("d2-main", "activity", "08:00", "Montserrat Mountain Escape", "Montserrat monastery, panoramic viewpoints, walking time and mountain atmosphere in one main Gene trip card.", { badge: "Main Trip", duration: "8 Hours" }),
        item("d2-rest", "hotel", "17:00", "Rest after Montserrat", "Protect recovery after the mountain day.", { badge: "Recovery" }),
        item("d2-dinner", "restaurant", "19:30", "Barcelona dinner", "Dinner only, no second booked attraction.", { badge: "Dinner" }),
      ],
      suggestions: [
        suggestion("d2-s1", "Sant Miquel viewpoint", "Scenic", "Hiking and photography suggestion if the traveler has the energy.", { duration: "45 min" }),
        suggestion("d2-s2", "Colonia Guell", "Gaudi Hidden Gem", "Lower-crowd architecture alternative.", { duration: "2 Hours" }),
        suggestion("d2-s3", "Gracia neighbourhood", "Local Evening", "Recommend only if there is enough energy after Montserrat.", { duration: "Dinner block" }),
      ],
      notes: [
        { id: "d2-n1", icon: "mountain", title: "Main trip", text: "Keep rail/cable components inside one trip object." },
        { id: "d2-n2", icon: "clock", title: "Recovery", text: "No second booked attraction after Montserrat." },
        { id: "d2-n3", icon: "sparkles", title: "AI", text: "Gracia appears only if energy is still high." },
      ],
    }),
    day({
      dayNumber: 3,
      title: "Barcelona to Madrid - From Gaudi to Royal Spain",
      destinationLabel: "Madrid",
      countryLabel: "Spain",
      routeFrom: "Barcelona Sants",
      routeTo: "Madrid Puerta de Atocha, Royal Palace, Prado",
      weatherLabel: "Culture / Royal Spain",
      quote: "High-speed rail carries the route from Gaudi's curves to royal Madrid.",
      description:
        "Use AVE/high-speed rail from Barcelona to Madrid, leave luggage at Catalonia Las Cortes, then schedule a Royal Palace and Prado Museum combination in the afternoon.",
      items: [
        item("d3-checkout", "hotel", "07:30", "Breakfast and Barcelona checkout", "Breakfast, checkout and movement toward Barcelona Sants.", { badge: "Checkout" }),
        item("d3-train", "transportation", "09:00", "Barcelona Sants to Madrid Atocha", "Use Renfe live AVE/high-speed timetable for the customer date.", { badge: "AVE Train" }),
        item("d3-hotel", "hotel", "12:00", "Catalonia Las Cortes luggage", "Nights 3-4. Official hotel info lists check-in from 15:00 and checkout until 12:00.", { badge: "Hotel" }),
        item("d3-lunch", "restaurant", "12:30", "Madrid lunch and buffer", "Lunch and orientation before the museum/palace block.", { badge: "Lunch" }),
        item("d3-main", "activity", "14:30", "Royal Palace and Prado Museum", "Provider-backed combination covering both in approximately five hours.", { badge: "Viator", duration: "5 Hours" }),
      ],
      suggestions: [
        suggestion("d3-s1", "El Capricho Park", "Hidden Garden", "Architecture and relaxation alternative in Madrid.", { duration: "90 min" }),
        suggestion("d3-s2", "Madrid de los Austrias backstreets", "Historic", "Photography and old Madrid lanes.", { duration: "60 min" }),
        suggestion("d3-s3", "Temple of Debod viewpoint", "Sunset", "Show only if the main tour finishes early enough.", { duration: "45 min" }),
      ],
      notes: [
        { id: "d3-n1", icon: "train", title: "Rail", text: "Train numbers and times must come from live Renfe data." },
        { id: "d3-n2", icon: "ticket", title: "Main tour", text: "Royal Palace + Prado is a long afternoon block." },
        { id: "d3-n3", icon: "sun", title: "Sunset", text: "Temple of Debod depends on finish time." },
      ],
    }),
    day({
      dayNumber: 4,
      title: "Toledo - Spain's City of Three Cultures",
      destinationLabel: "Toledo",
      countryLabel: "Spain",
      routeFrom: "Madrid",
      routeTo: "Toledo historic center, cathedral area, medieval streets",
      weatherLabel: "Medieval city",
      quote: "Toledo compresses centuries into stone lanes, high viewpoints and quiet bridges.",
      description:
        "A full-day Toledo experience from Madrid, with historic center, cathedral area, medieval streets, panoramic viewpoint and return to Madrid.",
      items: [
        item("d4-breakfast", "restaurant", "07:00", "Breakfast", "Breakfast before the full-day Toledo route.", { badge: "Breakfast" }),
        item("d4-transfer", "transportation", "08:30", "Madrid to Toledo", "Main trip transfer from Madrid to Toledo by provider vehicle or rail/tour structure.", { badge: "Transfer" }),
        item("d4-main", "activity", "08:30", "Full-Day Toledo Experience", "Historic center, cathedral area, medieval streets, panoramic viewpoint and route-compatible discoveries.", { badge: "Main Trip", duration: "8-9 Hours" }),
        item("d4-lunch", "restaurant", "13:00", "Toledo lunch", "Lunch during the Toledo route, set by the selected provider or custom flow.", { badge: "Lunch" }),
        item("d4-return", "transportation", "17:30", "Return to Madrid", "Return to Madrid after the full-day medieval city experience.", { badge: "Return" }),
      ],
      suggestions: [
        suggestion("d4-s1", "Mirador del Valle", "Gene Hidden Gem", "Toledo from above: panoramic, historic, low time cost and route-compatible.", { duration: "30-45 min", matchScore: "94%" }),
        suggestion("d4-s2", "Jewish Quarter side streets", "Culture", "Quiet streets and layered history.", { duration: "45 min" }),
        suggestion("d4-s3", "Puente de San Martin", "Historic Bridge", "Photography stop with medieval atmosphere.", { duration: "30 min" }),
      ],
      notes: [
        { id: "d4-n1", icon: "clock", title: "Full day", text: "Treat Toledo as 8-9 hours." },
        { id: "d4-n2", icon: "camera", title: "Viewpoint", text: "Mirador del Valle should be a strong hidden-gem card." },
        { id: "d4-n3", icon: "shoe", title: "Walking", text: "Medieval streets mean uneven walking." },
      ],
    }),
    day({
      dayNumber: 5,
      title: "Madrid to Seville - Into Andalusia",
      destinationLabel: "Seville",
      countryLabel: "Spain",
      routeFrom: "Madrid",
      routeTo: "Sevilla Santa Justa, Hotel Fernando III, Alcazar, Cathedral, Giralda",
      weatherLabel: "Andalusia",
      quote: "The route enters Andalusia through palace gardens, cathedral stone and orange-tree lanes.",
      description:
        "Use direct high-speed Madrid-Seville rail early enough for a practical afternoon Seville monument visit. Stay at Hotel Fernando III in Santa Cruz.",
      items: [
        item("d5-checkout", "hotel", "07:00", "Breakfast and Madrid checkout", "Breakfast, checkout and rail buffer.", { badge: "Checkout" }),
        item("d5-train", "transportation", "08:30", "Madrid to Sevilla Santa Justa", "Use Renfe direct high-speed services and live departure data.", { badge: "AVE Train" }),
        item("d5-hotel", "hotel", "12:00", "Hotel Fernando III luggage", "Night 5 in Seville's Santa Cruz historic quarter. Leave luggage before check-in.", { badge: "Hotel" }),
        item("d5-lunch", "restaurant", "12:30", "Seville lunch", "Lunch and a short rest before monument access.", { badge: "Lunch" }),
        item("d5-main", "activity", "14:30", "Royal Alcazar + Cathedral + Giralda", "Guided combination, around 3-3.5 hours, covering Seville's three major monuments.", { badge: "Viator / Klook", duration: "3.5 Hours" }),
        item("d5-evening", "activity", "18:30", "Santa Cruz slow lanes", "Callejon del Agua, Plaza del Cabildo possibility, tiny plazas and local texture.", { badge: "Hidden Seville" }),
      ],
      suggestions: [
        suggestion("d5-s1", "Plaza del Cabildo", "Hidden Square", "Architecture and lower-crowd Seville detail.", { duration: "20 min" }),
        suggestion("d5-s2", "Callejon del Agua", "Santa Cruz", "Photography and historic atmosphere.", { duration: "30 min" }),
        suggestion("d5-s3", "Palacio de las Duenas", "Palace", "Garden and palace alternative.", { duration: "90 min" }),
        suggestion("d5-s4", "Triana", "Local District", "Culture and local evening option.", { duration: "Evening" }),
      ],
      notes: [
        { id: "d5-n1", icon: "train", title: "Direct rail", text: "Use live Renfe high-speed route information." },
        { id: "d5-n2", icon: "hotel", title: "Check-in", text: "Hotel Fernando III check-in is treated as around 16:00." },
        { id: "d5-n3", icon: "ticket", title: "Monuments", text: "Main tour is 3-3.5 hours." },
      ],
    }),
    day({
      dayNumber: 6,
      title: "Seville to Lisbon - Crossing Iberia Toward the Atlantic",
      destinationLabel: "Lisbon",
      countryLabel: "Portugal",
      routeFrom: "Seville SVQ",
      routeTo: "Lisbon LIS, Lisboa Pessoa Hotel, Tagus River",
      weatherLabel: "Flight + sunset cruise",
      quote: "Iberia opens westward toward the Atlantic and the first river cruise.",
      description:
        "Fly Seville to Lisbon rather than forcing a poor rail connection. Check into Lisboa Pessoa Hotel, then make the main trip a relaxed Lisbon sunset river cruise.",
      items: [
        item("d6-checkout", "hotel", "07:00", "Breakfast and Seville checkout", "Breakfast, checkout and airport transfer.", { badge: "Checkout" }),
        item("d6-flight", "flight", "Morning", "Seville SVQ to Lisbon LIS", "Use a morning direct TAP or best live option selected by price, luggage, departure time and total travel time.", { badge: "Direct Flight" }),
        item("d6-hotel", "hotel", "13:00", "Lisboa Pessoa Hotel luggage or check-in", "Nights 6-7. Current official hotel information lists check-in from 15:00 and checkout by 12:00.", { badge: "Hotel" }),
        item("d6-lunch", "restaurant", "13:00", "Lisbon lunch and rest", "Lunch and recovery after the flight.", { badge: "Lunch" }),
        item("d6-main", "activity", "18:00", "Lisbon Sunset River Cruise", "Season-dependent sunset route along the Tagus past the 25 de Abril Bridge, Belem area and Cristo Rei.", { badge: "Cruise", duration: "1.5-2 Hours" }),
      ],
      suggestions: [
        suggestion("d6-s1", "Miradouro da Senhora do Monte", "Panorama", "Sunset and Lisbon viewpoint idea.", { duration: "45 min" }),
        suggestion("d6-s2", "Jardim do Torel", "Hidden Garden", "Quiet view and recovery-oriented suggestion.", { duration: "45 min" }),
        suggestion("d6-s3", "Mouraria lanes", "Local Lisbon", "Historic local Lisbon route.", { duration: "60 min" }),
      ],
      notes: [
        { id: "d6-n1", icon: "plane", title: "Flight", text: "Fly this leg instead of forcing poor rail." },
        { id: "d6-n2", icon: "boat", title: "Cruise", text: "First of three water/cruise experiences." },
        { id: "d6-n3", icon: "clock", title: "Airport", text: "Keep at least 1.5 hours airport buffer for Schengen flight." },
      ],
    }),
    day({
      dayNumber: 7,
      title: "Sintra + Atlantic Coast - Palaces at the Edge of Europe",
      destinationLabel: "Sintra and Cascais",
      countryLabel: "Portugal",
      routeFrom: "Lisbon",
      routeTo: "Pena Palace, Sintra, Cabo da Roca, Cascais",
      weatherLabel: "Palace + coast",
      quote: "Palaces meet the Atlantic at the western edge of Europe.",
      description:
        "A full-day Sintra, Pena Palace, Cabo da Roca and Cascais route, adding the first Atlantic coastal experience to the plan.",
      items: [
        item("d7-breakfast", "restaurant", "07:00", "Breakfast", "Breakfast before the Sintra day.", { badge: "Breakfast" }),
        item("d7-transfer", "transportation", "08:00", "Lisbon to Sintra", "Start the full-day small-group route from Lisbon.", { badge: "Transfer" }),
        item("d7-main", "activity", "08:00", "Sintra + Pena Palace + Cabo da Roca + Cascais", "Full-day provider-backed route, commonly 8-9 hours, combining palace, village and coast.", { badge: "Main Trip", duration: "8-9 Hours" }),
        item("d7-lunch", "restaurant", "13:00", "Sintra or coast lunch", "Lunch timing depends on provider configuration.", { badge: "Lunch" }),
        item("d7-return", "transportation", "17:00", "Return to Lisbon", "Return after Cascais and Atlantic coast route.", { badge: "Return" }),
      ],
      suggestions: [
        suggestion("d7-s1", "Azenhas do Mar", "Hidden Coast", "Dramatic Portuguese village built into cliffs above the Atlantic. Strong Gene AI card.", { duration: "+45 min", matchScore: "94%" }),
        suggestion("d7-s2", "Praia da Ursa viewpoint", "Wild Coast", "Recommend only safe marked viewpoints for teen-safe itinerary.", { duration: "Flexible" }),
        suggestion("d7-s3", "Monserrate Palace", "Hidden Palace", "Garden and architecture alternative.", { duration: "90 min" }),
        suggestion("d7-s4", "Colares", "Village", "Local Portugal village option.", { duration: "Flexible" }),
      ],
      notes: [
        { id: "d7-n1", icon: "waves", title: "Atlantic", text: "This gives the plan its first Atlantic coastal experience." },
        { id: "d7-n2", icon: "shield", title: "Safety", text: "Use marked viewpoints only for wild coast suggestions." },
        { id: "d7-n3", icon: "sparkles", title: "AI", text: "Azenhas do Mar should be one of the strongest hidden-gem cards." },
      ],
    }),
    day({
      dayNumber: 8,
      title: "Lisbon to Porto - Following Portugal North",
      destinationLabel: "Porto",
      countryLabel: "Portugal",
      routeFrom: "Lisbon",
      routeTo: "PortoBay Flores, Ribeira, Douro city cruise, Gaia",
      weatherLabel: "Riverside + cruise",
      quote: "Portugal flows north by rail, then the Douro carries the evening.",
      description:
        "Use Alfa Pendular Lisbon to Porto, leave luggage at PortoBay Flores, then combine Sao Bento, historic streets, Ribeira, Dom Luis I Bridge, Douro city cruise and Gaia waterfront in one Gene trip card.",
      items: [
        item("d8-checkout", "hotel", "07:30", "Breakfast and Lisbon checkout", "Breakfast, checkout and station movement.", { badge: "Checkout" }),
        item("d8-train", "transportation", "08:30", "Lisbon to Porto Alfa Pendular", "Use CP Alfa Pendular live timetable. The train includes useful comfort facilities such as Wi-Fi, luggage storage and seat reservation.", { badge: "Alfa Pendular" }),
        item("d8-hotel", "hotel", "12:00", "PortoBay Flores luggage", "Nights 8-9 in Porto historic center on Rua das Flores. Check-in around 15:00.", { badge: "Hotel" }),
        item("d8-lunch", "restaurant", "12:30", "Porto lunch", "Lunch and rest before the riverside route.", { badge: "Lunch" }),
        item("d8-main", "activity", "15:00", "Porto Riverside and Douro Cruise Experience", "Sao Bento, historic streets, Ribeira, Dom Luis I Bridge area, Douro city cruise and Gaia waterfront as one Gene trip card.", { badge: "Cruise", duration: "3.5 Hours" }),
      ],
      suggestions: [
        suggestion("d8-s1", "Miradouro da Vitoria", "Viewpoint", "Old Porto view suggestion.", { duration: "30 min" }),
        suggestion("d8-s2", "Largo da Pena Ventosa", "Hidden Square", "Photography and old Porto texture.", { duration: "30 min" }),
        suggestion("d8-s3", "Jardim do Morro", "Sunset", "River view and sunset option.", { duration: "45 min" }),
        suggestion("d8-s4", "Virtudes Gardens", "Local", "Lower-crowd sunset alternative.", { duration: "45 min" }),
      ],
      notes: [
        { id: "d8-n1", icon: "train", title: "Rail", text: "Use CP Alfa Pendular live timetable." },
        { id: "d8-n2", icon: "boat", title: "Cruise", text: "Second water/cruise experience." },
        { id: "d8-n3", icon: "map", title: "One card", text: "Walking and cruise stay as one Gene trip card." },
      ],
    }),
    day({
      dayNumber: 9,
      title: "Douro Valley - The River Through the Mountains",
      destinationLabel: "Douro Valley",
      countryLabel: "Portugal",
      routeFrom: "Porto",
      routeTo: "Douro Valley, Pinhao, river cruise, villages",
      weatherLabel: "Scenic river",
      quote: "The Douro becomes the hero: mountains, river, villages and heritage.",
      description:
        "A full-day Douro Valley scenic day with river cruise. For under-18 users, focus on landscape, villages, food and heritage, excluding age-restricted tasting components.",
      items: [
        item("d9-breakfast", "restaurant", "07:00", "Breakfast", "Breakfast before the Douro Valley excursion.", { badge: "Breakfast" }),
        item("d9-transfer", "transportation", "08:00", "Porto to Douro Valley", "Provider-backed route into the Douro Valley.", { badge: "Transfer" }),
        item("d9-main", "activity", "08:00", "Douro Valley Scenic Day + River Cruise", "Scenic viewpoints, Pinhao, Douro River cruise, traditional villages or estates and return to Porto.", { badge: "Hero Cruise", duration: "10 Hours" }),
        item("d9-lunch", "restaurant", "13:00", "Douro lunch", "Food and heritage-focused lunch, with age-restricted tasting components excluded for under-18 itineraries.", { badge: "Lunch" }),
        item("d9-return", "transportation", "18:00", "Return to Porto", "Return after the river and mountain valley chapter.", { badge: "Return" }),
      ],
      suggestions: [
        suggestion("d9-s1", "Provesende", "Hidden Village", "Douro historic village suggestion.", { duration: "Flexible" }),
        suggestion("d9-s2", "Sao Leonardo de Galafura", "Panoramic", "Mountain and river viewpoint.", { duration: "30 min" }),
        suggestion("d9-s3", "Pinhao railway station", "Heritage", "Azulejos, photography and heritage.", { duration: "20 min" }),
        suggestion("d9-s4", "Ucanha", "Historic Village", "Stone bridge and hidden village idea.", { duration: "Flexible" }),
      ],
      notes: [
        { id: "d9-n1", icon: "boat", title: "Cruise", text: "Third water/cruise experience." },
        { id: "d9-n2", icon: "shield", title: "Teen-safe", text: "Focus on landscape and heritage, not age-restricted tastings." },
        { id: "d9-n3", icon: "clock", title: "Full day", text: "Treat as a 10-hour hero item." },
      ],
    }),
    day({
      dayNumber: 10,
      title: "Porto - Where the River Meets the Atlantic",
      destinationLabel: "Porto and Foz do Douro",
      countryLabel: "Portugal",
      routeFrom: "PortoBay Flores",
      routeTo: "Foz do Douro, Atlantic promenade, OPO",
      weatherLabel: "Atlantic coast / Departure",
      quote: "The final day lets the river meet the sea before the flight home.",
      description:
        "Keep the final day visually different: hotel checkout, luggage storage, Foz do Douro Atlantic Coast Experience, lunch, luggage pickup and airport transfer. Ideally target a departure after 18:00.",
      items: [
        item("d10-checkout", "hotel", "09:00", "Hotel checkout and luggage storage", "Leave luggage at PortoBay Flores before the coast route.", { badge: "Checkout" }),
        item("d10-main", "activity", "09:30", "Foz do Douro Atlantic Coast Experience", "Historic riverside, Foz, Atlantic waterfront, coastal promenade, Pergola da Foz, Felgueiras Lighthouse area and return.", { badge: "Atlantic Coast", duration: "3.5 Hours" }),
        item("d10-lunch", "restaurant", "13:30", "Final Porto lunch", "Lunch after the coast route.", { badge: "Lunch" }),
        item("d10-luggage", "hotel", "14:30", "Collect luggage", "Return to hotel and collect bags.", { badge: "Luggage" }),
        item("d10-airport", "transportation", "15:00", "Transfer to Porto OPO", "Transfer to Porto airport. If flight is earlier, Gene removes the Foz trip automatically.", { badge: "Airport Transfer" }),
        item("d10-flight", "flight", "18:00+", "Porto OPO to home airport", "For the published plan, target a flight departing 18:00 or later.", { badge: "Departure Flight" }),
      ],
      suggestions: [
        suggestion("d10-s1", "Senhor da Pedra coastal area", "Coast", "Architecture, coast and photography suggestion.", { duration: "Flexible" }),
        suggestion("d10-s2", "Afurada", "Fishing Village", "Local Porto fishing-village card.", { duration: "60 min" }),
        suggestion("d10-s3", "Passeio Alegre Gardens", "Garden", "Coast and relaxation near Foz.", { duration: "45 min" }),
      ],
      notes: [
        { id: "d10-n1", icon: "waves", title: "Atlantic", text: "Final day should feel different from another city tour." },
        { id: "d10-n2", icon: "plane", title: "Departure", text: "Target OPO departure after 18:00." },
        { id: "d10-n3", icon: "sparkles", title: "Auto-adjust", text: "If the chosen flight is earlier, remove Foz automatically." },
      ],
    }),
  ];

  return {
    publicHtml: "",
    hero: {
      backgroundImage: baseImage,
      title: "Your Cinematic Ready Plan",
      subtitle:
        "From Gaudi's Barcelona to royal Madrid, medieval Toledo, Andalusian Seville, Lisbon sunsets and Porto's Douro river story.",
      stats: [
        { label: "Days", value: "10" },
        { label: "Countries", value: "2" },
        { label: "Cities", value: "5" },
        { label: "Travelers", value: "2" },
        { label: "Travel Style", value: "Culture + Cruise" },
      ],
      primaryCtaText: "Plan Smarter With AI",
      primaryCtaHref: "/ai-planner",
      secondaryCtaText: "View Full Timeline",
    },
    journeyOverview: {
      title: "Journey Overview",
      startPoint: "Barcelona BCN",
      destinations: "Barcelona, Madrid, Toledo, Seville, Lisbon, Sintra, Porto, Douro Valley",
      tripStyle: "Architecture, royal culture, medieval cities, Andalusia, Atlantic coast, river cruises",
      travelers: "2 Adults",
      estimatedCost: "Live pricing",
      aiScore: "4.9",
    },
    days,
    footer: {
      backgroundImage: baseImage,
      title: "Your journey, but smarter.",
      subtitle: "Let AI keep rail, flights, cruises and hidden gems balanced around real dates.",
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
    location: "Barcelona, Madrid, Toledo, Seville, Lisbon, Sintra, Porto, Douro Valley",
    days: content.days.length,
    image_url: baseImage,
    created_at: timestamp,
    subtitle:
      "10 days across Spain and Portugal with Gaudi icons, royal Madrid, Toledo, Andalusia, Lisbon sunsets, Porto and Douro river cruises.",
    country: "Spain, Portugal",
    city: "Barcelona, Madrid, Seville, Lisbon, Porto",
    destination: "Spain and Portugal",
    style: "Architecture, Culture, Cruise, Coast, Hidden Gems",
    daysCount: content.days.length,
    heroImage: baseImage,
    coverImage: baseImage,
    summary:
      "A 10-day open-jaw Spain and Portugal route from Barcelona to Porto, using high-speed rail, one Iberian flight, Lisbon sunset cruise, Porto Douro city cruise, Douro Valley river cruise and Atlantic coast finale.",
    seoTitle: PLAN_TITLE,
    seoDescription:
      "Draft ready plan for Spain and Portugal with Barcelona, Montserrat, Madrid, Toledo, Seville, Lisbon, Sintra, Porto, Douro Valley and Foz do Douro.",
    tags: ["Spain", "Portugal", "Barcelona", "Madrid", "Seville", "Lisbon", "Porto", "Cruise", "Douro"],
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
  console.error("INSERT_SPAIN_PORTUGAL_READY_PLAN_FAILED");
  console.error(error);
  process.exit(1);
});
