"use client";

import React, { useState } from "react";

interface FxPair {
  currency: string;
  flag: string;
  midMarket: string;
  gatewayRate: string;
  spreadBleed: string;
  annualSlippage: string;
  mitigation: string;
}

const FX_PAIRS: FxPair[] = [
  {
    currency: "EUR / USD",
    flag: "🇪🇺",
    midMarket: "1.0842",
    gatewayRate: "1.0690",
    spreadBleed: "1.40% Spread",
    annualSlippage: "-$340.00/yr",
    mitigation: "Activate SEPA Multi-Currency IBAN",
  },
  {
    currency: "GBP / USD",
    flag: "🇬🇧",
    midMarket: "1.2980",
    gatewayRate: "1.2810",
    spreadBleed: "1.31% Spread",
    annualSlippage: "-$80.50/yr",
    mitigation: "Route via Wise Borderless Wire",
  },
  {
    currency: "CAD / USD",
    flag: "🇨🇦",
    midMarket: "0.7250",
    gatewayRate: "0.7180",
    spreadBleed: "0.96% Spread",
    annualSlippage: "Minimal",
    mitigation: "Standard Stripe Canadian Debit",
  },
];

export function CurrencyIntelligenceClient() {
  const [timeRange, setTimeRange] = useState<"7D" | "30D" | "Q3" | "YTD">("Q3");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const grossReceived = 142650.0;
  const totalGatewayFees = -3842.1;
  const fxSlippage = -420.5;
  const netRetained = grossReceived + totalGatewayFees + fxSlippage;

  const handleApplyFeeOffset = () => {
    setToastMessage("Interchange Fee Offset (2.9% + $0.30) injected into Acme Corp upcoming contract addendum.");
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleConfigureIban = () => {
    setToastMessage("SEPA EUR Virtual IBAN designated for European counterparty billing. 0% FX spread locked.");
    setTimeout(() => setToastMessage(null), 4000);
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

      {/* Screen Title & Date Filters */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-outline-variant/20">
        <div>
          <div className="flex items-center gap-2 text-outline font-mono text-xs mb-1">
            <span>TREASURY</span>
            <span>/</span>
            <span className="text-primary font-medium">FEE & CURRENCY INTELLIGENCE</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-on-surface">
              Fee & Currency Intelligence
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-secondary/10 border border-secondary/30 text-secondary text-xs font-semibold flex items-center gap-1.5 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
              Algorithmic Audit Active
            </span>
          </div>
          <p className="text-sm text-on-surface-variant mt-1">
            Audit gateway processing friction, interchange drag, and cross-border FX slippage in real time.
          </p>
        </div>

        {/* Range Selector */}
        <div className="flex items-center gap-1.5 bg-surface-container-lowest p-1 rounded-xl border border-white/5 text-xs font-mono">
          {(["7D", "30D", "Q3", "YTD"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                timeRange === range
                  ? "bg-surface-container-high text-primary font-bold border border-primary/20 shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {range === "Q3" ? "Q3 FY25" : range}
            </button>
          ))}
        </div>
      </div>

      {/* Top Key Financial Metrics (4 Bento Cards) */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Received */}
        <div className="p-5 rounded-xl bg-surface-container-low/70 backdrop-blur-xl border border-white/[0.06] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-outline uppercase tracking-wider">
            <span>Gross Payments Received</span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-base">payments</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold font-mono tracking-tight text-on-surface">
              ${grossReceived.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs">
              <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                <span className="material-symbols-outlined text-xs">arrow_upward</span> +18.4%
              </span>
              <span className="text-outline">vs prior cycle</span>
            </div>
          </div>
        </div>

        {/* Total Gateway Fees */}
        <div className="p-5 rounded-xl bg-surface-container-low/70 backdrop-blur-xl border border-rose-500/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-outline uppercase tracking-wider">
            <span>Total Gateway Fees</span>
            <div className="w-8 h-8 rounded-lg bg-rose-950/40 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <span className="material-symbols-outlined text-base">price_change</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold font-mono tracking-tight text-rose-400">
              ${totalGatewayFees.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs">
              <span className="px-1.5 py-0.5 rounded bg-rose-950/40 border border-rose-500/20 text-[11px] text-rose-400 font-medium">
                2.69% Effective Drag
              </span>
              <span className="text-outline">Interchange drag</span>
            </div>
          </div>
        </div>

        {/* FX Conversion Slippage */}
        <div className="p-5 rounded-xl bg-surface-container-low/70 backdrop-blur-xl border border-secondary/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-outline uppercase tracking-wider">
            <span>FX Conversion Slippage</span>
            <div className="w-8 h-8 rounded-lg bg-secondary/15 border border-secondary/30 flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-base">currency_exchange</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold font-mono tracking-tight text-secondary">
              ${fxSlippage.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs">
              <span className="text-rose-400 font-semibold flex items-center gap-0.5">
                <span className="material-symbols-outlined text-xs">trending_down</span> -0.29%
              </span>
              <span className="text-outline">EUR & GBP Spread bleed</span>
            </div>
          </div>
        </div>

        {/* Net Liquid Retained */}
        <div className="p-5 rounded-xl bg-gradient-to-b from-surface-container-high/90 to-surface-container-low/90 backdrop-blur-xl border border-primary/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-primary uppercase tracking-wider font-semibold">
            <span>Net Liquid Retained</span>
            <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-base">account_balance_wallet</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold font-mono tracking-tight text-primary">
              ${netRetained.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs">
              <span className="px-2 py-0.5 rounded bg-primary/10 border border-primary/30 text-xs text-primary font-semibold font-mono">
                97.0% Net Yield
              </span>
              <span className="text-on-surface-variant font-medium">+0.8% with AI rules</span>
            </div>
          </div>
        </div>
      </section>

      {/* AI Fee Optimization Advisory Banner */}
      <section className="rounded-2xl bg-surface-container-low/80 backdrop-blur-2xl border border-secondary/30 p-5 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-secondary-container/30 border border-secondary/40 flex items-center justify-center text-secondary shrink-0">
              <span className="material-symbols-outlined text-xl">auto_awesome</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-on-surface">Autonomous Optimization Advisory</h3>
                <span className="px-2 py-0.5 rounded-full bg-secondary/20 text-secondary text-[10px] font-mono font-semibold uppercase">
                  2 Actions Ready
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-1 max-w-2xl leading-relaxed">
                Copilot identified recurring processing friction across 2 major client channels. Executing these mitigations preserves{" "}
                <span className="text-primary font-semibold">$1,480.00</span> in upcoming invoices.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 shrink-0 text-xs">
            {/* Card 1 */}
            <div className="p-3.5 rounded-xl bg-surface-container-lowest/80 border border-white/10 flex flex-col justify-between gap-2 max-w-xs">
              <div className="flex items-start justify-between">
                <span className="font-semibold text-primary flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">swap_horiz</span>
                  Interchange Offset
                </span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-mono">
                  Save ~$1,140/yr
                </span>
              </div>
              <p className="text-[11px] text-on-surface leading-normal">
                Pass PayPal Processing Fees (2.9% + $0.30) to Acme Corp on upcoming SOW.
              </p>
              <div className="flex justify-between items-center pt-1 border-t border-white/5">
                <span className="text-[10px] text-outline font-mono">Contract Addendum</span>
                <button
                  onClick={handleApplyFeeOffset}
                  className="text-[11px] text-primary hover:underline font-semibold flex items-center gap-0.5"
                >
                  Apply to SOW →
                </button>
              </div>
            </div>

            {/* Card 2 */}
            <div className="p-3.5 rounded-xl bg-surface-container-lowest/80 border border-white/10 flex flex-col justify-between gap-2 max-w-xs">
              <div className="flex items-start justify-between">
                <span className="font-semibold text-secondary flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">account_balance</span>
                  FX Routing Shield
                </span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-mono">
                  Save $340/yr
                </span>
              </div>
              <p className="text-[11px] text-on-surface leading-normal">
                Route European clients through SEPA EUR multi-currency IBAN to eliminate annual FX loss.
              </p>
              <div className="flex justify-between items-center pt-1 border-t border-white/5">
                <span className="text-[10px] text-outline font-mono">Automated Invoicing</span>
                <button
                  onClick={handleConfigureIban}
                  className="text-[11px] text-secondary hover:underline font-semibold flex items-center gap-0.5"
                >
                  Configure IBAN →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Analytics: Yield Retention (7 cols) + Fee Breakdown Donut (5 cols) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Waterfall / Retention Curve */}
        <div className="lg:col-span-7 rounded-2xl bg-surface-container-low/70 backdrop-blur-xl border border-white/[0.06] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-base font-semibold text-on-surface">Yield Waterfall & Retention Curve</h3>
                <p className="text-xs text-on-surface-variant">Gross incoming cash vs net settled yield post-drag</p>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                  <span className="text-outline">Gross</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
                  <span className="text-outline">Net Yield</span>
                </div>
              </div>
            </div>

            <div className="relative w-full h-56 mt-4">
              <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 700 180">
                <defs>
                  <linearGradient id="goldCurveGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#f4c86d" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#f4c86d" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="violetCurveGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#d0bcff" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#561cc1" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Grid */}
                <line x1="0" y1="30" x2="700" y2="30" stroke="#35343b" strokeDasharray="3 3" strokeWidth="0.75" />
                <line x1="0" y1="85" x2="700" y2="85" stroke="#35343b" strokeDasharray="3 3" strokeWidth="0.75" />
                <line x1="0" y1="140" x2="700" y2="140" stroke="#35343b" strokeDasharray="3 3" strokeWidth="0.75" />

                {/* Gross Path */}
                <path
                  d="M0,120 C90,110 160,70 260,85 C360,100 440,45 540,55 C620,65 660,25 700,28 L700,160 L0,160 Z"
                  fill="url(#goldCurveGrad)"
                />
                <path
                  d="M0,120 C90,110 160,70 260,85 C360,100 440,45 540,55 C620,65 660,25 700,28"
                  fill="none"
                  stroke="#f4c86d"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Net Path */}
                <path
                  d="M0,135 C90,125 160,85 260,100 C360,115 440,65 540,72 C620,80 660,45 700,48 L700,160 L0,160 Z"
                  fill="url(#violetCurveGrad)"
                />
                <path
                  d="M0,135 C90,125 160,85 260,100 C360,115 440,65 540,72 C620,80 660,45 700,48"
                  fill="none"
                  stroke="#d0bcff"
                  strokeDasharray="4 2"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>

              <div className="flex justify-between items-center text-[10px] font-mono text-outline mt-2 pt-2 border-t border-white/5">
                <span>May 2025</span>
                <span>Jun 2025</span>
                <span>Jul 2025</span>
                <span>Aug 2025</span>
                <span>Sep 2025</span>
                <span className="text-primary font-bold">Oct 2025 (Current)</span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-xs text-outline font-mono">
            <span>Spread Variance: <strong className="text-white">-$4,262.60 Drag</strong></span>
            <span className="text-secondary flex items-center gap-1 font-sans">
              <span className="material-symbols-outlined text-xs">verified</span> Audited Multi-Currency
            </span>
          </div>
        </div>

        {/* Donut: Gateway Drag Share */}
        <div className="lg:col-span-5 rounded-2xl bg-surface-container-low/70 backdrop-blur-xl border border-white/[0.06] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-semibold text-on-surface">Gateway Fee Breakdown</h3>
              <span className="text-xs text-outline font-mono">Drag Share</span>
            </div>
            <p className="text-xs text-on-surface-variant">Processing fee distribution across rails.</p>
          </div>

          <div className="flex items-center justify-around my-4">
            <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" fill="none" r="38" stroke="#1f1f25" strokeWidth="12" />
                {/* PayPal 68% */}
                <circle cx="50" cy="50" fill="none" r="38" stroke="#f4c86d" strokeDasharray="162.3 238.7" strokeDashoffset="0" strokeWidth="12" />
                {/* Stripe 24% */}
                <circle cx="50" cy="50" fill="none" r="38" stroke="#d0bcff" strokeDasharray="57.2 238.7" strokeDashoffset="-162.3" strokeWidth="12" />
                {/* Wire 8% */}
                <circle cx="50" cy="50" fill="none" r="38" stroke="#795902" strokeDasharray="19.1 238.7" strokeDashoffset="-219.5" strokeWidth="12" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-mono text-base font-bold text-on-surface">$3,842</span>
                <span className="text-[9px] text-outline uppercase tracking-wider font-mono">Total Drag</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <div className="flex items-center gap-1.5 font-semibold text-on-surface">
                  <span className="w-2 h-2 rounded-full bg-primary" /> PayPal (68%)
                </div>
                <div className="text-[11px] text-outline font-mono pl-3.5">$2,612.60</div>
              </div>
              <div>
                <div className="flex items-center gap-1.5 font-semibold text-on-surface">
                  <span className="w-2 h-2 rounded-full bg-secondary" /> Stripe (24%)
                </div>
                <div className="text-[11px] text-outline font-mono pl-3.5">$922.10</div>
              </div>
              <div>
                <div className="flex items-center gap-1.5 font-semibold text-on-surface">
                  <span className="w-2 h-2 rounded-full bg-amber-700" /> SWIFT Wire (8%)
                </div>
                <div className="text-[11px] text-outline font-mono pl-3.5">$307.40</div>
              </div>
            </div>
          </div>

          <div className="p-2 rounded-xl bg-surface-container-lowest border border-white/5 flex items-center justify-between text-xs">
            <span className="text-outline font-mono text-[11px]">Primary Friction:</span>
            <span className="text-rose-400 font-semibold flex items-center gap-1 text-[11px]">
              <span className="material-symbols-outlined text-xs">warning</span>
              Cross-Border Interchange
            </span>
          </div>
        </div>
      </section>

      {/* FX Currency Slippage Radar & Matrix */}
      <section className="rounded-2xl bg-surface-container-low/70 backdrop-blur-xl border border-white/[0.06] p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
          <div>
            <h3 className="text-base font-semibold text-on-surface">FX Currency Slippage Radar</h3>
            <p className="text-xs text-outline">Mid-market spot audit vs payment gateway exchange rates</p>
          </div>
          <span className="text-xs font-mono text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-500/20">
            1.4% Avoidable EUR Spread
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {FX_PAIRS.map((fx) => (
            <div key={fx.currency} className="p-4 rounded-xl bg-surface-container border border-outline-variant/30 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-on-surface text-sm flex items-center gap-1.5">
                  <span>{fx.flag}</span> {fx.currency}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-surface-container-high border border-outline-variant/40 text-rose-400 font-mono">
                  {fx.spreadBleed}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono py-1">
                <div>
                  <span className="text-outline block text-[10px]">Mid-Market</span>
                  <span className="text-white font-semibold">{fx.midMarket}</span>
                </div>
                <div>
                  <span className="text-outline block text-[10px]">Gateway Rate</span>
                  <span className="text-primary font-semibold">{fx.gatewayRate}</span>
                </div>
              </div>
              <div className="pt-2 border-t border-outline-variant/20 flex justify-between items-center text-[11px]">
                <span className="text-outline">Annual Slippage:</span>
                <span className="text-rose-400 font-bold font-mono">{fx.annualSlippage}</span>
              </div>
              <div className="text-[10px] text-emerald-400 font-medium">
                Recommendation: {fx.mitigation}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
