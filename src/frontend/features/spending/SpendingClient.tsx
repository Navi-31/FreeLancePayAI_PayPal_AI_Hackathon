"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface OutflowItem {
  id: string;
  merchant: string;
  desc: string;
  category: "Operations" | "Software" | "Growth" | "Hardware";
  date: string;
  method: string;
  isRecurring: boolean;
  amount: number;
}

const INITIAL_OUTFLOWS: OutflowItem[] = [
  {
    id: "out-1",
    merchant: "AWS Compute",
    desc: "us-east-1 Elastic Grid Clusters",
    category: "Operations",
    date: "Apr 14, 2025",
    method: "Stripe Card (*8821)",
    isRecurring: true,
    amount: 320.5,
  },
  {
    id: "out-2",
    merchant: "Figma Enterprise",
    desc: "Annual Seat Licensing (Design Systems)",
    category: "Software",
    date: "Apr 10, 2025",
    method: "PayPal Business (*1902)",
    isRecurring: true,
    amount: 145.0,
  },
  {
    id: "out-3",
    merchant: "Anthropic Claude API",
    desc: "Batch Reasoning & Dossier Generation",
    category: "Software",
    date: "Apr 08, 2025",
    method: "Stripe Card (*8821)",
    isRecurring: false,
    amount: 284.1,
  },
  {
    id: "out-4",
    merchant: "GitHub Enterprise",
    desc: "CoPilot & CI/CD Compute Runners",
    category: "Operations",
    date: "Apr 04, 2025",
    method: "Stripe Card (*8821)",
    isRecurring: true,
    amount: 42.0,
  },
  {
    id: "out-5",
    merchant: "Apple Store SOHO",
    desc: "M3 Max Studio Rig Terminal",
    category: "Hardware",
    date: "Mar 28, 2025",
    method: "Treasury Wire Reserve",
    isRecurring: false,
    amount: 3499.0,
  },
  {
    id: "out-6",
    merchant: "Vercel Pro",
    desc: "Serverless Edge Functions & Analytics",
    category: "Operations",
    date: "Mar 22, 2025",
    method: "Stripe Card (*8821)",
    isRecurring: true,
    amount: 60.0,
  },
];

export function SpendingClient() {
  const [outflows, setOutflows] = useState<OutflowItem[]>(INITIAL_OUTFLOWS);
  const [filterType, setFilterType] = useState<"ALL" | "RECURRING" | "CAPITAL">("ALL");
  const [purchaseAmount, setPurchaseAmount] = useState<number>(1200);
  const [timeRange, setTimeRange] = useState<"YTD" | "12M">("YTD");
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [isLiveDb, setIsLiveDb] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // New Outflow Form
  const [newMerchant, setNewMerchant] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState<OutflowItem["category"]>("Operations");
  const [newAmount, setNewAmount] = useState("250.00");
  const [newMethod, setNewMethod] = useState("PayPal Business");
  const [newIsRecurring, setNewIsRecurring] = useState(false);

  useEffect(() => {
    fetch("/api/spending")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.expenses && Array.isArray(data.expenses) && data.expenses.length > 0) {
          const mapped: OutflowItem[] = data.expenses.map((e: Record<string, unknown>) => ({
            id: String(e.id),
            merchant: String(e.merchant),
            desc: String(e.description || ""),
            category: (e.category as OutflowItem["category"]) || "Operations",
            date: typeof e.date === "string" ? e.date.split("T")[0] : "Recently",
            method: String(e.method || "PayPal Business"),
            isRecurring: Boolean(e.isRecurring),
            amount: Number(e.amount),
          }));
          setOutflows(mapped);
          setIsLiveDb(true);
        }
      })
      .catch(() => {});
  }, []);

  // Financial buffer baseline
  const liquidBuffer = 42880.5;
  const upcomingOpex = 14820.0;
  const postPurchaseCushion = liquidBuffer - purchaseAmount;
  const emergencyMonthsImpact = (purchaseAmount / upcomingOpex) * 2;
  const taxShield = Math.round(purchaseAmount * 0.325 * 100) / 100;

  const isComfortable = postPurchaseCushion >= 25000;

  const filteredOutflows = outflows.filter((item) => {
    if (filterType === "RECURRING") return item.isRecurring;
    if (filterType === "CAPITAL") return item.category === "Hardware";
    return true;
  });

  const triggerConsolidation = () => {
    setActionNotice("Optimized 3 idle developer seats: Saved $420/yr. Local audit committed.");
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMerchant.trim()) return;

    const amt = parseFloat(newAmount) || 50;
    const optimisticId = `out-${Date.now()}`;
    const todayDate = new Date().toISOString().split("T")[0];
    const newEntry: OutflowItem = {
      id: optimisticId,
      merchant: newMerchant.trim(),
      desc: newDesc.trim() || `${newCategory} expense`,
      category: newCategory,
      date: todayDate,
      method: newMethod,
      isRecurring: newIsRecurring,
      amount: amt,
    };

    setOutflows((prev) => [newEntry, ...prev]);
    setIsAddModalOpen(false);

    try {
      const res = await fetch("/api/spending", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant: newEntry.merchant,
          description: newEntry.desc,
          category: newEntry.category,
          date: todayDate,
          method: newEntry.method,
          isRecurring: newEntry.isRecurring,
          amount: newEntry.amount,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.expense?.id) {
          setOutflows((prev) =>
            prev.map((item) => (item.id === optimisticId ? { ...item, id: data.expense.id } : item))
          );
        }
        setIsLiveDb(true);
        setActionNotice(`[FIRESTORE] Outflow of $${amt.toFixed(2)} for ${newEntry.merchant} recorded.`);
      } else {
        setActionNotice(`Outflow of $${amt.toFixed(2)} recorded to local workspace.`);
      }
    } catch {
      setActionNotice(`Outflow of $${amt.toFixed(2)} recorded to local workspace.`);
    }

    setNewMerchant("");
    setNewDesc("");
    setTimeout(() => setActionNotice(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Action Banner Toast */}
      {actionNotice && (
        <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">verified</span>
            <span>{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-emerald-400 hover:text-white">
            <span className="material-symbols-outlined text-xs">close</span>
          </button>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-outline-variant/20">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-on-surface-variant mb-1">
            <span>TREASURY</span>
            <span>/</span>
            <span className="text-primary font-medium">SPENDING INTELLIGENCE</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-on-surface flex items-center gap-3">
            Spending Intelligence & Outflows
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 border border-primary/30 text-primary flex items-center gap-1 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              {isLiveDb ? "Live Firestore Database" : "Demo Baseline"}
            </span>
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Autonomous expense telemetry, categorized cash outflows, and predictive runway preservation.
          </p>
        </div>

        {/* Time Horizon & Add Outflow */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface-container-high border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/10 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">add_circle</span>
            + Record Outflow
          </button>
          <div className="flex bg-surface-container-lowest p-1 rounded-lg border border-outline-variant/30 text-xs font-medium">
            <button
              onClick={() => setTimeRange("YTD")}
              className={`px-3 py-1.5 rounded-md transition-all ${
                timeRange === "YTD"
                  ? "bg-surface-container-high text-primary border border-primary/20 shadow-sm"
                  : "text-on-surface-variant hover:text-white"
              }`}
            >
              YTD 2025
            </button>
            <button
              onClick={() => setTimeRange("12M")}
              className={`px-3 py-1.5 rounded-md transition-all ${
                timeRange === "12M"
                  ? "bg-surface-container-high text-primary border border-primary/20 shadow-sm"
                  : "text-on-surface-variant hover:text-white"
              }`}
            >
              Trailing 12M
            </button>
          </div>
        </div>
      </div>

      {/* Top Metrics Bento Cluster (4 Cards) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Spending */}
        <div className="p-5 rounded-xl bg-surface-container-low/80 backdrop-blur-xl border border-white/5 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">
              Total Spending
            </span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-sm">query_stats</span>
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary font-mono tracking-tight">$18,420.00</div>
            <div className="flex items-center gap-2 mt-2">
              <span className="flex items-center text-xs text-rose-400 bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-500/30">
                <span className="material-symbols-outlined text-xs">trending_up</span>
                +4.2% MoM
              </span>
              <span className="text-xs text-outline">YTD Outflow</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-on-surface-variant">
            <span>Budget utilization</span>
            <span className="text-white font-medium font-mono">68.2%</span>
          </div>
        </div>

        {/* Monthly Expenses */}
        <div className="p-5 rounded-xl bg-surface-container-low/80 backdrop-blur-xl border border-white/5 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">
              Monthly Expenses
            </span>
            <div className="w-8 h-8 rounded-lg bg-surface-container-high border border-white/10 flex items-center justify-center text-on-surface">
              <span className="material-symbols-outlined text-sm">calendar_today</span>
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white font-mono tracking-tight">$3,420.00</div>
            <div className="flex items-center gap-2 mt-2">
              <span className="flex items-center text-xs text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/20">
                <span className="material-symbols-outlined text-xs">trending_down</span>
                -1.8% vs last mo
              </span>
              <span className="text-xs text-outline">Current cycle</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-on-surface-variant">
            <span>Projected month close</span>
            <span className="text-primary font-medium font-mono">$3,890.00</span>
          </div>
        </div>

        {/* Recurring Subscriptions */}
        <div className="p-5 rounded-xl bg-surface-container-low/80 backdrop-blur-xl border border-white/5 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">
              Recurring Subscriptions
            </span>
            <div className="w-8 h-8 rounded-lg bg-surface-container-high border border-white/10 flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-sm">autorenew</span>
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white font-mono tracking-tight">
              $480.00<span className="text-xs text-on-surface-variant">/mo</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-secondary bg-secondary-container/20 px-1.5 py-0.5 rounded border border-secondary/20">
                14 Active SaaS
              </span>
              <span className="text-xs text-outline">Auto-renewing</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-on-surface-variant">
            <span>Next debit in</span>
            <span className="text-white font-medium">3 days (AWS)</span>
          </div>
        </div>

        {/* Potential Annual Savings */}
        <div className="p-5 rounded-xl bg-surface-container-low/80 backdrop-blur-xl border border-secondary/30 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-secondary uppercase tracking-wider">
              Potential Savings
            </span>
            <div className="w-8 h-8 rounded-lg bg-secondary-container/40 border border-secondary/40 flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-sm">savings</span>
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white font-mono tracking-tight">
              $1,840.00<span className="text-xs text-secondary">/yr</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="flex items-center text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                <span className="material-symbols-outlined text-xs">magic_button</span>
                4 Actions Found
              </span>
              <span className="text-xs text-outline">Autonomous detection</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-on-surface-variant">
            <span>Algorithmic confidence</span>
            <span className="text-secondary font-semibold font-mono">99.4%</span>
          </div>
        </div>
      </section>

      {/* AI Spending Assistant Intelligence Card */}
      <section className="rounded-xl p-5 bg-surface-container-low/90 backdrop-blur-2xl border border-secondary/40 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#7040DB] to-[#9665FF] flex items-center justify-center text-white shadow-lg flex-shrink-0">
              <span className="material-symbols-outlined text-2xl">neurology</span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold text-secondary bg-secondary-container/50 border border-secondary/30 uppercase tracking-wider">
                  AI Wealth Synthesis
                </span>
                <span className="text-xs text-outline">Signal Confidence: High (Zero Tax Impact)</span>
              </div>
              <h2 className="text-lg font-bold text-white">
                Underutilized Developer Subscriptions Detected
              </h2>
              <p className="text-xs text-on-surface-variant mt-1 max-w-3xl leading-relaxed">
                Software expenses increased <span className="text-primary font-semibold">18% this month</span> across 3 underutilized developer tools. Deprecating idle seats saves <span className="text-emerald-400 font-semibold">$420/yr</span> without triggering licensing churn or developer downtime.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <Link
              href="/subscriptions"
              className="px-4 py-2 rounded-lg bg-surface-container-high border border-outline-variant/40 text-on-surface hover:text-white text-xs font-medium transition-all"
            >
              Inspect Subscriptions (14)
            </Link>
            <button
              onClick={triggerConsolidation}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#9665FF] to-[#7040DB] text-white text-xs font-semibold shadow hover:brightness-110 active:scale-[0.98] transition-all"
            >
              <span className="material-symbols-outlined text-base">auto_fix_high</span>
              Deprecate & Consolidate
            </button>
          </div>
        </div>
      </section>

      {/* Visual Analytics Grid: Category Donut (5 cols) + 6-Mo Cash Flow Bars (7 cols) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Distribution Donut */}
        <div className="lg:col-span-5 p-6 rounded-xl bg-surface-container-low/80 backdrop-blur-xl border border-white/5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <div>
                <h3 className="text-base font-semibold text-white">Expense Distribution</h3>
                <p className="text-xs text-outline mt-0.5">By functional operational center</p>
              </div>
              <span className="text-xs text-on-surface-variant bg-surface-container px-2.5 py-1 rounded-md border border-white/5 font-mono">
                {timeRange}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 my-6">
              <div className="relative w-40 h-40 flex-shrink-0 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" fill="transparent" r="38" stroke="#1f1f25" strokeWidth="12" />
                  {/* Software: 34% (circumference ~ 238.76 -> 81.18) */}
                  <circle
                    cx="50"
                    cy="50"
                    fill="transparent"
                    r="38"
                    stroke="#d6ad55"
                    strokeDasharray="81.18 238.76"
                    strokeDashoffset="0"
                    strokeWidth="12"
                  />
                  {/* Operations: 26% -> 62.07 */}
                  <circle
                    cx="50"
                    cy="50"
                    fill="transparent"
                    r="38"
                    stroke="#9665ff"
                    strokeDasharray="62.07 238.76"
                    strokeDashoffset="-81.18"
                    strokeWidth="12"
                  />
                  {/* Growth: 18% -> 42.97 */}
                  <circle
                    cx="50"
                    cy="50"
                    fill="transparent"
                    r="38"
                    stroke="#ff8dd2"
                    strokeDasharray="42.97 238.76"
                    strokeDashoffset="-143.25"
                    strokeWidth="12"
                  />
                  {/* Hardware: 12% -> 28.65 */}
                  <circle
                    cx="50"
                    cy="50"
                    fill="transparent"
                    r="38"
                    stroke="#4ade80"
                    strokeDasharray="28.65 238.76"
                    strokeDashoffset="-186.22"
                    strokeWidth="12"
                  />
                  {/* Travel & Other: 10% -> 23.88 */}
                  <circle
                    cx="50"
                    cy="50"
                    fill="transparent"
                    r="38"
                    stroke="#9a8f7e"
                    strokeDasharray="23.88 238.76"
                    strokeDashoffset="-214.87"
                    strokeWidth="12"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="font-mono text-base text-white font-bold">$18.4k</span>
                  <span className="text-[10px] text-outline uppercase tracking-wider font-mono">Outflows</span>
                </div>
              </div>

              <div className="w-full space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#d6ad55]" />
                    <span className="text-on-surface">Software & SaaS</span>
                  </div>
                  <span className="font-mono font-medium text-white">34% ($6,262)</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#9665ff]" />
                    <span className="text-on-surface">Operations & Cloud</span>
                  </div>
                  <span className="font-mono font-medium text-white">26% ($4,789)</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ff8dd2]" />
                    <span className="text-on-surface">Growth & Marketing</span>
                  </div>
                  <span className="font-mono font-medium text-white">18% ($3,315)</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="text-on-surface">Hardware & Tech</span>
                  </div>
                  <span className="font-mono font-medium text-white">12% ($2,210)</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-outline" />
                    <span className="text-on-surface">Travel & Other</span>
                  </div>
                  <span className="font-mono font-medium text-white">10% ($1,842)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-outline">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-xs text-primary">verified</span>
              Automated GL categorization rate
            </span>
            <span className="text-white font-medium font-mono">98.8%</span>
          </div>
        </div>

        {/* 6-Month Income vs Expenditure Trend */}
        <div className="lg:col-span-7 p-6 rounded-xl bg-surface-container-low/80 backdrop-blur-xl border border-white/5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <div>
                <h3 className="text-base font-semibold text-white">Cash Flow Telemetry: In vs Out</h3>
                <p className="text-xs text-outline mt-0.5">Historical 6-month liquidity generation vs operational burn</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-gradient-to-t from-primary to-[#F0D48B]" />
                  <span className="text-on-surface-variant">Inflow ($)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-gradient-to-t from-[#7040DB] to-secondary" />
                  <span className="text-on-surface-variant">Burn ($)</span>
                </div>
              </div>
            </div>

            {/* Stylized Bar Chart */}
            <div className="h-52 mt-6 flex items-end justify-between gap-3 sm:gap-6 px-2">
              {[
                { month: "Nov", inH: "68%", outH: "26%", inVal: "$12.4k", outVal: "$3.2k" },
                { month: "Dec", inH: "82%", outH: "32%", inVal: "$15.8k", outVal: "$3.6k" },
                { month: "Jan", inH: "74%", outH: "28%", inVal: "$13.9k", outVal: "$3.1k" },
                { month: "Feb", inH: "90%", outH: "30%", inVal: "$17.2k", outVal: "$3.3k" },
                { month: "Mar", inH: "85%", outH: "35%", inVal: "$16.4k", outVal: "$3.5k" },
                { month: "Apr (Est)", inH: "94%", outH: "31%", inVal: "$18.9k", outVal: "$3.4k", active: true },
              ].map((item, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <div className="w-full flex items-end justify-center gap-1 sm:gap-2 h-40 relative group">
                    {item.active && (
                      <div className="absolute -top-3 w-2 h-2 rounded-full bg-primary animate-ping" />
                    )}
                    <div
                      className="w-1/2 max-w-[20px] bg-gradient-to-t from-primary to-[#F0D48B] rounded-t-sm transition-all hover:opacity-90 cursor-pointer"
                      style={{ height: item.inH }}
                      title={`Inflow: ${item.inVal}`}
                    />
                    <div
                      className="w-1/2 max-w-[20px] bg-gradient-to-t from-[#7040DB] to-secondary rounded-t-sm transition-all hover:opacity-90 cursor-pointer"
                      style={{ height: item.outH }}
                      title={`Outflow: ${item.outVal}`}
                    />
                  </div>
                  <span className={`text-[11px] font-mono ${item.active ? "text-primary font-bold" : "text-outline"}`}>
                    {item.month}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs">
            <span className="text-outline">
              Trailing Net Margin: <strong className="text-white font-mono">68.4%</strong>
            </span>
            <span className="text-emerald-400 font-mono font-medium flex items-center gap-1">
              Retained Capital Buffer: +$78,410.00
            </span>
          </div>
        </div>
      </section>

      {/* Interactive Algorithmic Affordability Simulator */}
      <section className="rounded-xl p-6 bg-surface-container-low/80 backdrop-blur-xl border border-white/5 relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">calculate</span>
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Algorithmic Affordability Simulator</h3>
              <p className="text-xs text-on-surface-variant">
                Real-time fiscal stress test against pending tax shields and working capital reserves
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-outline">Scenario:</span>
            <span className="text-xs px-2.5 py-1 rounded bg-surface-container-lowest border border-white/10 text-primary font-mono">
              Hardware / Workstation Upgrade
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 items-center">
          {/* Slider & Inputs (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-medium text-on-surface">
                  Target Purchase Outflow: <span className="text-white font-semibold">&ldquo;Can I afford this item?&rdquo;</span>
                </label>
                <div className="text-primary font-mono text-xl font-bold">
                  ${purchaseAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
              </div>
              <input
                type="range"
                min="200"
                max="6000"
                step="50"
                value={purchaseAmount}
                onChange={(e) => setPurchaseAmount(parseFloat(e.target.value))}
                className="w-full h-2 bg-surface-container rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[11px] font-mono text-outline mt-1.5">
                <span>$200 (Peripheral)</span>
                <span>$1,200 (MacBook / Laptop)</span>
                <span>$3,500 (Studio Rig)</span>
                <span>$6,000 (Full Setup)</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-lg bg-surface-container-lowest border border-white/5">
                <div className="text-[11px] text-outline font-mono">Liquid Buffer</div>
                <div className="font-mono text-sm text-white font-medium mt-0.5">
                  ${liquidBuffer.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] text-emerald-400 mt-0.5">High liquidity reserve</div>
              </div>
              <div className="p-3 rounded-lg bg-surface-container-lowest border border-white/5">
                <div className="text-[11px] text-outline font-mono">Upcoming OPEX</div>
                <div className="font-mono text-sm text-white font-medium mt-0.5">
                  ${upcomingOpex.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] text-on-surface-variant mt-0.5">Next 60 days locked</div>
              </div>
              <div className="p-3 rounded-lg bg-surface-container-lowest border border-white/5 col-span-2 sm:col-span-1">
                <div className="text-[11px] text-outline font-mono">Section 179 Write-off</div>
                <div className="font-mono text-sm text-primary font-medium mt-0.5">32.5%</div>
                <div className="text-[10px] text-outline mt-0.5">
                  Est. Tax Shield: ${taxShield.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Assessment Output Card (5 cols) */}
          <div className="lg:col-span-5 p-5 rounded-xl bg-gradient-to-b from-surface-container-high to-surface-container-low border border-primary/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-outline uppercase tracking-wider font-semibold">
                  Autonomous Assessment
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold border flex items-center gap-1 ${
                    isComfortable
                      ? "text-emerald-400 bg-emerald-950/60 border-emerald-500/30"
                      : "text-yellow-400 bg-yellow-950/60 border-yellow-500/30"
                  }`}
                >
                  <span className="material-symbols-outlined text-xs">
                    {isComfortable ? "check_circle" : "warning"}
                  </span>
                  {isComfortable ? "Comfortable — Zero Breach Risk" : "Moderate Risk — Review Cashflow"}
                </span>
              </div>

              <div className="space-y-2.5 mt-4 text-xs">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-on-surface-variant">Post-purchase Liquid Cushion:</span>
                  <span className="text-white font-mono font-bold">
                    ${postPurchaseCushion.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-on-surface-variant">Emergency Runway Impact:</span>
                  <span className="text-emerald-400 font-mono font-medium">
                    -{emergencyMonthsImpact.toFixed(2)} months
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-on-surface-variant">Recommended Payment Routing:</span>
                  <span className="text-primary font-medium">Stripe Card (1.5% Auric Cash Back)</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-[11px] text-outline font-mono">Deterministic ML Model #SIM-89192</span>
              <button
                onClick={() => {
                  setActionNotice(`Outflow of $${purchaseAmount.toFixed(2)} simulated and pre-authorized into cash plan.`);
                }}
                className="text-xs text-primary hover:text-white flex items-center gap-1 font-semibold transition-colors"
              >
                Pre-authorize Outflow
                <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Granular Outflows Ledger */}
      <section className="rounded-xl bg-surface-container-low/80 backdrop-blur-xl border border-white/5 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-white">Granular Outflows Ledger</h3>
            <p className="text-xs text-outline mt-0.5">Continuous transaction telemetry and automated vendor tags</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-surface-container-lowest p-1 rounded-lg border border-white/10 text-xs">
              {(["ALL", "RECURRING", "CAPITAL"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setFilterType(mode)}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    filterType === mode
                      ? "bg-surface-container text-white font-medium"
                      : "text-outline hover:text-white"
                  }`}
                >
                  {mode === "ALL" ? "All Types" : mode === "RECURRING" ? "Recurring" : "Capital Assets"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/5 bg-surface-container-lowest/60 text-[11px] uppercase tracking-wider text-outline font-mono">
                <th className="py-3 px-4">Merchant / Vendor</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Transaction Date</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4 text-center">Cycle Type</th>
                <th className="py-3 px-4 text-right">Amount (USD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredOutflows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-on-surface-variant">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <span className="material-symbols-outlined text-4xl text-outline">account_balance_wallet</span>
                      <div className="font-semibold text-sm text-on-surface">No outflows recorded</div>
                      <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
                        Record cloud expenses, tooling seats, or capital purchases to forecast runway and safe harbors.
                      </p>
                      <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-on-primary-fixed text-xs font-semibold shadow hover:brightness-110"
                      >
                        <span className="material-symbols-outlined text-sm">add_circle</span>
                        + Record First Outflow
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOutflows.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-surface-container-high border border-outline-variant/30 flex items-center justify-center text-primary font-bold text-xs">
                          {item.merchant.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-white text-sm">{item.merchant}</div>
                          <div className="text-outline text-[11px]">{item.desc}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-surface-container text-on-surface border border-white/5">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-on-surface-variant font-mono">{item.date}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-on-surface">
                        <span className="material-symbols-outlined text-xs text-primary">credit_card</span>
                        <span>{item.method}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          item.isRecurring
                            ? "bg-secondary/20 text-secondary border border-secondary/30"
                            : "bg-surface-container text-outline"
                        }`}
                      >
                        {item.isRecurring ? "Recurring" : "One-Time"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-sm text-white">
                      ${item.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Record Outflow Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-surface-container-low border border-primary/30 rounded-2xl shadow-2xl overflow-hidden p-6">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30 mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">payments</span>
                <h3 className="font-headline-sm text-base font-semibold text-on-surface">Record Business Outflow</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-on-surface-variant hover:text-white">
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-4 text-xs">
              <div>
                <label className="block text-on-surface-variant font-medium mb-1">Merchant / Vendor</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AWS, Figma, Google Cloud"
                  value={newMerchant}
                  onChange={(e) => setNewMerchant(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container border border-outline-variant/40 text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-on-surface-variant font-medium mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Production Cluster Compute"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container border border-outline-variant/40 text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-on-surface-variant font-medium mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as OutflowItem["category"])}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container border border-outline-variant/40 text-on-surface focus:outline-none focus:border-primary"
                  >
                    <option value="Operations">Operations</option>
                    <option value="Software">Software</option>
                    <option value="Growth">Growth</option>
                    <option value="Hardware">Hardware</option>
                  </select>
                </div>

                <div>
                  <label className="block text-on-surface-variant font-medium mb-1">Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container border border-outline-variant/40 text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-on-surface-variant font-medium mb-1">Payment Method</label>
                  <select
                    value={newMethod}
                    onChange={(e) => setNewMethod(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container border border-outline-variant/40 text-on-surface focus:outline-none focus:border-primary"
                  >
                    <option value="PayPal Business">PayPal Business</option>
                    <option value="Stripe Card (*8821)">Stripe Card (*8821)</option>
                    <option value="Direct ACH Transfer">Direct ACH Transfer</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-on-surface-variant">
                    <input
                      type="checkbox"
                      checked={newIsRecurring}
                      onChange={(e) => setNewIsRecurring(e.target.checked)}
                      className="rounded border-outline-variant text-primary focus:ring-primary"
                    />
                    <span>Recurring monthly?</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-outline-variant/30">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface-variant hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-primary text-on-primary-fixed font-semibold hover:brightness-110 shadow"
                >
                  Save to Firestore Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
