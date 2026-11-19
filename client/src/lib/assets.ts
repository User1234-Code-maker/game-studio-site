// Every file in src/img is bundled (hashed and cached). Components ask for an
// image by its path inside that folder, e.g. img("game-1.webp").
const files = import.meta.glob<string>("../img/**/*", {
  eager: true,
  query: "?url",
  import: "default",
});

export function img(path: string): string {
  const clean = path.replace(/^img\//, "");
  const url = files[`../img/${clean}`];
  if (!url) throw new Error(`Image not found: ${clean}`);
  return url;
}
