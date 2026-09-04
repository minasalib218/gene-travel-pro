-- Additive profile compatibility migration for customer auth/profile access.
-- This keeps existing data and only adds/backfills columns expected by the app.

ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "fullName" TEXT;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'full_name'
  ) THEN
    EXECUTE 'UPDATE "profiles" SET "fullName" = COALESCE("fullName", "full_name") WHERE "fullName" IS NULL';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'avatar_url'
  ) THEN
    EXECUTE 'UPDATE "profiles" SET "avatarUrl" = COALESCE("avatarUrl", "avatar_url") WHERE "avatarUrl" IS NULL';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'created_at'
  ) THEN
    EXECUTE 'UPDATE "profiles" SET "createdAt" = COALESCE("createdAt", "created_at")';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'updated_at'
  ) THEN
    EXECUTE 'UPDATE "profiles" SET "updatedAt" = COALESCE("updatedAt", "updated_at")';
  END IF;
END $$;
