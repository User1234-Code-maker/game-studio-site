// Tiny fixed-window rate limiter (per IP, in memory).
// Enough for a single instance; swap for a shared store (Redis) when scaling out.
export function rateLimit({ limit, windowMs = 60_000, maxKeys = 10_000 }) {
  const hits = new Map();

  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) if (entry.reset <= now) hits.delete(key);
  }, windowMs);
  timer.unref();

  return (req, res, next) => {
    const now = Date.now();
    const entry = hits.get(req.ip);

    if (!entry || entry.reset <= now) {
      // Bound memory: when many different addresses show up at once, drop the oldest.
      if (hits.size >= maxKeys) hits.delete(hits.keys().next().value);
      hits.set(req.ip, { count: 1, reset: now + windowMs });
      return next();
    }

    entry.count += 1;
    if (entry.count > limit) {
      res.set("Retry-After", String(Math.ceil((entry.reset - now) / 1000)));
      return res.status(429).json({
        error: "Too many requests. Please try again in a minute.",
        code: "rate_limited",
      });
    }
    next();
  };
}
