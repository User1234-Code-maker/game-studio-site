import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(here, "..");

const int = (value, fallback) => {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

/**
 * All settings come from environment variables, read once at start-up.
 * Anything that would make the server unsafe or unusable is rejected here,
 * so a wrong value fails loudly instead of misbehaving later.
 */
export function loadConfig(env = process.env) {
  const publicUrl = (env.PUBLIC_URL || `http://localhost:${int(env.PORT, 3000)}`).replace(/\/+$/, "");
  const secretKey = env.STRIPE_SECRET_KEY || "";

  // Only test-mode keys are accepted unless live payments are explicitly allowed.
  if (secretKey && !secretKey.startsWith("sk_test_") && env.STRIPE_ALLOW_LIVE !== "true") {
    throw new Error("STRIPE_SECRET_KEY must be a test key (sk_test_...). Set STRIPE_ALLOW_LIVE=true to use live keys.");
  }

  const isProduction = env.NODE_ENV === "production";
  if (isProduction && secretKey && !publicUrl.startsWith("https://")) {
    throw new Error("PUBLIC_URL must start with https:// in production when Stripe is enabled.");
  }

  return {
    env: env.NODE_ENV || "development",
    isProduction,
    port: int(env.PORT, 3000),
    rootDir,
    dataDir: path.join(rootDir, "data"),
    clientDir: path.resolve(env.CLIENT_DIR || path.join(rootDir, "client", "dist")),
    storageDir: path.resolve(env.STORAGE_DIR || path.join(rootDir, "storage")),
    // Number of reverse proxies in front of the app (Render, Railway, Nginx: 1).
    // Keep 0 locally, otherwise clients could fake their IP address.
    trustProxy: int(env.TRUST_PROXY, 0),
    rateLimitPerMinute: int(env.RATE_LIMIT_PER_MINUTE, 10),
    publicUrl,
    stripe: {
      secretKey,
      webhookSecret: env.STRIPE_WEBHOOK_SECRET || "",
    },
  };
}

export const config = loadConfig();
