"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Invoice, InvoiceStatus } from "@/shared/types/invoice";
import { updateInvoiceStatusInStorage } from "./invoiceStore";
import { InvoicePaperPreview } from "./InvoicePaperPreview";
import { AuricButton } from "@/frontend/components/ui/AuricButton";
import { VioletButton } from "@/frontend/components/ui/VioletButton";
import { GlassPanel } from "@/frontend/components/glass/GlassPanel";
import { StatusBadge } from "@/frontend/components/ui/StatusBadge";
import { useCurrency } from "@/frontend/features/currency/CurrencyContext";
import { formatCurrencyAmount } from "@/shared/currency";

export interface InvoiceDetailsViewProps {
  initialInvoice: Invoice;
}

export const InvoiceDetailsView: React.FC<InvoiceDetailsViewProps> = ({ initialInvoice }) => {
  const { currency: displayCurrency, format } = useCurrency();
  const [invoice, setInvoice] = useState<Invoice>(initialInvoice);
  const [notification, setNotification] = useState<string | null>(null);
  const [isProcessingPayPal, setIsProcessingPayPal] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(initialInvoice.paypalOrderId || null);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState<number>(initialInvoice.total);
  const [refundReason, setRefundReason] = useState<string>("Client requested adjustment / refund");

  const handleStatusToggle = (newStatus: InvoiceStatus) => {
    const updated = updateInvoiceStatusInStorage(invoice.id, newStatus);
    if (updated) {
      setInvoice({ ...updated });
      setNotification(`Invoice #${invoice.id} status updated to ${newStatus.toUpperCase()}`);
      setTimeout(() => setNotification(null), 3500);
    }
  };

  const handleCreatePayPalOrder = async () => {
    setIsProcessingPayPal(true);
    try {
      const res = await fetch("/api/paypal/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: invoice.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create PayPal order");

      setActiveOrderId(data.orderId);
      setInvoice((prev) => ({ ...prev, paypalOrderId: data.orderId }));
      setNotification(`PayPal Sandbox Order Created: ${data.orderId}. Ready for buyer authorization.`);

      if (data.approveUrl) {
        window.open(data.approveUrl, "_blank", "noopener,noreferrer");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "PayPal Order failed";
      setNotification(`Error: ${msg}`);
    } finally {
      setIsProcessingPayPal(false);
    }
  };

  const handleCapturePayPalPayment = async () => {
    if (!activeOrderId && !invoice.paypalOrderId) {
      setNotification("No active PayPal order available to capture. Create order first.");
      return;
    }
    setIsProcessingPayPal(true);
    try {
      const res = await fetch("/api/paypal/orders/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: invoice.id, orderId: activeOrderId || invoice.paypalOrderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to capture payment");

      setInvoice((prev) => ({
        ...prev,
        status: "paid",
        paypalCaptureId: data.captureId,
      }));
      setNotification(`Payment captured via PayPal Sandbox! Capture ID: ${data.captureId}. Net: $${data.netAmount}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Capture failed";
      setNotification(`Error: ${msg}`);
    } finally {
      setIsProcessingPayPal(false);
    }
  };

  const handleSendViaPayPalInvoice = async () => {
    setIsProcessingPayPal(true);
    try {
      const res = await fetch("/api/paypal/invoices/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: invoice.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send invoice");

      setInvoice((prev) => ({
        ...prev,
        status: "sent",
        paypalInvoiceId: data.paypalInvoiceId,
      }));
      setNotification(`Official PayPal Invoice #${invoice.id} dispatched via Invoicing API.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invoicing API dispatch failed";
      setNotification(`Error: ${msg}`);
    } finally {
      setIsProcessingPayPal(false);
    }
  };

  const handleExecuteRefund = async () => {
    if (!refundAmount || refundAmount <= 0) {
      setNotification("Invalid refund amount specified.");
      return;
    }
    setIsProcessingPayPal(true);
    try {
      const res = await fetch("/api/paypal/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: invoice.id,
          amount: refundAmount,
          reason: refundReason,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Refund failed");

      setIsRefundModalOpen(false);
      setNotification(`PayPal Refund processed successfully! Refund ID: ${data.refundId} ($${data.refundAmount})`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Refund failed";
      setNotification(`Error: ${msg}`);
    } finally {
      setIsProcessingPayPal(false);
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
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="material-symbols-outlined text-sm leading-none">arrow_downward</span>
                <span>RECEIVABLE — Client owes you</span>
              </span>
              <StatusBadge
                variant={invoice.status === "paid" ? "paid" : invoice.status === "overdue" ? "overdue" : "viewed"}
                pulse={invoice.status === "viewed" || invoice.status === "overdue"}
              >
                {invoice.status === "paid" ? "COLLECTED" : invoice.status.toUpperCase()}
              </StatusBadge>
              {invoice.currency && invoice.currency.toUpperCase() !== displayCurrency && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-primary/10 text-primary border border-primary/25">
                  Converted: {format(invoice.total, invoice.currency)}
                </span>
              )}
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

            {/* PayPal Sandbox Action Buttons */}
            {invoice.status !== "paid" ? (
              <>
                <button
                  type="button"
                  disabled={isProcessingPayPal}
                  onClick={handleCreatePayPalOrder}
                  className="px-3.5 py-1.5 rounded-lg bg-primary/20 border border-primary/50 text-primary hover:bg-primary hover:text-black transition-all text-xs flex items-center gap-1.5 font-semibold shadow"
                >
                  <span className="material-symbols-outlined text-sm leading-none">payment</span>
                  <span>{isProcessingPayPal ? "Contacting PayPal..." : "Pay via PayPal Sandbox"}</span>
                </button>

                {(activeOrderId || invoice.paypalOrderId) && (
                  <button
                    type="button"
                    disabled={isProcessingPayPal}
                    onClick={handleCapturePayPalPayment}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500 hover:text-black transition-all text-xs flex items-center gap-1.5 font-semibold"
                  >
                    <span className="material-symbols-outlined text-sm leading-none">lock_open</span>
                    <span>Capture PayPal Payment</span>
                  </button>
                )}

                {!invoice.paypalInvoiceId && (
                  <button
                    type="button"
                    disabled={isProcessingPayPal}
                    onClick={handleSendViaPayPalInvoice}
                    className="px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant/30 text-on-surface hover:text-primary text-xs flex items-center gap-1.5 font-medium transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm leading-none">send</span>
                    <span>Send PayPal Invoice</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleStatusToggle("paid")}
                  className="px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant/30 text-on-surface hover:text-emerald-400 hover:border-emerald-400/40 transition-colors text-xs flex items-center gap-1.5 font-medium"
                >
                  <span className="material-symbols-outlined text-sm leading-none">check_circle</span>
                  <span>Mark as Paid</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsRefundModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-error/10 border border-error/40 text-error hover:bg-error hover:text-white transition-colors text-xs flex items-center gap-1.5 font-medium"
                >
                  <span className="material-symbols-outlined text-sm leading-none">currency_exchange</span>
                  <span>Issue PayPal Refund</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleStatusToggle("sent")}
                  className="px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant/30 text-on-surface hover:text-amber-400 hover:border-amber-400/40 transition-colors text-xs flex items-center gap-1.5 font-medium"
                >
                  <span className="material-symbols-outlined text-sm leading-none">undo</span>
                  <span>Reopen Invoice</span>
                </button>
              </>
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
                  {invoice.status === "paid" ? "Payment Collected" : invoice.status === "overdue" ? "Delayed Sign-Off Detected" : "Awaiting Client Payment"}
                </span>
              </div>
              <p className="font-body-md text-xs lg:text-sm text-on-surface leading-relaxed max-w-4xl">
                {invoice.aiTelemetryNote || "Invoice payment monitoring actively tracked by FreelancePay AI."}
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

        {/* Right Column (4 cols): Settlement Telemetry & Milestone Verification */}
        <div className="lg:col-span-4 space-y-6">
          {/* Rail Details Card */}
          <GlassPanel elevation={1} className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2.5">
              <span className="font-label-md text-xs font-semibold text-on-surface">
                Payment Method &amp; Rail
              </span>
              <span className="material-symbols-outlined text-primary text-base">payments</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-outline text-[10px] uppercase block">Payment Rail</span>
                <span className="font-medium text-primary text-sm flex items-center gap-1.5">
                  <span>{invoice.paymentChannel}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-primary/20 text-primary border border-primary/30">
                    Sandbox
                  </span>
                </span>
              </div>

              <div>
                <span className="text-outline text-[10px] uppercase block">Payment Status</span>
                <span className="text-emerald-400 font-medium">
                  {invoice.status === "paid" ? "Captured & Paid in Full" : "Ready for Client Payment"}
                </span>
              </div>

              {invoice.paypalOrderId && (
                <div>
                  <span className="text-outline text-[10px] uppercase block">PayPal Order ID</span>
                  <span className="font-mono text-on-surface text-[11px] break-all">{invoice.paypalOrderId}</span>
                </div>
              )}

              {invoice.paypalCaptureId && (
                <div>
                  <span className="text-outline text-[10px] uppercase block">PayPal Capture ID</span>
                  <span className="font-mono text-emerald-400 text-[11px] break-all">{invoice.paypalCaptureId}</span>
                </div>
              )}

              {invoice.paypalInvoiceId && (
                <div>
                  <span className="text-outline text-[10px] uppercase block">PayPal Invoicing ID</span>
                  <span className="font-mono text-secondary text-[11px] break-all">{invoice.paypalInvoiceId}</span>
                </div>
              )}

              <div>
                <span className="text-outline text-[10px] uppercase block">Tax Shield Allocation</span>
                <span className="font-mono text-secondary">
                  {formatCurrencyAmount(invoice.taxAmount > 0 ? invoice.taxAmount : (invoice.total * 0.20), invoice.currency || "USD")} (20% set aside)
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
                ? "Payment collected. Funds ready to allocate into your tax and business reserves."
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

      {/* Explicit User Confirmation Modal for Refunds */}
      {isRefundModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-surface-container-high border border-outline-variant/30 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-error text-xl">currency_exchange</span>
                <h3 className="text-base font-bold text-on-surface">Issue PayPal Sandbox Refund</h3>
              </div>
              <button
                onClick={() => setIsRefundModalOpen(false)}
                className="text-outline hover:text-white"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              This action initiates a real transaction refund via PayPal Sandbox REST APIs.
              All money movement requires your explicit user approval.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-outline uppercase font-mono text-[10px] mb-1">
                  Refund Amount ({invoice.currency})
                </label>
                <input
                  type="number"
                  step="0.01"
                  max={invoice.total}
                  min={0.01}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container border border-outline-variant/40 text-on-surface font-mono"
                />
                <span className="text-[10px] text-outline mt-1 block">
                  Original Invoice Total: {formatCurrencyAmount(invoice.total, invoice.currency || "USD")}
                </span>
              </div>

              <div>
                <label className="block text-outline uppercase font-mono text-[10px] mb-1">
                  Reason for Refund
                </label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container border border-outline-variant/40 text-on-surface text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsRefundModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-surface-container border border-outline-variant/30 text-xs font-medium text-outline hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessingPayPal}
                onClick={handleExecuteRefund}
                className="px-4 py-2 rounded-lg bg-error text-white text-xs font-semibold hover:bg-error/80 transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">check</span>
                <span>{isProcessingPayPal ? "Processing..." : "Confirm & Execute Refund"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
