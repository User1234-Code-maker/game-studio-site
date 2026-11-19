import { useTranslation } from "react-i18next";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ContactForm } from "@/components/ContactForm";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { NewsletterSection } from "@/components/NewsletterForm";
import { OfficeMap } from "@/components/OfficeMap";
import { SocialLinks } from "@/components/SocialLinks";
import { SplitHeading } from "@/components/SplitHeading";
import { Stickers, type StickerSpec } from "@/components/Stickers";
import { useDocumentHead } from "@/hooks/useDocumentHead";
import { useDynamicT } from "@/hooks/useDynamicT";
import { useReveal } from "@/hooks/useReveal";
import { img } from "@/lib/assets";
import { HQ_ID, offices } from "@/lib/data";
import { cx } from "@/lib/cx";

const HERO_STICKERS: StickerSpec[] = [
  { name: "sparkle", side: "l", top: 110, size: 0.75, rotation: -10 },
  { name: "coin", side: "r", top: 150, size: 0.85, rotation: 12 },
];
const HELLO_STICKERS: StickerSpec[] = [
  { name: "heart", side: "l", top: 140, size: 0.85, rotation: -9 },
  { name: "controller", side: "r", top: 420, size: 0.9, rotation: 10 },
];

export function ContactPage() {
  const { t } = useTranslation();
  const dt = useDynamicT();
  useDocumentHead(`${t("nav.contact")} | ${t("meta.brand")}`, t("meta.contact"));
  const [infoRef, infoClass] = useReveal<HTMLElement>();
  const [helloRef, helloClass] = useReveal<HTMLDivElement>();
  const hq = offices.find((office) => office.id === HQ_ID);

  return (
    <>
      <div className="contact-top">
        <Header page="contact" />
        <main>
          <section className="contact-hero has-stickers">
            <Breadcrumb current={t("nav.contact")} centered />
            <SplitHeading as="h1">{t("contact.title")}</SplitHeading>
            <p>{t("contact.lead")}</p>
            <span className="contact-hero__dot" aria-hidden="true" />
            <OfficeMap />
            <Stickers items={HERO_STICKERS} />
          </section>

          <section ref={infoRef} className={cx("contact-info", infoClass)}>
            <div className="contact-info__follow">
              <p>{t("contact.follow")}</p>
              <div className="follow">
                <SocialLinks />
              </div>
            </div>
            {hq && (
              <>
                <div className="contact-info__item contact-info__phone">
                  <svg viewBox="0 0 32 32" aria-hidden="true" className="contact-info__icon">
                    <path
                      fill="#fff"
                      d="M8.2 3.5 4.6 5c-1 .8-1.5 2-1.3 3.2C5 18 14 27.5 24 29.2c1.2.2 2.4-.3 3.2-1.3l1.4-3.6c.3-.8 0-1.7-.7-2.2l-4.6-3.1c-.7-.5-1.6-.4-2.2.2l-1.9 1.9c-3.2-1.6-5.7-4.1-7.3-7.3l1.9-1.9c.6-.6.7-1.5.2-2.2L10.4 4.2c-.5-.7-1.4-1-2.2-.7z"
                    />
                    <path
                      fill="none"
                      stroke="#fff"
                      strokeWidth="2"
                      strokeLinecap="round"
                      d="M19 6.5a9 9 0 0 1 7.5 7.5M18.5 11.5a4.5 4.5 0 0 1 3 3"
                    />
                  </svg>
                  <a href={`tel:${hq.phone.replace(/[^+\d]/g, "")}`}>{hq.phone}</a>
                </div>
                <div className="contact-info__item contact-info__address">
                  <svg
                    viewBox="0 0 20 28"
                    aria-hidden="true"
                    className="contact-info__icon contact-info__icon--pin"
                  >
                    <path
                      fill="#fff"
                      d="M10 0C4.5 0 0 4.4 0 9.9 0 17 10 28 10 28s10-11 10-18.1C20 4.4 15.5 0 10 0zm0 13.5a3.7 3.7 0 1 1 0-7.4 3.7 3.7 0 0 1 0 7.4z"
                    />
                  </svg>
                  <address>
                    {dt(`data.offices.${hq.id}.address`)}, {dt(`data.offices.${hq.id}.city`)}
                  </address>
                </div>
              </>
            )}
          </section>
        </main>
      </div>

      <section className="say-hello has-stickers" aria-label={t("contact.form.label")}>
        <img
          loading="lazy"
          decoding="async"
          className="say-hello__curves"
          src={img("contact-curves.svg")}
          alt=""
          aria-hidden="true"
        />
        <div ref={helloRef} className={cx("say-hello__inner", helloClass)}>
          <SplitHeading as="h2">{t("contact.form.title")}</SplitHeading>
          <p className="say-hello__lead">{t("contact.form.lead")}</p>
          <ContactForm />
        </div>
        <Stickers items={HELLO_STICKERS} />
      </section>

      <div className="contact-bottom">
        <NewsletterSection />
      </div>
      <Footer />
    </>
  );
}
