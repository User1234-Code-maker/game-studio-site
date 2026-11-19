// npm run db:import: copy the old storage/*.jsonl files into PostgreSQL.
// Safe to run more than once: rows that already exist are skipped.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { config } from "../config.js";
import { createPool } from "./pool.js";
import { migrate } from "./migrate.js";

if (!config.database.url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

async function lines(name) {
  try {
    const text = await readFile(path.join(config.storageDir, `${name}.jsonl`), "utf8");
    return text.split("\n").filter(Boolean).map((line) => JSON.parse(line));
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

const db = createPool(config.database);
const count = { messages: 0, subscribers: 0, orders: 0 };

try {
  await migrate(db);

  for (const m of await lines("messages")) {
    const r = await db.query(
      `INSERT INTO messages (id, created_at, first_name, last_name, email, message)
       VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING`,
      [m.id, m.createdAt, m.firstName, m.lastName, m.email, m.message],
    );
    count.messages += r.rowCount;
  }

  for (const s of await lines("subscribers")) {
    const r = await db.query(
      "INSERT INTO subscribers (id, created_at, email) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
      [s.id, s.createdAt, s.email],
    );
    count.subscribers += r.rowCount;
  }

  for (const o of await lines("orders")) {
    const r = await db.query(
      `INSERT INTO order_events (id, created_at, session_id, type, service_id, amount, email)
       VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING`,
      [o.id, o.createdAt, o.sessionId, o.type, o.serviceId ?? null, o.amount ?? null, o.email ?? null],
    );
    count.orders += r.rowCount;
  }

  console.log(`Imported: ${count.messages} messages, ${count.subscribers} subscribers, ${count.orders} order events.`);
} finally {
  await db.close();
}
