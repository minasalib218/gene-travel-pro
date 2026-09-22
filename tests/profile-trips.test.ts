import assert from "node:assert/strict";
import { bookingProgress, classifyTrip, mergeGeneTripMeta, resumeHref } from "../src/lib/profile/trip-utils.ts";

const now = new Date("2026-09-19T12:00:00.000Z");

assert.equal(classifyTrip({ status: "CONFIRMED", startDate: new Date("2026-10-01"), endDate: new Date("2026-10-10"), meta: {}, now }), "UPCOMING");
assert.equal(classifyTrip({ status: "CONFIRMED", startDate: new Date("2026-09-18"), endDate: new Date("2026-09-22"), meta: {}, now }), "ACTIVE");
assert.equal(classifyTrip({ status: "CONFIRMED", startDate: new Date("2026-08-01"), endDate: new Date("2026-08-10"), meta: {}, now }), "COMPLETED");
assert.equal(classifyTrip({ status: "ANALYZED", startDate: new Date("2026-10-01"), endDate: new Date("2026-10-10"), meta: {}, now }), "PLANNING");
assert.equal(classifyTrip({ status: "CONFIRMED", startDate: new Date("2026-10-01"), endDate: new Date("2026-10-10"), meta: { archivedAt: now.toISOString() }, now }), "ARCHIVED");

const archived = mergeGeneTripMeta({ destination: "Rome" }, { archivedAt: now.toISOString() }) as Record<string, any>;
assert.equal(archived.destination, "Rome");
assert.equal(archived.geneTrip.archivedAt, now.toISOString());
assert.equal(bookingProgress(8, 2), 25);
assert.equal(bookingProgress(0, 0), 0);
assert.equal(resumeHref("plan-1", "ANALYZED", { planningStage: "DAY_BY_DAY" }), "/ai/day-by-day?planId=plan-1");

console.log("profile trips checks passed");
