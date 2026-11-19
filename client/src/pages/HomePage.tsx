import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { NewsletterSection } from "@/components/NewsletterForm";
import { OopsLink } from "@/components/OopsLink";
import { ServiceCards } from "@/components/ServiceCards";
import { SplitHeading } from "@/components/SplitHeading";
import { Stickers, type StickerSpec } from "@/components/Stickers";
import { TrendingGames } from "@/components/TrendingGames";
import { useDocumentHead } from "@/hooks/useDocumentHead";
import { useReveal } from "@/hooks/useReveal";
import { img } from "@/lib/assets";
import { cx } from "@/lib/cx";

const TRENDING_STICKERS: StickerSpec[] = [
  { name: "coin", side: "l", top: 150, size: 0.9, rotation: -12 },
  { name: "star", side: "r", top: 380, size: 0.8, rotation: 10 },
];
const FEATURES_STICKERS: StickerSpec[] = [
  { name: "bolt", side: "l", top: 130, size: 1, rotation: -10 },
  { name: "gem", side: "r", top: 320, size: 0.9, rotation: 12 },
];
const PROJECTS_STICKERS: StickerSpec[] = [
  { name: "trophy", side: "l", top: 120, size: 1, rotation: -8 },
  { name: "sparkle", side: "r", top: 150, size: 0.7, rotation: 14 },
  { name: "play", side: "r", top: 520, size: 0.85, rotation: -9 },
];

const PROJECTS = [
  { n: 1, file: "project-1.webp", width: 382 },
  { n: 2, file: "project-2.webp", width: 382 },
  { n: 3, file: "project-3.webp", width: 352 },
  { n: 5, file: "project-5.webp", width: 246 },
  { n: 4, file: "project-4.webp", width: 401 },
  { n: 6, file: "project-6.webp", width: 469 },
];

export function HomePage() {
  const { t } = useTranslation();
  useDocumentHead(`${t("nav.home")} | ${t("meta.brand")}`, t("meta.home"));
  const [bannerRef, bannerClass] = useReveal<HTMLElement>();
  const [projectsRef, projectsClass] = useReveal<HTMLDivElement>();

  return (
    <>
      <div className="wrapper">
        <Header page="home" />
        <main>
          <section className="hero container">
            <div className="hero--info">
              <div className="hero--kicker">{t("home.kicker")}</div>
              <SplitHeading as="h1">{t("home.title")}</SplitHeading>
              <p>{t("home.lead")}</p>
              <Link to="/contact" className="btn">
                {t("home.cta")}
              </Link>
            </div>
            <div className="hero__art">
              <img
                fetchPriority="high"
                width={740}
                height={951}
                src={img("joystick.webp")}
                alt={t("home.heroAlt")}
              />
              <span className="eng eng--unity" role="img" aria-label="Unity" />
              <span className="eng eng--cry" role="img" aria-label="CryEngine" />
              <span className="eng eng--unreal" role="img" aria-label="Unreal Engine" />
            </div>
          </section>

          <section className="container trending has-stickers">
            <SplitHeading as="h3" aria-level={2}>
              {t("home.trending.title")}
            </SplitHeading>
            <OopsLink name={t("home.trending.seeAll")} className="see-all">
              {t("common.seeAll")}
            </OopsLink>
            <TrendingGames />
            <Stickers items={TRENDING_STICKERS} />
          </section>

          <section className="container big-text">
            <p>{t("home.bigText")}</p>
          </section>

          <section ref={bannerRef} className={cx("container banner", bannerClass)}>
            <SplitHeading as="h3">{t("home.banner.title")}</SplitHeading>
            <p>{t("home.banner.text")}</p>
            <img
              loading="lazy"
              decoding="async"
              width={1144}
              height={462}
              src={img("banner.webp")}
              alt={t("home.banner.alt")}
            />
          </section>

          <section className="features has-stickers">
            <div className="container">
              <SplitHeading as="h3">{t("home.services.title")}</SplitHeading>
              <p>{t("home.services.text")}</p>
              <ServiceCards />
            </div>
            <Stickers items={FEATURES_STICKERS} />
          </section>

          <div className="wrapper">
            <section className="container projects has-stickers" id="projects">
              <SplitHeading as="h3">{t("home.projects.title")}</SplitHeading>
              <p>{t("home.projects.text")}</p>
              <div ref={projectsRef} className={cx("images", projectsClass)}>
                {PROJECTS.map(({ n, file, width }) => (
                  <img
                    key={n}
                    loading="lazy"
                    decoding="async"
                    width={width}
                    height={223}
                    src={img(file)}
                    alt={t("home.projects.alt", { n })}
                  />
                ))}
              </div>
              <OopsLink name={t("home.projects.seeAll")} className="see-all">
                {t("common.seeAll")}
              </OopsLink>
              <Stickers items={PROJECTS_STICKERS} />
            </section>

            <NewsletterSection />
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}
