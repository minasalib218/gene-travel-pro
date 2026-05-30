ALTER TYPE "ReadyPlanStatus" ADD VALUE IF NOT EXISTS 'ARCHIVED';

ALTER TABLE "ready_plans"
ADD COLUMN "country" TEXT,
ADD COLUMN "city" TEXT,
ADD COLUMN "style" TEXT,
ADD COLUMN "summary" TEXT,
ADD COLUMN "seoTitle" TEXT,
ADD COLUMN "seoDescription" TEXT,
ADD COLUMN "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "season" TEXT,
ADD COLUMN "showOnHome" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "ready_plan_days" (
  "id" TEXT NOT NULL,
  "readyPlanId" TEXT NOT NULL,
  "dayNumber" INTEGER NOT NULL,
  "title" TEXT,
  "description" TEXT,
  "items" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ready_plan_days_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ready_plan_days_readyPlanId_dayNumber_idx" ON "ready_plan_days"("readyPlanId", "dayNumber");
ALTER TABLE "ready_plan_days"
ADD CONSTRAINT "ready_plan_days_readyPlanId_fkey"
FOREIGN KEY ("readyPlanId") REFERENCES "ready_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "affiliate_links" (
  "id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "country" TEXT,
  "city" TEXT,
  "destination" TEXT,
  "label" TEXT,
  "url" TEXT NOT NULL,
  "trackingId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "affiliate_links_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "affiliate_links_provider_category_idx" ON "affiliate_links"("provider", "category");

CREATE TABLE "api_health_logs" (
  "id" TEXT NOT NULL,
  "serviceName" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "responseTime" INTEGER,
  "errorMessage" TEXT,
  "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "api_health_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "api_health_logs_serviceName_checkedAt_idx" ON "api_health_logs"("serviceName", "checkedAt");

CREATE TABLE "error_logs" (
  "id" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "level" TEXT NOT NULL DEFAULT 'ERROR',
  "message" TEXT NOT NULL,
  "stack" TEXT,
  "metadata" JSONB,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  CONSTRAINT "error_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "error_logs_source_status_idx" ON "error_logs"("source", "status");

CREATE TABLE "support_tickets" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "email" TEXT NOT NULL,
  "subject" TEXT,
  "message" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
  "adminNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "support_tickets_email_status_idx" ON "support_tickets"("email", "status");
ALTER TABLE "support_tickets"
ADD CONSTRAINT "support_tickets_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "traffic_events" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "sessionId" TEXT,
  "path" TEXT,
  "source" TEXT,
  "medium" TEXT,
  "campaign" TEXT,
  "country" TEXT,
  "eventType" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "traffic_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "traffic_events_eventType_createdAt_idx" ON "traffic_events"("eventType", "createdAt");
CREATE INDEX "traffic_events_source_createdAt_idx" ON "traffic_events"("source", "createdAt");
ALTER TABLE "traffic_events"
ADD CONSTRAINT "traffic_events_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
