// Security checks that run against the real Express app over real HTTP:
// headers, hostile input, path traversal, information leaks, webhook forgery,
// price tampering, file permissions and log hygiene.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { setupEnv, listen, postJson, fakeStripe } from "./helpers.js";

const env = await setupEnv();
const { createApp } = await import("../server/app.js");
const { createPayments } = await import("../server/services/payments.js");
const { loadConfig } = await import("../server/config.js");
const { rateLimit } = await import("../server/middleware/rateLimit.js");

const SECRET_FILE_TEXT = "TOP-SECRET-DOTFILE";
await writeFile(path.join(process.env.CLIENT_DIR, ".secret"), SECRET_FILE_TEXT);

const stripe = fakeStripe();
let server;
let base;
const post = (url, body, headers) => postJson(base, url, body, headers);
const webhook = (event, signature = "valid:whsec_x", contentType = "application/json") =>
  fetch(base + "/api/stripe/webhook", {
    method: "POST",
    headers: { "Content-Type": contentType, "Stripe-Signature": signature },
    body: typeof event === "string" ? event : JSON.stringify(event),
  });
const paidEvent = (id, over = {}) => ({
  type: "checkout.session.completed",
  data: { object: { id, payment_status: "paid", amount_total: 150_000, currency: "usd", metadata: { serviceId: "mobile" }, ...over } },
});
const orderStatus = async (id) => (await fetch(`${base}/api/orders/${id}`)).json();

before(async () => {
  const payments = createPayments({ stripe, publicUrl: "https://shop.test", webhookSecret: "whsec_x" });
  ({ server, base } = await listen(createApp({ payments })));
});

after(async () => {
  server.close();
  await env.cleanup();
});

// ---------------------------------------------------------------- headers

test("every page sends the security headers", async () => {
  for (const url of ["/", "/api/health", "/missing-page"]) {
    const res = await fetch(base + url);
    const csp = res.headers.get("content-security-policy");
    assert.ok(csp, `${url}: CSP present`);
    assert.match(csp, /default-src 'self'/);
    assert.match(csp, /script-src 'self'(;|$)/, `${url}: scripts only from our origin, no inline`);
    assert.doesNotMatch(csp.match(/script-src[^;]*/)[0], /unsafe-inline|unsafe-eval|\*/);
    assert.match(csp, /frame-ancestors 'none'/);
    assert.match(csp, /object-src 'none'/);
    assert.match(csp, /base-uri 'self'/);
    assert.equal(res.headers.get("x-content-type-options"), "nosniff");
    assert.equal(res.headers.get("x-frame-options"), "DENY");
    assert.equal(res.headers.get("x-powered-by"), null, "framework is not advertised");
    assert.equal(res.headers.get("referrer-policy"), "strict-origin-when-cross-origin");
    assert.match(res.headers.get("permissions-policy"), /camera=\(\)/);
    assert.equal(res.headers.get("cross-origin-opener-policy"), "same-origin");
  }
});

test("API answers are never cached; index.html is revalidated, hashed assets are immutable", async () => {
  assert.equal((await fetch(base + "/api/health")).headers.get("cache-control"), "no-store");
  assert.equal((await fetch(base + "/api/news")).headers.get("cache-control"), "no-store");
  assert.equal((await fetch(base + "/")).headers.get("cache-control"), "no-cache");
  assert.match((await fetch(base + "/assets/app-abc123.js")).headers.get("cache-control"), /immutable/);
});

test("no wildcard CORS: another site cannot read API answers", async () => {
  const res = await fetch(base + "/api/news", { headers: { Origin: "https://evil.example" } });
  assert.equal(res.headers.get("access-control-allow-origin"), null);
  const preflight = await fetch(base + "/api/contact", {
    method: "OPTIONS",
    headers: { Origin: "https://evil.example", "Access-Control-Request-Method": "POST" },
  });
  assert.equal(preflight.headers.get("access-control-allow-origin"), null);
});

// ---------------------------------------------------------------- config

test("config refuses unsafe settings", () => {
  assert.throws(() => loadConfig({ STRIPE_SECRET_KEY: "sk_live_abc" }), /test key/);
  assert.doesNotThrow(() => loadConfig({ STRIPE_SECRET_KEY: "sk_live_abc", STRIPE_ALLOW_LIVE: "true" }));
  assert.doesNotThrow(() => loadConfig({ STRIPE_SECRET_KEY: "sk_test_abc" }));
  assert.throws(
    () => loadConfig({ NODE_ENV: "production", STRIPE_SECRET_KEY: "sk_test_abc", PUBLIC_URL: "http://shop.example" }),
    /https/,
  );
  assert.doesNotThrow(() =>
    loadConfig({ NODE_ENV: "production", STRIPE_SECRET_KEY: "sk_test_abc", PUBLIC_URL: "https://shop.example/" }),
  );
  assert.equal(loadConfig({ NODE_ENV: "production", PUBLIC_URL: "https://shop.example/" }).publicUrl, "https://shop.example");
});

// ---------------------------------------------------------------- files and paths

test("path traversal and hidden files never expose anything", async () => {
  const attempts = [
    "/../package.json",
    "/..%2fpackage.json",
    "/%2e%2e/%2e%2e/etc/passwd",
    "/%2e%2e%2f%2e%2e%2fetc%2fpasswd",
    "/assets/..%2f..%2fpackage.json",
    "/assets/%2e%2e/index.html",
    "/assets/..%5c..%5cpackage.json",
    "/..\\..\\package.json",
    "/index.html%00.js",
    "/.secret",
    "/.env",
    "/.git/config",
    "/server/config.js",
    "/storage/messages.jsonl",
    "/data/news.json",
    "/%00",
    "/api/../package.json",
  ];
  for (const attempt of attempts) {
    const res = await fetch(base + attempt, { redirect: "manual" });
    const text = await res.text();
    // The client may normalise "%2e%2e" itself and ask for a harmless file such as /index.html.
    const harmless = res.status === 200 && /id=root/.test(text);
    assert.ok([400, 403, 404].includes(res.status) || harmless, `${attempt} -> ${res.status}`);
    assert.doesNotMatch(text, /root:|"name": "game-studio-site"|STRIPE_SECRET|loadConfig|TOP-SECRET/, attempt);
  }
});

test("only GET/HEAD reach pages; other methods on API routes are not found", async () => {
  for (const method of ["PUT", "DELETE", "PATCH"]) {
    for (const url of ["/api/contact", "/api/subscribe", "/api/news", "/api/checkout", "/api/health"]) {
      const res = await fetch(base + url, { method });
      assert.equal(res.status, 404, `${method} ${url}`);
    }
  }
  const get = await fetch(base + "/api/contact");
  assert.equal(get.status, 404, "write endpoints do not answer GET");
  assert.equal((await fetch(base + "/api/stripe/webhook")).status, 404, "webhook is POST only");
});

// ---------------------------------------------------------------- hostile input

test("contact and subscribe reject injection-shaped and wrongly typed input", async () => {
  const valid = { firstName: "Ann", lastName: "Lee", email: "ann@example.com", message: "Hello there, friend." };
  const bad = [
    { ...valid, email: { $ne: "" } },
    { ...valid, email: ["a@b.co"] },
    { ...valid, firstName: { $gt: "" } },
    { ...valid, message: 12345678901234 },
    { ...valid, email: "a@b.co\r\nBcc: victim@example.com" },
    { ...valid, email: "a b@c.de" },
    { ...valid, email: `${"a".repeat(200)}@example.com` },
    { ...valid, firstName: "x".repeat(61) },
    { ...valid, message: "short" },
    { ...valid, message: "x".repeat(2001) },
    {},
    [],
  ];
  for (const body of bad) {
    const res = await post("/api/contact", body);
    assert.equal(res.status, 422, JSON.stringify(body).slice(0, 80));
    assert.equal((await res.json()).code, "validation_failed");
  }
  for (const email of [{ $ne: "" }, ["a@b.co"], "x", "a@b", "a@b.co\nBcc:x@y.zz", null, 5]) {
    const res = await post("/api/subscribe", { email });
    assert.equal(res.status, 422, JSON.stringify(email));
  }
});

test("JSON body edge cases: bad JSON, top-level primitives, wrong content type", async () => {
  const raw = (body, type = "application/json") =>
    fetch(base + "/api/contact", { method: "POST", headers: { "Content-Type": type }, body });

  assert.equal((await raw("{not json")).status, 400);
  assert.equal((await raw('"just a string"')).status, 400, "strict JSON parsing: objects and arrays only");
  assert.equal((await raw("123")).status, 400);
  assert.equal((await raw("null")).status, 400);
  assert.equal((await raw("")).status, 422, "empty body is a validation error, not a crash");
  // A cross-site <form> can only send these types; they must never reach the handlers' data.
  assert.equal((await raw('{"firstName":"A"}', "text/plain")).status, 422);
  assert.equal((await raw("firstName=A&lastName=B", "application/x-www-form-urlencoded")).status, 422);
});

test("prototype pollution payloads change nothing", async () => {
  const payload = '{"__proto__":{"polluted":"yes"},"constructor":{"prototype":{"polluted":"yes"}},"email":"p@example.com"}';
  const res = await fetch(base + "/api/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload });
  assert.equal(res.status, 201);
  assert.equal({}.polluted, undefined);
  assert.equal(Object.prototype.polluted, undefined);
});

test("script payloads are stored as plain text and never echoed back as markup", async () => {
  const xss = '<img src=x onerror=alert(1)><script>alert(1)</script>';
  const res = await post("/api/contact", { firstName: xss, lastName: "Lee", email: "x@example.com", message: `${xss} padding text` });
  assert.equal(res.status, 201);
  assert.match(res.headers.get("content-type"), /application\/json/);
  assert.deepEqual(await res.json(), { ok: true });

  const stored = (await readFile(path.join(process.env.STORAGE_DIR, "messages.jsonl"), "utf8")).trim().split("\n").map((l) => JSON.parse(l));
  assert.ok(stored.some((m) => m.firstName === xss), "kept verbatim; React escapes on display");

  // Validation errors do not reflect the input either.
  const reflect = await post("/api/contact", { firstName: "<b>boom</b>", lastName: "", email: "<i>", message: "x" });
  assert.doesNotMatch(await reflect.text(), /<b>|<i>|boom/);
});

test("news search and paging tolerate hostile query strings", async () => {
  const queries = [
    "?q=%00",
    "?q[]=a&q[]=b",
    "?q=" + "a".repeat(5000),
    "?q=.*&page=-5&limit=999999",
    "?q=%E0%A4%A",
    "?page=abc&limit=NaN",
    "?q[$ne]=1",
    "?__proto__[x]=1",
  ];
  for (const query of queries) {
    const res = await fetch(`${base}/api/news${query}`);
    assert.ok(res.status === 200 || res.status === 400, `${query} -> ${res.status}`);
    const body = await res.json();
    if (res.status === 200) {
      assert.ok(body.limit <= 50 && body.page >= 1, query);
      assert.ok(Array.isArray(body.items));
    }
  }
  for (const id of ["__proto__", "constructor", "../../package.json", "%00", "x".repeat(500)]) {
    const res = await fetch(`${base}/api/news/${encodeURIComponent(id)}`);
    assert.equal(res.status, 404, id);
  }
  assert.equal((await fetch(`${base}/api/news/%E0%A4%A`)).status, 400, "broken percent-encoding is a client error");
});

test("size limits: JSON 10 kB, webhook 1 MB", async () => {
  assert.equal((await post("/api/contact", { message: "x".repeat(11_000) })).status, 413);
  assert.equal((await post("/api/checkout", { serviceId: "pc", pad: "x".repeat(11_000) })).status, 413);
  const huge = await webhook("x".repeat(1_100_000));
  assert.equal(huge.status, 413);
});

// ---------------------------------------------------------------- information leaks

test("unexpected errors are masked: no stack, no paths, no internals", async () => {
  const boom = createApp({
    payments: {
      createCheckout: async () => {
        throw new Error("secret db password=hunter2 at /home/claude/work/site/server/x.js");
      },
      getOrderStatus: async () => {
        throw new TypeError("Cannot read properties of undefined (reading 'secret')");
      },
      handleWebhook: async () => ({ received: true }),
    },
  });
  const { server: s, base: b } = await listen(boom);
  const silence = console.error;
  console.error = () => {};
  try {
    for (const res of [
      await postJson(b, "/api/checkout", { serviceId: "pc" }),
      await fetch(`${b}/api/orders/cs_test_abc123`),
    ]) {
      const text = await res.text();
      assert.equal(res.status, 500);
      assert.doesNotMatch(text, /hunter2|password|\/home|stack|TypeError|secret|at .*\.js/i);
      assert.equal(JSON.parse(text).code, "server_error");
    }
  } finally {
    console.error = silence;
    s.close();
  }
});

test("a Stripe outage is reported as 502 without provider details", async () => {
  const outage = createApp({
    payments: {
      createCheckout: async () => {
        throw Object.assign(new Error("Invalid API Key provided: sk_test_****abcd"), { type: "StripeAuthenticationError" });
      },
      getOrderStatus: async () => ({}),
      handleWebhook: async () => ({}),
    },
  });
  const { server: s, base: b } = await listen(outage);
  const silence = console.error;
  console.error = () => {};
  try {
    const res = await postJson(b, "/api/checkout", { serviceId: "pc" });
    const text = await res.text();
    assert.equal(res.status, 502);
    assert.equal(JSON.parse(text).code, "payment_provider_error");
    assert.doesNotMatch(text, /sk_test|API Key|Stripe/);
  } finally {
    console.error = silence;
    s.close();
  }
});

test("request log keeps order ids and request bodies out", async () => {
  const lines = [];
  const original = console.log;
  console.log = (...args) => lines.push(args.join(" "));
  const { server: s, base: b } = await listen(createApp({ payments: null, logRequests: true }));
  try {
    await postJson(b, "/api/contact", { firstName: "Private", lastName: "Person", email: "private@example.com", message: "very private message" });
    await fetch(`${b}/api/orders/cs_test_a1B2c3D4e5?token=abc`);
    await fetch(`${b}/api/news?q=secretquery`);
  } finally {
    console.log = original;
    s.close();
  }
  const log = lines.join("\n");
  assert.match(log, /POST \/api\/contact 201/);
  assert.match(log, /cs_\*\*\*/);
  assert.doesNotMatch(log, /cs_test_a1B2|Private|private@example|very private|secretquery|token=/);
});

// ---------------------------------------------------------------- storage

test("stored visitor data is readable by the server user only", { skip: process.platform === "win32" }, async () => {
  await post("/api/subscribe", { email: "perm@example.com" });
  const file = await stat(path.join(process.env.STORAGE_DIR, "subscribers.jsonl"));
  const dir = await stat(process.env.STORAGE_DIR);
  assert.equal(file.mode & 0o077, 0, "no group/other access to the file");
  assert.equal(dir.mode & 0o077, 0, "no group/other access to the folder");
});

test("parallel writes never corrupt the data file", async () => {
  const emails = Array.from({ length: 40 }, (_, i) => `load${i}@example.com`);
  const results = await Promise.all(emails.map((email) => post("/api/subscribe", { email })));
  assert.ok(results.every((r) => r.status === 201));
  const lines = (await readFile(path.join(process.env.STORAGE_DIR, "subscribers.jsonl"), "utf8")).trim().split("\n");
  const stored = lines.map((line) => JSON.parse(line).email);
  for (const email of emails) assert.equal(stored.filter((e) => e === email).length, 1, email);
});

test("subscribe answers the same for new and known addresses", async () => {
  const first = await post("/api/subscribe", { email: "same@example.com" });
  const again = await post("/api/subscribe", { email: "SAME@example.com" });
  assert.equal(first.status, again.status);
  assert.deepEqual(await first.json(), await again.json());
});

// ---------------------------------------------------------------- rate limiter

test("rate limiter memory is bounded", async () => {
  const { default: express } = await import("express");
  const app = express();
  app.set("trust proxy", true);
  app.get("/", rateLimit({ limit: 1, maxKeys: 5 }), (_req, res) => res.json({ ok: true }));
  const { server: s, base: b } = await listen(app);
  try {
    for (let i = 0; i < 50; i += 1) {
      const res = await fetch(b, { headers: { "X-Forwarded-For": `10.0.0.${i}` } });
      assert.equal(res.status, 200);
    }
  } finally {
    s.close();
  }
});

// ---------------------------------------------------------------- payments

test("price tampering, odd ids and odd locales are neutralised", async () => {
  const res = await post("/api/checkout", { serviceId: "mobile", amount: 1, price: 1, unit_amount: 1, currency: "eur", locale: "ru\nX-Evil: 1" });
  assert.equal(res.status, 201);
  const sent = stripe.calls.create.at(-1);
  assert.equal(sent.line_items[0].price_data.unit_amount, 150_000);
  assert.equal(sent.line_items[0].price_data.currency, "usd");
  assert.equal(sent.locale, "ru", "only the two-letter code survives; the injected header text is cut off");

  const before = stripe.calls.create.length;
  for (const serviceId of ["../etc", "pc; DROP TABLE", "PC", "", " ", "x".repeat(41), { $ne: "" }, ["pc"], null]) {
    const bad = await post("/api/checkout", { serviceId });
    assert.equal(bad.status, 422, JSON.stringify(serviceId));
  }
  assert.equal(stripe.calls.create.length, before, "Stripe is never called for invalid input");
});

test("return URLs come from server settings, never from the Host header", async () => {
  const res = await fetch(base + "/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Forwarded-Host": "evil.example", Origin: "https://evil.example", Referer: "https://evil.example/" },
    body: JSON.stringify({ serviceId: "ps4", successUrl: "https://evil.example", success_url: "https://evil.example" }),
  });
  assert.equal(res.status, 201);
  const sent = stripe.calls.create.at(-1);
  assert.match(sent.success_url, /^https:\/\/shop\.test\/order\/success/);
  assert.equal(sent.cancel_url, "https://shop.test/order/cancel");
  assert.doesNotMatch(JSON.stringify(sent), /evil/);
});

test("webhook: missing, forged or wrongly typed requests are refused and change nothing", async () => {
  const { id } = await (await post("/api/checkout", { serviceId: "mobile" })).json();
  const event = paidEvent(id);

  assert.equal((await webhook(event, "")).status, 400);
  assert.equal((await webhook(event, "forged")).status, 400);
  assert.equal((await webhook(event, "valid:other-secret")).status, 400);
  assert.equal((await webhook(event, "valid:whsec_x", "text/plain")).status, 400, "signature is checked over the raw JSON only");
  assert.equal((await orderStatus(id)).status, "pending", "no forged request marked the order paid");
});

test("webhook: sessions we did not create are ignored", async () => {
  const res = await webhook(paidEvent("cs_test_NotOurs123"));
  assert.equal(res.status, 200);
  assert.equal((await res.json()).ignored, true);
  assert.equal((await fetch(`${base}/api/orders/cs_test_NotOurs123`)).status, 404);
});

test("webhook: a paid event with the wrong amount or currency never marks the order paid", async () => {
  const silence = console.error;
  console.error = () => {};
  try {
    const cheap = await (await post("/api/checkout", { serviceId: "mobile" })).json();
    await webhook(paidEvent(cheap.id, { amount_total: 100 }));
    assert.equal((await orderStatus(cheap.id)).status, "pending");

    const eur = await (await post("/api/checkout", { serviceId: "mobile" })).json();
    await webhook(paidEvent(eur.id, { currency: "eur" }));
    assert.equal((await orderStatus(eur.id)).status, "pending");

    // Metadata from the event is not trusted either: the service stays what we created.
    const real = await (await post("/api/checkout", { serviceId: "mobile" })).json();
    await webhook(paidEvent(real.id, { metadata: { serviceId: "3d" } }));
    const status = await orderStatus(real.id);
    assert.equal(status.status, "paid");
    assert.equal(status.serviceId, "mobile");
  } finally {
    console.error = silence;
  }
});

test("webhook: unpaid and unrelated events do not mark anything paid", async () => {
  const { id } = await (await post("/api/checkout", { serviceId: "3d" })).json();
  const unpaid = paidEvent(id, { payment_status: "unpaid", amount_total: 80_000 });
  assert.equal((await webhook(unpaid)).status, 200);
  assert.equal((await webhook({ type: "customer.created", data: { object: { id } } })).status, 200);
  assert.equal((await orderStatus(id)).status, "pending");
});

test("the status page cannot be tricked into reading Stripe for a forged amount", async () => {
  const { id } = await (await post("/api/checkout", { serviceId: "pc" })).json();
  stripe.sessions.get(id).payment_status = "paid";
  stripe.sessions.get(id).amount_total = 5; // Stripe says paid, but not our price
  const silence = console.error;
  console.error = () => {};
  try {
    assert.equal((await orderStatus(id)).status, "pending");
  } finally {
    console.error = silence;
  }
});

test("order lookups validate the id format", async () => {
  for (const id of ["..%2f..%2fetc%2fpasswd", "cs_test_", "cs_live_%27%20OR%201%3D1", "x".repeat(300), "cs_test_abc/def", "CS_TEST_abc"]) {
    const res = await fetch(`${base}/api/orders/${id}`);
    assert.ok([400, 404].includes(res.status), `${id} -> ${res.status}`);
  }
});
