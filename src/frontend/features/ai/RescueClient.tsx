"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/shared/utils";
import { ToggleSwitch } from "@/frontend/components/ui/ToggleSwitch";

interface RescueAction {
  id: string;
  title: string;
  description: string;
  impactAmount: number;
  impactScoreBonus: number;
  actionCategory: "liquidation" | "collection" | "expense_cut" | "negotiation";
  enabled: boolean;
}

const RESCUE_BASELINE = {
  liquidBalance: 42880.5,
  safetyBuffer: 20000.0,
  rawValleyPoint: 14200.0,
  baselineScore: 78,
};

export const RescueClient: React.FC = () => {
  const [isLiveDb, setIsLiveDb] = useState<boolean>(false);
  const [baseline, setBaseline] = useState(RESCUE_BASELINE);
  const [actions, setActions] = useState<RescueAction[]>([
    {
      id: "act-1",
      title: "Liquidate High-Yield Buffer into Operating Vault",
      description: "Transfer $5,000.00 from 4.8% APY Treasury Vault to cushion Day-18 payroll dip.",
      impactAmount: 5000,
      impactScoreBonus: 8,
      actionCategory: "liquidation",
      enabled: true,
    },
    {
      id: "act-2",
      title: "Execute Firm Escalation Notice to Acme Corp (#FP-8848)",
      description: "Target delinquent $1,500.00 (14 days past due) with automated late-fee warning.",
      impactAmount: 1500,
      impactScoreBonus: 5,
      actionCategory: "collection",
      enabled: true,
    },
    {
      id: "act-3",
      title: "Freeze 3 Non-Essential Cloud & AI Subscriptions",
      description: "Temporarily pause redundant sandbox subscriptions to save $380.00 this billing cycle.",
      impactAmount: 380,
      impactScoreBonus: 3,
      actionCategory: "expense_cut",
      enabled: false,
    },
    {
      id: "act-4",
      title: "Fast-Track Horizon Studio Net-14 Settlement (#FP-8849)",
      description: "Offer 2% early-pay incentive to pull $8,330.00 forward before the Day-18 valley.",
      impactAmount: 8330,
      impactScoreBonus: 10,
      actionCategory: "negotiation",
      enabled: false,
    },
  ]);

  useEffect(() => {
    fetch("/api/dashboard/metrics")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.metrics && data.authenticated) {
          setBaseline((prev) => ({
            ...prev,
            liquidBalance: data.metrics.availableLiquidity,
            baselineScore: data.metrics.institutionalHealthScore,
          }));
          setIsLiveDb(true);
        }
      })
      .catch(() => {});
  }, []);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [, setIsPlanExecuted] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Live recalculation based on toggles
  const computed = useMemo(() => {
    const activeActions = actions.filter((a) => a.enabled);
    const totalRelief = activeActions.reduce((sum, a) => sum + a.impactAmount, 0);
    const scoreBonus = activeActions.reduce((sum, a) => sum + a.impactScoreBonus, 0);

    const projectedValley = Math.round((baseline.rawValleyPoint + totalRelief) * 100) / 100;
    const projectedScore = Math.min(99, baseline.baselineScore + scoreBonus);
    const isBufferBreached = projectedValley < baseline.safetyBuffer;

    return {
      activeCount: activeActions.length,
      totalRelief,
      projectedValley,
      projectedScore,
      isBufferBreached,
      bufferDeficit: Math.max(0, baseline.safetyBuffer - projectedValley),
      bufferSurplus: Math.max(0, projectedValley - baseline.safetyBuffer),
    };
  }, [actions, baseline]);

  const toggleAction = (id: string) => {
    setActions((prev) =>
      prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a))
    );
  };

  const handleExecuteRescue = () => {
    setIsPlanExecuted(true);
    setIsConfirmModalOpen(false);
    setToastMessage(
      `[RESCUE PLAN ACTIVATED] ${computed.activeCount} emergency mitigations executed in simulation. Projected liquidity valley secured at $${computed.projectedValley.toLocaleString()}!`
    );
    setTimeout(() => setToastMessage(null), 6000);
  };

  return (
    <div className="space-y-6 max-w-[1520px] mx-auto">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between shadow-lg animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-400 text-base">verified</span>
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-400 font-semibold text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Header and Fast Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2 border-b border-outline-variant/20">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-headline-lg text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              AI Cashflow Rescue
            </h1>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-error-container/40 border border-error/40 text-error text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-error animate-ping" />
              <span>{isLiveDb ? "Live Firestore Risk Sentinel Active" : "Active Risk Sentinel: 1 Liquidity Squeeze Detected"}</span>
            </div>
          </div>
          <p className="mt-1 font-body-md text-sm text-on-surface-variant max-w-2xl">
            Detect cashflow bottlenecks before they trigger overdrafts. Simulate interventions and execute approval-first rescue plans.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap text-xs">
          <Link
            href="/simulator"
            className="px-4 py-2 rounded-lg bg-surface-container-high border border-outline-variant/40 text-on-surface hover:bg-surface-container flex items-center gap-2 transition-all"
          >
            <span className="material-symbols-outlined text-base">tune</span>
            Open What-If Simulator
          </Link>
          <button
            onClick={() => setIsConfirmModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-secondary-container to-secondary text-white font-semibold flex items-center gap-2 shadow-md hover:brightness-110 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-base">verified_user</span>
            Execute Selected Plan ({computed.activeCount})
          </button>
        </div>
      </div>

      {/* Hero Telemetry Diagnostic Card */}
      <section className="rounded-2xl p-6 lg:p-8 bg-surface-container-lowest/90 backdrop-blur-xl border border-outline-variant/40 relative overflow-hidden shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Health Score Gauge */}
          <div className="lg:col-span-4 flex flex-col justify-center items-start lg:border-r border-outline-variant/30 lg:pr-8">
            <div className="flex items-center justify-between w-full mb-2">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-outline">
                Telemetry Health Diagnostic
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono bg-primary/10 text-primary border border-primary/30">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> Live Simulation
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="font-display text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
                {computed.projectedScore}
              </span>
              <span className="text-xl text-outline font-semibold">/100</span>
            </div>

            <div
              className={cn(
                "inline-flex items-center gap-2 px-3 py-1 rounded-lg border text-xs font-medium mb-3",
                computed.isBufferBreached
                  ? "bg-error/15 border-error/40 text-error"
                  : "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
              )}
            >
              <span className="material-symbols-outlined text-sm">
                {computed.isBufferBreached ? "warning" : "verified"}
              </span>
              <span>
                {computed.isBufferBreached
                  ? "Caution: Liquidity Valley Breaches Buffer"
                  : "Protected: Valley Exceeds Safety Buffer"}
              </span>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              Without mitigation, delayed milestone payouts threaten to dip your operating reserves below the $20k safety buffer on Day 18.
            </p>

            {/* Sparkline Indicator */}
            <div className="w-full mt-4 pt-3 border-t border-outline-variant/20 space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-on-surface-variant">Projected Day-18 Valley</span>
                <span className={computed.isBufferBreached ? "text-error font-bold" : "text-emerald-400 font-bold"}>
                  ${computed.projectedValley.toLocaleString()}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-surface-container-highest overflow-hidden flex">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${Math.min(100, (computed.projectedValley / 45000) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Telemetry Metric Bento */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {/* Liquid Balance */}
            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30">
              <span className="text-on-surface-variant block mb-1">Current Liquid Reserve</span>
              <div className="font-bold text-xl text-white">
                ${RESCUE_BASELINE.liquidBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-outline mt-1 block">Across Operating &amp; Vaults</span>
            </div>

            {/* Required Safety Buffer */}
            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30">
              <span className="text-on-surface-variant block mb-1">Required Safety Buffer</span>
              <div className="font-bold text-xl text-primary">
                ${RESCUE_BASELINE.safetyBuffer.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-outline mt-1 block">Non-negotiable operational floor</span>
            </div>

            {/* Net Liquidity Relief Added */}
            <div className="p-4 rounded-xl bg-surface-container-low border border-secondary/40 shadow-sm">
              <span className="text-secondary font-medium block mb-1">Interventions Relief Added</span>
              <div className="font-bold text-xl text-secondary">
                +${computed.totalRelief.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-emerald-400 mt-1 block">
                {computed.activeCount} active simulated levers
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Rescue Levers / Mitigation Action Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-headline-sm text-lg font-semibold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">tune</span>
            Selectable Rescue Interventions (Simulated Mitigation)
          </h2>
          <span className="text-xs text-on-surface-variant">Toggle levers to evaluate immediate cashflow relief</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {actions.map((act) => (
            <div
              key={act.id}
              onClick={() => toggleAction(act.id)}
              className={cn(
                "p-5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-4 select-none",
                act.enabled
                  ? "bg-surface-container-high/80 border-secondary/50 shadow-md ring-1 ring-secondary/20"
                  : "bg-surface-container-lowest/70 border-outline-variant/30 hover:bg-surface-container-low"
              )}
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full",
                      act.enabled ? "bg-secondary animate-pulse" : "bg-outline"
                    )}
                  />
                  <h3 className="font-semibold text-xs text-on-surface">{act.title}</h3>
                </div>
                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                  {act.description}
                </p>
                <div className="pt-2 flex items-center gap-3 text-xs">
                  <span className="font-bold text-primary">
                    +${act.impactAmount.toLocaleString()} Cash Inflow
                  </span>
                  <span className="text-secondary font-medium text-[11px]">
                    +{act.impactScoreBonus} Score Pts
                  </span>
                </div>
              </div>

              {/* Toggle Switch */}
              <ToggleSwitch
                checked={act.enabled}
                onChange={() => toggleAction(act.id)}
                aria-label={`Toggle ${act.title}`}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsConfirmModalOpen(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-surface-container-lowest border border-secondary/40 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-outline-variant/20">
              <div className="w-10 h-10 rounded-xl bg-secondary/20 text-secondary flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">verified_user</span>
              </div>
              <div>
                <h3 className="font-semibold text-base text-on-surface">Confirm Rescue Plan Authorization</h3>
                <span className="text-xs text-secondary font-mono">Autonomous Governance Protocol</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-container-high/60 border border-outline-variant/30 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Active Levers:</span>
                <span className="text-on-surface font-semibold">{computed.activeCount} Actions</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Total Inflow Relief:</span>
                <span className="text-primary font-bold">+${computed.totalRelief.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Projected Day-18 Balance:</span>
                <span className="text-emerald-400 font-bold">${computed.projectedValley.toLocaleString()}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[11px]">
              <strong>Simulation Guardrail:</strong> This action updates local telemetry and logs the simulated actions. No real-world bank transfers or emails are triggered without external credentials.
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-surface-container text-xs text-on-surface"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteRescue}
                className="px-5 py-2 rounded-lg bg-gradient-to-r from-secondary-container to-secondary text-white font-bold text-xs shadow-md hover:brightness-110 active:scale-95"
              >
                Authorize &amp; Activate Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
