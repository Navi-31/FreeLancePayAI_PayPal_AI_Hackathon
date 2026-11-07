"use client";

import React from "react";
import { AuthProvider } from "@/frontend/features/auth/AuthContext";
import { NavigationProgressBar } from "./NavigationProgressBar";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <React.Suspense fallback={null}>
        <NavigationProgressBar />
      </React.Suspense>
      {children}
    </AuthProvider>
  );
}
