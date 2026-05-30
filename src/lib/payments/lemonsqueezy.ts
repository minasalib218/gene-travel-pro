import crypto from "node:crypto";
import { PassStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { makeClaimCode } from "@/lib/claimCode";

export type LemonPlanId = "starter" | "pro" | "agency";
export type InternalPassTier = "basic" | "pro" | "agency";

type VariantEnvKey =
  | "LEMON_SQUEEZY_VARIANT_STARTER"
  | "LEMON_SQUEEZY_VARIANT_PRO"
  | "LEMON_SQUEEZY_VARIANT_AGENCY";

type LemonCustomData = {
  planId?: LemonPlanId;
  userId?: string;
  email?: string;
  name?: string;
};

type LemonWebhookPayload = {
  meta?: {
    event_name?: string;
    custom_data?: LemonCustomData;
  };
  data?: {
    id?: string;
    type?: string;
    attributes?: Record<string, unknown>;
  };
};

const PLAN_CONFIG: Record<
  LemonPlanId,
  {
    variantEnv: VariantEnvKey;
    internalTier: InternalPassTier;
    tierActionsTotal: number;
    editDays: number;
  }
> = {
  starter: {
    variantEnv: "LEMON_SQUEEZY_VARIANT_STARTER",
    internalTier: "basic",
    tierActionsTotal: 3,
    editDays: 3,
  },
  pro: {
    variantEnv: "LEMON_SQUEEZY_VARIANT_PRO",
    internalTier: "pro",
    tierActionsTotal: 5,
    editDays: 6,
  },
  agency: {
    variantEnv: "LEMON_SQUEEZY_VARIANT_AGENCY",
    internalTier: "agency",
    tierActionsTotal: 8,
    editDays: 14,
  },
};

export function getVariantIdForPlan(planId: LemonPlanId) {
  const variantId = process.env[PLAN_CONFIG[planId].variantEnv];
  if (!variantId) {
    throw new Error(`Missing env: ${PLAN_CONFIG[planId].variantEnv}`);
  }
  return variantId;
}

export function mapPlanIdToInternalTier(planId: LemonPlanId) {
  return PLAN_CONFIG[planId].internalTier;
}

export function getPlanConfig(planId: LemonPlanId) {
  return PLAN_CONFIG[planId];
}

export function verifyLemonSignature(rawBody: string, signature: string | null, secret: string) {
  if (!signature) return false;

  const digest = Buffer.from(
    crypto.createHmac("sha256", secret).update(rawBody).digest("hex"),
    "utf8",
  );
  const providedSignature = Buffer.from(signature, "utf8");

  if (digest.length !== providedSignature.length) {
    return false;
  }

  return crypto.timingSafeEqual(digest, providedSignature);
}

function parsePaymentAmount(attributes: Record<string, unknown>) {
  const candidates = [
    attributes.total_usd,
    attributes.grand_total_usd,
    attributes.subtotal_usd,
    attributes.total,
    attributes.grand_total,
    attributes.subtotal,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return candidate >= 100 ? candidate / 100 : candidate;
    }

    if (typeof candidate === "string") {
      const cleaned = candidate.replace(/[^0-9.-]/g, "");
      const parsed = Number(cleaned);
      if (Number.isFinite(parsed)) {
        return parsed >= 100 ? parsed / 100 : parsed;
      }
    }
  }

  return null;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export async function preventDuplicateProcessing(eventKey: string) {
  // TODO: If you already have a dedicated Payment / WebhookEvents table, check that table here.
  const existing = await prisma.customerEvent.findFirst({
    where: { eventType: eventKey },
    select: { id: true },
  });

  return Boolean(existing);
}

export async function activatePassForUser(args: {
  userId: string;
  email?: string | null;
  name?: string | null;
  planId: LemonPlanId;
  eventName: string;
  orderId: string;
  source: string;
  currency: string;
  paidAmount: number | null;
}) {
  const config = getPlanConfig(args.planId);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const claimCode = makeClaimCode();

  // TODO: If your app already has a richer pass activation service, connect it here.
  await prisma.profile.upsert({
    where: { id: args.userId },
    update: {
      email: args.email ?? undefined,
      fullName: args.name ?? undefined,
    },
    create: {
      id: args.userId,
      email: args.email ?? null,
      fullName: args.name ?? null,
    },
  });

  await prisma.pass.create({
    data: {
      userId: args.userId,
      profileId: args.userId,
      tier: config.internalTier,
      status: PassStatus.ACTIVE,
      tierActionsTotal: config.tierActionsTotal,
      tierActionsUsed: 0,
      startsAt: now,
      expiresAt,
      meta: {
        claimCode,
        purchasedPlanId: args.planId,
        sourcePath: args.source,
        paidAmount: args.paidAmount,
        currency: args.currency,
        lemon: {
          eventName: args.eventName,
          orderId: args.orderId,
        },
      },
    } as any,
  });
}

export async function recordPayment(args: {
  userId?: string;
  email?: string | null;
  name?: string | null;
  planId: LemonPlanId;
  eventKey: string;
  orderId: string;
  paidAmount: number | null;
  currency: string;
  source: string;
}) {
  // TODO: If you already store payments in a dedicated Payment table, write that record here.
  await prisma.customerEvent.create({
    data: {
      userId: args.userId ?? null,
      email: args.email ?? null,
      eventType: args.eventKey,
      value: args.paidAmount ?? 0,
      currency: args.currency,
      meta: {
        orderId: args.orderId,
        planId: args.planId,
        sourcePath: args.source,
        customerName: args.name ?? null,
      },
    },
  });

  if (args.paidAmount === null) return;

  const processorFee = roundMoney(args.paidAmount * 0.05);
  const taxFee = roundMoney(args.paidAmount * 0.14);
  const fixedFee = 0.5;
  const totalExpense = roundMoney(processorFee + taxFee + fixedFee);
  const accountingDay = new Date().toISOString().slice(0, 10);
  const customerLabel =
    (args.name && args.name.trim()) ||
    (args.email && args.email.trim()) ||
    args.userId ||
    "Customer";

  await prisma.accountingEntry.createMany({
    data: [
      {
        day: accountingDay,
        kind: "INCOME",
        title: `Customer payment - ${customerLabel}`,
        amount: args.paidAmount,
        currency: args.currency,
        meta: {
          userId: args.userId ?? null,
          orderId: args.orderId,
          planId: args.planId,
          category: "customer_payment",
          sourcePath: args.source,
        },
      },
      {
        day: accountingDay,
        kind: "EXPENSE",
        title: `Payment fees - ${customerLabel}`,
        amount: totalExpense,
        currency: args.currency,
        meta: {
          userId: args.userId ?? null,
          orderId: args.orderId,
          planId: args.planId,
          category: "payment_fees",
          breakdown: {
            processorFee,
            taxFee,
            fixedFee,
          },
        },
      },
    ],
  });
}

export function getWebhookProcessingData(payload: LemonWebhookPayload) {
  const attributes = payload.data?.attributes ?? {};
  const customData = payload.meta?.custom_data ?? {};
  const eventName = payload.meta?.event_name ?? "";
  const orderId = String(payload.data?.id ?? attributes.order_number ?? attributes.identifier ?? "");

  const planId = (customData.planId ?? "starter") as LemonPlanId;
  const userId = customData.userId;
  const email =
    customData.email ||
    (typeof attributes.user_email === "string" ? attributes.user_email : null) ||
    (typeof attributes.customer_email === "string" ? attributes.customer_email : null) ||
    null;
  const name =
    customData.name ||
    (typeof attributes.user_name === "string" ? attributes.user_name : null) ||
    (typeof attributes.customer_name === "string" ? attributes.customer_name : null) ||
    null;
  const currency = String(attributes.currency ?? "USD").toUpperCase();
  const paidAmount = parsePaymentAmount(attributes);
  const source = typeof attributes.checkout_data === "object" ? "/pricing" : "/pricing";

  return {
    eventName,
    orderId,
    planId,
    userId,
    email,
    name,
    currency,
    paidAmount,
    source,
  };
}
