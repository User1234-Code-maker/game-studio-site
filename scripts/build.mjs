// Static page builder.
// Reads data/*.json (the single source of truth, also served by the API)
// and writes the repeated blocks of news.html and contact.html between
// <!-- build:NAME --> markers. Run: npm run build
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = async (file) => JSON.parse(await readFile(path.join(root, "data", file), "utf8"));

const esc = (value) =>
  String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function indent(text, spaces) {
  const pad = " ".repeat(spaces);
  return text
    .split("\n")
    .map((line) => (line ? pad + line : line))
    .join("\n");
}

/* ---------- News ---------- */

function meta(article, big) {
  const tag = `<span class="tag tag--${esc(article.tag.color)}${big ? " tag--big" : ""}">${esc(article.tag.label)}</span>`;
  const times = article.times.map((t) => `<span class="news-meta__time">${esc(t)}</span>`).join("\n");
  return `<div class="news-meta">\n${indent(`${tag}\n${times}`, 2)}\n</div>`;
}

function bigArticle(a) {
  const paragraphs = (a.paragraphs || []).map((p) => `<p>${esc(p)}</p>`).join("\n");
  return [
    `<article class="news-big" data-id="${esc(a.id)}" data-search="${esc(a.keywords.join(" "))}">`,
    indent(`<img src="${esc(a.image)}" alt="${esc(a.alt)}" width="588" height="295" />`, 2),
    indent(meta(a, true), 2),
    indent(`<h2>${esc(a.title)}</h2>`, 2),
    indent(paragraphs, 2),
    `</article>`,
  ].join("\n");
}

function sideArticle(a) {
  return [
    `<article class="news-side" data-id="${esc(a.id)}" data-search="${esc(a.keywords.join(" "))}">`,
    indent(`<img src="${esc(a.image)}" alt="${esc(a.alt)}" width="195" height="183" loading="lazy" />`, 2),
    indent(
      `<div class="news-side__body">\n${indent(meta(a, false), 2)}\n${indent(`<h3>${esc(a.title)}</h3>`, 2)}\n</div>`,
      2,
    ),
    `</article>`,
  ].join("\n");
}

/* ---------- Offices ---------- */

function pin(o, index, hq) {
  const size = o.id === hq ? "hq" : o.size;
  const role = esc(o.role);
  const city = esc(o.city);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.address).replace(/%20/g, "+").replace(/%2C/g, ",")}+${encodeURIComponent(o.city).replace(/%20/g, "+")}`;
  return [
    `<div class="pin pin--${size}" style="--x: ${o.x}%; --y: ${o.y}%; --i: ${index}" data-id="${esc(o.id)}">`,
    `  <button type="button" class="pin__btn" aria-expanded="false" aria-controls="card-${esc(o.id)}" aria-label="${city}, ${esc(o.country)}: ${role}">`,
    `    <span class="pin__pulse"></span><span class="pin__dot"></span>`,
    `  </button>`,
    `  <div class="pin__card" id="card-${esc(o.id)}" role="dialog" aria-label="${city} office">`,
    `    <span class="pin__role">${role}</span>`,
    `    <p class="pin__city">${city}<small>${esc(o.country)}</small></p>`,
    `    <p class="pin__address">${esc(o.address)}</p>`,
    `    <a class="pin__phone" href="tel:${o.phone.replace(/[^+\d]/g, "")}">${esc(o.phone)}</a>`,
    `    <p class="pin__team"><strong>${o.team}</strong> people on site</p>`,
    `    <a class="pin__route" href="${esc(mapsUrl)}" target="_blank" rel="noopener">Get directions →</a>`,
    `  </div>`,
    `</div>`,
  ].join("\n");
}

function stats(offices) {
  const countries = new Set(offices.map((o) => o.country)).size;
  const people = offices.reduce((sum, o) => sum + o.team, 0);
  return [
    `<div><strong data-count="${offices.length}">0</strong><span>offices</span></div>`,
    `<div><strong data-count="${countries}">0</strong><span>countries</span></div>`,
    `<div><strong data-count="${people}" data-suffix="+">0</strong><span>people</span></div>`,
  ].join("\n");
}

function chips(offices) {
  return [...offices]
    .sort((a, b) => a.city.localeCompare(b.city))
    .map((o) => `<button type="button" class="chip" data-target="${esc(o.id)}">${esc(o.city)}</button>`)
    .join("\n");
}

/* ---------- Marker replacement ---------- */

function inject(source, name, content, spaces) {
  const re = new RegExp(`([ \\t]*)<!-- build:${name} -->[\\s\\S]*?<!-- /build:${name} -->`);
  if (!re.test(source)) throw new Error(`Marker "${name}" not found`);
  return source.replace(
    re,
    `${" ".repeat(spaces)}<!-- build:${name} -->\n${indent(content, spaces)}\n${" ".repeat(spaces)}<!-- /build:${name} -->`,
  );
}

const { articles } = await readJson("news.json");
const { offices, hq } = await readJson("offices.json");

const big = articles.filter((a) => a.size === "big");
const side = articles.filter((a) => a.size === "side");

let news = await readFile(path.join(root, "news.html"), "utf8");
news = inject(news, "news-main", big.map(bigArticle).join("\n<hr />\n"), 10);
news = inject(news, "news-side", side.map(sideArticle).join("\n"), 12);
await writeFile(path.join(root, "news.html"), news);

let contact = await readFile(path.join(root, "contact.html"), "utf8");
contact = inject(contact, "pins", offices.map((o, i) => pin(o, i, hq)).join("\n"), 12);
contact = inject(contact, "stats", stats(offices), 12);
contact = inject(contact, "chips", chips(offices), 14);
await writeFile(path.join(root, "contact.html"), contact);

console.log(`Built: ${articles.length} articles, ${offices.length} offices`);
