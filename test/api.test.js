import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { setupEnv, listen, postJson } from "./helpers.js";

const env = await setupEnv();
const { createApp } = await import("../server/app.js");

let server;
let base;
const post = (url, body) => postJson(base, url, body);

before(async () => {
  ({ server, base } = await listen(createApp({ payments: null })));
});

after(async () => {
  server.close();
  await env.cleanup();
});

test("health check", async () => {
  const res = await fetch(base + "/api/health");
  assert.equal(res.status, 200);
  assert.equal((await res.json()).status, "ok");
  assert.match(res.headers.get("x-request-id"), /^[0-9a-f-]{8}$/);
});

test("news list, search and single article", async () => {
  const all = await (await fetch(base + "/api/news")).json();
  assert.equal(all.total, 9);

  const found = await (await fetch(base + "/api/news?q=rowing")).json();
  assert.ok(found.total >= 1 && found.items.every((a) => JSON.stringify(a).toLowerCase().includes("rowing")));

  const none = await (await fetch(base + "/api/news?q=zzzz")).json();
  assert.equal(none.total, 0);

  assert.equal((await fetch(base + "/api/news/n1")).status, 200);
  const missing = await fetch(base + "/api/news/nope");
  assert.equal(missing.status, 404);
  assert.equal((await missing.json()).code, "article_not_found");
});

test("news pagination is clamped", async () => {
  const page = await (await fetch(base + "/api/news?limit=2&page=2")).json();
  assert.equal(page.items.length, 2);
  assert.equal(page.page, 2);
  const huge = await (await fetch(base + "/api/news?limit=9999")).json();
  assert.equal(huge.limit, 50);
});

test("offices and stats agree", async () => {
  const { offices, hq } = await (await fetch(base + "/api/offices")).json();
  const stats = await (await fetch(base + "/api/stats")).json();
  assert.equal(offices.length, stats.offices);
  assert.ok(offices.some((o) => o.id === hq));
});

test("contact: valid message is stored", async () => {
  const res = await post("/api/contact", {
    firstName: "Ada",
    lastName: "Lovelace",
    email: "ada@example.com",
    message: "Hello, I would like to talk about a project.",
  });
  assert.equal(res.status, 201);
});

test("contact: invalid input returns field error codes", async () => {
  const res = await post("/api/contact", { firstName: "", lastName: "X", email: "nope", message: "short" });
  assert.equal(res.status, 422);
  const body = await res.json();
  assert.equal(body.code, "validation_failed");
  assert.deepEqual(body.details, { firstName: "required", email: "invalid_email", message: "too_short" });
});

test("subscribe: answer does not reveal whether an address is already known", async () => {
  const first = await post("/api/subscribe", { email: "a@b.co" });
  const again = await post("/api/subscribe", { email: "A@b.co" });
  assert.equal(first.status, 201);
  assert.equal(again.status, 201);
  assert.deepEqual(await first.json(), await again.json());
  assert.equal((await post("/api/subscribe", { email: "bad" })).status, 422);
});

test("subscribe: simultaneous requests store one record", async () => {
  const email = "race@example.com";
  await Promise.all(Array.from({ length: 12 }, () => post("/api/subscribe", { email })));
  const file = await readFile(path.join(process.env.STORAGE_DIR, "subscribers.jsonl"), "utf8");
  assert.equal(file.split("\n").filter((line) => line.includes(email)).length, 1);
});

test("unknown API route is JSON 404, bad JSON is 400, big body is 413", async () => {
  const unknown = await fetch(base + "/api/nothing");
  assert.equal(unknown.status, 404);
  assert.equal((await unknown.json()).code, "not_found");

  const bad = await fetch(base + "/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{oops",
  });
  assert.equal(bad.status, 400);
  assert.equal((await bad.json()).code, "invalid_json");

  const big = await post("/api/contact", { message: "x".repeat(20_000) });
  assert.equal(big.status, 413);
});

test("front end: app shell for any page, hashed assets cached, private files not served", async () => {
  for (const page of ["/", "/about", "/services", "/news", "/contact", "/about/"]) {
    const res = await fetch(base + page);
    assert.equal(res.status, 200, page);
    assert.match(await res.text(), /id=root/);
  }
  // Unknown pages still get the app (it draws the 404 screen) but with a real 404 status.
  const unknown = await fetch(base + "/some/unknown/page");
  assert.equal(unknown.status, 404);
  assert.match(await unknown.text(), /id=root/);
  const asset = await fetch(base + "/assets/app-abc123.js");
  assert.equal(asset.status, 200);
  assert.match(asset.headers.get("cache-control"), /immutable/);
  assert.equal((await fetch(base + "/assets/missing.js")).status, 404);

  for (const hidden of ["/package.json", "/server/app.js", "/.env", "/storage/messages.jsonl"]) {
    const res = await fetch(base + hidden);
    assert.equal(res.status, 404, hidden);
    assert.match(await res.text(), /id=root/, `${hidden} must fall back to the app shell`);
  }
});

test("rate limit cannot be dodged with a fake X-Forwarded-For header", async () => {
  const { default: express } = await import("express");
  const { rateLimit } = await import("../server/middleware/rateLimit.js");
  const { config } = await import("../server/config.js");

  const small = express();
  small.set("trust proxy", config.trustProxy);
  small.post("/", rateLimit({ limit: 2 }), (_req, res) => res.json({ ok: true }));
  const { server: srv, base: url } = await listen(small);

  const codes = [];
  for (let i = 0; i < 4; i++) {
    const res = await fetch(url, { method: "POST", headers: { "X-Forwarded-For": `9.9.9.${i}` } });
    codes.push(res.status);
  }
  srv.close();
  assert.deepEqual(codes, [200, 200, 429, 429]);
});

test("security headers: strict CSP, no inline scripts, no framing", async () => {
  const res = await fetch(base + "/");
  const csp = res.headers.get("content-security-policy");
  assert.match(csp, /default-src 'self'/);
  assert.match(csp, /script-src 'self'(;|$)/);
  assert.doesNotMatch(csp, /script-src[^;]*unsafe-inline/);
  assert.equal(res.headers.get("x-frame-options"), "DENY");
  assert.equal(res.headers.get("x-content-type-options"), "nosniff");
  assert.match(res.headers.get("permissions-policy"), /camera=\(\)/);
  assert.equal(res.headers.get("x-powered-by"), null);
});

test("payments are reported as disabled when Stripe is not configured", async () => {
  const services = await (await fetch(base + "/api/services")).json();
  assert.equal(services.enabled, false);
  assert.equal(services.items.length, 6);
  const res = await post("/api/checkout", { serviceId: "pc" });
  assert.equal(res.status, 503);
  assert.equal((await res.json()).code, "payments_disabled");
});
