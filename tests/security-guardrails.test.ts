import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const sourceRoots = ["src", "prisma"].map((folder) => path.join(root, folder));

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const fullPath = path.join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) return walk(fullPath);
    return /\.(ts|tsx|sql)$/.test(entry) ? [fullPath] : [];
  });
}

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

const sourceFiles = sourceRoots.flatMap(walk);
const allSource = sourceFiles.map((file) => readFileSync(file, "utf8")).join("\n");

assert.equal(
  /\$queryRawUnsafe|\$executeRawUnsafe/.test(allSource),
  false,
  "Unsafe Prisma raw query helpers must not be used.",
);

for (const route of [
  "src/app/api/dev/grant-pass/route.ts",
  "src/app/api/dev/make-me-admin/route.ts",
]) {
  const source = read(route);
  assert.match(source, /process\.env\.NODE_ENV === "production"/, `${route} must be disabled in production.`);
  assert.doesNotMatch(source, /message:\s*e\?\.message|message:\s*error\.message/, `${route} must not return raw errors.`);
}

const webhook = read("src/lib/payment/webhookHandlers.ts");
assert.match(webhook, /req\.text\(\)/, "Payment webhooks must verify the raw request body.");
assert.match(webhook, /verifyLemonWebhook/, "Lemon Squeezy webhook signature verification must be called.");
assert.match(webhook, /saveWebhookEvent/, "Payment webhooks must save events for idempotency.");
assert.match(webhook, /claimWebhookEvent/, "Payment webhooks must atomically claim unprocessed events.");
assert.match(webhook, /webhookEvent\.upsert/, "Concurrent webhook inserts must be idempotent.");

const checkout = read("src/lib/payments/lemonsqueezy-server.ts");
assert.match(checkout, /Authorization:\s*`Bearer \$\{apiKey\}`/, "Lemon API key must stay server-side.");
assert.doesNotMatch(checkout, /return NextResponse\.json\(\s*\{\s*error:\s*json\?\.errors/, "Provider errors must not be returned to customers.");

const affiliateRedirect = read("src/app/api/affiliate/redirect/route.ts");
assert.match(affiliateRedirect, /status\s*!==\s*"PUBLISHED"/, "Ready-plan booking redirects must reject unpublished plans.");
assert.match(affiliateRedirect, /destination\.protocol\s*!==\s*"https:"/, "Ready-plan booking redirects must validate HTTPS destinations.");
assert.doesNotMatch(
  affiliateRedirect,
  /resolveOnly[\s\S]{0,100}url:\s*destinationUrl/,
  "Affiliate availability checks must not return raw destination URLs.",
);
assert.match(affiliateRedirect, /AFFILIATE_ALLOWED_HOSTS/, "Affiliate redirects must use a hostname allowlist.");
assert.match(affiliateRedirect, /destination\.username\s*\|\|\s*destination\.password/, "Affiliate redirects must reject URL credentials.");

const debugDb = read("src/app/api/debug-db/route.ts");
assert.match(debugDb, /NODE_ENV === "production"/, "The database diagnostic must be disabled in production.");
assert.match(debugDb, /requireAdmin\(\)/, "The local database diagnostic must require an admin.");
assert.doesNotMatch(debugDb, /hostname|username|masked|pathname/, "The database diagnostic must not expose connection metadata.");

const recommendationPage = read("src/app/ai/recommendation/page.tsx");
assert.match(recommendationPage, /auth\.getUser\(\)/, "Recommendation pages must resolve the authenticated user server-side.");
assert.match(recommendationPage, /userId:\s*data\.user\.id/, "Recommendation queries must enforce plan ownership.");

const planInputRoute = read("src/app/api/plan-inputs/route.ts");
assert.doesNotMatch(planInputRoute, /storageMode:\s*"session"/, "Paid planning must not report browser-only persistence as success.");

const publicReadyPlan = read("src/app/ready-plans/[slug]/page.tsx");
assert.match(publicReadyPlan, /sanitizeReadyPlanContentForPublic/, "Public ready-plan pages must sanitize admin-only/private fields.");
assert.match(publicReadyPlan, /bookableItemIds/, "Public ready-plan pages must use the backend booking map.");

console.log("Security guardrail checks passed.");
