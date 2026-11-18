import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { config } from "./config.js";

// Content-Security-Policy. Inline scripts are allowed only if they are exactly
// the ones written in our own HTML files (their hashes are computed at start-up),
// so an injected <script> would be blocked.
function inlineScriptHashes() {
  const hashes = new Set();
  for (const name of config.publicFiles.filter((file) => file.endsWith(".html"))) {
    const html = readFileSync(path.join(config.rootDir, name), "utf8");
    for (const match of html.matchAll(/<script(?![^>]*\b(?:src|type)=)[^>]*>([\s\S]*?)<\/script>/g)) {
      hashes.add(`'sha256-${createHash("sha256").update(match[1]).digest("base64")}'`);
    }
  }
  return [...hashes];
}

export function contentSecurityPolicy() {
  return [
    "default-src 'self'",
    `script-src 'self' ${inlineScriptHashes().join(" ")}`,
    // Inline style="" attributes position pins and stickers.
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src https://fonts.gstatic.com",
    "img-src 'self' data:",
    "connect-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
  ].join("; ");
}
