import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { getAdminSetting, getPlanConfigs, setAdminSetting } from "@/lib/admin/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return NextResponse.json({ ok: false, code: admin.code }, { status: 403 });

    const [planConfigs, siteContent, supportSettings, affiliateSettings, analyticsSettings] = await Promise.all([
      getPlanConfigs(),
      getAdminSetting("site-content-settings", {
        homepageDestinationsVisible: true,
        homepageOffersVisible: true,
        homepageEventsVisible: true,
      }),
      getAdminSetting("support-settings", {
        supportEmail: "support@gene.com",
        notificationEmail: "",
        notificationPhone: "",
      }),
      getAdminSetting("affiliate-settings", {
        redirectEnabled: true,
        trackClicks: true,
      }),
      getAdminSetting("analytics-settings", {
        metaPixelId: "",
        gaMeasurementId: "",
        enableMetaPixel: true,
        enableGoogleAnalytics: true,
        enableInternalAnalytics: true,
      }),
    ]);

    return NextResponse.json({
      ok: true,
      settings: {
        planConfigs,
        siteContent,
        supportSettings,
        affiliateSettings,
        analyticsSettings,
        envStatus: {
          openAi: Boolean(process.env.OPENAI_API_KEY),
          supabase: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
          payment: Boolean(process.env.PADDLE_API_KEY || process.env.LEMONSQUEEZY_API_KEY),
          resend: Boolean(process.env.RESEND_API_KEY),
          metaPixel: Boolean(process.env.NEXT_PUBLIC_META_PIXEL_ID),
          googleAnalytics: Boolean(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID),
        },
      },
    });
  } catch (error) {
    console.error("admin settings get error:", error);
    return NextResponse.json({ ok: true, settings: null });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return NextResponse.json({ ok: false, code: admin.code }, { status: 403 });
    const body = await req.json().catch(() => ({}));
    const key = String(body?.key ?? "").trim();
    if (!key) return NextResponse.json({ ok: false, code: "KEY_REQUIRED" }, { status: 400 });
    await setAdminSetting(key, body?.value ?? {});
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("admin settings save error:", error);
    return NextResponse.json({ ok: false, code: "SERVER_ERROR" }, { status: 500 });
  }
}
