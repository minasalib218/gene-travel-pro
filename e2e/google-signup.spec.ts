import { expect, test } from "@playwright/test";

test("signup exposes Google authentication and starts the configured OAuth flow", async ({ page }) => {
  await page.goto("/signup?next=%2Fprofile");

  const googleButton = page.getByRole("button", { name: "Continue with Google" });
  await expect(googleButton).toBeVisible();
  await expect(googleButton).toBeEnabled();

  await googleButton.click();
  await page.waitForURL(/(igqsznadqigliqpxjtez\.supabase\.co|accounts\.google\.com)/, { timeout: 15_000 });
});
