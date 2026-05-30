import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin/requireAdmin";

export const dynamic = "force-dynamic";

const SERVICES = [
  { key: "OpenAI", env: "OPENAI_API_KEY" },
  { key: "Supabase", env: "SUPABASE_SERVICE_ROLE_KEY" },
  { key: "Payment Provider", env: "PADDLE_API_KEY" },
  { key: "Email Provider", env: "RESEND_API_KEY" },
  { key: "Booking API", env: "BOOKING_API_KEY" },
  { key: "Flights API", env: "AMADEUS_API_KEY" },
  { key: "Hotels API", env: "BOOKING_API_KEY" },
  { key: "Activities API", env: "VIATOR_API_KEY" },
  { key: "Maps API", env: "MAPBOX_API_KEY" },
  { key: "Weather API", env: "OPENWEATHER_API_KEY" },
];

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return NextResponse.json({ ok: false, code: admin.code }, { status: 403 });

    const latest = await prisma.apiHealthLog.findMany({
      orderBy: { checkedAt: "desc" },
      distinct: ["serviceName"],
    });
    const latestMap = new Map(latest.map((item) => [item.serviceName, item]));

    return NextResponse.json({
      ok: true,
      services: SERVICES.map((service) => {
        const row = latestMap.get(service.key);
        const configured = Boolean(process.env[service.env]);
        return {
          serviceName: service.key,
          status: row?.status ?? (configured ? "OK" : "NOT_CONFIGURED"),
          responseTime: row?.responseTime ?? null,
          errorMessage: row?.errorMessage ?? (configured ? null : "Not configured"),
          checkedAt: row?.checkedAt ?? null,
          configured,
        };
      }),
    });
  } catch (error) {
    console.error("admin api-health error:", error);
    return NextResponse.json({ ok: true, services: [] });
  }
}
