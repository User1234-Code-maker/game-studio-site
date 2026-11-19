import { useState, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { img } from "@/lib/assets";
import { cx } from "@/lib/cx";
import { SERVICES } from "@/lib/services";
import { useDynamicT } from "@/hooks/useDynamicT";
import { useReveal } from "@/hooks/useReveal";
import { OrderDialog } from "./OrderDialog";

/** The six services. Each opens the order dialog (Stripe test checkout). */
export function ServiceCards() {
  const { t } = useTranslation();
  const dt = useDynamicT();
  const [revealRef, revealClass] = useReveal<HTMLDivElement>();
  const [ordering, setOrdering] = useState<string | null>(null);

  const onKeyDown = (event: KeyboardEvent, id: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOrdering(id);
    }
  };

  return (
    <>
      <div ref={revealRef} className={cx("info", revealClass)}>
        {SERVICES.map(({ id, icon }) => {
          const name = dt(`services.${id}`);
          return (
            <div
              key={id}
              className="block"
              role="button"
              tabIndex={0}
              aria-label={t("services.order", { service: name })}
              onClick={() => setOrdering(id)}
              onKeyDown={(event) => onKeyDown(event, id)}
            >
              <img loading="lazy" decoding="async" width={65} height={65} src={img(icon)} alt="" />
              <p>{name}</p>
              <img
                loading="lazy"
                decoding="async"
                width={21}
                height={18}
                src={img("icon-arrow.svg")}
                alt=""
              />
            </div>
          );
        })}
      </div>
      <OrderDialog serviceId={ordering} onClose={() => setOrdering(null)} />
    </>
  );
}
