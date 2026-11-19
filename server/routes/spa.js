// Pages the React app knows. Keep in sync with client/src/App.tsx
// (test/spa.test.js fails if they drift apart).
export const KNOWN_ROUTES = ["/", "/about", "/news", "/contact", "/order/success", "/order/cancel"];

export function isKnownRoute(pathname) {
  const clean = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return KNOWN_ROUTES.includes(clean);
}
