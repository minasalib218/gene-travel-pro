ALTER TABLE "events"
ADD COLUMN IF NOT EXISTS "endDate" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "events_status_endDate_updatedAt_idx"
ON "events"("status", "endDate", "updatedAt");
