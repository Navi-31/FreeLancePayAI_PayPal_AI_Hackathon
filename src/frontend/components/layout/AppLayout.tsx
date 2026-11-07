"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/frontend/features/auth/AuthContext";
import { SideNavBar } from "./SideNavBar";
import { TopNavBar } from "./TopNavBar";
import { SupportedCurrency } from "@/shared/types/navigation";

export interface AppLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
  pageSubtitle?: string;
  userBadge?: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  pageTitle,
  pageSubtitle,
  userBadge,
}) => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currency, setCurrency] = useState<SupportedCurrency>("USD");

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  // While checking authentication or if unauthenticated, prevent showing private layout
  if (loading || !user) {
    return (
      <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center p-6 text-on-surface">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-xs text-outline font-mono">Verifying authentication session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface flex selection:bg-primary selection:text-on-primary">
      {/* 1. Desktop Persistent Sidebar */}
        <div className="hidden lg:block fixed left-0 top-0 h-screen w-64 z-40">
          <SideNavBar />
        </div>

        {/* 2. Mobile / Tablet Collapsible Drawer with Backdrop */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-hidden="true"
            />

            {/* Drawer content */}
            <div className="relative z-10 w-64 max-w-[80vw] h-full shadow-2xl">
              <SideNavBar onCloseMobile={() => setIsMobileMenuOpen(false)} />
            </div>
          </div>
        )}

        {/* 3. Main Workspace Area */}
        <div className="flex-1 lg:ml-64 min-h-screen flex flex-col bg-surface overflow-x-hidden">
          {/* Top Header */}
          <TopNavBar
            onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            currency={currency}
            onCurrencyChange={setCurrency}
            title={pageTitle}
            subtitle={pageSubtitle}
            userBadge={userBadge}
          />

          {/* Dynamic Page Content */}
          <main className="flex-1 p-4 md:p-6 lg:p-space-lg overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
  );
};
