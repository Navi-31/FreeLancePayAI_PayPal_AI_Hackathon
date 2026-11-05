"use client";

import React, { useState } from "react";
import Link from "next/link";
import { SearchInput } from "@/components/ui/SearchInput";
import { AuricButton } from "@/components/ui/AuricButton";
import { SupportedCurrency } from "@/types/navigation";
import { cn } from "@/lib/utils";

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
  const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency>(currency);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleCurrencySelect = (curr: SupportedCurrency) => {
    setSelectedCurrency(curr);
    onCurrencyChange?.(curr);
  };

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
              }}
              className="relative p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
              aria-label="View notifications"
            >
              <span className="material-symbols-outlined text-lg leading-none" data-icon="notifications">
                notifications
              </span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-secondary ring-2 ring-surface animate-pulse" />
            </button>

            {/* Notifications Popover */}
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 glass-panel-elevated p-3 rounded-xl border border-outline-variant/30 shadow-2xl z-50">
                <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20 mb-2">
                  <span className="font-label-md text-xs font-semibold text-white">AI Notifications</span>
                  <span className="text-[10px] text-secondary font-mono">Live Sync</span>
                </div>
                <div className="space-y-2 text-xs">
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
                AV
              </div>
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-surface" />
            </div>

            <div className="hidden 2xl:flex flex-col text-left">
              <span className="font-label-md text-xs font-medium text-on-surface group-hover:text-primary transition-colors">
                Alex Vance
              </span>
              <span className="font-label-sm text-[10px] text-on-surface-variant">
                Design Technologist
              </span>
            </div>
          </div>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 glass-panel-elevated p-2 rounded-xl border border-outline-variant/30 shadow-2xl z-50 text-xs">
              <div className="px-3 py-2 border-b border-outline-variant/20 mb-1">
                <p className="font-medium text-white">Alex Vance</p>
                <p className="text-[11px] text-on-surface-variant truncate">alex.vance@studio.ai</p>
              </div>
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
              <div className="pt-1 mt-1 border-t border-outline-variant/20">
                <span className="px-3 py-1.5 block text-[10px] text-outline font-mono">
                  Autonomous Engine Active
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
