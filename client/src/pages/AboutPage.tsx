import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { NewsletterSection } from "@/components/NewsletterForm";
import { Slider } from "@/components/Slider";
import { SplitHeading } from "@/components/SplitHeading";
import { Stickers, type StickerSpec } from "@/components/Stickers";
import { useDocumentHead } from "@/hooks/useDocumentHead";
import { useReveal } from "@/hooks/useReveal";
import { img } from "@/lib/assets";
import { cx } from "@/lib/cx";

const WHY_STICKERS: StickerSpec[] = [{ name: "gem", side: "r", top: 40, size: 0.85, rotation: 10 }];
const STORY_STICKERS: StickerSpec[] = [
  { name: "dpad", side: "l", top: 130, size: 0.95, rotation: -10 },
];
const TEAM_STICKERS: StickerSpec[] = [
  { name: "trophy", side: "r", top: 70, size: 0.95, rotation: 9 },
  { name: "star", side: "l", top: 280, size: 0.75, rotation: -12 },
];

const WHY = [
  { id: "craft", color: "violet" },
  { id: "people", color: "brown" },
  { id: "reach", color: "green" },
] as const;

const TEAM = [
  { id: "anna", image: "team-1.svg" },
  { id: "daniel", image: "team-2.svg" },
  { id: "mei", image: "team-3.svg" },
  { id: "oliver", image: "team-4.svg" },
] as const;

export function AboutPage() {
  const { t } = useTranslation();
  useDocumentHead(`${t("nav.about")} | ${t("meta.brand")}`, t("meta.about"));
  const [cardsRef, cardsClass] = useReveal<HTMLDivElement>();
  const [storyRef, storyClass] = useReveal<HTMLElement>();
  const [teamRef, teamClass] = useReveal<HTMLDivElement>();

  const slides = [
    { src: img("hero-neon.webp"), alt: t("about.slide1Alt") },
    { src: img("slide-2.webp"), alt: t("about.slide2Alt") },
  ];

  return (
    <>
      <div className="about-top">
        <Header page="about" />
        <main>
          <section className="about-hero">
            <div className="about-hero__info">
              <Breadcrumb current={t("nav.about")} />
              <SplitHeading as="h1">{t("about.title")}</SplitHeading>
              <p>{t("about.lead")}</p>
              <Link to="/contact" className="btn-pill">
                {t("common.getInTouch")}
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
            </div>
            <Slider slides={slides} label={t("about.sliderLabel")} />
          </section>

          <section className="why container has-stickers">
            <SplitHeading as="h2">{t("about.why.title")}</SplitHeading>
            <div ref={cardsRef} className={cx("why__cards", cardsClass)}>
              {WHY.map(({ id, color }) => (
                <article key={id} className="why-card">
                  <span className={`pill pill--${color}`}>{t(`about.why.${id}.pill`)}</span>
                  <h3>{t(`about.why.${id}.title`)}</h3>
                  <p>{t(`about.why.${id}.text`)}</p>
                </article>
              ))}
            </div>
            <Stickers items={WHY_STICKERS} />
          </section>
        </main>
      </div>

      <section
        ref={storyRef}
        className={cx("story has-stickers", storyClass)}
        aria-label={t("about.story.label")}
      >
        <div className="story__inner">
          <img
            loading="lazy"
            decoding="async"
            width={1100}
            height={688}
            className="story__img"
            src={img("kda.webp")}
            alt={t("about.story.alt")}
          />
          <div className="story__text">
            <span className="story__label">{t("about.story.label")}</span>
            <SplitHeading as="h2">{t("about.story.title")}</SplitHeading>
            <p>{t("about.story.text")}</p>
          </div>
        </div>
        <Stickers items={STORY_STICKERS} />
      </section>

      <div className="about-bottom">
        <section className="team container has-stickers" aria-label={t("about.team.label")}>
          <SplitHeading as="h2">{t("about.team.title")}</SplitHeading>
          <div ref={teamRef} className={cx("team__cards", teamClass)}>
            {TEAM.map(({ id, image }) => (
              <article key={id} className="team-card">
                <img
                  loading="lazy"
                  decoding="async"
                  src={img(image)}
                  alt=""
                  width={63}
                  height={86}
                />
                <h3>{t(`about.team.${id}.name`)}</h3>
                <p>{t(`about.team.${id}.role`)}</p>
              </article>
            ))}
          </div>
          <Stickers items={TEAM_STICKERS} />
        </section>
        <NewsletterSection />
      </div>
      <Footer />
    </>
  );
}
