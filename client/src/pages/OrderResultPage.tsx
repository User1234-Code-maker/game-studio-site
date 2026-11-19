import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api, type OrderStatusResponse } from "@/lib/api";
import { img } from "@/lib/assets";
import { useDocumentHead } from "@/hooks/useDocumentHead";
import { useDynamicT } from "@/hooks/useDynamicT";

type View =
  { state: "checking" } | { state: "error" } | { state: "done"; order: OrderStatusResponse };

/** Where Stripe sends the visitor back: /order/success?session_id=... or /order/cancel. */
export function OrderResultPage({ outcome }: { outcome: "success" | "cancel" }) {
  const { t } = useTranslation();
  const dt = useDynamicT();
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [answer, setAnswer] = useState<View | null>(null);

  useDocumentHead(`${t("nav.home")} | ${t("meta.brand")}`);

  useEffect(() => {
    if (outcome !== "success" || !sessionId) return;
    const controller = new AbortController();
    api
      .get<OrderStatusResponse>(`/orders/${encodeURIComponent(sessionId)}`, controller.signal)
      .then((reply) =>
        setAnswer(reply.kind === "ok" ? { state: "done", order: reply.data } : { state: "error" }),
      )
      .catch(() => undefined);
    return () => controller.abort();
  }, [outcome, sessionId]);

  // No session id in the address means there is nothing to look up.
  const view: View = !sessionId ? { state: "error" } : (answer ?? { state: "checking" });

  let title: string;
  let text: string;
  if (outcome === "cancel") {
    title = t("orderResult.cancelTitle");
    text = t("orderResult.cancelText");
  } else if (view.state === "checking") {
    title = t("orderResult.checking");
    text = "";
  } else if (view.state === "error") {
    title = t("orderResult.errorTitle");
    text = t("orderResult.errorText");
  } else if (view.order.status === "paid") {
    title = t("orderResult.paidTitle");
    text = t("orderResult.paidText", {
      service: view.order.serviceId
        ? dt(`services.${view.order.serviceId}`)
        : (view.order.service ?? ""),
    });
  } else if (view.order.status === "expired") {
    title = t("orderResult.expiredTitle");
    text = t("orderResult.expiredText");
  } else {
    title = t("orderResult.pendingTitle");
    text = t("orderResult.pendingText");
  }

  return (
    <div className="wrapper">
      <main className="notfound">
        <div>
          <img
            className="notfound__art"
            src={img("oops-controller.svg")}
            alt=""
            width={240}
            height={180}
          />
          <h1 aria-live="polite">{title}</h1>
          {text && <p>{text}</p>}
          <div className="notfound__actions">
            <Link to="/">{t("notFound.home")}</Link>
            <Link to="/#projects">{t("orderResult.toServices")}</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
