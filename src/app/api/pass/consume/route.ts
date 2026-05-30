import { NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { consumeCredit, CreditError, getCreditStatus } from "@/lib/credits/creditService";
import { getPlanRules } from "@/lib/credits/planRules";
import { isEnvAdminCookie } from "@/lib/admin/isEnvAdmin";

export async function POST(req: Request) {
  let userId: string | null = null;
  try {
    if (isEnvAdminCookie()) {
      const rules = getPlanRules("agency");
      return NextResponse.json({
        ok: true,
        consumed: true,
        packageName: "AGENCY",
        remainingPlanCredits: 9999,
        remainingEditCredits: 9999,
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
    const relatedPlanId =
      typeof body?.relatedPlanId === "string" && body.relatedPlanId.trim()
        ? body.relatedPlanId.trim()
        : null;

    if (!actionType) {
      return NextResponse.json({ ok: false, code: "ACTION_TYPE_REQUIRED" }, { status: 400 });
    }

    const result = await consumeCredit(userId, actionType as never, {
      relatedPlanId,
      amount: body?.amount ?? 1,
      source: "api/pass/consume",
    });

    const status = "status" in result ? result.status : await getCreditStatus(userId);

    return NextResponse.json({
      ok: true,
      consumed: true,
      packageName: status.packageName,
      remainingPlanCredits: status.mainCreditsRemaining,
      remainingEditCredits: status.editCreditsRemaining,
      enabledFeatures: status.features,
      lockedFeatures: status.lockedFeatures,
      isAdminBypass: status.isAdminBypass,
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
        ok: false,
        code: error.code,
        message: error.message,
        remainingPlanCredits: status?.mainCreditsRemaining ?? 0,
        remainingEditCredits: status?.editCreditsRemaining ?? 0,
        packageName: status?.packageName ?? null,
      }, { status: 400 });
    }

    console.error("pass consume error:", error);
    return NextResponse.json({ ok: false, code: "SERVER_ERROR", message: "Unable to consume package credit." }, { status: 500 });
  }
}
