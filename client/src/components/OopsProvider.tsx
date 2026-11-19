import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "./Modal";
import { img } from "@/lib/assets";
import { cssVars } from "@/lib/cx";
import { OopsContext, type OopsTarget } from "@/hooks/useOops";

/** Dialog for links that do not lead anywhere yet (this is a portfolio project). */
export function OopsProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [target, setTarget] = useState<OopsTarget | null>(null);
  // Keep the last target while the closing animation plays.
  const [shown, setShown] = useState<OopsTarget | null>(null);

  const open = useCallback((next: OopsTarget) => {
    setTarget(next);
    setShown(next);
  }, []);
  const close = useCallback(() => setTarget(null), []);
  const value = useMemo(() => ({ open }), [open]);

  const text = shown
    ? shown.kind === "section"
      ? t("oops.plugged", { name: shown.name })
      : t("oops.pluggedPage", { name: shown.name })
    : "";

  return (
    <OopsContext.Provider value={value}>
      {children}
      <Modal
        open={target !== null}
        onClose={close}
        labelledBy="oopsTitle"
        describedBy="oopsText"
        initialFocus=".oops__ok"
      >
        <div className="oops__card">
          <button
            type="button"
            className="oops__close"
            aria-label={t("common.close")}
            onClick={close}
          >
            &times;
          </button>
          <img
            className="oops__art"
            src={img("oops-controller.svg")}
            alt=""
            width={240}
            height={180}
          />
          <h2 className="oops__title" id="oopsTitle" aria-label={t("oops.title")}>
            {Array.from(t("oops.title")).map((letter, index) => (
              <span key={index} className="ch" aria-hidden="true" style={cssVars({ "--i": index })}>
                {letter}
              </span>
            ))}
          </h2>
          <p className="oops__text" id="oopsText">
            {text}
          </p>
          <p className="oops__hint">{t("oops.hint")}</p>
          <button type="button" className="oops__ok" onClick={close}>
            {t("oops.ok")}
          </button>
        </div>
      </Modal>
    </OopsContext.Provider>
  );
}
