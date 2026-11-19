import { migrate } from "../db/migrate.js";

const entryOf = (row) => ({
  id: row.id,
  createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  type: row.type,
  sessionId: row.session_id,
  serviceId: row.service_id ?? undefined,
  amount: row.amount ?? undefined,
  email: row.email ?? undefined,
});

/**
 * PostgreSQL store. Every value goes in as a query parameter ($1, $2, ...),
 * never glued into the SQL text, so input cannot change the query.
 */
export function createPgStore(db) {
  return {
    kind: "postgres",
    init: () => migrate(db, { log: (line) => console.log(line) }),
    ping: async () => {
      await db.query("SELECT 1");
    },
    close: () => db.close?.(),

    messages: {
      async add({ firstName, lastName, email, message }) {
        const { rows } = await db.query(
          "INSERT INTO messages (first_name, last_name, email, message) VALUES ($1, $2, $3, $4) RETURNING id, created_at",
          [firstName, lastName, email, message],
        );
        return { id: rows[0].id, createdAt: rows[0].created_at };
      },
    },

    subscribers: {
      // The unique index on lower(email) decides, so simultaneous requests cannot both insert.
      async add(email) {
        const { rows } = await db.query(
          "INSERT INTO subscribers (email) VALUES ($1) ON CONFLICT (lower(email)) DO NOTHING RETURNING id",
          [email],
        );
        return { created: rows.length === 1 };
      },
    },

    orders: {
      async record({ type, sessionId, serviceId = null, amount = null, email = null }) {
        const inserted = await db.query(
          `INSERT INTO order_events (session_id, type, service_id, amount, email)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (session_id, type) DO NOTHING
           RETURNING *`,
          [sessionId, type, serviceId, amount, email],
        );
        if (inserted.rows[0]) return { created: true, entry: entryOf(inserted.rows[0]) };

        const existing = await db.query("SELECT * FROM order_events WHERE session_id = $1 AND type = $2", [sessionId, type]);
        return { created: false, entry: entryOf(existing.rows[0]) };
      },

      async bySession(sessionId) {
        const { rows } = await db.query("SELECT * FROM order_events WHERE session_id = $1 ORDER BY created_at, id", [sessionId]);
        return rows.map(entryOf);
      },
    },
  };
}
