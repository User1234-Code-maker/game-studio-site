import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

// Each test file gets its own throwaway storage folder and a tiny fake front-end build.
export async function setupEnv() {
  const root = await mkdtemp(path.join(tmpdir(), "site-test-"));
  const dist = path.join(root, "dist");
  await mkdir(path.join(dist, "assets"), { recursive: true });
  await writeFile(path.join(dist, "index.html"), "<!doctype html><title>app</title><div id=root></div>");
  await writeFile(path.join(dist, "assets", "app-abc123.js"), "console.log(1)");
  process.env.NODE_ENV = "test";
  process.env.STORAGE_DIR = path.join(root, "storage");
  process.env.CLIENT_DIR = dist;
  process.env.RATE_LIMIT_PER_MINUTE = "1000";
  return { root, cleanup: () => rm(root, { recursive: true, force: true }) };
}

export async function listen(app) {
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  return { server, base: `http://127.0.0.1:${server.address().port}` };
}

export const postJson = (base, url, body, headers = {}) =>
  fetch(base + url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });

// A stand-in for the Stripe SDK: records calls, never touches the network.
export function fakeStripe() {
  const calls = { create: [], retrieve: [] };
  const sessions = new Map();
  return {
    calls,
    sessions,
    checkout: {
      sessions: {
        async create(params) {
          calls.create.push(params);
          const id = `cs_test_${calls.create.length}abc`;
          sessions.set(id, { id, payment_status: "unpaid", metadata: params.metadata, amount_total: params.line_items[0].price_data.unit_amount });
          return { id, url: `https://checkout.stripe.com/c/pay/${id}` };
        },
        async retrieve(id) {
          calls.retrieve.push(id);
          return sessions.get(id);
        },
      },
    },
    webhooks: {
      constructEvent(body, signature, secret) {
        if (signature !== `valid:${secret}`) throw new Error("bad signature");
        return JSON.parse(body.toString());
      },
    },
  };
}
