import assert from "node:assert/strict";
import {
  mapTravelpayoutsBookingStatus,
  normalizeTravelpayoutsSubId,
} from "../src/lib/affiliates/travelpayouts-booking-rules.ts";

assert.equal(normalizeTravelpayoutsSubId("gene_1234567890abcdef"), "gene_1234567890abcdef");
assert.equal(normalizeTravelpayoutsSubId("prefix-gene_abc_DEF-123-suffix"), "gene_abc_DEF-123-suffix");
assert.equal(normalizeTravelpayoutsSubId("customer@example.com"), null);
assert.equal(mapTravelpayoutsBookingStatus("paid"), "PROVIDER_CONFIRMED");
assert.equal(mapTravelpayoutsBookingStatus("processing"), "BOOKING_PENDING");
assert.equal(mapTravelpayoutsBookingStatus("canceled"), "CANCELLED");
assert.equal(mapTravelpayoutsBookingStatus("unexpected"), "UNKNOWN");

console.log("affiliate booking mapping checks passed");
