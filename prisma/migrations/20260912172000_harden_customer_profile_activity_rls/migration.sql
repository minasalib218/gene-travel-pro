-- Harden customer-owned profile activity tables.
-- Additive only: no content, ready plans, images, payments, credits or favorites are deleted.

ALTER TABLE IF EXISTS "favorite_plans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "favorite_destinations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "wishlist_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "travel_reminders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "travel_preferences" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "in_app_notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "travel_documents" ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS "wishlist_items_userId_status_createdAt_idx"
  ON "wishlist_items"("userId", "status", "createdAt");

CREATE INDEX IF NOT EXISTS "wishlist_items_userId_href_idx"
  ON "wishlist_items"("userId", "href");

DO $$
BEGIN
  IF to_regclass('public.favorite_plans') IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'favorite_plans' AND policyname = 'favorite_plans_own_rows'
    )
  THEN
    CREATE POLICY "favorite_plans_own_rows" ON "favorite_plans"
      FOR ALL TO authenticated
      USING ("userId" = (select auth.uid())::text)
      WITH CHECK ("userId" = (select auth.uid())::text);
  END IF;

  IF to_regclass('public.favorite_destinations') IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'favorite_destinations' AND policyname = 'favorite_destinations_own_rows'
    )
  THEN
    CREATE POLICY "favorite_destinations_own_rows" ON "favorite_destinations"
      FOR ALL TO authenticated
      USING ("userId" = (select auth.uid())::text)
      WITH CHECK ("userId" = (select auth.uid())::text);
  END IF;

  IF to_regclass('public.wishlist_items') IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'wishlist_items' AND policyname = 'wishlist_items_own_rows'
    )
  THEN
    CREATE POLICY "wishlist_items_own_rows" ON "wishlist_items"
      FOR ALL TO authenticated
      USING ("userId" = (select auth.uid())::text)
      WITH CHECK ("userId" = (select auth.uid())::text);
  END IF;

  IF to_regclass('public.travel_reminders') IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'travel_reminders' AND policyname = 'travel_reminders_own_rows'
    )
  THEN
    CREATE POLICY "travel_reminders_own_rows" ON "travel_reminders"
      FOR ALL TO authenticated
      USING ("userId" = (select auth.uid())::text)
      WITH CHECK ("userId" = (select auth.uid())::text);
  END IF;

  IF to_regclass('public.travel_preferences') IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'travel_preferences' AND policyname = 'travel_preferences_own_rows'
    )
  THEN
    CREATE POLICY "travel_preferences_own_rows" ON "travel_preferences"
      FOR ALL TO authenticated
      USING ("userId" = (select auth.uid())::text)
      WITH CHECK ("userId" = (select auth.uid())::text);
  END IF;

  IF to_regclass('public.in_app_notifications') IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'in_app_notifications' AND policyname = 'in_app_notifications_own_rows'
    )
  THEN
    CREATE POLICY "in_app_notifications_own_rows" ON "in_app_notifications"
      FOR ALL TO authenticated
      USING ("userId" = (select auth.uid())::text)
      WITH CHECK ("userId" = (select auth.uid())::text);
  END IF;
END $$;
