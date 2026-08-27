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
);

ALTER TABLE "events"
ADD COLUMN IF NOT EXISTS "endDate" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "events_slug_key" ON "events"("slug");
CREATE INDEX IF NOT EXISTS "events_status_updatedAt_idx" ON "events"("status", "updatedAt");
CREATE INDEX IF NOT EXISTS "events_status_endDate_updatedAt_idx" ON "events"("status", "endDate", "updatedAt");
