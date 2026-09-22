-- Disable Control Centre customer access without deleting any records.
revoke all on public.customer_travel_preferences, public.trip_affiliate_clicks,
  public.trip_price_snapshots, public.trip_booking_records, public.trip_tasks,
  public.trip_packing_lists, public.trip_packing_items, public.trip_budgets,
  public.trip_expenses, public.trip_analysis_results,
  public.trip_readiness_snapshots, public.trip_notification_preferences,
  public.gene_feature_flags, public.gene_jobs from anon, authenticated;

-- Also set all GENE_* feature flags to false in the application environment.
