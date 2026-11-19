import { Router } from "express";
import { listNews, getNews } from "../services/newsService.js";
import { listOffices, officeStats } from "../services/officesService.js";
import { append, appendUnique } from "../services/store.js";
import { validateContact, validateSubscribe } from "../validation.js";
import { HttpError } from "../lib/httpError.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { route } from "../lib/route.js";
import { paymentsRouter } from "./payments.js";
import { config } from "../config.js";

export function createApiRouter({ payments }) {
  const router = Router();
  const writeLimit = rateLimit({ limit: config.rateLimitPerMinute });

  router.get("/health", (_req, res) => res.json({ status: "ok", uptime: Math.round(process.uptime()) }));

  router.get(
    "/news",
    route(async (req, res) => {
      res.json(
        await listNews({
          q: String(req.query.q || "").slice(0, 80),
          page: Number.parseInt(req.query.page, 10) || 1,
          limit: Number.parseInt(req.query.limit, 10) || 20,
        }),
      );
    }),
  );

  router.get(
    "/news/:id",
    route(async (req, res) => {
      const article = await getNews(req.params.id);
      if (!article) throw new HttpError(404, "article_not_found", "Article not found");
      res.json(article);
    }),
  );

  router.get("/offices", route(async (_req, res) => res.json(await listOffices())));
  router.get("/stats", route(async (_req, res) => res.json(await officeStats())));

  router.post(
    "/contact",
    writeLimit,
    route(async (req, res) => {
      const { data, errors, ok } = validateContact(req.body);
      if (!ok) throw new HttpError(422, "validation_failed", "Please check the highlighted fields.", errors);
      await append("messages", data);
      res.status(201).json({ ok: true });
    }),
  );

  // The reply is the same for new and existing addresses, so the endpoint
  // cannot be used to find out who is subscribed.
  router.post(
    "/subscribe",
    writeLimit,
    route(async (req, res) => {
      const { data, errors, ok } = validateSubscribe(req.body);
      if (!ok) throw new HttpError(422, "validation_failed", "Please enter a valid email.", errors);
      const email = data.email.toLowerCase();
      await appendUnique("subscribers", { email }, (item) => item.email.toLowerCase());
      res.status(201).json({ ok: true });
    }),
  );

  router.use(paymentsRouter(payments, { limit: config.rateLimitPerMinute }));
  return router;
}
