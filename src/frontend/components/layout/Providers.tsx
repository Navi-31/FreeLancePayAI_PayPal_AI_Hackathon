"use client";

import React from "react";
import { AuthProvider } from "@/frontend/features/auth/AuthContext";
import { CurrencyProvider } from "@/frontend/features/currency/CurrencyContext";
import { NavigationProgressBar } from "./NavigationProgressBar";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <React.Suspense fallback={null}>
          <NavigationProgressBar />
        </React.Suspense>
        {children}
      </CurrencyProvider>
    </AuthProvider>
  );
}
