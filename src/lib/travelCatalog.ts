export type DestinationRecord = {
  city: string;
  country: string;
  countryCode: string;
  region: string;
};

export type CountryRecord = {
  country: string;
  countryCode: string;
  region: string;
  cities: string[];
};

export type AirportRecord = {
  code: string;
  name: string;
  city: string;
  country: string;
  countryCode: string;
};

export const DESTINATIONS: DestinationRecord[] = [
  { city: "Dubai", country: "United Arab Emirates", countryCode: "AE", region: "Middle East" },
  { city: "Abu Dhabi", country: "United Arab Emirates", countryCode: "AE", region: "Middle East" },
  { city: "Sharjah", country: "United Arab Emirates", countryCode: "AE", region: "Middle East" },
  { city: "Riyadh", country: "Saudi Arabia", countryCode: "SA", region: "Middle East" },
  { city: "Jeddah", country: "Saudi Arabia", countryCode: "SA", region: "Middle East" },
  { city: "AlUla", country: "Saudi Arabia", countryCode: "SA", region: "Middle East" },
  { city: "Doha", country: "Qatar", countryCode: "QA", region: "Middle East" },
  { city: "Muscat", country: "Oman", countryCode: "OM", region: "Middle East" },
  { city: "Manama", country: "Bahrain", countryCode: "BH", region: "Middle East" },
  { city: "Kuwait City", country: "Kuwait", countryCode: "KW", region: "Middle East" },
  { city: "Amman", country: "Jordan", countryCode: "JO", region: "Middle East" },
  { city: "Jerusalem", country: "Israel", countryCode: "IL", region: "Middle East" },
  { city: "Tel Aviv", country: "Israel", countryCode: "IL", region: "Middle East" },
  { city: "Istanbul", country: "Turkey", countryCode: "TR", region: "Middle East" },
  { city: "Antalya", country: "Turkey", countryCode: "TR", region: "Middle East" },
  { city: "Cappadocia", country: "Turkey", countryCode: "TR", region: "Middle East" },
  { city: "Cairo", country: "Egypt", countryCode: "EG", region: "Africa" },
  { city: "Sharm El Sheikh", country: "Egypt", countryCode: "EG", region: "Africa" },
  { city: "Hurghada", country: "Egypt", countryCode: "EG", region: "Africa" },
  { city: "Luxor", country: "Egypt", countryCode: "EG", region: "Africa" },
  { city: "Marrakech", country: "Morocco", countryCode: "MA", region: "Africa" },
  { city: "Casablanca", country: "Morocco", countryCode: "MA", region: "Africa" },
  { city: "Fes", country: "Morocco", countryCode: "MA", region: "Africa" },
  { city: "Cape Town", country: "South Africa", countryCode: "ZA", region: "Africa" },
  { city: "Johannesburg", country: "South Africa", countryCode: "ZA", region: "Africa" },
  { city: "Nairobi", country: "Kenya", countryCode: "KE", region: "Africa" },
  { city: "Zanzibar", country: "Tanzania", countryCode: "TZ", region: "Africa" },
  { city: "Paris", country: "France", countryCode: "FR", region: "Europe" },
  { city: "Nice", country: "France", countryCode: "FR", region: "Europe" },
  { city: "Lyon", country: "France", countryCode: "FR", region: "Europe" },
  { city: "London", country: "United Kingdom", countryCode: "GB", region: "Europe" },
  { city: "Edinburgh", country: "United Kingdom", countryCode: "GB", region: "Europe" },
  { city: "Manchester", country: "United Kingdom", countryCode: "GB", region: "Europe" },
  { city: "Rome", country: "Italy", countryCode: "IT", region: "Europe" },
  { city: "Milan", country: "Italy", countryCode: "IT", region: "Europe" },
  { city: "Venice", country: "Italy", countryCode: "IT", region: "Europe" },
  { city: "Barcelona", country: "Spain", countryCode: "ES", region: "Europe" },
  { city: "Madrid", country: "Spain", countryCode: "ES", region: "Europe" },
  { city: "Seville", country: "Spain", countryCode: "ES", region: "Europe" },
  { city: "Amsterdam", country: "Netherlands", countryCode: "NL", region: "Europe" },
  { city: "Rotterdam", country: "Netherlands", countryCode: "NL", region: "Europe" },
  { city: "Vienna", country: "Austria", countryCode: "AT", region: "Europe" },
  { city: "Salzburg", country: "Austria", countryCode: "AT", region: "Europe" },
  { city: "Prague", country: "Czech Republic", countryCode: "CZ", region: "Europe" },
  { city: "Athens", country: "Greece", countryCode: "GR", region: "Europe" },
  { city: "Santorini", country: "Greece", countryCode: "GR", region: "Europe" },
  { city: "Mykonos", country: "Greece", countryCode: "GR", region: "Europe" },
  { city: "Berlin", country: "Germany", countryCode: "DE", region: "Europe" },
  { city: "Munich", country: "Germany", countryCode: "DE", region: "Europe" },
  { city: "Hamburg", country: "Germany", countryCode: "DE", region: "Europe" },
  { city: "Zurich", country: "Switzerland", countryCode: "CH", region: "Europe" },
  { city: "Geneva", country: "Switzerland", countryCode: "CH", region: "Europe" },
  { city: "Lisbon", country: "Portugal", countryCode: "PT", region: "Europe" },
  { city: "Porto", country: "Portugal", countryCode: "PT", region: "Europe" },
  { city: "Budapest", country: "Hungary", countryCode: "HU", region: "Europe" },
  { city: "Dubrovnik", country: "Croatia", countryCode: "HR", region: "Europe" },
  { city: "Reykjavik", country: "Iceland", countryCode: "IS", region: "Europe" },
  { city: "Stockholm", country: "Sweden", countryCode: "SE", region: "Europe" },
  { city: "Oslo", country: "Norway", countryCode: "NO", region: "Europe" },
  { city: "Copenhagen", country: "Denmark", countryCode: "DK", region: "Europe" },
  { city: "New York", country: "United States", countryCode: "US", region: "North America" },
  { city: "Los Angeles", country: "United States", countryCode: "US", region: "North America" },
  { city: "Miami", country: "United States", countryCode: "US", region: "North America" },
  { city: "San Francisco", country: "United States", countryCode: "US", region: "North America" },
  { city: "Las Vegas", country: "United States", countryCode: "US", region: "North America" },
  { city: "Chicago", country: "United States", countryCode: "US", region: "North America" },
  { city: "Toronto", country: "Canada", countryCode: "CA", region: "North America" },
  { city: "Vancouver", country: "Canada", countryCode: "CA", region: "North America" },
  { city: "Montreal", country: "Canada", countryCode: "CA", region: "North America" },
  { city: "Mexico City", country: "Mexico", countryCode: "MX", region: "North America" },
  { city: "Cancun", country: "Mexico", countryCode: "MX", region: "North America" },
  { city: "Tulum", country: "Mexico", countryCode: "MX", region: "North America" },
  { city: "Havana", country: "Cuba", countryCode: "CU", region: "North America" },
  { city: "Punta Cana", country: "Dominican Republic", countryCode: "DO", region: "North America" },
  { city: "San Jose", country: "Costa Rica", countryCode: "CR", region: "North America" },
  { city: "Rio de Janeiro", country: "Brazil", countryCode: "BR", region: "South America" },
  { city: "Sao Paulo", country: "Brazil", countryCode: "BR", region: "South America" },
  { city: "Buenos Aires", country: "Argentina", countryCode: "AR", region: "South America" },
  { city: "Patagonia", country: "Argentina", countryCode: "AR", region: "South America" },
  { city: "Lima", country: "Peru", countryCode: "PE", region: "South America" },
  { city: "Cusco", country: "Peru", countryCode: "PE", region: "South America" },
  { city: "Santiago", country: "Chile", countryCode: "CL", region: "South America" },
  { city: "Bogota", country: "Colombia", countryCode: "CO", region: "South America" },
  { city: "Cartagena", country: "Colombia", countryCode: "CO", region: "South America" },
  { city: "Quito", country: "Ecuador", countryCode: "EC", region: "South America" },
  { city: "Lima", country: "Peru", countryCode: "PE", region: "South America" },
  { city: "Tokyo", country: "Japan", countryCode: "JP", region: "Asia" },
  { city: "Kyoto", country: "Japan", countryCode: "JP", region: "Asia" },
  { city: "Osaka", country: "Japan", countryCode: "JP", region: "Asia" },
  { city: "Seoul", country: "South Korea", countryCode: "KR", region: "Asia" },
  { city: "Busan", country: "South Korea", countryCode: "KR", region: "Asia" },
  { city: "Bangkok", country: "Thailand", countryCode: "TH", region: "Asia" },
  { city: "Phuket", country: "Thailand", countryCode: "TH", region: "Asia" },
  { city: "Chiang Mai", country: "Thailand", countryCode: "TH", region: "Asia" },
  { city: "Singapore", country: "Singapore", countryCode: "SG", region: "Asia" },
  { city: "Kuala Lumpur", country: "Malaysia", countryCode: "MY", region: "Asia" },
  { city: "Penang", country: "Malaysia", countryCode: "MY", region: "Asia" },
  { city: "Bali", country: "Indonesia", countryCode: "ID", region: "Asia" },
  { city: "Jakarta", country: "Indonesia", countryCode: "ID", region: "Asia" },
  { city: "Ubud", country: "Indonesia", countryCode: "ID", region: "Asia" },
  { city: "Maldives", country: "Maldives", countryCode: "MV", region: "Asia" },
  { city: "Male", country: "Maldives", countryCode: "MV", region: "Asia" },
  { city: "Colombo", country: "Sri Lanka", countryCode: "LK", region: "Asia" },
  { city: "Galle", country: "Sri Lanka", countryCode: "LK", region: "Asia" },
  { city: "Mumbai", country: "India", countryCode: "IN", region: "Asia" },
  { city: "Delhi", country: "India", countryCode: "IN", region: "Asia" },
  { city: "Goa", country: "India", countryCode: "IN", region: "Asia" },
  { city: "Jaipur", country: "India", countryCode: "IN", region: "Asia" },
  { city: "Hong Kong", country: "Hong Kong", countryCode: "HK", region: "Asia" },
  { city: "Shanghai", country: "China", countryCode: "CN", region: "Asia" },
  { city: "Beijing", country: "China", countryCode: "CN", region: "Asia" },
  { city: "Hanoi", country: "Vietnam", countryCode: "VN", region: "Asia" },
  { city: "Ho Chi Minh City", country: "Vietnam", countryCode: "VN", region: "Asia" },
  { city: "Sydney", country: "Australia", countryCode: "AU", region: "Oceania" },
  { city: "Melbourne", country: "Australia", countryCode: "AU", region: "Oceania" },
  { city: "Brisbane", country: "Australia", countryCode: "AU", region: "Oceania" },
  { city: "Perth", country: "Australia", countryCode: "AU", region: "Oceania" },
  { city: "Auckland", country: "New Zealand", countryCode: "NZ", region: "Oceania" },
  { city: "Queenstown", country: "New Zealand", countryCode: "NZ", region: "Oceania" },
  { city: "Fiji", country: "Fiji", countryCode: "FJ", region: "Oceania" },
];

export const DESTINATION_CITIES = DESTINATIONS.map(
  (item) => `${item.city}, ${item.country}`,
);

export const DESTINATION_REGIONS = Array.from(
  DESTINATIONS.reduce((map, item) => {
    if (!map.has(item.region)) map.set(item.region, []);
    map.get(item.region)!.push(item);
    return map;
  }, new Map<string, DestinationRecord[]>()),
).map(([region, items]) => ({
  region,
  items: items.sort((a, b) => a.city.localeCompare(b.city)),
}));

export const DESTINATION_COUNTRIES: CountryRecord[] = Array.from(
  DESTINATIONS.reduce((map, item) => {
    if (!map.has(item.countryCode)) {
      map.set(item.countryCode, {
        country: item.country,
        countryCode: item.countryCode,
        region: item.region,
        cities: [],
      });
    }

    const record = map.get(item.countryCode)!;
    if (!record.cities.includes(item.city)) {
      record.cities.push(item.city);
    }

    return map;
  }, new Map<string, CountryRecord>()),
)
  .map(([, item]) => ({
    ...item,
    cities: item.cities.sort((a, b) => a.localeCompare(b)),
  }))
  .sort((a, b) => a.country.localeCompare(b.country));

export const COUNTRY_REGIONS = Array.from(
  DESTINATION_COUNTRIES.reduce((map, item) => {
    if (!map.has(item.region)) map.set(item.region, []);
    map.get(item.region)!.push(item);
    return map;
  }, new Map<string, CountryRecord[]>()),
).map(([region, items]) => ({
  region,
  items: items.sort((a, b) => a.country.localeCompare(b.country)),
}));

function searchScore(query: string, value: string) {
  const normalizedQuery = query.trim().toLowerCase();
  const normalizedValue = value.trim().toLowerCase();

  if (!normalizedQuery) return 1;
  if (normalizedValue === normalizedQuery) return 100;
  if (normalizedValue.startsWith(normalizedQuery)) return 80;
  if (normalizedValue.includes(normalizedQuery)) return 60;

  let pointer = 0;
  for (const char of normalizedValue) {
    if (char === normalizedQuery[pointer]) pointer += 1;
    if (pointer === normalizedQuery.length) return 40;
  }

  return 0;
}

export function findCountryRecord(value: string) {
  const normalized = value.trim().toLowerCase();
  return (
    DESTINATION_COUNTRIES.find(
      (item) =>
        item.country.toLowerCase() === normalized || item.countryCode.toLowerCase() === normalized,
    ) || null
  );
}

export function findDestinationRecord(value: string) {
  const normalized = value.trim().toLowerCase();
  return DESTINATIONS.find(
    (item) =>
      `${item.city}, ${item.country}`.toLowerCase() === normalized ||
      item.city.toLowerCase() === normalized,
  ) || null;
}

export function searchDestinations(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return DESTINATIONS.slice(0, 16);

  return DESTINATIONS.filter((item) => {
    const haystack = `${item.city} ${item.country} ${item.region}`.toLowerCase();
    return haystack.includes(normalized);
  }).slice(0, 16);
}

export function searchCountries(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return DESTINATION_COUNTRIES.slice(0, 18);

  return DESTINATION_COUNTRIES
    .map((item) => ({
      item,
      score: Math.max(
        searchScore(normalized, item.country),
        searchScore(normalized, item.region),
        searchScore(normalized, item.countryCode),
      ),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.item.country.localeCompare(b.item.country))
    .map((entry) => entry.item)
    .slice(0, 18);
}

export function searchCitiesByCountry(countryCode: string | null | undefined, query: string) {
  if (!countryCode) return [];

  const candidates = DESTINATIONS.filter((item) => item.countryCode === countryCode);
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return candidates.slice().sort((a, b) => a.city.localeCompare(b.city)).slice(0, 18);
  }

  return candidates
    .map((item) => ({
      item,
      score: Math.max(searchScore(normalized, item.city), searchScore(normalized, item.country)),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.item.city.localeCompare(b.item.city))
    .map((entry) => entry.item)
    .slice(0, 18);
}

export function getCountryDepartureOptions(countryCode?: string | null) {
  if (!countryCode) return [];
  return Array.from(
    new Set(
      DESTINATIONS.filter((item) => item.countryCode === countryCode).map((item) => item.city),
    ),
  );
}

const AIRPORTS: AirportRecord[] = [
  { code: "CAI", name: "Cairo International Airport", city: "Cairo", country: "Egypt", countryCode: "EG" },
  { code: "SPX", name: "Sphinx International Airport", city: "Cairo", country: "Egypt", countryCode: "EG" },
  { code: "ATH", name: "Athens International Airport", city: "Athens", country: "Greece", countryCode: "GR" },
  { code: "JTR", name: "Santorini Airport", city: "Santorini", country: "Greece", countryCode: "GR" },
  { code: "DXB", name: "Dubai International Airport", city: "Dubai", country: "United Arab Emirates", countryCode: "AE" },
  { code: "DWC", name: "Al Maktoum International Airport", city: "Dubai", country: "United Arab Emirates", countryCode: "AE" },
  { code: "LHR", name: "Heathrow Airport", city: "London", country: "United Kingdom", countryCode: "GB" },
  { code: "LGW", name: "Gatwick Airport", city: "London", country: "United Kingdom", countryCode: "GB" },
  { code: "CDG", name: "Charles de Gaulle Airport", city: "Paris", country: "France", countryCode: "FR" },
  { code: "ORY", name: "Orly Airport", city: "Paris", country: "France", countryCode: "FR" },
  { code: "FCO", name: "Leonardo da Vinci Airport", city: "Rome", country: "Italy", countryCode: "IT" },
  { code: "MXP", name: "Malpensa Airport", city: "Milan", country: "Italy", countryCode: "IT" },
  { code: "JFK", name: "John F. Kennedy International Airport", city: "New York", country: "United States", countryCode: "US" },
  { code: "LAX", name: "Los Angeles International Airport", city: "Los Angeles", country: "United States", countryCode: "US" },
  { code: "IST", name: "Istanbul Airport", city: "Istanbul", country: "Turkey", countryCode: "TR" },
  { code: "SAW", name: "Sabiha Gokcen Airport", city: "Istanbul", country: "Turkey", countryCode: "TR" },
  { code: "NRT", name: "Narita International Airport", city: "Tokyo", country: "Japan", countryCode: "JP" },
  { code: "HND", name: "Haneda Airport", city: "Tokyo", country: "Japan", countryCode: "JP" },
];

export function getAirportsByCountryCity(countryCode?: string | null, city?: string | null) {
  if (!countryCode) return [];
  const normalizedCity = city?.trim().toLowerCase();
  const scoped = AIRPORTS.filter((airport) => airport.countryCode === countryCode);
  if (!normalizedCity) return scoped;
  const cityMatches = scoped.filter((airport) => airport.city.trim().toLowerCase() === normalizedCity);
  return cityMatches.length ? cityMatches : scoped;
}
