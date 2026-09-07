-- Additive compatibility for Gene admin intelligence.
-- This migration only creates missing tables/columns/indexes. It does not delete,
-- overwrite, reseed, or transform existing users, ready plans, drafts, images,
-- affiliate links, offers, payments, or analytics rows.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS "analytics_events" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT,
  "anonymousId" TEXT,
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
  "planId" TEXT,
  "readyPlanId" TEXT,
  "itemId" TEXT,
  "destination" TEXT,
  "provider" TEXT,
  "utmSource" TEXT,
  "utmMedium" TEXT,
  "utmCampaign" TEXT,
  "utmContent" TEXT,
  "utmTerm" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "analytics_events" ADD COLUMN IF NOT EXISTS "anonymousId" TEXT;
ALTER TABLE "analytics_events" ADD COLUMN IF NOT EXISTS "planId" TEXT;
ALTER TABLE "analytics_events" ADD COLUMN IF NOT EXISTS "readyPlanId" TEXT;
ALTER TABLE "analytics_events" ADD COLUMN IF NOT EXISTS "itemId" TEXT;
ALTER TABLE "analytics_events" ADD COLUMN IF NOT EXISTS "destination" TEXT;
ALTER TABLE "analytics_events" ADD COLUMN IF NOT EXISTS "provider" TEXT;
ALTER TABLE "analytics_events" ADD COLUMN IF NOT EXISTS "utmSource" TEXT;
ALTER TABLE "analytics_events" ADD COLUMN IF NOT EXISTS "utmMedium" TEXT;
ALTER TABLE "analytics_events" ADD COLUMN IF NOT EXISTS "utmCampaign" TEXT;
ALTER TABLE "analytics_events" ADD COLUMN IF NOT EXISTS "utmContent" TEXT;
ALTER TABLE "analytics_events" ADD COLUMN IF NOT EXISTS "utmTerm" TEXT;

CREATE INDEX IF NOT EXISTS "analytics_events_eventName_createdAt_idx" ON "analytics_events"("eventName", "createdAt");
CREATE INDEX IF NOT EXISTS "analytics_events_sessionId_createdAt_idx" ON "analytics_events"("sessionId", "createdAt");
CREATE INDEX IF NOT EXISTS "analytics_events_anonymousId_createdAt_idx" ON "analytics_events"("anonymousId", "createdAt");
CREATE INDEX IF NOT EXISTS "analytics_events_userId_createdAt_idx" ON "analytics_events"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "analytics_events_country_createdAt_idx" ON "analytics_events"("country", "createdAt");
CREATE INDEX IF NOT EXISTS "analytics_events_pagePath_createdAt_idx" ON "analytics_events"("pagePath", "createdAt");
CREATE INDEX IF NOT EXISTS "analytics_events_readyPlanId_createdAt_idx" ON "analytics_events"("readyPlanId", "createdAt");
CREATE INDEX IF NOT EXISTS "analytics_events_itemId_createdAt_idx" ON "analytics_events"("itemId", "createdAt");
CREATE INDEX IF NOT EXISTS "analytics_events_provider_createdAt_idx" ON "analytics_events"("provider", "createdAt");

CREATE TABLE IF NOT EXISTS "analytics_sessions" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT,
  "anonymousId" TEXT,
  "firstPage" TEXT,
  "lastPage" TEXT,
  "referrer" TEXT,
  "utmSource" TEXT,
  "utmMedium" TEXT,
  "utmCampaign" TEXT,
  "utmContent" TEXT,
  "utmTerm" TEXT,
  "pageViews" INTEGER NOT NULL DEFAULT 0,
  "metadata" JSONB,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "analytics_sessions_userId_idx" ON "analytics_sessions"("userId");
CREATE INDEX IF NOT EXISTS "analytics_sessions_anonymousId_idx" ON "analytics_sessions"("anonymousId");
CREATE INDEX IF NOT EXISTS "analytics_sessions_startedAt_idx" ON "analytics_sessions"("startedAt");

CREATE TABLE IF NOT EXISTS "conversion_events" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT,
  "sessionId" TEXT NOT NULL,
  "conversionType" TEXT NOT NULL,
  "value" DOUBLE PRECISION,
  "currency" TEXT,
  "source" TEXT,
  "campaign" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "conversion_events_conversionType_createdAt_idx" ON "conversion_events"("conversionType", "createdAt");
CREATE INDEX IF NOT EXISTS "conversion_events_sessionId_createdAt_idx" ON "conversion_events"("sessionId", "createdAt");

CREATE TABLE IF NOT EXISTS "purchase_tracking" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT,
  "paymentId" TEXT,
  "sessionId" TEXT NOT NULL,
  "packageName" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "provider" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "source" TEXT,
  "campaign" TEXT,
  "metaEventId" TEXT,
  "gaClientId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "purchase_tracking_status_createdAt_idx" ON "purchase_tracking"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "purchase_tracking_packageName_createdAt_idx" ON "purchase_tracking"("packageName", "createdAt");
CREATE INDEX IF NOT EXISTS "purchase_tracking_sessionId_createdAt_idx" ON "purchase_tracking"("sessionId", "createdAt");

CREATE TABLE IF NOT EXISTS "funnel_events" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT,
  "sessionId" TEXT NOT NULL,
  "stepName" TEXT NOT NULL,
  "stepOrder" INTEGER NOT NULL,
  "pagePath" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "funnel_events_stepOrder_createdAt_idx" ON "funnel_events"("stepOrder", "createdAt");
CREATE INDEX IF NOT EXISTS "funnel_events_sessionId_createdAt_idx" ON "funnel_events"("sessionId", "createdAt");

CREATE TABLE IF NOT EXISTS "customer_events" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT,
  "email" TEXT,
  "eventType" TEXT NOT NULL,
  "value" DOUBLE PRECISION,
  "currency" TEXT,
  "meta" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "customer_events_eventType_idx" ON "customer_events"("eventType");
CREATE INDEX IF NOT EXISTS "customer_events_createdAt_idx" ON "customer_events"("createdAt");
CREATE INDEX IF NOT EXISTS "customer_events_userId_createdAt_idx" ON "customer_events"("userId", "createdAt");

CREATE TABLE IF NOT EXISTS "traffic_events" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT,
  "sessionId" TEXT,
  "path" TEXT,
  "source" TEXT,
  "medium" TEXT,
  "campaign" TEXT,
  "country" TEXT,
  "eventType" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "traffic_events_eventType_createdAt_idx" ON "traffic_events"("eventType", "createdAt");
CREATE INDEX IF NOT EXISTS "traffic_events_source_createdAt_idx" ON "traffic_events"("source", "createdAt");

CREATE TABLE IF NOT EXISTS "user_attribution" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT,
  "anonymousId" TEXT,
  "sessionId" TEXT,
  "firstPage" TEXT,
  "lastPage" TEXT,
  "referrer" TEXT,
  "utmSource" TEXT,
  "utmMedium" TEXT,
  "utmCampaign" TEXT,
  "utmContent" TEXT,
  "utmTerm" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "user_attribution_userId_idx" ON "user_attribution"("userId");
CREATE INDEX IF NOT EXISTS "user_attribution_anonymousId_idx" ON "user_attribution"("anonymousId");
CREATE INDEX IF NOT EXISTS "user_attribution_sessionId_idx" ON "user_attribution"("sessionId");

CREATE TABLE IF NOT EXISTS "admin_settings" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "key" TEXT NOT NULL,
  "value" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "admin_settings" ADD COLUMN IF NOT EXISTS "key" TEXT NOT NULL DEFAULT '';
ALTER TABLE "admin_settings" ADD COLUMN IF NOT EXISTS "value" JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE "admin_settings" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "admin_settings" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS "admin_settings_key_key" ON "admin_settings"("key");

CREATE TABLE IF NOT EXISTS "accounting_entries" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "day" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "meta" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "accounting_entries" ADD COLUMN IF NOT EXISTS "day" TEXT NOT NULL DEFAULT '';
ALTER TABLE "accounting_entries" ADD COLUMN IF NOT EXISTS "kind" TEXT NOT NULL DEFAULT 'general';
ALTER TABLE "accounting_entries" ADD COLUMN IF NOT EXISTS "title" TEXT NOT NULL DEFAULT '';
ALTER TABLE "accounting_entries" ADD COLUMN IF NOT EXISTS "amount" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "accounting_entries" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'USD';
ALTER TABLE "accounting_entries" ADD COLUMN IF NOT EXISTS "meta" JSONB;
ALTER TABLE "accounting_entries" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS "accounting_entries_day_idx" ON "accounting_entries"("day");

CREATE TABLE IF NOT EXISTS "api_health_logs" (
  "id" TEXT PRIMARY KEY,
  "serviceName" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "responseTime" INTEGER,
  "errorMessage" TEXT,
  "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "api_health_logs" ADD COLUMN IF NOT EXISTS "serviceName" TEXT NOT NULL DEFAULT 'unknown';
ALTER TABLE "api_health_logs" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'UNKNOWN';
ALTER TABLE "api_health_logs" ADD COLUMN IF NOT EXISTS "responseTime" INTEGER;
ALTER TABLE "api_health_logs" ADD COLUMN IF NOT EXISTS "errorMessage" TEXT;
ALTER TABLE "api_health_logs" ADD COLUMN IF NOT EXISTS "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS "api_health_logs_serviceName_checkedAt_idx" ON "api_health_logs"("serviceName", "checkedAt");

CREATE TABLE IF NOT EXISTS "ai_usage_logs" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT,
  "customerEmail" TEXT,
  "passId" TEXT,
  "actionType" TEXT NOT NULL,
  "inputTokens" INTEGER,
  "outputTokens" INTEGER,
  "totalTokens" INTEGER,
  "model" TEXT,
  "estimatedCost" DOUBLE PRECISION,
  "status" TEXT NOT NULL DEFAULT 'SUCCESS',
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "ai_usage_logs" ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "ai_usage_logs" ADD COLUMN IF NOT EXISTS "customerEmail" TEXT;
ALTER TABLE "ai_usage_logs" ADD COLUMN IF NOT EXISTS "passId" TEXT;
ALTER TABLE "ai_usage_logs" ADD COLUMN IF NOT EXISTS "actionType" TEXT NOT NULL DEFAULT 'UNKNOWN';
ALTER TABLE "ai_usage_logs" ADD COLUMN IF NOT EXISTS "inputTokens" INTEGER;
ALTER TABLE "ai_usage_logs" ADD COLUMN IF NOT EXISTS "outputTokens" INTEGER;
ALTER TABLE "ai_usage_logs" ADD COLUMN IF NOT EXISTS "totalTokens" INTEGER;
ALTER TABLE "ai_usage_logs" ADD COLUMN IF NOT EXISTS "model" TEXT;
ALTER TABLE "ai_usage_logs" ADD COLUMN IF NOT EXISTS "estimatedCost" DOUBLE PRECISION;
ALTER TABLE "ai_usage_logs" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'SUCCESS';
ALTER TABLE "ai_usage_logs" ADD COLUMN IF NOT EXISTS "errorMessage" TEXT;
ALTER TABLE "ai_usage_logs" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS "ai_usage_logs_userId_idx" ON "ai_usage_logs"("userId");
CREATE INDEX IF NOT EXISTS "ai_usage_logs_passId_idx" ON "ai_usage_logs"("passId");
CREATE INDEX IF NOT EXISTS "ai_usage_logs_status_createdAt_idx" ON "ai_usage_logs"("status", "createdAt");

CREATE TABLE IF NOT EXISTS "rate_limit_logs" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT,
  "customerEmail" TEXT,
  "passId" TEXT,
  "actionType" TEXT NOT NULL,
  "limitType" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "rate_limit_logs" ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "rate_limit_logs" ADD COLUMN IF NOT EXISTS "customerEmail" TEXT;
ALTER TABLE "rate_limit_logs" ADD COLUMN IF NOT EXISTS "passId" TEXT;
ALTER TABLE "rate_limit_logs" ADD COLUMN IF NOT EXISTS "actionType" TEXT NOT NULL DEFAULT 'UNKNOWN';
ALTER TABLE "rate_limit_logs" ADD COLUMN IF NOT EXISTS "limitType" TEXT NOT NULL DEFAULT 'UNKNOWN';
ALTER TABLE "rate_limit_logs" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS "rate_limit_logs_userId_idx" ON "rate_limit_logs"("userId");
CREATE INDEX IF NOT EXISTS "rate_limit_logs_passId_idx" ON "rate_limit_logs"("passId");

CREATE TABLE IF NOT EXISTS "affiliate_links" (
  "id" TEXT PRIMARY KEY,
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
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "affiliate_links" ADD COLUMN IF NOT EXISTS "provider" TEXT NOT NULL DEFAULT 'unknown';
ALTER TABLE "affiliate_links" ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'general';
ALTER TABLE "affiliate_links" ADD COLUMN IF NOT EXISTS "country" TEXT;
ALTER TABLE "affiliate_links" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "affiliate_links" ADD COLUMN IF NOT EXISTS "destination" TEXT;
ALTER TABLE "affiliate_links" ADD COLUMN IF NOT EXISTS "label" TEXT;
ALTER TABLE "affiliate_links" ADD COLUMN IF NOT EXISTS "url" TEXT NOT NULL DEFAULT '';
ALTER TABLE "affiliate_links" ADD COLUMN IF NOT EXISTS "trackingId" TEXT;
ALTER TABLE "affiliate_links" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "affiliate_links" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "affiliate_links" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "affiliate_links" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS "affiliate_links_provider_category_idx" ON "affiliate_links"("provider", "category");

CREATE TABLE IF NOT EXISTS "error_logs" (
  "id" TEXT PRIMARY KEY,
  "source" TEXT NOT NULL,
  "level" TEXT NOT NULL DEFAULT 'ERROR',
  "message" TEXT NOT NULL,
  "stack" TEXT,
  "metadata" JSONB,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3)
);

ALTER TABLE "error_logs" ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'unknown';
ALTER TABLE "error_logs" ADD COLUMN IF NOT EXISTS "level" TEXT NOT NULL DEFAULT 'ERROR';
ALTER TABLE "error_logs" ADD COLUMN IF NOT EXISTS "message" TEXT NOT NULL DEFAULT '';
ALTER TABLE "error_logs" ADD COLUMN IF NOT EXISTS "stack" TEXT;
ALTER TABLE "error_logs" ADD COLUMN IF NOT EXISTS "metadata" JSONB;
ALTER TABLE "error_logs" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'OPEN';
ALTER TABLE "error_logs" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "error_logs" ADD COLUMN IF NOT EXISTS "resolvedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "error_logs_source_status_idx" ON "error_logs"("source", "status");

CREATE TABLE IF NOT EXISTS "webhook_events" (
  "id" TEXT PRIMARY KEY,
  "provider" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "processed" BOOLEAN NOT NULL DEFAULT false,
  "errorMessage" TEXT,
  "payload" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3)
);

ALTER TABLE "webhook_events" ADD COLUMN IF NOT EXISTS "provider" TEXT NOT NULL DEFAULT 'unknown';
ALTER TABLE "webhook_events" ADD COLUMN IF NOT EXISTS "eventId" TEXT NOT NULL DEFAULT gen_random_uuid()::text;
ALTER TABLE "webhook_events" ADD COLUMN IF NOT EXISTS "eventType" TEXT NOT NULL DEFAULT 'unknown';
ALTER TABLE "webhook_events" ADD COLUMN IF NOT EXISTS "processed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "webhook_events" ADD COLUMN IF NOT EXISTS "errorMessage" TEXT;
ALTER TABLE "webhook_events" ADD COLUMN IF NOT EXISTS "payload" JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE "webhook_events" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "webhook_events" ADD COLUMN IF NOT EXISTS "processedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "webhook_events_eventId_key" ON "webhook_events"("eventId");
CREATE INDEX IF NOT EXISTS "webhook_events_provider_idx" ON "webhook_events"("provider");

CREATE TABLE IF NOT EXISTS "support_tickets" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT,
  "email" TEXT NOT NULL,
  "subject" TEXT,
  "message" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
  "adminNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "email" TEXT NOT NULL DEFAULT '';
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "subject" TEXT;
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "message" TEXT NOT NULL DEFAULT '';
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'OPEN';
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "priority" TEXT NOT NULL DEFAULT 'MEDIUM';
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "adminNote" TEXT;
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS "support_tickets_email_status_idx" ON "support_tickets"("email", "status");
