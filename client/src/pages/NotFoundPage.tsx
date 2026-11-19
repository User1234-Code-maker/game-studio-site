import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useDocumentHead } from "@/hooks/useDocumentHead";
import { img } from "@/lib/assets";
import { cssVars } from "@/lib/cx";

export function NotFoundPage() {
  const { t } = useTranslation();
  useDocumentHead(`${t("meta.notFoundTitle")} | ${t("meta.brand")}`);

  return (
    <div className="wrapper">
      <main className="notfound">
        <div>
          <img
            className="notfound__art"
            src={img("oops-controller.svg")}
            alt=""
            width={240}
            height={180}
          />
          <p className="notfound__code">
            <span className="visually-hidden">404</span>
            {["4", "0", "4"].map((digit, index) => (
              <span key={index} className="ch" style={cssVars({ "--i": index })} aria-hidden="true">
                {digit}
              </span>
            ))}
          </p>
          <h1>{t("notFound.title")}</h1>
          <p>{t("notFound.text")}</p>
          <div className="notfound__actions">
            <Link to="/">{t("notFound.home")}</Link>
            <Link to="/contact">{t("nav.contact")}</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
