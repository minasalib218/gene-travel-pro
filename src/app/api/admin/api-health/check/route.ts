import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin/requireAdmin";

export const dynamic = "force-dynamic";

const ENV_BY_SERVICE: Record<string, string> = {
  OpenAI: "OPENAI_API_KEY",
  Supabase: "SUPABASE_SERVICE_ROLE_KEY",
  "Payment Provider": "PADDLE_API_KEY",
  "Email Provider": "RESEND_API_KEY",
  "Booking API": "BOOKING_API_KEY",
  "Flights API": "AMADEUS_API_KEY",
  "Hotels API": "BOOKING_API_KEY",
  "Activities API": "VIATOR_API_KEY",
  "Maps API": "MAPBOX_API_KEY",
  "Weather API": "OPENWEATHER_API_KEY",
};

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return NextResponse.json({ ok: false, code: admin.code }, { status: 403 });
    const body = await req.json().catch(() => ({}));
    const serviceName = String(body?.serviceName ?? "").trim();
    if (!serviceName) return NextResponse.json({ ok: false, code: "SERVICE_REQUIRED" }, { status: 400 });

    const envKey = ENV_BY_SERVICE[serviceName];
    const configured = envKey ? Boolean(process.env[envKey]) : false;
    const started = Date.now();
    const row = await prisma.apiHealthLog.create({
      data: {
        serviceName,
        status: configured ? "OK" : "NOT_CONFIGURED",
        responseTime: Date.now() - started,
        errorMessage: configured ? null : "Not configured",
      },
    });

    return NextResponse.json({ ok: true, health: row });
  } catch (error) {
    console.error("admin api-health check error:", error);
    return NextResponse.json({ ok: false, code: "SERVER_ERROR" }, { status: 500 });
  }
}
