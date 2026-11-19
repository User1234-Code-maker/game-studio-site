/** Formats an amount in cents for the current language, e.g. 200000 -> "$2,000". */
export function formatMoney(cents: number, language: string, currency = "usd"): string {
  return new Intl.NumberFormat(language, {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}
