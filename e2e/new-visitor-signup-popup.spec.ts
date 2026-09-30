import { expect, test } from "@playwright/test";

test.describe("new visitor signup popup", () => {
  test.beforeEach(async ({ context, page }) => {
    await context.clearCookies();
    await page.goto("/");
    await page.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
  });

  test("fits mobile and sends a new visitor to signup", async ({ page }) => {
    await page.reload();

    const dialog = page.getByRole("dialog", { name: /Find the best choices/i });
    await expect(dialog).toBeVisible({ timeout: 8_000 });
    await expect(page.locator("body")).toHaveCSS("overflow", "hidden");

    const bounds = await dialog.boundingBox();
    const viewport = page.viewportSize();
    expect(bounds).not.toBeNull();
    expect(viewport).not.toBeNull();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.y).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport!.width);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport!.height);

    await page.getByRole("button", { name: "Start for Free" }).click();
    await expect(page).toHaveURL(/\/signup\?next=%2F$/);
  });

  test("does not appear on auth pages", async ({ page }) => {
    await page.goto("/signin");
    await page.waitForTimeout(3_000);
    await expect(page.getByRole("dialog", { name: /Find the best choices/i })).toHaveCount(0);
  });

  test("dismissal restores the page and suppresses the popup", async ({ page }) => {
    await page.reload();
    const dialog = page.getByRole("dialog", { name: /Find the best choices/i });
    await expect(dialog).toBeVisible({ timeout: 8_000 });

    await page.getByRole("button", { name: "Close signup invitation" }).click();
    await expect(dialog).toBeHidden();
    await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");

    await page.reload();
    await page.waitForTimeout(3_000);
    await expect(dialog).toHaveCount(0);
  });
});
