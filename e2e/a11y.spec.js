import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "./fixtures.js";

// Automated accessibility check (WCAG 2 A/AA + best practices) on every page, in both themes.
// Scroll-reveal animations are switched to their final state first, so faded-out text is not judged.
const PAGES = ["/", "/about", "/services", "/news", "/contact", "/order/cancel", "/not-a-page"];

for (const theme of ["dark", "light"]) {
  for (const path of PAGES) {
    test(`a11y: ${path} (${theme} theme) has no axe violations`, async ({ page }) => {
      page.expectedMissing.push("/not-a-page");
      await page.addInitScript((t) => localStorage.setItem("theme", t), theme);
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      await page.evaluate(() => document.querySelectorAll(".rv,.fx-split,.sticker").forEach((el) => el.classList.add("in")));
      await page.waitForTimeout(1300);

      const { violations } = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"])
        .analyze();
      expect(
        violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} node(s), e.g. ${v.nodes[0]?.target.join(" ")}`),
      ).toEqual([]);
    });
  }
}
