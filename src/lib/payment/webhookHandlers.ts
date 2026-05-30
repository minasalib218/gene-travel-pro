import { NextResponse } from "next/server";
import { PassStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  getCreditsForPlan,
  getPassRule,
  isPublicPlanType,
  type PublicPlanType,
} from "@/lib/payment/passRules";
import { getPlanRules } from "@/lib/credits/planRules";
import { verifyLemonWebhook, verifyPaddleWebhook } from "@/lib/payment/webhookSecurity";

type PaymentProvider = "paddle" | "lemonSqueezy";
type PaymentState = "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "DISPUTED" | "REFUND_REVIEW";
type PaymentEventKind = "success" | "failed" | "refund" | "subscription_created" | "subscription_updated" | "subscription_cancelled" | "ignored";

type NormalizedWebhookEvent = {
  provider: PaymentProvider;
  eventId: string;
  eventType: string;
  kind: PaymentEventKind;
  customerEmail: string | null;
  providerCustomerId: string | null;
  providerOrderId: string | null;
  providerCheckoutId: string | null;
  providerPaymentId: string | null;
  subscriptionId: string | null;
  amount: number | null;
  currency: string | null;
  planType: PublicPlanType;
  userId: string | null;
  payload: Record<string, unknown>;
};

type CreateOrUpdatePaymentInput = {
  paymentId?: string | null;
  userId?: string | null;
  customerEmail?: string | null;
  provider: PaymentProvider;
  providerCustomerId?: string | null;
  providerOrderId?: string | null;
  providerCheckoutId?: string | null;
  providerPaymentId?: string | null;
  subscriptionId?: string | null;
  planType: string;
  amount?: number | null;
  currency?: string | null;
  status?: PaymentState;
  meta?: Record<string, unknown> | null;
};

type PrimaryAction = {
  label: string;
  href: string;
};

type PaymentStatusPayload = {
  status: "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "UNKNOWN";
  passStatus: "ACTIVE" | "EXPIRED" | "REFUNDED" | "CANCELED" | "NONE";
  planType: string | null;
  totalCredits: number | null;
  usedCredits: number | null;
  expiresAt: string | null;
  paymentId?: string | null;
  amount?: number | null;
  currency?: string | null;
  provider?: string | null;
  providerOrderId?: string | null;
};

const PADDLE_SUCCESS_EVENTS = new Set(["transaction.paid", "transaction.completed"]);
const PADDLE_FAILED_EVENTS = new Set(["transaction.payment_failed"]);
const PADDLE_REFUND_EVENTS = new Set(["transaction.refunded"]);
const PADDLE_SUBSCRIPTION_CREATED_EVENTS = new Set(["subscription.created"]);
const PADDLE_SUBSCRIPTION_UPDATED_EVENTS = new Set(["subscription.updated"]);
const PADDLE_SUBSCRIPTION_CANCELLED_EVENTS = new Set(["subscription.canceled", "subscription.cancelled"]);

const LEMON_SUCCESS_EVENTS = new Set(["order_created", "subscription_payment_success"]);
const LEMON_FAILED_EVENTS = new Set(["order_payment_failed", "subscription_payment_failed"]);
const LEMON_REFUND_EVENTS = new Set(["order_refunded", "refund_created"]);
const LEMON_SUBSCRIPTION_CREATED_EVENTS = new Set(["subscription_created"]);
const LEMON_SUBSCRIPTION_UPDATED_EVENTS = new Set(["subscription_updated"]);
const LEMON_SUBSCRIPTION_CANCELLED_EVENTS = new Set(["subscription_cancelled"]);

function mergeMeta(currentMeta: unknown, nextMeta: Record<string, unknown> | null | undefined) {
  const base =
    currentMeta && typeof currentMeta === "object" && !Array.isArray(currentMeta)
      ? (currentMeta as Record<string, unknown>)
      : {};
  return nextMeta ? { ...base, ...nextMeta } : base;
}

function normalizePlanType(value: unknown): PublicPlanType {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "agency") return "agency";
  if (normalized === "pro") return "pro";
  if (normalized === "starter" || normalized === "basic") return "starter";
  if (normalized.includes("agency")) return "agency";
  if (normalized.includes("pro")) return "pro";
  return "starter";
}

function parseAmount(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;

  const cleaned = value.replace(/[^0-9.-]/g, "").trim();
  if (!cleaned) return null;

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function centsToAmount(value: unknown) {
  const amount = parseAmount(value);
  if (amount === null) return null;
  return amount >= 100 ? amount / 100 : amount;
}

function detectProvider(headers: Headers, payload: Record<string, unknown>): PaymentProvider | null {
  if (headers.get("paddle-signature") || typeof payload.event_type === "string") {
    return "paddle";
  }

  const meta = payload.meta;
  if (
    headers.get("x-signature") ||
    (meta && typeof meta === "object" && typeof (meta as Record<string, unknown>).event_name === "string")
  ) {
    return "lemonSqueezy";
  }

  return null;
}

function detectKind(provider: PaymentProvider, eventType: string): PaymentEventKind {
  if (provider === "paddle") {
    if (PADDLE_SUCCESS_EVENTS.has(eventType)) return "success";
    if (PADDLE_FAILED_EVENTS.has(eventType)) return "failed";
    if (PADDLE_REFUND_EVENTS.has(eventType)) return "refund";
    if (PADDLE_SUBSCRIPTION_CREATED_EVENTS.has(eventType)) return "subscription_created";
    if (PADDLE_SUBSCRIPTION_UPDATED_EVENTS.has(eventType)) return "subscription_updated";
    if (PADDLE_SUBSCRIPTION_CANCELLED_EVENTS.has(eventType)) return "subscription_cancelled";
    return "ignored";
  }

  if (LEMON_SUCCESS_EVENTS.has(eventType)) return "success";
  if (LEMON_FAILED_EVENTS.has(eventType)) return "failed";
  if (LEMON_REFUND_EVENTS.has(eventType)) return "refund";
  if (LEMON_SUBSCRIPTION_CREATED_EVENTS.has(eventType)) return "subscription_created";
  if (LEMON_SUBSCRIPTION_UPDATED_EVENTS.has(eventType)) return "subscription_updated";
  if (LEMON_SUBSCRIPTION_CANCELLED_EVENTS.has(eventType)) return "subscription_cancelled";
  return "ignored";
}

function normalizePaddleEvent(payload: Record<string, unknown>): NormalizedWebhookEvent {
  const data = (payload.data ?? {}) as Record<string, unknown>;
  const customData = (data.custom_data ?? {}) as Record<string, unknown>;
  const details = (data.details ?? {}) as Record<string, unknown>;
  const totals = (details.totals ?? {}) as Record<string, unknown>;
  const customer = (data.customer ?? {}) as Record<string, unknown>;

  const eventType = String(payload.event_type ?? "");
  const eventId = String(payload.event_id ?? payload.notification_id ?? data.id ?? "");

  return {
    provider: "paddle",
    eventId,
    eventType,
    kind: detectKind("paddle", eventType),
    customerEmail:
      (typeof customer.email === "string" ? customer.email : null) ??
      (typeof customData.customerEmail === "string" ? customData.customerEmail : null),
    providerCustomerId:
      typeof data.customer_id === "string"
        ? data.customer_id
        : typeof customer.id === "string"
          ? customer.id
          : null,
    providerOrderId: typeof data.id === "string" ? data.id : null,
    providerCheckoutId:
      typeof customData.checkoutId === "string"
        ? customData.checkoutId
        : typeof data.id === "string"
          ? data.id
          : null,
    providerPaymentId: typeof data.id === "string" ? data.id : null,
    subscriptionId:
      typeof data.subscription_id === "string"
        ? data.subscription_id
        : typeof data.subscription_id === "number"
          ? String(data.subscription_id)
          : null,
    amount: centsToAmount(totals.grand_total ?? totals.total),
    currency: typeof data.currency_code === "string" ? data.currency_code : "USD",
    planType: normalizePlanType(customData.planType),
    userId: typeof customData.userId === "string" ? customData.userId : null,
    payload,
  };
}

function normalizeLemonEvent(payload: Record<string, unknown>): NormalizedWebhookEvent {
  const meta = (payload.meta ?? {}) as Record<string, unknown>;
  const customData = (meta.custom_data ?? {}) as Record<string, unknown>;
  const data = (payload.data ?? {}) as Record<string, unknown>;
  const attrs = (data.attributes ?? {}) as Record<string, unknown>;
  const eventType = String(meta.event_name ?? "");
  const rawIdentifier =
    (typeof attrs.order_id === "string" ? attrs.order_id : null) ??
    (typeof data.id === "string" ? data.id : null) ??
    (typeof attrs.identifier === "string" ? attrs.identifier : null) ??
    (typeof attrs.subscription_id === "string" ? attrs.subscription_id : null) ??
    (typeof attrs.subscription_item_id === "string" ? attrs.subscription_item_id : null) ??
    String(attrs.created_at ?? "");
  const eventId = `lemon:${eventType}:${rawIdentifier}`;

  const amount =
    parseAmount(attrs.total_usd) ??
    parseAmount(attrs.grand_total_usd) ??
    centsToAmount(attrs.total ?? attrs.grand_total ?? attrs.subtotal ?? attrs.amount);

  return {
    provider: "lemonSqueezy",
    eventId,
    eventType,
    kind: detectKind("lemonSqueezy", eventType),
    customerEmail:
      (typeof attrs.user_email === "string" ? attrs.user_email : null) ??
      (typeof attrs.customer_email === "string" ? attrs.customer_email : null) ??
      (typeof attrs.email === "string" ? attrs.email : null) ??
      (typeof customData.customerEmail === "string" ? customData.customerEmail : null) ??
      (typeof customData.email === "string" ? customData.email : null),
    providerCustomerId:
      typeof attrs.customer_id === "string"
        ? attrs.customer_id
        : typeof attrs.user_id === "string"
          ? attrs.user_id
          : null,
    providerOrderId:
      (typeof attrs.order_id === "string" ? attrs.order_id : null) ??
      (typeof data.id === "string" ? data.id : null),
    providerCheckoutId:
      (typeof attrs.identifier === "string" ? attrs.identifier : null) ??
      (typeof customData.checkoutId === "string" ? customData.checkoutId : null),
    providerPaymentId:
      (typeof attrs.transaction_id === "string" ? attrs.transaction_id : null) ??
      (typeof data.id === "string" ? data.id : null),
    subscriptionId:
      (typeof attrs.subscription_id === "string" ? attrs.subscription_id : null) ??
      (typeof data.id === "string" && eventType.startsWith("subscription_") ? data.id : null),
    amount,
    currency:
      (typeof attrs.currency === "string" ? attrs.currency : null) ??
      (typeof attrs.currency_code === "string" ? attrs.currency_code : null) ??
      "USD",
    planType: normalizePlanType(customData.planType ?? customData.tier ?? attrs.variant_name),
    userId:
      (typeof customData.userId === "string" ? customData.userId : null) ??
      (typeof customData.user_id === "string" ? customData.user_id : null),
    payload,
  };
}

async function findUserIdByEmail(email: string | null) {
  if (!email) return null;
  const profile = await prisma.profile.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true },
  });
  return profile?.id ?? null;
}

function getAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000"
  ).replace(/\/+$/, "");
}

function formatPlanLabel(planType: string) {
  if (planType === "agency") return "Agency";
  if (planType === "pro") return "Pro";
  if (planType === "basic") return "Basic";
  return "Basic";
}

async function sendLoggedEmail(args: {
  userId?: string | null;
  customerEmail?: string | null;
  paymentId?: string | null;
  type: string;
  subject: string;
  html: string;
}) {
  const log = await prisma.emailLog.create({
    data: {
      userId: args.userId ?? null,
      customerEmail: args.customerEmail ?? null,
      paymentId: args.paymentId ?? null,
      type: args.type,
      provider: process.env.RESEND_API_KEY ? "resend" : "none",
      status: "PENDING",
    },
  });

  if (!process.env.RESEND_API_KEY) {
    const message = "Email skipped: Resend not configured";
    console.info(message, { type: args.type, to: args.customerEmail ?? null });
    await prisma.emailLog.update({
      where: { id: log.id },
      data: { status: "FAILED", errorMessage: message },
    });
    return;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Gene Travel <no-reply@gene.travel>",
        to: [args.customerEmail],
        subject: args.subject,
        html: args.html,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      await prisma.emailLog.update({
        where: { id: log.id },
        data: { status: "FAILED", errorMessage: body.slice(0, 500) },
      });
      return;
    }

    await prisma.emailLog.update({
      where: { id: log.id },
      data: { status: "SENT" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Email send failed.";
    await prisma.emailLog.update({
      where: { id: log.id },
      data: { status: "FAILED", errorMessage: message.slice(0, 500) },
    });
  }
}

async function sendPassActivatedEmailInternal(payment: Awaited<ReturnType<typeof prisma.payment.findUnique>>, pass: Awaited<ReturnType<typeof prisma.pass.findUnique>>) {
  if (!payment?.customerEmail || !pass) return;

  const appUrl = getAppUrl();
  const credits = pass.tierActionsTotal - pass.tierActionsUsed;

  await sendLoggedEmail({
    userId: payment.userId,
    customerEmail: payment.customerEmail,
    paymentId: payment.id,
    type: "PASS_ACTIVATED",
    subject: `Your Gene ${formatPlanLabel(payment.planType)} pass is active`,
    html: `
      <div style="font-family:Arial,sans-serif;padding:24px;background:#080808;color:#f5f5f5">
        <h2 style="color:#ff7a00;margin:0 0 12px">Your Gene pass is active</h2>
        <p>Your ${formatPlanLabel(payment.planType)} plan is ready with <strong>${credits}</strong> credits.</p>
        <p><a href="${appUrl}/ai-planner" style="color:#ff7a00">Start planning</a> · <a href="${appUrl}/profile" style="color:#ff7a00">Go to profile</a></p>
      </div>
    `,
  });
}

async function findExistingLedgerEntry(paymentId: string, type: string) {
  return prisma.creditLedger.findFirst({
    where: { paymentId, type },
    select: { id: true },
  });
}

async function createCreditLedgerIfMissing(args: {
  userId?: string | null;
  customerEmail?: string | null;
  passId?: string | null;
  paymentId?: string | null;
  type: string;
  amount: number;
  reason?: string | null;
}) {
  if (args.paymentId) {
    const existing = await findExistingLedgerEntry(args.paymentId, args.type);
    if (existing) return existing;
  }

  return prisma.creditLedger.create({
    data: {
      userId: args.userId ?? null,
      customerEmail: args.customerEmail ?? null,
      passId: args.passId ?? null,
      paymentId: args.paymentId ?? null,
      type: args.type,
      amount: args.amount,
      reason: args.reason ?? null,
    },
  });
}

async function verifyWebhook(provider: PaymentProvider, rawBody: string, headers: Headers) {
  if (provider === "paddle") {
    return verifyPaddleWebhook(
      rawBody,
      headers.get("paddle-signature"),
      process.env.PADDLE_WEBHOOK_SECRET || "",
    );
  }

  return verifyLemonWebhook(
    rawBody,
    headers.get("x-signature"),
    process.env.LEMONSQUEEZY_WEBHOOK_SECRET || "",
  );
}

async function normalizeWebhookEvent(
  rawBody: string,
  headers: Headers,
) {
  const payload = JSON.parse(rawBody) as Record<string, unknown>;
  const provider = detectProvider(headers, payload);

  if (!provider) {
    throw new Error("Unable to detect payment webhook provider.");
  }

  const isValid = await verifyWebhook(provider, rawBody, headers);
  if (!isValid) {
    return { invalid: true as const, provider, payload };
  }

  const event = provider === "paddle" ? normalizePaddleEvent(payload) : normalizeLemonEvent(payload);
  if (!event.eventId) {
    throw new Error("Webhook event is missing a stable event id.");
  }

  return { invalid: false as const, provider, payload, event };
}

async function maybeAttachUserId(input: CreateOrUpdatePaymentInput) {
  if (input.userId) return input.userId;
  return findUserIdByEmail(input.customerEmail ?? null);
}

async function findPaymentForUpdate(input: CreateOrUpdatePaymentInput) {
  if (input.paymentId) {
    const payment = await prisma.payment.findUnique({ where: { id: input.paymentId } });
    if (payment) return payment;
  }

  if (input.providerPaymentId) {
    const payment = await prisma.payment.findUnique({ where: { providerPaymentId: input.providerPaymentId } });
    if (payment) return payment;
  }

  if (input.providerOrderId) {
    const payment = await prisma.payment.findUnique({ where: { providerOrderId: input.providerOrderId } });
    if (payment) return payment;
  }

  if (input.providerCheckoutId) {
    const payment = await prisma.payment.findUnique({ where: { providerCheckoutId: input.providerCheckoutId } });
    if (payment) return payment;
  }

  return null;
}

export async function saveWebhookEvent(args: {
  provider: PaymentProvider;
  eventId: string;
  eventType: string;
  payload: unknown;
}) {
  const existing = await prisma.webhookEvent.findUnique({ where: { eventId: args.eventId } });
  if (existing) return existing;

  return prisma.webhookEvent.create({
    data: {
      provider: args.provider,
      eventId: args.eventId,
      eventType: args.eventType,
      payload: args.payload as never,
      processed: false,
    },
  });
}

export async function markWebhookProcessed(eventId: string) {
  return prisma.webhookEvent.update({
    where: { eventId },
    data: {
      processed: true,
      errorMessage: null,
      processedAt: new Date(),
    },
  });
}

export async function markWebhookFailed(eventId: string, errorMessage: string) {
  return prisma.webhookEvent.update({
    where: { eventId },
    data: {
      processed: false,
      errorMessage: errorMessage.slice(0, 1000),
    },
  });
}

export async function createOrUpdatePayment(input: CreateOrUpdatePaymentInput) {
  const existing = await findPaymentForUpdate(input);
  const userId = await maybeAttachUserId(input);

  if (existing) {
    return prisma.payment.update({
      where: { id: existing.id },
      data: {
        userId: userId ?? existing.userId,
        customerEmail: input.customerEmail ?? existing.customerEmail,
        provider: input.provider,
        providerCustomerId: input.providerCustomerId ?? existing.providerCustomerId,
        providerOrderId: input.providerOrderId ?? existing.providerOrderId,
        providerCheckoutId: input.providerCheckoutId ?? existing.providerCheckoutId,
        providerPaymentId: input.providerPaymentId ?? existing.providerPaymentId,
        subscriptionId: input.subscriptionId ?? existing.subscriptionId,
        planType: input.planType,
        amount: input.amount ?? existing.amount,
        currency: input.currency ?? existing.currency ?? "USD",
        status: input.status ?? (existing.status as PaymentState),
        meta: mergeMeta(existing.meta, input.meta) as never,
      },
    });
  }

  return prisma.payment.create({
    data: {
      userId,
      customerEmail: input.customerEmail ?? null,
      provider: input.provider,
      providerCustomerId: input.providerCustomerId ?? null,
      providerOrderId: input.providerOrderId ?? null,
      providerCheckoutId: input.providerCheckoutId ?? null,
      providerPaymentId: input.providerPaymentId ?? null,
      subscriptionId: input.subscriptionId ?? null,
      planType: input.planType,
      amount: input.amount ?? null,
      currency: input.currency ?? "USD",
      status: input.status ?? "PENDING",
      meta: (input.meta ?? undefined) as never,
    },
  });
}

export async function activatePassForPayment(paymentId: string) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      include: { pass: true },
    });

    if (!payment) {
      throw new Error("Payment not found.");
    }

    const planType = normalizePlanType(payment.planType);
    const credits = getCreditsForPlan(planType);
    const userId = payment.userId ?? (await findUserIdByEmail(payment.customerEmail ?? null));
    const rule = getPassRule(planType);
    const creditRule = getPlanRules(planType);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + rule.expiresInDays * 24 * 60 * 60 * 1000);

    if (payment.pass && payment.pass.status === PassStatus.ACTIVE) {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: "PAID", userId: userId ?? payment.userId },
      });
      return payment.pass;
    }

    const shouldRenewExisting = Boolean(payment.subscriptionId && (userId || payment.customerEmail));
    let activePass =
      shouldRenewExisting
        ? await tx.pass.findFirst({
            where: {
              status: PassStatus.ACTIVE,
              OR: [
                userId ? { userId } : undefined,
                payment.customerEmail ? { customerEmail: payment.customerEmail } : undefined,
              ].filter(Boolean) as never,
            },
            orderBy: { createdAt: "desc" },
          })
        : null;

    if (activePass) {
      const renewed = await tx.pass.update({
        where: { id: activePass.id },
        data: {
          userId: userId ?? activePass.userId,
          profileId: userId ?? activePass.profileId,
          customerEmail: payment.customerEmail ?? activePass.customerEmail,
          planType,
          tier: rule.internalTier,
          tierActionsTotal: activePass.tierActionsTotal + credits,
          mainCreditsTotal: activePass.mainCreditsTotal + creditRule.mainCreditsTotal,
          editCreditsTotal: activePass.editCreditsTotal + creditRule.editCreditsTotal,
          whatIfFreeTotal: activePass.whatIfFreeTotal + creditRule.whatIfFreeTotal,
          chatMessagesTotal:
            creditRule.chatMessagesTotal === null
              ? null
              : (activePass.chatMessagesTotal ?? 0) + creditRule.chatMessagesTotal,
          expertReviewTotal: activePass.expertReviewTotal + creditRule.expertReviewTotal,
          expiresAt,
          meta: mergeMeta(activePass.meta, {
            latestPaymentId: payment.id,
            renewedFromSubscription: payment.subscriptionId ?? null,
            planType,
            packageName: creditRule.packageName,
            features: creditRule.features,
          }) as never,
        },
      });

      await tx.payment.update({
        where: { id: payment.id },
        data: { status: "PAID", userId: userId ?? payment.userId },
      });

      return renewed;
    }

    const createdPass = await tx.pass.create({
      data: {
        userId,
        profileId: userId,
        customerEmail: payment.customerEmail,
        paymentId: payment.id,
        planType,
        tier: rule.internalTier,
        status: PassStatus.ACTIVE,
        tierActionsTotal: credits,
        tierActionsUsed: 0,
        mainCreditsTotal: creditRule.mainCreditsTotal,
        mainCreditsUsed: 0,
        editCreditsTotal: creditRule.editCreditsTotal,
        editCreditsUsed: 0,
        whatIfFreeTotal: creditRule.whatIfFreeTotal,
        whatIfFreeUsed: 0,
        chatMessagesTotal: creditRule.chatMessagesTotal,
        chatMessagesUsed: 0,
        expertReviewTotal: creditRule.expertReviewTotal,
        expertReviewUsed: 0,
        startsAt: now,
        expiresAt,
        meta: {
          paymentProvider: payment.provider,
          providerOrderId: payment.providerOrderId,
          providerCheckoutId: payment.providerCheckoutId,
          providerPaymentId: payment.providerPaymentId,
          subscriptionId: payment.subscriptionId,
          planType,
          packageName: creditRule.packageName,
          features: creditRule.features,
        } as never,
      },
    });

    await tx.payment.update({
      where: { id: payment.id },
      data: { status: "PAID", userId: userId ?? payment.userId },
    });

    return createdPass;
  });
}

export async function markPaymentFailed(paymentId: string, meta?: Record<string, unknown>) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) return null;

  return prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "FAILED",
      meta: mergeMeta(payment.meta, meta) as never,
    },
  });
}

export async function markPaymentRefunded(paymentId: string, meta?: Record<string, unknown>) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) return null;

  return prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "REFUNDED",
      meta: mergeMeta(payment.meta, meta) as never,
    },
  });
}

export async function removeCreditsAfterRefund(paymentId: string) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      include: { pass: true },
    });

    if (!payment || !payment.pass) {
      return { payment, pass: null, locked: false };
    }

    const remainingCredits = Math.max(payment.pass.tierActionsTotal - payment.pass.tierActionsUsed, 0);

    if (payment.pass.tierActionsUsed > 0) {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: "DISPUTED" },
      });

      const existing = paymentId
        ? await tx.creditLedger.findFirst({
            where: { paymentId, type: "REFUND_LOCK" },
            select: { id: true },
          })
        : null;

      if (!existing) {
        await tx.creditLedger.create({
          data: {
            userId: payment.userId,
            customerEmail: payment.customerEmail,
            passId: payment.pass.id,
            paymentId: payment.id,
            type: "REFUND_LOCK",
            amount: 0,
            reason: "Refund requested after credits were already used.",
          },
        });
      }

      return { payment, pass: payment.pass, locked: true };
    }

    await tx.pass.update({
      where: { id: payment.pass.id },
      data: {
        status: PassStatus.REFUNDED,
        tierActionsTotal: 0,
        tierActionsUsed: 0,
      },
    });

    const existingRemoval = paymentId
      ? await tx.creditLedger.findFirst({
          where: { paymentId, type: "CREDIT_REMOVED" },
          select: { id: true },
        })
      : null;

    if (!existingRemoval) {
      await tx.creditLedger.create({
        data: {
          userId: payment.userId,
          customerEmail: payment.customerEmail,
          passId: payment.pass.id,
          paymentId: payment.id,
          type: "CREDIT_REMOVED",
          amount: remainingCredits * -1,
          reason: "Refund completed with unused credits removed.",
        },
      });
    }

    await tx.payment.update({
      where: { id: payment.id },
      data: { status: "REFUNDED" },
    });

    return { payment, pass: payment.pass, locked: false };
  });
}

export async function sendPaymentSuccessEmail(paymentId: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { pass: true },
  });

  if (!payment?.customerEmail) return;

  const credits = payment.pass
    ? Math.max(payment.pass.tierActionsTotal - payment.pass.tierActionsUsed, 0)
    : getCreditsForPlan(payment.planType);
  const appUrl = getAppUrl();

  await sendLoggedEmail({
    userId: payment.userId,
    customerEmail: payment.customerEmail,
    paymentId: payment.id,
    type: "PAYMENT_SUCCESS",
    subject: `Payment received for your Gene ${formatPlanLabel(payment.planType)} plan`,
    html: `
      <div style="font-family:Arial,sans-serif;padding:24px;background:#080808;color:#f5f5f5">
        <h2 style="color:#ff7a00;margin:0 0 12px">Payment successful</h2>
        <p>Your ${formatPlanLabel(payment.planType)} package has been received.</p>
        <p>Credits included: <strong>${credits}</strong></p>
        <p><a href="${appUrl}/ai-planner" style="color:#ff7a00">Start my AI plan</a> · <a href="${appUrl}/profile" style="color:#ff7a00">Go to profile</a></p>
      </div>
    `,
  });

  if (payment.pass) {
    await sendPassActivatedEmailInternal(payment, payment.pass);
  }
}

export async function sendPaymentFailedEmail(paymentId: string) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment?.customerEmail) return;

  const appUrl = getAppUrl();

  await sendLoggedEmail({
    userId: payment.userId,
    customerEmail: payment.customerEmail,
    paymentId: payment.id,
    type: "PAYMENT_FAILED",
    subject: `Payment issue with your Gene ${formatPlanLabel(payment.planType)} plan`,
    html: `
      <div style="font-family:Arial,sans-serif;padding:24px;background:#080808;color:#f5f5f5">
        <h2 style="color:#ff7a00;margin:0 0 12px">Payment not completed</h2>
        <p>We could not complete payment for your ${formatPlanLabel(payment.planType)} plan.</p>
        <p><a href="${appUrl}/pricing" style="color:#ff7a00">Try payment again</a></p>
      </div>
    `,
  });
}

export async function sendRefundEmail(paymentId: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { pass: true },
  });
  if (!payment?.customerEmail) return;

  const appUrl = getAppUrl();

  await sendLoggedEmail({
    userId: payment.userId,
    customerEmail: payment.customerEmail,
    paymentId: payment.id,
    type: "REFUND_CONFIRMATION",
    subject: `Refund update for your Gene ${formatPlanLabel(payment.planType)} plan`,
    html: `
      <div style="font-family:Arial,sans-serif;padding:24px;background:#080808;color:#f5f5f5">
        <h2 style="color:#ff7a00;margin:0 0 12px">Refund update</h2>
        <p>Your refund request for the ${formatPlanLabel(payment.planType)} plan has been processed.</p>
        <p><a href="${appUrl}/profile" style="color:#ff7a00">Review your profile</a></p>
      </div>
    `,
  });
}

async function handleSuccessLikeEvent(event: NormalizedWebhookEvent) {
  const payment = await createOrUpdatePayment({
    userId: event.userId,
    customerEmail: event.customerEmail,
    provider: event.provider,
    providerCustomerId: event.providerCustomerId,
    providerOrderId: event.providerOrderId,
    providerCheckoutId: event.providerCheckoutId,
    providerPaymentId: event.providerPaymentId,
    subscriptionId: event.subscriptionId,
    planType: event.planType,
    amount: event.amount,
    currency: event.currency,
    status: "PAID",
    meta: {
      webhookEventType: event.eventType,
    },
  });

  const pass = await activatePassForPayment(payment.id);
  await createCreditLedgerIfMissing({
    userId: payment.userId,
    customerEmail: payment.customerEmail,
    passId: pass.id,
    paymentId: payment.id,
    type: "CREDIT_ADDED",
    amount: getCreditsForPlan(event.planType),
    reason: `${event.eventType} activated ${formatPlanLabel(event.planType)} plan credits.`,
  });
  await sendPaymentSuccessEmail(payment.id);
}

async function handleFailedEvent(event: NormalizedWebhookEvent) {
  const payment = await createOrUpdatePayment({
    userId: event.userId,
    customerEmail: event.customerEmail,
    provider: event.provider,
    providerCustomerId: event.providerCustomerId,
    providerOrderId: event.providerOrderId,
    providerCheckoutId: event.providerCheckoutId,
    providerPaymentId: event.providerPaymentId,
    subscriptionId: event.subscriptionId,
    planType: event.planType,
    amount: event.amount,
    currency: event.currency,
    status: "FAILED",
    meta: {
      webhookEventType: event.eventType,
    },
  });

  await markPaymentFailed(payment.id, { webhookEventType: event.eventType });
  await sendPaymentFailedEmail(payment.id);
}

async function handleRefundEvent(event: NormalizedWebhookEvent) {
  const payment = await createOrUpdatePayment({
    userId: event.userId,
    customerEmail: event.customerEmail,
    provider: event.provider,
    providerCustomerId: event.providerCustomerId,
    providerOrderId: event.providerOrderId,
    providerCheckoutId: event.providerCheckoutId,
    providerPaymentId: event.providerPaymentId,
    subscriptionId: event.subscriptionId,
    planType: event.planType,
    amount: event.amount,
    currency: event.currency,
    status: "REFUNDED",
    meta: {
      webhookEventType: event.eventType,
    },
  });

  await markPaymentRefunded(payment.id, { webhookEventType: event.eventType });
  await removeCreditsAfterRefund(payment.id);
  await sendRefundEmail(payment.id);
}

async function handleSubscriptionCancelledEvent(event: NormalizedWebhookEvent) {
  const payment = await createOrUpdatePayment({
    userId: event.userId,
    customerEmail: event.customerEmail,
    provider: event.provider,
    providerCustomerId: event.providerCustomerId,
    providerOrderId: event.providerOrderId,
    providerCheckoutId: event.providerCheckoutId,
    providerPaymentId: event.providerPaymentId,
    subscriptionId: event.subscriptionId,
    planType: event.planType,
    amount: event.amount,
    currency: event.currency,
    status: "PAID",
    meta: {
      webhookEventType: event.eventType,
      subscriptionCancelled: true,
    },
  });

  const targetUserId = payment.userId ?? (await findUserIdByEmail(payment.customerEmail ?? null));
  const existingPass = await prisma.pass.findFirst({
    where: {
      status: PassStatus.ACTIVE,
      OR: [
        targetUserId ? { userId: targetUserId } : undefined,
        payment.customerEmail ? { customerEmail: payment.customerEmail } : undefined,
      ].filter(Boolean) as never,
    },
    orderBy: { createdAt: "desc" },
  });

  if (existingPass) {
    await prisma.pass.update({
      where: { id: existingPass.id },
      data: { status: PassStatus.CANCELED },
    });
  }
}

async function processWebhookEvent(event: NormalizedWebhookEvent) {
  switch (event.kind) {
    case "success":
    case "subscription_created":
    case "subscription_updated":
      await handleSuccessLikeEvent(event);
      return;
    case "failed":
      await handleFailedEvent(event);
      return;
    case "refund":
      await handleRefundEvent(event);
      return;
    case "subscription_cancelled":
      await handleSubscriptionCancelledEvent(event);
      return;
    case "ignored":
    default:
      return;
  }
}

export async function handlePaymentWebhookRequest(req: Request) {
  let eventIdForFailure: string | null = null;

  try {
    const rawBody = await req.text();
    const normalized = await normalizeWebhookEvent(rawBody, req.headers);

    if (normalized.invalid) {
      return NextResponse.json({ ok: false, error: "Invalid signature." }, { status: 401 });
    }

    const { event } = normalized;
    eventIdForFailure = event.eventId;

    const savedEvent = await saveWebhookEvent({
      provider: event.provider,
      eventId: event.eventId,
      eventType: event.eventType,
      payload: event.payload,
    });

    if (savedEvent.processed) {
      return NextResponse.json({ ok: true, duplicate: true }, { status: 200 });
    }

    await processWebhookEvent(event);
    await markWebhookProcessed(event.eventId);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("payment webhook processing error:", error);
    if (eventIdForFailure) {
      try {
        await markWebhookFailed(
          eventIdForFailure,
          error instanceof Error ? error.message : "Webhook processing failed.",
        );
      } catch (markError) {
        console.error("webhook failure logging error:", markError);
      }
    }

    return NextResponse.json({ ok: false, error: "Webhook processing failed." }, { status: 500 });
  }
}

export async function getPaymentStatusForUser(args: {
  userId: string;
  paymentId?: string | null;
  providerOrderId?: string | null;
  providerCheckoutId?: string | null;
}) {
  const filters = [
    args.paymentId ? { id: args.paymentId } : null,
    args.providerOrderId ? { providerOrderId: args.providerOrderId } : null,
    args.providerCheckoutId ? { providerCheckoutId: args.providerCheckoutId } : null,
  ].filter(Boolean) as Record<string, string>[];

  if (filters.length === 0) return null;

  return prisma.payment.findFirst({
    where: {
      userId: args.userId,
      OR: filters,
    },
    include: { pass: true },
  });
}

export function toStatusPayload(payment: Awaited<ReturnType<typeof getPaymentStatusForUser>>): PaymentStatusPayload {
  if (!payment) {
    return {
      status: "UNKNOWN",
      passStatus: "NONE",
      planType: null,
      totalCredits: null,
      usedCredits: null,
      expiresAt: null,
      paymentId: null,
      amount: null,
      currency: null,
      provider: null,
      providerOrderId: null,
    };
  }

  let passStatus: PaymentStatusPayload["passStatus"] = "NONE";
  if (payment.pass?.status === PassStatus.ACTIVE) passStatus = "ACTIVE";
  else if (payment.pass?.status === PassStatus.EXPIRED) passStatus = "EXPIRED";
  else if (payment.pass?.status === PassStatus.REFUNDED) passStatus = "REFUNDED";
  else if (payment.pass?.status === PassStatus.CANCELED) passStatus = "CANCELED";

  const status =
    payment.status === "PENDING" ||
    payment.status === "PAID" ||
    payment.status === "FAILED" ||
    payment.status === "REFUNDED"
      ? payment.status
      : "UNKNOWN";

  return {
    status,
    passStatus,
    planType: payment.planType ?? null,
    totalCredits: payment.pass?.tierActionsTotal ?? null,
    usedCredits: payment.pass?.tierActionsUsed ?? null,
    expiresAt: payment.pass?.expiresAt?.toISOString() ?? null,
    paymentId: payment.id,
    amount: payment.amount ?? null,
    currency: payment.currency ?? null,
    provider: payment.provider ?? null,
    providerOrderId: payment.providerOrderId ?? null,
  };
}
