"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { SupportedCurrency } from "@/shared/types/navigation";
import {
  DEFAULT_CURRENCY,
  SUPPORTED_CURRENCIES,
  CURRENCY_SYMBOLS,
  FALLBACK_RATES,
  convertCurrency,
  formatCurrencyAmount,
} from "@/shared/currency";
import { useAuth } from "@/frontend/features/auth/AuthContext";

const STORAGE_KEY = "freelancepay_currency";

interface CurrencyContextType {
  currency: SupportedCurrency;
  setCurrency: (c: SupportedCurrency) => Promise<void>;
  rates: Record<string, number>;
  lastUpdated: string;
  currencySymbol: string;
  format: (
    amount: number,
    fromCurrency?: string,
    options?: {
      showCode?: boolean;
      minimumFractionDigits?: number;
      maximumFractionDigits?: number;
    }
  ) => string;
  convert: (amount: number, fromCurrency?: string) => number;
  rateNotice: string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [currency, setCurrencyState] = useState<SupportedCurrency>(DEFAULT_CURRENCY);
  const [rates, setRates] = useState<Record<string, number>>(FALLBACK_RATES);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  // Load persisted currency on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as SupportedCurrency | null;
      if (stored && SUPPORTED_CURRENCIES.includes(stored)) {
        setCurrencyState(stored);
      }
    } catch {
      // localStorage unavailable in private/sandboxed mode
    }
  }, []);

  // When user session loads, if they have baseCurrency, synchronize if not explicitly overridden
  useEffect(() => {
    async function loadUserSettingsCurrency() {
      if (!user) return;
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          const base = data?.settings?.baseCurrency as SupportedCurrency;
          if (base && SUPPORTED_CURRENCIES.includes(base)) {
            const stored = localStorage.getItem(STORAGE_KEY) as SupportedCurrency | null;
            if (!stored) {
              setCurrencyState(base);
              localStorage.setItem(STORAGE_KEY, base);
            }
          }
        }
      } catch {
        // Ignore settings load error
      }
    }
    loadUserSettingsCurrency();
  }, [user]);

  // Fetch live exchange rates from internal cached API
  useEffect(() => {
    let isMounted = true;
    async function fetchRates() {
      try {
        const res = await fetch("/api/currency/rates");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.rates) {
            setRates(data.rates);
            if (data.lastUpdated) {
              setLastUpdated(data.lastUpdated);
            }
          }
        }
      } catch (err) {
        console.warn("Could not load live rates, using fallback baseline", err);
      }
    }

    fetchRates();
    const interval = setInterval(fetchRates, 30 * 60 * 1000); // 30 min refresh
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const setCurrency = useCallback(
    async (nextCurrency: SupportedCurrency) => {
      if (!SUPPORTED_CURRENCIES.includes(nextCurrency)) return;
      setCurrencyState(nextCurrency);

      try {
        localStorage.setItem(STORAGE_KEY, nextCurrency);
      } catch {
        // ignore
      }

      // Persist to user settings in Firestore/Prisma if authenticated
      if (user) {
        try {
          await fetch("/api/settings", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ baseCurrency: nextCurrency }),
          });
        } catch {
          // ignore background update error
        }
      }
    },
    [user]
  );

  const convert = useCallback(
    (amount: number, fromCurrency: string = "USD"): number => {
      return convertCurrency(amount, fromCurrency, currency, rates);
    },
    [currency, rates]
  );

  const format = useCallback(
    (
      amount: number,
      fromCurrency: string = "USD",
      options?: {
        showCode?: boolean;
        minimumFractionDigits?: number;
        maximumFractionDigits?: number;
      }
    ): string => {
      const converted = convertCurrency(amount, fromCurrency, currency, rates);
      return formatCurrencyAmount(converted, currency, options);
    },
    [currency, rates]
  );

  const eurRate = (rates.EUR || FALLBACK_RATES.EUR).toFixed(4);
  const inrRate = (rates.INR || FALLBACK_RATES.INR).toFixed(2);
  const rateNotice = `1 USD = €${eurRate} • ₹${inrRate}`;

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        rates,
        lastUpdated,
        currencySymbol: CURRENCY_SYMBOLS[currency] || "$",
        format,
        convert,
        rateNotice,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (!context) {
    // Graceful fallback if rendered outside provider
    return {
      currency: "USD",
      setCurrency: async () => {},
      rates: FALLBACK_RATES,
      lastUpdated: "",
      currencySymbol: "$",
      format: (amt: number) => formatCurrencyAmount(amt, "USD"),
      convert: (amt: number) => amt,
      rateNotice: "1 USD = €0.8958 • ₹94.11",
    };
  }
  return context;
};
