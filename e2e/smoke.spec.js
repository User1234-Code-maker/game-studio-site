import { test, expect } from "./fixtures.js";

const PAGES = [
  { path: "/", title: /Logo Games/, heading: /./ },
  { path: "/about", title: /About/i, heading: /./ },
  { path: "/services", title: /Services/i, heading: /./ },
  { path: "/news", title: /News/i, heading: /./ },
  { path: "/contact", title: /Contact/i, heading: /./ },
];

for (const { path, title, heading } of PAGES) {
  test(`smoke: ${path} renders without errors`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response.status()).toBe(200);
    await expect(page).toHaveTitle(title);
    await expect(page.locator("h1").first()).toHaveText(heading);
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();
    // Page is interactive: wait for lazy content to settle, then scroll the whole page once.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 40));
      }
    });
    await page.waitForLoadState("networkidle");
    await page.expectClean();
  });
}

test("smoke: unknown URL shows the 404 page with a real 404 status", async ({ page }) => {
  page.expectedMissing.push("/definitely-not-a-page");
  const response = await page.goto("/definitely-not-a-page");
  expect(response.status()).toBe(404);
  await expect(page.getByText("404", { exact: true }).first()).toBeAttached();
  await expect(page.getByRole("link", { name: /home/i }).first()).toBeVisible();
  await page.expectClean();
});

test("smoke: images on every page have alt text and actually load", async ({ page }) => {
  for (const path of ["/", "/about", "/services", "/news", "/contact"]) {
    await page.goto(path);
    await page.evaluate(async () => {
      document.querySelectorAll("img[loading=lazy]").forEach((img) => img.setAttribute("loading", "eager"));
      await Promise.all([...document.images].map((img) => img.decode().catch(() => {})));
    });
    const broken = await page.evaluate(() =>
      [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && !i.src.startsWith("data:")).map((i) => i.src),
    );
    expect(broken, `${path}: broken images`).toEqual([]);
    const missingAlt = await page.evaluate(() => [...document.images].filter((i) => !i.hasAttribute("alt")).map((i) => i.src));
    expect(missingAlt, `${path}: images without alt attribute`).toEqual([]);
  }
});

test("smoke: health, services and news APIs answer with JSON", async ({ request }) => {
  const health = await request.get("/api/health");
  expect(health.ok()).toBe(true);
  const body = await health.json();
  expect(body.status).toBe("ok");
  expect(body.storage).toBe("postgres"); // the browser tests run on a real PostgreSQL engine

  const services = await (await request.get("/api/services")).json();
  expect(services.enabled).toBe(true);
  expect(services.items.length).toBe(6);

  const news = await (await request.get("/api/news")).json();
  expect(news.items.length).toBeGreaterThan(0);
});
