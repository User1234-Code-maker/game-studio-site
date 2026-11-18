import { Router } from "express";
import { listNews, getNews } from "../services/newsService.js";
import { listOffices, officeStats } from "../services/officesService.js";
import { append, readAll } from "../services/store.js";
import { validateContact, validateSubscribe } from "../validation.js";
import { HttpError } from "../middleware/errorHandler.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { config } from "../config.js";

const router = Router();
const writeLimit = rateLimit({ limit: config.rateLimitPerMinute });

// Wraps async handlers so rejected promises reach the error middleware.
const route = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

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
    if (!article) throw new HttpError(404, "Article not found");
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
    if (!ok) throw new HttpError(422, "Please check the highlighted fields.", errors);
    await append("messages", data);
    res.status(201).json({ ok: true, message: "Thanks! We will get back to you soon." });
  }),
);

router.post(
  "/subscribe",
  writeLimit,
  route(async (req, res) => {
    const { data, errors, ok } = validateSubscribe(req.body);
    if (!ok) throw new HttpError(422, errors.email, errors);

    const existing = await readAll("subscribers");
    if (existing.some((s) => s.email.toLowerCase() === data.email.toLowerCase())) {
      return res.json({ ok: true, message: "You are already subscribed." });
    }
    await append("subscribers", data);
    res.status(201).json({ ok: true, message: "Thanks! You are subscribed." });
  }),
);

export default router;
