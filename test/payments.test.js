import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { setupEnv, listen, postJson, fakeStripe } from "./helpers.js";

const env = await setupEnv();
const { createApp } = await import("../server/app.js");
const { createPayments } = await import("../server/services/payments.js");
const { loadConfig } = await import("../server/config.js");

const stripe = fakeStripe();
let server;
let base;

before(async () => {
  const payments = createPayments({ stripe, publicUrl: "http://shop.test", webhookSecret: "whsec_x" });
  ({ server, base } = await listen(createApp({ payments })));
});

after(async () => {
  server.close();
  await env.cleanup();
});

const checkout = (body) => postJson(base, "/api/checkout", body);
const webhook = (event, signature = "valid:whsec_x") =>
  fetch(base + "/api/stripe/webhook", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Stripe-Signature": signature },
    body: JSON.stringify(event),
  });

test("price comes from the server, never from the browser", async () => {
  const res = await checkout({ serviceId: "pc", amount: 1, unit_amount: 1, email: "kate@example.com", locale: "ru" });
  assert.equal(res.status, 201);
  const { url, id } = await res.json();
  assert.match(url, /^https:\/\/checkout\.stripe\.com\//);
  assert.match(id, /^cs_test_/);

  const sent = stripe.calls.create.at(-1);
  assert.equal(sent.line_items[0].price_data.unit_amount, 200_000);
  assert.equal(sent.line_items[0].price_data.currency, "usd");
  assert.equal(sent.customer_email, "kate@example.com");
  assert.equal(sent.locale, "ru");
  assert.equal(sent.success_url, "http://shop.test/order/success?session_id={CHECKOUT_SESSION_ID}");
});

test("unknown service and wrong email are rejected before Stripe is called", async () => {
  const before = stripe.calls.create.length;
  const unknown = await checkout({ serviceId: "free-everything" });
  assert.equal(unknown.status, 422);
  assert.deepEqual((await unknown.json()).details, { serviceId: "invalid_service" });
  const badMail = await checkout({ serviceId: "pc", email: "nope" });
  assert.equal(badMail.status, 422);
  assert.equal(stripe.calls.create.length, before);
});

test("unsupported locale falls back to English", async () => {
  await checkout({ serviceId: "3d", locale: "xx" });
  assert.equal(stripe.calls.create.at(-1).locale, "en");
});

test("webhook with a wrong signature is refused", async () => {
  const res = await webhook({ type: "checkout.session.completed" }, "forged");
  assert.equal(res.status, 400);
  assert.equal((await res.json()).code, "bad_signature");
});

test("paid webhook marks the order paid once, even if Stripe repeats it", async () => {
  const { id } = await (await checkout({ serviceId: "mobile" })).json();
  const event = {
    type: "checkout.session.completed",
    data: { object: { id, payment_status: "paid", amount_total: 150_000, currency: "usd", metadata: { serviceId: "mobile" }, customer_details: { email: "a@b.co" } } },
  };
  assert.equal((await webhook(event)).status, 200);
  assert.equal((await webhook(event)).status, 200);

  const status = await (await fetch(`${base}/api/orders/${id}`)).json();
  assert.equal(status.status, "paid");
  assert.equal(status.service, "Mobile Game Development");
  assert.equal(status.amount, 150_000);
});

test("success page falls back to asking Stripe when the webhook is late", async () => {
  const { id } = await (await checkout({ serviceId: "ar-vr" })).json();
  assert.equal((await (await fetch(`${base}/api/orders/${id}`)).json()).status, "pending");

  stripe.sessions.get(id).payment_status = "paid";
  assert.equal((await (await fetch(`${base}/api/orders/${id}`)).json()).status, "paid");
});

test("expired session is reported as expired", async () => {
  const { id } = await (await checkout({ serviceId: "ps4" })).json();
  await webhook({ type: "checkout.session.expired", data: { object: { id } } });
  assert.equal((await (await fetch(`${base}/api/orders/${id}`)).json()).status, "expired");
});

test("order lookup validates the id and hides unknown orders", async () => {
  assert.equal((await fetch(`${base}/api/orders/..%2Fetc`)).status, 400);
  assert.equal((await fetch(`${base}/api/orders/cs_test_doesnotexist`)).status, 404);
});

test("live keys are refused unless explicitly allowed", () => {
  assert.throws(() => loadConfig({ STRIPE_SECRET_KEY: "sk_live_123" }), /test key/);
  assert.doesNotThrow(() => loadConfig({ STRIPE_SECRET_KEY: "sk_test_123" }));
  assert.doesNotThrow(() => loadConfig({ STRIPE_SECRET_KEY: "sk_live_123", STRIPE_ALLOW_LIVE: "true" }));
});
