"use client";

import React, { useState } from "react";

export function TaxEstimatorClient() {
  const [jurisdiction, setJurisdiction] = useState<string>("US-CA");
  const [entityType, setEntityType] = useState<"LLC" | "SOLE">("LLC");
  const [taxRatio, setTaxRatio] = useState<number>(25);
  const [deductibleOffset, setDeductibleOffset] = useState<number>(24250);
  const [simInflow, setSimInflow] = useState<number>(2000);
  const [vaultSetAside, setVaultSetAside] = useState<number>(28500);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const grossInflows = 142650;
  const taxableBase = Math.max(0, grossInflows - deductibleOffset);
  const suggestedReserve = Math.round((taxableBase * (taxRatio / 100)) * 100) / 100;
  const shieldPercent = Math.min(100, Math.round((vaultSetAside / suggestedReserve) * 100));
  const reserveDelta = suggestedReserve - vaultSetAside;

  // Split calculation
  const simTaxPortion = Math.round((simInflow * (taxRatio / 100)) * 100) / 100;
  const simLiquidPortion = Math.round((simInflow - simTaxPortion) * 100) / 100;

  const handleTopUpReserve = () => {
    setVaultSetAside(suggestedReserve);
    setToastMessage("Tax vault funded to 100% target ($29,600.00). Reserve deficit resolved.");
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleRecalculate = () => {
    setToastMessage("Deterministic tax calculations refreshed across all GL journal ledgers.");
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-primary/20 border border-primary/40 text-primary text-xs flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">verified</span>
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-on-surface hover:text-white">
            <span className="material-symbols-outlined text-xs">close</span>
          </button>
        </div>
      )}

      {/* Screen Title & Sub-header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-outline-variant/20">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-outline mb-1">
            <span>TREASURY</span>
            <span>/</span>
            <span className="text-primary font-medium">TAX SET-ASIDE ESTIMATOR</span>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-on-surface">
              Tax Set-Aside Intelligence
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-container/30 text-secondary border border-secondary/30 flex items-center gap-1 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
              Autonomous Allocator v3.4
            </span>
          </div>
          <p className="text-sm text-on-surface-variant mt-1">
            Institutional-grade predictive tax isolation, continuous tax reserve routing, and quarterly statutory timeline management.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRecalculate}
            className="px-3.5 py-2 rounded-lg bg-surface-container-high border border-primary/40 hover:bg-surface-bright text-primary text-xs font-semibold flex items-center gap-2 transition-all"
          >
            <span className="material-symbols-outlined text-sm">sync</span>
            Recalculate Reserves
          </button>
          <button
            onClick={handleTopUpReserve}
            className="px-3.5 py-2 rounded-lg bg-primary text-on-primary-fixed text-xs font-semibold flex items-center gap-2 shadow hover:brightness-110 active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined text-sm">shield</span>
            Top-up Vault Reserve
          </button>
        </div>
      </div>

      {/* Top Metrics Bento Row (4 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Gross Inflows */}
        <div className="p-5 rounded-xl bg-surface-container-low/80 backdrop-blur-xl border border-white/5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-on-surface-variant uppercase tracking-wider font-mono font-semibold">
              Total Gross Inflows
            </span>
            <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface-variant">
              <span className="material-symbols-outlined text-sm">trending_up</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold font-mono text-on-surface tracking-tight">
              ${grossInflows.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-on-surface-variant">
              <span className="text-primary font-medium">+18.4%</span>
              <span>vs previous fiscal YTD</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Taxable Base */}
        <div className="p-5 rounded-xl bg-surface-container-low/80 backdrop-blur-xl border border-white/5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-on-surface-variant uppercase tracking-wider font-mono font-semibold">
              Estimated Taxable Base
            </span>
            <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-sm">calculate</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold font-mono text-on-surface tracking-tight">
              ${taxableBase.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-on-surface-variant">
              <span className="text-on-surface-variant font-medium font-mono">
                -${deductibleOffset.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
              <span>in deductible offsets</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Suggested Tax Reserve */}
        <div className="p-5 rounded-xl bg-surface-container-low/80 backdrop-blur-xl border border-primary/30 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-primary uppercase tracking-wider font-bold font-mono">
              Suggested Tax Reserve
            </span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-sm">shield</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-primary tracking-tight">
                ${suggestedReserve.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-on-surface-variant font-mono font-semibold">
                @{taxRatio}%
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-on-surface-variant">
              <span className="text-primary font-medium">Optimal</span>
              <span>composite federal + state rate</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Current Vault Set-Aside */}
        <div className="p-5 rounded-xl bg-surface-container-high/60 backdrop-blur-xl border border-primary/50 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-on-surface uppercase tracking-wider font-mono font-semibold">
              Current Vault Set-Aside
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                shieldPercent >= 100
                  ? "bg-emerald-950/50 text-emerald-400 border-emerald-500/30"
                  : "bg-primary/20 text-primary border border-primary/40"
              }`}
            >
              {shieldPercent}% Shielded
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold font-mono text-on-surface tracking-tight">
              ${vaultSetAside.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <div className="w-full bg-surface-container-highest h-2 rounded-full mt-2 overflow-hidden flex">
              <div
                className="bg-gradient-to-r from-primary to-primary-container h-full rounded-full transition-all duration-300"
                style={{ width: `${shieldPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-1.5 text-xs font-mono">
              <span className="text-on-surface-variant">Target: ${suggestedReserve.toFixed(2)}</span>
              {reserveDelta > 0 ? (
                <span className="text-rose-400 font-medium">-${reserveDelta.toFixed(2)} delta</span>
              ) : (
                <span className="text-emerald-400 font-medium">Full Reserve</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Two-Column Interactive Engine: Rules & Auto-Split Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Column Left: Configurable Tax Shield Rules (5 Cols) */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-surface-container-low/80 backdrop-blur-xl border border-outline-variant/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant/20">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-primary border border-outline-variant/30">
                  <span className="material-symbols-outlined text-base">tune</span>
                </div>
                <div>
                  <h2 className="text-base font-semibold text-on-surface">Shield Configuration</h2>
                  <p className="text-xs text-on-surface-variant">Statutory rules & autonomous rate locks</p>
                </div>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant border border-outline-variant/30 font-mono">
                Live Sync
              </span>
            </div>

            <div className="flex flex-col gap-4 mt-5 text-xs">
              {/* Country & Jurisdiction */}
              <div className="space-y-1">
                <label className="text-on-surface-variant font-medium">Tax Jurisdiction & Domicile</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary text-base">
                    public
                  </span>
                  <select
                    value={jurisdiction}
                    onChange={(e) => setJurisdiction(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-lg pl-9 pr-8 py-2 text-on-surface appearance-none focus:outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="US-CA">US — Federal + California State (FTB)</option>
                    <option value="US-NY">US — Federal + New York State (NYSDTF)</option>
                    <option value="US-TX">US — Federal + Texas (No State Income Tax)</option>
                    <option value="EU-DE">EU — Germany (Gewerbesteuer + ESt)</option>
                    <option value="UK-HMRC">UK — HMRC (Sole Trader / Ltd Co)</option>
                  </select>
                </div>
              </div>

              {/* Entity Structure */}
              <div className="space-y-1">
                <label className="text-on-surface-variant font-medium">Filing Structure Entity</label>
                <div className="grid grid-cols-2 gap-2">
                  <label
                    onClick={() => setEntityType("LLC")}
                    className={`flex items-center gap-2 p-2.5 rounded-lg bg-surface-container-lowest border cursor-pointer transition-all ${
                      entityType === "LLC" ? "border-primary/80 bg-primary/5" : "border-outline-variant/30"
                    }`}
                  >
                    <input
                      type="radio"
                      name="entity"
                      checked={entityType === "LLC"}
                      onChange={() => setEntityType("LLC")}
                      className="accent-primary"
                    />
                    <div className="flex flex-col">
                      <span className="font-semibold text-primary">Single LLC / S-Corp</span>
                      <span className="text-[10px] text-on-surface-variant">Pass-through election</span>
                    </div>
                  </label>
                  <label
                    onClick={() => setEntityType("SOLE")}
                    className={`flex items-center gap-2 p-2.5 rounded-lg bg-surface-container-lowest border cursor-pointer transition-all ${
                      entityType === "SOLE" ? "border-primary/80 bg-primary/5" : "border-outline-variant/30"
                    }`}
                  >
                    <input
                      type="radio"
                      name="entity"
                      checked={entityType === "SOLE"}
                      onChange={() => setEntityType("SOLE")}
                      className="accent-primary"
                    />
                    <div className="flex flex-col">
                      <span className="font-semibold text-on-surface">Sole Proprietor</span>
                      <span className="text-[10px] text-on-surface-variant">Schedule C standard</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Target Ratio Slider */}
              <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-on-surface font-medium">Target Set-Aside Ratio</span>
                  <span className="text-base font-bold text-primary font-mono">{taxRatio}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="35"
                  step="1"
                  value={taxRatio}
                  onChange={(e) => setTaxRatio(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-[10px] text-outline font-mono">
                  <span>20% (Conservative)</span>
                  <span>Preset: 25%</span>
                  <span>35% (Aggressive)</span>
                </div>
              </div>

              {/* Deductible Expense Offset */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-on-surface-variant font-medium">Deductible Business Expense Offset</label>
                  <span className="text-secondary text-[11px] flex items-center gap-1 font-medium">
                    <span className="material-symbols-outlined text-xs">auto_awesome</span> AI Synced
                  </span>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-base">
                    receipt_long
                  </span>
                  <input
                    type="number"
                    value={deductibleOffset}
                    onChange={(e) => setDeductibleOffset(parseFloat(e.target.value) || 0)}
                    className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-lg pl-9 pr-14 py-2 font-mono text-on-surface focus:border-primary focus:outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-outline font-mono">
                    USD
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs text-on-surface-variant font-mono">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-primary">lock</span>
              Cryptographically Isolated Vault
            </span>
            <span className="text-on-surface font-bold">APY: 4.85%</span>
          </div>
        </div>

        {/* Column Right: Payment-by-Payment Auto-Split Simulator (7 Cols) */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-surface-container-low/80 backdrop-blur-xl border border-outline-variant/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant/20">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-secondary border border-outline-variant/30">
                  <span className="material-symbols-outlined text-base">call_split</span>
                </div>
                <div>
                  <h2 className="text-base font-semibold text-on-surface">Payment-by-Payment Auto-Split Simulator</h2>
                  <p className="text-xs text-on-surface-variant">Real-time automated tax reserve routing upon webhook execution</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-secondary-container/20 text-secondary border border-secondary-container/40 px-2.5 py-1 rounded-full text-xs font-medium">
                <span className="material-symbols-outlined text-xs">bolt</span>
                <span>Zero-Lag Routing</span>
              </div>
            </div>

            {/* Split Visualization */}
            <div className="mt-5 p-4 rounded-xl bg-surface-container-lowest/80 border border-outline-variant/30 space-y-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Inflow Box */}
                <div className="w-full md:w-1/3 p-3.5 rounded-xl bg-surface-container border border-outline-variant/40 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs text-on-surface-variant">
                    <span className="uppercase font-mono text-[11px]">Incoming Inflow</span>
                    <span className="material-symbols-outlined text-primary text-base">input</span>
                  </div>
                  <div className="text-xl font-bold font-mono text-on-surface">
                    ${simInflow.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[11px] text-on-surface-variant flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span>Stripe ACH / Acme Corp</span>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex md:flex-col items-center justify-center gap-1 text-primary">
                  <span className="material-symbols-outlined rotate-90 md:rotate-0 text-lg animate-pulse">
                    keyboard_double_arrow_right
                  </span>
                  <span className="text-[10px] font-mono tracking-widest text-on-surface-variant uppercase">
                    {taxRatio}% Lock
                  </span>
                </div>

                {/* Splitted Portions */}
                <div className="w-full md:w-1/2 flex flex-col gap-2.5 text-xs">
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/40 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-primary">Tax Reserve Vault</div>
                      <div className="text-[10px] text-on-surface-variant">Yield-bearing treasury note</div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-bold text-primary font-mono">
                        ${simTaxPortion.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-primary/80 font-mono">Auto-isolated ({taxRatio}%)</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-surface-container border border-outline-variant/40 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-on-surface">Net Liquid Operating</div>
                      <div className="text-[10px] text-on-surface-variant">Mercury / Brex instant deposit</div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-bold text-on-surface font-mono">
                        ${simLiquidPortion.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-on-surface-variant font-mono">
                        Free cash-flow ({100 - taxRatio}%)
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preset Inflow Selectors */}
              <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs">
                <span className="text-on-surface-variant">Simulate Inflow Sample:</span>
                <div className="flex items-center gap-1.5 font-mono">
                  {[1500, 2000, 5000, 10000].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setSimInflow(amount)}
                      className={`px-2 py-0.5 rounded text-xs transition-colors ${
                        simInflow === amount
                          ? "bg-primary text-on-primary-fixed font-bold shadow"
                          : "bg-surface-container text-on-surface hover:bg-surface-container-high"
                      }`}
                    >
                      ${amount.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs text-outline font-mono">
            <span>Routing rules execute deterministically in &lt; 40ms</span>
            <span className="text-emerald-400">Zero Tax Breach Risk</span>
          </div>
        </div>
      </div>

      {/* Quarterly Milestone Timeline & Shortfall Radar */}
      <section className="p-6 rounded-2xl bg-surface-container-low/80 backdrop-blur-xl border border-outline-variant/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-primary border border-outline-variant/30">
              <span className="material-symbols-outlined text-base">calendar_month</span>
            </div>
            <div>
              <h2 className="text-base font-semibold text-on-surface">
                Quarterly Statutory Deadlines & Payment Calendar
              </h2>
              <p className="text-xs text-on-surface-variant">
                IRS & California FTB estimated tax schedules (Form 1040-ES)
              </p>
            </div>
          </div>
          {reserveDelta > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs">
              <span className="material-symbols-outlined text-sm">warning</span>
              <span>
                Q4 Projected Reserve Deficit: <strong className="font-mono">-${reserveDelta.toFixed(2)}</strong>
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Q1 */}
          <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/30 flex flex-col justify-between text-xs">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-on-surface text-sm">Quarter 1</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-primary/20 text-primary border border-primary/30 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">check_circle</span> Remitted
                </span>
              </div>
              <div className="text-[11px] text-on-surface-variant mt-1">Statutory: Apr 15</div>
              <div className="mt-3">
                <span className="text-outline text-[11px] block">Obligation Paid</span>
                <span className="text-lg font-bold font-mono text-on-surface">$7,200.00</span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-outline-variant/20 flex justify-between text-[11px] text-outline">
              <span>Status: Cleared</span>
              <span className="text-primary font-mono">Receipt #IRS-882</span>
            </div>
          </div>

          {/* Q2 */}
          <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/30 flex flex-col justify-between text-xs">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-on-surface text-sm">Quarter 2</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-primary/20 text-primary border border-primary/30 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">check_circle</span> Remitted
                </span>
              </div>
              <div className="text-[11px] text-on-surface-variant mt-1">Statutory: Jun 15</div>
              <div className="mt-3">
                <span className="text-outline text-[11px] block">Obligation Paid</span>
                <span className="text-lg font-bold font-mono text-on-surface">$7,200.00</span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-outline-variant/20 flex justify-between text-[11px] text-outline">
              <span>Status: Cleared</span>
              <span className="text-primary font-mono">Receipt #IRS-910</span>
            </div>
          </div>

          {/* Q3 */}
          <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/30 flex flex-col justify-between text-xs">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-on-surface text-sm">Quarter 3</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-primary/20 text-primary border border-primary/30 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">check_circle</span> Remitted
                </span>
              </div>
              <div className="text-[11px] text-on-surface-variant mt-1">Statutory: Sep 15</div>
              <div className="mt-3">
                <span className="text-outline text-[11px] block">Obligation Paid</span>
                <span className="text-lg font-bold font-mono text-on-surface">$7,200.00</span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-outline-variant/20 flex justify-between text-[11px] text-outline">
              <span>Status: Cleared</span>
              <span className="text-primary font-mono">Receipt #IRS-954</span>
            </div>
          </div>

          {/* Q4 (Upcoming) */}
          <div className="p-4 rounded-xl bg-surface-container-high border-2 border-primary/60 flex flex-col justify-between text-xs relative">
            <div className="absolute -top-2.5 right-3 bg-primary text-on-primary text-[9px] font-bold px-2 py-0.5 rounded-full uppercase font-mono tracking-wider">
              Approaching Due
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-primary text-sm">Quarter 4</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-yellow-950/40 text-yellow-400 border border-yellow-500/30 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">schedule</span> Due in 48d
                </span>
              </div>
              <div className="text-[11px] text-on-surface-variant mt-1">Statutory: Jan 15, 2025</div>
              <div className="mt-2.5 space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-on-surface-variant">Required Reserve:</span>
                  <span className="font-mono text-white font-semibold">$8,000.00</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-on-surface-variant">Allocated in Vault:</span>
                  <span className="font-mono text-primary font-semibold">
                    ${(vaultSetAside - 21600).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-outline-variant/20">
              <button
                onClick={handleTopUpReserve}
                className="w-full py-1.5 rounded-lg bg-primary text-on-primary-fixed text-xs font-semibold hover:brightness-110 transition-all"
              >
                Auto-Fund Reserve
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
