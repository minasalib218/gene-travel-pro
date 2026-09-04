import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import pg from "pg";

const { Client } = pg;

function parseDotenv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const env = {};
  for (const rawLine of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

const cwd = process.cwd();
const localEnv = {
  ...parseDotenv(path.join(cwd, ".env")),
  ...parseDotenv(path.join(cwd, ".env.local")),
  ...process.env,
};

for (const [key, value] of Object.entries(localEnv)) {
  if (typeof process.env[key] === "undefined") process.env[key] = value;
}

process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL;

const email = String(process.argv[2] || "").trim().toLowerCase();
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  throw new Error("Usage: node scripts/ensure-customer-profile.mjs customer@example.com");
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing Supabase admin environment variables.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let authUser = null;
for (let page = 1; page <= 20 && !authUser; page += 1) {
  const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
  if (error) throw error;
  authUser = data.users.find((user) => user.email?.toLowerCase() === email) || null;
  if (!data.users.length || data.users.length < 100) break;
}

if (!authUser) {
  throw new Error(`No Supabase Auth user found for ${email}.`);
}

const connectionString =
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Missing database connection URL.");
}

const db = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
  query_timeout: 30000,
  statement_timeout: 30000,
});

await db.connect();
await db.query("set statement_timeout = '30s'");

const existingByEmail = await db.query(
  'select id from "profiles" where lower(email) = lower($1) limit 1',
  [email],
);

if (existingByEmail.rows[0] && existingByEmail.rows[0].id !== authUser.id) {
  await db.end();
  throw new Error(
    `A profile already uses ${email} with a different id. Please resolve that duplicate manually before syncing.`,
  );
}

const fullName =
  authUser.user_metadata?.full_name ||
  authUser.user_metadata?.name ||
  email.split("@")[0] ||
  "Traveler";

const avatarUrl = authUser.user_metadata?.avatar_url ?? null;
const profileColumns = await db.query(
  `
    select column_name
    from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles'
  `,
);
const profileColumnSet = new Set(profileColumns.rows.map((row) => row.column_name));
const quote = (name) => `"${String(name).replaceAll('"', '""')}"`;
const hasColumn = (name) => profileColumnSet.has(name);
const nameColumn = hasColumn("fullName") ? "fullName" : hasColumn("full_name") ? "full_name" : null;
const avatarColumn = hasColumn("avatarUrl") ? "avatarUrl" : hasColumn("avatar_url") ? "avatar_url" : null;
const createdColumn = hasColumn("createdAt") ? "createdAt" : hasColumn("created_at") ? "created_at" : null;
const updatedColumn = hasColumn("updatedAt") ? "updatedAt" : hasColumn("updated_at") ? "updated_at" : null;

const insertColumns = ["id", "email"];
const insertValues = [authUser.id, email];
const updateAssignments = ["email = excluded.email"];

if (nameColumn) {
  insertColumns.push(nameColumn);
  insertValues.push(fullName);
  updateAssignments.push(`${quote(nameColumn)} = excluded.${quote(nameColumn)}`);
}

if (avatarColumn) {
  insertColumns.push(avatarColumn);
  insertValues.push(avatarUrl);
  updateAssignments.push(`${quote(avatarColumn)} = excluded.${quote(avatarColumn)}`);
}

if (hasColumn("role")) {
  insertColumns.push("role");
  insertValues.push("USER");
  updateAssignments.push("role = excluded.role");
}

if (createdColumn) {
  insertColumns.push(createdColumn);
  insertValues.push(new Date());
}

if (updatedColumn) {
  insertColumns.push(updatedColumn);
  insertValues.push(new Date());
  updateAssignments.push(`${quote(updatedColumn)} = current_timestamp`);
}

const placeholders = insertValues.map((_, index) => `$${index + 1}`).join(", ");
const profileResult = await db.query(
  `
    insert into "profiles" (${insertColumns.map(quote).join(", ")})
    values (${placeholders})
    on conflict (id) do update
      set ${updateAssignments.join(", ")}
    returning id, email${hasColumn("role") ? ", role" : ""}
  `,
  insertValues,
);

async function updateIfTableExists(tableName, sql, params) {
  const table = await db.query("select to_regclass($1) as table_name", [`public.${tableName}`]);
  if (!table.rows[0]?.table_name) return { count: 0 };
  try {
    return await db.query(sql, params);
  } catch (error) {
    console.warn(`${tableName} link skipped: ${error.message}`);
    return { count: 0 };
  }
}

const passes = await updateIfTableExists(
  "passes",
  'update "passes" set "userId" = $1, "profileId" = $1 where "customerEmail" = $2 and "userId" is null',
  [authUser.id, email],
);
const payments = await updateIfTableExists(
  "payments",
  'update "payments" set "userId" = $1 where "customerEmail" = $2 and "userId" is null',
  [authUser.id, email],
);
const events = await updateIfTableExists(
  "customer_events",
  'update "customer_events" set "userId" = $1 where email = $2 and "userId" is null',
  [authUser.id, email],
);
const credits = await updateIfTableExists(
  "credit_ledger",
  'update "credit_ledger" set "userId" = $1 where "customerEmail" = $2 and "userId" is null',
  [authUser.id, email],
);
const emails = await updateIfTableExists(
  "email_logs",
  'update "email_logs" set "userId" = $1 where "customerEmail" = $2 and "userId" is null',
  [authUser.id, email],
);

console.log(
  JSON.stringify(
    {
      ok: true,
      profile: profileResult.rows[0],
      linked: {
        passes: passes.rowCount ?? 0,
        payments: payments.rowCount ?? 0,
        events: events.rowCount ?? 0,
        creditLedger: credits.rowCount ?? 0,
        emailLogs: emails.rowCount ?? 0,
      },
    },
    null,
    2,
  ),
);

await db.end();
