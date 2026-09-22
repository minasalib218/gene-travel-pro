import { expect, test } from "@playwright/test";

test("production diagnostics reveal nothing", async ({ request }) => {
  const response = await request.get("/api/debug-db");
  expect(response.status()).toBe(404);
  expect(await response.text()).not.toMatch(/postgres|supabase|database_url|pooler/i);
});

test("unauthenticated customer cannot read a private plan", async ({ request }) => {
  expect((await request.get("/api/plan/not-a-real-plan")).status()).toBe(401);
});

test("unsafe affiliate destination cannot be supplied by the browser", async ({ request }) => {
  const response = await request.get("/api/affiliate/redirect?url=https%3A%2F%2Fevil.example", { maxRedirects: 0 });
  expect([302, 400, 404]).toContain(response.status());
  expect(response.headers()["location"] || "").not.toContain("evil.example");
});

test("public pricing page renders without horizontal overflow", async ({ page }) => {
  await page.goto("/pricing", { waitUntil: "domcontentloaded" });
  await expect(page.locator("body")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)).toBe(false);
});

test("checkout rejects an anonymous request", async ({ request }) => {
  expect((await request.post("/api/checkout/create", { data: { tier: "starter" } })).status()).toBe(401);
});
