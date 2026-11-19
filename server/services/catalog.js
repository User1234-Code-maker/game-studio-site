// The price list lives on the server. The browser only sends a service id,
// never an amount, so nobody can change the price in DevTools.
// Amounts are in cents (USD).
export const SERVICES = Object.freeze([
  { id: "mobile", name: "Mobile Game Development", depositCents: 150_000 },
  { id: "pc", name: "PC Game Development", depositCents: 200_000 },
  { id: "ps4", name: "PS4 Game Development", depositCents: 250_000 },
  { id: "ar-vr", name: "AR/VR Solutions", depositCents: 300_000 },
  { id: "ar-vr-design", name: "AR/VR Design", depositCents: 120_000 },
  { id: "3d", name: "3D Modelings", depositCents: 80_000 },
]);

export const CURRENCY = "usd";

export const findService = (id) => SERVICES.find((service) => service.id === id) ?? null;
