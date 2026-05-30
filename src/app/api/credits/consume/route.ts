import { NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { consumeCredit, CreditError, getCreditStatus } from "@/lib/credits/creditService";
import { assertRateLimits } from "@/lib/credits/rateLimitService";

export async function POST(req: Request) {
  try {
    const supabase = createRouteClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const actionType = String(body?.actionType ?? "").trim();
    const metadata = body?.metadata && typeof body.metadata === "object" ? body.metadata : undefined;

    if (!actionType) {
      return NextResponse.json({ error: "Missing actionType." }, { status: 400 });
    }

    const rateLimit = await assertRateLimits(data.user.id, actionType);
    if (!rateLimit.ok) {
      return NextResponse.json({ error: rateLimit.message, code: rateLimit.code }, { status: 429 });
    }

    await consumeCredit(data.user.id, actionType as any, metadata);
    const status = await getCreditStatus(data.user.id);
    return NextResponse.json(status, { status: 200 });
  } catch (error) {
    if (error instanceof CreditError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Failed to consume credit.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
