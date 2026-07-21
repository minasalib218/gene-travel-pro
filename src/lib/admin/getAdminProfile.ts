import { createRouteClient } from "@/lib/supabase/server";
export async function fetchAdminProfile(client: any, userId: string) {
  const { data, error } = await client
    .from("profiles")
    .select("id, role")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;

  return data;
}

export async function getSupabaseAdminProfile(userId: string) {
  const supabase = createRouteClient();
  return fetchAdminProfile(supabase, userId);
}

export function isAdminRole(role: unknown) {
  return String(role ?? "").trim().toUpperCase() === "ADMIN";
}
