import { useCallback } from "react";
import { useTranslation } from "react-i18next";

/**
 * Translate a key that is built at run time (news ids, office ids, error codes).
 * Static keys should use t() from useTranslation so TypeScript checks them;
 * this is the one place where that check is deliberately skipped.
 */
export function useDynamicT() {
  const { t, i18n } = useTranslation();
  return useCallback(
    (key: string, options?: Record<string, unknown>): string =>
      (t as unknown as (key: string, options?: Record<string, unknown>) => string)(key, options),
    // The language is a dependency so consumers re-render when it changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, i18n.language],
  );
}
