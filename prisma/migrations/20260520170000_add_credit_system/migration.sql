ALTER TABLE "passes"
ADD COLUMN "planType" TEXT,
ADD COLUMN "mainCreditsTotal" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "mainCreditsUsed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "editCreditsTotal" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "editCreditsUsed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "whatIfFreeTotal" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "whatIfFreeUsed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "chatMessagesTotal" INTEGER,
ADD COLUMN "chatMessagesUsed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "expertReviewTotal" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "expertReviewUsed" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "credit_ledger"
ADD COLUMN "actionType" TEXT,
ADD COLUMN "creditType" TEXT,
ADD COLUMN "balanceBefore" INTEGER,
ADD COLUMN "balanceAfter" INTEGER,
ADD COLUMN "metadata" JSONB;

CREATE TABLE "ai_usage_logs" (
  "id" TEXT NOT NULL,
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
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ai_usage_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_usage_logs_userId_idx" ON "ai_usage_logs"("userId");
CREATE INDEX "ai_usage_logs_passId_idx" ON "ai_usage_logs"("passId");

ALTER TABLE "ai_usage_logs"
ADD CONSTRAINT "ai_usage_logs_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ai_usage_logs"
ADD CONSTRAINT "ai_usage_logs_passId_fkey"
FOREIGN KEY ("passId") REFERENCES "passes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "rate_limit_logs" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "customerEmail" TEXT,
  "passId" TEXT,
  "actionType" TEXT NOT NULL,
  "limitType" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "rate_limit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "rate_limit_logs_userId_idx" ON "rate_limit_logs"("userId");
CREATE INDEX "rate_limit_logs_passId_idx" ON "rate_limit_logs"("passId");

ALTER TABLE "rate_limit_logs"
ADD CONSTRAINT "rate_limit_logs_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "rate_limit_logs"
ADD CONSTRAINT "rate_limit_logs_passId_fkey"
FOREIGN KEY ("passId") REFERENCES "passes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
