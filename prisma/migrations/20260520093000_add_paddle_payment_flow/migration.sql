ALTER TYPE "PassStatus" ADD VALUE IF NOT EXISTS 'REFUNDED';

CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "provider" TEXT NOT NULL,
    "providerOrderId" TEXT,
    "providerCheckoutId" TEXT,
    "planType" TEXT NOT NULL,
    "amount" DOUBLE PRECISION,
    "currency" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "passes" ADD COLUMN "paymentId" TEXT;

CREATE UNIQUE INDEX "payments_providerOrderId_key" ON "payments"("providerOrderId");
CREATE UNIQUE INDEX "payments_providerCheckoutId_key" ON "payments"("providerCheckoutId");
CREATE INDEX "payments_userId_idx" ON "payments"("userId");
CREATE INDEX "payments_status_idx" ON "payments"("status");
CREATE UNIQUE INDEX "webhook_events_eventId_key" ON "webhook_events"("eventId");
CREATE INDEX "webhook_events_provider_idx" ON "webhook_events"("provider");
CREATE UNIQUE INDEX "passes_paymentId_key" ON "passes"("paymentId");

ALTER TABLE "payments" ADD CONSTRAINT "payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "passes" ADD CONSTRAINT "passes_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
