"use client";

import React from "react";
import Link from "next/link";
import { AppLayout } from "@/frontend/components/layout/AppLayout";
import { GlassPanel } from "@/frontend/components/glass/GlassPanel";
import { DashboardLiveBannerAndMetrics } from "@/frontend/features/dashboard/DashboardLiveMetrics";
import { useAuth } from "@/frontend/features/auth/AuthContext";

export function DashboardClient() {
  const { user } = useAuth();
  const displayName = user?.name ? user.name.split(" ")[0] : "Operator";

  return (
    <AppLayout
      pageTitle={`Good evening, ${displayName}`}
      pageSubtitle="Your freelance financial assistant is active"
      userBadge={user?.badge || "PRO VIP"}
    >
      <div className="space-y-6">
        <DashboardLiveBannerAndMetrics />

        {/* ============================================================ */}
        {/* 3. DYNAMIC VISUAL REVENUE TRAJECTORY & CASH BREAKDOWN        */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart Container (2 cols) */}
          <GlassPanel elevation={1} className="lg:col-span-2 p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-headline-sm text-sm lg:text-base font-semibold text-on-surface">
                  Income &amp; Cash Inflows
                </h3>
                <p className="font-body-sm text-xs text-on-surface-variant">
                  Real-time income tracking, client payments &amp; payouts
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-1 rounded bg-surface-container-high text-on-surface font-medium border border-outline-variant/30">
                  H1 2026
                </span>
              </div>
            </div>

            {/* SVG Vector Sparkline / Area Chart */}
            <div className="w-full h-52 relative mt-2">
              <svg
                className="w-full h-full"
                fill="none"
                preserveAspectRatio="none"
                viewBox="0 0 600 200"
              >
                <defs>
                  <linearGradient id="auricGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#f4c86d" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#f4c86d" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="violetGradient" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor="#9665FF" />
                    <stop offset="100%" stopColor="#f4c86d" />
                  </linearGradient>
                </defs>

                {/* Baseline Grid */}
                <line stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" x1="0" x2="600" y1="50" y2="50" />
                <line stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" x1="0" x2="600" y1="100" y2="100" />
                <line stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" x1="0" x2="600" y1="150" y2="150" />

                {/* Area Fill */}
                <path
                  d="M 0 160 Q 100 130 180 90 T 340 70 T 480 30 T 600 20 L 600 200 L 0 200 Z"
                  fill="url(#auricGradient)"
                />

                {/* Trajectory Line */}
                <path
                  d="M 0 160 Q 100 130 180 90 T 340 70 T 480 30 T 600 20"
                  stroke="url(#violetGradient)"
                  strokeLinecap="round"
                  strokeWidth="3.5"
                />

                {/* Milestone Marker Dots */}
                <circle cx="180" cy="90" fill="#131319" r="5" stroke="#9665FF" strokeWidth="2.5" />
                <circle cx="340" cy="70" fill="#131319" r="5" stroke="#f4c86d" strokeWidth="2.5" />
                <circle className="animate-pulse" cx="480" cy="30" fill="#f4c86d" r="6" stroke="#ffffff" strokeWidth="2" />
              </svg>
            </div>

            <div className="flex items-center justify-between text-[11px] text-on-surface-variant pt-3 border-t border-outline-variant/20 mt-3 font-mono">
              <span>JAN ($14.2k)</span>
              <span>FEB ($18.9k)</span>
              <span>MAR ($22.1k)</span>
              <span>APR ($28.5k)</span>
              <span>MAY ($34.0k)</span>
              <span className="text-primary font-semibold">JUN (Projected $42k)</span>
            </div>
          </GlassPanel>

          {/* Cashflow Breakdown & AI Action proposals */}
          <GlassPanel elevation={1} className="p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-headline-sm text-sm lg:text-base font-semibold text-on-surface">
                  Income Allocation &amp; Savings
                </h3>
                <span className="text-[11px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                  AUTOMATED ALLOCATION
                </span>
              </div>
              <p className="font-body-sm text-xs text-on-surface-variant mb-4">
                Automatically sets aside money for business expenses, taxes, and take-home pay.
              </p>

              <div className="space-y-3.5">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-on-surface font-medium">Operating &amp; Living Expenses</span>
                    <span className="font-mono text-on-surface font-semibold">$24,800 (62%)</span>
                  </div>
                  <div className="w-full bg-surface-container-high rounded-full h-2 overflow-hidden">
                    <div className="bg-[#9665FF] h-2 rounded-full" style={{ width: "62%" }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-on-surface font-medium">Tax Savings Reserve (25%)</span>
                    <span className="font-mono text-[#f4c86d] font-semibold">$10,000 (25%)</span>
                  </div>
                  <div className="w-full bg-surface-container-high rounded-full h-2 overflow-hidden">
                    <div className="bg-[#f4c86d] h-2 rounded-full" style={{ width: "25%" }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-on-surface font-medium">Take-Home Pay / Owner Draw</span>
                    <span className="font-mono text-[#10b981] font-semibold">$5,200 (13%)</span>
                  </div>
                  <div className="w-full bg-surface-container-high rounded-full h-2 overflow-hidden">
                    <div className="bg-[#10b981] h-2 rounded-full" style={{ width: "13%" }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-outline-variant/20 mt-4">
              <Link
                href="/tax"
                className="w-full py-2.5 px-3 rounded-lg bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/30 text-xs text-on-surface font-medium flex items-center justify-between transition-colors"
              >
                <span>Adjust Tax &amp; Savings Rules</span>
                <span className="text-primary">&rarr;</span>
              </Link>
            </div>
          </GlassPanel>
        </div>

        {/* Quick Shortcuts Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link
            href="/invoices"
            className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 hover:border-primary/40 transition-all flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-surface-container-lowest transition-colors">
              <span className="text-xl">&bull;</span>
            </div>
            <div>
              <div className="text-xs font-semibold text-on-surface group-hover:text-primary transition-colors">Invoices</div>
              <div className="text-[11px] text-on-surface-variant">Create &amp; send to clients</div>
            </div>
          </Link>

          <Link
            href="/milestones"
            className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 hover:border-primary/40 transition-all flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-lg bg-[#9665FF]/10 flex items-center justify-center text-[#9665FF] group-hover:bg-[#9665FF] group-hover:text-white transition-colors">
              <span className="text-xl">&bull;</span>
            </div>
            <div>
              <div className="text-xs font-semibold text-on-surface group-hover:text-[#9665FF] transition-colors">Milestones</div>
              <div className="text-[11px] text-on-surface-variant">Escrow locking</div>
            </div>
          </Link>

          <Link
            href="/reminders"
            className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 hover:border-primary/40 transition-all flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-lg bg-[#10b981]/10 flex items-center justify-center text-[#10b981] group-hover:bg-[#10b981] group-hover:text-white transition-colors">
              <span className="text-xl">&bull;</span>
            </div>
            <div>
              <div className="text-xs font-semibold text-on-surface group-hover:text-[#10b981] transition-colors">AI Outreach</div>
              <div className="text-[11px] text-on-surface-variant">Approved dispatch</div>
            </div>
          </Link>

          <Link
            href="/treasury"
            className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 hover:border-primary/40 transition-all flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-lg bg-[#f4c86d]/10 flex items-center justify-center text-[#f4c86d] group-hover:bg-[#f4c86d] group-hover:text-surface-container-lowest transition-colors">
              <span className="text-xl">&bull;</span>
            </div>
            <div>
              <div className="text-xs font-semibold text-on-surface group-hover:text-[#f4c86d] transition-colors">Treasury</div>
              <div className="text-[11px] text-on-surface-variant">Cash flow &amp; liquidity</div>
            </div>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
