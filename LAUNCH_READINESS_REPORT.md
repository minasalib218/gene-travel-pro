# Gene Travel launch-readiness report

Status date: 2026-09-20

This report distinguishes repository safeguards from production verification. No production migration or deployment was performed in this pass.

## Seven-phase status

| Phase | Status | Result |
|---|---|---|
| Diagnostics and redirects | PASS in repository | Production debug route returns 404; affiliate destinations are server-resolved, HTTPS-only, allowlisted, and unsafe nested redirects are rejected. A safe customer error page is available. |
| Credit rules and idempotency | PARTIAL, migration required | Timeline generation is the billable action; edits/rebuilds are free. Charge and refund keys are unique and refunds are exactly-once after migration. Full database concurrency tests require staging. |
| Payment webhooks | PARTIAL, migration required | Signatures and event claims are enforced. Variant, price, currency, environment, and customer mapping are validated; mismatches enter reconciliation. Payment/pass/award operations still require staging failure-injection verification. |
| Server-owned AI sessions | PARTIAL, migration required | Plans now have a server state, version, creation key, generation records, stale-write protection, and server-first summary recovery. Remaining AI pages must be converted from browser-first recovery incrementally. |
| Provider honesty | PASS for audited adapters | Synthetic local cards and synthetic flight inventory were removed. Travelpayouts is labeled as an affiliate search action without invented price/availability. Viator remains owner-blocked until valid approved credentials work. |
| Supabase RLS and Storage | REQUIRES STAGING VERIFICATION | Forward-only RLS and private document bucket policies are prepared. Production policy state is NOT VERIFIED. |
| Automated tests | PARTIAL | Security, provider, launch guardrails, and Playwright smoke tests exist. Full paid journey, two-user RLS, and webhook concurrency need isolated staging fixtures. |

## Confirmed credit behavior

| Action | Deduction | Idempotency behavior |
|---|---:|---|
| Input submission | 0 | Server save only |
| Recommendations | 0 | Server save only |
| View/compare | 0 | Read-only |
| First timeline generation | 1 | One charge per generation key |
| Generate another plan | 1 | New generation key required |
| Edit/swap/replace/rebuild day | 0 | Existing-plan mutation |
| Same generation retry | 0 additional | Returns existing/processing state |
| Failed generation | 0 permanent | Exactly-once refund key |
| Verified admin generation | 0 | Server-side role bypass |

## Lemon Squeezy verification

| Package | Expected price | Credits | Variant environment variable | Configured? | Owner action |
|---|---:|---:|---|---|---|
| Starter | USD 25 | 3 | `LEMONSQUEEZY_STARTER_VARIANT_ID` | Not inspected | Verify in staging and Lemon dashboard |
| Pro | USD 40 | 5 | `LEMONSQUEEZY_PRO_VARIANT_ID` | Not inspected | Verify in staging and Lemon dashboard |
| Agency | USD 50 | 8 | `LEMONSQUEEZY_AGENCY_VARIANT_ID` | Not inspected | Verify in staging and Lemon dashboard |

## Provider matrix

| Provider | Feature | Capability | Real inventory | Affiliate only | Required variables | Approved domains | Status | Owner action |
|---|---|---|---|---|---|---|---|---|
| Viator | Activities/trips | Official API adapter | Yes when authorized | Product URLs may be attributed | `VIATOR_API_KEY`, partner settings, feature flag | `viator.com` | BLOCKED BY OWNER | Supply a working approved key and validate fixtures |
| Stay22 | Hotels | Search-link generator | No | Yes | `STAY22_AID`, feature flag | `stay22.com` | IMPLEMENTED | Confirm partner account attribution |
| Travelpayouts | Flights | Search-link generator | No | Yes | marker/TRS configuration, feature flag | `aviasales.com`, `travelpayouts.com` | IMPLEMENTED | Confirm generated links in staging |
| Gene local | Restaurants/transport/events | No approved inventory provider | No | No | Future provider-specific variables | None | BLOCKED BY OWNER | Select approved official providers |
| OpenAI | Ranking/scheduling/explanations | AI reasoning only | No | No | `OPENAI_API_KEY` | OpenAI API | IMPLEMENTED WITH BOUNDARY | Never treat output as live inventory |

## RLS and Storage matrix

Production verified is `NO` for every row because the target Supabase project was not inspected in this pass.

| Table/bucket | Sensitive | Repository policy | Customer behavior | Admin/service behavior | Production verified | Required action |
|---|---:|---|---|---|---|---|
| profiles/plans/days/items | Yes | Present | Owner-only | Verified admin/service | NO | Apply and test in staging |
| passes/payments/credit ledger | Critical | Present | Read own; no direct awards/status writes | Server/admin only | NO | Two-user and mutation-denial tests |
| plan generations | Critical | New forward policy | Owner read; server writes | Service only | NO | Apply migration in staging |
| favorites/trips/bookings/reminders | Yes | Present/strengthened | Owner-only | Verified admin/service | NO | Test each CRUD operation |
| ready plans/offers/events | Mixed | Present | Published public only | Draft/admin management | NO | Test draft denial |
| admin settings/audit/webhooks | Critical | Admin-only/no customer policy | Denied | Verified admin/service | NO | Inspect Data API grants |
| marketing image buckets | Public | Present | Public read | Admin writes | NO | Confirm bucket visibility |
| `gene-travel-documents` | Critical/private | New owner path policy | Signed/owner access only | Server service | NO | Apply in staging and test two users |

## Migration

`20260920120000_add_launch_workflow_safety` is additive. It adds workflow enums, plan version/state fields, generation records, unique idempotency metadata, webhook processing state, indexes, RLS hardening, and private document storage policy. It contains no `DROP TABLE`, `TRUNCATE`, or `DELETE FROM`. Existing records receive safe defaults. It was not applied.

Rollback should be logical first: stop application rollout and restore the previous application version. Do not drop new columns/tables in production until data retention is reviewed.

## Owner checklist

1. Confirm the staging Supabase project and create a verified backup.
2. Review the forward migration and inspect existing duplicates before unique indexes are applied.
3. Apply the migration to staging only.
4. Verify RLS and Storage with two normal users and one verified admin.
5. Configure staging Lemon variants, webhook secret, expected mode, and test webhook delivery.
6. Confirm provider approvals, credentials, feature flags, and affiliate allowlist domains without sharing secrets.
7. Run unit, security, provider, webhook concurrency, credit concurrency, and Playwright tests against staging.
8. Complete a test checkout and full AI journey with test users and test credits.
9. Approve the production migration explicitly.
10. Approve deployment explicitly, then monitor reconciliation, credit, AI, and provider failures.

## Safe deployment order

Review code, review migration, confirm backup, apply staging migration, configure staging variables, run all tests, run two-user RLS tests, run test checkout, run complete AI journey, approve production migration, deploy application, run post-deploy checks, then monitor failures and reconciliation.
