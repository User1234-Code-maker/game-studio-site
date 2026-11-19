import Stripe from "stripe";
import { CURRENCY, findService } from "./catalog.js";
import { createFileStore } from "../store/fileStore.js";
import { HttpError } from "../lib/httpError.js";

const LOCALES = new Set(["en", "ru", "es"]);
const SESSION_ID = /^cs_(test|live)_[A-Za-z0-9]+$/;

export function createStripeClient(secretKey) {
  return new Stripe(secretKey, { maxNetworkRetries: 2, timeout: 15_000 });
}

/**
 * Payment use cases. The Stripe client is passed in, so tests use a fake one
 * and never call the network.
 */
export function createPayments({ stripe, publicUrl, webhookSecret, store = createFileStore() }) {
  const record = (event) => store.orders.record(event);

  async function createCheckout({ serviceId, email, locale }) {
    const service = findService(serviceId);
    if (!service) throw new HttpError(422, "invalid_service", "Unknown service", { serviceId: "invalid_service" });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      locale: LOCALES.has(locale) ? locale : "en",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: CURRENCY,
            unit_amount: service.depositCents,
            product_data: { name: `${service.name}: project deposit` },
          },
        },
      ],
      ...(email ? { customer_email: email } : {}),
      metadata: { serviceId: service.id },
      success_url: `${publicUrl}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${publicUrl}/order/cancel`,
    });

    await record({ type: "created", sessionId: session.id, serviceId: service.id, amount: service.depositCents });
    return { url: session.url, id: session.id };
  }

  // Stripe calls this endpoint; the signature proves the call really is from Stripe.
  async function handleWebhook(rawBody, signature) {
    if (!webhookSecret) throw new HttpError(503, "webhook_disabled", "Webhook is not configured");
    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch {
      throw new HttpError(400, "bad_signature", "Invalid signature");
    }

    const object = event.data.object;
    const isPaidEvent = event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded";
    if (!isPaidEvent && event.type !== "checkout.session.expired") return { received: true };

    // Only sessions this site created count (the Stripe account may serve other products).
    const created = (await store.orders.bySession(object.id)).find((item) => item.type === "created");
    if (!created) return { received: true, ignored: true };

    if (isPaidEvent) {
      if (object.payment_status !== "paid") return { received: true };
      // The amount must match our own price list, never trust metadata alone.
      if (object.amount_total !== created.amount || object.currency !== CURRENCY) {
        console.error(`Payment amount mismatch for ${object.id}: got ${object.amount_total} ${object.currency}, expected ${created.amount}`);
        await record({ type: "mismatch", sessionId: object.id, amount: object.amount_total });
        return { received: true, ignored: true };
      }
      await record({
        type: "paid",
        sessionId: object.id,
        serviceId: created.serviceId,
        amount: object.amount_total,
        email: object.customer_details?.email ?? null,
      });
    } else {
      await record({ type: "expired", sessionId: object.id });
    }
    return { received: true };
  }

  async function getOrderStatus(sessionId) {
    if (!SESSION_ID.test(sessionId)) throw new HttpError(400, "invalid_session", "Invalid session id");

    const events = await store.orders.bySession(sessionId);
    if (events.length === 0) throw new HttpError(404, "order_not_found", "Order not found");

    let paid = events.find((item) => item.type === "paid");
    // The webhook can arrive a moment after the redirect, so ask Stripe directly.
    if (!paid && !events.some((item) => item.type === "expired")) {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      const created = events.find((item) => item.type === "created");
      if (session.payment_status === "paid" && session.amount_total === created?.amount) {
        paid = (
          await record({
            type: "paid",
            sessionId,
            serviceId: created.serviceId,
            amount: session.amount_total,
            email: session.customer_details?.email ?? null,
          })
        ).entry;
      }
    }

    const created = events.find((item) => item.type === "created");
    const status = paid ? "paid" : events.some((item) => item.type === "expired") ? "expired" : "pending";
    const service = findService(created?.serviceId);
    return { status, serviceId: service?.id ?? null, service: service?.name ?? null, amount: created?.amount ?? null, currency: CURRENCY };
  }

  return { createCheckout, handleWebhook, getOrderStatus };
}
