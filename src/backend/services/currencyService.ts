import { FALLBACK_RATES } from "@/shared/currency";

interface ExchangeRatePayload {
  base: string;
  rates: Record<string, number>;
  lastUpdated: string;
  provider: string;
}

let cachedRates: ExchangeRatePayload = {
  base: "USD",
  rates: { ...FALLBACK_RATES },
  lastUpdated: new Date().toISOString(),
  provider: "initial_fallback",
};

let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour TTL

/**
 * Fetches live exchange rates relative to USD from open.er-api.com
 * Caches in memory with 1 hour TTL. Falls back safely if API is unavailable.
 */
export async function getLiveExchangeRates(): Promise<ExchangeRatePayload> {
  const now = Date.now();
  if (now - lastFetchTime < CACHE_TTL_MS && cachedRates.rates.EUR && cachedRates.rates.INR) {
    return cachedRates;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 3600 },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Exchange rate provider returned HTTP ${res.status}`);
    }

    const data = await res.json();
    if (data && data.rates && typeof data.rates.EUR === "number" && typeof data.rates.INR === "number") {
      cachedRates = {
        base: "USD",
        rates: {
          USD: 1.0,
          EUR: Number(data.rates.EUR),
          INR: Number(data.rates.INR),
          ...(data.rates.GBP ? { GBP: Number(data.rates.GBP) } : {}),
        },
        lastUpdated: data.time_last_update_utc || new Date().toISOString(),
        provider: "open.er-api.com",
      };
      lastFetchTime = now;
      return cachedRates;
    }
  } catch (error) {
    console.warn("Failed to fetch live exchange rates, falling back to cached rates:", error);
  }

  return cachedRates;
}
