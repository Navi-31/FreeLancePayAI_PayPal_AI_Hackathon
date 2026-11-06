"use client";

import React, { useState, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ScenarioPreset {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  tagColor: string;
  delayDays: number;
  ratePercent: number;
  monthlyExpenseDelta: number;
  taxRatePercent: number;
}

const PRESETS: ScenarioPreset[] = [
  {
    id: "p1",
    title: "Biggest Client Pays 20 Days Late",
    subtitle: "Stress-tests Acme Corp & Horizon delays",
    tag: "ACTIVE SCENARIO",
    tagColor: "border-primary text-primary bg-primary/10",
    delayDays: 20,
    ratePercent: 0,
    monthlyExpenseDelta: 0,
    taxRatePercent: 20,
  },
  {
    id: "p2",
    title: "Increase Rates by 15%",
    subtitle: "Retainer and hourly expansion model",
    tag: "EXPANSION",
    tagColor: "border-secondary/30 text-secondary bg-secondary/10",
    delayDays: 0,
    ratePercent: 15,
    monthlyExpenseDelta: 0,
    taxRatePercent: 20,
  },
  {
    id: "p3",
    title: "Lose Largest Retainer",
    subtitle: "Apex Media termination (-$12k/mo shock)",
    tag: "WORST CASE",
    tagColor: "border-error/30 text-error bg-error/10",
    delayDays: 0,
    ratePercent: -30,
    monthlyExpenseDelta: 0,
    taxRatePercent: 20,
  },
  {
    id: "p4",
    title: "Land 2 Enterprise Projects",
    subtitle: "Growth runway simulation (+$16,000)",
    tag: "GROWTH",
    tagColor: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10",
    delayDays: 0,
    ratePercent: 35,
    monthlyExpenseDelta: 800,
    taxRatePercent: 25,
  },
  {
    id: "p5",
    title: "Save 25% to High-Yield Vault",
    subtitle: "Continuous wealth velocity & tax moat",
    tag: "SAVINGS",
    tagColor: "border-secondary/30 text-secondary bg-secondary/10",
    delayDays: 0,
    ratePercent: 0,
    monthlyExpenseDelta: -400,
    taxRatePercent: 25,
  },
];

const SIM_BASELINE = {
  monthlyRevenue: 15500,
  monthlyExpenses: 4200,
  currentCash: 42880.5,
  baselineRunwayMonths: 8.4,
  baselineNetAnnual: 138387.4,
  safetyBuffer: 20000,
};

export const SimulatorClient: React.FC = () => {
  const [activePresetId, setActivePresetId] = useState<string>("p1");
  const [delayDays, setDelayDays] = useState(20);
  const [ratePercent, setRatePercent] = useState(0);
  const [monthlyExpenseDelta, setMonthlyExpenseDelta] = useState(0);
  const [taxRatePercent, setTaxRatePercent] = useState(20);
  const [isLiveDb, setIsLiveDb] = useState<boolean>(false);
  const [simBaseline, setSimBaseline] = useState(SIM_BASELINE);

  useEffect(() => {
    fetch("/api/dashboard/metrics")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.metrics && data.authenticated) {
          setSimBaseline((prev) => ({
            ...prev,
            currentCash: data.metrics.availableLiquidity,
            baselineRunwayMonths: data.metrics.runwayMonths,
          }));
          setIsLiveDb(true);
        }
      })
      .catch(() => {});
  }, []);
  const [savedScenarios, setSavedScenarios] = useState<
    Array<{ id: string; name: string; runway: string; valley: string; timestamp: string }>
  >([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleApplyPreset = (preset: ScenarioPreset) => {
    setActivePresetId(preset.id);
    setDelayDays(preset.delayDays);
    setRatePercent(preset.ratePercent);
    setMonthlyExpenseDelta(preset.monthlyExpenseDelta);
    setTaxRatePercent(preset.taxRatePercent);
  };

  const handleReset = () => {
    setDelayDays(0);
    setRatePercent(0);
    setMonthlyExpenseDelta(0);
    setTaxRatePercent(20);
    setActivePresetId("");
  };

  // Deterministic simulation math
  const sim = useMemo(() => {
    const adjustedRevenue = simBaseline.monthlyRevenue * (1 + ratePercent / 100);
    const adjustedExpenses = simBaseline.monthlyExpenses + monthlyExpenseDelta;
    const taxDeduction = (adjustedRevenue * taxRatePercent) / 100;
    const netMonthlyProfit = adjustedRevenue - adjustedExpenses - taxDeduction;

    // Delay impact on Day 30 cash valley
    const delayCashDrag = (delayDays / 30) * (adjustedRevenue * 0.7);
    const simulatedValley = Math.max(
      0,
      Math.round((simBaseline.currentCash - delayCashDrag + (netMonthlyProfit > 0 ? 0 : netMonthlyProfit)) * 100) / 100
    );

    // Simulated runway
    const burnRate = Math.max(1000, adjustedExpenses);
    const simulatedRunwayMonths =
      netMonthlyProfit >= 0
        ? Math.min(24, Math.round((simulatedValley / burnRate + 8) * 10) / 10)
        : Math.max(1.2, Math.round((simulatedValley / (burnRate + Math.abs(netMonthlyProfit))) * 10) / 10);

    const simulatedAnnualNet = Math.round(netMonthlyProfit * 12 * 100) / 100;
    const riskLevel =
      simulatedValley < simBaseline.safetyBuffer ? "Elevated Risk" : simulatedValley < 30000 ? "Moderate" : "Low Risk";

    return {
      adjustedRevenue: Math.round(adjustedRevenue),
      adjustedExpenses: Math.round(adjustedExpenses),
      simulatedValley,
      simulatedRunwayMonths,
      simulatedAnnualNet,
      riskLevel,
      runwayDelta: Math.round((simulatedRunwayMonths - simBaseline.baselineRunwayMonths) * 10) / 10,
      valleyDelta: Math.round(simulatedValley - simBaseline.currentCash),
      annualDelta: Math.round(simulatedAnnualNet - simBaseline.baselineNetAnnual),
    };
  }, [delayDays, ratePercent, monthlyExpenseDelta, taxRatePercent, simBaseline]);

  const handleSaveScenario = () => {
    const newEntry = {
      id: `scen-${Date.now()}`,
      name: `Scenario (Delay ${delayDays}d, Rates ${ratePercent >= 0 ? "+" : ""}${ratePercent}%)`,
      runway: `${sim.simulatedRunwayMonths} mos`,
      valley: `$${sim.simulatedValley.toLocaleString()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setSavedScenarios((prev) => [newEntry, ...prev]);
    setToastMessage(`[SCENARIO SAVED] Recorded snapshot in local memory.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-400 text-base">verified</span>
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-400 font-semibold text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-outline-variant/20">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-headline-lg text-2xl md:text-3xl font-semibold tracking-tight text-on-surface">
              What-If Financial Simulator
            </h1>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-secondary-container/20 text-secondary border border-secondary/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
              {isLiveDb ? "Live Neon Simulation Base" : "Deterministic Sandbox — Zero Real-World Execution"}
            </span>
          </div>
          <p className="text-on-surface-variant text-sm font-body-md mt-1">
            Explore strategic business decisions and stress-test your cashflow before executing.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap text-xs">
          <button
            onClick={handleReset}
            className="px-3.5 py-2 rounded-lg bg-surface-container border border-outline-variant/40 text-on-surface-variant hover:text-on-surface flex items-center gap-1.5 transition-all"
          >
            <span className="material-symbols-outlined text-base">refresh</span>
            Reset Baseline
          </button>
          <button
            onClick={handleSaveScenario}
            className="px-3.5 py-2 rounded-lg bg-surface-container border border-outline-variant/40 text-on-surface hover:border-primary/50 flex items-center gap-1.5 transition-all"
          >
            <span className="material-symbols-outlined text-base">bookmark</span>
            Save Scenario
          </button>
          <button
            onClick={() => setIsCompareModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-secondary-container to-secondary text-white font-medium shadow-sm hover:brightness-110 flex items-center gap-1.5 transition-all"
          >
            <span className="material-symbols-outlined text-base">compare_arrows</span>
            Compare Saved ({savedScenarios.length})
          </button>
        </div>
      </section>

      {/* Preset Blueprints Slider Bar */}
      <section className="space-y-2">
        <div className="flex items-center justify-between text-xs text-on-surface-variant">
          <span className="uppercase tracking-wider font-semibold text-[10px]">Simulated Strategy Blueprints</span>
          <span>5 Institutional Presets</span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
          {PRESETS.map((p) => {
            const isSelected = p.id === activePresetId;

            return (
              <div
                key={p.id}
                onClick={() => handleApplyPreset(p)}
                className={cn(
                  "min-w-[260px] flex-1 p-3.5 rounded-xl border backdrop-blur-xl cursor-pointer transition-all relative overflow-hidden group select-none",
                  isSelected
                    ? "bg-surface-container-high border-2 border-primary/80 shadow-[0_0_20px_rgba(244,200,109,0.15)] ring-1 ring-primary/20"
                    : "bg-surface-container-lowest/80 border-outline-variant/30 hover:bg-surface-container-low"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={cn("px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border", p.tagColor)}>
                    {p.tag}
                  </span>
                  <span className="material-symbols-outlined text-base text-outline">tune</span>
                </div>
                <h3 className="font-semibold text-xs text-on-surface group-hover:text-primary transition-colors">
                  {p.title}
                </h3>
                <p className="text-[11px] text-on-surface-variant mt-1 leading-snug">{p.subtitle}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Main Working Bento: Sliders on Left (55%), Before/After on Right (45%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Interactive Parameter Sliders */}
        <section className="lg:col-span-7 p-6 rounded-2xl bg-surface-container-lowest/90 border border-outline-variant/30 shadow-md space-y-6">
          <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3">
            <span className="text-xs font-semibold text-white flex items-center gap-1.5">
              <span className="material-symbols-outlined text-secondary text-sm">tune</span>
              Variable Financial Controls
            </span>
            <span className="text-[10px] font-mono text-outline">Real-time Model</span>
          </div>

          {/* Slider 1: Payment Delay */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-on-surface font-medium">Counterparty Payment Delay</span>
              <span className="font-bold text-primary font-mono">{delayDays} Days Past Net-14</span>
            </div>
            <input
              type="range"
              min={0}
              max={60}
              step={1}
              value={delayDays}
              onChange={(e) => {
                setDelayDays(Number(e.target.value));
                setActivePresetId("");
              }}
              className="w-full accent-primary bg-surface-container-high h-2 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-outline">
              <span>0 Days (On Time)</span>
              <span>30 Days</span>
              <span>60 Days Late</span>
            </div>
          </div>

          {/* Slider 2: Rate Adjustment */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-on-surface font-medium">Pricing &amp; Rate Adjustment</span>
              <span className={cn("font-bold font-mono", ratePercent >= 0 ? "text-emerald-400" : "text-error")}>
                {ratePercent >= 0 ? `+${ratePercent}%` : `${ratePercent}%`} Retainer Index
              </span>
            </div>
            <input
              type="range"
              min={-30}
              max={50}
              step={5}
              value={ratePercent}
              onChange={(e) => {
                setRatePercent(Number(e.target.value));
                setActivePresetId("");
              }}
              className="w-full accent-secondary bg-surface-container-high h-2 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-outline">
              <span>-30% Discount</span>
              <span>0% (Current)</span>
              <span>+50% Increase</span>
            </div>
          </div>

          {/* Slider 3: Monthly Overhead Delta */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-on-surface font-medium">Monthly Overhead / Tooling Shift</span>
              <span className="font-bold font-mono text-on-surface">
                {monthlyExpenseDelta >= 0 ? `+$${monthlyExpenseDelta}` : `-$${Math.abs(monthlyExpenseDelta)}`} / month
              </span>
            </div>
            <input
              type="range"
              min={-1000}
              max={4000}
              step={100}
              value={monthlyExpenseDelta}
              onChange={(e) => {
                setMonthlyExpenseDelta(Number(e.target.value));
                setActivePresetId("");
              }}
              className="w-full accent-primary bg-surface-container-high h-2 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-outline">
              <span>-$1,000 (Cut SaaS)</span>
              <span>Baseline ($4,200)</span>
              <span>+$4,000 (Contractors)</span>
            </div>
          </div>

          {/* Slider 4: Tax Set-Aside Rate */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-on-surface font-medium">Autonomous Tax Shield Set-Aside</span>
              <span className="font-bold text-secondary font-mono">{taxRatePercent}% Segregated</span>
            </div>
            <input
              type="range"
              min={10}
              max={40}
              step={1}
              value={taxRatePercent}
              onChange={(e) => {
                setTaxRatePercent(Number(e.target.value));
                setActivePresetId("");
              }}
              className="w-full accent-secondary bg-surface-container-high h-2 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-outline">
              <span>10% (Low)</span>
              <span>20% (Default)</span>
              <span>40% (Aggressive)</span>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: Comparative Impact Matrix (Before vs After) */}
        <section className="lg:col-span-5 p-6 rounded-2xl bg-surface-container-lowest/90 border border-secondary/30 shadow-2xl space-y-5">
          <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3">
            <span className="text-xs font-semibold text-white flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-sm">equalizer</span>
              Before vs. After Impact Assessment
            </span>
            <span
              className={cn(
                "px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider",
                sim.riskLevel === "Low Risk" && "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
                sim.riskLevel === "Moderate" && "bg-primary/15 text-primary border border-primary/30",
                sim.riskLevel === "Elevated Risk" && "bg-error/15 text-error border border-error/30"
              )}
            >
              {sim.riskLevel}
            </span>
          </div>

          {/* Metric 1: Financial Runway */}
          <div className="p-3.5 rounded-xl bg-surface-container-high/50 border border-outline-variant/30 space-y-1 text-xs">
            <div className="flex justify-between items-center text-on-surface-variant">
              <span>Projected Cash Runway</span>
              <span className={sim.runwayDelta >= 0 ? "text-emerald-400 font-bold" : "text-error font-bold"}>
                {sim.runwayDelta >= 0 ? `+${sim.runwayDelta}` : `${sim.runwayDelta}`} Months Delta
              </span>
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <div>
                <span className="text-[10px] text-outline block">Baseline:</span>
                <span className="text-on-surface font-semibold text-sm">{simBaseline.baselineRunwayMonths} mos</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-outline block">Simulated:</span>
                <span className="text-primary font-bold text-xl">{sim.simulatedRunwayMonths} mos</span>
              </div>
            </div>
          </div>

          {/* Metric 2: 30-Day Liquidity Valley */}
          <div className="p-3.5 rounded-xl bg-surface-container-high/50 border border-outline-variant/30 space-y-1 text-xs">
            <div className="flex justify-between items-center text-on-surface-variant">
              <span>Lowest Predicted Cash Valley</span>
              <span className={sim.valleyDelta >= 0 ? "text-emerald-400 font-bold" : "text-error font-bold"}>
                {sim.valleyDelta >= 0 ? `+$${sim.valleyDelta.toLocaleString()}` : `-$${Math.abs(sim.valleyDelta).toLocaleString()}`}
              </span>
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <div>
                <span className="text-[10px] text-outline block">Current Reserve:</span>
                <span className="text-on-surface font-semibold text-sm">
                  ${simBaseline.currentCash.toLocaleString()}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-outline block">Projected Valley:</span>
                <span className="text-primary font-bold text-xl">${sim.simulatedValley.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Metric 3: Net Annual Yield */}
          <div className="p-3.5 rounded-xl bg-surface-container-high/50 border border-outline-variant/30 space-y-1 text-xs">
            <div className="flex justify-between items-center text-on-surface-variant">
              <span>Annual Net Income (Simulated)</span>
              <span className={sim.annualDelta >= 0 ? "text-emerald-400 font-bold" : "text-error font-bold"}>
                {sim.annualDelta >= 0 ? `+$${sim.annualDelta.toLocaleString()}` : `-$${Math.abs(sim.annualDelta).toLocaleString()}`}
              </span>
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <div>
                <span className="text-[10px] text-outline block">Current Annual:</span>
                <span className="text-on-surface font-semibold text-sm">
                  ${simBaseline.baselineNetAnnual.toLocaleString()}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-outline block">Scenario Net:</span>
                <span className="text-secondary font-bold text-xl">${sim.simulatedAnnualNet.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/20 text-[11px] text-on-surface-variant">
            <strong className="text-primary block mb-0.5">Autonomous Simulation Insight:</strong>
            {delayDays > 14
              ? "Notice: Delaying client receipts beyond 14 days causes your liquid valley to dip sharply. Activating pre-due payment reminders is strongly recommended."
              : ratePercent > 0
              ? "Rate expansion increases your annual net yield significantly without adding additional hours of delivery work."
              : "All model parameters are currently operating in safety equilibrium."}
          </div>
        </section>
      </div>

      {/* Compare Modal */}
      {isCompareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsCompareModalOpen(false)} />
          <div className="relative z-10 w-full max-w-xl rounded-2xl bg-surface-container-lowest border border-outline-variant/30 p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-outline-variant/20">
              <h3 className="font-semibold text-base text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">compare_arrows</span>
                Saved Simulation Scenarios
              </h3>
              <button onClick={() => setIsCompareModalOpen(false)} className="text-outline hover:text-white text-sm">
                ✕
              </button>
            </div>

            {savedScenarios.length === 0 ? (
              <div className="py-8 text-center text-xs text-on-surface-variant">
                No saved scenarios yet. Adjust the sliders and click &quot;Save Scenario&quot; to build comparison snapshots.
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar text-xs">
                {savedScenarios.map((s) => (
                  <div
                    key={s.id}
                    className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/20 flex justify-between items-center"
                  >
                    <div>
                      <span className="font-semibold text-on-surface block">{s.name}</span>
                      <span className="text-[10px] text-outline">Saved at {s.timestamp}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-primary font-bold block">{s.runway} Runway</span>
                      <span className="text-[11px] text-on-surface-variant">Valley {s.valley}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 text-right">
              <button
                onClick={() => setIsCompareModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-surface-container text-xs text-on-surface"
              >
                Close Comparison
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
