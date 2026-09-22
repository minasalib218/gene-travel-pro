import { createLemonCheckoutRoute } from "@/lib/payments/lemonsqueezy-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return createLemonCheckoutRoute(req);
}
