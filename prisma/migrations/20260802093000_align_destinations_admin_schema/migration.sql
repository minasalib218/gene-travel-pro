-- Align the legacy destinations table with the admin dashboard content editor.
-- This migration is intentionally non-destructive: it only adds missing columns,
-- backfills compatibility values, and relaxes the old required name field.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE public.destinations
  ADD COLUMN IF NOT EXISTS "title" text,
  ADD COLUMN IF NOT EXISTS "slug" text,
  ADD COLUMN IF NOT EXISTS "imageUrl" text,
  ADD COLUMN IF NOT EXISTS "iconUrl" text,
  ADD COLUMN IF NOT EXISTS "affiliateLink" text,
  ADD COLUMN IF NOT EXISTS "description" text,
  ADD COLUMN IF NOT EXISTS "status" text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS "createdAt" timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS "updatedAt" timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.destinations
  ALTER COLUMN id SET DEFAULT gen_random_uuid(),
  ALTER COLUMN name DROP NOT NULL;

UPDATE public.destinations
SET
  "title" = COALESCE(NULLIF("title", ''), NULLIF(name, ''), 'Untitled destination'),
  "slug" = COALESCE(
    NULLIF("slug", ''),
    regexp_replace(lower(COALESCE(NULLIF(name, ''), 'destination-' || id::text)), '[^a-z0-9]+', '-', 'g')
  ),
  "createdAt" = COALESCE("createdAt", created_at, now()),
  "updatedAt" = COALESCE("updatedAt", created_at, now())
WHERE "title" IS NULL
   OR "slug" IS NULL
   OR name IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS destinations_slug_unique ON public.destinations("slug");
CREATE INDEX IF NOT EXISTS destinations_status_updated_at_idx ON public.destinations("status", "updatedAt");
