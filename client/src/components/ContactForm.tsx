import { useId, useState, type ChangeEvent, type FocusEvent, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api";
import { cx } from "@/lib/cx";
import {
  validateContact,
  validateField,
  type ContactErrors,
  type ContactField,
  type ContactValues,
} from "@/lib/validation";
import { useErrorText } from "@/hooks/useErrorText";

const EMPTY: ContactValues = { firstName: "", lastName: "", email: "", message: "" };
const ORDER: ContactField[] = ["firstName", "lastName", "email", "message"];

type Status = { kind: "idle" } | { kind: "success" | "error"; text: string };

export function ContactForm() {
  const { t } = useTranslation();
  const errorText = useErrorText();
  const prefix = useId();
  const [values, setValues] = useState<ContactValues>(EMPTY);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [shaking, setShaking] = useState<ContactField[]>([]);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [busy, setBusy] = useState(false);

  const idOf = (field: ContactField) => `${prefix}-${field}`;

  function setError(field: ContactField, code: string | null) {
    setErrors((current) => {
      const next = { ...current };
      if (code) next[field] = code;
      else delete next[field];
      return next;
    });
  }

  function onBlur(event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const field = event.target.name as ContactField;
    setError(field, validateField(field, event.target.value));
  }

  function onChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const field = event.target.name as ContactField;
    setValues((current) => ({ ...current, [field]: event.target.value }));
    // Once a field showed an error, re-check while typing so the error clears as soon as it is fixed.
    if (errors[field]) setError(field, validateField(field, event.target.value));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus({ kind: "idle" });

    const found = validateContact(values);
    setErrors(found);
    const invalid = ORDER.filter((field) => found[field]);
    if (invalid.length > 0) {
      setShaking(invalid);
      document.getElementById(idOf(invalid[0] as ContactField))?.focus();
      return;
    }

    setBusy(true);
    const reply = await api.post("/contact", {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim(),
      message: values.message.trim(),
    });
    setBusy(false);

    switch (reply.kind) {
      case "offline": // static hosting: nothing can store the message, so say so honestly
        setStatus({ kind: "success", text: t("contact.form.demo") });
        setValues(EMPTY);
        return;
      case "ok":
        setStatus({ kind: "success", text: t("contact.form.sent") });
        setValues(EMPTY);
        return;
      case "error":
        if (reply.status === 422 && reply.details) {
          setErrors(reply.details);
          setShaking(ORDER.filter((field) => reply.details?.[field]));
          return;
        }
        setStatus({ kind: "error", text: errorText(reply.code) });
    }
  }

  const field = (name: ContactField, label: string, input: "input" | "textarea", extra: object) => {
    const code = errors[name];
    const common = {
      id: idOf(name),
      name,
      value: values[name],
      required: true,
      "aria-invalid": Boolean(code),
      className: cx(code && "is-invalid"),
      onBlur,
      onChange,
      ...extra,
    };
    return (
      <div
        className={cx("field", shaking.includes(name) && "is-error")}
        onAnimationEnd={() => setShaking((current) => current.filter((item) => item !== name))}
      >
        <label htmlFor={idOf(name)}>{label}</label>
        {input === "textarea" ? <textarea {...common} /> : <input {...common} />}
        <span className="field__error" aria-live="polite">
          {code ? errorText(code, name) : ""}
        </span>
      </div>
    );
  };

  return (
    <form className="contact-form" noValidate onSubmit={onSubmit}>
      <div className="contact-form__row">
        {field("firstName", t("contact.form.firstName"), "input", {
          type: "text",
          autoComplete: "given-name",
        })}
        {field("lastName", t("contact.form.lastName"), "input", {
          type: "text",
          autoComplete: "family-name",
        })}
      </div>
      {field("email", t("contact.form.email"), "input", { type: "email", autoComplete: "email" })}
      {field("message", t("contact.form.message"), "textarea", { rows: 8 })}
      <div className="contact-form__actions">
        <p
          className={cx("contact-form__status", status.kind === "success" && "success")}
          role="status"
        >
          {status.kind === "idle" ? "" : status.text}
        </p>
        <button type="submit" className="btn-submit" disabled={busy}>
          {t("common.getInTouch")}
        </button>
      </div>
    </form>
  );
}
