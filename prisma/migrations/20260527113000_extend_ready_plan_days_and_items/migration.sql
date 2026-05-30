ALTER TABLE "ready_plan_days"
  ADD COLUMN IF NOT EXISTS "city" TEXT,
  ADD COLUMN IF NOT EXISTS "country" TEXT,
  ADD COLUMN IF NOT EXISTS "date" TEXT,
  ADD COLUMN IF NOT EXISTS "temperature" TEXT,
  ADD COLUMN IF NOT EXISTS "mainImageUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "locationName" TEXT,
  ADD COLUMN IF NOT EXISTS "locationDescription" TEXT,
  ADD COLUMN IF NOT EXISTS "notesJson" JSONB,
  ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0;

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
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
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
