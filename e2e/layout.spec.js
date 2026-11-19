import { test, expect } from "./fixtures.js";

test("no page scrolls sideways", async ({ page }) => {
  for (const path of ["/", "/about", "/news", "/contact"]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${path} overflows by ${overflow}px`).toBeLessThanOrEqual(1);
  }
});

test("navigation works at this screen size", async ({ page, isMobile }) => {
  await page.goto("/");
  if (isMobile) await page.getByRole("button", { name: /open menu/i }).click();
  await page.getByRole("link", { name: /about us/i }).first().click();
  await expect(page).toHaveURL(/\/about$/);
  if (isMobile) await page.getByRole("button", { name: /open menu/i }).click();
  await page.getByRole("link", { name: /news/i }).first().click();
  await expect(page).toHaveURL(/\/news$/);
  await page.expectClean();
});
