import "server-only";
import { createCipheriv, randomBytes } from "node:crypto";

const KEY_ENV = "GENE_BOOKING_REFERENCE_ENCRYPTION_KEY";

function getEncryptionKey() {
  const encoded = process.env[KEY_ENV]?.trim();
  if (!encoded) return null;

  try {
    const key = Buffer.from(encoded, "base64");
    return key.length === 32 ? key : null;
  } catch {
    return null;
  }
}

export function canEncryptBookingReferences() {
  return getEncryptionKey() !== null;
}

export function encryptBookingReference(value: string) {
  const key = getEncryptionKey();
  if (!key) throw new Error("BOOKING_REFERENCE_ENCRYPTION_UNAVAILABLE");

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return ["v1", iv.toString("base64url"), tag.toString("base64url"), ciphertext.toString("base64url")].join(".");
}
