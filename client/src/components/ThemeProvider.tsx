import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { ThemeContext, type Theme } from "@/hooks/useTheme";

const META_COLOR: Record<Theme, string> = { dark: "#0b0601", light: "#f6f3ef" };

// public/theme-init.js already set data-theme before React started.
const readTheme = (): Theme =>
  document.documentElement.dataset.theme === "light" ? "light" : "dark";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(readTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document
      .querySelector<HTMLMetaElement>('meta[name="theme-color"]')
      ?.setAttribute("content", META_COLOR[theme]);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    const next: Theme = theme === "light" ? "dark" : "light";
    const apply = () => {
      setTheme(next);
      try {
        localStorage.setItem("theme", next);
      } catch {
        /* private mode: the choice just lasts for this visit */
      }
    };
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    // A native cross-fade where supported; instant everywhere else.
    if (document.startViewTransition && !reduced) {
      document.startViewTransition(() => {
        document.documentElement.dataset.theme = next; // paint the new theme inside the transition
        apply();
      });
    } else {
      apply();
    }
  }, [theme]);

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
