import { createRouteClient } from "@/lib/supabase/server";
import { getSupabaseAdminProfile, isAdminRole } from "@/lib/admin/getAdminProfile";

export async function getVerifiedAdmin() {
  try {
    const supabase = createRouteClient();
    const { data, error } = await supabase.auth.getUser();

    if (error) return { ok: false as const, code: "SUPABASE_AUTH_ERROR" as const };
    if (!data?.user) return { ok: false as const, code: "NOT_AUTHED" as const };

    const profile = await getSupabaseAdminProfile(data.user.id);
    if (!profile || !isAdminRole(profile.role)) {
      return { ok: false as const, code: "NOT_ADMIN" as const };
    }

    return { ok: true as const, user: data.user, profile };
  } catch {
    return { ok: false as const, code: "AUTH_CHECK_FAILED" as const };
  }
}

export async function isVerifiedAdmin() {
  const admin = await getVerifiedAdmin();
  return admin.ok;
}
