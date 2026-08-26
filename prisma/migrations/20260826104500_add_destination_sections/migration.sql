ALTER TABLE "destinations"
ADD COLUMN IF NOT EXISTS "section" TEXT NOT NULL DEFAULT 'asia';

CREATE INDEX IF NOT EXISTS "destinations_section_status_updatedAt_idx"
ON "destinations"("section", "status", "updatedAt");
