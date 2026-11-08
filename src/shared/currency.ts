/**
 * Authoritative Multi-Currency Engine for FreelancePay AI
 * 
 * Supports USD ($), EUR (€), and INR (₹) with deterministic fixed-point conversion
 * and authentic locale formatting (including Indian lakh/crore commas).
 */

import { SupportedCurrency } from "./types/navigation";

export const SUPPORTED_CURRENCIES: SupportedCurrency[] = ["USD", "EUR", "INR"];

export const DEFAULT_CURRENCY: SupportedCurrency = "USD";

export const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  USD: "$",
  EUR: "€",
  INR: "₹",
};

export const CURRENCY_LOCALES: Record<SupportedCurrency, string> = {
  USD: "en-US",
  EUR: "de-DE",
  INR: "en-IN",
};

/**
 * Baseline fallback exchange rates (relative to USD = 1.0).
 * Used only if external live rate APIs are unreachable.
 */
export const FALLBACK_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 0.8958,
  INR: 94.11,
};

export function getCurrencySymbol(currency?: string): string {
  const code = (currency || DEFAULT_CURRENCY).toUpperCase() as SupportedCurrency;
  return CURRENCY_SYMBOLS[code] || "$";
}

export function getCurrencyLocale(currency?: string): string {
  const code = (currency || DEFAULT_CURRENCY).toUpperCase() as SupportedCurrency;
  return CURRENCY_LOCALES[code] || "en-US";
}

/**
 * Converts an amount from one currency to another using the provided exchange rates.
 * Exchange rates are expected to be relative to USD = 1.0.
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string = "USD",
  toCurrency: string = "USD",
  rates: Record<string, number> = FALLBACK_RATES
): number {
  if (!Number.isFinite(amount) || amount === 0) return 0;

  const from = fromCurrency.toUpperCase();
  const to = toCurrency.toUpperCase();

  if (from === to) return amount;

  const fromRate = rates[from] ?? (from === "USD" ? 1.0 : FALLBACK_RATES[from] ?? 1.0);
  const toRate = rates[to] ?? (to === "USD" ? 1.0 : FALLBACK_RATES[to] ?? 1.0);

  if (fromRate <= 0 || toRate <= 0) return amount;

  // Convert to USD base first, then convert from USD to target currency
  const inUSD = amount / fromRate;
  const inTarget = inUSD * toRate;

  // Fixed 2 decimal rounding
  return Math.round((inTarget + Number.EPSILON) * 100) / 100;
}

/**
 * Formats a currency amount with the exact symbol and locale formatting
 * (e.g. ₹1,23,456.78 for INR, $123,456.78 for USD, €123.456,78 for EUR).
 */
export function formatCurrencyAmount(
  amount: number,
  currency: string = "USD",
  options?: {
    showCode?: boolean;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  if (!Number.isFinite(amount)) return `${getCurrencySymbol(currency)}0.00`;

  const curr = (currency || DEFAULT_CURRENCY).toUpperCase() as SupportedCurrency;
  const locale = getCurrencyLocale(curr);
  const symbol = getCurrencySymbol(curr);

  const minDigits = options?.minimumFractionDigits ?? 2;
  const maxDigits = options?.maximumFractionDigits ?? 2;

  const formatted = Math.abs(amount).toLocaleString(locale, {
    minimumFractionDigits: minDigits,
    maximumFractionDigits: maxDigits,
  });

  const sign = amount < 0 ? "-" : "";

  if (options?.showCode) {
    return `${sign}${symbol}${formatted} ${curr}`;
  }

  return `${sign}${symbol}${formatted}`;
}
