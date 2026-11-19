import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { NewsletterSection } from "@/components/NewsletterForm";
import { OrderDialog } from "@/components/OrderDialog";
import { SplitHeading } from "@/components/SplitHeading";
import { useCatalog } from "@/hooks/useCatalog";
import { useDocumentHead } from "@/hooks/useDocumentHead";
import { useDynamicT } from "@/hooks/useDynamicT";
import { useReveal } from "@/hooks/useReveal";
import { img } from "@/lib/assets";
import { cssVars, cx } from "@/lib/cx";
import { formatMoney } from "@/lib/format";
import { SERVICES } from "@/lib/services";

const STEPS = ["choose", "pay", "call"] as const;
const FAQ = ["1", "2", "3"] as const;
const POINTS = ["a", "b", "c"] as const;

export function ServicesPage() {
  const { t, i18n } = useTranslation();
  const dt = useDynamicT();
  const catalog = useCatalog();
  const [ordering, setOrdering] = useState<string | null>(null);
  useDocumentHead(`${t("nav.services")} | ${t("meta.brand")}`, t("meta.services"));
  const [gridRef, gridClass] = useReveal<HTMLUListElement>();
  const [stepsRef, stepsClass] = useReveal<HTMLOListElement>();
  const [faqRef, faqClass] = useReveal<HTMLDivElement>();
  const [ctaRef, ctaClass] = useReveal<HTMLElement>();

  return (
    <>
      <div className="services-top">
        <Header page="services" />
        <main>
          <section className="services-hero">
            <Breadcrumb current={t("nav.services")} centered />
            <SplitHeading as="h1">{t("servicesPage.title")}</SplitHeading>
            <p>{t("servicesPage.lead")}</p>
          </section>

          <section className="services-list" aria-label={t("servicesPage.listLabel")}>
            <ul ref={gridRef} className={cx("service-grid", gridClass)}>
              {SERVICES.map(({ id, icon }, index) => {
                const name = dt(`services.${id}`);
                const deposit = catalog.state === "ready" ? catalog.deposits[id] : undefined;
                return (
                  <li key={id} className="service-card" id={id} style={cssVars({ "--d": index })}>
                    <img
                      className="service-card__icon"
                      loading="lazy"
                      decoding="async"
                      width={56}
                      height={56}
                      src={img(icon)}
                      alt=""
                    />
                    <h2 className="service-card__title">{name}</h2>
                    <p className="service-card__text">{dt(`servicesPage.items.${id}.text`)}</p>
                    <div className="service-card__included">
                      <h3>{t("servicesPage.included")}</h3>
                      <ul>
                        {POINTS.map((point) => (
                          <li key={point}>{dt(`servicesPage.items.${id}.${point}`)}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="service-card__footer">
                      {deposit !== undefined && catalog.state === "ready" && (
                        <p className="service-card__price">
                          <span>{t("servicesPage.deposit")}</span>
                          <strong>{formatMoney(deposit, i18n.language, catalog.currency)}</strong>
                        </p>
                      )}
                      <button
                        type="button"
                        className="service-card__order"
                        aria-label={t("services.order", { service: name })}
                        onClick={() => setOrdering(id)}
                      >
                        {t("servicesPage.order")}
                        <svg viewBox="0 0 16 14" aria-hidden="true">
                          <path
                            d="M1 7h13M9 2l5 5-5 5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </main>
      </div>

      <div className="services-bottom">
        <section className="services-steps" aria-labelledby="steps-title">
          <SplitHeading as="h2" id="steps-title">{t("servicesPage.stepsTitle")}</SplitHeading>
          <ol ref={stepsRef} className={cx("steps", stepsClass)}>
            {STEPS.map((step, index) => (
              <li key={step} style={cssVars({ "--d": index })}>
                <h3>{dt(`servicesPage.steps.${step}.title`)}</h3>
                <p>{dt(`servicesPage.steps.${step}.text`)}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="services-faq" aria-labelledby="faq-title">
          <SplitHeading as="h2" id="faq-title">{t("servicesPage.faqTitle")}</SplitHeading>
          <div ref={faqRef} className={cx("faq", faqClass)}>
            {FAQ.map((n) => (
              <details key={n}>
                <summary>{dt(`servicesPage.faq.q${n}`)}</summary>
                <p>{dt(`servicesPage.faq.a${n}`)}</p>
              </details>
            ))}
          </div>
        </section>

        <section ref={ctaRef} className={cx("services-cta", ctaClass)} aria-labelledby="cta-title">
          <h2 id="cta-title">{t("servicesPage.cta.title")}</h2>
          <p>{t("servicesPage.cta.text")}</p>
          <Link to="/contact" className="btn-pill">
            {t("servicesPage.cta.button")}
            <svg viewBox="0 0 16 14" aria-hidden="true">
              <path
                d="M1 7h13M9 2l5 5-5 5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </section>

        <NewsletterSection />
      </div>
      <Footer />
      <OrderDialog serviceId={ordering} onClose={() => setOrdering(null)} />
    </>
  );
}
