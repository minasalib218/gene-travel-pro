import { NextResponse } from "next/server";
import { getAdminSetting } from "@/lib/admin/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stored = await getAdminSetting("analytics-settings", {
      metaPixelId: "",
      gaMeasurementId: "",
      enableMetaPixel: true,
      enableGoogleAnalytics: true,
      enableInternalAnalytics: true,
    });

    const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID || stored.metaPixelId || "";
    const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || stored.gaMeasurementId || "";

    return NextResponse.json({
      ok: true,
      config: {
        metaPixelId,
        gaMeasurementId,
        enableMetaPixel: Boolean(metaPixelId) && stored.enableMetaPixel !== false,
        enableGoogleAnalytics: Boolean(gaMeasurementId) && stored.enableGoogleAnalytics !== false,
        enableInternalAnalytics: stored.enableInternalAnalytics !== false,
      },
    });
  } catch (error) {
    console.error("analytics config error:", error);
    return NextResponse.json({
      ok: true,
      config: {
        metaPixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID || "",
        gaMeasurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "",
        enableMetaPixel: Boolean(process.env.NEXT_PUBLIC_META_PIXEL_ID),
        enableGoogleAnalytics: Boolean(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID),
        enableInternalAnalytics: true,
      },
    });
  }
}
