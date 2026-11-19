/**
 * The only place the visitor may be sent after "Pay": Stripe's hosted page.
 * The server already returns a Stripe URL; checking it here as well means a
 * compromised or misconfigured API can never turn the button into an open redirect.
 */
export function isStripeCheckoutUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "checkout.stripe.com";
  } catch {
    return false;
  }
}
