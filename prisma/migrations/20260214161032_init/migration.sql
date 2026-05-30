/*
  Warnings:

  - The primary key for the `passes` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `plan_days` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `plan_days` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `plan_days` table. All the data in the column will be lost.
  - The primary key for the `plan_items` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `plan_items` table. All the data in the column will be lost.
  - You are about to drop the column `deepLink` on the `plan_items` table. All the data in the column will be lost.
  - You are about to drop the column `providerId` on the `plan_items` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `plan_items` table. All the data in the column will be lost.
  - The primary key for the `plans` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `updatedAt` on the `plans` table. All the data in the column will be lost.
  - The primary key for the `profiles` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `fullName` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the `tier_actions` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `date` on table `plan_days` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `providerRef` to the `plan_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slot` to the `plan_items` table without a default value. This is not possible if the table is not empty.
  - Made the column `startTime` on table `plan_items` required. This step will fail if there are existing NULL values in that column.
  - Made the column `endTime` on table `plan_items` required. This step will fail if there are existing NULL values in that column.
  - Made the column `provider` on table `plan_items` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "PlanItemSlot" AS ENUM ('MORNING', 'MIDDAY', 'AFTERNOON', 'EVENING');

-- AlterEnum
ALTER TYPE "PlanStatus" ADD VALUE 'CONFIRMED';

-- DropForeignKey
ALTER TABLE "passes" DROP CONSTRAINT "passes_userId_fkey";

-- DropForeignKey
ALTER TABLE "plan_days" DROP CONSTRAINT "plan_days_planId_fkey";

-- DropForeignKey
ALTER TABLE "plan_items" DROP CONSTRAINT "plan_items_planDayId_fkey";

-- DropForeignKey
ALTER TABLE "plans" DROP CONSTRAINT "plans_passId_fkey";

-- DropForeignKey
ALTER TABLE "plans" DROP CONSTRAINT "plans_userId_fkey";

-- DropIndex
DROP INDEX "plan_days_planId_dayIndex_key";

-- DropIndex
DROP INDEX "plan_items_type_idx";

-- DropIndex
DROP INDEX "plans_status_idx";

-- AlterTable
ALTER TABLE "passes" DROP CONSTRAINT "passes_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "userId" SET DATA TYPE TEXT,
ADD CONSTRAINT "passes_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "plan_days" DROP CONSTRAINT "plan_days_pkey",
DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "budgetUsed" INTEGER,
ADD COLUMN     "fatigueScore" DOUBLE PRECISION,
ADD COLUMN     "seasonGenius" DOUBLE PRECISION,
ADD COLUMN     "travelMinutes" INTEGER,
ADD COLUMN     "weatherScore" DOUBLE PRECISION,
ADD COLUMN     "wellnessScore" DOUBLE PRECISION,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "planId" SET DATA TYPE TEXT,
ALTER COLUMN "date" SET NOT NULL,
ALTER COLUMN "date" SET DATA TYPE TEXT,
ADD CONSTRAINT "plan_days_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "plan_items" DROP CONSTRAINT "plan_items_pkey",
DROP COLUMN "createdAt",
DROP COLUMN "deepLink",
DROP COLUMN "providerId",
DROP COLUMN "updatedAt",
ADD COLUMN     "affiliateUrl" TEXT,
ADD COLUMN     "fatigueImpact" DOUBLE PRECISION,
ADD COLUMN     "preferenceScore" DOUBLE PRECISION,
ADD COLUMN     "priceAmount" INTEGER,
ADD COLUMN     "priceCurrency" TEXT,
ADD COLUMN     "providerRef" TEXT NOT NULL,
ADD COLUMN     "safetyScore" DOUBLE PRECISION,
ADD COLUMN     "seasonScore" DOUBLE PRECISION,
ADD COLUMN     "slot" "PlanItemSlot" NOT NULL,
ADD COLUMN     "subtitle" TEXT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "planDayId" SET DATA TYPE TEXT,
ALTER COLUMN "startTime" SET NOT NULL,
ALTER COLUMN "endTime" SET NOT NULL,
ALTER COLUMN "provider" SET NOT NULL,
ADD CONSTRAINT "plan_items_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "plans" DROP CONSTRAINT "plans_pkey",
DROP COLUMN "updatedAt",
ADD COLUMN     "recommendationJson" JSONB,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "userId" SET DATA TYPE TEXT,
ALTER COLUMN "passId" SET DATA TYPE TEXT,
ADD CONSTRAINT "plans_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "profiles" DROP CONSTRAINT "profiles_pkey",
DROP COLUMN "fullName",
DROP COLUMN "phone",
DROP COLUMN "updatedAt",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "tier_actions";

-- CreateTable
CREATE TABLE "activation_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "passTier" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activation_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tier_action_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "passId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tier_action_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_items" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "refId" TEXT NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deals" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "activation_tokens_token_key" ON "activation_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "tier_action_logs_idempotencyKey_key" ON "tier_action_logs"("idempotencyKey");

-- CreateIndex
CREATE INDEX "tier_action_logs_userId_idx" ON "tier_action_logs"("userId");

-- CreateIndex
CREATE INDEX "tier_action_logs_passId_idx" ON "tier_action_logs"("passId");

-- CreateIndex
CREATE INDEX "saved_items_userId_idx" ON "saved_items"("userId");

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
