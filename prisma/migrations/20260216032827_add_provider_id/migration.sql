/*
  Warnings:

  - You are about to drop the column `budgetUsed` on the `plan_days` table. All the data in the column will be lost.
  - You are about to drop the column `fatigueScore` on the `plan_days` table. All the data in the column will be lost.
  - You are about to drop the column `seasonGenius` on the `plan_days` table. All the data in the column will be lost.
  - You are about to drop the column `travelMinutes` on the `plan_days` table. All the data in the column will be lost.
  - You are about to drop the column `weatherScore` on the `plan_days` table. All the data in the column will be lost.
  - You are about to drop the column `wellnessScore` on the `plan_days` table. All the data in the column will be lost.
  - The `date` column on the `plan_days` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `plan_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `saved_items` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "PlanItemKind" AS ENUM ('ACTIVITY', 'HOTEL', 'FLIGHT', 'TRANSPORT');

-- CreateEnum
CREATE TYPE "SavedItemKind" AS ENUM ('PLAN', 'READY_PLAN');

-- DropForeignKey
ALTER TABLE "passes" DROP CONSTRAINT "passes_userId_fkey";

-- DropForeignKey
ALTER TABLE "plan_items" DROP CONSTRAINT "plan_items_planDayId_fkey";

-- DropIndex
DROP INDEX "passes_status_idx";

-- DropIndex
DROP INDEX "passes_userId_idx";

-- AlterTable
ALTER TABLE "passes" ADD COLUMN     "meta" JSONB,
ADD COLUMN     "profileId" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "plan_days" DROP COLUMN "budgetUsed",
DROP COLUMN "fatigueScore",
DROP COLUMN "seasonGenius",
DROP COLUMN "travelMinutes",
DROP COLUMN "weatherScore",
DROP COLUMN "wellnessScore",
DROP COLUMN "date",
ADD COLUMN     "date" TIMESTAMP(3);

-- DropTable
DROP TABLE "plan_items";

-- DropTable
DROP TABLE "saved_items";

-- CreateTable
CREATE TABLE "PlanItem" (
    "id" TEXT NOT NULL,
    "planDayId" TEXT NOT NULL,
    "slot" "PlanItemSlot" NOT NULL,
    "kind" TEXT NOT NULL,
    "provider" TEXT,
    "providerId" TEXT,
    "imageUrl" TEXT,
    "deeplink" TEXT,
    "meta" JSONB,

    CONSTRAINT "PlanItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "SavedItemKind" NOT NULL,
    "refId" TEXT NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlanItem_planDayId_idx" ON "PlanItem"("planDayId");

-- CreateIndex
CREATE INDEX "plan_days_planId_dayIndex_idx" ON "plan_days"("planId", "dayIndex");

-- AddForeignKey
ALTER TABLE "passes" ADD CONSTRAINT "passes_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanItem" ADD CONSTRAINT "PlanItem_planDayId_fkey" FOREIGN KEY ("planDayId") REFERENCES "plan_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;
