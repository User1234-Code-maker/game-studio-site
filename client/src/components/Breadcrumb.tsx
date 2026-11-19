import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cx } from "@/lib/cx";

export function Breadcrumb({ current, centered = false }: { current: string; centered?: boolean }) {
  const { t } = useTranslation();
  return (
    <nav
      className={cx("breadcrumb", centered && "breadcrumb--center")}
      aria-label={t("common.breadcrumb")}
    >
      <Link to="/">{t("nav.home")}</Link>
      <span aria-hidden="true">›</span>
      <span className="breadcrumb__current" aria-current="page">
        {current}
      </span>
    </nav>
  );
}
