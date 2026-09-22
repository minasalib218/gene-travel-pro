-- Containment only. Run only if the staging feature must be disabled.
-- No data is deleted and no legacy/Ready Plan object is touched.
revoke all on public.customer_plans, public.customer_plan_days, public.customer_plan_items,
  public.plan_inputs, public.plan_recommendations, public.plan_generations,
  public.credit_ledger, public.tier_action_logs from anon, authenticated;

-- Application rollback: set the server-side customer planning feature flag to false.
-- The additive tables can remain in place for investigation and later recovery.
