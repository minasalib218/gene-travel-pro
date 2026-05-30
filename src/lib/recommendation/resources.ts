import type { DestinationResources, TripDestination } from "@/lib/recommendation/types";

function safeUrl(value?: string | null) {
  if (!value) return null;
  try {
    return new URL(value).toString();
  } catch {
    return null;
  }
}

export function buildDestinationResources(destinations: TripDestination[]): DestinationResources[] {
  return destinations.map((destination) => ({
    destinationId: destination.id,
    label: `${destination.city}, ${destination.country}`,
    offlineMaps: [
      {
        key: `${destination.id}-map`,
        title: "Offline city map",
        description: `Saved navigation package for ${destination.city} with key transit zones and arrival routing.`,
        href: safeUrl(process.env.NEXT_PUBLIC_OFFLINE_MAPS_BASE_URL)
          ? `${process.env.NEXT_PUBLIC_OFFLINE_MAPS_BASE_URL}?country=${encodeURIComponent(destination.country)}&city=${encodeURIComponent(destination.city)}`
          : null,
        source: "Offline maps",
      },
    ],
    alerts: [
      {
        id: `${destination.id}-advisory`,
        level: "info",
        title: `Travel advisory for ${destination.city}`,
        text: "Latest local guidance, area notes, and entry reminders are stored here when your trusted feed is configured.",
        source: "Local safety feed",
      },
    ],
  }));
}
