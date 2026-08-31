import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const { Client } = pg;

function parseDotenv(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const out = {};
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
    out[key] = value;
  }
  return out;
}

const cwd = process.cwd();
const env = {
  ...parseDotenv(path.join(cwd, ".env")),
  ...parseDotenv(path.join(cwd, ".env.local")),
  ...process.env,
};

const connectionString =
  env.POSTGRES_URL_NON_POOLING ||
  env.POSTGRES_URL ||
  env.POSTGRES_PRISMA_URL ||
  env.DATABASE_URL;

if (!connectionString) {
  throw new Error("No database connection URL found.");
}

const migrationPath = path.join(
  cwd,
  "prisma",
  "migrations",
  "20260831123000_add_profile_hub_and_analytics",
  "migration.sql",
);

const sql = fs.readFileSync(migrationPath, "utf8");
if (/\b(drop\s+table|truncate\s+table|delete\s+from)\b/i.test(sql)) {
  throw new Error("Refusing to run destructive SQL.");
}

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
  query_timeout: 30000,
  statement_timeout: 30000,
});

await client.connect();
await client.query("set statement_timeout = '30s'");
await client.query(sql);

const checks = await client.query(`
  select
    to_regclass('public.analytics_sessions') is not null as analytics_sessions,
    to_regclass('public.favorite_destinations') is not null as favorite_destinations,
    to_regclass('public.wishlist_items') is not null as wishlist_items,
    to_regclass('public.travel_reminders') is not null as travel_reminders,
    to_regclass('public.travel_preferences') is not null as travel_preferences,
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'analytics_events'
        and column_name = 'anonymousId'
    ) as analytics_anonymous_id
`);

console.log(JSON.stringify(checks.rows[0], null, 2));
await client.end();
