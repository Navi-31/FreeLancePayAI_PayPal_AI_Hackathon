"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAVIGATION_SECTIONS } from "@/frontend/config/navigation";
import { cn } from "@/shared/utils";

export interface SideNavBarProps {
  onCloseMobile?: () => void;
  className?: string;
}

export const SideNavBar: React.FC<SideNavBarProps> = ({ onCloseMobile, className }) => {
  const pathname = usePathname();
  const [navigatingTo, setNavigatingTo] = React.useState<string | null>(null);

  React.useEffect(() => {
    setNavigatingTo(null);
  }, [pathname]);

  const handleLinkClick = (href: string) => {
    if (href !== pathname) {
      setNavigatingTo(href);
    }
    if (onCloseMobile) onCloseMobile();
  };

  const isRouteActive = (href: string) => {
    if (href === "/") {
      return pathname === "/" || pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        "h-screen w-64 flex flex-col bg-surface-container-lowest",
        "border-r border-outline-variant/30 backdrop-blur-xl transition-all duration-300",
        className
      )}
      id="main-sidebar"
    >
      <div className="flex flex-col justify-between h-full p-space-sm overflow-hidden">
        {/* Top Monogram & Navigation Container */}
        <div className="flex flex-col h-full min-h-0">
          {/* Brand Header */}
          <div className="flex items-center justify-between px-3 py-3 mb-1 shrink-0">
            <Link
              href="/"
              onClick={onCloseMobile}
              className="flex items-center gap-3 group transition-transform active:scale-95"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-container to-secondary-container flex items-center justify-center text-on-primary font-bold shadow-lg shadow-primary-container/20 shrink-0">
                <span
                  className="material-symbols-outlined text-primary text-xl leading-none"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  auto_awesome
                </span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-headline-sm text-sm font-semibold tracking-tight text-primary truncate">
                  FreelancePay AI
                </span>
                <span className="font-label-sm text-[10px] text-on-surface-variant opacity-80 truncate">
                  Autonomous Wealth Engine
                </span>
              </div>
            </Link>

            {/* Mobile close button */}
            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="lg:hidden p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
                aria-label="Close Navigation"
              >
                <span className="material-symbols-outlined text-xl leading-none">close</span>
              </button>
            )}
          </div>

          {/* Quick AI Copilot Trigger CTA */}
          <div className="px-1 mb-3 shrink-0">
            <Link
              href="/ai/copilot"
              onClick={onCloseMobile}
              className={cn(
                "w-full px-3 py-2 rounded-lg bg-gradient-to-r from-secondary-container to-surface-container-high",
                "border border-secondary/30 flex items-center justify-between",
                "text-secondary hover:text-on-surface violet-glow transition-all duration-150 active:scale-[0.98]"
              )}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-secondary animate-ping" />
                <span className="font-label-md text-xs font-medium text-white">Trigger Copilot</span>
              </div>
              <span className="material-symbols-outlined text-sm leading-none" data-icon="bolt">
                bolt
              </span>
            </Link>
          </div>

          {/* Scrollable Navigation Sections */}
          <div className="space-y-4 overflow-y-auto pr-1 flex-1 custom-scrollbar">
            {NAVIGATION_SECTIONS.map((section) => (
              <div key={section.pillar} className="space-y-1">
                <div className="px-3 pb-1 text-[10px] uppercase tracking-wider font-semibold flex items-center justify-between text-outline">
                  <span className={cn(section.isAiPillar && "text-secondary")}>
                    {section.pillar}
                  </span>
                  {section.isAiPillar && (
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                  )}
                </div>

                <nav className="space-y-0.5">
                  {section.items.map((item) => {
                    const active = isRouteActive(item.href);
                    const isPendingNav = navigatingTo === item.href && !active;
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => handleLinkClick(item.href)}
                        className={cn(
                          "nav-link flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all duration-150",
                          active
                            ? "bg-surface-container-high text-primary font-medium border-l-2 border-primary shadow-sm"
                            : isPendingNav
                            ? "bg-surface-container-high/60 text-primary/80 animate-pulse border-l-2 border-primary/50"
                            : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container/60 font-normal"
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={cn(
                              "material-symbols-outlined text-[18px] leading-none shrink-0",
                              active || isPendingNav
                                ? "text-primary"
                                : section.isAiPillar
                                ? "text-secondary"
                                : "text-on-surface-variant"
                            )}
                            data-icon={item.icon}
                          >
                            {item.icon}
                          </span>
                          <span className="truncate">{item.label}</span>
                        </div>

                        {isPendingNav ? (
                          <span className="w-2.5 h-2.5 rounded-full border border-primary border-t-transparent animate-spin shrink-0" />
                        ) : item.badge ? (
                          <span
                            className={cn(
                              "text-[9px] px-1.5 py-0.2 rounded font-mono font-semibold tracking-wider",
                              item.badgeVariant === "alert" && "bg-error-container/40 text-error border border-error/20",
                              item.badgeVariant === "ai" && "bg-secondary-container/30 text-secondary border border-secondary/20"
                            )}
                          >
                            {item.badge}
                          </span>
                        ) : null}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Telemetry & Vault Status */}
        <div className="pt-3 border-t border-outline-variant/30 px-2 space-y-1.5 shrink-0">
          <div className="flex items-center justify-between text-on-surface-variant text-xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-primary leading-none" data-icon="shield_lock">
                shield_lock
              </span>
              <span className="font-label-sm text-[11px]">Security Vault</span>
            </div>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
          </div>

          <div className="flex items-center justify-between text-on-surface-variant/70 text-xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm leading-none" data-icon="terminal">
                terminal
              </span>
              <span className="font-label-sm text-[11px]">Telemetry Logs</span>
            </div>
            <span className="font-mono text-[10px] text-primary/80">v4.8.2-auric</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
