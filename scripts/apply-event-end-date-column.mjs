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
    CREATE TABLE IF NOT EXISTS "events" (
      "id" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "slug" TEXT NOT NULL,
      "imageUrl" TEXT,
      "iconUrl" TEXT,
      "affiliateLink" TEXT,
      "category" TEXT,
      "location" TEXT,
      "country" TEXT,
      "dateRange" TEXT,
      "endDate" TIMESTAMP(3),
      "description" TEXT,
      "showOnHome" BOOLEAN NOT NULL DEFAULT false,
      "status" TEXT NOT NULL DEFAULT 'draft',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "events_pkey" PRIMARY KEY ("id")
    )
  `);

  await client.query(`
    ALTER TABLE "events"
    ADD COLUMN IF NOT EXISTS "endDate" TIMESTAMP(3)
  `);

  await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS "events_slug_key" ON "events"("slug")`);
  await client.query(`CREATE INDEX IF NOT EXISTS "events_status_updatedAt_idx" ON "events"("status", "updatedAt")`);

  await client.query(`
    CREATE INDEX IF NOT EXISTS "events_status_endDate_updatedAt_idx"
    ON "events"("status", "endDate", "updatedAt")
  `);

  const result = await client.query(`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'events'
        AND column_name = 'endDate'
    ) AS exists
  `);

  console.log(JSON.stringify({ eventsEndDateColumn: Boolean(result.rows[0]?.exists) }));
} finally {
  await client.end();
}
