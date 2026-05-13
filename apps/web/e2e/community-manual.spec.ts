import { test, expect } from "@playwright/test";

/**
 * Headed manual flow: sign in (and finish onboarding if needed), land on /community,
 * create a community with a unique slug, then assert the v2 community board (not the entry form).
 *
 *   cd apps/web
 *   MANUAL_COMMUNITY_E2E=1 PLAYWRIGHT_SKIP_WEBSERVER=1 pnpm exec playwright test e2e/community-manual.spec.ts --headed
 *
 * Requires dev server on PLAYWRIGHT_BASE_URL (default http://127.0.0.1:3000).
 * When the inspector pauses the first time, complete Clerk sign-in and onboarding if redirected.
 * Resume the test; it will create a throwaway community and assert "Shared Goals" is visible.
 */
test.describe("v2 community entry → board (manual Clerk)", () => {
  test.beforeEach(() => {
    test.skip(
      process.env.MANUAL_COMMUNITY_E2E !== "1",
      "Set MANUAL_COMMUNITY_E2E=1 and run with --headed. See file header comment.",
    );
  });

  test("create community then shows board on /community", async ({ page }) => {
    await page.goto("/community", { waitUntil: "domcontentloaded" });
    await page.pause();

    const slug = `e2e-${Date.now()}`;
    const name = `E2E ${slug}`;

    const entryHeading = page.getByRole("heading", { name: "Pick one space to show up for" });
    const sharedGoals = page.getByRole("heading", { name: "Shared Goals" });

    if (await sharedGoals.isVisible().catch(() => false)) {
      await expect(sharedGoals).toBeVisible();
      return;
    }

    await expect(entryHeading).toBeVisible({ timeout: 30_000 });

    const createSection = page.locator("section").filter({ hasText: "Create a community" });
    await createSection.getByPlaceholder("Build night cohort").fill(name);
    await createSection.getByPlaceholder("build-night-cohort").fill(slug);

    await page.getByRole("button", { name: "Create community" }).click();

    await expect(entryHeading).toBeHidden({ timeout: 30_000 });
    await expect(sharedGoals).toBeVisible({ timeout: 30_000 });
  });
});
