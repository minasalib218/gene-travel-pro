-- Additive, non-destructive travel document metadata table.
-- Stores private Supabase storage keys only; never stores public document URLs or document contents.

CREATE TABLE IF NOT EXISTS "travel_documents" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "tripId" TEXT,
  "type" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "storageKey" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "fileSize" INTEGER NOT NULL,
  "expiryDate" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "travel_documents_userId_createdAt_idx"
  ON "travel_documents"("userId", "createdAt");

CREATE INDEX IF NOT EXISTS "travel_documents_userId_status_idx"
  ON "travel_documents"("userId", "status");

CREATE INDEX IF NOT EXISTS "travel_documents_tripId_idx"
  ON "travel_documents"("tripId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'travel_documents_userId_fkey'
  ) THEN
    ALTER TABLE "travel_documents"
      ADD CONSTRAINT "travel_documents_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "profiles"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "travel_documents" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'travel_documents' AND policyname = 'travel_documents_own_rows'
  ) THEN
    CREATE POLICY "travel_documents_own_rows" ON "travel_documents"
      FOR ALL
      USING (auth.uid()::text = "userId")
      WITH CHECK (auth.uid()::text = "userId");
  END IF;
END $$;
