import { appendFile, mkdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { config } from "../config.js";
import { HttpError } from "../middleware/errorHandler.js";

// Safety net: a collection stops accepting new records at this size, so a spam
// bot cannot fill the disk. Move to a database before this matters.
const MAX_BYTES = 5 * 1024 * 1024;

// Append-only JSON Lines storage: one record per line, safe for concurrent
// appends and trivial to inspect. The module has a tiny interface
// (append / readAll), so replacing it with a real database later only touches
// this file.
async function file(name) {
  await mkdir(config.storageDir, { recursive: true });
  return path.join(config.storageDir, `${name}.jsonl`);
}

export async function append(collection, record) {
  const target = await file(collection);
  const size = await stat(target).then((info) => info.size, () => 0);
  if (size > MAX_BYTES) throw new HttpError(503, "We cannot accept new messages right now. Please email us instead.");

  const entry = { id: randomUUID(), createdAt: new Date().toISOString(), ...record };
  await appendFile(target, JSON.stringify(entry) + "\n");
  return entry;
}

export async function readAll(collection) {
  try {
    const text = await readFile(await file(collection), "utf8");
    return text.split("\n").filter(Boolean).map((line) => JSON.parse(line));
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}
