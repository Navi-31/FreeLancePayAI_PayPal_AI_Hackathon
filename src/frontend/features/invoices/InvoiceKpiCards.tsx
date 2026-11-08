import React from "react";
import { Invoice } from "@/shared/types/invoice";
import { useCurrency } from "@/frontend/features/currency/CurrencyContext";

export interface InvoiceKpiCardsProps {
  invoices: Invoice[];
}

export const InvoiceKpiCards: React.FC<InvoiceKpiCardsProps> = ({ invoices }) => {
  const { currency, convert, format } = useCurrency();

  // Convert each invoice to selected display currency before summing
  const totalBilled = invoices.reduce((sum, inv) => sum + convert(inv.total, inv.currency || "USD"), 0);
  const openInvoices = invoices.filter((inv) => inv.status === "sent" || inv.status === "viewed" || inv.status === "overdue");
  const awaitingPayment = openInvoices.reduce((sum, inv) => sum + convert(inv.total, inv.currency || "USD"), 0);
  const overdueInvoices = invoices.filter((inv) => inv.status === "overdue");
  const paidInvoices = invoices.filter((inv) => inv.status === "paid");
  const collectedAmount = paidInvoices.reduce((sum, inv) => sum + convert(inv.total, inv.currency || "USD"), 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Total Invoiced */}
      <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest/90 backdrop-blur-xl p-5 border border-white/5 hover:border-primary/30 transition-all auric-glow group">
        <div className="flex items-center justify-between mb-3">
          <span className="font-label-md text-label-md text-on-surface-variant font-medium">
            Total Invoiced
          </span>
          <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-lg" data-icon="account_balance_wallet">
              account_balance_wallet
            </span>
          </div>
        </div>

        <div className="space-y-1 mb-3">
          <div className="font-numeric-metric text-numeric-metric font-semibold text-on-surface tracking-tight">
            {format(totalBilled, currency)}
          </div>
          <div className="flex items-center gap-1.5 font-label-sm text-xs text-emerald-400">
            <span className="material-symbols-outlined text-sm leading-none" data-icon="trending_up">
              trending_up
            </span>
            <span>+14.2% MoM</span>
            <span className="text-on-surface-variant/60 font-normal">vs prev cycle</span>
          </div>
        </div>

        {/* Auric/Violet Sparkline */}
        <div className="w-full h-8 pt-2">
          <svg className="w-full h-full overflow-visible" fill="none" viewBox="0 0 100 24">
            <path
              d="M0 20 L20 18 L35 14 L50 16 L65 9 L80 11 L100 3"
              stroke="url(#kpiGoldGradient)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
            <defs>
              <linearGradient id="kpiGoldGradient" x1="0" x2="100" y1="0" y2="0" gradientUnits="userSpaceOnUse">
                <stop stopColor="#9665FF" />
                <stop offset="1" stopColor="#F4C86D" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Card 2: Amount to Collect */}
      <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest/90 backdrop-blur-xl p-5 border border-white/5 hover:border-amber-400/30 transition-all group">
        <div className="flex items-center justify-between mb-3">
          <span className="font-label-md text-label-md text-on-surface-variant font-medium">
            Amount to Collect (Outstanding)
          </span>
          <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-lg" data-icon="hourglass_top">
              hourglass_top
            </span>
          </div>
        </div>

        <div className="space-y-1 mb-3">
          <div className="font-numeric-metric text-numeric-metric font-semibold text-primary tracking-tight">
            {format(awaitingPayment, currency)}
          </div>
          <div className="flex items-center gap-1.5 font-label-sm text-xs text-amber-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>{openInvoices.length} outstanding invoices</span>
            {overdueInvoices.length > 0 && (
              <span className="text-error font-medium">• {overdueInvoices.length} overdue</span>
            )}
          </div>
        </div>

        {/* Progress track */}
        <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden mt-4">
          <div
            className="bg-amber-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.round((awaitingPayment / (totalBilled || 1)) * 100))}%` }}
          />
        </div>
      </div>

      {/* Card 3: Collected */}
      <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest/90 backdrop-blur-xl p-5 border border-white/5 hover:border-emerald-400/30 transition-all group">
        <div className="flex items-center justify-between mb-3">
          <span className="font-label-md text-label-md text-on-surface-variant font-medium">
            Collected (Settled)
          </span>
          <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-lg" data-icon="verified">
              verified
            </span>
          </div>
        </div>

        <div className="space-y-1 mb-3">
          <div className="font-numeric-metric text-numeric-metric font-semibold text-emerald-400 tracking-tight">
            {format(collectedAmount, currency)}
          </div>
          <div className="flex items-center gap-1.5 font-label-sm text-xs text-emerald-400">
            <span className="material-symbols-outlined text-sm leading-none" data-icon="check_circle">
              check_circle
            </span>
            <span>{paidInvoices.length} invoices paid in full</span>
          </div>
        </div>

        {/* Progress track */}
        <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden mt-4">
          <div className="bg-emerald-400 h-full rounded-full" style={{ width: "98%" }} />
        </div>
      </div>

      {/* Card 4: Average Payment Time */}
      <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest/90 backdrop-blur-xl p-5 border border-white/5 hover:border-secondary/30 transition-all violet-glow group">
        <div className="flex items-center justify-between mb-3">
          <span className="font-label-md text-label-md text-on-surface-variant font-medium">
            Average Payment Time
          </span>
          <div className="w-8 h-8 rounded-lg bg-secondary-container/40 flex items-center justify-center text-secondary group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-lg" data-icon="speed">
              speed
            </span>
          </div>
        </div>

        <div className="space-y-1 mb-3">
          <div className="font-numeric-metric text-numeric-metric font-semibold text-on-surface tracking-tight">
            11.4 Days
          </div>
          <div className="flex items-center gap-1.5 font-label-sm text-xs text-secondary">
            <span className="material-symbols-outlined text-sm leading-none" data-icon="bolt">
              bolt
            </span>
            <span>-3.2 days vs industry baseline</span>
          </div>
        </div>

        {/* Predictive Sparkline */}
        <div className="w-full h-8 pt-2">
          <svg className="w-full h-full overflow-visible" fill="none" viewBox="0 0 100 24">
            <path
              d="M0 8 L25 10 L45 15 L70 17 L100 22"
              stroke="#9665FF"
              strokeDasharray="2 3"
              strokeLinecap="round"
              strokeWidth="2"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};
