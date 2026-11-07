"use client";

import React, { useEffect, useState } from "react";
import { MetricCard } from "@/frontend/components/glass/MetricCard";
import { GlassPanel } from "@/frontend/components/glass/GlassPanel";
import Link from "next/link";

interface DashboardMetricsData {
  totalGrossRevenue: number;
  outstandingInvoicesAmount: number;
  outstandingInvoicesCount: number;
  overdueInvoicesAmount: number;
  overdueInvoicesCount: number;
  availableLiquidity: number;
  taxVaultAmount: number;
  institutionalHealthScore: number;
  runwayMonths: number;
  activeClientsCount: number;
  activeMilestonesCount: number;
}

export function DashboardLiveBannerAndMetrics() {
  const [metrics, setMetrics] = useState<DashboardMetricsData>({
    totalGrossRevenue: 128450.0,
    outstandingInvoicesAmount: 14200.0,
    outstandingInvoicesCount: 3,
    overdueInvoicesAmount: 1500.0,
    overdueInvoicesCount: 1,
    availableLiquidity: 42880.5,
    taxVaultAmount: 28500.0,
    institutionalHealthScore: 94,
    runwayMonths: 8.4,
    activeClientsCount: 6,
    activeMilestonesCount: 2,
  });

  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    fetch("/api/dashboard/metrics")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.metrics) {
          setMetrics(data.metrics);
          if (data.authenticated) setIsAuthenticated(true);
        }
      })
      .catch(() => {});

    fetch("/api/ai/insights")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const d = data?.data || data;
        if (d?.cashflowHealthSummary) {
          setAiExplanation(d.cashflowHealthSummary);
        }
      })
      .catch(() => {});
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(val);
  };

  return (
    <>
      {/* 1. HEADER BANNER & CASHFLOW HEALTH SCORE */}
      <GlassPanel
        elevation={2}
        className="p-6 relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-6"
      >
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container/30 border border-secondary/30 text-secondary text-xs font-medium font-mono">
              <span
                className="material-symbols-outlined text-sm leading-none"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                auto_awesome
              </span>
              <span>{isAuthenticated ? "Live Firebase Database Synchronized" : "Autonomous Guardian (Demo Profile)"}</span>
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-mono">
              <span className="material-symbols-outlined text-xs">payments</span>
              <span>PayPal Sandbox Rails Active</span>
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-mono">
              <span className="material-symbols-outlined text-xs">smart_toy</span>
              <span>Gemini 3.5 Flash Connected</span>
            </span>
          </div>

          <h2 className="font-headline-md text-xl lg:text-2xl text-on-surface font-semibold">
            Institutional Financial Health:{" "}
            <span className="text-primary font-numeric-metric font-bold">
              {metrics.institutionalHealthScore}/100
            </span>
          </h2>

          <p className="font-body-md text-xs lg:text-sm text-on-surface-variant max-w-2xl mt-1 leading-relaxed">
            {aiExplanation ? (
              <span>{aiExplanation}</span>
            ) : (
              <>
                Your liquidity runway is secure through Q4. Runway is calculated at{" "}
                <strong className="text-on-surface font-medium">{metrics.runwayMonths} months</strong>.{" "}
                {metrics.overdueInvoicesCount > 0
                  ? `${metrics.overdueInvoicesCount} prompt action recommended for Acme Corp to mitigate an 18-day projected pinch.`
                  : "All active receivables are on-schedule."}
              </>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10 shrink-0">
          <Link
            href="/ai/rescue"
            className="px-4 py-2.5 rounded-lg bg-surface-container-high border border-error/40 text-error hover:bg-error-container/20 text-xs font-semibold flex items-center gap-2 transition-all"
          >
            <span className="material-symbols-outlined text-base leading-none">crisis_alert</span>
            <span>View Rescue Plan</span>
          </Link>

          <Link
            href="/ai/copilot"
            className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-secondary-container to-surface-container-high border border-secondary/40 text-secondary hover:text-white text-xs font-semibold violet-glow flex items-center gap-2 transition-all"
          >
            <span
              className="material-symbols-outlined text-base leading-none"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              auto_awesome
            </span>
            <span>Audit Cash Pipeline</span>
          </Link>
        </div>

        {/* Decorative auric/violet gradient orb */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-gradient-to-br from-primary/10 via-secondary/15 to-transparent blur-3xl pointer-events-none" />
      </GlassPanel>

      {/* QUICK TOUR & ONBOARDING BENTO STRIP */}
      <div className="p-3.5 rounded-xl bg-surface-container-lowest/90 border border-outline-variant/30 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-primary/20 text-primary font-mono font-semibold uppercase text-[10px]">
            Hackathon Demo Guide
          </span>
          <span className="text-on-surface-variant hidden md:inline">
            Explore core autonomous workflows:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Link
            href="/invoices"
            className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-on-surface flex items-center gap-1 transition-colors"
          >
            <span className="material-symbols-outlined text-xs text-primary">receipt_long</span>
            <span>1. Invoices &amp; PayPal</span>
          </Link>

          <Link
            href="/clients"
            className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-on-surface flex items-center gap-1 transition-colors"
          >
            <span className="material-symbols-outlined text-xs text-secondary">groups</span>
            <span>2. Risk Radar</span>
          </Link>

          <Link
            href="/reminders"
            className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-on-surface flex items-center gap-1 transition-colors"
          >
            <span className="material-symbols-outlined text-xs text-amber-400">send_and_archive</span>
            <span>3. Tone Outreach</span>
          </Link>

          <Link
            href="/milestones"
            className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-on-surface flex items-center gap-1 transition-colors"
          >
            <span className="material-symbols-outlined text-xs text-emerald-400">verified_user</span>
            <span>4. Milestones</span>
          </Link>

          <Link
            href="/ai/copilot"
            className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-on-surface flex items-center gap-1 transition-colors"
          >
            <span className="material-symbols-outlined text-xs text-secondary">psychology</span>
            <span>5. Copilot</span>
          </Link>
        </div>
      </div>

      {/* 2. METRIC BENTO 4-CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          label="Total Gross Revenue"
          value={formatCurrency(metrics.totalGrossRevenue)}
          icon="trending_up"
          iconColor="text-primary"
          trend="+18.4%"
          trendLabel="vs previous 90d"
          trendPositive={true}
        />
        <MetricCard
          label="Outstanding Invoices"
          value={formatCurrency(metrics.outstandingInvoicesAmount)}
          icon="hourglass_top"
          iconColor="text-amber-400"
          valueColor="text-primary"
          trend={`${metrics.outstandingInvoicesCount} invoices`}
          trendLabel={`• ${formatCurrency(metrics.overdueInvoicesAmount)} overdue`}
          trendPositive={false}
        />
        <MetricCard
          label="Available Liquidity"
          value={formatCurrency(metrics.availableLiquidity)}
          icon="account_balance_wallet"
          iconColor="text-secondary"
          trend="Ready for wire"
          trendLabel={`• ${formatCurrency(metrics.taxVaultAmount)} tax set aside`}
          trendPositive={true}
        />
        <MetricCard
          label="Calculated Runway"
          value={`${metrics.runwayMonths} Months`}
          icon="flight_takeoff"
          iconColor="text-emerald-400"
          valueColor="text-emerald-400"
          trend="Zero zero-balance risk"
          trendLabel="until Feb 2026"
          trendPositive={true}
        />
      </div>
    </>
  );
}
