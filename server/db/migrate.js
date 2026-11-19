import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "migrations");
// Any fixed number: all instances starting at once queue up on this lock.
const LOCK_ID = 4_815_162_342;

/**
 * Applies every .sql file in server/db/migrations that has not run yet, in
 * name order. Each file runs in its own transaction and is recorded in
 * schema_migrations, so running this twice does nothing.
 */
export async function migrate(db, { log = () => {} } = {}) {
  const files = (await readdir(dir)).filter((name) => name.endsWith(".sql")).sort();

  await db.transaction(async (tx) => {
    await tx.query("SELECT pg_advisory_xact_lock($1)", [LOCK_ID]);
    await tx.query(
      "CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())",
    );
    const { rows } = await tx.query("SELECT version FROM schema_migrations");
    const done = new Set(rows.map((row) => row.version));

    for (const file of files) {
      if (done.has(file)) continue;
      await tx.query(await readFile(path.join(dir, file), "utf8"));
      await tx.query("INSERT INTO schema_migrations (version) VALUES ($1)", [file]);
      log(`Applied migration ${file}`);
    }
  });
}
