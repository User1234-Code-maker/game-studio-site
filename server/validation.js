// Validation rules for incoming data. The browser validates too, but the
// server never trusts the browser. Errors are stable codes the UI translates.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const clean = (value) => (typeof value === "string" ? value.trim() : "");

const isEmail = (value) => value.length <= 120 && EMAIL.test(value);

export function validateContact(body = {}) {
  const data = {
    firstName: clean(body.firstName),
    lastName: clean(body.lastName),
    email: clean(body.email),
    message: clean(body.message),
  };
  const errors = {};

  if (!data.firstName) errors.firstName = "required";
  else if (data.firstName.length > 60) errors.firstName = "too_long";

  if (!data.lastName) errors.lastName = "required";
  else if (data.lastName.length > 60) errors.lastName = "too_long";

  if (!isEmail(data.email)) errors.email = "invalid_email";

  if (data.message.length < 10) errors.message = "too_short";
  else if (data.message.length > 2000) errors.message = "too_long";

  return { data, errors, ok: Object.keys(errors).length === 0 };
}

export function validateSubscribe(body = {}) {
  const email = clean(body.email);
  const ok = isEmail(email);
  return { data: { email }, errors: ok ? {} : { email: "invalid_email" }, ok };
}

// Optional e-mail for the checkout receipt: empty is fine, wrong is not.
export function validateCheckout(body = {}) {
  const serviceId = clean(body.serviceId);
  const email = clean(body.email);
  const errors = {};
  if (!/^[a-z0-9-]{1,40}$/.test(serviceId)) errors.serviceId = "invalid_service";
  if (email && !isEmail(email)) errors.email = "invalid_email";
  return { data: { serviceId, email }, errors, ok: Object.keys(errors).length === 0 };
}
