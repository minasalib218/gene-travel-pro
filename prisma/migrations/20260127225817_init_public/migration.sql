-- CreateEnum
CREATE TYPE "PassStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELED');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('DRAFT', 'RECOMMENDED', 'ANALYZED');

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "fullName" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "passes" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tier" TEXT NOT NULL,
    "status" "PassStatus" NOT NULL DEFAULT 'ACTIVE',
    "tierActionsTotal" INTEGER NOT NULL DEFAULT 0,
    "tierActionsUsed" INTEGER NOT NULL DEFAULT 0,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "passes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "passId" UUID,
    "status" "PlanStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "inputsJson" JSONB,
    "analysisJson" JSONB,
    "summaryJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_days" (
    "id" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "dayIndex" INTEGER NOT NULL,
    "date" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_items" (
    "id" UUID NOT NULL,
    "planDayId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "provider" TEXT,
    "providerId" TEXT,
    "imageUrl" TEXT,
    "deepLink" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tier_actions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "passId" UUID NOT NULL,
    "actionType" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tier_actions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "passes_userId_idx" ON "passes"("userId");

-- CreateIndex
CREATE INDEX "passes_status_idx" ON "passes"("status");

-- CreateIndex
CREATE INDEX "plans_userId_idx" ON "plans"("userId");

-- CreateIndex
CREATE INDEX "plans_passId_idx" ON "plans"("passId");

-- CreateIndex
CREATE INDEX "plans_status_idx" ON "plans"("status");

-- CreateIndex
CREATE INDEX "plan_days_planId_idx" ON "plan_days"("planId");

-- CreateIndex
CREATE UNIQUE INDEX "plan_days_planId_dayIndex_key" ON "plan_days"("planId", "dayIndex");

-- CreateIndex
CREATE INDEX "plan_items_planDayId_idx" ON "plan_items"("planDayId");

-- CreateIndex
CREATE INDEX "plan_items_type_idx" ON "plan_items"("type");

-- CreateIndex
CREATE INDEX "tier_actions_userId_idx" ON "tier_actions"("userId");

-- CreateIndex
CREATE INDEX "tier_actions_passId_idx" ON "tier_actions"("passId");

-- CreateIndex
CREATE UNIQUE INDEX "tier_actions_passId_actionType_idempotencyKey_key" ON "tier_actions"("passId", "actionType", "idempotencyKey");

-- AddForeignKey
ALTER TABLE "passes" ADD CONSTRAINT "passes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plans" ADD CONSTRAINT "plans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plans" ADD CONSTRAINT "plans_passId_fkey" FOREIGN KEY ("passId") REFERENCES "passes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_days" ADD CONSTRAINT "plan_days_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_items" ADD CONSTRAINT "plan_items_planDayId_fkey" FOREIGN KEY ("planDayId") REFERENCES "plan_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;
