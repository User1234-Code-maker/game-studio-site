import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "./Modal";
import { api, type CheckoutResponse, type ServicesResponse } from "@/lib/api";
import { isStripeCheckoutUrl } from "@/lib/checkout";
import { formatMoney } from "@/lib/format";
import { isEmail } from "@/lib/validation";
import { useErrorText } from "@/hooks/useErrorText";
import { useDynamicT } from "@/hooks/useDynamicT";

interface Props {
  /** Service id ("pc", "3d"...) or null when the dialog is closed. */
  serviceId: string | null;
  onClose: () => void;
}

type Catalog =
  | { state: "loading" }
  | { state: "offline" }
  | { state: "disabled" }
  | { state: "ready"; currency: string; deposits: Record<string, number> };

/** Loads the price list from the server once, the first time the dialog opens. */
function useCatalog(needed: boolean): Catalog {
  const [catalog, setCatalog] = useState<Catalog>({ state: "loading" });
  const requested = useRef(false);

  useEffect(() => {
    if (!needed || requested.current) return;
    requested.current = true;
    api
      .get<ServicesResponse>("/services")
      .then((reply) => {
        if (reply.kind !== "ok") return setCatalog({ state: "offline" });
        if (!reply.data.enabled) return setCatalog({ state: "disabled" });
        setCatalog({
          state: "ready",
          currency: reply.data.currency,
          deposits: Object.fromEntries(
            reply.data.items.map((item) => [item.id, item.depositCents]),
          ),
        });
      })
      .catch(() => setCatalog({ state: "offline" }));
  }, [needed]);

  return catalog;
}

/** Order a service: shows the deposit and sends the visitor to Stripe Checkout (test mode). */
export function OrderDialog({ serviceId, onClose }: Props) {
  const { t, i18n } = useTranslation();
  const dt = useDynamicT();
  const errorText = useErrorText();
  const titleId = useId();
  const emailId = useId();
  const catalog = useCatalog(serviceId !== null);
  const [email, setEmail] = useState("");
  const [emailInvalid, setEmailInvalid] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");
  // Keep the last service while the closing animation plays; start fresh when a new one opens.
  const [shown, setShown] = useState(serviceId);
  if (serviceId !== null && serviceId !== shown) {
    setShown(serviceId);
    setProblem("");
    setBusy(false);
    setEmailInvalid(false);
  }

  const name = shown ? dt(`services.${shown}`) : "";
  const deposit = catalog.state === "ready" && shown ? catalog.deposits[shown] : undefined;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!shown || catalog.state !== "ready") return;
    if (email.trim() && !isEmail(email)) {
      setEmailInvalid(true);
      return;
    }
    setEmailInvalid(false);
    setProblem("");
    setBusy(true);

    const reply = await api.post<CheckoutResponse>("/checkout", {
      serviceId: shown,
      email: email.trim(),
      locale: i18n.language,
    });

    if (reply.kind === "ok" && isStripeCheckoutUrl(reply.data.url)) {
      window.location.assign(reply.data.url); // Stripe's hosted page; the button stays disabled meanwhile
      return;
    }
    setBusy(false);
    setProblem(reply.kind === "error" ? errorText(reply.code) : t("order.failed"));
  }

  return (
    <Modal open={serviceId !== null} onClose={onClose} labelledBy={titleId} initialFocus="input">
      <div className="oops__card order">
        <button
          type="button"
          className="oops__close"
          aria-label={t("common.close")}
          onClick={onClose}
        >
          &times;
        </button>
        <h2 className="oops__title" id={titleId}>
          {t("order.title", { service: name })}
        </h2>
        <p className="order__lead">{t("order.lead")}</p>

        {catalog.state === "offline" && (
          <p className="order__message order__message--info">{t("order.offline")}</p>
        )}
        {catalog.state === "disabled" && (
          <p className="order__message">{errorText("payments_disabled")}</p>
        )}

        {catalog.state === "ready" && deposit !== undefined && (
          <form onSubmit={onSubmit} noValidate>
            <div className="order__price">
              <span>{t("order.deposit")}</span>
              <strong>{formatMoney(deposit, i18n.language, catalog.currency)}</strong>
            </div>
            <label className="order__label" htmlFor={emailId}>
              {t("order.email")}
            </label>
            <input
              id={emailId}
              className="order__input"
              type="email"
              autoComplete="email"
              value={email}
              aria-invalid={emailInvalid}
              onChange={(event) => setEmail(event.target.value)}
            />
            <p className="order__message" role="alert">
              {emailInvalid ? errorText("invalid_email", "email") : problem}
            </p>
            <p className="order__test">{t("order.testHint")}</p>
            <div className="order__actions">
              <button type="submit" className="oops__ok" disabled={busy}>
                {busy
                  ? t("order.paying")
                  : t("order.pay", {
                      amount: formatMoney(deposit, i18n.language, catalog.currency),
                    })}
              </button>
              <button type="button" className="order__cancel" onClick={onClose}>
                {t("order.cancel")}
              </button>
            </div>
          </form>
        )}

        {catalog.state !== "ready" && catalog.state !== "loading" && (
          <div className="order__actions">
            <button type="button" className="order__cancel" onClick={onClose}>
              {t("order.cancel")}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
