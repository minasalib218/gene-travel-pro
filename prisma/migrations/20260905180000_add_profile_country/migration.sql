-- Additive compatibility fix for the customer profile page.
-- The app selects profiles.country, so production needs the column.

ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "country" TEXT;
