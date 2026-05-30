/**
 * dataService
 * -------------
 * This layer is responsible for:
 * - fetching data from provider APIs (Viator, Booking, etc.)
 * - normalizing it into a common internal format
 *
 * IMPORTANT RULE:
 * Engines & Plan APIs must ONLY talk to dataService.
 * Never call external APIs directly from route handlers.
 */

export type NormalizedActivity = {
  id: string; // internal id (can be providerRef)
  provider: string; // "viator" | "booking" | "stub"
  providerRef: string; // provider activity/product id

  title: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  affiliateUrl?: string | null;

  priceAmount?: number | null; // cents
  priceCurrency?: string | null;

  // engine signals (0..1)
  fatigueImpact?: number | null;
  safetyScore?: number | null;
  seasonScore?: number | null;
  preferenceScore?: number | null;
};

export type SearchActivitiesParams = {
  destination: string;
  date?: string;
  query?: string;
};

class DataService {
  /**
   * Search activities for Replace drawer
   * Later this will call Viator / GYG / etc.
   */
  async searchActivities(
    params: SearchActivitiesParams
  ): Promise<NormalizedActivity[]> {
    const q = (params.query || "").toLowerCase();

    // 🔴 STUB DATA (replace later with real provider APIs)
    const catalog: NormalizedActivity[] = [
      {
        id: "stub_1",
        provider: "stub",
        providerRef: "stub_1",
        title: "City Walking Tour",
        subtitle: "Culture • Guided",
        imageUrl:
          "https://images.pexels.com/photos/672532/pexels-photo-672532.jpeg",
        affiliateUrl: "https://affiliate.example.com/tour",
        priceAmount: 2500,
        priceCurrency: "USD",
        fatigueImpact: 0.25,
        safetyScore: 0.9,
        seasonScore: 0.8,
        preferenceScore: 0.7,
      },
      {
        id: "stub_2",
        provider: "stub",
        providerRef: "stub_2",
        title: "Museum Pass",
        subtitle: "Indoor • Family friendly",
        imageUrl:
          "https://images.pexels.com/photos/69903/pexels-photo-69903.jpeg",
        affiliateUrl: "https://affiliate.example.com/museum",
        priceAmount: 1800,
        priceCurrency: "USD",
        fatigueImpact: 0.1,
        safetyScore: 0.95,
        seasonScore: 0.85,
        preferenceScore: 0.65,
      },
      {
        id: "stub_3",
        provider: "stub",
        providerRef: "stub_3",
        title: "Desert Safari Experience",
        subtitle: "Adventure • Outdoor",
        imageUrl:
          "https://images.pexels.com/photos/753626/pexels-photo-753626.jpeg",
        affiliateUrl: "https://affiliate.example.com/safari",
        priceAmount: 4200,
        priceCurrency: "USD",
        fatigueImpact: 0.5,
        safetyScore: 0.8,
        seasonScore: 0.75,
        preferenceScore: 0.9,
      },
    ];

    if (!q) return catalog;

    return catalog.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        (a.subtitle || "").toLowerCase().includes(q)
    );
  }

  /**
   * Get a single activity by id
   * Used when replacing a timeline item
   */
  async getActivityById(
    activityId: string
  ): Promise<NormalizedActivity | null> {
    const all = await this.searchActivities({
      destination: "",
    });

    const found = all.find(
      (a) => a.id === activityId || a.providerRef === activityId
    );

    return found ?? null;
  }

  /**
   * Future examples (NOT implemented yet)
   * ------------------------------------
   * searchHotels()
   * getHotelById()
   * searchFlights()
   * getRoute()
   * getWeatherTimeline()
   */
}

export const dataService = new DataService();
