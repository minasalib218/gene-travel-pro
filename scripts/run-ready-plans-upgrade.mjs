import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectionString =
  process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error("Missing POSTGRES_PRISMA_URL or DATABASE_URL.");
  process.exit(1);
}

const sqlPath = path.join(__dirname, "..", "prisma", "manual", "modernize_ready_plans.sql");
const sql = await fs.readFile(sqlPath, "utf8");

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(sql);
  const result = await client.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'ready_plans'
    ORDER BY ordinal_position
  `);
  console.log(JSON.stringify({
    ok: true,
    columns: result.rows.map((row) => row.column_name),
  }, null, 2));
} catch (error) {
  console.error("READY_PLANS_UPGRADE_FAILED");
  console.error(error);
  process.exit(1);
} finally {
  await client.end().catch(() => {});
}
