import { createRouteClient } from "@/lib/supabase/server";
import { UserRole } from "@prisma/client";
import { getSupabaseAdminProfile, isAdminRole } from "@/lib/admin/getAdminProfile";

type AdminFail = { ok: false; code: string };
type AdminOk = { ok: true; userId: string; role: UserRole; code?: never };

export async function requireAdmin(): Promise<AdminFail | AdminOk> {
  const supabase = createRouteClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) return { ok: false, code: "SUPABASE_AUTH_ERROR" };

  const user = data?.user;
  if (!user) return { ok: false, code: "NOT_AUTHED" };

  const profile = await getSupabaseAdminProfile(user.id);
  if (!profile) return { ok: false, code: "PROFILE_NOT_PROVISIONED" };
  if (!isAdminRole(profile.role)) return { ok: false, code: "NOT_ADMIN" };

  return { ok: true, userId: user.id, role: UserRole.ADMIN };
}
