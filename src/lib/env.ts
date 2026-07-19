function firstDefined(...values: Array<string | undefined>) {
  return values.find((value) => typeof value === "string" && value.trim().length > 0);
}

export function getSupabaseUrl() {
  return firstDefined(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_URL,
  );
}

export function getSupabaseAnonKey() {
  return firstDefined(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    process.env.SUPABASE_ANON_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    process.env.SUPABASE_PUBLISHABLE_KEY,
  );
}

export function getSupabaseAdminKey() {
  return firstDefined(
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    process.env.SUPABASE_SECRET_KEY,
  );
}

export function getPrismaDatabaseUrl() {
  return firstDefined(
    process.env.POSTGRES_PRISMA_URL,
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL,
  );
}

export function hasSupabaseAdminKey() {
  return Boolean(getSupabaseAdminKey());
}
