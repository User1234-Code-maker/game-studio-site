// The same behaviour is required from every storage back end.
import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import { setupEnv } from "./helpers.js";

const env = await setupEnv();
// Imported after setupEnv(): the file store reads STORAGE_DIR when it is first loaded.
const { backends, createPgliteDb } = await import("./backends.js");
after(() => env.cleanup());

const message = (over = {}) => ({
  firstName: "Ann",
  lastName: "Lee",
  email: "ann@example.com",
  message: "Hello there, friend.",
  ...over,
});

for (const backend of backends()) {
  describe(`store: ${backend.name}`, () => {
    let store;
    let cleanup;
    before(async () => ({ store, cleanup } = await backend.make()));
    after(() => cleanup());

    test("ping works", async () => {
      await store.ping();
    });

    test("messages are stored and get an id", async () => {
      const entry = await store.messages.add(message());
      assert.ok(entry.id);
      assert.ok(entry.createdAt);
    });

    test("subscribers: one record per address, whatever the letter case", async () => {
      assert.equal((await store.subscribers.add("Kate@Example.com")).created, true);
      assert.equal((await store.subscribers.add("kate@example.com")).created, false);
      assert.equal((await store.subscribers.add("KATE@EXAMPLE.COM")).created, false);
      assert.equal((await store.subscribers.add("other@example.com")).created, true);
    });

    test("subscribers: 40 simultaneous requests for one address store exactly one", async () => {
      const results = await Promise.all(Array.from({ length: 40 }, () => store.subscribers.add("race@example.com")));
      assert.equal(results.filter((r) => r.created).length, 1);
    });

    test("orders: an event is stored once per session and type", async () => {
      const id = "cs_test_contract1";
      const first = await store.orders.record({ type: "created", sessionId: id, serviceId: "pc", amount: 200000 });
      assert.equal(first.created, true);
      const again = await store.orders.record({ type: "created", sessionId: id, serviceId: "pc", amount: 999 });
      assert.equal(again.created, false);
      assert.equal(again.entry.amount, 200000, "the first record wins");

      await store.orders.record({ type: "paid", sessionId: id, serviceId: "pc", amount: 200000, email: "buyer@example.com" });
      const events = await store.orders.bySession(id);
      assert.deepEqual(events.map((e) => e.type).sort(), ["created", "paid"]);
      assert.equal(events.find((e) => e.type === "paid").email, "buyer@example.com");
      assert.equal(events.find((e) => e.type === "created").sessionId, id);
    });

    test("orders: other sessions are not mixed in; unknown session is empty", async () => {
      await store.orders.record({ type: "created", sessionId: "cs_test_contract2", serviceId: "3d", amount: 80000 });
      assert.equal((await store.orders.bySession("cs_test_contract2")).length, 1);
      assert.deepEqual(await store.orders.bySession("cs_test_nothing"), []);
    });

    test("orders: concurrent duplicate events are stored once", async () => {
      const id = "cs_test_contract3";
      const results = await Promise.all(
        Array.from({ length: 20 }, () => store.orders.record({ type: "paid", sessionId: id, amount: 1 })),
      );
      assert.equal(results.filter((r) => r.created).length, 1);
      assert.equal((await store.orders.bySession(id)).length, 1);
    });

    test("hostile text is stored as plain data and never run as SQL", async () => {
      const evil = `Robert'); DROP TABLE messages; --`;
      await store.messages.add(message({ firstName: evil, message: `${evil} ${evil}` }));
      await store.messages.add(message({ firstName: "😀 Юрий 日本語", message: "Привет, это длинное сообщение 😀" }));
      await store.subscribers.add(`o'brien+tag@example.com`);
      // Everything still works afterwards.
      const entry = await store.messages.add(message({ firstName: "Still" }));
      assert.ok(entry.id);
      assert.equal((await store.subscribers.add(`o'brien+tag@example.com`)).created, false);
    });
  });
}

// Only the database enforces these: its own rules back up the API validation.
describe("database constraints (PostgreSQL)", () => {
  let db;
  before(async () => {
    db = await createPgliteDb();
    const { createPgStore } = await import("../server/store/pgStore.js");
    await createPgStore(db).init();
  });
  after(() => db.close());

  const rejects = (sql, params, pattern = /violates check constraint|invalid input|duplicate key/) =>
    assert.rejects(() => db.query(sql, params), pattern);

  test("a message that is too short, too long or empty is rejected even if the API is bypassed", async () => {
    const insert = "INSERT INTO messages (first_name, last_name, email, message) VALUES ($1, $2, $3, $4)";
    await rejects(insert, ["A", "B", "a@b.co", "short"]);
    await rejects(insert, ["A", "B", "a@b.co", "x".repeat(2001)]);
    await rejects(insert, ["", "B", "a@b.co", "long enough message"]);
    await rejects(insert, ["x".repeat(61), "B", "a@b.co", "long enough message"]);
  });

  test("order events only accept real session ids and known types", async () => {
    const insert = "INSERT INTO order_events (session_id, type) VALUES ($1, $2)";
    await rejects(insert, ["not-a-session", "paid"]);
    await rejects(insert, ["cs_test_ok1", "refunded"]);
    await rejects(insert, ["cs_test_x'; DROP TABLE order_events;--", "paid"]);
    await db.query(insert, ["cs_test_ok1", "paid"]);
    await rejects(insert, ["cs_test_ok1", "paid"]);
  });

  test("migrations are applied once and can be run again safely", async () => {
    const { migrate } = await import("../server/db/migrate.js");
    await migrate(db);
    await migrate(db);
    const { rows } = await db.query("SELECT version FROM schema_migrations");
    assert.deepEqual(rows.map((r) => r.version), ["001_init.sql"]);
  });
});
