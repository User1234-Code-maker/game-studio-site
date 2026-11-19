// Test server for the browser tests: the real Express app serving the real
// production build, with a fake Stripe client (the network is never touched)
// and a throw-away storage folder.
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const port = Number(process.env.E2E_PORT || 4173);
process.env.NODE_ENV = "test";
process.env.PORT = String(port);
process.env.PUBLIC_URL = `http://localhost:${port}`;
process.env.RATE_LIMIT_PER_MINUTE = process.env.RATE_LIMIT_PER_MINUTE || "200";
process.env.STORAGE_DIR = await mkdtemp(path.join(tmpdir(), "site-e2e-"));

const { createApp } = await import("../server/app.js");
const { createPayments } = await import("../server/services/payments.js");

const WEBHOOK_SECRET = "whsec_e2e";
const sessions = new Map();
let counter = 0;

const fakeStripe = {
  checkout: {
    sessions: {
      async create(params) {
        const id = `cs_test_e2e${(counter += 1)}x`;
        sessions.set(id, { id, payment_status: "unpaid", amount_total: params.line_items[0].price_data.unit_amount });
        return { id, url: `https://checkout.stripe.com/c/pay/${id}` };
      },
      async retrieve(id) {
        return sessions.get(id);
      },
    },
  },
  webhooks: {
    constructEvent(body, signature, secret) {
      if (signature !== `valid:${secret}`) throw new Error("bad signature");
      return JSON.parse(body.toString());
    },
  },
};

const app = createApp({
  payments: createPayments({ stripe: fakeStripe, publicUrl: process.env.PUBLIC_URL, webhookSecret: WEBHOOK_SECRET }),
  logRequests: false,
});

// Test-only helper: pretend the visitor paid on Stripe's page (sends a signed webhook to ourselves).
app.post("/__e2e/pay/:id", async (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) return res.sendStatus(404);
  session.payment_status = "paid";
  const reply = await fetch(`${process.env.PUBLIC_URL}/api/stripe/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Stripe-Signature": `valid:${WEBHOOK_SECRET}` },
    body: JSON.stringify({
      type: "checkout.session.completed",
      data: { object: { id: session.id, payment_status: "paid", amount_total: session.amount_total, currency: "usd" } },
    }),
  });
  res.sendStatus(reply.status);
});

app.listen(port, () => console.log(`e2e server on ${process.env.PUBLIC_URL}`));
