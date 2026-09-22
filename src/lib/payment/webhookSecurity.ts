import crypto from "node:crypto";

function safeCompareHex(expected: string, received: string) {
  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(received, "hex");

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

export function verifyLemonWebhook(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
) {
  if (!secret) {
    throw new Error("Missing LEMONSQUEEZY_WEBHOOK_SECRET.");
  }

  if (!signatureHeader) return false;

  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeCompareHex(expected, signatureHeader.trim());
}
