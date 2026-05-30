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
  ADD COLUMN IF NOT EXISTS "country" TEXT,
  ADD COLUMN IF NOT EXISTS "city" TEXT,
  ADD COLUMN IF NOT EXISTS "style" TEXT,
  ADD COLUMN IF NOT EXISTS "daysCount" INTEGER,
  ADD COLUMN IF NOT EXISTS "daysJson" JSONB,
  ADD COLUMN IF NOT EXISTS "heroImage" TEXT,
  ADD COLUMN IF NOT EXISTS "coverImage" TEXT,
  ADD COLUMN IF NOT EXISTS "summary" TEXT,
  ADD COLUMN IF NOT EXISTS "seoTitle" TEXT,
  ADD COLUMN IF NOT EXISTS "seoDescription" TEXT,
  ADD COLUMN IF NOT EXISTS "season" TEXT,
  ADD COLUMN IF NOT EXISTS "contentJson" JSONB;

UPDATE "ready_plans"
SET
  "status" = COALESCE(
    "status",
    CASE
      WHEN COALESCE("isPublished", false) THEN 'PUBLISHED'::"ReadyPlanStatus"
      ELSE 'DRAFT'::"ReadyPlanStatus"
    END
  ),
  "daysCount" = COALESCE("daysCount", "days", 0),
  "heroImage" = COALESCE("heroImage", "heroImageUrl"),
  "coverImage" = COALESCE("coverImage", "heroImageUrl"),
  "summary" = COALESCE("summary", "overview")
WHERE
  "status" IS NULL
  OR "daysCount" IS NULL
  OR "heroImage" IS NULL
  OR "coverImage" IS NULL
  OR "summary" IS NULL;

ALTER TABLE "ready_plans"
  ALTER COLUMN "status" SET DEFAULT 'DRAFT',
  ALTER COLUMN "status" SET NOT NULL,
  ALTER COLUMN "daysCount" SET DEFAULT 0,
  ALTER COLUMN "daysCount" SET NOT NULL,
  ALTER COLUMN "currency" SET DEFAULT 'USD';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ready_plans'
      AND column_name = 'itineraryJson'
  ) THEN
    EXECUTE '
      UPDATE "ready_plans"
      SET "daysJson" = COALESCE("daysJson", "itineraryJson", ''[]''::jsonb)
      WHERE "daysJson" IS NULL
    ';
  END IF;
END
$$;

UPDATE "ready_plans"
SET "daysJson" = '[]'::jsonb
WHERE "daysJson" IS NULL;

ALTER TABLE "ready_plans"
  ALTER COLUMN "daysJson" SET DEFAULT '[]'::jsonb,
  ALTER COLUMN "daysJson" SET NOT NULL;
