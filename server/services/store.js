import { appendFile, mkdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { config } from "../config.js";
import { HttpError } from "../lib/httpError.js";
import { withLock } from "../lib/mutex.js";

// Safety net: a collection stops accepting new records at this size, so a spam
// bot cannot fill the disk. Move to a database before this matters.
const MAX_BYTES = 5 * 1024 * 1024;

// Append-only JSON Lines storage: one record per line, trivial to inspect.
// The interface is tiny (append / appendUnique / readAll), so replacing it with
// a real database later only touches this file.
const filePath = (name) => path.join(config.storageDir, `${name}.jsonl`);

async function readFileLines(target) {
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

export const append = (collection, record) => withLock(collection, () => write(collection, record));

/**
 * Appends unless a record with the same key already exists.
 * The check and the write run under one lock, so two simultaneous requests
 * cannot both pass the check (which would store a duplicate).
 */
export const appendUnique = (collection, record, keyOf) =>
  withLock(collection, async () => {
    const wanted = keyOf(record);
    const existing = (await readFileLines(filePath(collection))).find((item) => keyOf(item) === wanted);
    if (existing) return { created: false, entry: existing };
    return { created: true, entry: await write(collection, record) };
  });

export const readAll = (collection) => readFileLines(filePath(collection));
