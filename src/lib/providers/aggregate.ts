export type ProviderItemBase = {
  id: string;
  name: string;
  imageUrl?: string;
  deeplink: string;
  priceFrom?: number;
  currency?: string;
  rating?: number;
  durationMin?: number;
  meta?: any;
};

export type ProviderData = {
  hotels: ProviderItemBase[];
  activities: ProviderItemBase[];
  transports: ProviderItemBase[];
  flights: ProviderItemBase[];
  weather?: any;
  map?: any;
};

export async function aggregateProviderData(args: {
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  currency: string;
}): Promise<ProviderData> {
  const { destination, currency } = args;

  // TODO:
  // Replace this with Booking / Viator / TravelPayouts / Trip.com / Amadeus / Mapbox / OpenWeather.
  // Keep the SAME normalized shape.

  return {
    hotels: [
      {
        id: "hotel_1",
        name: `${destination} Grand Skyline Hotel`,
        imageUrl: "/bg/ai-skyline.jpg",
        deeplink: "#hotel_1",
        priceFrom: 220,
        currency,
        rating: 4.7,
      },
      {
        id: "hotel_2",
        name: `${destination} Marina View Suites`,
        imageUrl: "/bg/ai-skyline.jpg",
        deeplink: "#hotel_2",
        priceFrom: 180,
        currency,
        rating: 4.5,
      },
    ],
    activities: [
      {
        id: "activity_1",
        name: `${destination} Old Town Walk`,
        imageUrl: "/bg/ai-skyline.jpg",
        deeplink: "#activity_1",
        priceFrom: 25,
        currency,
        durationMin: 120,
      },
      {
        id: "activity_2",
        name: `${destination} Sunset Cruise`,
        imageUrl: "/bg/ai-skyline.jpg",
        deeplink: "#activity_2",
        priceFrom: 60,
        currency,
        durationMin: 150,
      },
      {
        id: "activity_3",
        name: `${destination} Museum District Tour`,
        imageUrl: "/bg/ai-skyline.jpg",
        deeplink: "#activity_3",
        priceFrom: 40,
        currency,
        durationMin: 180,
      },
      {
        id: "activity_4",
        name: `${destination} Premium Shopping Stop`,
        imageUrl: "/bg/ai-skyline.jpg",
        deeplink: "#activity_4",
        priceFrom: 0,
        currency,
        durationMin: 120,
      },
    ],
    transports: [
      {
        id: "transport_1",
        name: "Private transfer",
        deeplink: "#transport_1",
        priceFrom: 35,
        currency,
        durationMin: 45,
      },
      {
        id: "transport_2",
        name: "Metro + walking combo",
        deeplink: "#transport_2",
        priceFrom: 10,
        currency,
        durationMin: 55,
      },
    ],
    flights: [
      {
        id: "flight_1",
        name: "Best value flight",
        deeplink: "#flight_1",
        priceFrom: 280,
        currency,
      },
    ],
    weather: {
      summary: "Warm and mostly clear",
    },
  };
}