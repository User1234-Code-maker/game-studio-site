// The whole app (routes, validation, payments) running on every storage back end.
import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import { setupEnv, listen, postJson, fakeStripe } from "./helpers.js";

const env = await setupEnv();
after(() => env.cleanup());
const { createApp } = await import("../server/app.js");
const { createPayments } = await import("../server/services/payments.js");
const { backends } = await import("./backends.js");

for (const backend of backends()) {
  describe(`app on ${backend.name}`, () => {
    let server, base, cleanup, store;
    const stripe = fakeStripe();
    const added = [];

    before(async () => {
      ({ store, cleanup } = await backend.make());
      // Record what reaches the store, without changing how it behaves.
      const original = store.messages.add;
      store.messages.add = async (data) => {
        added.push(data);
        return original(data);
      };
      const payments = createPayments({ stripe, publicUrl: "https://shop.test", webhookSecret: "whsec_x", store });
      ({ server, base } = await listen(createApp({ store, payments })));
    });
    after(async () => {
      server.close();
      await cleanup();
    });

    const post = (url, body) => postJson(base, url, body);
    const webhook = (event) =>
      fetch(`${base}/api/stripe/webhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Stripe-Signature": "valid:whsec_x" },
        body: JSON.stringify(event),
      });

    test("health reports the storage in use", async () => {
      const body = await (await fetch(`${base}/api/health`)).json();
      assert.equal(body.status, "ok");
      assert.equal(body.storage, store.kind);
    });

    test("contact form: valid message is stored, invalid one is not", async () => {
      const ok = await post("/api/contact", { firstName: "Ann", lastName: "Lee", email: "ann@example.com", message: "Hello there, friend." });
      assert.equal(ok.status, 201);
      assert.equal(added.at(-1).email, "ann@example.com");

      const before = added.length;
      assert.equal((await post("/api/contact", { firstName: "", lastName: "Lee", email: "x", message: "short" })).status, 422);
      assert.equal(added.length, before);
    });

    test("subscribe: same answer for new and known addresses, any letter case", async () => {
      const first = await post("/api/subscribe", { email: "Same@Example.com" });
      const again = await post("/api/subscribe", { email: "same@example.COM" });
      assert.equal(first.status, 201);
      assert.equal(again.status, 201);
      assert.deepEqual(await first.json(), await again.json());
    });

    test("SQL injection through the API changes nothing", async () => {
      const evil = "x'); DROP TABLE messages; DROP TABLE subscribers; --";
      await post("/api/contact", { firstName: evil, lastName: evil, email: "evil@example.com", message: `${evil} ${evil}` });
      await post("/api/subscribe", { email: `a${evil}@example.com` });
      await post("/api/subscribe", { email: "' OR '1'='1" });
      // Tables are still there and the next request works.
      assert.equal((await post("/api/subscribe", { email: "after@example.com" })).status, 201);
      assert.equal((await post("/api/contact", { firstName: "Ok", lastName: "Ok", email: "ok@example.com", message: "Still working fine." })).status, 201);
      for (const id of ["cs_test_x'; DROP TABLE order_events;--", "cs_test_abc' OR 1=1 --"]) {
        const res = await fetch(`${base}/api/orders/${encodeURIComponent(id)}`);
        assert.equal(res.status, 400);
      }
    });

    test("payment cycle: order, webhook, status, repeated webhook, forged amount", async () => {
      const { id } = await (await post("/api/checkout", { serviceId: "pc", email: "buyer@example.com" })).json();
      assert.equal((await (await fetch(`${base}/api/orders/${id}`)).json()).status, "pending");

      const event = { type: "checkout.session.completed", data: { object: { id, payment_status: "paid", amount_total: 200_000, currency: "usd", customer_details: { email: "buyer@example.com" } } } };
      assert.equal((await webhook(event)).status, 200);
      assert.equal((await webhook(event)).status, 200);
      const status = await (await fetch(`${base}/api/orders/${id}`)).json();
      assert.equal(status.status, "paid");
      assert.equal(status.amount, 200_000);
      assert.equal(status.serviceId, "pc");

      const other = await (await post("/api/checkout", { serviceId: "mobile" })).json();
      const silence = console.error;
      console.error = () => {};
      await webhook({ ...event, data: { object: { ...event.data.object, id: other.id, amount_total: 1 } } });
      console.error = silence;
      assert.equal((await (await fetch(`${base}/api/orders/${other.id}`)).json()).status, "pending");
    });
  });
}

describe("storage failures", () => {
  test("health check answers 503 without details when the database is down", async () => {
    const down = {
      kind: "postgres",
      ping: async () => {
        throw Object.assign(new Error("connect ECONNREFUSED 10.1.2.3:5432 password authentication"), { code: "ECONNREFUSED" });
      },
      init: async () => {},
      close: async () => {},
    };
    const { server, base } = await listen(createApp({ store: down, payments: null }));
    const silence = console.error;
    console.error = () => {};
    try {
      const res = await fetch(`${base}/api/health`);
      const text = await res.text();
      assert.equal(res.status, 503);
      assert.equal(JSON.parse(text).code, "storage_unavailable");
      assert.doesNotMatch(text, /ECONNREFUSED|10\.1\.2\.3|password/);
    } finally {
      console.error = silence;
      server.close();
    }
  });

  test("a database error on a write is a masked 500, not a crash or a leak", async () => {
    const broken = {
      kind: "postgres",
      ping: async () => {},
      init: async () => {},
      close: async () => {},
      messages: { add: async () => { throw Object.assign(new Error('relation "messages" does not exist at /srv/app/store.js'), { code: "42P01" }); } },
      subscribers: { add: async () => ({ created: true }) },
      orders: { record: async () => ({}), bySession: async () => [] },
    };
    const { server, base } = await listen(createApp({ store: broken, payments: null }));
    const silence = console.error;
    console.error = () => {};
    try {
      const res = await postJson(base, "/api/contact", { firstName: "Ann", lastName: "Lee", email: "a@example.com", message: "Hello there, friend." });
      const text = await res.text();
      assert.equal(res.status, 500);
      assert.doesNotMatch(text, /relation|42P01|\/srv|store\.js/);
      assert.equal((await fetch(`${base}/api/health`)).status, 200, "the server keeps running");
    } finally {
      console.error = silence;
      server.close();
    }
  });
});
