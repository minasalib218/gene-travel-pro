import type {
  HiddenGemResult,
  RecommendationPayload,
  RecommendationSummaryState,
  SelectedRecommendations,
  TripDestination,
  UserTripInput,
} from "@/lib/recommendation/types";

type BookingState = NonNullable<RecommendationSummaryState["bookingState"]>;
type BookingItem = BookingState["items"][number];

function travelerPriceTotal({
  adultPrice,
  childPrice,
  fixedPrice,
  adults,
  kids,
  elderly,
  quantity = 1,
}: {
  adultPrice?: number | null;
  childPrice?: number | null;
  fixedPrice?: number | null;
  adults: number;
  kids: number;
  elderly: number;
  quantity?: number;
}) {
  const safeQuantity = Math.max(quantity, 1);
  const hasAdult = typeof adultPrice === "number";
  const hasChild = typeof childPrice === "number";
  const hasFixed = typeof fixedPrice === "number";
  if (!hasAdult && !hasChild && !hasFixed) return null;
  const adultCount = Math.max(adults, 0) + Math.max(elderly, 0);
  const childCount = Math.max(kids, 0);
  const adultUnit = hasAdult ? Number(adultPrice) : hasChild ? Number(childPrice) : 0;
  const childUnit = hasChild ? Number(childPrice) : adultUnit;
  return (adultUnit * adultCount + childUnit * childCount + (hasFixed ? Number(fixedPrice) : 0)) * safeQuantity;
}

function tripDayCount(inputs: UserTripInput) {
  const start = new Date(inputs.startDate);
  const end = new Date(inputs.endDate);
  const diff = Math.ceil((end.getTime() - start.getTime()) / 86400000);
  return Math.max(diff || 0, 1);
}

function destinationCatalog(inputs: UserTripInput) {
  const listed =
    inputs.destinations?.length
      ? inputs.destinations
      : [
          {
            id: "primary",
            city: inputs.destination,
            country: inputs.destination,
          } satisfies TripDestination,
        ];
  return listed.map((stop, index) => ({
    id: stop.id || `${stop.city || "stop"}-${index}`,
    city: stop.city || inputs.destination,
    country: stop.country || "",
    destination: [stop.city, stop.country].filter(Boolean).join(", "),
    durationNights: Math.max(Number(stop.durationNights || 0), 0),
  }));
}

function getOriginLabel(payload: RecommendationPayload) {
  const trip = (payload.inputs.fullInput as Record<string, any> | undefined)?.trip;
  const travellingFrom = trip?.travellingFrom as
    | { country?: string; city?: string; airport?: string }
    | undefined;
  return (
    [travellingFrom?.city, travellingFrom?.country, travellingFrom?.airport].filter(Boolean).join(" | ") ||
    payload.inputs.departureCity ||
    null
  );
}

function buildUpgrade(
  item: any,
  type: BookingItem["type"],
  travelerCount: number,
) {
  if (type === "hotel" && item?.selectedUpgrade?.name) {
    return {
      name: String(item.selectedUpgrade.name),
      price: Number(item.selectedUpgrade.extraPrice ?? item.selectedUpgrade.totalPrice ?? 0),
    };
  }
  if (type === "flight" && item?.selectedUpgrade?.name) {
    return {
      name: String(item.selectedUpgrade.name),
      price: Number(item.selectedUpgrade.extraPrice ?? 0) * Math.max(travelerCount, 1),
    };
  }
  return null;
}

function getAffiliateUrl(item: any) {
  return item?.affiliateUrl ?? item?.liveBooking?.bookingUrl ?? null;
}

function getDestinationIdFromItem(item: any, fallbackId?: string) {
  return item?.destinationId || fallbackId || "primary";
}

function getDestinationLabelFromItem(item: any, payload: RecommendationPayload, fallbackId?: string) {
  if (item?.destinationLabel) return String(item.destinationLabel);
  const found = destinationCatalog(payload.inputs).find((stop) => stop.id === getDestinationIdFromItem(item, fallbackId));
  return found?.destination || payload.inputs.destination;
}

function bookingItemBase(
  payload: RecommendationPayload,
  existingByKey: Map<string, BookingItem>,
  args: {
    key: string;
    id: string;
    type: BookingItem["type"];
    item: any;
    destinationId?: string;
    subtitle?: string | null;
    price?: number | null;
    pricePerPerson?: number | null;
    finalPrice: number;
  },
): BookingItem {
  const travelerCount = Math.max(payload.inputs.travelersCount || 1, 1);
  const previous = existingByKey.get(args.key);
  return {
    id: args.id,
    key: args.key,
    type: args.type,
    destinationId: args.destinationId,
    title: String(args.item?.name ?? args.item?.title ?? "Selected item"),
    provider: args.item?.provider ?? null,
    affiliateProvider: args.item?.provider ?? args.item?.sourceBadge ?? null,
    price: typeof args.price === "number" ? args.price : null,
    pricePerPerson: typeof args.pricePerPerson === "number" ? args.pricePerPerson : null,
    travelerCount,
    upgrade: buildUpgrade(args.item, args.type, travelerCount),
    finalPrice: Number.isFinite(args.finalPrice) ? Math.max(args.finalPrice, 0) : 0,
    status: previous?.status ?? "pending",
    affiliateRedirectUrl: getAffiliateUrl(args.item),
    image: args.item?.imageUrl ?? null,
    subtitle: args.subtitle ?? getDestinationLabelFromItem(args.item, payload, args.destinationId),
  };
}

function getSelectionStops(payload: RecommendationPayload) {
  const catalog = destinationCatalog(payload.inputs);
  if (payload.selectedByDestination && Object.keys(payload.selectedByDestination).length > 0) {
    return catalog.map((stop) => ({
      ...stop,
      selected: payload.selectedByDestination?.[stop.id] ?? null,
    }));
  }
  return [
    {
      ...catalog[0],
      selected: payload.selected,
    },
  ];
}

function getActivityTypeFromGem(gem: HiddenGemResult): BookingItem["type"] {
  if (gem.category === "local_event") return "event";
  return "trip";
}

function getFlightPrice(item: any, inputs: UserTripInput) {
  return travelerPriceTotal({
    adultPrice: item?.priceAdult ?? item?.totalFare ?? item?.totalPrice ?? item?.fare,
    childPrice: item?.priceChild,
    fixedPrice: item?.fixedPrice,
    adults: Number(inputs.adults ?? 0),
    kids: Number(inputs.kids ?? 0),
    elderly: Number(inputs.elderly ?? 0),
  });
}

function getPerTravelerPrice(item: any, inputs: UserTripInput) {
  return travelerPriceTotal({
    adultPrice: item?.priceAdult ?? item?.totalPrice ?? item?.price ?? item?.priceFrom ?? item?.pricePerPerson,
    childPrice: item?.priceChild,
    fixedPrice: item?.fixedPrice,
    adults: Number(inputs.adults ?? 0),
    kids: Number(inputs.kids ?? 0),
    elderly: Number(inputs.elderly ?? 0),
  });
}

function getHotelPrice(item: any, inputs: UserTripInput, nightsOverride?: number) {
  const nightly = item?.selectedUpgrade?.totalPrice ?? item?.totalPrice ?? item?.nightlyPrice ?? 0;
  const roomCount = Math.max(1, Number(inputs.roomCount ?? 1));
  const nights = Number(nightsOverride || 0) > 0 ? Number(nightsOverride) : tripDayCount(inputs);
  return nightly * roomCount * nights;
}

function getTransportPrice(item: any, inputs: UserTripInput, daysOverride?: number) {
  if (typeof item?.cost === "number") return item.cost;
  if (typeof item?.dailyPrice === "number") {
    const days = Number(daysOverride || 0) > 0 ? Number(daysOverride) : tripDayCount(inputs);
    return item.dailyPrice * days;
  }
  if (typeof item?.totalPrice === "number") return item.totalPrice;
  return 0;
}

export function buildBookingStateFromPayload(payload: RecommendationPayload): BookingState {
  const existingByKey = new Map(
    (payload.summaryState?.bookingState?.items || []).map((item) => [item.key, item]),
  );
  const items: BookingItem[] = [];

  for (const stop of getSelectionStops(payload)) {
    const selected = stop.selected as SelectedRecommendations | null;
    if (!selected) continue;

    if (selected.flight) {
      const finalPrice = getFlightPrice(selected.flight, payload.inputs) ?? 0;
      items.push(
        bookingItemBase(payload, existingByKey, {
          key: `flight:${stop.id}:${selected.flight.id}`,
          id: selected.flight.id,
          type: "flight",
          item: selected.flight,
          destinationId: stop.id,
          subtitle: `${selected.flight.airline} | ${selected.flight.route}`,
          price: selected.flight.fare ?? null,
          finalPrice,
        }),
      );
    }

    if (selected.hotel) {
      const finalPrice = getHotelPrice(selected.hotel, payload.inputs, stop.durationNights);
      items.push(
        bookingItemBase(payload, existingByKey, {
          key: `hotel:${stop.id}:${selected.hotel.id}`,
          id: selected.hotel.id,
          type: "hotel",
          item: selected.hotel,
          destinationId: stop.id,
          subtitle: `${selected.hotel.area} | ${getDestinationLabelFromItem(selected.hotel, payload, stop.id)}`,
          price: selected.hotel.nightlyPrice ?? null,
          finalPrice,
        }),
      );
    }

    if (selected.transport) {
      items.push(
        bookingItemBase(payload, existingByKey, {
          key: `transport:${stop.id}:${selected.transport.id}`,
          id: selected.transport.id,
          type: "transportation",
          item: selected.transport,
          destinationId: stop.id,
          subtitle: `${selected.transport.transportType} | ${selected.transport.duration}`,
          price: selected.transport.cost ?? null,
          finalPrice: getTransportPrice(selected.transport, payload.inputs, stop.durationNights),
        }),
      );
    }

    if (selected.car) {
      items.push(
        bookingItemBase(payload, existingByKey, {
          key: `car:${stop.id}:${selected.car.id}`,
          id: selected.car.id,
          type: "transportation",
          item: selected.car,
          destinationId: stop.id,
          subtitle: `${selected.car.carType} | ${selected.car.transmission}`,
          price: selected.car.dailyPrice ?? null,
          finalPrice: getTransportPrice(selected.car, payload.inputs, stop.durationNights),
        }),
      );
    }

    if (selected.restaurant) {
      const finalPrice = getPerTravelerPrice(selected.restaurant, payload.inputs) ?? 0;
      items.push(
        bookingItemBase(payload, existingByKey, {
          key: `restaurant:${stop.id}:${selected.restaurant.id}`,
          id: selected.restaurant.id,
          type: "restaurant",
          item: selected.restaurant,
          destinationId: stop.id,
          subtitle: `${selected.restaurant.cuisine} | ${selected.restaurant.mealWindow}`,
          price: selected.restaurant.pricePerPerson ?? null,
          pricePerPerson: selected.restaurant.pricePerPerson ?? null,
          finalPrice,
        }),
      );
    }

    for (const activity of selected.activities || []) {
      const finalPrice = getPerTravelerPrice(activity, payload.inputs) ?? 0;
      items.push(
        bookingItemBase(payload, existingByKey, {
          key: `activity:${stop.id}:${activity.id}`,
          id: activity.id,
          type: "activity",
          item: activity,
          destinationId: stop.id,
          subtitle: `${activity.categoryLabel} | ${activity.bestTimeOfDay}`,
          price: activity.price ?? null,
          finalPrice,
        }),
      );
    }

    for (const gem of selected.hiddenGems || []) {
      const type = getActivityTypeFromGem(gem);
      const finalPrice = getPerTravelerPrice(gem, payload.inputs) ?? 0;
      items.push(
        bookingItemBase(payload, existingByKey, {
          key: `${type}:${stop.id}:${gem.id}`,
          id: gem.id,
          type,
          item: gem,
          destinationId: stop.id,
          subtitle: `${gem.categoryLabel || gem.category.replaceAll("_", " ")} | ${gem.city || gem.destination}`,
          price: gem.priceFrom ?? gem.totalPrice ?? null,
          finalPrice,
        }),
      );
    }
  }

  const activeItems = items.filter((item) => item.status !== "cancelled");
  const sumByType = (matcher: (item: BookingItem) => boolean) =>
    activeItems.filter(matcher).reduce((sum, item) => sum + item.finalPrice, 0);

  return {
    items,
    totals: {
      flights: sumByType((item) => item.type === "flight"),
      hotels: sumByType((item) => item.type === "hotel"),
      transportation: sumByType((item) => item.type === "transportation"),
      trips: sumByType((item) => item.type === "trip" || item.type === "activity"),
      events: sumByType((item) => item.type === "event"),
      restaurants: sumByType((item) => item.type === "restaurant"),
      totalConfirmedCost: activeItems.reduce((sum, item) => sum + item.finalPrice, 0),
      totalActivities: activeItems.filter((item) => ["restaurant", "event", "trip", "activity"].includes(item.type)).length,
      bookedClickedCount: items.filter((item) => item.status === "clicked").length,
      pendingCount: items.filter((item) => item.status === "pending").length,
      cancelledCount: items.filter((item) => item.status === "cancelled").length,
    },
    routeOverview: {
      originLabel: getOriginLabel(payload),
      stopLabels: destinationCatalog(payload.inputs).map((stop) => stop.destination),
    },
  };
}

export function updateBookingItemStatus(
  bookingState: BookingState | undefined,
  key: string,
  status: BookingItem["status"],
): BookingState | undefined {
  if (!bookingState) return bookingState;
  return {
    ...bookingState,
    items: bookingState.items.map((item) => (item.key === key ? { ...item, status } : item)),
  };
}

export function refreshBookingTotals(bookingState: BookingState): BookingState {
  const activeItems = bookingState.items.filter((item) => item.status !== "cancelled");
  const sum = (predicate: (item: BookingItem) => boolean) =>
    activeItems.filter(predicate).reduce((total, item) => total + item.finalPrice, 0);
  return {
    ...bookingState,
    totals: {
      flights: sum((item) => item.type === "flight"),
      hotels: sum((item) => item.type === "hotel"),
      transportation: sum((item) => item.type === "transportation"),
      trips: sum((item) => item.type === "trip" || item.type === "activity"),
      events: sum((item) => item.type === "event"),
      restaurants: sum((item) => item.type === "restaurant"),
      totalConfirmedCost: activeItems.reduce((total, item) => total + item.finalPrice, 0),
      totalActivities: activeItems.filter((item) => ["restaurant", "event", "trip", "activity"].includes(item.type)).length,
      bookedClickedCount: bookingState.items.filter((item) => item.status === "clicked").length,
      pendingCount: bookingState.items.filter((item) => item.status === "pending").length,
      cancelledCount: bookingState.items.filter((item) => item.status === "cancelled").length,
    },
  };
}
