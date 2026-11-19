import express from "express";
import helmet from "helmet";
import compression from "compression";
import path from "node:path";
import { existsSync } from "node:fs";
import { createApiRouter } from "./routes/api.js";
import { webhookRouter } from "./routes/payments.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { isKnownRoute } from "./routes/spa.js";
import { permissionsPolicy, securityHeaders } from "./security.js";
import { config } from "./config.js";
import { createPayments, createStripeClient } from "./services/payments.js";
import { createStoreFromConfig } from "./store/index.js";

function defaultPayments(store) {
  if (!config.stripe.secretKey) return null;
  return createPayments({
    store,
    stripe: createStripeClient(config.stripe.secretKey),
    publicUrl: config.publicUrl,
    webhookSecret: config.stripe.webhookSecret,
  });
}

/**
 * Builds the app without listening, so tests can call it directly.
 * `store` (PostgreSQL or files) and `payments` can be injected: tests pass a fake
 * Stripe and an in-memory database; pass payments: null to disable payments.
 */
export function createApp({
  store = createStoreFromConfig(config),
  payments = defaultPayments(store),
  logRequests = config.env !== "test",
} = {}) {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", config.trustProxy);

  app.use(requestLogger({ enabled: logRequests }));
  app.use(securityHeaders());
  if (config.isProduction) {
    app.use(helmet.hsts({ maxAge: 15_552_000, includeSubDomains: true }));
  }
  app.use(permissionsPolicy);
  app.use(compression());

  // API answers are never cached (order status, errors).
  app.use("/api", (_req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });

  // Webhook first: it needs the raw body that express.json() would consume.
  app.use("/api", webhookRouter(payments));
  app.use("/api", express.json({ limit: "10kb" }), createApiRouter({ payments, store }), notFound);

  // React build. Hashed files in /assets are cached for a year; index.html never.
  const dist = config.clientDir;
  if (existsSync(dist)) {
    app.use("/assets", express.static(path.join(dist, "assets"), { immutable: true, maxAge: "1y", fallthrough: false }));
    app.use(express.static(dist, { index: false, maxAge: "1h" }));
    // Single-page app: any other GET shows the app (React Router renders the 404 itself).
    // Unknown URLs still get the app (it draws its own 404 page) but with a real 404
    // status, so search engines do not index them.
    app.get(/.*/, (req, res) => {
      res.set("Cache-Control", "no-cache");
      res.status(isKnownRoute(req.path) ? 200 : 404).sendFile(path.join(dist, "index.html"));
    });
  } else {
    app.get("/", (_req, res) =>
      res.status(503).type("text").send("Front end is not built yet. Run: npm run build"),
    );
  }

  app.use(errorHandler);
  // The server entry point starts and stops the store through these.
  app.locals.store = store;
  return app;
}
