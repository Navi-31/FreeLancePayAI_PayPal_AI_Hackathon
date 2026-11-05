"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Invoice, InvoiceStatus } from "@/types/invoice";
import { updateInvoiceStatusInStorage } from "./invoiceStore";
import { InvoicePaperPreview } from "./InvoicePaperPreview";
import { AuricButton } from "@/components/ui/AuricButton";
import { VioletButton } from "@/components/ui/VioletButton";
import { GlassPanel } from "@/components/glass/GlassPanel";
import { StatusBadge } from "@/components/ui/StatusBadge";

export interface InvoiceDetailsViewProps {
  initialInvoice: Invoice;
}

export const InvoiceDetailsView: React.FC<InvoiceDetailsViewProps> = ({ initialInvoice }) => {
  const [invoice, setInvoice] = useState<Invoice>(initialInvoice);
  const [notification, setNotification] = useState<string | null>(null);

  const handleStatusToggle = (newStatus: InvoiceStatus) => {
    const updated = updateInvoiceStatusInStorage(invoice.id, newStatus);
    if (updated) {
      setInvoice({ ...updated });
      setNotification(`Invoice #${invoice.id} status updated to ${newStatus.toUpperCase()}`);
      setTimeout(() => setNotification(null), 3500);
    }
  };

  return (
    <div className="space-y-6 max-w-[1520px] mx-auto">
      {/* Toast Notification */}
      {notification && (
        <div className="p-3 rounded-lg bg-secondary-container/40 border border-secondary/50 text-white text-xs flex items-center justify-between violet-glow">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-sm">check_circle</span>
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-outline hover:text-white">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* 1. HEADER EXECUTIVE SUMMARY BLOCK */}
      <GlassPanel elevation={2} className="p-6 relative overflow-hidden">
        {/* Ambient Auric & Violet Light Highlights */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-secondary-container/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-primary-container/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-headline-lg text-xl lg:text-2xl font-semibold text-on-surface tracking-tight">
                Invoice #{invoice.id}
              </h1>
              <StatusBadge
                variant={invoice.status === "paid" ? "paid" : invoice.status === "overdue" ? "overdue" : "viewed"}
                pulse={invoice.status === "viewed" || invoice.status === "overdue"}
              >
                {invoice.status.toUpperCase()}
              </StatusBadge>
            </div>

            <p className="font-body-lg text-sm text-on-surface-variant flex flex-wrap items-center gap-2">
              <strong className="text-on-surface font-semibold">{invoice.clientName}</strong>
              <span className="text-outline">•</span>
              <span>{invoice.projectTitle}</span>
            </p>

            <div className="flex flex-wrap items-center gap-4 lg:gap-6 pt-1 text-on-surface-variant text-xs">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-outline text-sm leading-none" data-icon="calendar_today">
                  calendar_today
                </span>
                <span>
                  Issued: <strong className="text-on-surface font-medium">{invoice.issueDate}</strong>
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span
                  className={invoice.status === "overdue" ? "material-symbols-outlined text-error text-sm leading-none" : "material-symbols-outlined text-outline text-sm leading-none"}
                  data-icon="event_busy"
                >
                  event_busy
                </span>
                <span>
                  Due Date:{" "}
                  <strong className={invoice.status === "overdue" ? "text-error font-medium" : "text-on-surface font-medium"}>
                    {invoice.dueDate}
                  </strong>
                </span>
              </div>

              {invoice.poReference && (
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-outline text-sm leading-none" data-icon="pin">
                    pin
                  </span>
                  <span>
                    PO: <strong className="text-on-surface font-mono font-medium">{invoice.poReference}</strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Executive Action Cluster */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Link href="/ai/rescue">
              <AuricButton size="sm" icon="crisis_alert">
                Rescue Cashflow
              </AuricButton>
            </Link>

            <Link href="/reminders">
              <VioletButton size="sm" icon="auto_awesome" sparkle>
                AI Follow-up
              </VioletButton>
            </Link>

            {invoice.status !== "paid" ? (
              <button
                type="button"
                onClick={() => handleStatusToggle("paid")}
                className="px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant/30 text-on-surface hover:text-emerald-400 hover:border-emerald-400/40 transition-colors text-xs flex items-center gap-1.5 font-medium"
              >
                <span className="material-symbols-outlined text-sm leading-none">check_circle</span>
                <span>Mark as Paid</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleStatusToggle("sent")}
                className="px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant/30 text-on-surface hover:text-amber-400 hover:border-amber-400/40 transition-colors text-xs flex items-center gap-1.5 font-medium"
              >
                <span className="material-symbols-outlined text-sm leading-none">undo</span>
                <span>Reopen Invoice</span>
              </button>
            )}

            <Link
              href="/invoices"
              className="px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant/30 text-on-surface-variant hover:text-on-surface text-xs transition-colors"
            >
              Back to Ledger
            </Link>
          </div>
        </div>
      </GlassPanel>

      {/* 2. AI BEHAVIORAL RISK & TELEMETRY INSIGHT BANNER */}
      <GlassPanel
        elevation={2}
        glow="violet"
        className="p-5 border-secondary/30 relative overflow-hidden"
      >
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-secondary-container/30 border border-secondary/40 flex items-center justify-center text-secondary shrink-0 mt-0.5">
              <span
                className="material-symbols-outlined text-xl leading-none"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                psychology
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] tracking-wider uppercase text-secondary font-semibold font-mono">
                  AI Behavioral Risk Telemetry
                </span>
                <span className="px-2 py-0.2 rounded text-[10px] bg-primary/20 text-primary border border-primary/30">
                  {invoice.status === "paid" ? "Settlement Finalized" : invoice.status === "overdue" ? "Delayed Sign-Off Detected" : "Active Inflow"}
                </span>
              </div>
              <p className="font-body-md text-xs lg:text-sm text-on-surface leading-relaxed max-w-4xl">
                {invoice.aiTelemetryNote || "Invoice telemetry continuously audited by neural protocol."}
              </p>
            </div>
          </div>

          <div className="shrink-0">
            <Link
              href="/ai/negotiator"
              className="px-3.5 py-1.5 rounded-lg bg-surface-container-high border border-secondary/40 text-secondary hover:bg-secondary hover:text-white transition-all text-xs font-medium flex items-center gap-1.5"
            >
              <span>Negotiate Terms</span>
              <span className="material-symbols-outlined text-sm leading-none">chevron_right</span>
            </Link>
          </div>
        </div>
      </GlassPanel>

      {/* 3. 2-COLUMN MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Paper Sheet & History */}
        <div className="lg:col-span-8 space-y-6">
          <InvoicePaperPreview invoice={invoice} />

          {/* Activity Telemetry Timeline */}
          <GlassPanel elevation={1} className="p-6 space-y-4">
            <h4 className="font-headline-sm text-sm font-semibold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-primary">history</span>
              <span>Autonomous Activity Ledger</span>
            </h4>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3 pb-3 border-b border-outline-variant/10">
                <div className="w-2 h-2 rounded-full bg-secondary mt-1.5 shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-on-surface">Client View Detected</p>
                  <p className="text-on-surface-variant text-[11px]">
                    Accounts Payable opened invoice via encrypted browser link &bull; 4 total sessions
                  </p>
                </div>
                <span className="text-[10px] text-outline font-mono">Oct 14, 2025</span>
              </div>

              <div className="flex items-start gap-3 pb-3 border-b border-outline-variant/10">
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-on-surface">Invoice Dispatched via {invoice.paymentChannel}</p>
                  <p className="text-on-surface-variant text-[11px]">
                    Autonomous verification passed. Remit relay delivered to {invoice.clientEmail}
                  </p>
                </div>
                <span className="text-[10px] text-outline font-mono">{invoice.issueDate}</span>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-outline mt-1.5 shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-on-surface">Invoice Created</p>
                  <p className="text-on-surface-variant text-[11px]">
                    Line items and tax shield initialized in local ledger
                  </p>
                </div>
                <span className="text-[10px] text-outline font-mono">{invoice.issueDate}</span>
              </div>
            </div>
          </GlassPanel>
        </div>

        {/* Right Column (4 cols): Settlement Telemetry & Escrow */}
        <div className="lg:col-span-4 space-y-6">
          {/* Rail Details Card */}
          <GlassPanel elevation={1} className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2.5">
              <span className="font-label-md text-xs font-semibold text-on-surface">
                Settlement Channel Rail
              </span>
              <span className="material-symbols-outlined text-primary text-base">payments</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-outline text-[10px] uppercase block">Rail Protocol</span>
                <span className="font-medium text-primary text-sm">{invoice.paymentChannel}</span>
              </div>

              <div>
                <span className="text-outline text-[10px] uppercase block">Smart Escrow State</span>
                <span className="text-emerald-400 font-medium">Protected by Autonomous Shield</span>
              </div>

              <div>
                <span className="text-outline text-[10px] uppercase block">Remit Destination</span>
                <span className="font-mono text-on-surface">Operating Vault (0x8F92...4A)</span>
              </div>

              <div>
                <span className="text-outline text-[10px] uppercase block">Tax Shield Allocation</span>
                <span className="font-mono text-secondary">
                  ${invoice.taxAmount > 0 ? invoice.taxAmount.toFixed(2) : ((invoice.total * 0.20)).toFixed(2)} (20% set aside)
                </span>
              </div>
            </div>
          </GlassPanel>

          {/* Quick AI Action Card */}
          <GlassPanel elevation={2} className="p-5 space-y-3 border-secondary/30">
            <div className="flex items-center gap-2 text-xs font-semibold text-secondary">
              <span className="material-symbols-outlined text-base">smart_toy</span>
              <span>Next Recommended Action</span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {invoice.status === "overdue"
                ? "Dispatch Follow-Up Level 2 via verified relay to prompt sign-off before Friday payroll obligations."
                : invoice.status === "paid"
                ? "Settlement complete. Allocate fractional retainers into yield reserves."
                : "Monitor client read receipts over the next 48 hours."}
            </p>
            <div className="pt-1">
              <Link
                href="/reminders"
                className="w-full py-2 px-3 rounded-lg bg-surface-container-high border border-outline-variant/30 text-on-surface hover:text-primary text-xs font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <span>View Reminder Schedule</span>
                <span className="material-symbols-outlined text-sm leading-none">arrow_forward</span>
              </Link>
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
};
