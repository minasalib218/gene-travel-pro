import { findCountryRecord, findDestinationRecord, getAirportsByCountryCity } from "@/lib/travelCatalog";
import type { PlanInputPayload } from "@/lib/validations/plan-input";

function extractAirportCode(value?: string | null) {
  if (!value) return null;
  const match = value.match(/\(([A-Z0-9]{3})\)\s*$/);
  if (match) return match[1];
  const trimmed = value.trim().toUpperCase();
  return /^[A-Z0-9]{3}$/.test(trimmed) ? trimmed : null;
}

function inferAirportCodeFromCountryCity(country?: string | null, city?: string | null) {
  const countryRecord = country ? findCountryRecord(country) : null;
  const destinationRecord = city ? findDestinationRecord(city) : null;
  const countryCode = countryRecord?.countryCode || destinationRecord?.countryCode;
  const airport = getAirportsByCountryCity(countryCode, destinationRecord?.city || city || "")[0];
  return airport?.code || null;
}

function inferDestinationAirportCode(payload: PlanInputPayload) {
  const primaryDestination = payload.trip.destinations?.[0];
  const city = primaryDestination?.city || payload.trip.destination;
  const country = primaryDestination?.country || payload.trip.destination;
  const countryRecord = findCountryRecord(country);
  const destinationRecord = findDestinationRecord(city) || findDestinationRecord(payload.trip.destination);
  const countryCode = countryRecord?.countryCode || destinationRecord?.countryCode;
  const airports = getAirportsByCountryCity(countryCode, destinationRecord?.city || city);
  return airports[0]?.code || null;
}

function formatTravelpayoutsDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const dd = `${date.getUTCDate()}`.padStart(2, "0");
  const mm = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  return `${dd}${mm}`;
}

export function buildTravelpayoutsFlightLegUrl(args: {
  originAirport?: string | null;
  originCountry?: string | null;
  originCity?: string | null;
  destinationCountry?: string | null;
  destinationCity?: string | null;
  departDate: string;
  returnDate?: string | null;
  adults?: number;
  children?: number;
  elderly?: number;
  cabinClass?: string | null;
  directFlightsOnly?: boolean;
}) {
  const marker = process.env.TRAVELPAYOUTS_MARKER_AVIA || process.env.TRAVELPAYOUTS_MARKER;
  const originCode =
    extractAirportCode(args.originAirport) ||
    inferAirportCodeFromCountryCity(args.originCountry, args.originCity);
  const destinationCode = inferAirportCodeFromCountryCity(
    args.destinationCountry,
    args.destinationCity,
  );
  const departureAt = formatTravelpayoutsDate(args.departDate);
  const returnAt = args.returnDate ? formatTravelpayoutsDate(args.returnDate) : null;

  if (!originCode || !destinationCode || !departureAt) return null;

  const adults = Math.max(args.adults || 1, 1);
  const children = Math.max(args.children || 0, 0);
  const infants = 0;
  const tripClass =
    args.cabinClass === "business" || args.cabinClass === "first" ? "C" : "Y";
  const routeToken = `${originCode}${departureAt}${destinationCode}${returnAt || ""}${adults}${children}${infants}`;
  const url = new URL(`https://www.aviasales.com/search/${routeToken}`);

  if (marker) {
    url.searchParams.set("marker", marker);
  }

  url.searchParams.set("adults", String(adults));
  if (children > 0) url.searchParams.set("children", String(children));
  if ((args.elderly || 0) > 0) {
    url.searchParams.set("passengers", String(adults + children + Math.max(args.elderly || 0, 0)));
  }
  url.searchParams.set("origin_iata", originCode);
  url.searchParams.set("destination_iata", destinationCode);
  url.searchParams.set("depart_date", args.departDate);
  if (args.returnDate) url.searchParams.set("return_date", args.returnDate);
  url.searchParams.set("trip_class", tripClass);
  if (args.directFlightsOnly) {
    url.searchParams.set("with_request", "true");
  }

  return url.toString();
}

export function buildTravelpayoutsFlightSearchUrl(payload: PlanInputPayload) {
  const primaryDestination = payload.trip.destinations?.[0];
  return buildTravelpayoutsFlightLegUrl({
    originAirport: payload.trip.travellingFrom?.airport || payload.trip.preferredAirport,
    originCountry: payload.trip.travellingFrom?.country,
    originCity: payload.trip.travellingFrom?.city || payload.trip.departureCity,
    destinationCountry: primaryDestination?.country || payload.trip.destination,
    destinationCity: primaryDestination?.city || payload.trip.destination,
    departDate: payload.trip.startDate,
    returnDate: payload.trip.endDate,
    adults: payload.trip.adults,
    children: payload.trip.kids,
    elderly: payload.trip.elderly,
    cabinClass: payload.flight.cabinClass,
    directFlightsOnly: payload.flight.directFlightsOnly,
  });
}
