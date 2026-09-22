# Gene Travel Control Centre Audit

Status: **STAGING IMPLEMENTATION ONLY**. No production deployment is authorized.

## Current system inventory

| Capability | Existing implementation | Decision |
|---|---|---|
| Authentication | Supabase Auth and server-side `requireUser` | Reuse permanent Auth user ID |
| Profiles | `profiles` and existing profile dashboard | Extend existing sections; no duplicate navigation |
| Preferences | `travel_preferences` with styles, budget, hotel, transport, meals and accessibility | Add nullable Control Centre preferences |
| Ready Plans | 21 plans, 183 days, 1,120 items | Immutable source; customer trips reference/snapshot items |
| Affiliate links | Ready Plan item URLs plus central redirect route | Keep stored URL unchanged; track opaque clicks server-side |
| Booking activity | `bookings`, `booking_clicks`, Bookings & Reminders UI | Extend with explicit state machine |
| Reminders | `travel_reminders` and profile APIs | Reuse and connect to customer trips |
| Analytics | standardized server/client event infrastructure | Extend event names with references only |
| AI workflow | planner/recommendation/day/analysis/summary routes | Put Control Centre persistence behind server feature flag |
| Payments/credits | Lemon Squeezy, passes, webhook safety, staging ledger | Preserve; do not award credits from client input |

## Affected modules

- `prisma/manual`: additive staging migrations and containment SQL.
- `src/lib/control-centre`: deterministic scoring, state machines and flags.
- Existing profile, affiliate redirect and analytics routes: later phases will
  call typed Control Centre services without changing their visual layout.
- Existing Ready Plan publishing/admin components are out of scope for data
  mutation and remain unchanged.

## Migration plan

1. Keep legacy `plans`, `plan_days`, `plan_items` and all Ready Plan tables.
2. Use the verified parallel `customer_plans` domain in staging.
3. Add nullable preference fields and new Control Centre support tables only.
4. Add owner/private and server-only policies with grants in the same migration.
5. Use `ON DELETE RESTRICT` or `SET NULL`; no cascading content deletion.
6. Apply to staging, run User A/User B tests, then run advisors.
7. Production remains blocked until backup/PITR and the complete test gates pass.

## Data preservation plan

- Production baseline is stored in `PRODUCTION_PRESERVATION_SNAPSHOT.json`.
- Raw affiliate and image URLs are never copied into repository reports.
- No `UPDATE`, `DELETE`, `TRUNCATE`, `DROP`, destructive rename, or reseed is
  permitted against protected content.
- Re-run counts and hashes after every staging/production rollout batch.

## Feature flags

All default to disabled unless explicitly enabled server-side:

- `GENE_CONTROL_CENTRE_ENABLED`
- `GENE_REALITY_CHECK_ENABLED`
- `GENE_BOOKING_TRACKING_ENABLED`
- `GENE_PACKING_ENABLED`
- `GENE_TRIP_COLLABORATION_ENABLED`
- `GENE_DAILY_TRIP_MODE_ENABLED`

No `NEXT_PUBLIC_*` flag may authorize private writes or bypass ownership.

## Test plan

- Unit: booking transitions, fatigue, readiness, budget, fragility,
  suitability, packing, price labels, reminders, URL/SubID safety.
- Database: anonymous, User A, User B, admin and server-only behavior.
- Integration: Ready Plan source snapshot, ownership, click tracking, booking
  confirmation, reminders, persistence and idempotency.
- E2E: desktop/tablet/mobile funnel and refresh/login recovery.
- Preservation: counts plus hashes for identity, images and affiliate bases.

## Rollback and containment

- Disable all server feature flags.
- Revoke `anon` and `authenticated` access to new Control Centre tables.
- Leave additive tables and evidence intact; do not delete rows during incident
  response.
- Existing Ready Plan and affiliate behavior remains the fallback flow.

## Known blockers

- Vercel Preview credentials have not yet been verified against staging.
- Staging has schema fixtures but no production customer data by design.
- Provider reporting capabilities are not confirmed; customer-confirmation mode
  remains required until an official reporting API is verified.
- Production backup/PITR confirmation is still required.

## Staging implementation checkpoint (2026-09-22)

- Applied the additive Control Centre schema and ownership indexes to staging.
- Verified anonymous denial, cross-user isolation, customer-owned access and
  server-only protection for ledgers, flags and jobs.
- Added an authenticated, feature-gated booking confirmation endpoint.
- Added owner-checked affiliate click recording using opaque click identifiers.
- Kept raw affiliate destinations server-side; availability responses expose no URL.
- Corrected `OTHER_PROVIDER` to a customer-confirmed booking with explicit source
  evidence instead of treating it as a cancellation.
- Booking references use AES-256-GCM only when a valid server-side 32-byte key is
  configured. Requests carrying a reference fail closed when the key is absent.
- TypeScript, Prisma validation, deterministic tests, security guardrails and the
  Next.js production build pass. The build logged one transient database connection
  reset while prerendering Ready Plans, but completed successfully.
- Production preservation counts still match the baseline exactly: 21 Ready Plans,
  183 days, 1,120 items, 39 destinations, 8 events, 2 profiles and 5 legacy plans.
- No production rollout was performed. All Control Centre flags remain disabled by
  default.
