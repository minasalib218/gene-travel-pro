CREATE TABLE IF NOT EXISTS "destinations" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "imageUrl" TEXT,
  "iconUrl" TEXT,
  "affiliateLink" TEXT,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "destinations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "destinations_slug_key" ON "destinations"("slug");
CREATE INDEX IF NOT EXISTS "destinations_status_updatedAt_idx" ON "destinations"("status", "updatedAt");

CREATE TABLE IF NOT EXISTS "offers" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "imageUrl" TEXT,
  "iconUrl" TEXT,
  "affiliateLink" TEXT,
  "location" TEXT,
  "country" TEXT,
  "duration" TEXT,
  "startingPrice" TEXT,
  "description" TEXT,
  "discountBadge" TEXT,
  "expiresAt" TIMESTAMP(3),
  "featured" BOOLEAN NOT NULL DEFAULT false,
  "showOnHome" BOOLEAN NOT NULL DEFAULT false,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "offers_slug_key" ON "offers"("slug");
CREATE INDEX IF NOT EXISTS "offers_status_updatedAt_idx" ON "offers"("status", "updatedAt");

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
  "description" TEXT,
  "showOnHome" BOOLEAN NOT NULL DEFAULT false,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "events_slug_key" ON "events"("slug");
CREATE INDEX IF NOT EXISTS "events_status_updatedAt_idx" ON "events"("status", "updatedAt");
