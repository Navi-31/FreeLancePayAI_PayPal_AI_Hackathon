"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SearchInput } from "@/components/ui/SearchInput";
import { AuricButton } from "@/components/ui/AuricButton";
import { SupportedCurrency } from "@/types/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/AuthContext";
import { AuthModal } from "@/components/auth/AuthModal";

export interface TopNavBarProps {
  onToggleMobileMenu?: () => void;
  currency?: SupportedCurrency;
  onCurrencyChange?: (currency: SupportedCurrency) => void;
  title?: string;
  subtitle?: string;
  userBadge?: string;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  onToggleMobileMenu,
  currency = "USD",
  onCurrencyChange,
  title = "Good evening, Alex",
  subtitle = "Autonomous fiscal guardian is operational",
  userBadge = "PRO VIP",
}) => {
  const { user, isDemoMode, logout, syncLocalDataToCloud } = useAuth();
  const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency>(currency);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [liveNotifications, setLiveNotifications] = useState<Array<{
    id: string;
    title: string;
    message: string;
    type: string;
    link?: string;
    read: boolean;
    createdAt: string;
  }>>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const router = useRouter();

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      if (q.startsWith("inv") || q.startsWith("fp-")) {
        router.push(`/invoices?search=${encodeURIComponent(searchQuery.trim())}`);
      } else if (q.startsWith("cli") || q.includes("client")) {
        router.push("/clients");
      } else if (q.includes("copilot") || q.includes("ai")) {
        router.push("/ai/copilot");
      } else if (q.includes("rescue")) {
        router.push("/ai/rescue");
      } else if (q.includes("milestone")) {
        router.push("/milestones");
      } else if (q.includes("tax")) {
        router.push("/tax");
      } else {
        router.push(`/invoices?search=${encodeURIComponent(searchQuery.trim())}`);
      }
    }
  };

  const fetchLiveNotifications = async () => {
    try {
      const res = await fetch("/api/notifications?limit=10");
      if (res.ok) {
        const data = await res.json();
        setLiveNotifications(data.notifications || []);
        setUnreadCount(typeof data.unreadCount === "number" ? data.unreadCount : 0);
      }
    } catch {
      // Offline / unauthenticated demo fallback
    }
  };

  useEffect(() => {
    fetchLiveNotifications();
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      if (res.ok) {
        setUnreadCount(0);
        setLiveNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      }
    } catch {
      setUnreadCount(0);
    }
  };

  const handleCurrencySelect = (curr: SupportedCurrency) => {
    setSelectedCurrency(curr);
    onCurrencyChange?.(curr);
  };

  const handleSyncData = async () => {
    setSyncStatus("Syncing...");
    const res = await syncLocalDataToCloud();
    setSyncStatus(res.message);
    setTimeout(() => setSyncStatus(null), 4000);
  };

  const handleSeedDemoPortfolio = async (reset = false) => {
    try {
      if (reset) {
        const confirmed = window.confirm(
          "Reset Demo Data: This will refresh only synthetic demo records to their initial state. Any real custom records you created will be preserved. Proceed?"
        );
        if (!confirmed) return;
      }
      setSyncStatus(reset ? "Resetting demo state..." : "Seeding demo data...");
      const res = await fetch("/api/demo/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reset, confirm: true }),
      });
      if (res.ok) {
        setSyncStatus(reset ? "Demo portfolio reset cleanly!" : "Demo data seeded successfully!");
        setTimeout(() => {
          setSyncStatus(null);
          window.location.reload();
        }, 1200);
      } else {
        setSyncStatus("Failed to seed demo data");
        setTimeout(() => setSyncStatus(null), 3000);
      }
    } catch {
      setSyncStatus("Error seeding demo data");
      setTimeout(() => setSyncStatus(null), 3000);
    }
  };

  const displayName = user?.name || "Alex Vance";
  const displayEmail = user?.email || "alex.vance@studio.ai";
  const displayRole = user?.profile?.title || "Design Technologist";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <header className="docked full-width top-0 sticky z-30 flex items-center justify-between px-4 lg:px-space-lg py-2.5 border-b border-outline-variant/30 backdrop-blur-2xl bg-surface/80 shadow-sm transition-all">
      {/* Left Greeting & Search Area */}
      <div className="flex items-center gap-3 lg:gap-6 min-w-0">
        {/* Mobile Hamburger Button */}
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
          aria-label="Toggle navigation drawer"
        >
          <span className="material-symbols-outlined text-2xl leading-none">menu</span>
        </button>

        {/* Title & Greeting */}
        <div className="hidden sm:flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-headline-sm text-sm lg:text-base font-semibold tracking-tight text-on-surface truncate">
              {title}
            </h1>
            {userBadge && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-medium tracking-wider">
                {userBadge}
              </span>
            )}
          </div>
          <p className="font-body-sm text-[11px] text-on-surface-variant truncate">
            {subtitle}
          </p>
        </div>

        {/* Global Omnisearch */}
        <div className="w-52 lg:w-72 hidden md:block">
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
        </div>
      </div>

      {/* Right Action Controls Cluster */}
      <div className="flex items-center gap-2 lg:gap-3 shrink-0">
        {/* Currency Switcher */}
        <div className="flex items-center bg-surface-container-lowest border border-outline-variant/30 rounded-lg p-0.5 text-xs">
          {(["USD", "EUR", "GBP"] as SupportedCurrency[]).map((c) => (
            <button
              key={c}
              onClick={() => handleCurrencySelect(c)}
              className={cn(
                "px-2.5 py-1 rounded text-xs font-medium transition-all duration-150",
                selectedCurrency === c
                  ? "bg-primary text-on-primary shadow-xs font-semibold"
                  : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Rescue Quick Trigger */}
        <Link
          href="/ai/rescue"
          className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-error-container/20 border border-error/30 text-error hover:bg-error-container/40 text-xs font-medium transition-all"
        >
          <span className="material-symbols-outlined text-sm leading-none" data-icon="crisis_alert">
            crisis_alert
          </span>
          <span>Rescue Cashflow</span>
        </Link>

        {/* New Invoice Primary Action */}
        <Link href="/invoices/new">
          <AuricButton size="sm" icon="add">
            + New Invoice
          </AuricButton>
        </Link>

        {/* System Icons Group */}
        <div className="flex items-center gap-0.5 border-l border-outline-variant/30 pl-2 lg:pl-3 relative">
          {/* Notifications Button */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileMenu(false);
                if (!showNotifications) fetchLiveNotifications();
              }}
              className="relative p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
              aria-label="View notifications"
            >
              <span className="material-symbols-outlined text-lg leading-none" data-icon="notifications">
                notifications
              </span>
              {unreadCount > 0 ? (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-secondary text-on-secondary text-[10px] font-bold flex items-center justify-center ring-2 ring-surface shadow-sm">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-secondary/40 ring-1 ring-surface" />
              )}
            </button>

            {/* Notifications Popover */}
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-84 sm:w-96 glass-panel-elevated p-3.5 rounded-xl border border-outline-variant/30 shadow-2xl z-50">
                <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-label-md text-xs font-semibold text-white">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-secondary/20 text-secondary text-[10px] font-mono font-semibold">
                        {unreadCount} unread
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[10px] text-primary hover:underline font-mono"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="space-y-2 text-xs max-h-80 overflow-y-auto">
                  {liveNotifications.length > 0 ? (
                    liveNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={cn(
                          "p-2.5 rounded-lg border transition-colors",
                          notif.read
                            ? "bg-surface-container-high/30 border-outline-variant/20 opacity-80"
                            : "bg-surface-container-high/70 border-secondary/30"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-on-surface font-semibold text-[11px] leading-snug">
                            {notif.title}
                          </p>
                          {!notif.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">
                          {notif.message}
                        </p>
                        {notif.link && (
                          <Link
                            href={notif.link}
                            onClick={() => setShowNotifications(false)}
                            className="inline-block mt-1 text-[10px] text-primary hover:underline font-mono font-semibold"
                          >
                            View details &rarr;
                          </Link>
                        )}
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="p-2 rounded-lg bg-surface-container-high/60 border border-secondary/20">
                        <p className="text-on-surface font-medium text-[11px]">
                          Horizon Studio viewed Invoice <span className="text-primary font-mono">#FP-8849</span>
                        </p>
                        <span className="text-[10px] text-on-surface-variant opacity-75">4 minutes ago &bull; Stripe Connect</span>
                      </div>
                      <div className="p-2 rounded-lg bg-surface-container-high/60 border border-outline-variant/20">
                        <p className="text-on-surface font-medium text-[11px]">
                          Tax Shield reserved <span className="text-emerald-400 font-mono">$1,240.00</span> for Q4
                        </p>
                        <span className="text-[10px] text-on-surface-variant opacity-75">2 hours ago &bull; Autonomous Shield</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick AI Copilot Pulse */}
          <Link
            href="/ai/copilot"
            className="p-2 rounded-lg text-secondary hover:text-on-surface hover:bg-surface-container transition-colors"
            title="Instant Copilot Pulse"
          >
            <span className="material-symbols-outlined text-lg leading-none" data-icon="bolt">
              bolt
            </span>
          </Link>
        </div>

        {/* User Profile Avatar with Gold Rim Ring */}
        <div className="relative pl-1">
          <div
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="relative">
              <div className="w-8 h-8 rounded-full ring-2 ring-primary p-0.5 bg-surface-container-high flex items-center justify-center font-semibold text-xs text-primary shadow-[0_0_12px_rgba(244,200,109,0.25)]">
                {initials}
              </div>
              <span
                className={cn(
                  "absolute bottom-0 right-0 w-2 h-2 rounded-full ring-2 ring-surface",
                  isDemoMode ? "bg-amber-400" : "bg-emerald-400"
                )}
                title={isDemoMode ? "Demo Mode (Local)" : "Production Session Active"}
              />
            </div>

            <div className="hidden 2xl:flex flex-col text-left">
              <span className="font-label-md text-xs font-medium text-on-surface group-hover:text-primary transition-colors">
                {displayName}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="font-label-sm text-[10px] text-on-surface-variant truncate max-w-[110px]">
                  {displayRole}
                </span>
                <span
                  className={cn(
                    "text-[9px] px-1 rounded font-mono font-bold uppercase",
                    isDemoMode
                      ? "bg-amber-400/10 text-amber-400 border border-amber-400/30"
                      : "bg-emerald-400/10 text-emerald-400 border border-emerald-400/30"
                  )}
                >
                  {isDemoMode ? "Demo" : "Live DB"}
                </span>
              </div>
            </div>
          </div>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 top-full mt-2 w-64 glass-panel-elevated p-2 rounded-xl border border-outline-variant/30 shadow-2xl z-50 text-xs">
              <div className="px-3 py-2 border-b border-outline-variant/20 mb-1">
                <p className="font-medium text-white">{displayName}</p>
                <p className="text-[11px] text-on-surface-variant truncate">{displayEmail}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      isDemoMode ? "bg-amber-400" : "bg-emerald-400"
                    )}
                  />
                  <span className="text-[10px] text-outline font-mono">
                    {isDemoMode ? "Storage: Local Sandbox" : "Storage: PostgreSQL Backend"}
                  </span>
                </div>
              </div>

              {syncStatus && (
                <div className="px-3 py-2 mb-1 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[10px]">
                  {syncStatus}
                </div>
              )}

              <button
                onClick={handleSyncData}
                className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-container/60 text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined text-base text-primary">cloud_sync</span>
                <span>Sync Local Data to Database</span>
              </button>

              <button
                onClick={() => handleSeedDemoPortfolio(false)}
                className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-container/60 text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined text-base text-secondary">database</span>
                <span>Seed Coherent Demo Data</span>
              </button>

              <button
                onClick={() => handleSeedDemoPortfolio(true)}
                className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-container/60 text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined text-base text-amber-400">restart_alt</span>
                <span>Reset Demo Portfolio</span>
              </button>

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  setIsAuthModalOpen(true);
                }}
                className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-container/60 text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined text-base text-secondary">shield_person</span>
                <span>{isDemoMode ? "Sign In / Register Account" : "Switch Account"}</span>
              </button>

              <Link
                href="/settings"
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-container/60 text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined text-base">settings</span>
                <span>Workspace Settings</span>
              </Link>

              <Link
                href="/treasury/currency"
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-container/60 text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined text-base">account_balance_wallet</span>
                <span>Treasury Vaults</span>
              </Link>

              {!isDemoMode && (
                <button
                  onClick={async () => {
                    await logout();
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-error-container/20 text-error hover:text-error transition-colors"
                >
                  <span className="material-symbols-outlined text-base">logout</span>
                  <span>Sign Out</span>
                </button>
              )}

              <div className="pt-1 mt-1 border-t border-outline-variant/20">
                <span className="px-3 py-1.5 block text-[10px] text-outline font-mono">
                  Autonomous Engine Active
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </header>
  );
};
