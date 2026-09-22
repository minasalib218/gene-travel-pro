# Gene AI Planning Audit

Date: 2026-09-20
Branch: `codex/ai-planning-system-audit`

No production deployment, database migration, destructive command, or live-data mutation was performed during this audit.

## Route map

| Stage | Route | Durable source | Status |
| --- | --- | --- | --- |
| Inputs | `/ai-planner` -> `POST /api/plan-inputs` | `PlanInput` | Repaired: authenticated user only; database save must succeed |
| Recommendations | `/ai/recommendation?planId=...` | `PlanInput` + `PlanRecommendation` | Repaired: owner-scoped server read |
| Selection / booking | `/ai/booking` | Recommendation payload / saved plan | Partial: still relies on browser payload during parts of the flow |
| Analysis | `/ai/analysis` and `/api/ai/run-analysis` | Saved recommendation payload | Partial: no routing-provider verification |
| Day by day | `/ai/day-by-day` | Saved plan with browser fallback | Partial: persistence exists, but one canonical planning-session state machine does not |
| Summary | `/summary` | Saved `Plan` and summary payload | Repaired in part: shared persisted payload helper and protected affiliate resolution |
| My Trips | `/profile/trips` | User-owned saved plans | Present; full authenticated browser/database E2E still required |

## Repairs completed

- Recommendation reads now require a Supabase user and enforce `userId` ownership.
- Planner submissions no longer trust an admin cookie as identity and derive the user from the authenticated Supabase session.
- Trip inputs no longer silently overwrite global travel preferences. Explicit `syncTravelPreferences: true` is required.
- A database failure no longer returns a false successful browser-only planning session. It returns `503 PLAN_STORE_UNAVAILABLE` while the form remains in the browser for retry.
- New planner responses return the durable plan ID rather than returning the complete recommendation and raw AI/provider payload to the client.
- AI ranking output is intersected with server-owned provider candidates. Unknown model-created hotels, flights, and activities are discarded.
- Supplier adapters are now explicit opt-in flags. Disabled is the default.
- Affiliate availability checks no longer return the raw destination URL as JSON. Navigation continues through the server redirect.
- Security and travel-engine regression checks cover owner scoping, durable storage failure behavior, explicit supplier flags, and raw redirect URL suppression.

## Provider truth audit

| Category | Current implementation | Verdict |
| --- | --- | --- |
| Hotels | Booking-branded search candidate/link builder | Not verified live inventory |
| Flights | Travelpayouts/Aviasales search-link builder | Not verified flight offer inventory |
| Activities | Viator-branded generated search candidates | Not verified live inventory |
| Restaurants | Local generated candidates | Synthetic; disabled by default |
| Transport | Local generated candidates | Synthetic; disabled by default |
| Events | Local generated candidates | Synthetic; disabled by default |
| AI ranking | OpenAI ranks/explains candidates | Guarded so unknown candidates are rejected |
| Routing/timing | Local timing validator | No Mapbox/Google route-duration verification |

Do not enable an adapter merely because its API key or affiliate marker exists. Each adapter still needs a real provider request, response validation, normalized offer IDs, freshness metadata, timeout/retry handling, and provider contract tests.

## Remaining production blockers

1. Add a server-owned `PlanningSession`/generation-run state machine, or formally extend the existing `Plan`, so every stage transition is durable and idempotent.
2. Replace browser/session payload handoffs in booking, analysis, and day-by-day pages with owner-scoped reads by plan/session ID.
3. Implement genuine approved provider adapters. Never advertise generated search candidates as current availability or live prices.
4. Add routing-provider duration checks before an itinerary is declared feasible.
5. Couple credit reservation, generation finalization, and refund behavior with durable idempotency records and transactions.
6. Remove or encrypt raw provider destination URLs from any client-serialized recommendation payload. Use internal offer IDs and server redirects only.
7. Add integration and browser tests for one authenticated journey from inputs through My Trips, including retry, refresh, sign-out/sign-in, provider partial failure, and ownership attacks.
8. Repair the target environment database connection. The production build logged an inability to reach the Supabase pooler at `aws-1-eu-north-1.pooler.supabase.com:6543` while prerendering destinations.
9. Commit an ESLint configuration. `npm run lint` currently starts an interactive setup prompt and does not perform a reproducible lint run.

## Verification performed

- `npm run test:security` - passed
- `npm run test:travel-engine` - passed (Node module-type warning only)
- `npx tsc --noEmit` - passed
- `npm run build` - passed; database reachability warning noted above
- `npm run lint` - not a valid check yet because it opens interactive configuration

## Rollback

All work is isolated on `codex/ai-planning-system-audit`. No schema or live-data changes exist to reverse. Reverting the files changed on this branch returns the prior behavior.
