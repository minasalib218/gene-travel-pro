import { NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { getActivePassOrNull } from "@/lib/require-pass";
import { getLockedFeatures, getPackageName, getPlanRules, normalizePlanType } from "@/lib/credits/planRules";
import { isAdmin } from "@/lib/access/canUseAi";
import { requireAdmin } from "@/lib/admin/requireAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (admin.ok) {
      return NextResponse.json(
        {
          ok: true,
          hasPass: true,
          canUseAi: true,
          remaining: 9999,
          isAdminBypass: true,
          pass: {
            tier: "admin-bypass",
            status: "ACTIVE",
          },
        },
        { status: 200 },
      );
    }

    const supabase = createRouteClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
      return NextResponse.json({ ok: false, code: "NOT_AUTHED" }, { status: 401 });
    }

    if (await isAdmin(data.user.id)) {
      const rules = getPlanRules("agency");
      return NextResponse.json({
        ok: true,
        hasPass: true,
        canUseAi: true,
        remaining: 9999,
        remainingPlanCredits: 9999,
        remainingEditCredits: 9999,
        packageName: "AGENCY",
        enabledFeatures: rules.features,
        lockedFeatures: [],
        isAdminBypass: true,
        pass: {
          tier: "admin-bypass",
          planType: "agency",
          status: "ACTIVE",
        },
      });
    }

    const pass = await getActivePassOrNull(data.user.id);
    if (!pass) {
      return NextResponse.json({
        ok: true,
        hasPass: false,
        canUseAi: false,
        remaining: 0,
        remainingPlanCredits: 0,
        remainingEditCredits: 0,
        packageName: null,
        enabledFeatures: [],
        lockedFeatures: getLockedFeatures("starter"),
      }, { status: 200 });
    }

    const normalizedPlanType = normalizePlanType(pass.planType || pass.tier || "starter");
    const rules = getPlanRules(normalizedPlanType);
    const total = Number(pass.mainCreditsTotal || pass.tierActionsTotal || rules.mainCreditsTotal);
    const used = Number(pass.mainCreditsUsed || pass.tierActionsUsed || 0);
    const remaining = Math.max(0, total - used);
    const editRemaining = Math.max(
      Number(pass.editCreditsTotal || rules.editCreditsTotal) - Number(pass.editCreditsUsed || 0),
      0,
    );

    return NextResponse.json({
      ok: true,
      hasPass: true,
      canUseAi: remaining > 0,
      pass,
      remaining,
      remainingPlanCredits: remaining,
      remainingEditCredits: editRemaining,
      packageName: getPackageName(normalizedPlanType),
      enabledFeatures: rules.features,
      lockedFeatures: getLockedFeatures(normalizedPlanType),
    });
  } catch (e: any) {
    console.error("pass status error:", e);
    return NextResponse.json(
      { ok: false, code: "INTERNAL_ERROR", message: "Unable to load pass status right now." },
      { status: 500 },
    );
  }
}
