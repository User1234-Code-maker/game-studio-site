import { useId, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api";
import { isEmail } from "@/lib/validation";
import { useReveal } from "@/hooks/useReveal";
import { useErrorText } from "@/hooks/useErrorText";
import { cx } from "@/lib/cx";

type Status = { kind: "idle" } | { kind: "error" | "success"; text: string };

/** "Join the community" block with the subscribe form. */
export function NewsletterSection() {
  const { t } = useTranslation();
  const errorText = useErrorText();
  const [revealRef, revealClass] = useReveal<HTMLDivElement>();
  const inputId = useId();
  const messageId = useId();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isEmail(email)) {
      setStatus({ kind: "error", text: t("newsletter.invalid") });
      return;
    }

    setBusy(true);
    const reply = await api.post("/subscribe", { email: email.trim() });
    setBusy(false);

    if (reply.kind === "error") {
      const text =
        reply.code === "validation_failed" ? t("newsletter.invalid") : errorText(reply.code);
      setStatus({ kind: "error", text });
      return;
    }
    // Offline (static hosting): nothing can store the address, so say so honestly.
    setStatus({
      kind: "success",
      text: t(reply.kind === "offline" ? "newsletter.demo" : "newsletter.done"),
    });
    setEmail("");
  }

  return (
    <section className="container email" aria-label={t("newsletter.section")}>
      <h3>{t("newsletter.title")}</h3>
      <p>{t("newsletter.lead")}</p>
      <div ref={revealRef} className={cx("block", revealClass)}>
        <div>
          <h4>{t("newsletter.heading")}</h4>
          <p>{t("newsletter.text")}</p>
        </div>
        <form className="email-form" noValidate onSubmit={onSubmit}>
          <div className="email-field">
            <input
              type="email"
              id={inputId}
              aria-label={t("newsletter.label")}
              placeholder={t("newsletter.placeholder")}
              aria-describedby={messageId}
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <button type="submit" disabled={busy}>
              {t("newsletter.button")}
            </button>
          </div>
          <p
            id={messageId}
            className={cx("form-message", status.kind !== "idle" && status.kind)}
            role="status"
          >
            {status.kind === "idle" ? "" : status.text}
          </p>
        </form>
      </div>
    </section>
  );
}
