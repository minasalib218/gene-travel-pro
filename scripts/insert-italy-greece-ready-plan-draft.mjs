import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import crypto from "node:crypto";

const SOURCE_ENV_PATH = new URL("../.env", import.meta.url);
const SLUG = "italy-greece-cliffs-volcanoes-mediterranean-blue";
const PLAN_TITLE = "Italy + Greece: Cliffs, Volcanoes & Mediterranean Blue";

const ASSET_ROOT = "/images/Italy Eternal Streets Alpine Skies";
const images = {
  hero: `${ASSET_ROOT}/italy-eternal-streets-alpine-skies-hero.jpg`,
  rome: `${ASSET_ROOT}/rome-hidden-garden.jpg`,
  coast: `${ASSET_ROOT}/venice-lagoon-sunset.jpg`,
  mountains: `${ASSET_ROOT}/dolomites-seceda.jpg`,
  mediterranean: `${ASSET_ROOT}/tuscany-cypress-road.jpg`,
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

function suggestion(id, title, category, matchReason, extra = {}) {
  return {
    id,
    title,
    category,
    imageUrl: extra.imageUrl || images.hero,
    matchReason,
    matchScore: extra.matchScore || "Excellent Route Fit",
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

function day({ dayNumber, title, destinationLabel, countryLabel, imageUrl, routeFrom, routeTo, weatherLabel, quote, description, items, suggestions, notes }) {
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
      title: "Rome - Empire at Golden Hour",
      destinationLabel: "Rome",
      countryLabel: "Italy",
      imageUrl: images.rome,
      routeFrom: "Rome Fiumicino FCO",
      routeTo: "NH Collection Roma Palazzo Cinquecento, Colosseum, Roman Forum, Palatine",
      weatherLabel: "Iconic Rome / Golden hour",
      quote: "Ancient Rome above ground, with the first evening wrapped in empire light.",
      description:
        "Begin with an open-jaw arrival into Rome FCO, transfer by Leonardo Express toward Termini, check into NH Collection Roma Palazzo Cinquecento, then keep Colosseum, Roman Forum and Palatine as one afternoon Gene booking item.",
      items: [
        item("d1-flight", "flight", "Morning", "Home airport to Rome FCO", "Use open-jaw flight search: Home to Rome FCO inbound, Santorini JTR or JTR-ATH-Home outbound.", { imageUrl: images.rome, badge: "Open Jaw Flight" }),
        item("d1-transfer", "transportation", "12:00", "FCO to Roma Termini", "Leonardo Express currently connects Fiumicino Airport and Roma Termini in about 32 minutes with frequent departures.", { imageUrl: images.rome, badge: "Airport Rail" }),
        item("d1-hotel", "hotel", "15:00", "NH Collection Roma Palazzo Cinquecento", "Nights 1-2 beside Roma Termini, useful for the Naples transfer on Day 3. Current check-in is listed at 15:00.", { imageUrl: images.rome, badge: "Hotel" }),
        item("d1-main", "activity", "15:30", "Colosseum + Roman Forum + Palatine", "One Gene booking item covering Colosseum, Roman Forum, Palatine area and evening Rome.", { imageUrl: images.rome, badge: "Iconic", duration: "3.5 Hours" }),
        item("d1-dinner", "restaurant", "19:30", "Rome dinner", "Easy dinner after the Ancient Rome block.", { imageUrl: images.rome, badge: "Dinner" }),
      ],
      suggestions: [
        suggestion("d1-s1", "Quartiere Coppedè", "Hidden Architecture", "Optional hidden architecture and photography card rather than another scheduled tour.", { imageUrl: images.rome }),
        suggestion("d1-s2", "Aventine Keyhole area", "Hidden View", "Historic hidden Rome view for travelers with extra evening energy.", { imageUrl: images.rome }),
        suggestion("d1-s3", "Orange Garden", "Sunset Panorama", "Soft Rome sunset option near the Aventine.", { imageUrl: images.rome }),
        suggestion("d1-s4", "Via Appia surroundings", "Ancient Alternative", "Ancient Rome alternative if the traveler wants a less standard route.", { imageUrl: images.rome }),
      ],
      notes: [
        { id: "d1-n1", icon: "plane", title: "Open jaw", text: "Do not force the customer to return to Italy after Santorini." },
        { id: "d1-n2", icon: "train", title: "FCO transfer", text: "Leonardo Express is the default Termini connection." },
        { id: "d1-n3", icon: "ticket", title: "One item", text: "Colosseum, Forum and Palatine stay as one Gene booking item." },
      ],
    }),
    day({
      dayNumber: 2,
      title: "Tivoli - Rome's Secret Palace Escape",
      destinationLabel: "Tivoli",
      countryLabel: "Italy",
      imageUrl: images.rome,
      routeFrom: "Rome",
      routeTo: "Hadrian's Villa, Villa d'Este, Tivoli, Rome",
      weatherLabel: "Hidden gem / Gardens",
      quote: "Rome gives way to countryside, ruins, fountains and gardens.",
      description:
        "A hidden-gem-led day instead of a predictable second Rome monument day: full-day Tivoli excursion combining Hadrian's Villa and Villa d'Este.",
      items: [
        item("d2-breakfast", "restaurant", "07:00", "Breakfast", "Breakfast before the full-day Tivoli route.", { imageUrl: images.rome, badge: "Breakfast" }),
        item("d2-transfer", "transportation", "08:30", "Rome to Tivoli", "Provider transfer or rail/tour routing toward Tivoli.", { imageUrl: images.rome, badge: "Transfer" }),
        item("d2-main", "activity", "08:30", "Hadrian's Villa + Villa d'Este", "Full-day UNESCO estate route: Hadrian's Villa, lunch/rest, Villa d'Este gardens and return to Rome.", { imageUrl: images.rome, badge: "Hidden Gem", duration: "8.5 Hours" }),
        item("d2-dinner", "restaurant", "19:30", "Rome dinner", "Keep the evening light after the Tivoli day.", { imageUrl: images.rome, badge: "Dinner" }),
      ],
      suggestions: [
        suggestion("d2-s1", "Villa Gregoriana", "Nature", "Waterfalls and nature option around Tivoli.", { imageUrl: images.rome }),
        suggestion("d2-s2", "Tivoli old town", "Local Italy", "Low-crowd local streets before or after the villas.", { imageUrl: images.rome }),
        suggestion("d2-s3", "Rocca Pia", "Historic Architecture", "Compact architecture add-on in Tivoli.", { imageUrl: images.rome }),
        suggestion("d2-s4", "Temple of Vesta viewpoint", "Photography", "Ancient viewpoint option near Tivoli.", { imageUrl: images.rome }),
      ],
      notes: [
        { id: "d2-n1", icon: "sparkles", title: "Gene rhythm", text: "Blockbuster Rome on Day 1, hidden countryside on Day 2." },
        { id: "d2-n2", icon: "clock", title: "Full day", text: "Treat Tivoli as 08:30-17:00." },
        { id: "d2-n3", icon: "leaf", title: "Atmosphere", text: "Ruins, fountains and gardens change the tone." },
      ],
    }),
    day({
      dayNumber: 3,
      title: "Rome to Naples - Buried Beneath Vesuvius",
      destinationLabel: "Naples and Pompeii",
      countryLabel: "Italy",
      imageUrl: images.mediterranean,
      routeFrom: "Roma Termini",
      routeTo: "Napoli Centrale, NH Napoli Panorama, Pompeii",
      weatherLabel: "Archaeology / Adventure",
      quote: "The route drops south, where Vesuvius keeps an ancient city under ash.",
      description:
        "Use Frecciarossa from Rome to Naples, store luggage at NH Napoli Panorama, then make Pompeii a feasible afternoon archaeological adventure.",
      items: [
        item("d3-train", "transportation", "09:00", "Roma Termini to Napoli Centrale", "Use Frecciarossa as default, with exact train number and time retrieved for customer dates.", { imageUrl: images.mediterranean, badge: "Frecciarossa" }),
        item("d3-hotel", "hotel", "11:00", "NH Napoli Panorama luggage", "Nights 3-4, close to central Naples and Molo Beverello for coastal excursions.", { imageUrl: images.mediterranean, badge: "Hotel" }),
        item("d3-lunch", "restaurant", "12:00", "Naples lunch", "Lunch before the Pompeii block.", { imageUrl: images.mediterranean, badge: "Lunch" }),
        item("d3-main", "activity", "13:30", "Pompeii Archaeological Adventure", "Naples to Pompeii guided archaeological site visit and return, feasible after an early Rome-Naples transfer.", { imageUrl: images.mediterranean, badge: "Adventure", duration: "4.5 Hours" }),
      ],
      suggestions: [
        suggestion("d3-s1", "Herculaneum", "Alternative Archaeology", "Smaller-scale archaeology alternative to Pompeii.", { imageUrl: images.mediterranean }),
        suggestion("d3-s2", "Rione Sanità", "Local Naples", "Architecture and local Naples route.", { imageUrl: images.mediterranean }),
        suggestion("d3-s3", "Santa Chiara cloister", "Quiet Culture", "Historic and photographic Naples option.", { imageUrl: images.mediterranean }),
        suggestion("d3-s4", "Parco Virgiliano", "Coastal View", "Sunset and coastal panorama option.", { imageUrl: images.mediterranean }),
      ],
      notes: [
        { id: "d3-n1", icon: "train", title: "Live rail", text: "Trenitalia timing can change, especially with infrastructure work." },
        { id: "d3-n2", icon: "ticket", title: "Pompeii", text: "Half-day Naples products are often around 3-4 hours." },
        { id: "d3-n3", icon: "hotel", title: "Base", text: "Naples base also supports Amalfi boat day." },
      ],
    }),
    day({
      dayNumber: 4,
      title: "Amalfi Coast - Villages Beneath the Cliffs",
      destinationLabel: "Amalfi Coast",
      countryLabel: "Italy",
      imageUrl: images.coast,
      routeFrom: "Naples",
      routeTo: "Mediterranean cruise, Positano, Amalfi, Naples",
      weatherLabel: "Coastal / Boat",
      quote: "Italy's strongest coastal day is best seen from the sea.",
      description:
        "A full-day Amalfi Coast boat experience from Naples with coastal cliffs, Positano, Amalfi, scenic stops and swimming where the booked operator allows.",
      items: [
        item("d4-pickup", "transportation", "08:00", "Naples pickup or port transfer", "Transfer toward the selected Amalfi Coast boat product.", { imageUrl: images.coast, badge: "Transfer" }),
        item("d4-main", "activity", "08:00", "Amalfi From the Sea", "Mediterranean cruise, coastal cliffs, Positano, Amalfi, caves or swimming/scenic stops where permitted and return to Naples.", { imageUrl: images.coast, badge: "Coastal", duration: "10 Hours" }),
        item("d4-lunch", "restaurant", "13:00", "Coastal lunch", "Lunch timing depends on the boat tour configuration.", { imageUrl: images.coast, badge: "Lunch" }),
        item("d4-return", "transportation", "18:00", "Return to Naples", "Return after the full coastal day.", { imageUrl: images.coast, badge: "Return" }),
      ],
      suggestions: [
        suggestion("d4-s1", "Atrani", "Hidden Coastal Village", "Tiny coastal village beside Amalfi, excellent route fit and lower-crowd alternative.", { imageUrl: images.coast }),
        suggestion("d4-s2", "Fiordo di Furore viewpoint", "Coastal Landscape", "Photography and dramatic coastal landscape.", { imageUrl: images.coast }),
        suggestion("d4-s3", "Minori", "Quiet Coast", "Local town and quieter coastal option.", { imageUrl: images.coast }),
        suggestion("d4-s4", "Ravello", "Gardens + Sea Views", "Mountain and sea-view garden alternative.", { imageUrl: images.coast }),
        suggestion("d4-s5", "Capri + Blue Grotto", "AI Alternative", "Full-day island-and-caves replacement if the customer prefers Capri over Amalfi towns.", { imageUrl: images.coast }),
      ],
      notes: [
        { id: "d4-n1", icon: "waves", title: "Coastal", text: "First major coastal experience." },
        { id: "d4-n2", icon: "boat", title: "Operator", text: "Swimming depends on booked tour safety rules." },
        { id: "d4-n3", icon: "sparkles", title: "AI", text: "Atrani should be a strong hidden coastal village card." },
      ],
    }),
    day({
      dayNumber: 5,
      title: "Naples to Athens - From Empire to Ancient Greece",
      destinationLabel: "Athens",
      countryLabel: "Greece",
      imageUrl: images.mediterranean,
      routeFrom: "Naples NAP",
      routeTo: "Athens ATH, Electra Metropolis Athens, Acropolis",
      weatherLabel: "Iconic Athens",
      quote: "The ancient world changes language, from Rome's empire to Greek marble.",
      description:
        "Fly Naples to Athens in the morning, settle near Syntagma at Electra Metropolis Athens, then use a late-afternoon Acropolis and Parthenon experience.",
      items: [
        item("d5-flight", "flight", "Morning", "Naples NAP to Athens ATH", "AEGEAN currently sells Naples-Athens flights. Target morning departure and arrival before about 12:00-13:00.", { imageUrl: images.mediterranean, badge: "Cross-country Flight" }),
        item("d5-hotel", "hotel", "13:00", "Electra Metropolis Athens", "Nights 5-6, centrally positioned by Syntagma Square and close to the historic core.", { imageUrl: images.mediterranean, badge: "Hotel" }),
        item("d5-lunch", "restaurant", "13:30", "Athens lunch and rest", "Lunch and rest after the flight.", { imageUrl: images.mediterranean, badge: "Lunch" }),
        item("d5-main", "activity", "16:00", "Acropolis + Parthenon", "Late-afternoon guided Acropolis experience covering Parthenon, Temple of Athena Nike area and ancient viewpoints.", { imageUrl: images.mediterranean, badge: "Iconic", duration: "3 Hours" }),
      ],
      suggestions: [
        suggestion("d5-s1", "Anafiotika", "Hidden Athens", "Island-style streets near the historic core.", { imageUrl: images.mediterranean }),
        suggestion("d5-s2", "Philopappos Hill", "View + Nature", "Ancient Athens view and nature option.", { imageUrl: images.mediterranean }),
        suggestion("d5-s3", "National Garden", "Relaxation", "Green space for a lighter Athens moment.", { imageUrl: images.mediterranean }),
        suggestion("d5-s4", "Plaka side lanes", "Old Athens", "Photography and old Athens atmosphere.", { imageUrl: images.mediterranean }),
      ],
      notes: [
        { id: "d5-n1", icon: "plane", title: "Flight rule", text: "Morning NAP-ATH protects the afternoon." },
        { id: "d5-n2", icon: "ticket", title: "Acropolis", text: "Afternoon products commonly run 2-4 hours." },
        { id: "d5-n3", icon: "sun", title: "Pacing", text: "Do not schedule a full-day experience after the flight." },
      ],
    }),
    day({
      dayNumber: 6,
      title: "Meteora - Monasteries Between Earth and Sky",
      destinationLabel: "Meteora",
      countryLabel: "Greece",
      imageUrl: images.mountains,
      routeFrom: "Athens",
      routeTo: "Meteora monasteries, rock formations, hidden caves, Athens",
      weatherLabel: "Adventure / Long day",
      quote: "The biggest land adventure day rises between earth and sky.",
      description:
        "A very long Athens-Meteora day focused on monasteries, rock landscapes, panoramic views, caves and less-visited locations. Nothing else should be booked after return.",
      items: [
        item("d6-depart", "transportation", "06:30", "Very early Athens departure", "Organized transfer from Athens toward central Greece and Meteora.", { imageUrl: images.mountains, badge: "Long Transfer" }),
        item("d6-main", "activity", "10:30", "Meteora Monasteries and Hidden Caves", "Rock formations, monastery visits, panoramic viewpoints, local lunch/rest and less-visited locations depending on selected tour.", { imageUrl: images.mountains, badge: "Adventure", duration: "14 Hours" }),
        item("d6-lunch", "restaurant", "13:00", "Local lunch/rest", "Lunch or rest block according to provider structure.", { imageUrl: images.mountains, badge: "Lunch" }),
        item("d6-return", "transportation", "21:00", "Return to Athens hotel", "No additional activity can be automatically scheduled after return.", { imageUrl: images.mountains, badge: "Return" }),
      ],
      suggestions: [
        suggestion("d6-s1", "Kastraki Village", "Mountain Village", "Show as information or replacement possibility, not extra same-day activity.", { imageUrl: images.mountains }),
        suggestion("d6-s2", "Hermit cave viewpoints", "History + Landscape", "Recommended only when already included in the selected Meteora tour.", { imageUrl: images.mountains }),
        suggestion("d6-s3", "Kalambaka old district", "Local Greece", "Better for another stay or if included in provider timing.", { imageUrl: images.mountains }),
      ],
      notes: [
        { id: "d6-n1", icon: "clock", title: "Long day", text: "Meteora can run around 14 hours from Athens." },
        { id: "d6-n2", icon: "shield", title: "Fatigue rule", text: "No additional activity after return." },
        { id: "d6-n3", icon: "sparkles", title: "Suggestions", text: "Suggestions are informational unless already included." },
      ],
    }),
    day({
      dayNumber: 7,
      title: "Athens to Santorini - White Villages Above the Aegean",
      destinationLabel: "Santorini",
      countryLabel: "Greece",
      imageUrl: images.coast,
      routeFrom: "Athens ATH",
      routeTo: "Santorini JTR, El Greco Resort & Spa, Fira, Oia",
      weatherLabel: "Coastal / Caldera",
      quote: "The trip turns white and blue above the Aegean.",
      description:
        "Use a morning ATH-JTR flight rather than a long ferry for a 10-day itinerary, base at El Greco Resort & Spa in Fira, then explore caldera villages and Oia sunset.",
      items: [
        item("d7-flight", "flight", "Morning", "Athens ATH to Santorini JTR", "Prefer flight over ferry for this 10-day route. Ferry can appear as scenic alternative.", { imageUrl: images.coast, badge: "Domestic Flight" }),
        item("d7-hotel", "hotel", "11:00", "El Greco Resort & Spa Fira", "Nights 7-9. Practical central island base near Fira.", { imageUrl: images.coast, badge: "Hotel" }),
        item("d7-rest", "hotel", "12:30", "Lunch and rest", "Hotel/luggage, lunch and rest before the caldera route.", { imageUrl: images.coast, badge: "Recovery" }),
        item("d7-main", "activity", "15:00", "Caldera Villages and Oia Sunset", "Fira, Firostefani, Imerovigli, Oia and sunset before returning to the hotel.", { imageUrl: images.coast, badge: "Coastal", duration: "5 Hours" }),
      ],
      suggestions: [
        suggestion("d7-s1", "Finikia", "Hidden Village", "Near Oia with lower crowd atmosphere.", { imageUrl: images.coast }),
        suggestion("d7-s2", "Vothonas", "Cave Village", "Local Santorini cave-village option.", { imageUrl: images.coast }),
        suggestion("d7-s3", "Pyrgos", "Hill Village", "Panorama and hill-village route.", { imageUrl: images.coast }),
        suggestion("d7-s4", "Exo Gonia", "Traditional Village", "Architecture and quieter traditional village.", { imageUrl: images.coast }),
      ],
      notes: [
        { id: "d7-n1", icon: "plane", title: "Flight", text: "ATH-JTR protects the short itinerary." },
        { id: "d7-n2", icon: "boat", title: "Alternative", text: "Ferry can be shown as scenic alternative." },
        { id: "d7-n3", icon: "sun", title: "Sunset", text: "Oia sunset closes the first Santorini day." },
      ],
    }),
    day({
      dayNumber: 8,
      title: "Santorini - Into the Volcano",
      destinationLabel: "Santorini Caldera",
      countryLabel: "Greece",
      imageUrl: images.coast,
      routeFrom: "Fira",
      routeTo: "Nea Kameni, hot springs area, Thirasia, caldera",
      weatherLabel: "Volcano + Coast",
      quote: "Sea, landscape and adventure merge in one volcanic day.",
      description:
        "A full-day or shorter caldera volcano and hot-springs cruise, combining Nea Kameni volcanic landscape, thermal-water area, Thirasia and Aegean cruising.",
      items: [
        item("d8-transfer", "transportation", "09:00", "Port transfer", "Transfer to the selected Santorini caldera cruise departure point.", { imageUrl: images.coast, badge: "Transfer" }),
        item("d8-main", "activity", "10:00", "Caldera Volcano and Hot-Springs Cruise", "Nea Kameni volcanic landscape, caldera, thermal-water area, Thirasia and Aegean cruise depending on product.", { imageUrl: images.coast, badge: "Volcano Cruise", duration: "6-7 Hours" }),
        item("d8-lunch", "restaurant", "13:00", "Cruise lunch or Thirasia lunch", "Lunch depends on the selected cruise format.", { imageUrl: images.coast, badge: "Lunch" }),
        item("d8-return", "transportation", "17:00", "Return to hotel", "Return and keep the evening easy.", { imageUrl: images.coast, badge: "Return" }),
      ],
      suggestions: [
        suggestion("d8-s1", "Thirasia Village", "Hidden Island", "Local Greece island option near the caldera route.", { imageUrl: images.coast }),
        suggestion("d8-s2", "Manolas", "Quiet Village", "Aegean view and quiet village suggestion.", { imageUrl: images.coast }),
        suggestion("d8-s3", "Akrotiri Lighthouse", "Sunset Coast", "Coastal sunset option if the cruise returns early enough.", { imageUrl: images.coast }),
      ],
      notes: [
        { id: "d8-n1", icon: "waves", title: "Overlap", text: "This day gives sea, landscape and adventure." },
        { id: "d8-n2", icon: "shield", title: "Safety", text: "Swimming only when permitted by operator and suitable for traveler." },
        { id: "d8-n3", icon: "boat", title: "Product", text: "Full-day and shorter cruise versions may be available." },
      ],
    }),
    day({
      dayNumber: 9,
      title: "Santorini - The Island Behind the Postcard",
      destinationLabel: "Santorini Villages",
      countryLabel: "Greece",
      imageUrl: images.coast,
      routeFrom: "Fira",
      routeTo: "Megalochori, Emporio, traditional lanes, Perivolos",
      weatherLabel: "Hidden villages",
      quote: "The hidden villages reveal the Santorini behind the postcard.",
      description:
        "A hidden-gem-led main trip through Megalochori, Emporio, traditional lanes, local viewpoints and Perivolos coastal area, rather than another famous Oia tour.",
      items: [
        item("d9-main", "activity", "09:30", "Santorini Hidden Villages and Black Coast", "Megalochori, Emporio, traditional lanes, local viewpoints, Perivolos coastal area and return to hotel.", { imageUrl: images.coast, badge: "Hidden Gem", duration: "5.5 Hours" }),
        item("d9-lunch", "restaurant", "13:00", "Village or coastal lunch", "Lunch based on the hidden-village route.", { imageUrl: images.coast, badge: "Lunch" }),
        item("d9-rest", "hotel", "15:30", "Hotel recovery", "Rest after the hidden-village day.", { imageUrl: images.coast, badge: "Recovery" }),
      ],
      suggestions: [
        suggestion("d9-s1", "Emporio Kastelli", "Medieval Santorini", "Hidden medieval village texture.", { imageUrl: images.coast }),
        suggestion("d9-s2", "Megalochori alleys", "Traditional", "Photography and traditional architecture.", { imageUrl: images.coast }),
        suggestion("d9-s3", "Mesa Gonia", "Quiet Village", "Quiet village and architecture.", { imageUrl: images.coast }),
        suggestion("d9-s4", "Vlychada", "Volcanic Coast", "Landscape and volcanic coast card.", { imageUrl: images.coast }),
      ],
      notes: [
        { id: "d9-n1", icon: "sparkles", title: "Hidden main trip", text: "This is an actual hidden-gem main trip, not just suggestions." },
        { id: "d9-n2", icon: "map", title: "Villages", text: "Megalochori and Emporio anchor the route." },
        { id: "d9-n3", icon: "waves", title: "Coast", text: "Perivolos adds coastal rhythm." },
      ],
    }),
    day({
      dayNumber: 10,
      title: "Santorini - Black Sand and Aegean Blue",
      destinationLabel: "Perissa",
      countryLabel: "Greece",
      imageUrl: images.coast,
      routeFrom: "Fira",
      routeTo: "Perissa, Santorini JTR",
      weatherLabel: "Black-sand coast / Departure",
      quote: "The last morning stays light: volcanic sand, Aegean blue and a clean departure.",
      description:
        "A light final day built around Perissa black-sand coast, lunch, luggage pickup and Santorini departure. If Gene detects an early departure flight, it removes the beach automatically.",
      items: [
        item("d10-checkout", "hotel", "08:30", "Breakfast, checkout and luggage storage", "Store luggage at the hotel before the beach block.", { imageUrl: images.coast, badge: "Checkout" }),
        item("d10-main", "activity", "09:30", "Perissa Black-Sand Coast", "Black volcanic beach, seaside promenade, lunch and return toward hotel/luggage.", { imageUrl: images.coast, badge: "Black Sand Beach", duration: "3.5 Hours" }),
        item("d10-lunch", "restaurant", "12:00", "Seaside lunch", "Light lunch before airport movement.", { imageUrl: images.coast, badge: "Lunch" }),
        item("d10-airport", "transportation", "14:00", "Transfer to Santorini JTR", "Transfer timing depends on the selected departure flight.", { imageUrl: images.coast, badge: "Airport Transfer" }),
        item("d10-flight", "flight", "17:00+", "Santorini JTR to home or via ATH", "Ideal JTR departure after about 17:00. Use JTR-Home or JTR-ATH-Home if direct return is not practical.", { imageUrl: images.coast, badge: "Departure Flight" }),
      ],
      suggestions: [
        suggestion("d10-s1", "Vlychada Beach", "Hidden Coast", "Volcanic landscape alternative.", { imageUrl: images.coast }),
        suggestion("d10-s2", "Akrotiri village", "History + Local", "Light historical/local option if flight timing allows.", { imageUrl: images.coast }),
        suggestion("d10-s3", "Emporio", "Village Photography", "Village photography alternative if beach is removed.", { imageUrl: images.coast }),
      ],
      notes: [
        { id: "d10-n1", icon: "plane", title: "Departure", text: "Ideal departure is JTR after 17:00." },
        { id: "d10-n2", icon: "shield", title: "Auto-remove", text: "Remove beach if the chosen flight is early." },
        { id: "d10-n3", icon: "waves", title: "Coastal", text: "Fourth coastal experience closes the plan." },
      ],
    }),
  ];

  return {
    publicHtml: "",
    hero: {
      backgroundImage: images.hero,
      title: "Your Cinematic Ready Plan",
      subtitle:
        "10 days from ancient Rome to Santorini's volcanic shores, with Tivoli, Pompeii, Amalfi, Athens, Meteora and hidden Santorini villages.",
      stats: [
        { label: "Days", value: "10" },
        { label: "Countries", value: "2" },
        { label: "Cities", value: "6" },
        { label: "Travelers", value: "2" },
        { label: "Travel Style", value: "Coast + Adventure" },
      ],
      primaryCtaText: "Plan Smarter With AI",
      primaryCtaHref: "/ai-planner",
      secondaryCtaText: "View Full Timeline",
    },
    journeyOverview: {
      title: "Journey Overview",
      startPoint: "Rome Fiumicino FCO",
      destinations: "Rome, Tivoli, Naples, Pompeii, Amalfi Coast, Athens, Meteora, Santorini",
      tripStyle: "Iconic Europe, hidden gems, cliffs, volcanoes, Mediterranean coast",
      travelers: "2 Adults",
      estimatedCost: "Live pricing",
      aiScore: "4.9",
    },
    days,
    footer: {
      backgroundImage: images.hero,
      title: "Your journey, but smarter.",
      subtitle: "Let AI balance icons, coast, volcanoes, hidden villages and real transfer timing.",
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
    location: "Rome, Tivoli, Naples, Amalfi Coast, Athens, Meteora, Santorini",
    days: content.days.length,
    image_url: images.hero,
    created_at: timestamp,
    subtitle: "10 days from ancient Rome to Santorini's volcanic shores.",
    country: "Italy, Greece",
    city: "Rome, Naples, Athens, Santorini",
    destination: "Italy and Greece",
    style: "Cliffs, Volcanoes, Mediterranean Blue, Coast, Adventure, Hidden Gems",
    daysCount: content.days.length,
    heroImage: images.hero,
    coverImage: images.hero,
    summary:
      "Rome, Tivoli, Pompeii, Amalfi Coast, Athens, Meteora and Santorini shaped into a 10-day coast-and-adventure Gene route with hidden villages, volcanic landscapes and Mediterranean blue.",
    seoTitle: PLAN_TITLE,
    seoDescription:
      "Draft ready plan for Italy + Greece: Cliffs, Volcanoes and Mediterranean Blue with Rome, Tivoli, Pompeii, Amalfi, Athens, Meteora and Santorini.",
    tags: ["Italy", "Greece", "Rome", "Amalfi Coast", "Athens", "Meteora", "Santorini", "Volcanoes", "Mediterranean"],
    season: "Late spring, summer, early autumn",
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
  console.error("INSERT_ITALY_GREECE_READY_PLAN_FAILED");
  console.error(error);
  process.exit(1);
});
