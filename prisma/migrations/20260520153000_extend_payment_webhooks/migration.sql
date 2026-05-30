-- Extend payments and passes for secure webhook processing
ALTER TABLE "passes"
ADD COLUMN "customerEmail" TEXT,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "payments"
ADD COLUMN "customerEmail" TEXT,
ADD COLUMN "providerCustomerId" TEXT,
ADD COLUMN "providerPaymentId" TEXT,
ADD COLUMN "subscriptionId" TEXT;

ALTER TABLE "webhook_events"
ADD COLUMN "errorMessage" TEXT,
ADD COLUMN "processedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "payments_providerPaymentId_key" ON "payments"("providerPaymentId");

CREATE TABLE "credit_ledger" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "customerEmail" TEXT,
  "passId" TEXT,
  "paymentId" TEXT,
  "type" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "credit_ledger_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "credit_ledger_userId_idx" ON "credit_ledger"("userId");
CREATE INDEX "credit_ledger_paymentId_idx" ON "credit_ledger"("paymentId");
CREATE INDEX "credit_ledger_passId_idx" ON "credit_ledger"("passId");

ALTER TABLE "credit_ledger"
ADD CONSTRAINT "credit_ledger_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "credit_ledger"
ADD CONSTRAINT "credit_ledger_passId_fkey"
FOREIGN KEY ("passId") REFERENCES "passes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "credit_ledger"
ADD CONSTRAINT "credit_ledger_paymentId_fkey"
FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "email_logs" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "customerEmail" TEXT,
  "paymentId" TEXT,
  "type" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "provider" TEXT,
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "email_logs_userId_idx" ON "email_logs"("userId");
CREATE INDEX "email_logs_paymentId_idx" ON "email_logs"("paymentId");

ALTER TABLE "email_logs"
ADD CONSTRAINT "email_logs_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "email_logs"
ADD CONSTRAINT "email_logs_paymentId_fkey"
FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
