import "dotenv/config";
import pg from "pg";

const connectionString = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL or POSTGRES_PRISMA_URL is required.");
}

const client = new pg.Client({
  connectionString,
  connectionTimeoutMillis: 12000,
  query_timeout: 12000,
  statement_timeout: 12000,
  ssl: connectionString.includes("sslmode=require") ? undefined : { rejectUnauthorized: false },
});

await client.connect();

try {
  await client.query(`
    ALTER TABLE "destinations"
    ADD COLUMN IF NOT EXISTS "tripStyles" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[]
  `);

  const result = await client.query(`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'destinations'
        AND column_name = 'tripStyles'
    ) AS exists
  `);

  console.log(JSON.stringify({ destinationsTripStylesColumn: Boolean(result.rows[0]?.exists) }));
} finally {
  await client.end();
}
