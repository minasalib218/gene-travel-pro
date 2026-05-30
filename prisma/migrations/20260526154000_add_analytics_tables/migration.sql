CREATE TABLE IF NOT EXISTS "analytics_events" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "sessionId" TEXT NOT NULL,
  "eventName" TEXT NOT NULL,
  "eventCategory" TEXT,
  "pagePath" TEXT,
  "referrer" TEXT,
  "country" TEXT,
  "city" TEXT,
  "deviceType" TEXT,
  "browser" TEXT,
  "os" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "conversion_events" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "sessionId" TEXT NOT NULL,
  "conversionType" TEXT NOT NULL,
  "value" DOUBLE PRECISION,
  "currency" TEXT,
  "source" TEXT,
  "campaign" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "conversion_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "purchase_tracking" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "paymentId" TEXT,
  "sessionId" TEXT NOT NULL,
  "packageName" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "currency" TEXT NOT NULL,
  "provider" TEXT,
  "status" TEXT NOT NULL,
  "source" TEXT,
  "campaign" TEXT,
  "metaEventId" TEXT,
  "gaClientId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "purchase_tracking_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "funnel_events" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "sessionId" TEXT NOT NULL,
  "stepName" TEXT NOT NULL,
  "stepOrder" INTEGER NOT NULL,
  "pagePath" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "funnel_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "analytics_events_eventName_createdAt_idx" ON "analytics_events"("eventName", "createdAt");
CREATE INDEX IF NOT EXISTS "analytics_events_sessionId_createdAt_idx" ON "analytics_events"("sessionId", "createdAt");
CREATE INDEX IF NOT EXISTS "analytics_events_country_createdAt_idx" ON "analytics_events"("country", "createdAt");

CREATE INDEX IF NOT EXISTS "conversion_events_conversionType_createdAt_idx" ON "conversion_events"("conversionType", "createdAt");
CREATE INDEX IF NOT EXISTS "conversion_events_sessionId_createdAt_idx" ON "conversion_events"("sessionId", "createdAt");

CREATE INDEX IF NOT EXISTS "purchase_tracking_status_createdAt_idx" ON "purchase_tracking"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "purchase_tracking_packageName_createdAt_idx" ON "purchase_tracking"("packageName", "createdAt");
CREATE INDEX IF NOT EXISTS "purchase_tracking_sessionId_createdAt_idx" ON "purchase_tracking"("sessionId", "createdAt");

CREATE INDEX IF NOT EXISTS "funnel_events_stepOrder_createdAt_idx" ON "funnel_events"("stepOrder", "createdAt");
CREATE INDEX IF NOT EXISTS "funnel_events_sessionId_createdAt_idx" ON "funnel_events"("sessionId", "createdAt");
