-- Additive affiliate booking reconciliation fields.
-- This migration does not modify Ready Plans, media, stored affiliate URLs, users,
-- payments, passes, credits, destinations, offers, or events.

ALTER TABLE public.trip_affiliate_clicks
  ADD COLUMN IF NOT EXISTS affiliate_program text,
  ADD COLUMN IF NOT EXISTS session_id text,
  ADD COLUMN IF NOT EXISTS last_checked_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.trip_booking_records
  ADD COLUMN IF NOT EXISTS provider text,
  ADD COLUMN IF NOT EXISTS affiliate_program text,
  ADD COLUMN IF NOT EXISTS provider_booking_id text,
  ADD COLUMN IF NOT EXISTS provider_status text,
  ADD COLUMN IF NOT EXISTS commission numeric(14,2),
  ADD COLUMN IF NOT EXISTS travel_start_at timestamptz,
  ADD COLUMN IF NOT EXISTS travel_end_at timestamptz,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz,
  ADD COLUMN IF NOT EXISTS raw_provider_reference jsonb;

ALTER TABLE public.trip_booking_records
  DROP CONSTRAINT IF EXISTS trip_booking_records_status_check;

ALTER TABLE public.trip_booking_records
  ADD CONSTRAINT trip_booking_records_status_check CHECK (status IN (
    'NOT_SELECTED','SELECTED','CLICKED','AWAITING_PROVIDER','BOOKING_PENDING',
    'USER_REPORTED','CUSTOMER_CONFIRMED','PROVIDER_CONFIRMED','CANCELLED',
    'REFUNDED','UNKNOWN'
  )) NOT VALID;

CREATE UNIQUE INDEX IF NOT EXISTS trip_bookings_provider_reference_key
  ON public.trip_booking_records(provider, provider_booking_id)
  WHERE provider IS NOT NULL AND provider_booking_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS trip_clicks_subid_lookup_idx
  ON public.trip_affiliate_clicks(opaque_click_id);

CREATE INDEX IF NOT EXISTS trip_clicks_sync_idx
  ON public.trip_affiliate_clicks(status, last_checked_at, created_at);

CREATE INDEX IF NOT EXISTS trip_bookings_provider_sync_idx
  ON public.trip_booking_records(provider, status, last_synced_at);

ALTER TABLE public.trip_affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_booking_records ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.trip_affiliate_clicks, public.trip_booking_records FROM anon, authenticated;
GRANT SELECT ON public.trip_affiliate_clicks, public.trip_booking_records TO authenticated;

DROP POLICY IF EXISTS trip_clicks_owner_select ON public.trip_affiliate_clicks;
CREATE POLICY trip_clicks_owner_select ON public.trip_affiliate_clicks
  FOR SELECT TO authenticated
  USING ((select auth.uid()) IS NOT NULL AND user_id = (select auth.uid()));

DROP POLICY IF EXISTS trip_bookings_owner_select ON public.trip_booking_records;
CREATE POLICY trip_bookings_owner_select ON public.trip_booking_records
  FOR SELECT TO authenticated
  USING ((select auth.uid()) IS NOT NULL AND user_id = (select auth.uid()));
