import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createRouteClient } from "@/lib/supabase/server";
import { createOrUpdatePayment, markPaymentFailed } from "@/lib/payment/paymentHelpers";
import { isPublicPlanType, type PublicPlanType } from "@/lib/payment/passRules";
import { isDatabaseUnavailableError } from "@/lib/prisma-safe";
import { ensureUserProfile } from "@/lib/profile/ensureUserProfile";

type CheckoutRequestBody = {
  tier?: string;
  planId?: string;
  sourcePath?: string;
};

function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  ).replace(/\/+$/, "");
}

function getLemonApiKey() {
  return process.env.LEMONSQUEEZY_API_KEY || "";
}

function getLemonStoreId() {
  return process.env.LEMONSQUEEZY_STORE_ID || "";
}

function getVariantId(planType: PublicPlanType) {
  const variantMap: Record<PublicPlanType, string | undefined> = {
    starter: process.env.LEMONSQUEEZY_STARTER_VARIANT_ID,
    pro: process.env.LEMONSQUEEZY_PRO_VARIANT_ID,
    agency: process.env.LEMONSQUEEZY_AGENCY_VARIANT_ID,
  };

  const variantId = variantMap[planType];
  if (!variantId) {
    throw new Error("LEMONSQUEEZY_CONFIGURATION_MISSING");
  }

  return variantId;
}

function getUserFullName(user: {
  user_metadata?: Record<string, unknown> | null;
}) {
  const metadata = user.user_metadata ?? {};
  const fullName = metadata.full_name;
  const name = metadata.name;
  if (typeof fullName === "string" && fullName.trim()) return fullName.trim();
  if (typeof name === "string" && name.trim()) return name.trim();
  return null;
}

export async function createLemonCheckoutRoute(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as CheckoutRequestBody | null;
    const requestedPlan = body?.tier ?? body?.planId;
    const sourcePath = typeof body?.sourcePath === "string" ? body.sourcePath : "/pricing";

    if (!isPublicPlanType(requestedPlan)) {
      return NextResponse.json({ error: "Invalid package selection." }, { status: 400 });
    }

    const supabase = createRouteClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
      return NextResponse.json({ error: "Not authenticated.", code: "NOT_AUTHED" }, { status: 401 });
    }

    const apiKey = getLemonApiKey();
    const storeId = getLemonStoreId();
    const siteUrl = getSiteUrl();

    if (!apiKey || !storeId || !siteUrl) {
      return NextResponse.json(
        { error: "Lemon Squeezy environment variables are missing." },
        { status: 500 },
      );
    }

    const user = data.user;
    const email = user.email?.trim().toLowerCase() || null;
    const fullName = getUserFullName(user);

    try {
      await ensureUserProfile(user, "CHECKOUT_STARTED");
    } catch (profileError) {
      console.error("lemonsqueezy profile upsert error:", profileError);
      if (isDatabaseUnavailableError(profileError)) {
        return NextResponse.json(
          {
            error: "Checkout is temporarily unavailable because the trip database is not reachable right now.",
            code: "CHECKOUT_DB_UNAVAILABLE",
          },
          { status: 503 },
        );
      }
      return NextResponse.json(
        {
          error: "We could not prepare your profile for checkout.",
          code: "PROFILE_SETUP_REQUIRED",
          next: "/profile",
        },
        { status: 500 },
      );
    }

    let payment;
    try {
      payment = await createOrUpdatePayment({
        userId: user.id,
        customerEmail: email,
        provider: "lemonSqueezy",
        planType: requestedPlan,
        status: "PENDING",
        meta: {
          sourcePath,
          requestedPlan,
        },
      });
    } catch (paymentError) {
      console.error("lemonsqueezy payment create error:", paymentError);
      if (isDatabaseUnavailableError(paymentError)) {
        return NextResponse.json(
          {
            error: "Checkout is temporarily unavailable because payment storage cannot connect to the database.",
            code: "CHECKOUT_DB_UNAVAILABLE",
          },
          { status: 503 },
        );
      }
      throw paymentError;
    }

    const variantId = getVariantId(requestedPlan);
    const redirectUrl = `${siteUrl}/pricing?payment=success&paymentId=${encodeURIComponent(payment.id)}&plan=${encodeURIComponent(requestedPlan)}`;

    const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
      method: "POST",
      headers: {
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        data: {
          type: "checkouts",
          attributes: {
            checkout_options: {
              embed: true,
            },
            checkout_data: {
              email,
              name: fullName,
              custom: {
                paymentId: payment.id,
                userId: user.id,
                planType: requestedPlan,
                tier: requestedPlan,
                customerEmail: email,
                sourcePath,
              },
            },
            product_options: {
              redirect_url: redirectUrl,
            },
          },
          relationships: {
            store: {
              data: {
                type: "stores",
                id: String(storeId),
              },
            },
            variant: {
              data: {
                type: "variants",
                id: String(variantId),
              },
            },
          },
        },
      }),
    });

    const json = (await response.json().catch(() => null)) as
      | {
          data?: {
            id?: string;
            attributes?: {
              url?: string;
            };
          };
          errors?: Array<{ detail?: string }>;
        }
      | null;

    if (!response.ok) {
      console.error("lemonsqueezy checkout provider error:", {
        status: response.status,
        detail: json?.errors?.[0]?.detail || "Lemon checkout creation failed.",
      });

      await markPaymentFailed(payment.id, {
        checkoutCreateError: json?.errors?.[0]?.detail || "Lemon checkout creation failed.",
      });

      return NextResponse.json(
        { error: "Failed to create checkout. Please try again shortly." },
        { status: 500 },
      );
    }

    const checkoutUrl = json?.data?.attributes?.url;
    const providerCheckoutId = typeof json?.data?.id === "string" ? json.data.id : null;

    try {
      await createOrUpdatePayment({
        paymentId: payment.id,
        userId: user.id,
        customerEmail: email,
        provider: "lemonSqueezy",
        providerCheckoutId,
        planType: requestedPlan,
        status: "PENDING",
        meta: {
          sourcePath,
          requestedPlan,
          lemonVariantId: variantId,
        },
      });
    } catch (paymentUpdateError) {
      console.error("lemonsqueezy payment update error:", paymentUpdateError);
      if (!isDatabaseUnavailableError(paymentUpdateError)) {
        throw paymentUpdateError;
      }
    }

    if (!checkoutUrl) {
      return NextResponse.json(
        { error: "Checkout URL was not returned by Lemon Squeezy." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      checkoutUrl,
      paymentId: payment.id,
      planType: requestedPlan,
    });
  } catch (error) {
    console.error("lemonsqueezy create checkout error:", error);
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json(
        {
          error: "Checkout is temporarily unavailable because the database connection failed.",
          code: "CHECKOUT_DB_UNAVAILABLE",
        },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: "Unable to create checkout." }, { status: 500 });
  }
}
