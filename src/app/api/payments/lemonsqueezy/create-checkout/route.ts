import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { getVariantIdForPlan, type LemonPlanId } from "@/lib/payments/lemonsqueezy";

type CreateCheckoutRequest = {
  planId: LemonPlanId;
  userId?: string;
  email?: string;
  name?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateCheckoutRequest;
    const supabase = createRouteClient();
    const { data } = await supabase.auth.getUser();

    const planId = body.planId;
    if (!planId || !["starter", "pro", "agency"].includes(planId)) {
      return NextResponse.json({ error: "Invalid planId." }, { status: 400 });
    }

    const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
    const storeId = process.env.LEMON_SQUEEZY_STORE_ID;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!apiKey || !storeId || !appUrl) {
      return NextResponse.json({ error: "Missing Lemon Squeezy environment variables." }, { status: 500 });
    }

    const user = data?.user;
    const userId = body.userId || user?.id;
    const email = body.email || user?.email || undefined;
    const name =
      body.name ||
      ((user?.user_metadata as Record<string, unknown> | undefined)?.full_name as string | undefined) ||
      ((user?.user_metadata as Record<string, unknown> | undefined)?.name as string | undefined) ||
      undefined;

    const variantId = getVariantIdForPlan(planId);
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
              name,
              custom: {
                planId,
                userId,
              },
            },
            product_options: {
              redirect_url: `${appUrl.replace(/\/$/, "")}/signup?entry=payment&next=/ai-planner&payment=success&plan=${planId}`,
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
            attributes?: {
              url?: string;
            };
          };
          errors?: Array<{ detail?: string }>;
        }
      | null;

    if (!response.ok) {
      return NextResponse.json(
        { error: json?.errors?.[0]?.detail || "Failed to create Lemon Squeezy checkout." },
        { status: 500 },
      );
    }

    const checkoutUrl = json?.data?.attributes?.url;
    if (!checkoutUrl) {
      return NextResponse.json({ error: "Checkout URL was not returned by Lemon Squeezy." }, { status: 500 });
    }

    return NextResponse.json({ checkoutUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create checkout.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
