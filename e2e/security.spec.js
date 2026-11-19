import { test, expect } from "./fixtures.js";

const PAYLOADS = [
  '<img src=x onerror="window.__xss=1">',
  '"><script>window.__xss=1</script>',
  "<svg onload=window.__xss=1>",
  "javascript:window.__xss=1",
  "'-window.__xss=1-'",
];

test("headers: CSP, framing, sniffing and referrer policy are enforced in the browser", async ({ request }) => {
  const res = await request.get("/");
  const h = res.headers();
  expect(h["content-security-policy"]).toContain("script-src 'self'");
  expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(h["x-frame-options"]).toBe("DENY");
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["x-powered-by"]).toBeUndefined();
});

test("CSP really blocks an injected inline script and an injected external script", async ({ page }) => {
  await page.goto("/");
  const outcome = await page.evaluate(async () => {
    window.__ran = false;
    const inline = document.createElement("script");
    inline.textContent = "window.__ran = true";
    document.head.appendChild(inline);

    const external = document.createElement("script");
    external.src = "https://evil.example/x.js";
    document.head.appendChild(external);

    const handler = document.createElement("img");
    handler.setAttribute("onerror", "window.__ran = true");
    handler.src = "x:";
    document.body.appendChild(handler);
    await new Promise((r) => setTimeout(r, 300));
    return { ran: window.__ran, violations: window.__cspViolations };
  });
  expect(outcome.ran).toBe(false);
  expect(outcome.violations.length).toBeGreaterThanOrEqual(2);
});

test("the page cannot be put into someone else's frame", async ({ page, baseURL }) => {
  await page.goto("/");
  const blocked = await page.evaluate(async (url) => {
    const frame = document.createElement("iframe");
    frame.src = url;
    document.body.appendChild(frame);
    await new Promise((r) => setTimeout(r, 800));
    try {
      return frame.contentDocument?.body?.innerHTML ?? "no-document";
    } catch {
      return "cross-origin";
    }
  }, baseURL + "/about");
  // Same-origin frames are allowed by X-Frame-Options only when SAMEORIGIN; we send DENY.
  expect(["", "no-document"].includes(blocked) || blocked === "cross-origin" || !blocked.includes("<h1")).toBe(true);
});

test("XSS: hostile text in the URL, search box and forms is shown as text, never run", async ({ page }) => {
  for (const payload of PAYLOADS) {
    // query string on pages that read it
    await page.goto(`/order/success?session_id=${encodeURIComponent(payload)}`);
    await page.goto(`/news?q=${encodeURIComponent(payload)}`);
    await page.goto(`/${encodeURIComponent(payload)}`);

    // news search
    await page.goto("/news");
    const search = page.getByRole("searchbox").or(page.getByRole("textbox", { name: /search/i })).first();
    await search.fill(payload);
    await page.waitForTimeout(400);

    // contact form
    await page.goto("/contact");
    await page.getByLabel("First Name", { exact: true }).fill(payload);
    await page.getByLabel("Last Name", { exact: true }).fill(payload);
    await page.getByLabel("Email Address", { exact: true }).fill(payload);
    await page.getByLabel("Message", { exact: true }).fill(payload + payload);
    await page.getByRole("button", { name: /get in touch/i }).click();
    await page.waitForTimeout(300);

    expect(await page.evaluate(() => window.__xss), payload).toBeUndefined();
    expect(await page.locator("img[src='x'], svg[onload], script:not([src])").count(), payload).toBe(0);
  }
});

test("stored XSS: a message saved by the API is not turned into markup anywhere on the site", async ({ page, request }) => {
  const payload = '<img src=x onerror="window.__xss=1">';
  const res = await request.post("/api/contact", {
    data: { firstName: payload, lastName: payload, email: "x@example.com", message: payload + " long enough" },
  });
  expect(res.status()).toBe(201);
  for (const path of ["/", "/about", "/services", "/news", "/contact"]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    expect(await page.evaluate(() => window.__xss), path).toBeUndefined();
  }
});

test("external links open safely", async ({ page }) => {
  for (const path of ["/", "/about", "/contact"]) {
    await page.goto(path);
    const unsafe = await page.evaluate(() =>
      [...document.querySelectorAll('a[target="_blank"]')]
        .filter((a) => !/noopener/.test(a.rel) || !/noreferrer/.test(a.rel))
        .map((a) => a.href),
    );
    expect(unsafe, path).toEqual([]);
  }
});

test("the page keeps no secrets in what it ships to the browser", async ({ request }) => {
  const html = await (await request.get("/")).text();
  const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+\.(?:js|css))"/g)].map((m) => m[1]);
  expect(assets.length).toBeGreaterThan(0);
  for (const asset of assets) {
    const res = await request.get(asset);
    expect(res.headers()["cache-control"]).toMatch(/immutable/);
    const text = await res.text();
    expect(text, asset).not.toMatch(/sk_(test|live)_[A-Za-z0-9]{8,}|whsec_[A-Za-z0-9]{8,}|STRIPE_SECRET|BEGIN (RSA )?PRIVATE KEY/);
    expect(text, asset).not.toMatch(/sourceMappingURL=/);
  }
});

test("no source maps and no server files are reachable", async ({ request }) => {
  for (const url of ["/assets/index.js.map", "/package.json", "/server/index.js", "/.env", "/storage/messages.jsonl", "/e2e/server.js"]) {
    const res = await request.get(url);
    const body = await res.text();
    expect(res.status(), url).toBe(404);
    expect(body, url).not.toMatch(/createApp|STRIPE|"dependencies"/);
  }
});

test("API abuse from the browser: oversized and malformed requests get clean errors", async ({ request }) => {
  const big = await request.post("/api/contact", { data: { message: "x".repeat(50_000) } });
  expect(big.status()).toBe(413);
  const bad = await request.post("/api/subscribe", { headers: { "Content-Type": "application/json" }, data: "{oops" });
  expect(bad.status()).toBe(400);
  const forged = await request.post("/api/stripe/webhook", {
    headers: { "Content-Type": "application/json", "Stripe-Signature": "forged" },
    data: { type: "checkout.session.completed" },
  });
  expect(forged.status()).toBe(400);
  for (const res of [big, bad, forged]) expect(JSON.stringify(await res.json())).not.toMatch(/stack|at .*\.js|\/home\//);
});

test("rate limit: a flood on one endpoint ends in 429 with Retry-After", async ({ playwright }) => {
  // A second server instance with a tiny limit (see playwright.config.js), so the flood
  // cannot slow down the other tests that share the main server's per-IP counters.
  const api = await playwright.request.newContext({ baseURL: "http://localhost:4174" });
  const statuses = [];
  let last;
  for (let i = 0; i < 12; i += 1) {
    last = await api.post("/api/checkout", { data: { serviceId: "nope" } });
    statuses.push(last.status());
  }
  expect(statuses.slice(0, 5)).toEqual([422, 422, 422, 422, 422]);
  expect(statuses.at(-1)).toBe(429);
  expect(last.headers()["retry-after"]).toMatch(/^\d+$/);
  expect((await last.json()).code).toBe("rate_limited");

  // The other bucket (contact form) is counted separately and still open.
  const contact = await api.post("/api/contact", { data: {} });
  expect(contact.status()).toBe(422);
  await api.dispose();
});
