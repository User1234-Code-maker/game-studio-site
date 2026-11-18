import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

// Use a throwaway storage folder so tests never touch real data.
const storage = await mkdtemp(path.join(tmpdir(), "site-test-"));
process.env.STORAGE_DIR = storage;
process.env.RATE_LIMIT_PER_MINUTE = "1000";

const { createApp } = await import("../server/app.js");

let server;
let base;

before(async () => {
  server = createApp().listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  server.close();
  await rm(storage, { recursive: true, force: true });
});

const post = (url, body) =>
  fetch(base + url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

test("health check", async () => {
  const res = await fetch(base + "/api/health");
  assert.equal(res.status, 200);
  assert.equal((await res.json()).status, "ok");
});

test("news list, search and single article", async () => {
  const all = await (await fetch(base + "/api/news")).json();
  assert.equal(all.total, 9);

  const found = await (await fetch(base + "/api/news?q=rowing")).json();
  assert.ok(found.total >= 1 && found.items.every((a) => JSON.stringify(a).toLowerCase().includes("rowing")));

  const none = await (await fetch(base + "/api/news?q=zzzz")).json();
  assert.equal(none.total, 0);

  const one = await fetch(base + "/api/news/n1");
  assert.equal(one.status, 200);
  assert.equal((await fetch(base + "/api/news/nope")).status, 404);
});

test("news pagination is clamped", async () => {
  const page = await (await fetch(base + "/api/news?limit=2&page=2")).json();
  assert.equal(page.items.length, 2);
  assert.equal(page.page, 2);
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

test("contact: invalid input returns field errors", async () => {
  const res = await post("/api/contact", { firstName: "", lastName: "X", email: "nope", message: "short" });
  assert.equal(res.status, 422);
  const body = await res.json();
  assert.deepEqual(Object.keys(body.details).sort(), ["email", "firstName", "message"]);
});

test("subscribe: new, duplicate and invalid", async () => {
  assert.equal((await post("/api/subscribe", { email: "a@b.co" })).status, 201);
  const again = await post("/api/subscribe", { email: "A@b.co" });
  assert.equal(again.status, 200);
  assert.match((await again.json()).message, /already/);
  assert.equal((await post("/api/subscribe", { email: "bad" })).status, 422);
});

test("unknown API route is JSON 404, bad JSON is 400", async () => {
  assert.equal((await fetch(base + "/api/nothing")).status, 404);
  const bad = await fetch(base + "/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{oops",
  });
  assert.equal(bad.status, 400);
});

test("static pages are served, private files are not", async () => {
  for (const page of ["/", "/about.html", "/contact.html", "/news.html"]) {
    assert.equal((await fetch(base + page)).status, 200, page);
  }
  assert.equal((await fetch(base + "/css/main.css")).status, 200);
  for (const hidden of ["/package.json", "/server/app.js", "/.gitignore", "/storage/messages.jsonl"]) {
    assert.equal((await fetch(base + hidden)).status, 404, hidden);
  }
});
