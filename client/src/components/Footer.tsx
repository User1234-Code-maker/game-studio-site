import { useTranslation } from "react-i18next";
import { SocialLinks } from "./SocialLinks";

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer>
      <div className="container">
        <div className="block">
          <div>
            <span className="logo">logo</span>
            <p>{t("footer.tagline")}</p>
            <p className="handle">@Logo</p>
          </div>
          <div>
            <h4>{t("footer.about")}</h4>
            <ul>
              <li>{t("footer.services")}</li>
              <li>{t("footer.portfolio")}</li>
              <li>{t("footer.careers")}</li>
              <li>{t("footer.contact")}</li>
            </ul>
          </div>
          <div>
            <h4>{t("footer.contact")}</h4>
            <ul>
              <li>{t("footer.address")}</li>
              <li>+908 89097 890</li>
            </ul>
            <div className="social">
              <SocialLinks />
            </div>
          </div>
        </div>
      </div>
      <hr />
      <p className="copyright">{t("footer.copyright")}</p>
    </footer>
  );
}
