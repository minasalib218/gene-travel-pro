-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "fullName" TEXT,
ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER';

-- CreateTable
CREATE TABLE "ready_plans" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "destination" TEXT NOT NULL,
    "days" INTEGER NOT NULL DEFAULT 3,
    "priceFrom" INTEGER,
    "currency" TEXT,
    "heroImageUrl" TEXT,
    "gallery" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "slug" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "showOnHome" BOOLEAN NOT NULL DEFAULT false,
    "homeOrder" INTEGER,
    "overview" TEXT,
    "itineraryJson" JSONB,
    "affiliateJson" JSONB,

    CONSTRAINT "ready_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "home_config" (
    "id" TEXT NOT NULL DEFAULT 'home',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "heroTitle" TEXT,
    "heroSubtitle" TEXT,
    "ctaPrimaryText" TEXT,
    "ctaPrimaryHref" TEXT,
    "ctaSecondaryText" TEXT,
    "ctaSecondaryHref" TEXT,

    CONSTRAINT "home_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT,
    "eventType" TEXT NOT NULL,
    "value" DOUBLE PRECISION,
    "currency" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_action_requests" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "meta" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_action_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounting_entries" (
    "id" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accounting_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ready_plans_slug_key" ON "ready_plans"("slug");

-- CreateIndex
CREATE INDEX "customer_events_eventType_idx" ON "customer_events"("eventType");

-- CreateIndex
CREATE INDEX "customer_events_createdAt_idx" ON "customer_events"("createdAt");

-- CreateIndex
CREATE INDEX "admin_action_requests_status_idx" ON "admin_action_requests"("status");

-- CreateIndex
CREATE INDEX "accounting_entries_day_idx" ON "accounting_entries"("day");
