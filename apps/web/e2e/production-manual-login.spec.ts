import { test, expect } from "@playwright/test";

/**
 * Headed only: sign in with Clerk in the opened browser, click Resume in the
 * Playwright inspector when done, then asserts dashboard shell.
 *
 *   MANUAL_LOGIN_E2E=1 pnpm exec playwright test e2e/production-manual-login.spec.ts --headed
 *
 * Requires PLAYWRIGHT_BASE_URL (e.g. production) and PLAYWRIGHT_SKIP_WEBSERVER=1.
 */
test.describe("production after manual Clerk login", () => {
  test.beforeEach(() => {
    test.skip(
      process.env.MANUAL_LOGIN_E2E !== "1",
      'Set MANUAL_LOGIN_E2E=1 and run with --headed. Example: MANUAL_LOGIN_E2E=1 PLAYWRIGHT_BASE_URL=https://grove-azure-three.vercel.app PLAYWRIGHT_SKIP_WEBSERVER=1 pnpm exec playwright test e2e/production-manual-login.spec.ts --headed',
    );
  });

  test("dashboard shows Grove header after you sign in", async ({ page }) => {
    await page.goto("/sign-in");
    await page.pause();

    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: /^Grove$/ })).toBeVisible();
    await expect(page.getByTestId("app-header-toolbar")).toBeVisible();
  });
});
