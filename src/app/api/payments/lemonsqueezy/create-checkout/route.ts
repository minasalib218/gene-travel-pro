import { createLemonCheckoutRoute } from "@/lib/payments/lemonsqueezy-server";

export async function POST(req: Request) {
  return createLemonCheckoutRoute(req);
}
