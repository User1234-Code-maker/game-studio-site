import { useCallback } from "react";
import { useTranslation } from "react-i18next";

/** Turns an API error code ("rate_limited", "server_error"...) into a message in the current language. */
export function useErrorText() {
  const { t, i18n } = useTranslation();
  return useCallback(
    (code: string, field?: string): string => {
      const candidates = [field ? `errors.${field}.${code}` : "", `errors.${code}`].filter(Boolean);
      const key = candidates.find((candidate) => i18n.exists(candidate));
      return key ? (t(key as never) as string) : t("errors.unknown");
    },
    [t, i18n],
  );
}
