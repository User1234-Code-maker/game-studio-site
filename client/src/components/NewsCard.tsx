import { useTranslation } from "react-i18next";
import { img } from "@/lib/assets";
import { cx } from "@/lib/cx";
import { useDynamicT } from "@/hooks/useDynamicT";
import { useReveal } from "@/hooks/useReveal";
import type { Article } from "@/types/data";

function Meta({ article, big }: { article: Article; big: boolean }) {
  const { t } = useTranslation();
  const dt = useDynamicT();
  return (
    <div className="news-meta">
      <span className={cx("tag", `tag--${article.tag.color}`, big && "tag--big")}>
        {dt(`data.news.${article.id}.author`)}
      </span>
      {article.times.map((time) => (
        <span key={time} className="news-meta__time">
          {t("news.minRead", { count: Number.parseInt(time, 10) })}
        </span>
      ))}
    </div>
  );
}

export function NewsBig({ article }: { article: Article }) {
  const dt = useDynamicT();
  const [revealRef, revealClass] = useReveal<HTMLElement>();
  return (
    <article ref={revealRef} className={cx("news-big", revealClass)} data-id={article.id}>
      <img
        src={img(article.image)}
        alt={dt(`data.news.${article.id}.alt`)}
        width={588}
        height={295}
      />
      <Meta article={article} big />
      <h2>{dt(`data.news.${article.id}.title`)}</h2>
      {(article.paragraphs ?? []).map((_, index) => (
        <p key={index}>{dt(`data.news.${article.id}.p${index}`)}</p>
      ))}
    </article>
  );
}

export function NewsSide({ article }: { article: Article }) {
  const dt = useDynamicT();
  return (
    <article className="news-side" data-id={article.id}>
      <img
        src={img(article.image)}
        alt={dt(`data.news.${article.id}.alt`)}
        width={195}
        height={183}
        loading="lazy"
      />
      <div className="news-side__body">
        <Meta article={article} big={false} />
        <h3>{dt(`data.news.${article.id}.title`)}</h3>
      </div>
    </article>
  );
}
