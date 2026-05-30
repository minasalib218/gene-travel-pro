-- Gene Travel Supabase RLS hardening
-- Protect customer-owned records, published-only public content, and admin-managed storage buckets.

BEGIN;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'ADMIN'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;

ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.plan_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.purchase_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ready_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ready_plan_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ready_plan_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.affiliate_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_self_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_self_or_admin"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "profiles_insert_self_or_admin" ON public.profiles;
CREATE POLICY "profiles_insert_self_or_admin"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "profiles_update_self_or_admin" ON public.profiles;
CREATE POLICY "profiles_update_self_or_admin"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid() OR public.is_admin())
WITH CHECK (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "profiles_delete_admin_only" ON public.profiles;
CREATE POLICY "profiles_delete_admin_only"
ON public.profiles
FOR DELETE
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "plans_select_owner_or_admin" ON public.plans;
CREATE POLICY "plans_select_owner_or_admin"
ON public.plans
FOR SELECT
TO authenticated
USING ("userId" = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "plans_insert_owner_or_admin" ON public.plans;
CREATE POLICY "plans_insert_owner_or_admin"
ON public.plans
FOR INSERT
TO authenticated
WITH CHECK ("userId" = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "plans_update_owner_or_admin" ON public.plans;
CREATE POLICY "plans_update_owner_or_admin"
ON public.plans
FOR UPDATE
TO authenticated
USING ("userId" = auth.uid() OR public.is_admin())
WITH CHECK ("userId" = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "plans_delete_owner_or_admin" ON public.plans;
CREATE POLICY "plans_delete_owner_or_admin"
ON public.plans
FOR DELETE
TO authenticated
USING ("userId" = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "plan_days_select_owner_or_admin" ON public.plan_days;
CREATE POLICY "plan_days_select_owner_or_admin"
ON public.plan_days
FOR SELECT
TO authenticated
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1
    FROM public.plans p
    WHERE p.id = "planId"
      AND p."userId" = auth.uid()
  )
);

DROP POLICY IF EXISTS "plan_days_insert_owner_or_admin" ON public.plan_days;
CREATE POLICY "plan_days_insert_owner_or_admin"
ON public.plan_days
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin()
  OR EXISTS (
    SELECT 1
    FROM public.plans p
    WHERE p.id = "planId"
      AND p."userId" = auth.uid()
  )
);

DROP POLICY IF EXISTS "plan_days_update_owner_or_admin" ON public.plan_days;
CREATE POLICY "plan_days_update_owner_or_admin"
ON public.plan_days
FOR UPDATE
TO authenticated
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1
    FROM public.plans p
    WHERE p.id = "planId"
      AND p."userId" = auth.uid()
  )
)
WITH CHECK (
  public.is_admin()
  OR EXISTS (
    SELECT 1
    FROM public.plans p
    WHERE p.id = "planId"
      AND p."userId" = auth.uid()
  )
);

DROP POLICY IF EXISTS "plan_days_delete_owner_or_admin" ON public.plan_days;
CREATE POLICY "plan_days_delete_owner_or_admin"
ON public.plan_days
FOR DELETE
TO authenticated
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1
    FROM public.plans p
    WHERE p.id = "planId"
      AND p."userId" = auth.uid()
  )
);

DROP POLICY IF EXISTS "plan_items_select_owner_or_admin" ON public.plan_items;
CREATE POLICY "plan_items_select_owner_or_admin"
ON public.plan_items
FOR SELECT
TO authenticated
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1
    FROM public.plan_days d
    JOIN public.plans p ON p.id = d."planId"
    WHERE d.id = "planDayId"
      AND p."userId" = auth.uid()
  )
);

DROP POLICY IF EXISTS "plan_items_insert_owner_or_admin" ON public.plan_items;
CREATE POLICY "plan_items_insert_owner_or_admin"
ON public.plan_items
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin()
  OR EXISTS (
    SELECT 1
    FROM public.plan_days d
    JOIN public.plans p ON p.id = d."planId"
    WHERE d.id = "planDayId"
      AND p."userId" = auth.uid()
  )
);

DROP POLICY IF EXISTS "plan_items_update_owner_or_admin" ON public.plan_items;
CREATE POLICY "plan_items_update_owner_or_admin"
ON public.plan_items
FOR UPDATE
TO authenticated
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1
    FROM public.plan_days d
    JOIN public.plans p ON p.id = d."planId"
    WHERE d.id = "planDayId"
      AND p."userId" = auth.uid()
  )
)
WITH CHECK (
  public.is_admin()
  OR EXISTS (
    SELECT 1
    FROM public.plan_days d
    JOIN public.plans p ON p.id = d."planId"
    WHERE d.id = "planDayId"
      AND p."userId" = auth.uid()
  )
);

DROP POLICY IF EXISTS "plan_items_delete_owner_or_admin" ON public.plan_items;
CREATE POLICY "plan_items_delete_owner_or_admin"
ON public.plan_items
FOR DELETE
TO authenticated
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1
    FROM public.plan_days d
    JOIN public.plans p ON p.id = d."planId"
    WHERE d.id = "planDayId"
      AND p."userId" = auth.uid()
  )
);

DROP POLICY IF EXISTS "passes_select_owner_or_admin" ON public.passes;
CREATE POLICY "passes_select_owner_or_admin"
ON public.passes
FOR SELECT
TO authenticated
USING ("userId" = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "passes_admin_insert" ON public.passes;
CREATE POLICY "passes_admin_insert"
ON public.passes
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "passes_admin_update" ON public.passes;
CREATE POLICY "passes_admin_update"
ON public.passes
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "passes_admin_delete" ON public.passes;
CREATE POLICY "passes_admin_delete"
ON public.passes
FOR DELETE
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "payments_select_owner_or_admin" ON public.payments;
CREATE POLICY "payments_select_owner_or_admin"
ON public.payments
FOR SELECT
TO authenticated
USING ("userId" = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "payments_admin_insert" ON public.payments;
CREATE POLICY "payments_admin_insert"
ON public.payments
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "payments_admin_update" ON public.payments;
CREATE POLICY "payments_admin_update"
ON public.payments
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "payments_admin_delete" ON public.payments;
CREATE POLICY "payments_admin_delete"
ON public.payments
FOR DELETE
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "credit_ledger_select_owner_or_admin" ON public.credit_ledger;
CREATE POLICY "credit_ledger_select_owner_or_admin"
ON public.credit_ledger
FOR SELECT
TO authenticated
USING ("userId" = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "credit_ledger_admin_insert" ON public.credit_ledger;
CREATE POLICY "credit_ledger_admin_insert"
ON public.credit_ledger
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "credit_ledger_admin_update" ON public.credit_ledger;
CREATE POLICY "credit_ledger_admin_update"
ON public.credit_ledger
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "credit_ledger_admin_delete" ON public.credit_ledger;
CREATE POLICY "credit_ledger_admin_delete"
ON public.credit_ledger
FOR DELETE
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "ai_usage_logs_select_owner_or_admin" ON public.ai_usage_logs;
CREATE POLICY "ai_usage_logs_select_owner_or_admin"
ON public.ai_usage_logs
FOR SELECT
TO authenticated
USING ("userId" = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "ai_usage_logs_admin_insert" ON public.ai_usage_logs;
CREATE POLICY "ai_usage_logs_admin_insert"
ON public.ai_usage_logs
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "ai_usage_logs_admin_update" ON public.ai_usage_logs;
CREATE POLICY "ai_usage_logs_admin_update"
ON public.ai_usage_logs
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "ai_usage_logs_admin_delete" ON public.ai_usage_logs;
CREATE POLICY "ai_usage_logs_admin_delete"
ON public.ai_usage_logs
FOR DELETE
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "webhook_events_admin_select" ON public.webhook_events;
CREATE POLICY "webhook_events_admin_select"
ON public.webhook_events
FOR SELECT
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "webhook_events_admin_insert" ON public.webhook_events;
CREATE POLICY "webhook_events_admin_insert"
ON public.webhook_events
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "webhook_events_admin_update" ON public.webhook_events;
CREATE POLICY "webhook_events_admin_update"
ON public.webhook_events
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "webhook_events_admin_delete" ON public.webhook_events;
CREATE POLICY "webhook_events_admin_delete"
ON public.webhook_events
FOR DELETE
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "purchase_tracking_select_owner_or_admin" ON public.purchase_tracking;
CREATE POLICY "purchase_tracking_select_owner_or_admin"
ON public.purchase_tracking
FOR SELECT
TO authenticated
USING ("userId" = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "purchase_tracking_admin_insert" ON public.purchase_tracking;
CREATE POLICY "purchase_tracking_admin_insert"
ON public.purchase_tracking
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "purchase_tracking_admin_update" ON public.purchase_tracking;
CREATE POLICY "purchase_tracking_admin_update"
ON public.purchase_tracking
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "purchase_tracking_admin_delete" ON public.purchase_tracking;
CREATE POLICY "purchase_tracking_admin_delete"
ON public.purchase_tracking
FOR DELETE
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "ready_plans_select_published_or_admin" ON public.ready_plans;
CREATE POLICY "ready_plans_select_published_or_admin"
ON public.ready_plans
FOR SELECT
TO public
USING (status = 'PUBLISHED' OR public.is_admin());

DROP POLICY IF EXISTS "ready_plans_admin_insert" ON public.ready_plans;
CREATE POLICY "ready_plans_admin_insert"
ON public.ready_plans
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "ready_plans_admin_update" ON public.ready_plans;
CREATE POLICY "ready_plans_admin_update"
ON public.ready_plans
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "ready_plans_admin_delete" ON public.ready_plans;
CREATE POLICY "ready_plans_admin_delete"
ON public.ready_plans
FOR DELETE
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "ready_plan_days_select_published_or_admin" ON public.ready_plan_days;
CREATE POLICY "ready_plan_days_select_published_or_admin"
ON public.ready_plan_days
FOR SELECT
TO public
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1
    FROM public.ready_plans rp
    WHERE rp.id = "readyPlanId"
      AND rp.status = 'PUBLISHED'
  )
);

DROP POLICY IF EXISTS "ready_plan_days_admin_insert" ON public.ready_plan_days;
CREATE POLICY "ready_plan_days_admin_insert"
ON public.ready_plan_days
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "ready_plan_days_admin_update" ON public.ready_plan_days;
CREATE POLICY "ready_plan_days_admin_update"
ON public.ready_plan_days
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "ready_plan_days_admin_delete" ON public.ready_plan_days;
CREATE POLICY "ready_plan_days_admin_delete"
ON public.ready_plan_days
FOR DELETE
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "ready_plan_links_select_published_or_admin" ON public.ready_plan_links;
CREATE POLICY "ready_plan_links_select_published_or_admin"
ON public.ready_plan_links
FOR SELECT
TO public
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1
    FROM public.ready_plans rp
    WHERE rp.id = "readyPlanId"
      AND rp.status = 'PUBLISHED'
  )
);

DROP POLICY IF EXISTS "ready_plan_links_admin_insert" ON public.ready_plan_links;
CREATE POLICY "ready_plan_links_admin_insert"
ON public.ready_plan_links
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "ready_plan_links_admin_update" ON public.ready_plan_links;
CREATE POLICY "ready_plan_links_admin_update"
ON public.ready_plan_links
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "ready_plan_links_admin_delete" ON public.ready_plan_links;
CREATE POLICY "ready_plan_links_admin_delete"
ON public.ready_plan_links
FOR DELETE
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "destinations_select_published_or_admin" ON public.destinations;
CREATE POLICY "destinations_select_published_or_admin"
ON public.destinations
FOR SELECT
TO public
USING (status = 'published' OR public.is_admin());

DROP POLICY IF EXISTS "destinations_admin_insert" ON public.destinations;
CREATE POLICY "destinations_admin_insert"
ON public.destinations
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "destinations_admin_update" ON public.destinations;
CREATE POLICY "destinations_admin_update"
ON public.destinations
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "destinations_admin_delete" ON public.destinations;
CREATE POLICY "destinations_admin_delete"
ON public.destinations
FOR DELETE
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "offers_select_published_or_admin" ON public.offers;
CREATE POLICY "offers_select_published_or_admin"
ON public.offers
FOR SELECT
TO public
USING (status = 'published' OR public.is_admin());

DROP POLICY IF EXISTS "offers_admin_insert" ON public.offers;
CREATE POLICY "offers_admin_insert"
ON public.offers
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "offers_admin_update" ON public.offers;
CREATE POLICY "offers_admin_update"
ON public.offers
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "offers_admin_delete" ON public.offers;
CREATE POLICY "offers_admin_delete"
ON public.offers
FOR DELETE
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "events_select_published_or_admin" ON public.events;
CREATE POLICY "events_select_published_or_admin"
ON public.events
FOR SELECT
TO public
USING (status = 'published' OR public.is_admin());

DROP POLICY IF EXISTS "events_admin_insert" ON public.events;
CREATE POLICY "events_admin_insert"
ON public.events
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "events_admin_update" ON public.events;
CREATE POLICY "events_admin_update"
ON public.events
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "events_admin_delete" ON public.events;
CREATE POLICY "events_admin_delete"
ON public.events
FOR DELETE
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "affiliate_links_admin_select" ON public.affiliate_links;
CREATE POLICY "affiliate_links_admin_select"
ON public.affiliate_links
FOR SELECT
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "affiliate_links_admin_insert" ON public.affiliate_links;
CREATE POLICY "affiliate_links_admin_insert"
ON public.affiliate_links
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "affiliate_links_admin_update" ON public.affiliate_links;
CREATE POLICY "affiliate_links_admin_update"
ON public.affiliate_links
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "affiliate_links_admin_delete" ON public.affiliate_links;
CREATE POLICY "affiliate_links_admin_delete"
ON public.affiliate_links
FOR DELETE
TO authenticated
USING (public.is_admin());

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('ready-plans', 'ready-plans', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('destinations', 'destinations', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('offers', 'offers', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('events', 'events', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "public_read_gene_travel_content_images" ON storage.objects;
CREATE POLICY "public_read_gene_travel_content_images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id IN ('ready-plans', 'destinations', 'offers', 'events'));

DROP POLICY IF EXISTS "admin_upload_gene_travel_content_images" ON storage.objects;
CREATE POLICY "admin_upload_gene_travel_content_images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id IN ('ready-plans', 'destinations', 'offers', 'events')
  AND public.is_admin()
);

DROP POLICY IF EXISTS "admin_update_gene_travel_content_images" ON storage.objects;
CREATE POLICY "admin_update_gene_travel_content_images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id IN ('ready-plans', 'destinations', 'offers', 'events')
  AND public.is_admin()
)
WITH CHECK (
  bucket_id IN ('ready-plans', 'destinations', 'offers', 'events')
  AND public.is_admin()
);

DROP POLICY IF EXISTS "admin_delete_gene_travel_content_images" ON storage.objects;
CREATE POLICY "admin_delete_gene_travel_content_images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id IN ('ready-plans', 'destinations', 'offers', 'events')
  AND public.is_admin()
);

COMMIT;
