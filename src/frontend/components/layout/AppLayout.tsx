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
  const { user, loading, refreshSession } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const checkedRef = React.useRef(false);

  useEffect(() => {
    let active = true;

    if (!loading && !user) {
      if (checkedRef.current) {
        router.replace("/login");
        return;
      }
      setIsVerifying(true);
      refreshSession().then((sessionUser) => {
        if (!active) return;
        checkedRef.current = true;
        setIsVerifying(false);
        if (!sessionUser) {
          router.replace("/login");
        }
      });
    } else if (user) {
      checkedRef.current = false;
    }

    return () => {
      active = false;
    };
  }, [loading, user, refreshSession, router]);

  // While checking authentication or if unauthenticated, prevent showing private layout
  if (loading || isVerifying || !user) {
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
