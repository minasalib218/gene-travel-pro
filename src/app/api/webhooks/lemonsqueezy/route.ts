import { handlePaymentWebhookRequest } from "@/lib/payment/webhookHandlers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return handlePaymentWebhookRequest(req);
}

export async function GET() {
  return Response.json({
    ok: true,
    provider: "lemonsqueezy",
    endpoint: "/api/webhooks/lemonsqueezy",
  });
}
