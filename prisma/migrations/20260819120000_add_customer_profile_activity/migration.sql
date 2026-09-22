-- Add customer profile activity tables safely.
-- This migration is intentionally additive: no existing content, payments, passes,
-- ready plans, images, affiliate URLs, or users are deleted or overwritten.

CREATE TABLE IF NOT EXISTS "favorite_plans" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "readyPlanId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "favorite_plans_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "favorite_plans_userId_readyPlanId_key"
  ON "favorite_plans" ("userId", "readyPlanId");

CREATE INDEX IF NOT EXISTS "favorite_plans_userId_idx"
  ON "favorite_plans" ("userId");

CREATE INDEX IF NOT EXISTS "favorite_plans_readyPlanId_idx"
  ON "favorite_plans" ("readyPlanId");

CREATE TABLE IF NOT EXISTS "booking_clicks" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "planId" TEXT,
  "planItemId" TEXT,
  "readyPlanId" TEXT,
  "readyPlanItemId" TEXT,
  "provider" TEXT,
  "providerItemId" TEXT,
  "itemName" TEXT NOT NULL,
  "itemType" TEXT,
  "destination" TEXT,
  "clickedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "metadata" JSONB,
  CONSTRAINT "booking_clicks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "booking_clicks_userId_clickedAt_idx"
  ON "booking_clicks" ("userId", "clickedAt");

CREATE INDEX IF NOT EXISTS "booking_clicks_readyPlanId_clickedAt_idx"
  ON "booking_clicks" ("readyPlanId", "clickedAt");

CREATE INDEX IF NOT EXISTS "booking_clicks_readyPlanItemId_clickedAt_idx"
  ON "booking_clicks" ("readyPlanItemId", "clickedAt");

CREATE TABLE IF NOT EXISTS "bookings" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerBookingId" TEXT,
  "planId" TEXT,
  "planItemId" TEXT,
  "readyPlanId" TEXT,
  "readyPlanItemId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "bookingDate" TIMESTAMP(3),
  "travelDate" TIMESTAMP(3),
  "amount" DOUBLE PRECISION,
  "currency" TEXT,
  "commission" DOUBLE PRECISION,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "bookings_provider_providerBookingId_key"
  ON "bookings" ("provider", "providerBookingId");

CREATE INDEX IF NOT EXISTS "bookings_userId_createdAt_idx"
  ON "bookings" ("userId", "createdAt");

CREATE INDEX IF NOT EXISTS "bookings_status_createdAt_idx"
  ON "bookings" ("status", "createdAt");

CREATE TABLE IF NOT EXISTS "recently_viewed" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "metadata" JSONB,
  CONSTRAINT "recently_viewed_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "recently_viewed_userId_entityType_entityId_key"
  ON "recently_viewed" ("userId", "entityType", "entityId");

CREATE INDEX IF NOT EXISTS "recently_viewed_userId_viewedAt_idx"
  ON "recently_viewed" ("userId", "viewedAt");

CREATE TABLE IF NOT EXISTS "user_activity" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "event" TEXT NOT NULL,
  "entityType" TEXT,
  "entityId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_activity_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "user_activity_userId_createdAt_idx"
  ON "user_activity" ("userId", "createdAt");

CREATE INDEX IF NOT EXISTS "user_activity_event_createdAt_idx"
  ON "user_activity" ("event", "createdAt");

ALTER TABLE "favorite_plans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "booking_clicks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bookings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "recently_viewed" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_activity" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'favorite_plans' AND policyname = 'favorite_plans_own_rows'
  ) THEN
    CREATE POLICY "favorite_plans_own_rows" ON "favorite_plans"
      FOR ALL USING ("userId" = auth.uid()::text)
      WITH CHECK ("userId" = auth.uid()::text);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'booking_clicks' AND policyname = 'booking_clicks_own_select'
  ) THEN
    CREATE POLICY "booking_clicks_own_select" ON "booking_clicks"
      FOR SELECT USING ("userId" = auth.uid()::text);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'bookings' AND policyname = 'bookings_own_select'
  ) THEN
    CREATE POLICY "bookings_own_select" ON "bookings"
      FOR SELECT USING ("userId" = auth.uid()::text);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'recently_viewed' AND policyname = 'recently_viewed_own_rows'
  ) THEN
    CREATE POLICY "recently_viewed_own_rows" ON "recently_viewed"
      FOR ALL USING ("userId" = auth.uid()::text)
      WITH CHECK ("userId" = auth.uid()::text);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_activity' AND policyname = 'user_activity_own_select'
  ) THEN
    CREATE POLICY "user_activity_own_select" ON "user_activity"
      FOR SELECT USING ("userId" = auth.uid()::text);
  END IF;
END $$;
