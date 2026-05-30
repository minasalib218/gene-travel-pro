import { NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { canUseAction, CreditError, getCreditStatus } from "@/lib/credits/creditService";
import { assertRateLimits } from "@/lib/credits/rateLimitService";
import { getPlanRules } from "@/lib/credits/planRules";
import { isEnvAdminCookie } from "@/lib/admin/isEnvAdmin";

export async function POST(req: Request) {
  let userId: string | null = null;
  try {
    if (isEnvAdminCookie()) {
      const body = await req.json().catch(() => ({}));
      const actionType = String(body?.actionType ?? "").trim();
      const rules = getPlanRules("agency");
      return NextResponse.json({
        ok: true,
        allowed: Boolean(actionType),
        remainingPlanCredits: 9999,
        remainingEditCredits: 9999,
        packageName: "AGENCY",
        enabledFeatures: rules.features,
        lockedFeatures: [],
        isAdminBypass: true,
      });
    }

    const supabase = createRouteClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
      return NextResponse.json({ ok: false, code: "NOT_AUTHED" }, { status: 401 });
    }
    userId = data.user.id;

    const body = await req.json().catch(() => ({}));
    const actionType = String(body?.actionType ?? "").trim();
    const requiredFeature =
      typeof body?.requiredFeature === "string" && body.requiredFeature.trim()
        ? body.requiredFeature.trim()
        : undefined;

    if (!actionType) {
      return NextResponse.json({ ok: false, code: "ACTION_TYPE_REQUIRED" }, { status: 400 });
    }

    const usage = await canUseAction(userId, actionType as never, requiredFeature);
    const rateLimit = await assertRateLimits(userId, actionType);
    if (!rateLimit.ok) {
      return NextResponse.json({
        ok: true,
        allowed: false,
        reason: rateLimit.message,
        code: rateLimit.code,
        remainingPlanCredits: usage.status.mainCreditsRemaining,
        remainingEditCredits: usage.status.editCreditsRemaining,
        packageName: usage.status.packageName,
      });
    }

    return NextResponse.json({
      ok: true,
      allowed: true,
      remainingPlanCredits: usage.status.mainCreditsRemaining,
      remainingEditCredits: usage.status.editCreditsRemaining,
      packageName: usage.status.packageName,
      enabledFeatures: usage.status.features,
      lockedFeatures: usage.status.lockedFeatures,
      isAdminBypass: usage.status.isAdminBypass,
    });
  } catch (error) {
    if (error instanceof CreditError) {
      let status;
      try {
        status = userId ? await getCreditStatus(userId) : null;
      } catch {
        status = null;
      }
      return NextResponse.json({
        ok: true,
        allowed: false,
        code: error.code,
        reason: error.message,
        remainingPlanCredits: status?.mainCreditsRemaining ?? 0,
        remainingEditCredits: status?.editCreditsRemaining ?? 0,
        packageName: status?.packageName ?? null,
      });
    }

    console.error("pass check error:", error);
    return NextResponse.json({
      ok: true,
      allowed: false,
      code: "SERVER_ERROR",
      reason: "Unable to verify package access right now.",
    });
  }
}
