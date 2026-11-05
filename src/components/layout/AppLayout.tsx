"use client";

import React, { useState } from "react";
import { SideNavBar } from "./SideNavBar";
import { TopNavBar } from "./TopNavBar";
import { SupportedCurrency } from "@/types/navigation";

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currency, setCurrency] = useState<SupportedCurrency>("USD");

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
