import React from "react";
import Link from "next/link";
import { AppLayout } from "@/frontend/components/layout/AppLayout";
import { GlassPanel } from "@/frontend/components/glass/GlassPanel";
import { StatusBadge } from "@/frontend/components/ui/StatusBadge";
import { DashboardLiveBannerAndMetrics } from "@/frontend/features/dashboard/DashboardLiveMetrics";

export default function DashboardPage() {
  return (
    <AppLayout
      pageTitle="Good evening, Alex"
      pageSubtitle="Autonomous fiscal guardian is operational"
      userBadge="PRO VIP"
    >
      <div className="space-y-6">
        <DashboardLiveBannerAndMetrics />

        {/* ============================================================ */}
        {/* 3. DYNAMIC VISUAL REVENUE TRAJECTORY & CASH BREAKDOWN        */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart Container (2 cols) */}
          <GlassPanel elevation={1} className="lg:col-span-2 p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-headline-sm text-sm lg:text-base font-semibold text-on-surface">
                  Revenue Velocity & Inflow Radar
                </h3>
                <p className="font-body-sm text-xs text-on-surface-variant">
                  Real-time Stripe, PayPal & International SWIFT clearing rates
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-1 rounded bg-surface-container-high text-on-surface font-medium border border-outline-variant/30">
                  H1 2025
                </span>
              </div>
            </div>

            {/* SVG Vector Sparkline / Area Chart */}
            <div className="w-full h-52 relative mt-2">
              <svg
                className="w-full h-full"
                fill="none"
                preserveAspectRatio="none"
                viewBox="0 0 600 200"
              >
                <defs>
                  <linearGradient id="auricGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#f4c86d" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#f4c86d" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="violetGradient" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor="#9665FF" />
                    <stop offset="100%" stopColor="#f4c86d" />
                  </linearGradient>
                </defs>

                {/* Baseline Grid */}
                <line stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" x1="0" x2="600" y1="50" y2="50" />
                <line stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" x1="0" x2="600" y1="100" y2="100" />
                <line stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" x1="0" x2="600" y1="150" y2="150" />

                {/* Area Fill */}
                <path
                  d="M 0 160 Q 100 130 180 90 T 340 70 T 480 30 T 600 20 L 600 200 L 0 200 Z"
                  fill="url(#auricGradient)"
                />

                {/* Trajectory Line */}
                <path
                  d="M 0 160 Q 100 130 180 90 T 340 70 T 480 30 T 600 20"
                  stroke="url(#violetGradient)"
                  strokeLinecap="round"
                  strokeWidth="3.5"
                />

                {/* Milestone Marker Dots */}
                <circle cx="180" cy="90" fill="#131319" r="5" stroke="#9665FF" strokeWidth="2.5" />
                <circle cx="340" cy="70" fill="#131319" r="5" stroke="#f4c86d" strokeWidth="2.5" />
                <circle className="animate-pulse" cx="480" cy="30" fill="#f4c86d" r="6" stroke="#ffffff" strokeWidth="2" />
              </svg>
            </div>

            <div className="flex items-center justify-between text-[11px] text-on-surface-variant pt-3 border-t border-outline-variant/20 mt-3 font-mono">
              <span>JAN ($14.2k)</span>
              <span>FEB ($18.9k)</span>
              <span>MAR ($22.1k)</span>
              <span>APR ($28.5k)</span>
              <span>MAY ($34.0k)</span>
              <span className="text-primary font-semibold">JUN (Projected $42k)</span>
            </div>
          </GlassPanel>

          {/* Cashflow Breakdown & AI Action proposals */}
          <GlassPanel elevation={1} className="p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-headline-sm text-sm lg:text-base font-semibold text-on-surface">
                  Capital Allocation
                </h3>
                <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">
                  Real-time
                </span>
              </div>
              <p className="font-body-sm text-xs text-on-surface-variant mb-4">
                Autonomous segregation across business vaults
              </p>

              <div className="space-y-3.5">
                <div>
                  <div className="flex justify-between text-xs mb-1 font-medium">
                    <span className="text-on-surface">Operating Vault (Liquid)</span>
                    <span className="text-primary font-mono">$42,880 (58%)</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: "58%" }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1 font-medium">
                    <span className="text-on-surface">Autonomous Tax Shield</span>
                    <span className="text-secondary font-mono">$14,800 (20%)</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                    <div className="bg-secondary h-full rounded-full" style={{ width: "20%" }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1 font-medium">
                    <span className="text-on-surface">Authorized Retainers</span>
                    <span className="text-emerald-400 font-mono">$11,400 (15%)</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-400 h-full rounded-full" style={{ width: "15%" }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1 font-medium">
                    <span className="text-on-surface">Buffer & Contingency</span>
                    <span className="text-on-surface-variant font-mono">$5,170 (7%)</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                    <div className="bg-outline h-full rounded-full" style={{ width: "7%" }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 p-3 rounded-lg bg-surface-container-lowest/80 border border-secondary/20">
              <div className="flex items-center gap-2 text-xs text-secondary font-semibold mb-1">
                <span className="material-symbols-outlined text-sm leading-none" data-icon="smart_toy">
                  smart_toy
                </span>
                <span>Copilot Recommendation</span>
              </div>
              <p className="text-xs text-on-surface-variant">
                Transfer $2,400 from Operating to 4.9% APY Treasury Vault before Friday 5 PM EST.
              </p>
            </div>
          </GlassPanel>
        </div>

        {/* ============================================================ */}
        {/* 4. RECENT INVOICES ACTIVE TABLE PREVIEW                      */}
        {/* ============================================================ */}
        <GlassPanel elevation={1} className="rounded-xl overflow-hidden">
          <div className="p-5 flex items-center justify-between border-b border-outline-variant/30">
            <div>
              <h3 className="font-headline-sm text-sm lg:text-base font-semibold text-on-surface">
                Recent Active Invoices
              </h3>
              <p className="font-body-sm text-xs text-on-surface-variant">
                Live telemetry from payment channels and client view triggers
              </p>
            </div>
            <Link
              href="/invoices"
              className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
            >
              <span>View all 24 invoices</span>
              <span className="material-symbols-outlined text-sm leading-none">chevron_right</span>
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container text-on-surface-variant font-label-sm border-b border-outline-variant/20 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-5">Invoice</th>
                  <th className="py-3 px-5">Client</th>
                  <th className="py-3 px-5">Amount</th>
                  <th className="py-3 px-5">Channel</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5">AI Behavioral Read</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10 text-on-surface">
                <tr className="hover:bg-surface-container-high/40 transition-colors">
                  <td className="py-4 px-5 font-mono font-medium text-primary">#FP-8849</td>
                  <td className="py-4 px-5">
                    <div className="font-medium text-on-surface">Horizon Studio</div>
                    <div className="text-[11px] text-on-surface-variant">Design System Sprint II</div>
                  </td>
                  <td className="py-4 px-5 font-mono font-semibold">$8,500.00</td>
                  <td className="py-4 px-5">
                    <span className="px-2 py-0.5 rounded bg-surface-container-high border border-outline-variant/40 text-on-surface text-[10px] font-mono">
                      Stripe Connect
                    </span>
                  </td>
                  <td className="py-4 px-5">
                    <StatusBadge variant="viewed" pulse>
                      Viewed 4m ago
                    </StatusBadge>
                  </td>
                  <td className="py-4 px-5 text-on-surface-variant">
                    High settlement probability within 48h
                  </td>
                  <td className="py-4 px-5 text-right">
                    <Link
                      href="/invoices"
                      className="px-2.5 py-1 rounded bg-surface-container border border-outline-variant/30 text-on-surface hover:text-primary transition-colors text-xs"
                    >
                      Details
                    </Link>
                  </td>
                </tr>

                <tr className="hover:bg-surface-container-high/40 transition-colors">
                  <td className="py-4 px-5 font-mono font-medium text-primary">#FP-8848</td>
                  <td className="py-4 px-5">
                    <div className="font-medium text-on-surface">Acme Corp</div>
                    <div className="text-[11px] text-on-surface-variant">Brand Architecture Q2</div>
                  </td>
                  <td className="py-4 px-5 font-mono font-semibold">$1,500.00</td>
                  <td className="py-4 px-5">
                    <span className="px-2 py-0.5 rounded bg-surface-container-high border border-outline-variant/40 text-on-surface text-[10px] font-mono">
                      PayPal Direct
                    </span>
                  </td>
                  <td className="py-4 px-5">
                    <StatusBadge variant="overdue">
                      14d Overdue
                    </StatusBadge>
                  </td>
                  <td className="py-4 px-5 text-on-surface-variant">
                    AP viewing detected 4x; firm notice recommended
                  </td>
                  <td className="py-4 px-5 text-right">
                    <Link
                      href="/reminders"
                      className="px-2.5 py-1 rounded bg-surface-container border border-error/30 text-error hover:bg-error-container/20 transition-colors text-xs"
                    >
                      Escalate
                    </Link>
                  </td>
                </tr>

                <tr className="hover:bg-surface-container-high/40 transition-colors">
                  <td className="py-4 px-5 font-mono font-medium text-primary">#FP-8847</td>
                  <td className="py-4 px-5">
                    <div className="font-medium text-on-surface">Venture Dynamics</div>
                    <div className="text-[11px] text-on-surface-variant">AI Telemetry Dashboard</div>
                  </td>
                  <td className="py-4 px-5 font-mono font-semibold">$4,200.00</td>
                  <td className="py-4 px-5">
                    <span className="px-2 py-0.5 rounded bg-surface-container-high border border-outline-variant/40 text-on-surface text-[10px] font-mono">
                      SWIFT Wire
                    </span>
                  </td>
                  <td className="py-4 px-5">
                    <StatusBadge variant="settled">
                      Settled Today
                    </StatusBadge>
                  </td>
                  <td className="py-4 px-5 text-on-surface-variant">
                    Auto-allocated $840 to Q4 Tax Shield
                  </td>
                  <td className="py-4 px-5 text-right">
                    <Link
                      href="/transactions"
                      className="px-2.5 py-1 rounded bg-surface-container border border-outline-variant/30 text-on-surface hover:text-primary transition-colors text-xs"
                    >
                      Receipt
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </GlassPanel>
      </div>
    </AppLayout>
  );
}
