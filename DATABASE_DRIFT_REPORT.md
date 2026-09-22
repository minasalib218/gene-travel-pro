# Gene Database Drift Report

Status: **STAGING IN PROGRESS**. The isolated `gene-travel-staging` project
(`gmsgkoggoyniniocmrln`, `eu-west-1`) is verified and contains no production
customer data. Production mutation remains blocked until backup/PITR and the
remaining payment, application and browser test gates pass.

Protected invariants recorded on 2026-09-21:

- Ready Plans: `21`
- Ready Plan fingerprint: `ccefed524c691211e14ae982b4771d41`
- Existing Ready Plan content, images, affiliate destinations, slugs and status
  must remain unchanged.

| Object | Production | Prisma/application expectation | Conflict | Resolution |
|---|---|---|---|---|
| `plans` | Legacy UUID public-content shape | Customer-owned AI plan | Critical naming/schema collision | Preserve; map new model to `customer_plans` |
| `plan_days` | Legacy columns (`plan_id`, `day_number`) | New AI day model | Critical | Preserve; use `customer_plan_days` |
| `plan_items` | Legacy booking/content shape | New AI item model | Critical | Preserve; use `customer_plan_items` |
| Ready Plan tables | 21 plans; live content | Existing public/admin behavior | None to tolerate | Preserve exactly |
| `PlanInput` | Missing | Durable AI request | Missing | Create `plan_inputs` in staging |
| `PlanRecommendation` | Missing | Durable provider-backed results | Missing | Create `plan_recommendations` in staging |
| `plan_generations` | Missing | Idempotent generation workflow | Missing | Create in staging |
| `credit_ledger` | Missing | Append-only credit accounting | Missing | Create in staging; no guessed backfill |
| `tier_action_logs` | Missing | Auditable entitlement actions | Missing | Create in staging |
| `webhook_events` | Present; processing safety added | Retry/idempotency metadata | Compatible now | Keep migration already applied |
| profiles/passes/payments | Present with historical mixed naming | Prisma relations | Drift risk | Audit mappings before cutover |

## RLS classification

| Class | Tables |
|---|---|
| PUBLIC_READ | published `ready_plans`, `ready_plan_days`, `ready_plan_items`, public `events` |
| OWNER_PRIVATE | `customer_plans`, `customer_plan_days`, `customer_plan_items`, `plan_inputs`, `plan_recommendations`, `plan_generations` |
| ADMIN_ONLY | `admin_audit_logs`, `error_logs`, administrative publishing operations |
| SERVER_ONLY | `webhook_events`, `accounting_entries`, `credit_ledger`, `tier_action_logs`, `affiliate_links`, `ai_usage_logs`, `rate_limit_logs` |
| MIXED | analytics/conversion/funnel/traffic attribution tables; writes may be public ingestion but reads must remain server/admin only |

The 20 currently RLS-disabled production tables must be migrated in separate
tested batches. RLS must not be enabled without matching grants and policies,
because doing so can immediately break live pages.

## Storage classification

- Existing Ready Plan and marketing media: preserve paths and public reads;
  never grant anonymous writes.
- Customer travel documents: private owner paths and short-lived signed URLs.
- Unknown buckets: no changes until ownership and callers are verified.

## Production gates still missing

1. Recoverable backup/PITR confirmation.
2. Preview application credentials and server-side feature flag configuration.
3. Schema/grants/policies export retained as rollback evidence.
4. Staging migration and User A/User B pgTAP tests.
5. Controlled Lemon Squeezy test-mode lifecycle.
6. Authenticated AI journey E2E.
7. Explicit approval after the above evidence is reviewed.

## Staging results (2026-09-21)

- `staging_core_foundation`: APPLIED
- `parallel_customer_planning`: APPLIED
- `add_customer_planning_fk_indexes`: APPLIED
- RLS User A/User B isolation: PASS (`User A` saw one owned row only)
- Anonymous customer-plan read grant: DENIED
- Authenticated direct customer-plan insert grant: DENIED
- Customer credit-ledger read/write grants: DENIED
- Staging tables contain zero persistent customer rows
- Security advisor: no ERROR/WARN findings after revoking public execution of
  `public.rls_auto_enable()`; three informational no-policy findings are
  intentional server-only tables (`payments`, `credit_ledger`,
  `tier_action_logs`).
- Production deployment: NOT APPLIED

No production deployment is authorized by this report.
