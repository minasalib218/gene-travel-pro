BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'ReadyPlanStatus'
  ) THEN
    CREATE TYPE "ReadyPlanStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
  END IF;
END
$$;

ALTER TABLE "ready_plans"
  ADD COLUMN IF NOT EXISTS "status" "ReadyPlanStatus",
  ADD COLUMN IF NOT EXISTS "slug" TEXT,
  ADD COLUMN IF NOT EXISTS "subtitle" TEXT,
  ADD COLUMN IF NOT EXISTS "country" TEXT,
  ADD COLUMN IF NOT EXISTS "city" TEXT,
  ADD COLUMN IF NOT EXISTS "destination" TEXT,
  ADD COLUMN IF NOT EXISTS "style" TEXT,
  ADD COLUMN IF NOT EXISTS "daysCount" INTEGER,
  ADD COLUMN IF NOT EXISTS "heroImage" TEXT,
  ADD COLUMN IF NOT EXISTS "coverImage" TEXT,
  ADD COLUMN IF NOT EXISTS "summary" TEXT,
  ADD COLUMN IF NOT EXISTS "seoTitle" TEXT,
  ADD COLUMN IF NOT EXISTS "seoDescription" TEXT,
  ADD COLUMN IF NOT EXISTS "season" TEXT,
  ADD COLUMN IF NOT EXISTS "showOnHome" BOOLEAN,
  ADD COLUMN IF NOT EXISTS "priceFrom" INTEGER,
  ADD COLUMN IF NOT EXISTS "currency" TEXT,
  ADD COLUMN IF NOT EXISTS "daysJson" JSONB,
  ADD COLUMN IF NOT EXISTS "contentJson" JSONB,
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ;

UPDATE "ready_plans"
SET
  "destination" = COALESCE(NULLIF("destination", ''), NULLIF("location", ''), 'Destination pending'),
  "daysCount" = COALESCE("daysCount", "days", 0),
  "heroImage" = COALESCE(NULLIF("heroImage", ''), NULLIF("image_url", '')),
  "coverImage" = COALESCE(NULLIF("coverImage", ''), NULLIF("image_url", ''), NULLIF("heroImage", '')),
  "summary" = COALESCE(NULLIF("summary", ''), NULLIF("subtitle", ''), 'Ready plan draft'),
  "currency" = COALESCE(NULLIF("currency", ''), 'USD'),
  "showOnHome" = COALESCE("showOnHome", false),
  "status" = COALESCE("status", 'DRAFT'::"ReadyPlanStatus"),
  "daysJson" = COALESCE("daysJson", '[]'::jsonb),
  "createdAt" = COALESCE("createdAt", "created_at", NOW()),
  "updatedAt" = COALESCE("updatedAt", NOW())
WHERE TRUE;

UPDATE "ready_plans"
SET "slug" = LOWER(
  TRIM(BOTH '-' FROM REGEXP_REPLACE(
    COALESCE(NULLIF("slug", ''), COALESCE(NULLIF("title", ''), 'ready-plan') || '-' || LEFT("id"::text, 8)),
    '[^a-zA-Z0-9]+',
    '-',
    'g'
  ))
)
WHERE "slug" IS NULL OR "slug" = '';

WITH ranked AS (
  SELECT
    "id",
    "slug",
    ROW_NUMBER() OVER (PARTITION BY "slug" ORDER BY "createdAt", "id") AS rn
  FROM "ready_plans"
)
UPDATE "ready_plans" rp
SET "slug" = ranked."slug" || '-' || ranked.rn
FROM ranked
WHERE rp."id" = ranked."id"
  AND ranked.rn > 1;

ALTER TABLE "ready_plans"
  ALTER COLUMN "status" SET DEFAULT 'DRAFT',
  ALTER COLUMN "status" SET NOT NULL,
  ALTER COLUMN "slug" SET NOT NULL,
  ALTER COLUMN "destination" SET NOT NULL,
  ALTER COLUMN "daysCount" SET DEFAULT 0,
  ALTER COLUMN "daysCount" SET NOT NULL,
  ALTER COLUMN "showOnHome" SET DEFAULT false,
  ALTER COLUMN "showOnHome" SET NOT NULL,
  ALTER COLUMN "currency" SET DEFAULT 'USD',
  ALTER COLUMN "currency" SET NOT NULL,
  ALTER COLUMN "daysJson" SET DEFAULT '[]'::jsonb,
  ALTER COLUMN "daysJson" SET NOT NULL,
  ALTER COLUMN "createdAt" SET DEFAULT NOW(),
  ALTER COLUMN "createdAt" SET NOT NULL,
  ALTER COLUMN "updatedAt" SET DEFAULT NOW(),
  ALTER COLUMN "updatedAt" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "ready_plans_slug_key" ON "ready_plans"("slug");

CREATE TABLE IF NOT EXISTS "ready_plan_links" (
  "id" TEXT NOT NULL,
  "readyPlanId" UUID NOT NULL,
  "kind" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "deeplink" TEXT NOT NULL,
  "imageUrl" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "ready_plan_links_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ready_plan_links_readyPlanId_idx"
ON "ready_plan_links"("readyPlanId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ready_plan_links_readyPlanId_fkey'
  ) THEN
    ALTER TABLE "ready_plan_links"
      ADD CONSTRAINT "ready_plan_links_readyPlanId_fkey"
      FOREIGN KEY ("readyPlanId") REFERENCES "ready_plans"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "ready_plan_days" (
  "id" TEXT NOT NULL,
  "readyPlanId" UUID NOT NULL,
  "dayNumber" INTEGER NOT NULL,
  "title" TEXT,
  "city" TEXT,
  "country" TEXT,
  "date" TEXT,
  "temperature" TEXT,
  "mainImageUrl" TEXT,
  "locationName" TEXT,
  "locationDescription" TEXT,
  "description" TEXT,
  "notesJson" JSONB,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "items" JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "ready_plan_days_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ready_plan_days_readyPlanId_dayNumber_idx"
ON "ready_plan_days"("readyPlanId", "dayNumber");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ready_plan_days_readyPlanId_fkey'
  ) THEN
    ALTER TABLE "ready_plan_days"
      ADD CONSTRAINT "ready_plan_days_readyPlanId_fkey"
      FOREIGN KEY ("readyPlanId") REFERENCES "ready_plans"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "ready_plan_items" (
  "id" TEXT NOT NULL,
  "readyPlanDayId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "imageUrl" TEXT,
  "price" TEXT,
  "peopleCount" TEXT,
  "statusLabel" TEXT,
  "categoryLabel" TEXT,
  "affiliateUrl" TEXT,
  "buttonLabel" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "ready_plan_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ready_plan_items_readyPlanDayId_sortOrder_idx"
ON "ready_plan_items"("readyPlanDayId", "sortOrder");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ready_plan_items_readyPlanDayId_fkey'
  ) THEN
    ALTER TABLE "ready_plan_items"
      ADD CONSTRAINT "ready_plan_items_readyPlanDayId_fkey"
      FOREIGN KEY ("readyPlanDayId") REFERENCES "ready_plan_days"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

COMMIT;
