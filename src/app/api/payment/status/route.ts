import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { getPaymentStatusForUser, toStatusPayload } from "@/lib/payment/paymentHelpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const paymentId = req.nextUrl.searchParams.get("paymentId");
    const providerOrderId = req.nextUrl.searchParams.get("providerOrderId");
    const providerCheckoutId = req.nextUrl.searchParams.get("providerCheckoutId");

    const payment = await getPaymentStatusForUser({
      userId: data.user.id,
      paymentId,
      providerOrderId,
      providerCheckoutId,
    });

    return NextResponse.json(toStatusPayload(payment), { status: 200 });
  } catch (error) {
    console.error("payment status route error:", error);
    return NextResponse.json(
      {
        status: "UNKNOWN",
        passStatus: "NONE",
        planType: null,
        totalCredits: null,
        usedCredits: null,
        expiresAt: null,
      },
      { status: 500 },
    );
  }
}
