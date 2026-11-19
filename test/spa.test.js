import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { KNOWN_ROUTES, isKnownRoute } from "../server/routes/spa.js";

test("server route list matches the routes declared in client/src/App.tsx", async () => {
  const source = await readFile(new URL("../client/src/App.tsx", import.meta.url), "utf8");
  const declared = [...source.matchAll(/<Route\s+path="([^"]+)"/g)].map((m) => m[1]).filter((p) => p !== "*");
  assert.deepEqual([...declared].sort(), [...KNOWN_ROUTES].sort());
});

test("isKnownRoute handles trailing slashes and unknown paths", () => {
  assert.equal(isKnownRoute("/"), true);
  assert.equal(isKnownRoute("/about/"), true);
  assert.equal(isKnownRoute("/about//"), true);
  assert.equal(isKnownRoute("/About"), false);
  assert.equal(isKnownRoute("/nope"), false);
});
