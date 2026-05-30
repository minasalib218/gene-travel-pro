type PlannerSuggestions = {
  travelStyles: string[];
  priorities: string[];
  amenities: string[];
  interests: string[];
  foodPreferences: string[];
  locationPreferences: string[];
  bedTypes: string[];
  preferredAirlines: string[];
  transportTypes: string[];
  mustDo: string[];
  avoid: string[];
  mobility: string[];
  occasions: string[];
};

const DEFAULT_SUGGESTIONS: PlannerSuggestions = {
  travelStyles: ["city", "culture", "food", "relaxing", "shopping"],
  priorities: ["comfort", "experiences", "convenience", "price", "uniqueness"],
  amenities: ["pool", "gym", "spa", "parking", "sea view", "kids club"],
  interests: ["museums", "cafes", "fine dining", "shopping malls", "photography", "local markets"],
  foodPreferences: ["halal", "vegetarian", "vegan", "seafood", "gluten-free", "no pork"],
  locationPreferences: ["city center", "near attractions", "quiet area", "waterfront", "walkable district"],
  bedTypes: ["king", "queen", "double", "twin", "family suite"],
  preferredAirlines: ["Any", "Emirates", "Qatar Airways", "Turkish Airlines", "Lufthansa"],
  transportTypes: ["taxi", "public", "private-driver", "rental-car"],
  mustDo: ["Old town walk", "Local food experience", "Sunset viewpoint", "Signature landmark", "Day trip"],
  avoid: ["Heavy walking", "Nightlife", "Crowded areas", "Long transfers", "Outdoor-only days"],
  mobility: ["Wheelchair support", "Stroller friendly", "Low stairs", "Easy access elevators"],
  occasions: ["Honeymoon", "Birthday", "Anniversary", "Family holiday", "Friends trip"],
};

const COUNTRY_SUGGESTIONS: Record<string, Partial<PlannerSuggestions>> = {
  AE: {
    travelStyles: ["luxury", "shopping", "city", "food", "relaxing"],
    amenities: ["pool", "spa", "sea view", "kids club", "parking"],
    interests: ["shopping malls", "fine dining", "desert trips", "boat trips", "photography"],
    foodPreferences: ["halal", "vegetarian", "seafood", "gluten-free", "no pork"],
    locationPreferences: ["downtown skyline", "marina waterfront", "beachfront", "near mall", "quiet luxury zone"],
    preferredAirlines: ["Emirates", "Etihad", "FlyDubai", "Qatar Airways", "Any"],
    transportTypes: ["taxi", "private-driver", "rental-car", "public"],
    mustDo: ["Desert safari", "Marina dinner cruise", "Luxury beach day", "Skyline viewpoint", "Mall shopping"],
  },
  SA: {
    travelStyles: ["culture", "luxury", "food", "relaxing", "city"],
    interests: ["local markets", "fine dining", "photography", "museums", "desert trips"],
    locationPreferences: ["business district", "historic quarter", "quiet family area", "near attractions"],
    preferredAirlines: ["Saudia", "Flynas", "Qatar Airways", "Emirates", "Any"],
    foodPreferences: ["halal", "vegetarian", "seafood", "no pork"],
    mustDo: ["Historic district walk", "Local dining", "Desert experience", "Modern skyline stop"],
  },
  EG: {
    travelStyles: ["culture", "adventure", "relaxing", "food", "city"],
    interests: ["museums", "beaches", "boat trips", "photography", "local markets", "cafes"],
    locationPreferences: ["Nile view", "near historical sites", "resort strip", "quiet beach zone"],
    preferredAirlines: ["EgyptAir", "Air Cairo", "Emirates", "Turkish Airlines", "Any"],
    transportTypes: ["taxi", "private-driver", "public", "rental-car"],
    mustDo: ["Pyramids visit", "Nile cruise", "Red Sea day", "Old Cairo walk"],
  },
  TR: {
    travelStyles: ["culture", "food", "city", "shopping", "romantic"],
    interests: ["local markets", "cafes", "boat trips", "fine dining", "photography", "museums"],
    locationPreferences: ["historic center", "Bosphorus side", "beach district", "quiet boutique quarter"],
    preferredAirlines: ["Turkish Airlines", "Pegasus", "Qatar Airways", "Any"],
    foodPreferences: ["halal", "vegetarian", "seafood", "no pork"],
    mustDo: ["Bosphorus cruise", "Grand Bazaar", "Historic mosque route", "Rooftop dinner"],
  },
  FR: {
    travelStyles: ["romantic", "culture", "food", "luxury", "city"],
    interests: ["museums", "cafes", "fine dining", "photography", "shopping malls", "boat trips"],
    locationPreferences: ["historic center", "river view", "quiet arrondissement", "near museums"],
    preferredAirlines: ["Air France", "Emirates", "Qatar Airways", "Any"],
    mustDo: ["River cruise", "Museum visit", "Cafe terrace morning", "Evening landmark view"],
  },
  IT: {
    travelStyles: ["romantic", "culture", "food", "city", "luxury"],
    interests: ["museums", "fine dining", "local markets", "boat trips", "photography", "cafes"],
    locationPreferences: ["historic center", "piazza side", "canal area", "quiet boutique quarter"],
    preferredAirlines: ["ITA Airways", "Emirates", "Lufthansa", "Any"],
    mustDo: ["Old city stroll", "Landmark entry", "Scenic dinner", "Day trip"],
  },
  ES: {
    travelStyles: ["food", "city", "nightlife", "culture", "relaxing"],
    interests: ["beaches", "cafes", "fine dining", "local markets", "boat trips", "photography"],
    locationPreferences: ["old quarter", "beachfront", "quiet local district", "city center"],
    preferredAirlines: ["Iberia", "Vueling", "Emirates", "Any"],
    mustDo: ["Tapas evening", "Beach sunset", "Old quarter walk", "Gaudi or museum route"],
  },
  GB: {
    travelStyles: ["city", "culture", "food", "shopping", "luxury"],
    interests: ["museums", "shopping malls", "cafes", "fine dining", "photography", "local markets"],
    locationPreferences: ["central district", "quiet residential quarter", "near museums", "near shopping"],
    preferredAirlines: ["British Airways", "Virgin Atlantic", "Emirates", "Any"],
    mustDo: ["Museum route", "Afternoon tea", "Market stroll", "West End evening"],
  },
  US: {
    travelStyles: ["city", "shopping", "food", "luxury", "adventure"],
    interests: ["theme parks", "shopping malls", "fine dining", "beaches", "photography", "museums"],
    locationPreferences: ["downtown", "beachfront", "family resort area", "near attractions"],
    preferredAirlines: ["Delta", "United", "American Airlines", "JetBlue", "Any"],
    transportTypes: ["rental-car", "taxi", "public", "private-driver"],
    mustDo: ["Landmark visit", "Scenic drive", "Food district", "Observation deck"],
  },
  JP: {
    travelStyles: ["culture", "food", "city", "shopping", "relaxing"],
    interests: ["local markets", "cafes", "photography", "museums", "theme parks", "fine dining"],
    locationPreferences: ["station area", "quiet neighborhood", "historic district", "shopping quarter"],
    preferredAirlines: ["Japan Airlines", "ANA", "Qatar Airways", "Any"],
    transportTypes: ["public", "taxi", "private-driver", "rental-car"],
    mustDo: ["Temple route", "Food alley", "Skyline night view", "Day trip by train"],
  },
  TH: {
    travelStyles: ["relaxing", "food", "beach", "adventure", "nightlife"],
    interests: ["beaches", "boat trips", "cafes", "fine dining", "local markets", "photography"],
    locationPreferences: ["beachfront", "island side", "riverfront", "quiet resort zone"],
    preferredAirlines: ["Thai Airways", "AirAsia", "Emirates", "Any"],
    mustDo: ["Island hopping", "Night market", "Beach sunset", "Spa day"],
  },
};

function unique(values: string[]) {
  return Array.from(new Set(values));
}

export function getPlannerSuggestions(countryCode?: string | null): PlannerSuggestions {
  const overrides = countryCode ? COUNTRY_SUGGESTIONS[countryCode] ?? {} : {};

  return {
    travelStyles: unique([...(overrides.travelStyles ?? []), ...DEFAULT_SUGGESTIONS.travelStyles]),
    priorities: unique([...(overrides.priorities ?? []), ...DEFAULT_SUGGESTIONS.priorities]),
    amenities: unique([...(overrides.amenities ?? []), ...DEFAULT_SUGGESTIONS.amenities]),
    interests: unique([...(overrides.interests ?? []), ...DEFAULT_SUGGESTIONS.interests]),
    foodPreferences: unique([...(overrides.foodPreferences ?? []), ...DEFAULT_SUGGESTIONS.foodPreferences]),
    locationPreferences: unique([...(overrides.locationPreferences ?? []), ...DEFAULT_SUGGESTIONS.locationPreferences]),
    bedTypes: unique([...(overrides.bedTypes ?? []), ...DEFAULT_SUGGESTIONS.bedTypes]),
    preferredAirlines: unique([...(overrides.preferredAirlines ?? []), ...DEFAULT_SUGGESTIONS.preferredAirlines]),
    transportTypes: unique([...(overrides.transportTypes ?? []), ...DEFAULT_SUGGESTIONS.transportTypes]),
    mustDo: unique([...(overrides.mustDo ?? []), ...DEFAULT_SUGGESTIONS.mustDo]),
    avoid: unique([...(overrides.avoid ?? []), ...DEFAULT_SUGGESTIONS.avoid]),
    mobility: unique([...(overrides.mobility ?? []), ...DEFAULT_SUGGESTIONS.mobility]),
    occasions: unique([...(overrides.occasions ?? []), ...DEFAULT_SUGGESTIONS.occasions]),
  };
}
