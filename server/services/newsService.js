import { loadData } from "./jsonData.js";

const haystack = (a) => [a.title, a.tag.label, ...(a.keywords || []), ...(a.paragraphs || [])].join(" ").toLowerCase();

// Search + pagination in one place so routes stay thin.
export async function listNews({ q = "", page = 1, limit = 20 } = {}) {
  const { articles } = await loadData("news.json");
  const query = q.trim().toLowerCase();
  const matches = query ? articles.filter((a) => haystack(a).includes(query)) : articles;

  const size = Math.min(Math.max(limit, 1), 50);
  const current = Math.max(page, 1);
  const start = (current - 1) * size;

  return {
    total: matches.length,
    page: current,
    limit: size,
    items: matches.slice(start, start + size),
  };
}

export async function getNews(id) {
  const { articles } = await loadData("news.json");
  return articles.find((a) => a.id === id) || null;
}
