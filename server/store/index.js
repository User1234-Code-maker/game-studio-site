import { createPool } from "../db/pool.js";
import { createFileStore } from "./fileStore.js";
import { createPgStore } from "./pgStore.js";

/** PostgreSQL when DATABASE_URL is set, JSON files otherwise (handy for local work). */
export function createStoreFromConfig(config) {
  if (!config.database.url) return createFileStore();
  return createPgStore(createPool(config.database));
}
