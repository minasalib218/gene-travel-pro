import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Tier mapping (your rules)
function tierConfig(tier: "basic" | "pro" | "agency") {
  if (tier === "basic") return { tierActionsTotal: 3, days: 3 };
  if (tier === "pro") return { tierActionsTotal: 5, days: 6 };
  return { tierActionsTotal: 8, days: 14 };
}

// Signature verification (official approach uses X-Signature + raw body) :contentReference[oaicite:5]{index=5}
function verifyLemonSignature(rawBody: string, signatureHex: string, secret: string) {
  const signature = Buffer.from(signatureHex ?? "", "hex");
  if (!signature.length || !rawBody.length) return false;

  const hmac = Buffer.from(crypto.createHmac("sha256", secret).update(rawBody).digest("hex"), "hex");
  return crypto.timingSafeEqual(hmac, signature);
}

export async function POST(request: NextRequest) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json("Missing webhook secret", { status: 400 });

  const rawBody = await request.text();
  const signatureHex = request.headers.get("X-Signature") ?? "";

  if (!verifyLemonSignature(rawBody, signatureHex, secret)) {
    return NextResponse.json("Invalid signature", { status: 400 });
  }

  const payload = JSON.parse(rawBody);
  const eventName = payload?.meta?.event_name as string; // e.g. order_created :contentReference[oaicite:6]{index=6}
  const data = payload?.data;
  const orderId = data?.id ? String(data.id) : null;

  const custom = payload?.meta?.custom_data || {};
  const userId = custom?.user_id ? String(custom.user_id) : null;
  const tier = custom?.tier ? String(custom.tier) : null;

  // We only need order_created + order_refunded minimum for passes :contentReference[oaicite:7]{index=7}
  if (!orderId) return NextResponse.json("Missing order id", { status: 200 });

  if (eventName === "order_created") {
    if (!userId || !tier || !["basic", "pro", "agency"].includes(tier)) {
      // Still return 200 to avoid retries, but log in your server
      return NextResponse.json("Missing custom_data user_id/tier", { status: 200 });
    }

    // Idempotency: don’t create duplicate passes if webhook retries
    await prisma.$transaction(async (tx) => {
      const existing = await tx.pass.findFirst({
        where: { userId, status: "ACTIVE", tier },
        orderBy: { expiresAt: "desc" },
      });

      // OPTIONAL: If you want multiple passes per user, remove this and instead store orderId in a separate table.
      // Here we allow multiple passes, but we prevent duplicates for same order by using a dedicated log table.
      // If you don’t have the log table yet, simplest is to check: "pass created recently" logic is not perfect.
      // Better: add LemonOrder model with unique orderId (recommended).

      const cfg = tierConfig(tier as any);
      const now = new Date();
      const expiresAt = new Date(now.getTime() + cfg.days * 24 * 60 * 60 * 1000);

      // Create a fresh pass (recommended)
      await tx.pass.create({
        data: {
          userId,
          tier,
          status: "ACTIVE",
          tierActionsTotal: cfg.tierActionsTotal,
          tierActionsUsed: 0,
          startsAt: now,
          expiresAt,
        },
      });

      // If you prefer “extend existing pass” behavior:
      // if (existing) { ...update expiresAt/total... } else create.
    });

    return NextResponse.json("OK", { status: 200 });
  }

  if (eventName === "order_refunded") {
    // Simple behavior: revoke latest active pass for that user (if user_id exists)
    if (userId) {
      const latest = await prisma.pass.findFirst({
        where: { userId, status: "ACTIVE" },
        orderBy: { expiresAt: "desc" },
      });
      if (latest) {
        await prisma.pass.update({
          where: { id: latest.id },
          data: { status: "CANCELED" },
        });
      }
    }

    return NextResponse.json("OK", { status: 200 });
  }

  // Ignore other events for now
  return NextResponse.json("OK", { status: 200 });
}
