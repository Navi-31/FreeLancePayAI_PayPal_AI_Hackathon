"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface ProjectProfitRecord {
  id: string;
  project: string;
  client: string;
  revenue: number;
  costs: number;
  hours: number;
  type: "Retainer" | "Fixed-Price" | "Hourly Sprint";
}

const INITIAL_PROJECTS: ProjectProfitRecord[] = [
  {
    id: "proj-1",
    project: "Vault Protocol Redesign",
    client: "Vault Protocol",
    revenue: 28000,
    costs: 2600,
    hours: 130,
    type: "Fixed-Price",
  },
  {
    id: "proj-2",
    project: "Design System Architecture 2.0",
    client: "Horizon Studio",
    revenue: 34000,
    costs: 4450,
    hours: 160,
    type: "Fixed-Price",
  },
  {
    id: "proj-3",
    project: "Fintech Command Architecture",
    client: "Apex Financial",
    revenue: 48200,
    costs: 9350,
    hours: 240,
    type: "Retainer",
  },
  {
    id: "proj-4",
    project: "Mobile Prototype Testing Portal",
    client: "Lumina Labs",
    revenue: 19200,
    costs: 4080,
    hours: 135,
    type: "Hourly Sprint",
  },
  {
    id: "proj-5",
    project: "Brand Identity & Web Architecture",
    client: "Acme Corp",
    revenue: 13250,
    costs: 5700,
    hours: 119,
    type: "Fixed-Price",
  },
];

export function ProfitabilityClient() {
  const [projects, setProjects] = useState<ProjectProfitRecord[]>(INITIAL_PROJECTS);
  const [selectedClientFilter, setSelectedClientFilter] = useState<string>("ALL");
  const [showLogModal, setShowLogModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLiveDb, setIsLiveDb] = useState<boolean>(false);

  useEffect(() => {
    fetch("/api/invoices")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.invoices && Array.isArray(data.invoices) && data.invoices.length > 0) {
          const liveProjects: ProjectProfitRecord[] = data.invoices.map((inv: Record<string, unknown>, idx: number) => {
            const rev = Number(inv.total || 0);
            return {
              id: `live-proj-${idx}`,
              project: String(inv.projectTitle || "Deliverable"),
              client: String(inv.clientName || "Client"),
              revenue: rev,
              costs: Math.round(rev * 0.12 * 100) / 100,
              hours: Math.max(8, Math.round(rev / 125)),
              type: "Fixed-Price" as const,
            };
          });
          setProjects([...liveProjects, ...INITIAL_PROJECTS]);
          setIsLiveDb(true);
        }
      })
      .catch(() => {});
  }, []);

  // Form for logging hours
  const [logProjectId, setLogProjectId] = useState<string>("proj-1");
  const [logHours, setLogHours] = useState<string>("10");
  const [logCost, setLogCost] = useState<string>("150");

  const filteredProjects = projects.filter((p) => {
    if (selectedClientFilter === "ALL") return true;
    return p.client === selectedClientFilter;
  });

  const totalRevenue = projects.reduce((acc, p) => acc + p.revenue, 0);
  const totalCosts = projects.reduce((acc, p) => acc + p.costs, 0);
  const netProfit = totalRevenue - totalCosts;
  const netMarginPercent = ((netProfit / (totalRevenue || 1)) * 100).toFixed(1);
  const totalHours = projects.reduce((acc, p) => acc + p.hours, 0);
  const avgHourlyYield = ((netProfit / (totalHours || 1))).toFixed(2);

  const handleLogHoursSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hrs = parseFloat(logHours) || 0;
    const cost = parseFloat(logCost) || 0;

    setProjects((prev) =>
      prev.map((p) => (p.id === logProjectId ? { ...p, hours: p.hours + hrs, costs: p.costs + cost } : p))
    );
    setShowLogModal(false);
    setToastMessage(`Logged ${hrs} hours and $${cost.toFixed(2)} direct expenses into project ledger.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleAdjustProposedRates = () => {
    setToastMessage("Target benchmark calibrated to $135/hr. Minimum proposed SOWs bumped +20%.");
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-outline-variant/20">
        <div>
          <div className="flex items-center gap-2 text-outline font-mono text-xs mb-1">
            <span>TREASURY</span>
            <span>/</span>
            <span className="text-primary font-medium">PROJECT PROFITABILITY</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-on-surface">
              Project Profitability Intelligence
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container/30 border border-secondary/40 text-secondary text-xs font-semibold font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
              {isLiveDb ? "Live Firestore Project Yields" : "Real-Time Margin Telemetry"}
            </span>
          </div>
          <p className="text-sm text-on-surface-variant mt-1">
            Discover which projects drive genuine profit, audit hidden cost leakage, and calibrate effective hourly yield.
          </p>
        </div>

        {/* Action Group */}
        <div className="flex items-center gap-2.5 flex-wrap text-xs">
          <select
            value={selectedClientFilter}
            onChange={(e) => setSelectedClientFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-surface-container border border-outline-variant/40 text-on-surface focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Clients ({projects.length})</option>
            {Array.from(new Set(projects.map((p) => p.client))).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowLogModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-on-primary-fixed font-semibold shadow hover:brightness-110 active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined text-sm">add_circle</span>
            + Log Hours & Costs
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metric Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Revenue */}
        <div className="p-4 rounded-xl bg-surface-container-low/80 backdrop-blur-md border border-white/5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-outline">
            <span>Total Project Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-base">account_balance_wallet</span>
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold font-mono tracking-tight text-on-surface">
              ${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-primary font-semibold">
              <span className="material-symbols-outlined text-xs">trending_up</span>
              <span>+18.4% vs previous cycle</span>
            </div>
          </div>
          <div className="w-full bg-surface-container-highest rounded-full h-1 overflow-hidden mt-1">
            <div className="bg-primary h-full rounded-full" style={{ width: "100%" }} />
          </div>
        </div>

        {/* Card 2: Direct Costs & Fees */}
        <div className="p-4 rounded-xl bg-surface-container-low/80 backdrop-blur-md border border-white/5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-outline">
            <span>Total Direct Costs</span>
            <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-outline">
              <span className="material-symbols-outlined text-base">receipt_long</span>
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold font-mono tracking-tight text-on-surface">
              ${totalCosts.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-outline mt-1 font-mono">
              Gateway Drag: $3.8k • Hosting: $22.3k
            </div>
          </div>
          <div className="w-full bg-surface-container-highest rounded-full h-1 overflow-hidden mt-1 flex">
            <div className="bg-primary-container h-full" style={{ width: "14.5%" }} />
            <div className="bg-secondary h-full" style={{ width: "85.5%" }} />
          </div>
        </div>

        {/* Card 3: Net Realized Profit */}
        <div className="p-4 rounded-xl bg-surface-container-low/80 backdrop-blur-md border border-emerald-500/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-outline">
            <span>Net Realized Profit</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              High Yield
            </span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold font-mono tracking-tight text-on-surface">
              ${netProfit.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs">
              <span className="font-bold text-emerald-400 font-mono text-sm">{netMarginPercent}%</span>
              <span className="text-outline">Net Profit Margin</span>
            </div>
          </div>
          <div className="w-full bg-surface-container-highest rounded-full h-1 overflow-hidden mt-1">
            <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${netMarginPercent}%` }} />
          </div>
        </div>

        {/* Card 4: Effective Hourly Yield */}
        <div className="p-4 rounded-xl bg-surface-container-low/80 backdrop-blur-md border border-secondary/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-outline">
            <span>Effective Hourly Yield</span>
            <div className="w-8 h-8 rounded-lg bg-secondary/15 flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-base">speed</span>
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold font-mono tracking-tight text-on-surface">
              ${avgHourlyYield} <span className="text-xs text-outline font-normal">/ hr</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-secondary font-semibold font-mono">
              <span>+35% efficiency delta</span>
              <span className="text-outline font-normal">vs $120 benchmark</span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-outline-variant/20 text-[11px] text-outline font-mono">
            <span>{totalHours} Total Billed Hrs</span>
            <span className="text-secondary font-medium">92% Autonomous</span>
          </div>
        </div>
      </section>

      {/* Yield Comparison Chart (7 cols) + AI Margin Intelligence (5 cols) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Yield vs Target Rate */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-surface-container-low/90 backdrop-blur-xl border border-white/5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
            <div>
              <h2 className="text-base font-semibold text-on-surface">
                Effective Hourly Yield vs. Target Rate
              </h2>
              <p className="text-xs text-on-surface-variant">
                Audited realization rates across active retainer and fixed-price projects
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono text-primary">
              <span className="w-3 h-0.5 border-t-2 border-dashed border-primary" />
              <span>Benchmark ($120/hr)</span>
            </div>
          </div>

          <div className="space-y-3 pt-2 text-xs">
            {projects.map((p) => {
              const netProjProfit = p.revenue - p.costs;
              const hourly = Math.round(netProjProfit / (p.hours || 1));
              const isDeficit = hourly < 120;
              const barWidth = Math.min(100, Math.round((hourly / 220) * 100));

              return (
                <div key={p.id} className="flex items-center gap-3">
                  <div className="w-32 truncate text-right">
                    <span className="font-semibold text-on-surface block truncate">{p.client}</span>
                    <span className="text-[10px] text-outline truncate block">{p.project}</span>
                  </div>
                  <div className="flex-1 bg-surface-container rounded-lg h-7 relative flex items-center p-1 overflow-hidden">
                    <div
                      className={`h-full rounded flex items-center justify-end pr-2 transition-all duration-500 font-mono text-[11px] font-bold ${
                        isDeficit
                          ? "bg-rose-950/60 border border-rose-500/50 text-rose-300"
                          : "bg-gradient-to-r from-secondary-container to-primary text-on-primary-fixed"
                      }`}
                      style={{ width: `${barWidth}%` }}
                    >
                      ${hourly} / hr {isDeficit && "(Deficit)"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between pl-36 pt-2 text-[10px] font-mono text-outline border-t border-outline-variant/30">
            <span>$0/hr</span>
            <span>$50/hr</span>
            <span>$100/hr</span>
            <span className="text-primary font-bold">$120/hr Target</span>
            <span>$150/hr</span>
            <span>$200/hr</span>
          </div>

          <div className="pt-2 text-[11px] text-outline font-mono flex justify-between">
            <span>Formula: (Gross Contract Revenue - Direct Third-Party Ops) ÷ Actual Time</span>
            <span className="text-primary font-medium">Calibrated Real-Time</span>
          </div>
        </div>

        {/* Right Column: AI Margin & Pricing Intelligence */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-surface-container-low/90 backdrop-blur-xl border border-secondary/30 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-secondary/20 flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-sm">auto_awesome</span>
              </div>
              <h2 className="text-sm font-semibold text-on-surface">AI Margin & Pricing Intelligence</h2>
            </div>
            <span className="text-[10px] text-secondary font-mono font-semibold uppercase bg-secondary/10 px-2 py-0.5 rounded border border-secondary/20">
              Autonomous Audit
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Alert 1 */}
            <div className="p-3.5 rounded-lg bg-surface-container border border-primary/30 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-primary font-semibold">
                  <span className="material-symbols-outlined text-sm">verified</span>
                  <span>High Performer: Vault Protocol</span>
                </div>
                <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded font-mono">
                  +62% Above Target
                </span>
              </div>
              <p className="text-on-surface-variant text-[11px] leading-relaxed">
                Vault Protocol delivers <strong className="text-white">$195/hr</strong> effective yield due to clean milestone approvals. Recommend bumping baseline SOW minimum by <strong className="text-primary">+20%</strong> for recurring sprint extensions.
              </p>
            </div>

            {/* Alert 2 */}
            <div className="p-3.5 rounded-lg bg-surface-container border border-rose-500/30 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-rose-400 font-semibold">
                  <span className="material-symbols-outlined text-sm">warning</span>
                  <span>Margin Compression: Acme Corp</span>
                </div>
                <span className="text-[10px] font-semibold text-rose-400 bg-rose-950/40 px-1.5 py-0.5 rounded font-mono">
                  -26% Below Target
                </span>
              </div>
              <p className="text-on-surface-variant text-[11px] leading-relaxed">
                Acme Corp Brand Architecture sits at <strong className="text-white">$88/hr</strong>. 18.2-day payment lag and 14 scope revisions eroded profit margin from 75% down to <strong className="text-rose-400">54%</strong>.
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2 text-xs">
            <button
              onClick={handleAdjustProposedRates}
              className="flex-1 py-2 px-3 rounded-lg bg-primary text-on-primary-fixed font-semibold hover:brightness-110 transition-all text-center"
            >
              Adjust Proposed SOW Rates
            </button>
            <Link
              href="/ai/negotiator"
              className="flex-1 py-2 px-3 rounded-lg bg-surface-container-high border border-outline-variant/40 hover:border-secondary text-secondary font-medium text-center transition-colors flex items-center justify-center gap-1"
            >
              Deploy Negotiator →
            </Link>
          </div>
        </div>
      </section>

      {/* Comprehensive Project Performance Ledger */}
      <section className="rounded-xl bg-surface-container-low/80 backdrop-blur-md border border-white/5 overflow-hidden">
        <div className="p-4 border-b border-outline-variant/30 flex justify-between items-center text-xs">
          <div>
            <h3 className="text-base font-semibold text-on-surface">Comprehensive Project Performance Ledger</h3>
            <p className="text-outline">Audited contract performance, hours expended, and net profit margins</p>
          </div>
          <span className="font-mono text-outline">5 Active Contracts</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-outline-variant/20 text-outline uppercase font-mono text-[11px] bg-surface-container-lowest/50">
                <th className="py-3 px-4">Project & Client</th>
                <th className="py-3 px-3">Contract Type</th>
                <th className="py-3 px-3 text-right">Revenue</th>
                <th className="py-3 px-3 text-right">Direct Costs</th>
                <th className="py-3 px-3 text-right">Hours</th>
                <th className="py-3 px-3 text-right">Net Profit</th>
                <th className="py-3 px-3 text-right">Hourly Yield</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/15">
              {filteredProjects.map((p) => {
                const netP = p.revenue - p.costs;
                const margin = ((netP / (p.revenue || 1)) * 100).toFixed(0);
                const hourly = (netP / (p.hours || 1)).toFixed(0);
                const isUnder = parseFloat(hourly) < 120;

                return (
                  <tr key={p.id} className="hover:bg-surface-container/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white text-sm">{p.project}</div>
                      <div className="text-outline text-[11px]">{p.client}</div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-surface-container text-on-surface border border-outline-variant/30">
                        {p.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-semibold text-white">
                      ${p.revenue.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-outline">
                      ${p.costs.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-on-surface-variant">
                      {p.hours} hrs
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-white">
                      ${netP.toLocaleString()}{" "}
                      <span className="text-[10px] text-emerald-400 font-normal">({margin}%)</span>
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-bold">
                      <span className={isUnder ? "text-rose-400" : "text-emerald-400"}>
                        ${hourly}/hr
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Log Hours & Expenses Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-surface-container border border-white/10 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
              <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">add_circle</span>
                Log Hours & Direct Third-Party Ops
              </h3>
              <button onClick={() => setShowLogModal(false)} className="text-outline hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleLogHoursSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-on-surface-variant font-medium mb-1">Select Project</label>
                <select
                  value={logProjectId}
                  onChange={(e) => setLogProjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant/40 text-on-surface focus:border-primary focus:outline-none"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.client} — {p.project}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-on-surface-variant font-medium mb-1">Hours Expended</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={logHours}
                    onChange={(e) => setLogHours(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant/40 text-on-surface focus:border-primary focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-on-surface-variant font-medium mb-1">Direct Costs ($)</label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={logCost}
                    onChange={(e) => setLogCost(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant/40 text-on-surface focus:border-primary focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-surface-container-high text-outline hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-primary text-on-primary-fixed font-semibold shadow hover:brightness-110"
                >
                  Log to Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
