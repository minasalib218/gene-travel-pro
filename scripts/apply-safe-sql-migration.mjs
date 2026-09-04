import fs from "node:fs";
import path from "node:path";
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
const env = {
  ...parseDotenv(path.join(cwd, ".env")),
  ...parseDotenv(path.join(cwd, ".env.local")),
  ...process.env,
};

const migrationArg = process.argv[2];
if (!migrationArg) {
  throw new Error("Usage: node scripts/apply-safe-sql-migration.mjs path/to/migration.sql");
}

const migrationPath = path.resolve(cwd, migrationArg);
if (!migrationPath.startsWith(cwd)) {
  throw new Error("Migration file must be inside the project.");
}

const sql = fs.readFileSync(migrationPath, "utf8");
if (/\b(drop\s+table|truncate\s+table|delete\s+from)\b/i.test(sql)) {
  throw new Error("Refusing to run destructive SQL.");
}

const connectionString =
  env.POSTGRES_URL_NON_POOLING ||
  env.POSTGRES_URL ||
  env.POSTGRES_PRISMA_URL ||
  env.DATABASE_URL;

if (!connectionString) {
  throw new Error("No database connection URL found.");
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
console.log(JSON.stringify({ ok: true, migration: path.relative(cwd, migrationPath) }, null, 2));
await client.end();
