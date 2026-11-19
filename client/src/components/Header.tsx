import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cx } from "@/lib/cx";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";

type Page = "home" | "about" | "services" | "news" | "contact";

/** Site header. `page` marks the current menu item. */
export function Header({ page }: { page?: Page }) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  // Following any menu link closes the mobile menu.
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className={cx("container", menuOpen && "menu-open")}>
      {/* The theme switch is the first "O" of the logo: l [O] go */}
      <span className="logo">
        l<ThemeToggle />
        go
      </span>
      <button
        className="menu-toggle"
        type="button"
        aria-expanded={menuOpen}
        aria-label={t(menuOpen ? "header.closeMenu" : "header.openMenu")}
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span />
        <span />
        <span />
      </button>
      <nav>
        <ul>
          <li data-nav="home" className={cx(page === "home" && "active")}>
            <Link to="/" onClick={closeMenu}>
              {t("nav.home")}
            </Link>
          </li>
          <li data-nav="about" className={cx(page === "about" && "active")}>
            <Link to="/about" onClick={closeMenu}>
              {t("nav.about")}
            </Link>
          </li>
          <li data-nav="services" className={cx(page === "services" && "active")}>
            <Link to="/services" onClick={closeMenu}>
              {t("nav.services")}
            </Link>
          </li>
          <li data-nav="portfolio">
            <Link to="/#projects" onClick={closeMenu}>
              {t("nav.portfolio")}
            </Link>
          </li>
          <li data-nav="news" className={cx(page === "news" && "active")}>
            <Link to="/news" onClick={closeMenu}>
              {t("nav.news")}
            </Link>
          </li>
          <li data-nav="contact" className={cx("btn", page === "contact" && "active")}>
            <Link to="/contact" onClick={closeMenu}>
              {t("nav.contact")}
            </Link>
          </li>
        </ul>
      </nav>
      <LanguageSwitcher />
    </header>
  );
}
