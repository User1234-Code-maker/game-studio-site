// Validation rules shared by the routes. They mirror the browser-side rules in
// js/contact.js, but the server never trusts the browser.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const clean = (value) => (typeof value === "string" ? value.trim() : "");

export function validateContact(body = {}) {
  const data = {
    firstName: clean(body.firstName),
    lastName: clean(body.lastName),
    email: clean(body.email),
    message: clean(body.message),
  };
  const errors = {};

  if (!data.firstName || data.firstName.length > 60) errors.firstName = "Please enter your first name.";
  if (!data.lastName || data.lastName.length > 60) errors.lastName = "Please enter your last name.";
  if (!EMAIL.test(data.email) || data.email.length > 120) errors.email = "Enter a valid email address.";
  if (data.message.length < 10 || data.message.length > 2000)
    errors.message = "Message should be between 10 and 2000 characters.";

  return { data, errors, ok: Object.keys(errors).length === 0 };
}

export function validateSubscribe(body = {}) {
  const email = clean(body.email);
  const ok = EMAIL.test(email) && email.length <= 120;
  return { data: { email }, errors: ok ? {} : { email: "Enter a valid email address." }, ok };
}
