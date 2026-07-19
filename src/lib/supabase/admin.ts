import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdminKey, getSupabaseUrl } from "@/lib/env";

let cachedSupabaseAdmin: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin() {
  if (cachedSupabaseAdmin) return cachedSupabaseAdmin;

  const supabaseUrl = getSupabaseUrl();
  const serviceRoleKey = getSupabaseAdminKey();

  if (!supabaseUrl) throw new Error("Missing Supabase URL environment variable");
  if (!serviceRoleKey) throw new Error("Missing Supabase admin key environment variable");

  cachedSupabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return cachedSupabaseAdmin;
}

export const supabaseAdmin = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, property, receiver) {
    return Reflect.get(getSupabaseAdmin(), property, receiver);
  },
});
