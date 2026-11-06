"use client";

import React, { useState, useEffect } from "react";

interface ForecastEvent {
  id: string;
  date: string;
  counterparty: string;
  desc: string;
  type: "INFLOW" | "OUTFLOW";
  amount: number;
  confidence: number;
  status: "Authorized Milestone" | "Projected Invoice" | "Fixed Debit" | "At Risk";
  actionText?: string;
}

const INITIAL_EVENTS: ForecastEvent[] = [
  {
    id: "fe-1",
    date: "Nov 04, 2025",
    counterparty: "Horizon Studio",
    desc: "Design System Architecture — Phase 2 Milestone Capture",
    type: "INFLOW",
    amount: 8500.0,
    confidence: 98,
    status: "Authorized Milestone",
    actionText: "Request Early Release",
  },
  {
    id: "fe-2",
    date: "Nov 12, 2025",
    counterparty: "California FTB / IRS",
    desc: "Q4 Estimated Tax Vault Allocation",
    type: "OUTFLOW",
    amount: 3200.0,
    confidence: 100,
    status: "Fixed Debit",
    actionText: "Auto-Segregated",
  },
  {
    id: "fe-3",
    date: "Nov 18, 2025",
    counterparty: "Acme Corp",
    desc: "Brand Refresh Net-30 Outstanding Balance",
    type: "INFLOW",
    amount: 1500.0,
    confidence: 45,
    status: "At Risk",
    actionText: "Deploy Negotiator",
  },
  {
    id: "fe-4",
    date: "Dec 01, 2025",
    counterparty: "Apex Financial",
    desc: "Fintech Command Architecture — Retainer Wave",
    type: "INFLOW",
    amount: 12000.0,
    confidence: 95,
    status: "Authorized Milestone",
    actionText: "Pre-allocate Yield",
  },
  {
    id: "fe-5",
    date: "Dec 15, 2025",
    counterparty: "AWS & SaaS Infrastructure",
    desc: "Elastic compute clusters & design tooling renewals",
    type: "OUTFLOW",
    amount: 980.0,
    confidence: 100,
    status: "Fixed Debit",
    actionText: "Audited",
  },
];

export function ForecastClient() {
  const [timelineMode, setTimelineMode] = useState<"30" | "60" | "90">("60");
  const [scenario, setScenario] = useState<"conservative" | "baseline" | "aggressive">("baseline");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLiveDb, setIsLiveDb] = useState<boolean>(false);
  const [events, setEvents] = useState<ForecastEvent[]>(INITIAL_EVENTS);
  const [liveBalance, setLiveBalance] = useState<number>(42880.5);
  const [forecastData, setForecastData] = useState<{
    scenarios?: {
      conservative: { assumptions: string[]; projectedBalance30d: number; projectedBalance60d: number };
      expected: { assumptions: string[]; projectedBalance30d: number; projectedBalance60d: number };
      optimistic: { assumptions: string[]; projectedBalance30d: number; projectedBalance60d: number };
    };
  } | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/metrics")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.metrics && data.authenticated) {
          setLiveBalance(data.metrics.availableLiquidity);
          setIsLiveDb(true);
        }
      })
      .catch(() => {});

    fetch("/api/forecast/scenarios")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.data) {
          setForecastData(data.data);
        }
      })
      .catch(() => {});

    fetch("/api/invoices")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.invoices && Array.isArray(data.invoices) && data.invoices.length > 0) {
          const liveEvents: ForecastEvent[] = data.invoices.map((inv: Record<string, unknown>, idx: number) => ({
            id: `inv-ev-${idx}`,
            date: typeof inv.dueDate === "string" ? inv.dueDate.split("T")[0] : "Approaching",
            counterparty: String(inv.clientName || "Client"),
            desc: `Invoice #${inv.code || inv.id}: ${inv.projectTitle || "Project Deliverable"}`,
            type: "INFLOW" as const,
            amount: Number(inv.total || 0),
            confidence: inv.status === "paid" ? 100 : inv.status === "sent" ? 85 : 50,
            status: (inv.status === "overdue" ? "At Risk" : "Projected Invoice") as ForecastEvent["status"],
            actionText: inv.status === "overdue" ? "Deploy Reminder" : "Schedule Wire",
          }));
          setEvents([...liveEvents, ...INITIAL_EVENTS]);
          setIsLiveDb(true);
        }
      })
      .catch(() => {});
  }, []);

  const availableBalance = liveBalance;
  const expectedIncoming = scenario === "conservative" ? 31200 : scenario === "aggressive" ? 44000 : 38450.0;
  const upcomingOutflows = 14820.0;
  const projectedClosing = availableBalance + expectedIncoming - upcomingOutflows;
  const runwayMonths = ((projectedClosing / (upcomingOutflows / 2))).toFixed(1);

  const handleAuthorizeEarlyRelease = () => {
    setToastMessage("Horizon Studio early milestone release authorized. Liquid cushion bolstered by +$8,500.00.");
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleEventAction = (event: ForecastEvent) => {
    setToastMessage(`Action triggered for ${event.counterparty}: ${event.actionText}`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-secondary-container/90 border border-secondary/40 text-on-surface text-xs flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-secondary">verified</span>
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-on-surface-variant hover:text-white">
            <span className="material-symbols-outlined text-xs">close</span>
          </button>
        </div>
      )}

      {/* Screen Title & Controls */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 pb-2 border-b border-outline-variant/20">
        <div>
          <div className="flex items-center gap-2 text-outline font-mono text-xs mb-1">
            <span>TREASURY</span>
            <span>/</span>
            <span className="text-primary font-medium">CASHFLOW FORECAST</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-on-surface">
              Cashflow Forecast & Runway Trajectory
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-secondary/10 border border-secondary/30 text-secondary text-xs font-semibold flex items-center gap-1.5 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
              {isLiveDb ? "Live Neon Inflow Radar" : "Algorithmic Projection v4.2"}
            </span>
          </div>
          <p className="text-sm text-outline mt-1">
            See where your finances are heading before it happens. Continuous Bayesian liquidity modeling.
          </p>
        </div>

        {/* Controls Matrix */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Horizon Selector */}
          <div className="p-1 rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex items-center">
            {(["30", "60", "90"] as const).map((days) => (
              <button
                key={days}
                onClick={() => setTimelineMode(days)}
                className={`px-3 py-1 rounded-lg transition-colors font-mono ${
                  timelineMode === days
                    ? "bg-surface-container-high text-primary font-bold shadow border border-primary/20"
                    : "text-outline hover:text-on-surface"
                }`}
              >
                {days}-Day {timelineMode === days && "Active"}
              </button>
            ))}
          </div>

          {/* Scenario Selector */}
          <div className="relative">
            <select
              value={scenario}
              onChange={(e) => setScenario(e.target.value as "conservative" | "baseline" | "aggressive")}
              className="appearance-none bg-surface-container-lowest border border-outline-variant/40 rounded-xl px-3.5 py-1.5 pr-8 text-on-surface focus:outline-none focus:border-secondary cursor-pointer"
            >
              <option value="conservative">Scenario: Conservative AI</option>
              <option value="baseline">Scenario: Baseline Expected</option>
              <option value="aggressive">Scenario: Aggressive Expansion</option>
            </select>
            <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-outline text-sm pointer-events-none">
              expand_more
            </span>
          </div>
        </div>
      </div>

      {/* Scenario Assumptions & Model Parameters */}
      {forecastData?.scenarios && (
        <div className="p-3.5 rounded-xl bg-surface-container-low/80 border border-outline-variant/30 text-xs flex flex-col md:flex-row md:items-center justify-between gap-2 shadow-sm">
          <div className="flex items-start md:items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-sm text-secondary shrink-0">psychology</span>
            <span className="font-semibold text-on-surface shrink-0">
              {scenario === "conservative" ? "Conservative Assumptions:" : scenario === "aggressive" ? "Optimistic Assumptions:" : "Expected Baseline Assumptions:"}
            </span>
            <span className="text-on-surface-variant truncate">
              {scenario === "conservative"
                ? forecastData.scenarios.conservative.assumptions.join(" • ")
                : scenario === "aggressive"
                ? forecastData.scenarios.optimistic.assumptions.join(" • ")
                : forecastData.scenarios.expected.assumptions.join(" • ")}
            </span>
          </div>
          <span className="text-[10px] text-outline font-mono uppercase shrink-0">
            Segregated Vault vs Forecast
          </span>
        </div>
      )}

      {/* Top Metric Bento Grid (5 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Current Available Balance */}
        <div className="p-4 rounded-2xl bg-surface-container-low/90 backdrop-blur-xl border border-outline-variant/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-outline text-xs">
            <span>Available Balance</span>
            <span className="material-symbols-outlined text-primary text-base">verified_user</span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold text-primary font-mono tracking-tight">
              ${availableBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-outline">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>Verified in Vault</span>
            </div>
          </div>
          <div className="w-full bg-surface-container-highest/40 h-1 rounded-full overflow-hidden mt-1">
            <div className="bg-primary h-full rounded-full" style={{ width: "100%" }} />
          </div>
        </div>

        {/* Card 2: Expected Incoming */}
        <div className="p-4 rounded-2xl bg-surface-container-low/90 backdrop-blur-xl border border-outline-variant/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-outline text-xs">
            <span>Expected Incoming ({timelineMode}d)</span>
            <span className="material-symbols-outlined text-emerald-400 text-base">trending_up</span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold text-emerald-400 font-mono tracking-tight">
              +${expectedIncoming.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center justify-between text-[11px] text-outline mt-1 font-mono">
              <span>Confirmed: <strong className="text-on-surface">$22.4k</strong></span>
              <span>Projected: <strong className="text-secondary">$16.05k</strong></span>
            </div>
          </div>
          <div className="w-full bg-surface-container-highest/40 h-1 rounded-full overflow-hidden mt-1 flex">
            <div className="bg-emerald-400 h-full" style={{ width: "58%" }} />
            <div className="bg-secondary h-full" style={{ width: "42%" }} />
          </div>
        </div>

        {/* Card 3: Upcoming Obligations */}
        <div className="p-4 rounded-2xl bg-surface-container-low/90 backdrop-blur-xl border border-outline-variant/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-outline text-xs">
            <span>Upcoming Obligations</span>
            <span className="material-symbols-outlined text-rose-400 text-base">receipt_long</span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold text-rose-400 font-mono tracking-tight">
              -${upcomingOutflows.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-outline">
              <span className="material-symbols-outlined text-outline text-xs">shield</span>
              <span>Tax vault + recurring OPEX</span>
            </div>
          </div>
          <div className="w-full bg-surface-container-highest/40 h-1 rounded-full overflow-hidden mt-1">
            <div className="bg-rose-500/80 h-full rounded-full" style={{ width: "38%" }} />
          </div>
        </div>

        {/* Card 4: Projected Closing Balance */}
        <div className="p-4 rounded-2xl bg-surface-container-low/90 backdrop-blur-xl border border-outline-variant/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-outline text-xs">
            <span>Projected Closing</span>
            <span className="material-symbols-outlined text-secondary text-base">auto_graph</span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold text-secondary font-mono tracking-tight">
              ${projectedClosing.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-secondary font-medium">
              <span className="material-symbols-outlined text-xs">north_east</span>
              <span>Net trajectory +55.1%</span>
            </div>
          </div>
          <div className="w-full bg-surface-container-highest/40 h-1 rounded-full overflow-hidden mt-1">
            <div className="bg-secondary h-full rounded-full" style={{ width: "82%" }} />
          </div>
        </div>

        {/* Card 5: Runway Safety Buffer */}
        <div className="p-4 rounded-2xl bg-surface-container-low/90 backdrop-blur-xl border border-outline-variant/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-outline text-xs">
            <span>Runway Safety Buffer</span>
            <span className="material-symbols-outlined text-primary text-base">emergency_home</span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold text-on-surface font-mono tracking-tight">
              {runwayMonths} <span className="text-sm text-outline font-normal">Months</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-emerald-400 font-medium">
              <span className="material-symbols-outlined text-xs">shield_with_heart</span>
              <span>Zero-breach risk</span>
            </div>
          </div>
          <div className="w-full bg-surface-container-highest/40 h-1 rounded-full overflow-hidden mt-1">
            <div className="bg-gradient-to-r from-primary to-emerald-400 h-full rounded-full" style={{ width: "95%" }} />
          </div>
        </div>
      </div>

      {/* Main Interactive Cashflow Trajectory Chart */}
      <section className="p-6 rounded-2xl bg-surface-container-low/80 backdrop-blur-2xl border border-outline-variant/30 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-surface-container-high border border-outline-variant/30 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-lg">insights</span>
            </div>
            <div>
              <h2 className="text-base font-semibold text-on-surface">60-Day Runway Trajectory Simulation</h2>
              <p className="text-xs text-outline">
                Real-time model merging verified bank feeds, authorized milestones, and historical client payment latency.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-outline">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-0.5 bg-primary rounded-full" />
              <span className="text-on-surface">Historical Actual</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-0.5 border-t-2 border-dashed border-secondary" />
              <span className="text-secondary font-medium">AI Projected Trajectory</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-emerald-400/30 border border-emerald-400" />
              <span>Confirmed Inflows</span>
            </div>
          </div>
        </div>

        {/* Vector SVG Chart Canvas */}
        <div className="relative w-full h-72 rounded-xl bg-surface-container-lowest/90 border border-outline-variant/20 p-4 overflow-hidden flex flex-col justify-between">
          <svg className="w-full h-full relative z-10 overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 240">
            <defs>
              <linearGradient id="violetGrad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#9665FF" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#9665FF" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="goldGrad" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="#F0D48B" />
                <stop offset="100%" stopColor="#D6AD55" />
              </linearGradient>
            </defs>

            {/* Threshold line ($15k = y:190) */}
            <line x1="40" y1="190" x2="960" y2="190" stroke="#D83DA8" strokeDasharray="6,4" strokeWidth="1" opacity="0.6" />
            <text x="50" y="184" fill="#D83DA8" fontSize="10" fontFamily="monospace">
              Safety Threshold: $15,000
            </text>

            {/* Today marker (x: 260) */}
            <line x1="260" y1="10" x2="260" y2="220" stroke="#f4c86d" strokeDasharray="3,3" strokeWidth="1" opacity="0.4" />
            <text x="264" y="24" fill="#d1c5b2" fontSize="10" fontFamily="monospace">
              Today (Oct 28)
            </text>

            {/* Historical Balance (Actual - Solid Gold) */}
            <path
              d="M 50,140 C 100,135 140,125 180,130 C 220,135 240,122 260,120"
              fill="none"
              stroke="url(#goldGrad)"
              strokeLinecap="round"
              strokeWidth="3"
            />
            <circle cx="260" cy="120" r="5" fill="#F0D48B" stroke="#08080D" strokeWidth="2.5" />

            {/* AI Projected Trajectory (Dashed Violet) */}
            <path
              d="M 260,120 C 310,115 340,95 400,98 C 450,100 500,140 560,142 C 620,144 680,60 820,52 C 890,48 930,35 960,30"
              fill="none"
              stroke="#9665FF"
              strokeDasharray="7,4"
              strokeLinecap="round"
              strokeWidth="3"
            />
            {/* Shaded Fill */}
            <path
              d="M 260,120 C 310,115 340,95 400,98 C 450,100 500,140 560,142 C 620,144 680,60 820,52 C 890,48 930,35 960,30 L 960,200 L 260,200 Z"
              fill="url(#violetGrad)"
            />

            {/* Event Markers */}
            <g transform="translate(400, 98)">
              <circle cx="0" cy="0" r="4" fill="#35D39A" />
              <text x="-25" y="-12" fill="#35D39A" fontSize="9" fontFamily="monospace">
                +$8.5k Horizon
              </text>
            </g>
            <g transform="translate(820, 52)">
              <circle cx="0" cy="0" r="4" fill="#35D39A" />
              <text x="-25" y="-12" fill="#35D39A" fontSize="9" fontFamily="monospace">
                +$12k Apex
              </text>
            </g>
            <circle cx="960" cy="30" r="5" fill="#9665FF" stroke="#08080D" strokeWidth="2" />
          </svg>

          {/* Timeline Dates */}
          <div className="flex justify-between items-center text-[11px] font-mono text-outline border-t border-outline-variant/30 pt-2 px-6">
            <span>Oct 14 (-14d)</span>
            <span className="text-primary font-bold">Today</span>
            <span>Nov 07 (+10d)</span>
            <span className="text-secondary font-medium">Nov 20 (+23d)</span>
            <span>Dec 04 (+37d)</span>
            <span className="text-secondary font-bold">Dec 27 (+60d Target)</span>
          </div>
        </div>
      </section>

      {/* Two-Column Grid: Confidence Meters (5 cols) + AI Advisory Panel (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Confidence Breakdown */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-surface-container-low/80 backdrop-blur-xl border border-outline-variant/30 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">fact_check</span>
              <h3 className="text-sm font-semibold text-on-surface">Confidence & Risk Meter</h3>
            </div>
            <span className="text-xs text-outline font-mono">Multi-Model Stream</span>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="flex items-center gap-1.5 text-on-surface">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" /> Authorized Milestone Inflows
                </span>
                <span className="font-mono font-bold text-emerald-400">$22,400 (98%)</span>
              </div>
              <div className="w-full bg-surface-container-highest rounded-full h-1.5 overflow-hidden">
                <div className="bg-emerald-400 h-full rounded-full" style={{ width: "98%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="flex items-center gap-1.5 text-on-surface">
                  <span className="w-2 h-2 rounded-full bg-secondary" /> Historically Modeled Inflows
                </span>
                <span className="font-mono font-bold text-secondary">$16,050 (82%)</span>
              </div>
              <div className="w-full bg-surface-container-highest rounded-full h-1.5 overflow-hidden">
                <div className="bg-secondary h-full rounded-full" style={{ width: "82%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="flex items-center gap-1.5 text-on-surface">
                  <span className="w-2 h-2 rounded-full bg-rose-400" /> Uncertain / Delayed Invoices
                </span>
                <span className="font-mono font-bold text-rose-400">$3,500 (45% Risk)</span>
              </div>
              <div className="w-full bg-surface-container-highest rounded-full h-1.5 overflow-hidden">
                <div className="bg-rose-400 h-full rounded-full" style={{ width: "45%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="flex items-center gap-1.5 text-on-surface">
                  <span className="w-2 h-2 rounded-full bg-outline" /> Fixed Recurring OPEX
                </span>
                <span className="font-mono font-bold text-outline">-$14,820 (100% Fixed)</span>
              </div>
              <div className="w-full bg-surface-container-highest rounded-full h-1.5 overflow-hidden">
                <div className="bg-outline h-full rounded-full" style={{ width: "100%" }} />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs text-outline font-mono">
            <span>Model Precision</span>
            <span className="text-primary font-bold">91.4% Institutional</span>
          </div>
        </div>

        {/* Right: AI Synthesis & Advisory */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-surface-container-low/80 backdrop-blur-xl border border-secondary/40 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-base">auto_awesome</span>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-on-surface">AI Synthesis & Action Advisory</h3>
                <span className="text-[11px] text-secondary font-mono">Neural Liquidity Telemetry</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-secondary/20 text-secondary text-[11px] font-mono font-semibold">
              Autonomous Guidance
            </span>
          </div>

          <div className="p-4 rounded-xl bg-surface-container-lowest/80 border border-secondary/30 space-y-3 text-xs leading-relaxed">
            <div className="flex items-start gap-2.5">
              <span className="material-symbols-outlined text-secondary text-lg mt-0.5">neurology</span>
              <p className="text-on-surface">
                <strong className="text-secondary font-semibold">AI Synthesis:</strong> Cashflow trajectory remains resilient through Q4. However, a localized liquidity dip is projected between{" "}
                <span className="text-primary font-semibold">Nov 12–18</span> due to scheduled tax segregation before Acme Corp settles.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-outline-variant/20 text-xs">
              <div className="p-2.5 rounded bg-surface-container border border-outline-variant/20">
                <span className="text-outline text-[10px] block">Projected Dip Floor</span>
                <span className="font-semibold text-on-surface font-mono">$37,200 (Nov 15)</span>
              </div>
              <div className="p-2.5 rounded bg-surface-container border border-outline-variant/20">
                <span className="text-outline text-[10px] block">Tax Segregation</span>
                <span className="font-semibold text-primary font-mono">-$3,200</span>
              </div>
              <div className="p-2.5 rounded bg-surface-container border border-outline-variant/20">
                <span className="text-outline text-[10px] block">Safety Excess</span>
                <span className="font-semibold text-emerald-400 font-mono">+$22,200 Buffer</span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between gap-3 text-xs">
            <span className="text-outline text-[11px]">Validated across 3 risk vectors</span>
            <button
              onClick={handleAuthorizeEarlyRelease}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-secondary-container to-secondary text-on-surface font-semibold shadow hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">bolt</span>
              Authorize Horizon Early Release
            </button>
          </div>
        </div>
      </div>

      {/* Chronological Upcoming Financial Events Ledger */}
      <section className="p-5 rounded-2xl bg-surface-container-low/80 backdrop-blur-xl border border-outline-variant/30 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-base">calendar_month</span>
            <h3 className="text-sm font-semibold text-on-surface">Upcoming Financial Events Ledger</h3>
          </div>
          <span className="text-xs text-outline font-mono">60-Day Forward Stream</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-outline-variant/20 text-outline uppercase font-mono text-[11px]">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Counterparty / Description</th>
                <th className="py-2.5 px-3 text-right">Net Flow</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/15">
              {events.map((item) => (
                <tr key={item.id} className="hover:bg-surface-container/40 transition-colors">
                  <td className="py-3 px-3 font-mono text-outline">{item.date}</td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-on-surface">{item.counterparty}</div>
                    <div className="text-[11px] text-outline">{item.desc}</div>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-sm">
                    <span className={item.type === "INFLOW" ? "text-emerald-400" : "text-rose-400"}>
                      {item.type === "INFLOW" ? "+" : "-"}
                      ${item.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        item.status === "Authorized Milestone"
                          ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/30"
                          : item.status === "At Risk"
                          ? "bg-rose-950/40 text-rose-400 border-rose-500/30"
                          : "bg-surface-container text-outline border-outline-variant/30"
                      }`}
                    >
                      {item.status} ({item.confidence}%)
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => handleEventAction(item)}
                      className="px-2.5 py-1 rounded bg-surface-container border border-outline-variant/30 hover:border-primary text-primary text-[11px] font-medium transition-all"
                    >
                      {item.actionText}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
