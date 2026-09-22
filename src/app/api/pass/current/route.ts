import { NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { getCreditStatus } from "@/lib/credits/creditService";
import { getPlanRules } from "@/lib/credits/planRules";
import { requireAdmin } from "@/lib/admin/requireAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (admin.ok) {
      const rules = getPlanRules("agency");
      return NextResponse.json({
        ok: true,
        pass: {
          packageName: "AGENCY",
          planType: "agency",
          status: "ACTIVE",
          remainingPlanCredits: 9999,
          remainingEditCredits: 9999,
          enabledFeatures: rules.features,
          lockedFeatures: [],
          expiresAt: null,
          isAdminBypass: true,
        },
      });
    }

    const supabase = createRouteClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
      return NextResponse.json({ ok: false, code: "NOT_AUTHED" }, { status: 401 });
    }

    const status = await getCreditStatus(data.user.id);

    return NextResponse.json({
      ok: true,
      pass: {
        packageName: status.packageName,
        planType: status.planType,
        status: status.status,
        remainingPlanCredits: status.mainCreditsRemaining,
        remainingEditCredits: status.editCreditsRemaining,
        enabledFeatures: status.features,
        lockedFeatures: status.lockedFeatures,
        expiresAt: status.expiresAt,
        isAdminBypass: status.isAdminBypass,
      },
    });
  } catch (error) {
    console.error("current pass route error:", error);
    return NextResponse.json(
      { ok: false, code: "PASS_UNAVAILABLE", message: "Unable to load pass right now." },
      { status: 200 },
    );
  }
}
