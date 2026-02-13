/**
 * formatCurrency — Formats a number as currency using admin-configurable locale/currency.
 *
 * Usage:
 *   const { getSetting } = useAppSettings();
 *   formatCurrency(12500, getSetting)  // "12 500 kr"
 */

type GetSetting = (key: string, fallback?: string) => string;

const DEFAULT_LOCALE = "nb-NO";
const DEFAULT_CURRENCY = "NOK";

export function formatCurrency(
  amount: number,
  getSetting?: GetSetting,
): string {
  const locale = getSetting?.("currency_locale", DEFAULT_LOCALE) ?? DEFAULT_LOCALE;
  const currency = getSetting?.("currency_code", DEFAULT_CURRENCY) ?? DEFAULT_CURRENCY;

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString(locale)} ${currency}`;
  }
}

/** Simple number format respecting locale (no currency symbol). */
export function formatNumber(
  amount: number,
  getSetting?: GetSetting,
): string {
  const locale = getSetting?.("currency_locale", DEFAULT_LOCALE) ?? DEFAULT_LOCALE;
  return amount.toLocaleString(locale);
}

/** Return the currency symbol/code for display in labels like "Budsjett (NOK)". */
export function getCurrencyCode(getSetting?: GetSetting): string {
  return getSetting?.("currency_code", DEFAULT_CURRENCY) ?? DEFAULT_CURRENCY;
}
