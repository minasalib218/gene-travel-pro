import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").toLowerCase();

  // Stub results — replace later with real provider API calls
  const results = [
    {
      id: "stub_1",
      title: "City Walking Tour (API Stub)",
      subtitle: "Culture • Guided",
      imageUrl: "https://images.pexels.com/photos/672532/pexels-photo-672532.jpeg",
      priceAmount: 2500,
      priceCurrency: "USD",
      affiliateUrl: "https://affiliate.example.com/tour",
    },
    {
      id: "stub_2",
      title: "Museum Pass (API Stub)",
      subtitle: "Indoor • Family friendly",
      imageUrl: "https://images.pexels.com/photos/69903/pexels-photo-69903.jpeg",
      priceAmount: 1800,
      priceCurrency: "USD",
      affiliateUrl: "https://affiliate.example.com/museum",
    },
  ].filter((x) => !q || x.title.toLowerCase().includes(q));

  return NextResponse.json({ activities: results });
}
