import { Fragment, useId } from "react";
import { useTranslation } from "react-i18next";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { NewsBig, NewsSide } from "@/components/NewsCard";
import { NewsletterSection } from "@/components/NewsletterForm";
import { SplitHeading } from "@/components/SplitHeading";
import { Stickers, type StickerSpec } from "@/components/Stickers";
import { useDocumentHead } from "@/hooks/useDocumentHead";
import { useNewsSearch } from "@/hooks/useNewsSearch";
import { useReveal } from "@/hooks/useReveal";
import { articles } from "@/lib/data";
import { cx } from "@/lib/cx";

const HERO_STICKERS: StickerSpec[] = [
  { name: "controller", side: "r", top: 70, size: 0.85, rotation: 9 },
];
const LIST_STICKERS: StickerSpec[] = [
  { name: "coin", side: "l", top: 150, size: 0.85, rotation: -12 },
  { name: "bolt", side: "r", top: 760, size: 0.9, rotation: 10 },
  { name: "star", side: "l", top: 1180, size: 0.8, rotation: -10 },
];

export function NewsPage() {
  const { t } = useTranslation();
  useDocumentHead(`${t("nav.news")} | ${t("meta.brand")}`, t("meta.news"));
  const { query, setQuery, results } = useNewsSearch(articles);
  const inputId = useId();
  const [sideRef, sideClass] = useReveal<HTMLDivElement>();

  const big = results.filter((article) => article.size === "big");
  const small = results.filter((article) => article.size === "side");

  return (
    <>
      <div className="news-page">
        <Header page="news" />
        <main>
          <section className="news-hero has-stickers">
            <Breadcrumb current={t("nav.news")} />
            <SplitHeading as="h1">{t("news.title")}</SplitHeading>
            <p>{t("news.lead")}</p>
            <span className="news-hero__dot" aria-hidden="true" />

            <form
              className="search"
              role="search"
              noValidate
              onSubmit={(event) => event.preventDefault()}
            >
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <circle cx="7" cy="7" r="5.2" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <path
                  d="m11 11 3.5 3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              <label className="visually-hidden" htmlFor={inputId}>
                {t("news.searchLabel")}
              </label>
              <input
                type="search"
                id={inputId}
                placeholder={t("news.search")}
                autoComplete="off"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </form>
            <Stickers items={HERO_STICKERS} />
          </section>

          <section className="news-list has-stickers">
            <div className="news-main">
              {big.map((article, index) => (
                <Fragment key={article.id}>
                  {index > 0 && <hr />}
                  <NewsBig article={article} />
                </Fragment>
              ))}
            </div>
            <div ref={sideRef} className={cx("news-side-list", sideClass)}>
              {small.map((article) => (
                <NewsSide key={article.id} article={article} />
              ))}
            </div>
            <p className="news-empty" hidden={results.length > 0}>
              {t("news.empty")}
            </p>
            <Stickers items={LIST_STICKERS} />
          </section>
        </main>

        <NewsletterSection />
      </div>
      <Footer />
    </>
  );
}
