import { createApp } from "./app.js";
import { config } from "./config.js";

const server = createApp().listen(config.port, () => {
  console.log(`Site and API running at http://localhost:${config.port} (${config.env})`);
  if (!config.stripe.secretKey) console.log("Stripe: not configured (set STRIPE_SECRET_KEY to enable test payments)");
});

// Slow-client protection (slowloris): do not let a connection hold a socket forever.
server.headersTimeout = 15_000;
server.requestTimeout = 30_000;
server.keepAliveTimeout = 5_000;

// Graceful shutdown: finish in-flight requests, but never hang forever.
let closing = false;
function shutdown(reason, code = 0) {
  if (closing) return;
  closing = true;
  console.log(`Shutting down (${reason})`);
  server.close(() => process.exit(code));
  setTimeout(() => process.exit(code || 1), 10_000).unref();
}

for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => shutdown(signal));

// A rejected promise nobody handled means a bug: log it and restart cleanly
// (the host, e.g. Render, starts the process again) instead of running in a broken state.
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
  shutdown("unhandledRejection", 1);
});
process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  shutdown("uncaughtException", 1);
});
