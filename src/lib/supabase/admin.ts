import { createClient } from "@supabase/supabase-js";

let cachedSupabaseAdmin: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin() {
  if (cachedSupabaseAdmin) return cachedSupabaseAdmin;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

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
