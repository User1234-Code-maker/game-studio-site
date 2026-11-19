// npm run db:migrate: create or update the tables without starting the server.
import { config } from "../config.js";
import { createPool } from "./pool.js";
import { migrate } from "./migrate.js";

if (!config.database.url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const db = createPool(config.database);
try {
  await migrate(db, { log: (line) => console.log(line) });
  console.log("Database is up to date.");
} finally {
  await db.close();
}
