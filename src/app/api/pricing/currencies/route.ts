import { NextResponse } from "next/server";

const fallbackRates = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  SAR: 3.75,
  AED: 3.67,
  EGP: 50,
} as const;

export async function GET() {
  try {
    return NextResponse.json({
      ok: true,
      rates: fallbackRates,
      source: "fallback",
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("pricing currencies route error", error);
    return NextResponse.json(
      {
        ok: true,
        rates: fallbackRates,
        source: "fallback",
        updatedAt: new Date().toISOString(),
      },
      { status: 200 },
    );
  }
}
