import { supabaseAdmin } from "@/lib/supabase/admin";

export async function isAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return false;
  }

  const role = data && typeof data === "object" && "role" in data
    ? String((data as { role?: unknown }).role ?? "")
    : "";

  return role.toUpperCase() === "ADMIN";
}
