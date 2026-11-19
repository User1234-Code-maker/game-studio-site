import { useEffect, useMemo, useState } from "react";
import { api, type NewsSearchResponse } from "@/lib/api";
import type { Article } from "@/types/data";
import { useDebouncedValue } from "./useDebouncedValue";
import { useDynamicT } from "./useDynamicT";

const NONE: ReadonlySet<string> = new Set();

/**
 * Search over the news list.
 * Matching runs in the browser on the text shown in the current language, so it
 * works on static hosting too. When the Node.js API answers, its matches (English
 * keywords and text) are added to the result.
 */
export function useNewsSearch(articles: Article[]) {
  const t = useDynamicT();
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query.trim().toLowerCase(), 200);
  const [answer, setAnswer] = useState<{ query: string; ids: Set<string> }>({
    query: "",
    ids: new Set(),
  });
  // An answer only counts for the query it was asked for.
  const apiIds = answer.query === debounced ? answer.ids : NONE;

  useEffect(() => {
    if (!debounced) return;
    // AbortController drops the answer of an older search when a newer one starts.
    const controller = new AbortController();
    api
      .get<NewsSearchResponse>(`/news?q=${encodeURIComponent(debounced)}`, controller.signal)
      .then((reply) =>
        setAnswer({
          query: debounced,
          ids: new Set(reply.kind === "ok" ? reply.data.items.map((item) => item.id) : []),
        }),
      )
      .catch(() => undefined);
    return () => controller.abort();
  }, [debounced]);

  const results = useMemo(() => {
    if (!debounced) return articles;
    return articles.filter((article) => {
      const text = [
        t(`data.news.${article.id}.title`),
        t(`data.news.${article.id}.author`),
        ...(article.paragraphs ?? []).map((_, index) => t(`data.news.${article.id}.p${index}`)),
        ...article.keywords,
      ]
        .join(" ")
        .toLowerCase();
      return text.includes(debounced) || apiIds.has(article.id);
    });
  }, [articles, debounced, apiIds, t]);

  return { query, setQuery, results };
}
