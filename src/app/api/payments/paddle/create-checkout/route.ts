import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { createOrUpdatePayment } from "@/lib/payment/paymentHelpers";
import { getPaddlePriceId, isPublicPlanType } from "@/lib/payment/passRules";

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteClient();
    const { data } = await supabase.auth.getUser();
    if (!data?.user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const planId = body?.planId;
    const sourcePath = typeof body?.sourcePath === "string" ? body.sourcePath : "/pricing";

    if (!isPublicPlanType(planId)) {
      return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
    }

    const apiKey = process.env.PADDLE_API_KEY;
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
    const priceId = getPaddlePriceId(planId);

    if (!apiKey || !appUrl || !priceId) {
      return NextResponse.json({ error: "Missing Paddle environment variables." }, { status: 500 });
    }

    const user = data.user;
    const fullName =
      (user.user_metadata as Record<string, unknown> | undefined)?.full_name ||
      (user.user_metadata as Record<string, unknown> | undefined)?.name ||
      null;

    await prisma.profile.upsert({
      where: { id: user.id },
      update: {
        email: user.email ?? null,
        fullName: typeof fullName === "string" ? fullName : null,
      },
      create: {
        id: user.id,
        email: user.email ?? null,
        fullName: typeof fullName === "string" ? fullName : null,
      },
    });

    const payment = await createOrUpdatePayment({
      userId: user.id,
      provider: "paddle",
      planType: planId,
      status: "PENDING",
      meta: {
        sourcePath,
        customerEmail: user.email ?? null,
      },
    });

    const payload = {
      items: [{ price_id: priceId, quantity: 1 }],
      collection_mode: "automatic",
      custom_data: {
        paymentId: payment.id,
        userId: user.id,
        planType: planId,
        sourcePath,
      },
      checkout: {
        success_url: `${appUrl}/payment/success?provider=paddle&paymentId=${payment.id}`,
        cancel_url: `${appUrl}/payment/cancelled?provider=paddle&paymentId=${payment.id}`,
      },
    };

    const response = await fetch("https://api.paddle.com/transactions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const json = (await response.json().catch(() => null)) as
      | {
          data?: {
            id?: string;
            checkout?: { url?: string };
          };
          error?: { detail?: string };
        }
      | null;

    if (!response.ok) {
      await createOrUpdatePayment({
        paymentId: payment.id,
        userId: user.id,
        provider: "paddle",
        planType: planId,
        status: "FAILED",
        meta: {
          checkoutCreateError: json?.error?.detail || "Paddle checkout creation failed.",
        },
      });
      return NextResponse.json(
        { error: json?.error?.detail || "Failed to create Paddle checkout." },
        { status: 500 },
      );
    }

    const providerOrderId = typeof json?.data?.id === "string" ? json.data.id : null;
    const checkoutUrl = json?.data?.checkout?.url;

    await createOrUpdatePayment({
      paymentId: payment.id,
      userId: user.id,
      provider: "paddle",
      providerOrderId,
      providerCheckoutId: providerOrderId,
      planType: planId,
      status: "PENDING",
    });

    if (!checkoutUrl) {
      return NextResponse.json({ error: "Checkout URL was not returned by Paddle." }, { status: 500 });
    }

    return NextResponse.json({ checkoutUrl, paymentId: payment.id });
  } catch (error) {
    console.error("paddle create checkout error:", error);
    const message = error instanceof Error ? error.message : "Unable to create checkout.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
