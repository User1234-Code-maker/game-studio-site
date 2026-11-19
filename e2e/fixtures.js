import { test as base, expect } from "@playwright/test";

const ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//;

/**
 * Every test gets a page that:
 *  - starts in English with a clean state,
 *  - never reaches the real internet (Google Fonts, Stripe),
 *  - records console errors, uncaught exceptions, CSP violations and failed local requests.
 * Call `expectClean()` at the end of a test to fail on any of them.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    const problems = [];

    await page.addInitScript(() => {
      if (!localStorage.getItem("lang")) localStorage.setItem("lang", "en");
      window.__cspViolations = [];
      document.addEventListener("securitypolicyviolation", (e) => {
        window.__cspViolations.push(`${e.violatedDirective} ${e.blockedURI}`);
      });
    });

    await page.route(
      (url) => !ORIGIN.test(url.href),
      (route) => {
        const url = route.request().url();
        // Stripe's hosted page is replaced by a stub, everything else external is blocked.
        if (url.startsWith("https://checkout.stripe.com/"))
          return route.fulfill({ contentType: "text/html", body: "<title>Stripe stub</title><h1>Stripe Checkout (stub)</h1>" });
        return route.abort();
      },
    );

    page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`));
    page.on("console", (msg) => {
      if (msg.type() !== "error") return;
      const text = msg.text();
      // Blocked external requests (fonts) and the expected 4xx/5xx from negative tests are not bugs.
      if (/Failed to load resource/.test(text)) return;
      problems.push(`console.error: ${text}`);
    });
    page.on("response", (response) => {
      const url = response.url();
      if (!ORIGIN.test(url) || response.status() < 400) return;
      if (url.includes("/api/") || url.includes("/__e2e/")) return; // negative API tests are expected
      if (page.expectedMissing?.some((part) => url.includes(part))) return;
      problems.push(`HTTP ${response.status()} for ${url}`);
    });

    page.expectClean = async () => {
      const violations = await page.evaluate(() => window.__cspViolations ?? []).catch(() => []);
      expect([...problems, ...violations.map((v) => `CSP violation: ${v}`)]).toEqual([]);
    };
    page.problems = problems;
    page.expectedMissing = [];

    await use(page);
  },
});

export { expect };
