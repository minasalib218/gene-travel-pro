-- Additive Gene Travel profile hub and analytics attribution upgrade.
-- This migration intentionally avoids destructive operations.

CREATE TABLE IF NOT EXISTS "analytics_events" (
  "id" TEXT PRIMARY KEY,
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

CREATE INDEX IF NOT EXISTS "analytics_events_anonymousId_createdAt_idx" ON "analytics_events"("anonymousId", "createdAt");
CREATE INDEX IF NOT EXISTS "analytics_events_userId_createdAt_idx" ON "analytics_events"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "analytics_events_readyPlanId_createdAt_idx" ON "analytics_events"("readyPlanId", "createdAt");
CREATE INDEX IF NOT EXISTS "analytics_events_itemId_createdAt_idx" ON "analytics_events"("itemId", "createdAt");
CREATE INDEX IF NOT EXISTS "analytics_events_provider_createdAt_idx" ON "analytics_events"("provider", "createdAt");
CREATE INDEX IF NOT EXISTS "analytics_events_utmSource_createdAt_idx" ON "analytics_events"("utmSource", "createdAt");
CREATE INDEX IF NOT EXISTS "analytics_events_utmCampaign_createdAt_idx" ON "analytics_events"("utmCampaign", "createdAt");

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

CREATE TABLE IF NOT EXISTS "favorite_destinations" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "destinationId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "metadata" JSONB
);

CREATE UNIQUE INDEX IF NOT EXISTS "favorite_destinations_userId_destinationId_key" ON "favorite_destinations"("userId", "destinationId");
CREATE INDEX IF NOT EXISTS "favorite_destinations_userId_idx" ON "favorite_destinations"("userId");
CREATE INDEX IF NOT EXISTS "favorite_destinations_destinationId_idx" ON "favorite_destinations"("destinationId");

CREATE TABLE IF NOT EXISTS "wishlist_items" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "tripName" TEXT,
  "itemType" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "provider" TEXT,
  "destination" TEXT,
  "imageUrl" TEXT,
  "href" TEXT,
  "status" TEXT NOT NULL DEFAULT 'SAVED',
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "wishlist_items_userId_createdAt_idx" ON "wishlist_items"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "wishlist_items_userId_itemType_idx" ON "wishlist_items"("userId", "itemType");

CREATE TABLE IF NOT EXISTS "travel_reminders" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "tripName" TEXT,
  "reminderType" TEXT NOT NULL,
  "reminderDate" TIMESTAMP(3) NOT NULL,
  "reminderTime" TEXT,
  "notes" TEXT,
  "status" TEXT NOT NULL DEFAULT 'UPCOMING',
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "travel_reminders_userId_reminderDate_idx" ON "travel_reminders"("userId", "reminderDate");
CREATE INDEX IF NOT EXISTS "travel_reminders_userId_status_idx" ON "travel_reminders"("userId", "status");

CREATE TABLE IF NOT EXISTS "travel_preferences" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL UNIQUE,
  "travelStyles" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "preferredBudgetMin" INTEGER,
  "preferredBudgetMax" INTEGER,
  "preferredCurrency" TEXT,
  "hotelPreference" TEXT,
  "preferredTransportation" TEXT,
  "preferredRegions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "activityIntensity" TEXT,
  "typicalTripDuration" TEXT,
  "mealPreferences" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "accessibilityRequirements" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "admin_audit_logs" (
  "id" TEXT PRIMARY KEY,
  "adminId" TEXT,
  "action" TEXT NOT NULL,
  "targetType" TEXT,
  "targetId" TEXT,
  "reason" TEXT,
  "previousState" JSONB,
  "nextState" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "admin_audit_logs_adminId_createdAt_idx" ON "admin_audit_logs"("adminId", "createdAt");
CREATE INDEX IF NOT EXISTS "admin_audit_logs_action_createdAt_idx" ON "admin_audit_logs"("action", "createdAt");

CREATE TABLE IF NOT EXISTS "in_app_notifications" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT,
  "status" TEXT NOT NULL DEFAULT 'UNREAD',
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "readAt" TIMESTAMP(3)
);

CREATE INDEX IF NOT EXISTS "in_app_notifications_userId_status_createdAt_idx" ON "in_app_notifications"("userId", "status", "createdAt");
