import { buildDeepLink } from "@/lib/providers/buildDeepLink";
import { buildBookingHotelLink } from "@/lib/affiliates/bookinglinks";
import type {
  ActivityRecommendation,
  CarRecommendation,
  FlightRecommendation,
  HiddenGemResult,
  HotelRecommendation,
  LiveBookingMeta,
  RecommendationPayload,
  RecommendationBase,
  TransportRecommendation,
} from "@/lib/recommendation/types";

function normalizeSafeUrl(value?: string | null) {
  if (!value || value === "#") return null;
  try {
    return new URL(value).toString();
  } catch {
    return null;
  }
}

function priceLabel(price: number | null | undefined, currency = "USD") {
  if (price == null || Number.isNaN(price)) return "Price unavailable";
  return `${currency} ${Math.round(price)}`;
}

function withMeta<T extends RecommendationBase>(
  item: T,
  meta: LiveBookingMeta,
): T {
  return {
    ...item,
    deepLink: meta.bookingUrl,
    liveBooking: meta,
  };
}

function inferProvider(item: RecommendationBase) {
  const provider = item.provider?.toLowerCase() || item.sourceBadge?.toLowerCase() || "";
  if (provider.includes("booking")) return "booking" as const;
  if (provider.includes("viator")) return "viator" as const;
  if (provider.includes("travelpayouts")) return "travelpayouts" as const;
  if (provider.includes("amadeus")) return "amadeus" as const;
  return null;
}

function getHotelMeta(item: HotelRecommendation, payload: RecommendationPayload): LiveBookingMeta {
  const fallbackUrl = normalizeSafeUrl(item.deepLink);
  const bookingUrl =
    fallbackUrl ||
    buildBookingHotelLink({
      providerId: item.id,
      destination: payload.inputs.destination,
      checkIn: payload.inputs.startDate,
      checkOut: payload.inputs.endDate,
      adults: payload.inputs.travelersCount,
    });
  return {
    status: bookingUrl ? "live" : "unavailable",
    provider: item.provider,
    label: priceLabel(item.nightlyPrice, payload.inputs.currency),
    bookingUrl,
    price: item.nightlyPrice,
    currency: payload.inputs.currency,
  };
}

function getDeepLinkMeta(
  item: FlightRecommendation | ActivityRecommendation | TransportRecommendation | CarRecommendation | HiddenGemResult,
  payload: RecommendationPayload,
  price: number,
): LiveBookingMeta {
  const safeUrl = normalizeSafeUrl(item.deepLink);
  const provider = inferProvider(item);
  const bookingUrl =
    safeUrl && provider ? buildDeepLink({ provider, rawUrl: safeUrl }) : safeUrl;
  return {
    status: bookingUrl ? "live" : "fallback",
    provider: item.provider,
    label: priceLabel(price, payload.inputs.currency),
    bookingUrl,
    price,
    currency: payload.inputs.currency,
  };
}

export function enrichRecommendationPayloadWithLiveBooking(
  payload: RecommendationPayload,
): RecommendationPayload {
  const hotels = payload.groups.hotels.map((item) => withMeta(item, getHotelMeta(item, payload)));
  const flights = payload.groups.flights.map((item) => withMeta(item, getDeepLinkMeta(item, payload, item.fare)));
  const activities = payload.groups.activities.map((item) => withMeta(item, getDeepLinkMeta(item, payload, item.price)));
  const hiddenGems = payload.groups.hiddenGems.map((item) =>
    withMeta(item, {
      status: item.affiliateUrl ? "live" : "unavailable",
      provider: item.provider,
      label: priceLabel(item.priceFrom, payload.inputs.currency),
      bookingUrl: normalizeSafeUrl(item.affiliateUrl || item.deepLink),
      price: item.priceFrom,
      currency: payload.inputs.currency,
    }),
  );
  const restaurants = payload.groups.restaurants.map((item) =>
    withMeta(item, {
      status: "fallback",
      provider: item.provider,
      label: priceLabel(item.pricePerPerson, payload.inputs.currency),
      bookingUrl: normalizeSafeUrl(item.deepLink),
      price: item.pricePerPerson,
      currency: payload.inputs.currency,
    }),
  );
  const transports = payload.groups.transports.map((item) => withMeta(item, getDeepLinkMeta(item, payload, item.cost)));
  const cars = payload.groups.cars.map((item) => withMeta(item, getDeepLinkMeta(item, payload, item.dailyPrice)));

  const livePricing: RecommendationPayload["livePricing"] = {};
  [...hotels, ...flights, ...activities, ...hiddenGems, ...restaurants, ...transports, ...cars].forEach((item) => {
    livePricing[item.id] = item.liveBooking!;
  });

  const selected = {
    hotel: payload.selected.hotel ? hotels.find((item) => item.id === payload.selected.hotel?.id) ?? payload.selected.hotel : null,
    flight: payload.selected.flight ? flights.find((item) => item.id === payload.selected.flight?.id) ?? payload.selected.flight : null,
    activities: payload.selected.activities.map((item) => activities.find((match) => match.id === item.id) ?? item),
    hiddenGems: payload.selected.hiddenGems.map((item) => hiddenGems.find((match) => match.id === item.id) ?? item),
    restaurant: payload.selected.restaurant ? restaurants.find((item) => item.id === payload.selected.restaurant?.id) ?? payload.selected.restaurant : null,
    transport: payload.selected.transport ? transports.find((item) => item.id === payload.selected.transport?.id) ?? payload.selected.transport : null,
    car: payload.selected.car ? cars.find((item) => item.id === payload.selected.car?.id) ?? payload.selected.car : null,
  };

  return {
    ...payload,
    groups: {
      hotels,
      flights,
      activities,
      hiddenGems,
      restaurants,
      transports,
      cars,
    },
    selected,
    livePricing,
  };
}
