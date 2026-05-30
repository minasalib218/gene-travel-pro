import { prisma } from "@/lib/db/client";
import { createRouteClient } from "@/lib/supabase/server";
import { UserRole } from "@prisma/client";
import { isEnvAdminCookie } from "@/lib/admin/isEnvAdmin";

type AdminFail = { ok: false; code: string };
type AdminOk = { ok: true; userId: string; role: UserRole; code?: never };

export async function requireAdmin(): Promise<AdminFail | AdminOk> {
  if (isEnvAdminCookie()) {
    return {
      ok: true,
      userId: process.env.ADMIN_USER_ID || "env-admin",
      role: UserRole.ADMIN,
    };
  }

  const supabase = createRouteClient();

  const { data, error } = await supabase.auth.getUser();
  if (error) return { ok: false, code: "SUPABASE_AUTH_ERROR" };

  const user = data?.user;
  if (!user) return { ok: false, code: "NOT_AUTHED" };

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { id: true, role: true },
  });

  if (!profile) return { ok: false, code: "PROFILE_NOT_PROVISIONED" };

  // ✅ Correct check
  if (profile.role !== UserRole.ADMIN) return { ok: false, code: "NOT_ADMIN" };

  return { ok: true, userId: user.id, role: profile.role };
}
