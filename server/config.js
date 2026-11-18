import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

export const config = {
  port: Number(process.env.PORT) || 3000,
  // Project root: the static site (html, css, js, img, data) lives here.
  rootDir: path.resolve(here, ".."),
  dataDir: path.resolve(here, "..", "data"),
  storageDir: path.resolve(process.env.STORAGE_DIR || path.join(here, "..", "storage")),
  rateLimitPerMinute: Number(process.env.RATE_LIMIT_PER_MINUTE) || 10,
  // Only these paths are served as static files, so server code, .git and
  // storage are never exposed.
  publicFiles: ["index.html", "about.html", "contact.html", "news.html", "favicon.svg"],
  publicDirs: ["css", "js", "img", "data"],
};
