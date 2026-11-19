import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { LANGUAGES, LANGUAGE_NAMES, setLanguage, type Language } from "@/i18n";
import { cx } from "@/lib/cx";

/** Small dropdown at the right end of the header (listbox pattern, fully keyboard operable). */
export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const current = i18n.language as Language;
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const options = useRef<Array<HTMLLIElement | null>>([]);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  const openList = () => {
    setOpen(true);
    // The list is visible after this render; focus the selected option then.
    requestAnimationFrame(() => options.current[LANGUAGES.indexOf(current)]?.focus());
  };

  const choose = (language: Language) => {
    setLanguage(language);
    setOpen(false);
    trigger.current?.focus();
  };

  const onTriggerKeyDown = (event: KeyboardEvent) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      openList();
    }
  };

  const onListKeyDown = (event: KeyboardEvent) => {
    const at = options.current.findIndex((node) => node === document.activeElement);
    const go = (index: number) => {
      event.preventDefault();
      options.current[(index + LANGUAGES.length) % LANGUAGES.length]?.focus();
    };
    switch (event.key) {
      case "ArrowDown":
        return go(at + 1);
      case "ArrowUp":
        return go(at - 1);
      case "Home":
        return go(0);
      case "End":
        return go(LANGUAGES.length - 1);
      case "Enter":
      case " ": {
        event.preventDefault();
        const language = LANGUAGES[at];
        if (language) choose(language);
        return;
      }
      case "Escape":
        event.preventDefault();
        setOpen(false);
        trigger.current?.focus();
        return;
      case "Tab":
        setOpen(false);
    }
  };

  return (
    <div className={cx("lang", open && "is-open")} ref={root}>
      <button
        ref={trigger}
        type="button"
        className="lang__btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        // The name must start with the visible text ("EN"), see WCAG 2.5.3 Label in Name.
        aria-label={`${current.toUpperCase()}, ${t("header.language")}: ${LANGUAGE_NAMES[current]}`}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onTriggerKeyDown}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.6 2.4 3.9 5.4 3.9 9s-1.3 6.6-3.9 9c-2.6-2.4-3.9-5.4-3.9-9S9.4 5.4 12 3z" />
        </svg>
        <span className="lang__code">{current.toUpperCase()}</span>
        <svg
          className="lang__chevron"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <ul
        className="lang__list"
        role="listbox"
        tabIndex={-1}
        aria-label={t("header.language")}
        onKeyDown={onListKeyDown}
      >
        {LANGUAGES.map((code, index) => (
          <li
            key={code}
            ref={(node) => {
              options.current[index] = node;
            }}
            role="option"
            tabIndex={-1}
            lang={code}
            aria-selected={code === current}
            onClick={() => choose(code)}
          >
            <span>{LANGUAGE_NAMES[code]}</span>
            <svg
              className="lang__check"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </li>
        ))}
      </ul>
    </div>
  );
}
