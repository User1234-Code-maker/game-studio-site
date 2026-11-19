import { appendFile, mkdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { config } from "../config.js";
import { HttpError } from "../lib/httpError.js";
import { withLock } from "../lib/mutex.js";

// Safety net: a file stops accepting new records at this size, so a spam
// bot cannot fill the disk. This store is meant for local development;
// production uses PostgreSQL (see pgStore.js).
const MAX_BYTES = 5 * 1024 * 1024;

const filePath = (name) => path.join(config.storageDir, `${name}.jsonl`);

async function readLines(target) {
  try {
    const text = await readFile(target, "utf8");
    return text.split("\n").filter(Boolean).map((line) => JSON.parse(line));
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

async function write(collection, record) {
  await mkdir(config.storageDir, { recursive: true, mode: 0o700 });
  const target = filePath(collection);
  const size = await stat(target).then((info) => info.size, () => 0);
  if (size > MAX_BYTES) throw new HttpError(503, "storage_full", "We cannot accept new messages right now.");

  const entry = { id: randomUUID(), createdAt: new Date().toISOString(), ...record };
  // Owner-only: these files hold visitors' e-mails and messages.
  await appendFile(target, `${JSON.stringify(entry)}\n`, { mode: 0o600 });
  return entry;
}

const append = (collection, record) => withLock(collection, () => write(collection, record));

// Check and write under one lock, so two simultaneous requests cannot both pass the check.
const appendUnique = (collection, record, keyOf) =>
  withLock(collection, async () => {
    const wanted = keyOf(record);
    const existing = (await readLines(filePath(collection))).find((item) => keyOf(item) === wanted);
    if (existing) return { created: false, entry: existing };
    return { created: true, entry: await write(collection, record) };
  });

/** JSON Lines files in STORAGE_DIR. Same interface as the PostgreSQL store. */
export function createFileStore() {
  return {
    kind: "file",
    init: async () => {},
    ping: async () => {},
    close: async () => {},
    messages: {
      add: (data) => append("messages", data),
    },
    subscribers: {
      add: (email) => appendUnique("subscribers", { email }, (item) => item.email.toLowerCase()),
    },
    orders: {
      record: (event) => appendUnique("orders", event, (item) => `${item.sessionId}:${item.type}`),
      bySession: async (sessionId) => (await readLines(filePath("orders"))).filter((item) => item.sessionId === sessionId),
    },
  };
}

