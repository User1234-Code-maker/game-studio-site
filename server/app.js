import express from "express";
import path from "node:path";
import api from "./routes/api.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { config } from "./config.js";

// createApp() builds the app without listening, so tests can call it directly.
export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use((_req, res, next) => {
    res.set({
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    });
    next();
  });

  app.use("/api", express.json({ limit: "10kb" }), api, notFound);

  // Static front end: whitelisted files and folders only.
  config.publicDirs.forEach((dir) =>
    app.use(
      `/${dir}`,
      express.static(path.join(config.rootDir, dir), { maxAge: dir === "data" ? 0 : "7d", etag: true }),
    ),
  );
  config.publicFiles.forEach((name) =>
    app.get(name === "index.html" ? ["/", "/index.html"] : `/${name}`, (_req, res) =>
      res.sendFile(path.join(config.rootDir, name)),
    ),
  );

  app.use((_req, res) => res.status(404).type("text").send("Page not found"));
  app.use(errorHandler);
  return app;
}
