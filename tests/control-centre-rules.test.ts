import assert from "node:assert/strict";
import {
  assertBookingTransition,
  calculateBudget,
  calculateFatigue,
  calculateReadiness,
  getPriceDisplay,
  sanitizeOpaqueSubId,
} from "../src/lib/control-centre/rules.ts";

assert.doesNotThrow(() => assertBookingTransition("CLICKED", "CUSTOMER_CONFIRMED"));
assert.throws(() => assertBookingTransition("CLICKED", "PROVIDER_CONFIRMED"));
assert.throws(() => assertBookingTransition("NOT_SELECTED", "PROVIDER_CONFIRMED"));

assert.equal(calculateReadiness({ transport: 100, accommodation: 100 }).score, 40);
assert.equal(calculateReadiness(Object.fromEntries([
  ["transport", 100], ["accommodation", 100], ["activities", 100],
  ["documents", 100], ["packing", 100], ["insurance", 100],
  ["connectivity", 100], ["budget", 100], ["airportTransfers", 100],
])).score, 100);

assert.equal(calculateFatigue({
  scheduledMinutes: 300,
  walkingIntensity: 1,
  physicalIntensity: 1,
  transferCount: 0,
  hotelChanges: 0,
  sleepHours: 8,
  hasChildrenOrElderly: false,
}).level, "LOW");

assert.deepEqual(calculateBudget({
  planned: { amount: 1000, currency: "usd" },
  costs: [{ amount: 250, currency: "USD" }],
}), { currency: "USD", planned: 1000, spent: 250, remaining: 750 });
assert.throws(() => calculateBudget({
  planned: { amount: 1000, currency: "USD" },
  costs: [{ amount: 250, currency: "EUR" }],
}));

const now = new Date("2026-09-22T12:00:00.000Z");
assert.equal(getPriceDisplay({ type: "LIVE", checkedAt: new Date("2026-09-22T11:45:00.000Z"), now }).effectiveType, "LIVE");
assert.equal(getPriceDisplay({ type: "LIVE", checkedAt: new Date("2026-09-22T10:00:00.000Z"), now }).effectiveType, "RECENTLY_CHECKED");
assert.equal(getPriceDisplay({ type: "ESTIMATED", now }).label, "Estimated");
assert.equal(sanitizeOpaqueSubId("abc_DEF-123"), "abc_DEF-123");
assert.equal(sanitizeOpaqueSubId("abc@email.com"), "abcemailcom");

console.log("control-centre deterministic rule checks passed");
