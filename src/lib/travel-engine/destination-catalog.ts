import {
  findCountryRecord,
  findDestinationRecord,
  getAirportsByCountryCity,
} from "@/lib/travelCatalog";
import type { DestinationCatalogEntry } from "@/lib/travel-engine/types";

const COUNTRY_TIMEZONE_MAP: Record<string, string> = {
  AE: "Asia/Dubai",
  EG: "Africa/Cairo",
  FR: "Europe/Paris",
  GB: "Europe/London",
  GR: "Europe/Athens",
  IT: "Europe/Rome",
  JP: "Asia/Tokyo",
  PT: "Europe/Lisbon",
  TH: "Asia/Bangkok",
  TR: "Europe/Istanbul",
  US: "America/New_York",
  VN: "Asia/Ho_Chi_Minh",
  CH: "Europe/Zurich",
  MA: "Africa/Casablanca",
  IS: "Atlantic/Reykjavik",
};

const DESTINATION_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "tokyo-jp": { lat: 35.6762, lng: 139.6503 },
  "kyoto-jp": { lat: 35.0116, lng: 135.7681 },
  "osaka-jp": { lat: 34.6937, lng: 135.5023 },
  "dubai-ae": { lat: 25.2048, lng: 55.2708 },
  "paris-fr": { lat: 48.8566, lng: 2.3522 },
  "lisbon-pt": { lat: 38.7223, lng: -9.1393 },
  "athens-gr": { lat: 37.9838, lng: 23.7275 },
  "santorini-gr": { lat: 36.3932, lng: 25.4615 },
  "reykjavik-is": { lat: 64.1466, lng: -21.9426 },
  "marrakech-ma": { lat: 31.6295, lng: -7.9811 },
  "bangkok-th": { lat: 13.7563, lng: 100.5018 },
  "phuket-th": { lat: 7.8804, lng: 98.3923 },
  "istanbul-tr": { lat: 41.0082, lng: 28.9784 },
  "hanoi-vn": { lat: 21.0278, lng: 105.8342 },
};

function keyFor(city: string, countryCode: string) {
  return `${city.trim().toLowerCase().replace(/\s+/g, "-")}-${countryCode.toLowerCase()}`;
}

export function resolveDestinationCatalogEntry(
  cityOrDestination: string,
  fallbackCountry?: string,
): DestinationCatalogEntry {
  const destinationRecord =
    findDestinationRecord(cityOrDestination) ||
    findDestinationRecord(cityOrDestination.split(",")[0] || cityOrDestination);
  const countryRecord = fallbackCountry ? findCountryRecord(fallbackCountry) : null;
  const city = destinationRecord?.city || cityOrDestination.split(",")[0]?.trim() || cityOrDestination;
  const country = destinationRecord?.country || countryRecord?.country || fallbackCountry || cityOrDestination;
  const countryCode = destinationRecord?.countryCode || countryRecord?.countryCode || "US";
  const coords = DESTINATION_COORDINATES[keyFor(city, countryCode)] || { lat: null, lng: null };

  return {
    id: keyFor(city, countryCode),
    city,
    country,
    countryCode,
    region: destinationRecord?.region || countryRecord?.region || "Global",
    timezone: COUNTRY_TIMEZONE_MAP[countryCode] || "UTC",
    lat: coords.lat,
    lng: coords.lng,
  };
}

export function getPrimaryAirportCode(entry: DestinationCatalogEntry) {
  return getAirportsByCountryCity(entry.countryCode, entry.city)[0]?.code || null;
}
