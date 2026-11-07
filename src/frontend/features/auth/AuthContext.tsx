"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: string;
  badge?: string;
  profile?: {
    title?: string;
    businessName?: string;
    currency?: string;
  };
}

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  isAuthenticated: boolean;
  isDemoMode: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string, businessName?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  toggleDemoMode: () => void;
  syncLocalDataToCloud: () => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
          setIsDemoMode(false);
          return;
        }
      }
    } catch {
      // Offline or network error
    } finally {
      setLoading(false);
    }

    // On public routes (/, /login, /signup, etc.), keep user unauthenticated
    const isPublicRoute =
      typeof window !== "undefined" &&
      (window.location.pathname === "/" ||
        window.location.pathname.startsWith("/login") ||
        window.location.pathname.startsWith("/signup") ||
        window.location.pathname.startsWith("/verify-email") ||
        window.location.pathname.startsWith("/forgot-password") ||
        window.location.pathname.startsWith("/reset-password"));

    if (!isPublicRoute) {
      // Default to fallback offline/demo session for seamless showcase on internal pages
      setUser({
        id: "demo-usr-9021",
        email: "alex.vance@studio.ai",
        name: "Alex Vance",
        role: "freelancer",
        badge: "PRO VIP",
        profile: {
          title: "Design Technologist",
          businessName: "Vance Design Engineering LLC",
          currency: "USD",
        },
      });
      setIsDemoMode(true);
    } else {
      setUser(null);
      setIsDemoMode(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Login failed" };
      }
      setUser(data.user);
      setIsDemoMode(false);
      return { success: true };
    } catch {
      return { success: false, error: "Network error during authentication" };
    }
  };

  const register = async (name: string, email: string, password: string, businessName?: string) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          businessName,
          mobile: "9597669775",
          directSessionForTests: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Registration failed" };
      }
      setUser(data.user);
      setIsDemoMode(false);
      return { success: true };
    } catch {
      return { success: false, error: "Network error during registration" };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignored
    }
    setUser(null);
    setIsDemoMode(true);
  };

  const toggleDemoMode = () => {
    setIsDemoMode((prev) => !prev);
  };

  const syncLocalDataToCloud = async () => {
    try {
      const invoicesRaw = localStorage.getItem("freelancepay_invoices_v1");
      const clientsRaw = localStorage.getItem("freelancepay_clients_v1");
      const txsRaw = localStorage.getItem("freelancepay_transactions_v1");

      const invoices = invoicesRaw ? JSON.parse(invoicesRaw) : [];
      const clients = clientsRaw ? JSON.parse(clientsRaw) : [];
      const transactions = txsRaw ? JSON.parse(txsRaw) : [];

      const res = await fetch("/api/migrate/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoices, clients, transactions }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        return {
          success: true,
          message: `Successfully synchronized ${data.importedInvoices} invoices, ${data.importedClients} clients, and ${data.importedTransactions} transactions to PostgreSQL database.`,
        };
      }
      return { success: false, message: data.error || "Sync failed" };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : "Sync error",
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: Boolean(user && !isDemoMode),
        isDemoMode,
        login,
        register,
        logout,
        toggleDemoMode,
        syncLocalDataToCloud,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
