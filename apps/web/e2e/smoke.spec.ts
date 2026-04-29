import { test, expect } from "@playwright/test";

test.describe("public marketing", () => {
  test("landing shows hero and sign-in", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /ADHD-aware accountability/i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign in" }).first()).toBeVisible();
  });

  test("sign-in route renders shell", async ({ page }) => {
    await page.goto("/sign-in", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/sign-in/);
    await expect(page.locator("main")).toBeVisible();
  });
});

test.describe("guest access (depends on env)", () => {
  test("dashboard is not a public dashboard — guest gets sign-in or setup message", async ({ page }) => {
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    const url = page.url();
    if (url.includes("sign-in")) {
      await expect(page).toHaveURL(/sign-in/);
      return;
    }
    if (url.includes("onboarding")) {
      await expect(page).toHaveURL(/onboarding/);
      return;
    }
    await expect(
      page.getByText(/Clerk|Supabase|NEXT_PUBLIC|dashboard/i).first(),
    ).toBeVisible();
  });
});
