import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildAffiliateLink } from "../src/lib/travel-engine/affiliate-link-service.ts";
import { validateAndAdjustDayPlan } from "../src/lib/travel-engine/timing-feasibility.ts";
import type { DayPlan } from "../src/lib/recommendation/types.ts";

function runAffiliateLinkChecks() {
  const ready = buildAffiliateLink({
    supplier: "travelpayouts",
    supplierItemId: "flight-1",
    sourceUrl: "https://www.aviasales.com/search/CAI0107TYO08071?adults=2",
    category: "flight",
    affiliateEligible: true,
    internalId: "internal-flight-1",
  });

  assert.equal(ready.ok, true);
  assert.equal(ready.status, "ready");
  assert.match(String(ready.url), /^https?:\/\//);

  const viatorProductUrl = "https://www.viator.com/tours/example/d1-ABC?mcid=1&pid=P123&medium=api";
  const viator = buildAffiliateLink({
    supplier: "viator",
    supplierItemId: "ABC",
    sourceUrl: viatorProductUrl,
    category: "activity",
    affiliateEligible: true,
  });
  assert.equal(viator.url, viatorProductUrl, "Viator attributed productUrl must remain unchanged");

  const blocked = buildAffiliateLink({
    supplier: "maps",
    supplierItemId: "restaurant-1",
    sourceUrl: "https://www.google.com/maps/search/tokyo+fine+dining",
    category: "restaurant",
    affiliateEligible: false,
    internalId: "internal-restaurant-1",
  });

  assert.equal(blocked.ok, false);
  assert.equal(blocked.status, "unavailable");
  assert.equal(blocked.url, null);
}

function runTimingChecks() {
  const dayPlan: DayPlan[] = [
    {
      day: 1,
      date: "2026-07-01",
      theme: "Arrival",
      items: [
        {
          id: "flight",
          day: 1,
          slot: "morning",
          type: "flight",
          title: "Long-haul arrival",
          description: "Door to door segment",
          startTime: "08:00",
          endTime: "20:30",
          bufferMinutes: 750,
        },
        {
          id: "activity",
          day: 1,
          slot: "afternoon",
          type: "activity",
          title: "City walking tour",
          description: "Should be shifted out of overlap",
          startTime: "19:00",
          endTime: "21:00",
          bufferMinutes: 120,
        },
      ],
    },
  ];

  const result = validateAndAdjustDayPlan(dayPlan);
  assert.ok(result.warnings.some((warning) => warning.code === "LONG_TRAVEL_DAY"));
  assert.ok(result.warnings.some((warning) => warning.code === "OVERLAP"));
  assert.equal(result.items[0].items[1]?.startTime, "22:30");
}

runAffiliateLinkChecks();
runTimingChecks();

const supplierRegistry = readFileSync(
  new URL("../src/lib/travel-engine/supplier-registry.ts", import.meta.url),
  "utf8",
);
assert.match(supplierRegistry, /GENE_SUPPLIER_BOOKING_HOTELS\s*===\s*"1"/);
assert.match(supplierRegistry, /GENE_SUPPLIER_TRAVELPAYOUTS_FLIGHTS\s*===\s*"1"/);
assert.match(supplierRegistry, /GENE_SUPPLIER_VIATOR_ACTIVITIES\s*===\s*"1"/);
assert.match(supplierRegistry, /new ViatorExperienceAdapter\(\)/);

const stay22Adapter = readFileSync(
  new URL("../src/lib/travel-engine/supplier-adapters/booking.ts", import.meta.url),
  "utf8",
);
assert.match(stay22Adapter, /AFFILIATE_SEARCH_LINK/);
assert.match(stay22Adapter, /Search with provider/);
assert.doesNotMatch(stay22Adapter, /Grand Palace Hotel|Harbor View Suites|rating_snapshot:\s*[1-9]/);

const viatorAdapter = readFileSync(
  new URL("../src/lib/travel-engine/supplier-adapters/viator.ts", import.meta.url),
  "utf8",
);
assert.match(viatorAdapter, /exp-api-key/);
assert.match(viatorAdapter, /\/search\/freetext/);
assert.doesNotMatch(viatorAdapter, /affiliate\.example\.com/);

console.log("travel-engine checks passed");
