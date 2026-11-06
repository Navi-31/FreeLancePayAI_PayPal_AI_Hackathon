"use client";

import React, { useEffect, useState } from "react";
import { MetricCard } from "@/components/glass/MetricCard";
import { GlassPanel } from "@/components/glass/GlassPanel";
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
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-secondary-container/30 border border-secondary/30 text-secondary text-xs font-medium mb-3">
            <span
              className="material-symbols-outlined text-sm leading-none"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              auto_awesome
            </span>
            <span>{isAuthenticated ? "Live Neon Database Synchronized" : "Autonomous Guardian Active (Demo Profile)"}</span>
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
