import { createApp } from "./app.js";
import { config } from "./config.js";

const server = createApp().listen(config.port, () => {
  console.log(`Site and API running at http://localhost:${config.port}`);
});

// Graceful shutdown: finish in-flight requests before exiting.
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
