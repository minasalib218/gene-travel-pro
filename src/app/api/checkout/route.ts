import { NextRequest, NextResponse } from "next/server";

const tierToUrl = (tier: string | null) => {
  if (!tier) return null;

  // Put your real Lemon checkout URLs in .env.local
  if (tier === "basic") return process.env.LEMON_CHECKOUT_URL_BASIC || null;
  if (tier === "pro") return process.env.LEMON_CHECKOUT_URL_PRO || null;
  if (tier === "agency") return process.env.LEMON_CHECKOUT_URL_AGENCY || null;

  return null;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tier = searchParams.get("tier");

  const url = tierToUrl(tier);

  if (!url) {
    return NextResponse.json(
      { error: "Checkout URL not configured" },
      { status: 400 }
    );
  }

  return NextResponse.json({ url });
}
