DO $$
DECLARE
  missing_columns TEXT[];
  rls_enabled BOOLEAN;
BEGIN
  IF to_regclass('public.offers') IS NULL THEN
    RAISE EXCEPTION 'public.offers is missing';
  END IF;

  SELECT ARRAY_AGG(required.column_name)
  INTO missing_columns
  FROM (
    VALUES
      ('id'), ('title'), ('slug'), ('imageUrl'), ('iconUrl'), ('affiliateLink'),
      ('location'), ('country'), ('duration'), ('startingPrice'), ('description'),
      ('discountBadge'), ('expiresAt'), ('featured'), ('showOnHome'), ('status'),
      ('createdAt'), ('updatedAt')
  ) AS required(column_name)
  WHERE NOT EXISTS (
    SELECT 1
    FROM information_schema.columns actual
    WHERE actual.table_schema = 'public'
      AND actual.table_name = 'offers'
      AND actual.column_name = required.column_name
  );

  IF missing_columns IS NOT NULL THEN
    RAISE EXCEPTION 'offers is missing columns: %', missing_columns;
  END IF;

  SELECT relrowsecurity
  INTO rls_enabled
  FROM pg_class
  WHERE oid = 'public.offers'::regclass;

  IF NOT rls_enabled THEN
    RAISE EXCEPTION 'row-level security is not enabled on public.offers';
  END IF;
END $$;

BEGIN;
INSERT INTO "offers" (
  "id", "title", "slug", "status", "featured", "showOnHome", "createdAt", "updatedAt"
) VALUES (
  '__gene_offer_schema_verification__',
  'Schema verification',
  '__gene_offer_schema_verification__',
  'draft',
  false,
  false,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
ROLLBACK;
