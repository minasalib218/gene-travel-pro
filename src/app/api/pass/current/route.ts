import { NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { getCreditStatus } from "@/lib/credits/creditService";
import { getPlanRules } from "@/lib/credits/planRules";
import { isEnvAdminCookie } from "@/lib/admin/isEnvAdmin";

export async function GET() {
  try {
    if (isEnvAdminCookie()) {
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
    return NextResponse.json(
      { ok: false, code: "PASS_UNAVAILABLE", message: error instanceof Error ? error.message : "Unable to load pass." },
      { status: 200 },
    );
  }
}
