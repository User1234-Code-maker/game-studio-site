import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import ru from "./locales/ru.json";
import es from "./locales/es.json";
import { bindShortWords } from "@/lib/typography";

export const LANGUAGES = ["en", "ru", "es"] as const;
export type Language = (typeof LANGUAGES)[number];

export const LANGUAGE_NAMES: Record<Language, string> = {
  en: "English",
  ru: "Русский",
  es: "Español",
};

const isLanguage = (value: unknown): value is Language => LANGUAGES.includes(value as Language);

/** Saved choice first, then the browser language, then English. */
export function detectLanguage(): Language {
  try {
    const saved = localStorage.getItem("lang");
    if (isLanguage(saved)) return saved;
  } catch {
    /* private mode: ignore */
  }
  const browser = (navigator.language || "en").slice(0, 2).toLowerCase();
  return isLanguage(browser) ? browser : "en";
}

export function setLanguage(next: Language): void {
  void i18n.changeLanguage(next);
  try {
    localStorage.setItem("lang", next);
  } catch {
    /* private mode: the choice lasts for this visit */
  }
}

// Every translated string passes through here, so no short word is left at the end of a line.
const typography = {
  type: "postProcessor" as const,
  name: "typography",
  process: (value: string, _key: string | string[], _options: unknown, translator: { language?: string }) =>
    typeof value === "string" ? bindShortWords(value, translator.language ?? "en") : value,
};

void i18n.use(typography).use(initReactI18next).init({
  postProcess: ["typography"],
  resources: { en: { translation: en }, ru: { translation: ru }, es: { translation: es } },
  lng: detectLanguage(),
  fallbackLng: "en",
  supportedLngs: LANGUAGES,
  interpolation: { escapeValue: false }, // React already escapes
  returnNull: false,
});

// Keep <html lang> in sync (screen readers and hyphenation depend on it).
document.documentElement.lang = i18n.language;
i18n.on("languageChanged", (language) => {
  document.documentElement.lang = language;
});

export default i18n;
