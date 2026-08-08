import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import crypto from "node:crypto";

const SOURCE_ENV_PATH = new URL("../.env", import.meta.url);
const SLUG = "italy-eternal-streets-alpine-skies";
const PLAN_TITLE = "Italy: Eternal Streets & Alpine Skies";

const ASSET_ROOT = "/images/Italy Eternal Streets Alpine Skies";
const images = {
  hero: `${ASSET_ROOT}/italy-eternal-streets-alpine-skies-hero.jpg`,
  rome: `${ASSET_ROOT}/rome-hidden-garden.jpg`,
  tuscany: `${ASSET_ROOT}/tuscany-cypress-road.jpg`,
  bologna: `${ASSET_ROOT}/bologna-portico-food.jpg`,
  dolomites: `${ASSET_ROOT}/dolomites-seceda.jpg`,
  venice: `${ASSET_ROOT}/venice-lagoon-sunset.jpg`,
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

function suggestion(id, title, category, imageUrl, matchReason, extra = {}) {
  return {
    id,
    title,
    category,
    imageUrl,
    matchReason,
    matchScore: extra.matchScore || "Highly Recommended",
    price: extra.price || "Live price",
    duration: extra.duration || "Flexible",
    ctaText: "Book Now",
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
  countryLabel = "Italy",
  imageUrl,
  routeFrom,
  routeTo,
  weatherLabel,
  quote,
  description,
  items,
  notes,
  suggestions,
  storyQuote,
  estimatedCost,
}) {
  return {
    id: `day-${dayNumber}`,
    dayNumber,
    title,
    destinationLabel,
    countryLabel,
    previewImage: imageUrl,
    heroImage: imageUrl,
    dateLabel: `Day ${dayNumber}`,
    routeFrom,
    routeTo,
    weatherLabel,
    quote,
    description,
    timelineItems: items,
    suggestions,
    story: {
      imageUrl,
      quote: storyQuote || quote,
      musicLabel: "Cinematic Story",
      musicUrl: "",
    },
    summary: buildSummary(items, estimatedCost),
    notes,
  };
}

function buildContent() {
  const days = [
    day({
      dayNumber: 1,
      title: "Rome - First Light of the Eternal City",
      destinationLabel: "Rome",
      imageUrl: images.rome,
      routeFrom: "Rome Fiumicino FCO",
      routeTo: "Hotel Artemide, Trevi, Pantheon, Aventine, Trastevere",
      weatherLabel: "Mild / Golden Rome",
      quote: "Start with iconic Rome, then slip into the quieter Aventine light.",
      description:
        "Arrive through Fiumicino in the protected morning window, settle near Via Nazionale, walk Trevi, Pantheon and Piazza Navona, then close the day at the Orange Garden and Aventine Keyhole before dinner in Trastevere.",
      estimatedCost: "Live pricing",
      items: [
        item("d1-fco", "flight", "10:30", "Rome Fiumicino arrival window", "Target FCO arrival between 08:00 and 11:30; acceptable before 13:00; avoid arrivals after 16:00 so the first day is not lost.", { imageUrl: images.rome, badge: "Flight Rule" }),
        item("d1-transfer", "transportation", "11:25", "FCO to central Rome transfer", "Private airport transfer toward Hotel Artemide. Recalculate the exact duration against live traffic before booking.", { imageUrl: images.rome, badge: "Transfer" }),
        item("d1-hotel", "hotel", "12:30", "Hotel Artemide luggage and check-in buffer", "Three-night Rome stay at Hotel Artemide, Via Nazionale 22. Leave luggage if the room is not ready; do not promise noon check-in.", { imageUrl: images.rome, badge: "Hotel" }),
        item("d1-lunch", "restaurant", "12:30", "Lunch near Via Nazionale or Monti", "A full hour for lunch close to the hotel before sightseeing begins, protecting energy after the flight.", { imageUrl: images.rome, badge: "Lunch" }),
        item("d1-walk", "activity", "15:00", "Gene Hidden Rome Walk", "Walk from the hotel to Trevi Fountain, Pantheon, Piazza Navona, coffee buffer, Orange Garden, Aventine Keyhole and Trastevere.", { imageUrl: images.rome, badge: "Hidden Rome", duration: "7 Hours" }),
        item("d1-dinner", "restaurant", "19:45", "Trastevere dinner and evening lanes", "Dinner in Trastevere followed by a short atmospheric walk before returning to the hotel around 22:00.", { imageUrl: images.rome, badge: "Dinner" }),
      ],
      suggestions: [
        suggestion("d1-s1", "Aventine sunset photo stop", "Hidden Rome", images.rome, "Adds a quiet panoramic finale after the first iconic Rome walk.", { duration: "45 min" }),
      ],
      notes: [
        { id: "d1-n1", icon: "sun", title: "Arrival rule", text: "Ideal landing is 08:00-11:30; avoid late arrivals." },
        { id: "d1-n2", icon: "clock", title: "Recovery", text: "Keep a real rest block before the afternoon walk." },
        { id: "d1-n3", icon: "shoe", title: "Walking", text: "Expect roughly 6-8 km today." },
      ],
    }),
    day({
      dayNumber: 2,
      title: "Ancient Rome + Secret Rome",
      destinationLabel: "Rome",
      imageUrl: images.rome,
      routeFrom: "Hotel Artemide",
      routeTo: "Colosseum, Forum, Palatine, Monti, San Clemente, Aventine",
      weatherLabel: "Ancient stone / City light",
      quote: "Empire first, then the quieter layers under Rome's postcard surface.",
      description:
        "Start early for Colosseum, Roman Forum and Palatine Hill, rest properly after the archaeological walk, then explore Monti, San Clemente surroundings, Circus Maximus and the Aventine before an evening Spanish Steps walk.",
      estimatedCost: "Live pricing",
      items: [
        item("d2-breakfast", "restaurant", "07:15", "Early breakfast", "Breakfast before the Ancient Rome tour, with enough buffer for transport and operator check-in.", { imageUrl: images.rome, badge: "Breakfast" }),
        item("d2-transfer", "transportation", "08:00", "Transfer toward Colosseum", "Short transfer with safety buffer because operators usually require early arrival.", { imageUrl: images.rome, badge: "Transfer" }),
        item("d2-colosseum", "activity", "09:00", "Colosseum, Roman Forum and Palatine Hill", "Provider-backed guided Ancient Rome visit. Gene should compare Viator and Klook for live availability, exact departure and affiliate value.", { imageUrl: images.rome, badge: "Viator / Klook", duration: "2.5-3 Hours" }),
        item("d2-lunch", "restaurant", "12:00", "Lunch in Monti", "Recovery lunch after the archaeological walking block. Do not stack another museum immediately after the tour.", { imageUrl: images.rome, badge: "Lunch" }),
        item("d2-secret", "activity", "14:30", "Hidden layers of Rome", "Explore Monti, Basilica di San Clemente area, Circus Maximus and Aventine surroundings without overloading the day with tickets.", { imageUrl: images.rome, badge: "Secret Rome" }),
        item("d2-evening", "activity", "19:00", "Spanish Steps and Via dei Condotti", "Gentle evening walk before dinner and return to the hotel.", { imageUrl: images.rome, badge: "Evening Walk" }),
      ],
      suggestions: [
        suggestion("d2-s1", "San Clemente underground layer", "Culture", images.rome, "A deeper historical stop that fits the Secret Rome chapter if time and availability allow.", { duration: "60 min" }),
      ],
      notes: [
        { id: "d2-n1", icon: "clock", title: "Buffer", text: "Guests should arrive around 20 minutes before tour time." },
        { id: "d2-n2", icon: "shoe", title: "Walking", text: "Estimated 9-12 km today." },
        { id: "d2-n3", icon: "moon", title: "Evening", text: "Keep dinner relaxed after a heavy morning tour." },
      ],
    }),
    day({
      dayNumber: 3,
      title: "Vatican + Trastevere",
      destinationLabel: "Rome",
      imageUrl: images.rome,
      routeFrom: "Hotel Artemide",
      routeTo: "Vatican, St Peter's, Castel Sant'Angelo, Trastevere",
      weatherLabel: "Museum morning / Roman night",
      quote: "Masterpieces by morning, soft Trastevere lanes by night.",
      description:
        "Use a morning Vatican time slot, allow St Peter's access dynamically, lunch in Prati, cross Castel Sant'Angelo and Ponte Sant'Angelo, then finish with dinner and nightlife around Trastevere.",
      estimatedCost: "Live pricing",
      items: [
        item("d3-vatican-transfer", "transportation", "07:40", "Transfer toward Vatican", "Metro or taxi toward the Vatican with check-in buffer before the morning museum slot.", { imageUrl: images.rome, badge: "Transfer" }),
        item("d3-vatican", "activity", "08:30", "Vatican Museums and Sistine Chapel", "Morning Viator/Klook guided visit preferred because congestion generally increases later.", { imageUrl: images.rome, badge: "Vatican", duration: "3 Hours" }),
        item("d3-stpeter", "activity", "11:50", "St Peter's Square and Basilica buffer", "Visit depends on security queues and access on the day; Gene should keep this dynamic.", { imageUrl: images.rome, badge: "Flexible" }),
        item("d3-lunch", "restaurant", "12:45", "Lunch in Prati", "Lunch away from the busiest Vatican flow with space for a slow reset.", { imageUrl: images.rome, badge: "Lunch" }),
        item("d3-castel", "activity", "15:30", "Castel Sant'Angelo riverside walk", "Exterior and riverside exploration, then cross Ponte Sant'Angelo toward Campo de' Fiori.", { imageUrl: images.rome, badge: "Riverside" }),
        item("d3-trastevere", "restaurant", "19:00", "Trastevere Night", "Dinner, Piazza Santa Maria and narrow lanes before returning around 22:15-22:30.", { imageUrl: images.rome, badge: "Nightlife" }),
      ],
      suggestions: [
        suggestion("d3-s1", "Ponte Sant'Angelo golden-hour pause", "Photo Moment", images.rome, "A soft transition between Vatican grandeur and Trastevere nightlife.", { duration: "30 min" }),
      ],
      notes: [
        { id: "d3-n1", icon: "ticket", title: "Vatican", text: "Use morning slots whenever possible." },
        { id: "d3-n2", icon: "clock", title: "Queues", text: "St Peter's access must remain dynamic." },
        { id: "d3-n3", icon: "shoe", title: "Walking", text: "Expect roughly 8-11 km." },
      ],
    }),
    day({
      dayNumber: 4,
      title: "Rome to Florence",
      destinationLabel: "Florence",
      imageUrl: images.tuscany,
      routeFrom: "Roma Termini",
      routeTo: "Florence SMN, Hotel Calimala, Uffizi, Ponte Vecchio",
      weatherLabel: "Renaissance light",
      quote: "From empire to Renaissance, then up to sunset over Florence.",
      description:
        "Transfer to Florence by high-speed train, leave luggage at Hotel Calimala, tour the Uffizi, rest, then walk Ponte Vecchio, Oltrarno and Piazzale Michelangelo at sunset.",
      estimatedCost: "Live pricing",
      items: [
        item("d4-train", "transportation", "09:15", "High-speed train Rome to Florence", "Target Roma Termini to Firenze Santa Maria Novella around 08:45-09:45; journey reference is about 1 hour 25 minutes.", { imageUrl: images.tuscany, badge: "Train" }),
        item("d4-hotel", "hotel", "11:20", "Hotel Calimala luggage drop", "Three-night Florence stay at Hotel Calimala, Via Lamberti 5. Standard check-in starts at 15:00.", { imageUrl: images.tuscany, badge: "Hotel" }),
        item("d4-lunch", "restaurant", "11:30", "Historic-center lunch", "Lunch before the first Renaissance museum block.", { imageUrl: images.tuscany, badge: "Lunch" }),
        item("d4-uffizi", "activity", "13:30", "Uffizi Gallery guided visit", "Klook skip-the-line guided option currently fits 1.5-2.25 hour sessions; exact slot must be live-checked.", { imageUrl: images.tuscany, badge: "Klook", duration: "2 Hours" }),
        item("d4-checkin", "hotel", "16:30", "Check-in and rest", "Recovery block before the sunset walk.", { imageUrl: images.tuscany, badge: "Rest" }),
        item("d4-sunset", "activity", "17:30", "Ponte Vecchio to Piazzale Michelangelo", "Walk through Oltrarno and climb toward Piazzale Michelangelo for the flagship Florence sunset.", { imageUrl: images.tuscany, badge: "Sunset" }),
      ],
      suggestions: [
        suggestion("d4-s1", "Oltrarno artisan aperitivo stop", "Local Texture", images.tuscany, "Adds a softer Florence moment after the museum day.", { duration: "45 min" }),
      ],
      notes: [
        { id: "d4-n1", icon: "train", title: "Rail", text: "Do not hard-code train time until dates are known." },
        { id: "d4-n2", icon: "hotel", title: "Check-in", text: "Hotel Calimala standard check-in starts at 15:00." },
        { id: "d4-n3", icon: "sun", title: "Sunset", text: "Piazzale Michelangelo is a signature Gene moment." },
      ],
    }),
    day({
      dayNumber: 5,
      title: "Gene's Secret Tuscany",
      destinationLabel: "Val d'Orcia",
      imageUrl: images.tuscany,
      routeFrom: "Florence",
      routeTo: "Montalcino, Vitaleta, Pienza, Montepulciano",
      weatherLabel: "Cypress roads / Hill towns",
      quote: "The Cypress Road turns Tuscany into a chapter, not a checklist.",
      description:
        "A private driver day from Florence through Montalcino, Cappella della Madonna di Vitaleta, Pienza and Montepulciano, with deliberate lunch pacing and no rushed evening tour.",
      estimatedCost: "Live pricing",
      items: [
        item("d5-pickup", "transportation", "07:30", "Private driver pickup from Florence", "Florence to Montalcino is roughly 115-120 km and about 2 hours in planning time.", { imageUrl: images.tuscany, badge: "Private Driver" }),
        item("d5-montalcino", "activity", "09:30", "Montalcino stone lanes and viewpoints", "Old-town walk, landscape viewpoints and optional food or wine culture without making tasting mandatory.", { imageUrl: images.tuscany, badge: "Hill Town" }),
        item("d5-vitaleta", "activity", "11:30", "Cappella della Madonna di Vitaleta", "A tiny chapel among the Tuscan hills and one of the visual anchors of the itinerary.", { imageUrl: images.tuscany, badge: "Hidden Gem" }),
        item("d5-pienza", "restaurant", "12:20", "Pienza exploration and lunch", "Village exploration plus lunch, intentionally longer than the rushed one-hour tour style.", { imageUrl: images.tuscany, badge: "Pienza" }),
        item("d5-montepulciano", "activity", "14:40", "Montepulciano old town", "Old-town streets, viewpoints and underground-cellar architecture if available.", { imageUrl: images.tuscany, badge: "Montepulciano" }),
        item("d5-return", "transportation", "16:40", "Return to Florence", "Return drive toward Florence and recovery before dinner near the hotel.", { imageUrl: images.tuscany, badge: "Return" }),
      ],
      suggestions: [
        suggestion("d5-s1", "Vitaleta golden photo buffer", "Photo Moment", images.tuscany, "Preserves time for the hidden-gem visual anchor without rushing lunch.", { duration: "30 min" }),
      ],
      notes: [
        { id: "d5-n1", icon: "car", title: "Driver day", text: "Expect around eleven hours outside." },
        { id: "d5-n2", icon: "utensils", title: "Lunch", text: "Pienza lunch should not be rushed." },
        { id: "d5-n3", icon: "moon", title: "Evening", text: "No evening tour after the countryside day." },
      ],
    }),
    day({
      dayNumber: 6,
      title: "Florence Beyond the Postcard",
      destinationLabel: "Florence",
      imageUrl: images.tuscany,
      routeFrom: "Hotel Calimala",
      routeTo: "Accademia, Duomo exterior, Mercato, Oltrarno",
      weatherLabel: "Artisan Florence",
      quote: "David, artisan lanes and a slower Tuscan evening.",
      description:
        "Visit Accademia early, keep Duomo exterior and Mercato gentle, protect a hotel rest block, then explore Santo Spirito and Oltrarno artisan lanes before dinner.",
      estimatedCost: "Live pricing",
      items: [
        item("d6-accademia", "activity", "08:30", "Accademia Gallery early visit", "Early skip-the-line Accademia option around 1.5 hours; Gene can bundle Uffizi/Accademia differently if live inventory is better.", { imageUrl: images.tuscany, badge: "Viator" }),
        item("d6-coffee", "restaurant", "10:00", "Coffee reset", "Short coffee pause before the Duomo exterior and market lane walk.", { imageUrl: images.tuscany, badge: "Coffee" }),
        item("d6-duomo", "activity", "10:20", "Duomo exterior and historic lanes", "Piazza del Duomo exterior, Mercato surroundings and old Florence lanes.", { imageUrl: images.tuscany, badge: "Florence" }),
        item("d6-lunch", "restaurant", "12:30", "Florentine lunch", "Lunch before the protected afternoon rest block.", { imageUrl: images.tuscany, badge: "Lunch" }),
        item("d6-rest", "hotel", "13:45", "Hotel rest", "Prevents Florence from becoming another eight-hour walking marathon.", { imageUrl: images.tuscany, badge: "Rest" }),
        item("d6-oltrarno", "activity", "15:30", "Oltrarno Artisan Route", "Santo Spirito, artisan workshops, quiet lanes, local piazzas and riverside golden hour.", { imageUrl: images.tuscany, badge: "Artisan" }),
      ],
      suggestions: [
        suggestion("d6-s1", "Santo Spirito workshop peek", "Artisan", images.tuscany, "A flexible add-on that keeps the day local rather than ticket-heavy.", { duration: "45 min" }),
      ],
      notes: [
        { id: "d6-n1", icon: "ticket", title: "Accademia", text: "Use early skip-the-line inventory if available." },
        { id: "d6-n2", icon: "clock", title: "Pacing", text: "Hotel rest is part of the plan, not a gap." },
        { id: "d6-n3", icon: "sun", title: "Evening", text: "End with riverside golden hour and dinner." },
      ],
    }),
    day({
      dayNumber: 7,
      title: "Florence to Bologna",
      destinationLabel: "Bologna",
      imageUrl: images.bologna,
      routeFrom: "Firenze SMN",
      routeTo: "Bologna Centrale, Piazza Maggiore, porticoes",
      weatherLabel: "Food capital glow",
      quote: "Italy's table earns its own chapter.",
      description:
        "Take the short high-speed train to Bologna, leave luggage at Art Hotel Commercianti, join a small-group food experience, then explore the medieval core and portico lanes at a gentle pace.",
      estimatedCost: "Live pricing",
      items: [
        item("d7-train", "transportation", "08:30", "High-speed train Florence to Bologna", "Target around 08:30-09:07. Italo reference time is about 37 minutes.", { imageUrl: images.bologna, badge: "Train" }),
        item("d7-hotel", "hotel", "09:45", "Art Hotel Commercianti luggage drop", "One-night stay beside Basilica di San Petronio. Check-in is from 14:00.", { imageUrl: images.bologna, badge: "Hotel" }),
        item("d7-food", "activity", "10:45", "Bologna Secret Food Tour", "Klook currently lists secret food tour departure options including 09:45, 10:30 and 10:45, small group up to 12.", { imageUrl: images.bologna, badge: "Klook", duration: "3+ Hours" }),
        item("d7-checkin", "hotel", "14:00", "Check-in and rest", "Recover after the food walk before the medieval core route.", { imageUrl: images.bologna, badge: "Rest" }),
        item("d7-core", "activity", "15:45", "Bologna Medieval Core", "Piazza Maggiore, Archiginnasio area, Quadrilatero, Two Towers exterior and hidden portico lanes.", { imageUrl: images.bologna, badge: "Medieval Core" }),
        item("d7-portico", "activity", "17:30", "Portico Journey", "Choose walking, bus or taxi combination toward San Luca side according to traveler fitness and mobility.", { imageUrl: images.bologna, badge: "Portico" }),
      ],
      suggestions: [
        suggestion("d7-s1", "Quadrilatero tasting stop", "Food", images.bologna, "Adds a sensory Bologna detail if the food tour ends early.", { duration: "30 min" }),
      ],
      notes: [
        { id: "d7-n1", icon: "train", title: "Short rail", text: "Florence to Bologna is roughly 37 minutes by high-speed train." },
        { id: "d7-n2", icon: "utensils", title: "Food", text: "Keep the food tour as the day's main experience." },
        { id: "d7-n3", icon: "route", title: "Portico", text: "Adapt San Luca movement to mobility setting." },
      ],
    }),
    day({
      dayNumber: 8,
      title: "Bologna to the Dolomites",
      destinationLabel: "Ortisei",
      imageUrl: images.dolomites,
      routeFrom: "Bologna Centrale",
      routeTo: "Bolzano, Ortisei, Hotel Angelo Engel",
      weatherLabel: "Alpine arrival",
      quote: "From medieval streets to alpine silence.",
      description:
        "Travel Bologna to Bolzano by rail, pause for lunch, transfer privately to Ortisei, check into Hotel Angelo Engel, rest and take an easy village exploration before an early night.",
      estimatedCost: "Live pricing",
      items: [
        item("d8-train", "transportation", "09:00", "Train Bologna to Bolzano", "Italo reference: 259 km rail route, around 2 hours 32 minutes. Exact schedule must be date-matched.", { imageUrl: images.dolomites, badge: "Train" }),
        item("d8-lunch", "restaurant", "12:00", "Bolzano station lunch buffer", "Lunch near Bolzano station or packed lunch before the mountain transfer.", { imageUrl: images.dolomites, badge: "Lunch" }),
        item("d8-transfer", "transportation", "12:45", "Bolzano to Ortisei private transfer", "Roughly 35-40 km by road. Plan 50-65 minutes due to mountain-road traffic.", { imageUrl: images.dolomites, badge: "Private Transfer" }),
        item("d8-hotel", "hotel", "15:00", "Hotel Angelo Engel check-in", "Three-night Ortisei stay. Booking lists central location near the Alpe di Siusi lift area.", { imageUrl: images.dolomites, badge: "Hotel" }),
        item("d8-spa", "hotel", "15:15", "Rest, spa and recovery", "Important recovery after multi-leg travel before the mountain days.", { imageUrl: images.dolomites, badge: "Recovery" }),
        item("d8-village", "activity", "17:15", "Ortisei village exploration", "Short village walk, dinner and early sleep to protect Seceda day.", { imageUrl: images.dolomites, badge: "Village" }),
      ],
      suggestions: [
        suggestion("d8-s1", "Ortisei golden-hour village loop", "Alpine Village", images.dolomites, "A light first Dolomites moment without adding fatigue.", { duration: "60 min" }),
      ],
      notes: [
        { id: "d8-n1", icon: "train", title: "Schedule", text: "Bolzano rail timing must be date-matched." },
        { id: "d8-n2", icon: "car", title: "Road", text: "Budget 50-65 minutes from Bolzano to Ortisei." },
        { id: "d8-n3", icon: "moon", title: "Sleep", text: "Early night protects the mountain day." },
      ],
    }),
    day({
      dayNumber: 9,
      title: "Seceda Alpine Skyline Day",
      destinationLabel: "Seceda",
      imageUrl: images.dolomites,
      routeFrom: "Ortisei",
      routeTo: "Furnes, Seceda ridgeline, Ortisei",
      weatherLabel: "Lift season / Mountain air",
      quote: "Above the clouds, the plan slows down enough to feel the altitude.",
      description:
        "Use the Ortisei-Furnes-Seceda lift if operating, orient at the upper mountain area, walk an easy/moderate ridgeline route, lunch on the mountain, then return for spa recovery.",
      estimatedCost: "Live pricing",
      items: [
        item("d9-liftwalk", "transportation", "08:00", "Walk to Seceda lift", "Leave hotel early for queue and ticket buffer before the 08:30 target ascent.", { imageUrl: images.dolomites, badge: "Lift" }),
        item("d9-ascent", "transportation", "08:30", "Ortisei to Furnes to Seceda ascent", "Seasonal lift status must be checked for the exact date. 2026 summer reference window begins 22 May.", { imageUrl: images.dolomites, badge: "Cable Car" }),
        item("d9-ridge", "activity", "09:10", "Seceda Ridgeline Experience", "Easy/moderate scenic route adapted to weather, mobility, snow, lift status and fitness. Target 4-6 km, not an extreme trek.", { imageUrl: images.dolomites, badge: "Hike", duration: "2.5 Hours" }),
        item("d9-lunch", "restaurant", "11:30", "Mountain lunch", "Hut lunch with a generous scenic pause.", { imageUrl: images.dolomites, badge: "Mountain Hut" }),
        item("d9-loop", "activity", "12:45", "Second scenic loop and viewpoints", "Flexible second walking section plus rest/photo period before descent.", { imageUrl: images.dolomites, badge: "Viewpoints" }),
        item("d9-spa", "hotel", "15:45", "Hotel recovery and spa", "Do not send travelers straight to another attraction after Seceda.", { imageUrl: images.dolomites, badge: "Recovery" }),
      ],
      suggestions: [
        suggestion("d9-s1", "Seceda sunrise viewpoint upgrade", "Mountain", images.dolomites, "A premium early-light option if lift timing and weather allow.", { duration: "Flexible" }),
      ],
      notes: [
        { id: "d9-n1", icon: "cloud", title: "Weather", text: "Trail must adapt to weather and lift status." },
        { id: "d9-n2", icon: "shoe", title: "Distance", text: "Target 4-6 km scenic hiking." },
        { id: "d9-n3", icon: "spa", title: "Recovery", text: "Spa time is part of the experience." },
      ],
    }),
    day({
      dayNumber: 10,
      title: "Alpe di Siusi Meadows",
      destinationLabel: "Alpe di Siusi",
      imageUrl: images.dolomites,
      routeFrom: "Ortisei",
      routeTo: "Alpe di Siusi meadow walks, mountain hut, Ortisei",
      weatherLabel: "Meadows / Easy alpine day",
      quote: "Meadows beneath the Dolomites, with enough space to breathe.",
      description:
        "Take the Ortisei-Alpe di Siusi lift if operating, walk a scenic 5-7 km alpine meadow route, have a mountain hut lunch, then return early for pool, spa and a golden-hour village walk.",
      estimatedCost: "Live pricing",
      items: [
        item("d10-lift", "transportation", "08:15", "Ortisei-Alpe di Siusi lift buffer", "Ticket and seasonal lift check before ascent.", { imageUrl: images.dolomites, badge: "Lift" }),
        item("d10-walk1", "activity", "09:00", "Scenic alpine walk", "Target 5-7 km, avoiding technical hiking routes for a general-purpose ready plan.", { imageUrl: images.dolomites, badge: "Alpine Walk" }),
        item("d10-lunch", "restaurant", "11:30", "Mountain hut lunch", "Slow lunch in the meadow setting.", { imageUrl: images.dolomites, badge: "Mountain Hut" }),
        item("d10-walk2", "activity", "12:45", "Second walking section", "Short flexible meadow section plus photo/rest period.", { imageUrl: images.dolomites, badge: "Meadow" }),
        item("d10-return", "transportation", "15:00", "Return toward Ortisei", "Return to Ortisei and hotel by around 16:00.", { imageUrl: images.dolomites, badge: "Return" }),
        item("d10-recovery", "hotel", "16:00", "Pool, spa and free recovery time", "The day purposely ends early before dinner.", { imageUrl: images.dolomites, badge: "Recovery" }),
      ],
      suggestions: [
        suggestion("d10-s1", "Meadow picnic viewpoint", "Slow Travel", images.dolomites, "A flexible scenic pause that keeps the day relaxed.", { duration: "45 min" }),
      ],
      notes: [
        { id: "d10-n1", icon: "sun", title: "Lift", text: "Exact lift hours vary by date and lift." },
        { id: "d10-n2", icon: "shoe", title: "Walking", text: "Keep this to 5-7 km scenic movement." },
        { id: "d10-n3", icon: "clock", title: "Early end", text: "Return early for real recovery." },
      ],
    }),
    day({
      dayNumber: 11,
      title: "Dolomites to Venice",
      destinationLabel: "Venice",
      imageUrl: images.venice,
      routeFrom: "Ortisei",
      routeTo: "Bolzano, Verona, Venice Santa Lucia, San Marco",
      weatherLabel: "Mountain to lagoon",
      quote: "Mountains to water, silence to reflections.",
      description:
        "Check out from Ortisei, transfer to Bolzano, connect by train through Verona toward Venice Santa Lucia, then use water transport and walking logic to reach the San Marco hotel.",
      estimatedCost: "Live pricing",
      items: [
        item("d11-finalwalk", "activity", "09:00", "Optional Ortisei final walk", "Light final village walk before checkout preparation.", { imageUrl: images.dolomites, badge: "Village" }),
        item("d11-transfer", "transportation", "10:30", "Ortisei to Bolzano transfer", "Private mountain-road transfer, again budgeting roughly 50-65 minutes.", { imageUrl: images.dolomites, badge: "Private Transfer" }),
        item("d11-train", "transportation", "12:30", "Bolzano to Venice via Verona", "Exact connection must be date-matched. Target Venice Santa Lucia arrival around 15:00-16:30.", { imageUrl: images.venice, badge: "Train" }),
        item("d11-water", "transportation", "16:00", "Venice water transfer and hotel approach", "Do not calculate Venice transfers like car transfers; luggage, bridges and vaporetto stops affect timing.", { imageUrl: images.venice, badge: "Water Transfer" }),
        item("d11-hotel", "hotel", "17:00", "Hotel Saturnia & International check-in", "Three-night Venice stay in San Marco, close to the core of the lagoon chapter.", { imageUrl: images.venice, badge: "Hotel" }),
        item("d11-walk", "activity", "18:15", "Gene's First Venice Walk", "San Marco side streets, Accademia area, quiet canals and Dorsoduro before dinner.", { imageUrl: images.venice, badge: "Hidden Venice" }),
      ],
      suggestions: [
        suggestion("d11-s1", "Dorsoduro blue-hour canal pause", "Cinematic Walk", images.venice, "A quieter first Venice mood away from the most crowded San Marco route.", { duration: "45 min" }),
      ],
      notes: [
        { id: "d11-n1", icon: "train", title: "Connection", text: "Bolzano-Verona-Venice must be date-matched." },
        { id: "d11-n2", icon: "boat", title: "Venice", text: "Water transfer timing is not car-transfer timing." },
        { id: "d11-n3", icon: "moon", title: "Evening", text: "Avoid spending the whole first evening in Piazza San Marco." },
      ],
    }),
    day({
      dayNumber: 12,
      title: "Venice Icons + Hidden Venice",
      destinationLabel: "Venice",
      imageUrl: images.venice,
      routeFrom: "San Marco",
      routeTo: "Doge's Palace, St Mark's, Castello, Arsenale",
      weatherLabel: "Palaces / Quiet canals",
      quote: "Power and palaces first, then the canals that still feel private.",
      description:
        "Start early in Piazza San Marco before congestion, use a Doge's Palace or Doge's + St Mark's guided product if the time fits, rest, then walk through Castello, Arsenale surroundings and residential canals.",
      estimatedCost: "Live pricing",
      items: [
        item("d12-sanmark", "activity", "08:00", "Early Piazza San Marco walk", "Reach the square before the main day-trip congestion.", { imageUrl: images.venice, badge: "San Marco" }),
        item("d12-coffee", "restaurant", "09:15", "Slow coffee and exploration", "Open buffer before the guided palace slot.", { imageUrl: images.venice, badge: "Coffee" }),
        item("d12-doge", "activity", "11:45", "Doge's Palace guided visit", "Klook lists Doge's Palace skip-the-line guided timing; Viator combination with St Mark's may be stronger if the slot fits.", { imageUrl: images.venice, badge: "Klook / Viator" }),
        item("d12-lunch", "restaurant", "13:15", "Lunch away from San Marco", "Move away from the square for lunch and better pacing.", { imageUrl: images.venice, badge: "Lunch" }),
        item("d12-rest", "hotel", "14:30", "Hotel rest", "Reset before the Hidden Venice walking route.", { imageUrl: images.venice, badge: "Rest" }),
        item("d12-hidden", "activity", "15:45", "Hidden Venice Route", "Walk Castello, quiet residential canals, Arsenale surroundings and local squares over about 3-4 km.", { imageUrl: images.venice, badge: "Hidden Venice" }),
      ],
      suggestions: [
        suggestion("d12-s1", "Castello local square aperitivo", "Local Venice", images.venice, "A calmer add-on that supports the hidden Venice chapter.", { duration: "45 min" }),
      ],
      notes: [
        { id: "d12-n1", icon: "clock", title: "Early start", text: "San Marco is best before main congestion." },
        { id: "d12-n2", icon: "ticket", title: "Provider", text: "Choose Klook or Viator based on live slot and bundle value." },
        { id: "d12-n3", icon: "shoe", title: "Walking", text: "Hidden route is roughly 3-4 km." },
      ],
    }),
    day({
      dayNumber: 13,
      title: "The Venetian Lagoon",
      destinationLabel: "Murano and Burano",
      imageUrl: images.venice,
      routeFrom: "Venice",
      routeTo: "Murano, Burano, Torcello optional, Venice",
      weatherLabel: "Glass / Color / Lagoon",
      quote: "Glass, color and island silence instead of a rushed final checklist.",
      description:
        "Use Murano and Burano as the emotional lagoon finale. Choose Klook full-day boat tour or a smaller Viator lagoon boat experience when budget allows, then protect extra independent Burano time.",
      estimatedCost: "Live pricing",
      items: [
        item("d13-morning", "activity", "08:30", "Slow Venice morning", "Unhurried breakfast and departure prep before the island day.", { imageUrl: images.venice, badge: "Slow Morning" }),
        item("d13-checkin", "transportation", "09:30", "Lagoon tour meeting point", "Check-in for Murano and Burano provider-backed boat experience.", { imageUrl: images.venice, badge: "Boat" }),
        item("d13-islands", "activity", "10:00", "Murano and Burano island journey", "Klook full-day boat tour can run around 10:00-18:00; premium Viator smaller boat options may be 3-4 hours.", { imageUrl: images.venice, badge: "Klook / Viator" }),
        item("d13-burano", "activity", "14:30", "Independent Burano color time", "Protect extra slow time so the day does not become boat-photo-boat.", { imageUrl: images.venice, badge: "Burano" }),
        item("d13-return", "transportation", "18:00", "Return to Venice", "Return and hotel recovery before final dinner.", { imageUrl: images.venice, badge: "Return" }),
        item("d13-final", "restaurant", "19:15", "Final dinner and Grand Canal night walk", "Final dinner, then Grand Canal or San Marco night walk.", { imageUrl: images.venice, badge: "Final Night" }),
      ],
      suggestions: [
        suggestion("d13-s1", "Premium small-boat lagoon upgrade", "Upgrade", images.venice, "Best for travelers who want fewer crowds and stronger lagoon storytelling.", { duration: "3-4 Hours" }),
      ],
      notes: [
        { id: "d13-n1", icon: "boat", title: "Provider", text: "Use smaller boat when budget allows." },
        { id: "d13-n2", icon: "camera", title: "Burano", text: "Protect independent color time." },
        { id: "d13-n3", icon: "moon", title: "Final night", text: "End with canals, not another rushed monument." },
      ],
    }),
    day({
      dayNumber: 14,
      title: "Venice Departure",
      destinationLabel: "Venice",
      imageUrl: images.venice,
      routeFrom: "Hotel Saturnia & International",
      routeTo: "Venice Marco Polo VCE",
      weatherLabel: "Last Italian morning",
      quote: "One last morning before the lagoon becomes memory.",
      description:
        "Prefer a Venice Marco Polo departure at 15:00 or later, preserve a final morning walk and shopping buffer, then calculate airport transfer and airline-specific check-in dynamically.",
      estimatedCost: "Live pricing",
      items: [
        item("d14-breakfast", "restaurant", "08:00", "Final breakfast", "Slow final hotel breakfast before the last walk.", { imageUrl: images.venice, badge: "Breakfast" }),
        item("d14-walk", "activity", "08:45", "Final shopping and canal walk", "Short final walk or shopping near San Marco, adapted to flight time.", { imageUrl: images.venice, badge: "Final Walk" }),
        item("d14-pack", "hotel", "10:30", "Final packing and checkout", "Aim for checkout around 11:00, subject to hotel policy.", { imageUrl: images.venice, badge: "Checkout" }),
        item("d14-airport", "transportation", "TBD", "Transfer to Venice Marco Polo VCE", "Calculate hotel-to-airport movement plus airport security/passport buffer and airline check-in cutoff.", { imageUrl: images.venice, badge: "Airport Transfer" }),
        item("d14-flight", "flight", "15:00+", "Venice Marco Polo to home airport", "Preferred departure window is 15:00-21:00, preserving the morning and avoiding a return to Rome.", { imageUrl: images.venice, badge: "Open Jaw Flight" }),
      ],
      suggestions: [
        suggestion("d14-s1", "Private water taxi airport transfer", "Comfort Upgrade", images.venice, "A smoother departure option when luggage and bridge walking would be stressful.", { duration: "Live timing" }),
      ],
      notes: [
        { id: "d14-n1", icon: "plane", title: "Flight rule", text: "Prefer VCE departure at 15:00 or later." },
        { id: "d14-n2", icon: "clock", title: "Dynamic", text: "Airport timing must use airline and date-specific rules." },
        { id: "d14-n3", icon: "map", title: "Open jaw", text: "Return from Venice, not Rome." },
      ],
    }),
  ];

  return {
    publicHtml: "",
    hero: {
      backgroundImage: images.hero,
      title: "Your Cinematic Ready Plan",
      subtitle:
        "Walk ancient Rome, chase Renaissance light, disappear into Tuscany's cypress hills, taste Bologna, climb above the Dolomites and finish across Venice's quiet lagoon.",
      stats: [
        { label: "Days", value: "14" },
        { label: "Countries", value: "1" },
        { label: "Cities", value: "5+" },
        { label: "Travelers", value: "2" },
        { label: "Travel Style", value: "Luxury Adventure" },
      ],
      primaryCtaText: "Plan Smarter With AI",
      primaryCtaHref: "/ai-planner",
      secondaryCtaText: "View Full Timeline",
    },
    journeyOverview: {
      title: "Journey Overview",
      startPoint: "Rome Fiumicino FCO",
      destinations: "Rome, Florence, Tuscany, Bologna, Ortisei, Venice",
      tripStyle: "Luxury adventure, culture, food, alpine scenery, lagoon romance",
      travelers: "2 Adults",
      estimatedCost: "Live pricing",
      aiScore: "4.9",
    },
    days,
    footer: {
      backgroundImage: images.hero,
      title: "Your journey, but smarter.",
      subtitle: "Let AI handle the details while you focus on the memories.",
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
    location: "Rome, Florence, Tuscany, Bologna, Dolomites, Venice",
    days: content.days.length,
    image_url: images.hero,
    created_at: timestamp,
    subtitle:
      "14 days from Rome's ancient heart to Venice's secret lagoon, with Tuscany, Bologna and the Dolomites shaped into one cinematic Italy journey.",
    country: "Italy",
    city: "Rome, Florence, Bologna, Ortisei, Venice",
    destination: "Italy",
    style: "Luxury Adventure, Culture, Food, Alpine, Lagoon",
    daysCount: content.days.length,
    heroImage: images.hero,
    coverImage: images.hero,
    summary:
      "Walk through ancient Rome, chase Renaissance light across Florence, disappear into Tuscany's cypress hills, taste Bologna, climb above the clouds in the Dolomites and finish between Venice's quiet canals and colorful lagoon islands.",
    seoTitle: PLAN_TITLE,
    seoDescription:
      "Draft ready plan for Italy: Eternal Streets and Alpine Skies with timed days, hotels, transfers, provider-backed activities and day-level suggestions.",
    tags: ["Italy", "Rome", "Florence", "Tuscany", "Bologna", "Dolomites", "Venice", "Luxury Adventure"],
    season: "Late May through early October",
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
        imageAssets: Object.values(images),
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("INSERT_ITALY_READY_PLAN_FAILED");
  console.error(error);
  process.exit(1);
});
