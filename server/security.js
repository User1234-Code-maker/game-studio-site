import helmet from "helmet";

// Security headers. The React build ships only external scripts, so
// script-src needs no hashes and no 'unsafe-inline'. Inline style="" attributes
// (pin positions, letter animations) need style-src 'unsafe-inline'; that is
// the one deliberate trade-off. Stripe Checkout is a full-page redirect, so no
// Stripe domains are needed here.
export function securityHeaders() {
  return helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'"],
        "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        "font-src": ["'self'", "https://fonts.gstatic.com"],
        "img-src": ["'self'", "data:"],
        "connect-src": ["'self'"],
        "base-uri": ["'self'"],
        "form-action": ["'self'", "https://checkout.stripe.com"],
        "frame-ancestors": ["'none'"],
        "object-src": ["'none'"],
        ...(process.env.NODE_ENV === "production" ? { "upgrade-insecure-requests": [] } : {}),
      },
    },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    frameguard: { action: "deny" },
    crossOriginOpenerPolicy: { policy: "same-origin" },
    // Fonts and images come from other origins, so do not require CORP.
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false,
  });
}

export const permissionsPolicy = (_req, res, next) => {
  res.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(self)");
  next();
};
