import { cookies } from "next/headers";

export function isEnvAdminCookie() {
  return cookies().get("admin_auth")?.value === "1";
}
