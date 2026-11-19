import newsJson from "@data/news.json";
import officesJson from "@data/offices.json";
import type { Article, Office } from "@/types/data";

// data/*.json is the single source of truth: the React app bundles it and the
// Node.js API serves the very same files.
export const articles = newsJson.articles as Article[];
export const offices = officesJson.offices as Office[];
export const HQ_ID: string = officesJson.hq;
export const [MAP_WIDTH, MAP_HEIGHT] = officesJson.viewBox as [number, number];

export const officeStats = {
  offices: offices.length,
  countries: new Set(offices.map((office) => office.country)).size,
  people: offices.reduce((sum, office) => sum + office.team, 0),
};
