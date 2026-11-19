// The storage back ends every store test runs against:
//  - "file":     JSON Lines files (local development)
//  - "pglite":   a real PostgreSQL engine running in memory (fast, needs nothing installed)
//  - "postgres": a real PostgreSQL server, only when TEST_DATABASE_URL is set (CI does this)
import { PGlite } from "@electric-sql/pglite";
import { randomBytes } from "node:crypto";
import { createFileStore } from "../server/store/fileStore.js";
import { createPgStore } from "../server/store/pgStore.js";
import { createPool } from "../server/db/pool.js";

export async function createPgliteDb() {
  const pg = new PGlite();
  await pg.waitReady;
  // Statements without parameters may hold several commands (migrations), which only exec() allows.
  const run = (target) => async (text, params) => {
    if (params?.length) return target.query(text, params);
    const results = await target.exec(text);
    return { rows: results.at(-1)?.rows ?? [] };
  };
  return {
    query: run(pg),
    transaction: (work) => pg.transaction((tx) => work({ query: run(tx) })),
    close: () => pg.close(),
  };
}

export function backends() {
  const list = [
    { name: "file", async make() { return { store: createFileStore(), cleanup: async () => {} }; } },
    {
      name: "pglite",
      async make() {
        const db = await createPgliteDb();
        const store = createPgStore(db);
        await store.init();
        return { store, cleanup: () => store.close() };
      },
    },
  ];

  const adminUrl = process.env.TEST_DATABASE_URL;
  if (adminUrl) {
    list.push({
      name: "postgres",
      async make() {
        // A throw-away database per test file, dropped afterwards.
        const name = `site_test_${randomBytes(4).toString("hex")}`;
        const admin = createPool({ url: adminUrl, max: 1 });
        await admin.query(`CREATE DATABASE ${name}`);
        const url = new URL(adminUrl);
        url.pathname = `/${name}`;
        const store = createPgStore(createPool({ url: url.toString(), max: 5 }));
        await store.init();
        return {
          store,
          cleanup: async () => {
            await store.close();
            await admin.query(`DROP DATABASE ${name} WITH (FORCE)`);
            await admin.close();
          },
        };
      },
    });
  }
  return list;
}
