import { describe, expect, it } from "vitest";
import en from "./locales/en.json";
import es from "./locales/es.json";
import ru from "./locales/ru.json";

type Tree = { [key: string]: string | Tree };

function paths(tree: Tree, prefix = ""): string[] {
  return Object.entries(tree).flatMap(([key, value]) =>
    typeof value === "string" ? [`${prefix}${key}`] : paths(value, `${prefix}${key}.`),
  );
}

function values(tree: Tree): string[] {
  return Object.values(tree).flatMap((value) =>
    typeof value === "string" ? [value] : values(value),
  );
}

describe("translations", () => {
  const reference = paths(en as Tree).sort();

  it.each([
    ["ru", ru],
    ["es", es],
  ])("%s has exactly the same keys as English", (_name, locale) => {
    expect(paths(locale as Tree).sort()).toEqual(reference);
  });

  it.each([
    ["ru", ru],
    ["es", es],
  ])("%s keeps the {{placeholders}} of every English text", (_name, locale) => {
    const placeholders = (text: string) => (text.match(/{{\w+}}/g) ?? []).sort();
    const english = Object.fromEntries(
      reference.map((key) => [
        key,
        key.split(".").reduce<unknown>((node, part) => (node as Tree)[part], en),
      ]),
    );
    for (const key of reference) {
      const translated = key
        .split(".")
        .reduce<unknown>((node, part) => (node as Tree)[part], locale) as string;
      expect(placeholders(translated), key).toEqual(placeholders(english[key] as string));
    }
  });

  it("has no empty texts", () => {
    for (const locale of [en, ru, es])
      expect(values(locale as Tree).every((text) => text.trim().length > 0)).toBe(true);
  });
});
