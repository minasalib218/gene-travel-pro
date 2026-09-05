-- Additive compatibility fix for profile confirmed trips.
-- The profile page selects plans.destination, so production needs the column.

ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "destination" TEXT;
