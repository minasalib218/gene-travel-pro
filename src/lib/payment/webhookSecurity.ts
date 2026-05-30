import crypto from "node:crypto";

function safeCompareHex(expected: string, received: string) {
  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(received, "hex");

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

function extractPaddleDigest(signatureHeader: string | null) {
  if (!signatureHeader) return null;

  const h1Match = signatureHeader.match(/(?:^|;)\\s*h1=([a-f0-9]+)/i);
  if (h1Match?.[1]) return h1Match[1];

  const bareHex = signatureHeader.trim();
  return /^[a-f0-9]+$/i.test(bareHex) ? bareHex : null;
}

export function verifyPaddleWebhook(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
) {
  if (!secret) {
    throw new Error("Missing PADDLE_WEBHOOK_SECRET.");
  }

  const digest = extractPaddleDigest(signatureHeader);
  if (!digest) return false;

  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeCompareHex(expected, digest);
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
