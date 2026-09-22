import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

const schema = read("prisma/schema.prisma");
assert.match(schema, /model PlanGeneration/);
assert.match(schema, /idempotencyKey String @unique/);
assert.match(schema, /planningStage PlanningStage/);
assert.match(schema, /version Int @default\(1\)/);
assert.match(schema, /model CreditLedger[\s\S]*idempotencyKey String\? @unique/);
assert.match(schema, /model WebhookEvent[\s\S]*status ProcessingStatus/);

const credits = read("src/lib/credits/creditService.ts");
assert.match(credits, /`refund:\$\{idempotencyKey\}`/);
assert.match(credits, /if \(action\.refundedAt\)/);
assert.match(credits, /IDEMPOTENCY_KEY_REQUIRED/);
assert.match(credits, /status: "COMPLETED"/);

const webhook = read("src/lib/payment/webhookHandlers.ts");
assert.match(webhook, /validateCommercialEvent\(event\)/);
assert.match(webhook, /LEMONSQUEEZY_STARTER_VARIANT_ID/);
assert.match(webhook, /REQUIRES_RECONCILIATION/);
assert.match(webhook, /EXPECTED_PACKAGE_PRICE/);

const local = read("src/lib/travel-engine/supplier-adapters/local-experiences.ts");
assert.match(local, /PROVIDER_NOT_CONFIGURED/);
assert.doesNotMatch(local, /price_snapshot:\s*[1-9]/);
assert.doesNotMatch(local, /rating_snapshot:\s*[1-9]/);

const flights = read("src/lib/travel-engine/supplier-adapters/travelpayouts.ts");
assert.match(flights, /AFFILIATE_SEARCH_LINK/);
assert.match(flights, /price_snapshot: null/);
assert.match(flights, /rating_snapshot: null/);
assert.doesNotMatch(flights, /Emirates|Qatar Airways|Turkish Airlines/);

const migration = read("prisma/migrations/20260920120000_add_launch_workflow_safety/migration.sql");
assert.doesNotMatch(migration, /DROP TABLE|TRUNCATE|DELETE FROM/i);
assert.match(migration, /ENABLE ROW LEVEL SECURITY/);
assert.doesNotMatch(
  migration,
  /UPDATE\s+["']?(ready_plans|ready_plan_days|ready_plan_items|ready_plan_links)["']?/i,
  "Launch hardening must not rewrite existing ready-plan content.",
);
assert.doesNotMatch(
  migration,
  /(?:SET|DROP COLUMN|RENAME COLUMN)[\s\S]{0,80}(?:affiliateUrl|affiliateLink|imageUrl|heroImage|coverImage)/i,
  "Launch hardening must not alter or clear affiliate-link or image fields.",
);

const protectedContentRoutes = [
  read("src/app/api/admin/ready-plans/route.ts"),
  read("src/app/api/admin/ready-plans/[id]/route.ts"),
].join("\n");
assert.doesNotMatch(
  protectedContentRoutes,
  /affiliateUrl:\s*(?:null|""),\s*\/\/\s*launch/i,
  "Launch work must not clear existing affiliate URLs.",
);

console.log("launch-critical guardrails passed");
