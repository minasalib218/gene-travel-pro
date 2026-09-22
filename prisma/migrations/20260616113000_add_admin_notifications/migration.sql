CREATE TABLE IF NOT EXISTS "admin_notifications" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "user_id" TEXT,
  "email" TEXT,
  "tier" TEXT,
  "payment_id" TEXT,
  "order_id" TEXT,
  "message" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "admin_notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "admin_notifications_user_id_idx" ON "admin_notifications"("user_id");
CREATE INDEX IF NOT EXISTS "admin_notifications_status_idx" ON "admin_notifications"("status");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'admin_notifications_user_id_fkey'
      AND table_name = 'admin_notifications'
  ) THEN
    ALTER TABLE "admin_notifications"
      ADD CONSTRAINT "admin_notifications_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "profiles"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'admin_notifications_payment_id_fkey'
      AND table_name = 'admin_notifications'
  ) THEN
    ALTER TABLE "admin_notifications"
      ADD CONSTRAINT "admin_notifications_payment_id_fkey"
      FOREIGN KEY ("payment_id") REFERENCES "payments"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
