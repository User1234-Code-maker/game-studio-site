import { describe, expect, it } from "vitest";
import { isStripeCheckoutUrl } from "./checkout";

describe("isStripeCheckoutUrl", () => {
  it("accepts Stripe's hosted checkout", () => {
    expect(isStripeCheckoutUrl("https://checkout.stripe.com/c/pay/cs_test_abc#frag")).toBe(true);
  });

  it.each([
    "http://checkout.stripe.com/c/pay/x",
    "https://checkout.stripe.com.evil.com/x",
    "https://evil.com/?https://checkout.stripe.com",
    "https://user@evil.com@checkout.stripe.com.evil.io/",
    "javascript:alert(1)",
    "//checkout.stripe.com/x",
    "",
    "not a url",
  ])("rejects %s", (value) => {
    expect(isStripeCheckoutUrl(value)).toBe(false);
  });

  it("rejects non-strings", () => {
    expect(isStripeCheckoutUrl(undefined)).toBe(false);
    expect(isStripeCheckoutUrl({ href: "https://checkout.stripe.com" })).toBe(false);
  });
});
