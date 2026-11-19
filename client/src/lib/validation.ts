// The same rules as the server (server/validation.js). The server never trusts
// the browser, but checking here gives instant feedback.
// Errors are stable codes; the interface translates them.
export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type ContactField = "firstName" | "lastName" | "email" | "message";
export type ContactValues = Record<ContactField, string>;
export type ContactErrors = Partial<Record<ContactField, string>>;

export const isEmail = (value: string): boolean => value.length <= 120 && EMAIL.test(value.trim());

export function validateField(field: ContactField, raw: string): string | null {
  const value = raw.trim();
  switch (field) {
    case "firstName":
    case "lastName":
      if (!value) return "required";
      return value.length > 60 ? "too_long" : null;
    case "email":
      return isEmail(value) ? null : "invalid_email";
    case "message":
      if (value.length < 10) return "too_short";
      return value.length > 2000 ? "too_long" : null;
  }
}

export function validateContact(values: ContactValues): ContactErrors {
  const errors: ContactErrors = {};
  (Object.keys(values) as ContactField[]).forEach((field) => {
    const code = validateField(field, values[field]);
    if (code) errors[field] = code;
  });
  return errors;
}
