import crypto from "crypto";

export function makeClaimCode(len = 24) {
  // URL-safe token
  return crypto.randomBytes(len).toString("base64url");
}
