import pg from "pg";

/**
 * Builds the connection pool and wraps it in the tiny interface the rest of
 * the code uses: query(text, params) and transaction(fn).
 * Tests plug in an in-memory Postgres behind the same two methods.
 */
export function createPool({ url, ssl = "false", max = 10 }) {
  const sslOption =
    ssl === "true" ? { rejectUnauthorized: true } : ssl === "no-verify" ? { rejectUnauthorized: false } : false;

  const pool = new pg.Pool({
    connectionString: url,
    ssl: sslOption,
    max,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
    statement_timeout: 10_000,
  });
  // An idle connection dropped by the database must not crash the process.
  pool.on("error", (error) => console.error("Database pool error:", error.code ?? error.message));

  return {
    query: (text, params) => pool.query(text, params),
    async transaction(work) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const result = await work({ query: (text, params) => client.query(text, params) });
        await client.query("COMMIT");
        return result;
      } catch (error) {
        await client.query("ROLLBACK").catch(() => {});
        throw error;
      } finally {
        client.release();
      }
    },
    close: () => pool.end(),
  };
}
