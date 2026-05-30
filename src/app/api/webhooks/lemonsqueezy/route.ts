import { handlePaymentWebhookRequest } from "@/lib/payment/webhookHandlers";

export async function POST(req: Request) {
  return handlePaymentWebhookRequest(req);
}
