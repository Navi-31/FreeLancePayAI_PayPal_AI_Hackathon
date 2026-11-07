"use client";

import React from "react";
import { AuthProvider } from "@/frontend/features/auth/AuthContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
