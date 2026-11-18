import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { config } from "../config.js";

// Content lives in data/*.json (the same files the page builder uses).
// Cached by modification time, so edits show up without a restart.
const cache = new Map();

export async function loadData(name) {
  const file = path.join(config.dataDir, name);
  const { mtimeMs } = await stat(file);
  const hit = cache.get(file);
  if (hit && hit.mtimeMs === mtimeMs) return hit.value;

  const value = JSON.parse(await readFile(file, "utf8"));
  cache.set(file, { mtimeMs, value });
  return value;
}
