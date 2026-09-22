-- Forward-only launch safety metadata. This migration does not delete or rewrite
-- existing plans, payments, passes, credits, content, images, or affiliate links.

DO $$ BEGIN
  CREATE TYPE "PlanningStage" AS ENUM (
    'DRAFT_INPUT', 'RECOMMENDATIONS_GENERATING', 'RECOMMENDATIONS_READY',
    'SELECTIONS_CONFIRMED', 'TIMELINE_GENERATING', 'TIMELINE_READY',
    'GENERATION_FAILED', 'SUMMARY_READY', 'ARCHIVED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "GenerationStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ProcessingStatus" AS ENUM (
    'RECEIVED', 'PROCESSING', 'COMPLETED', 'FAILED_RETRYABLE',
    'REQUIRES_RECONCILIATION', 'DUPLICATE'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "plans"
  ADD COLUMN IF NOT EXISTS "creationKey" TEXT,
  ADD COLUMN IF NOT EXISTS "planningStage" "PlanningStage" NOT NULL DEFAULT 'DRAFT_INPUT',
  ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "lastError" TEXT,
  ADD COLUMN IF NOT EXISTS "legacyImportCompletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS "plans_creationKey_key" ON "plans"("creationKey");
CREATE INDEX IF NOT EXISTS "plans_userId_updatedAt_idx" ON "plans"("userId", "updatedAt");

ALTER TABLE "tier_action_logs"
  ADD COLUMN IF NOT EXISTS "status" "GenerationStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS "refundedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "errorCode" TEXT;

ALTER TABLE "credit_ledger"
  ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT,
  ADD COLUMN IF NOT EXISTS "generationId" TEXT,
  ADD COLUMN IF NOT EXISTS "planId" TEXT,
  ADD COLUMN IF NOT EXISTS "actorType" TEXT NOT NULL DEFAULT 'USER';

CREATE UNIQUE INDEX IF NOT EXISTS "credit_ledger_idempotencyKey_key"
  ON "credit_ledger"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "credit_ledger_generationId_idx"
  ON "credit_ledger"("generationId");
CREATE INDEX IF NOT EXISTS "credit_ledger_planId_idx"
  ON "credit_ledger"("planId");

ALTER TABLE "webhook_events"
  ADD COLUMN IF NOT EXISTS "status" "ProcessingStatus" NOT NULL DEFAULT 'RECEIVED',
  ADD COLUMN IF NOT EXISTS "attemptCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "lastError" TEXT,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS "plan_generations" (
  "id" TEXT PRIMARY KEY,
  "planId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "status" "GenerationStatus" NOT NULL DEFAULT 'PENDING',
  "requestJson" JSONB,
  "resultJson" JSONB,
  "errorCode" TEXT,
  "errorMessage" TEXT,
  "chargedAt" TIMESTAMP(3),
  "refundedAt" TIMESTAMP(3),
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "plan_generations_idempotencyKey_key"
  ON "plan_generations"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "plan_generations_userId_createdAt_idx"
  ON "plan_generations"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "plan_generations_planId_status_idx"
  ON "plan_generations"("planId", "status");

DO $$ BEGIN
  ALTER TABLE "plan_generations"
    ADD CONSTRAINT "plan_generations_planId_fkey"
    FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "plan_generations" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "plan_generations_owner_select" ON "plan_generations";
CREATE POLICY "plan_generations_owner_select" ON "plan_generations"
  FOR SELECT TO authenticated
  USING ("userId" = (select auth.uid())::text);

-- Mutations remain server-only. No INSERT/UPDATE/DELETE policy is intentionally
-- granted to authenticated or anonymous Data API clients.

-- Restrict the helper to authenticated users. It accepts no caller-controlled
-- arguments and is used only to evaluate the server-owned profile role.
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

ALTER TABLE IF EXISTS "PlanInput" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "PlanRecommendation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "saved_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "bookings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "booking_clicks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "recently_viewed" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "user_activity" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "travel_reminders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "travel_preferences" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "favorite_plans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "favorite_destinations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "wishlist_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "in_app_notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "travel_documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "admin_audit_logs" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "plan_inputs_owner_select" ON "PlanInput";
CREATE POLICY "plan_inputs_owner_select" ON "PlanInput"
  FOR SELECT TO authenticated
  USING ("userId" = (select auth.uid())::text OR public.is_admin());

DROP POLICY IF EXISTS "plan_recommendations_owner_select" ON "PlanRecommendation";
CREATE POLICY "plan_recommendations_owner_select" ON "PlanRecommendation"
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM "PlanInput" input
    WHERE input.id = "planInputId"
      AND (input."userId" = (select auth.uid())::text OR public.is_admin())
  ));

-- Customer-owned utility tables may be read directly by their owner. Writes
-- remain routed through authenticated server APIs unless an existing policy is
-- explicitly retained in an earlier migration.
DROP POLICY IF EXISTS "saved_items_owner_select" ON "saved_items";
CREATE POLICY "saved_items_owner_select" ON "saved_items" FOR SELECT TO authenticated
  USING ("userId" = (select auth.uid())::text OR public.is_admin());
DROP POLICY IF EXISTS "bookings_owner_select" ON "bookings";
CREATE POLICY "bookings_owner_select" ON "bookings" FOR SELECT TO authenticated
  USING ("userId" = (select auth.uid())::text OR public.is_admin());
DROP POLICY IF EXISTS "booking_clicks_owner_select" ON "booking_clicks";
CREATE POLICY "booking_clicks_owner_select" ON "booking_clicks" FOR SELECT TO authenticated
  USING ("userId" = (select auth.uid())::text OR public.is_admin());
DROP POLICY IF EXISTS "recently_viewed_owner_select" ON "recently_viewed";
CREATE POLICY "recently_viewed_owner_select" ON "recently_viewed" FOR SELECT TO authenticated
  USING ("userId" = (select auth.uid())::text OR public.is_admin());
DROP POLICY IF EXISTS "user_activities_owner_select" ON "user_activity";
CREATE POLICY "user_activities_owner_select" ON "user_activity" FOR SELECT TO authenticated
  USING ("userId" = (select auth.uid())::text OR public.is_admin());

-- Private travel documents: metadata and object paths are owner-only. Uploads,
-- replacement and deletion still pass through server validation.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gene-travel-documents', 'gene-travel-documents', false, 10485760,
  ARRAY['application/pdf','image/jpeg','image/png','image/webp','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "travel_documents_owner_read" ON storage.objects;
CREATE POLICY "travel_documents_owner_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'gene-travel-documents'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
  );
