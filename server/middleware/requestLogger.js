import { randomUUID } from "node:crypto";

// Adds a request id (also sent back as X-Request-Id) and logs one line per API
// request. Only the method, path and status are logged, never bodies, so
// personal data does not end up in the logs.
export function requestLogger({ enabled = true } = {}) {
  return (req, res, next) => {
    req.id = randomUUID().slice(0, 8);
    res.set("X-Request-Id", req.id);
    if (enabled && req.path.startsWith("/api")) {
      const start = process.hrtime.bigint();
      res.on("finish", () => {
        const ms = Number(process.hrtime.bigint() - start) / 1e6;
        // A Stripe session id works like a receipt link, so keep it out of the logs.
        const path = req.originalUrl.split("?")[0].replace(/cs_(test|live)_[A-Za-z0-9]+/g, "cs_***");
        console.log(`[${req.id}] ${req.method} ${path} ${res.statusCode} ${ms.toFixed(0)}ms`);
      });
    }
    next();
  };
}
