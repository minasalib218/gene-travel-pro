export type ProviderHotel = {
  name: string;
  price?: number;
  currency?: string;
  location?: string;
  deepLink?: string | null;
};

export type ProviderFlight = {
  airline: string;
  routeLabel: string;
  price?: number;
  currency?: string;
  deepLink?: string | null;
  baggageAllowanceLbs?: number;
  overweightFee51To70?: number;
  overweightFee71To99?: number;
};

export type ProviderActivity = {
  name: string;
  category?: string;
  price?: number;
  currency?: string;
  deepLink?: string | null;
};

export async function fetchProviderData(payload: {
  destination: string;
  startDate: string;
  endDate: string;
  departureCity: string;
  adults: number;
  kids: number;
  directOnly: boolean;
  interests: string[];
}) {
  // TEMP MOCK DATA (replace later with real APIs)

  return {
    hotels: [
      {
        name: "Central Hotel",
        location: payload.destination,
        price: 150,
        currency: "USD",
        deepLink: "#",
      },
    ],
    flights: [
      {
        airline: "Emirates",
        routeLabel: `${payload.departureCity} → ${payload.destination}`,
        price: 400,
        currency: "USD",
        deepLink: "#",
      },
    ],
    activities: [
      {
        name: "City Tour",
        category: "culture",
        price: 60,
        currency: "USD",
        deepLink: "#",
      },
    ],
  };
}
