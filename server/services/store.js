import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { config } from "../config.js";

// Append-only JSON Lines storage: one record per line, safe for concurrent
// appends and trivial to inspect. The module has a tiny interface
// (append / readAll), so replacing it with a real database later only touches
// this file.
async function file(name) {
  await mkdir(config.storageDir, { recursive: true });
  return path.join(config.storageDir, `${name}.jsonl`);
}

export async function append(collection, record) {
  const entry = { id: randomUUID(), createdAt: new Date().toISOString(), ...record };
  await appendFile(await file(collection), JSON.stringify(entry) + "\n");
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
