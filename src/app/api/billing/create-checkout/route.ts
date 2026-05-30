import { NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

type Tier = "basic" | "pro" | "agency";

function getVariantId(tier: Tier) {
  const map = {
    basic: process.env.LEMONSQUEEZY_VARIANT_BASIC,
    pro: process.env.LEMONSQUEEZY_VARIANT_PRO,
    agency: process.env.LEMONSQUEEZY_VARIANT_AGENCY,
  } as const;

  const id = map[tier];
  if (!id) throw new Error(`Missing variant env for tier: ${tier}`);
  return id;
}

export async function POST(req: Request) {
  const supabase = createRouteClient();
  const { data } = await supabase.auth.getUser();
  if (!data?.user) return NextResponse.json({ ok: false, code: "NOT_AUTHED" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const tier = body?.tier as Tier;
  const sourcePath = typeof body?.sourcePath === "string" ? body.sourcePath : "/pricing";

  if (!tier || !["basic", "pro", "agency"].includes(tier)) {
    return NextResponse.json({ ok: false, code: "INVALID_TIER" }, { status: 400 });
  }

  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!apiKey || !storeId || !appUrl) {
    return NextResponse.json({ ok: false, code: "MISSING_ENV" }, { status: 400 });
  }

  const user = data.user;
  const fullName =
    (user.user_metadata as any)?.full_name ||
    (user.user_metadata as any)?.name ||
    null;

  await prisma.profile.upsert({
    where: { id: user.id },
    update: {
      email: user.email ?? null,
      fullName,
    },
    create: {
      id: user.id,
      email: user.email ?? null,
      fullName,
    },
  });

  const variantId = getVariantId(tier);
  const redirectUrl = `${appUrl.replace(/\/$/, "")}/signup?entry=payment&next=/ai-planner&payment=success&tier=${tier}`;

  const payload = {
    data: {
      type: "checkouts",
      attributes: {
        checkout_data: {
          custom: {
            user_id: user.id,
            tier,
            source_path: sourcePath,
            user_email: user.email ?? null,
          },
        },
        product_options: {
          redirect_url: redirectUrl,
        },
      },
      relationships: {
        store: { data: { type: "stores", id: String(storeId) } },
        variant: { data: { type: "variants", id: String(variantId) } },
      },
    },
  };

  const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
    method: "POST",
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  const json = await response.json();

  if (!response.ok) {
    return NextResponse.json({ ok: false, code: "LS_API_ERROR", details: json }, { status: 500 });
  }

  const checkoutUrl =
    json?.data?.attributes?.url ||
    json?.data?.attributes?.checkout_url ||
    json?.data?.attributes?.redirect_url;

  if (!checkoutUrl) {
    return NextResponse.json({ ok: false, code: "NO_CHECKOUT_URL", raw: json }, { status: 500 });
  }

  return NextResponse.json({ ok: true, checkoutUrl });
}
