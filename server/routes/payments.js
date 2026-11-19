import express, { Router } from "express";
import { SERVICES, CURRENCY } from "../services/catalog.js";
import { validateCheckout } from "../validation.js";
import { HttpError } from "../lib/httpError.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { route } from "../lib/route.js";

// Stripe must receive the exact bytes it signed, so this router is mounted
// BEFORE express.json() and the webhook reads the body raw.
export function webhookRouter(payments) {
  const router = Router();
  router.post(
    "/stripe/webhook",
    express.raw({ type: "application/json", limit: "1mb" }),
    route(async (req, res) => {
      if (!payments) throw new HttpError(503, "payments_disabled", "Payments are not configured");
      res.json(await payments.handleWebhook(req.body, req.get("stripe-signature") ?? ""));
    }),
  );
  return router;
}

export function paymentsRouter(payments, { limit }) {
  const router = Router();
  const requirePayments = (_req, _res, next) =>
    next(payments ? undefined : new HttpError(503, "payments_disabled", "Payments are not configured"));

  router.get("/services", (_req, res) =>
    res.json({
      currency: CURRENCY,
      enabled: Boolean(payments),
      items: SERVICES.map(({ id, name, depositCents }) => ({ id, name, depositCents })),
    }),
  );

  router.post(
    "/checkout",
    rateLimit({ limit }),
    requirePayments,
    route(async (req, res) => {
      const { data, errors, ok } = validateCheckout(req.body);
      if (!ok) throw new HttpError(422, "validation_failed", "Please check the form.", errors);
      const locale = String(req.body?.locale ?? "en").slice(0, 2);
      res.status(201).json(await payments.createCheckout({ ...data, locale }));
    }),
  );

  router.get(
    "/orders/:sessionId",
    // Each lookup of a pending order may call Stripe, so it is limited too (more generously).
    rateLimit({ limit: limit * 6 }),
    requirePayments,
    route(async (req, res) => res.json(await payments.getOrderStatus(req.params.sessionId))),
  );

  return router;
}
