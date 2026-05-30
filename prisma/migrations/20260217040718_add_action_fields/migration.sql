/*
  Warnings:

  - You are about to drop the `tier_action_logs` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "tier_action_logs";

-- CreateTable
CREATE TABLE "TierActionLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "passId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "meta" JSONB,
    "actionType" TEXT,
    "planId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TierActionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TierActionLog_idempotencyKey_key" ON "TierActionLog"("idempotencyKey");
