"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Transaction } from "../types";
import {
  loadTransactionsFromStorage,
  calculateTransactionKpis,
  exportTransactionsToCsv,
  downloadCsvFile,
} from "../transactionStore";
import { cn } from "@/shared/utils";

export const TransactionsClient: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState("This Quarter");
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [currencyFilter, setCurrencyFilter] = useState("All");
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLiveDb, setIsLiveDb] = useState<boolean>(false);

  useEffect(() => {
    const localData = loadTransactionsFromStorage();
    setTransactions(localData);

    fetch("/api/transactions")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.transactions)) {
          const mapped: Transaction[] = data.transactions.map((t: Record<string, unknown>) => ({
            id: String(t.code || t.id),
            hash: String(t.hash || "0x98a1..bc7e"),
            timestamp: typeof t.timestamp === "string" ? t.timestamp.replace("T", " ").substring(0, 19) : new Date().toISOString().substring(0, 19),
            description: String(t.description || ""),
            clientName: String(t.clientName || "Client"),
            type: t.type as Transaction["type"],
            status: t.status as Transaction["status"],
            currency: String(t.currency || "USD"),
            currencySymbol: String(t.currencySymbol || "$"),
            grossAmount: Number(t.grossAmount),
            feeAmount: Number(t.feeAmount || 0),
            fxCost: Number(t.fxCost || 0),
            netAmount: Number(t.netAmount),
            taxReserveSplitAmount: Number(t.taxReserveSplitAmount || 0),
            paymentChannel: String(t.paymentChannel || "PayPal Direct") as Transaction["paymentChannel"],
            linkedInvoiceId: t.linkedInvoiceId ? String(t.linkedInvoiceId) : undefined,
            linkedMilestoneId: t.linkedMilestoneId ? String(t.linkedMilestoneId) : undefined,
            notes: t.notes ? String(t.notes) : undefined,
          }));
          setTransactions(mapped);
          setIsLiveDb(true);
        }
      })
      .catch(() => {});
  }, []);

  const kpis = useMemo(() => {
    return calculateTransactionKpis(transactions, currencyFilter);
  }, [transactions, currencyFilter]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.hash.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.linkedInvoiceId && t.linkedInvoiceId.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.linkedMilestoneId && t.linkedMilestoneId.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesType =
        typeFilter === "All" ||
        t.type === typeFilter ||
        (typeFilter === "milestone_capture" && t.type === "escrow_capture") ||
        (typeFilter === "milestone_authorization" && t.type === "escrow_authorization");

      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "authorized_held" && (t.status === "held" || t.status === "authorized")) ||
        t.status === statusFilter;

      const matchesCurrency =
        currencyFilter === "All" || t.currency === currencyFilter;

      return matchesSearch && matchesType && matchesStatus && matchesCurrency;
    });
  }, [transactions, searchQuery, typeFilter, statusFilter, currencyFilter]);

  const handleExportCsv = () => {
    const csvData = exportTransactionsToCsv(filteredTransactions);
    const dateStr = new Date().toISOString().substring(0, 10);
    downloadCsvFile(csvData, `freelancepay_reconciliation_${dateStr}.csv`);

    setToastMessage(`[EXPORT SUCCESS] Generated RFC-4180 CSV with ${filteredTransactions.length} records.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "settled":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Settled
          </span>
        );
      case "held":
      case "authorized":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider inline-flex items-center gap-1 bg-amber-500/10 text-amber-300 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Authorized / Held
          </span>
        );
      case "pending":
      case "processing":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider inline-flex items-center gap-1 bg-sky-500/10 text-sky-400 border border-sky-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            Pending
          </span>
        );
      case "failed":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider inline-flex items-center gap-1 bg-red-500/10 text-red-400 border border-red-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            Failed
          </span>
        );
      case "refunded":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider inline-flex items-center gap-1 bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            Refunded
          </span>
        );
      case "reversed":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider inline-flex items-center gap-1 bg-orange-500/10 text-orange-400 border border-orange-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
            Reversed
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider inline-block bg-surface-container-high text-on-surface-variant border border-outline-variant/30">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Simulation / Live Banner Notice */}
      <div className="p-3 rounded-xl bg-surface-container-lowest border border-primary/20 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-primary/20 text-primary font-mono font-semibold uppercase tracking-wider text-[10px] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            {isLiveDb ? "Live Firestore Database Ledger" : "Demo Ledger"}
          </span>
          <span className="text-on-surface-variant">
            {isLiveDb
              ? "Reconciled ledger from your Firestore database with deterministic fee splits and RFC-4180 CSV export."
              : "Simulated institutional transactions ledger with deterministic fee breakdowns and RFC-4180 CSV export. Not an actual payment processor statement."}
          </span>
        </div>
        <span className="text-secondary flex items-center gap-1 font-label-sm font-medium">
          <span className="material-symbols-outlined text-sm">auto_fix_high</span>
          20% Tax Vault Auto-Shield Integrated
        </span>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 text-primary text-xs flex items-center justify-between shadow-lg animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-base">file_download_done</span>
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-primary hover:underline text-xs font-semibold">
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant/20 pb-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="font-headline-lg text-2xl md:text-3xl font-semibold tracking-tight text-on-surface">
              Transactions Ledger
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high/80 border border-primary/30 text-primary text-xs font-label-sm flex items-center gap-1 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Live Sync (Block #198242)
            </span>
          </div>
          <p className="font-body-md text-sm text-on-surface-variant max-w-3xl">
            Granular real-time record of all client settlements, milestone authorizations/captures, fee deductions, and currency conversions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest border border-primary/40 hover:border-primary text-primary text-xs font-semibold shadow-sm active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-base">cloud_download</span>
            <span>Export Reconciliation CSV</span>
          </button>
        </div>
      </section>

      {/* Multi-Currency Warning Notice (if multiple currencies present without automated conversion rates) */}
      {kpis.isMultiCurrency && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2.5">
          <span className="material-symbols-outlined text-base text-amber-400">info</span>
          <span>
            Multiple currencies detected ({kpis.currencies.join(", ")}). Conversion rates between these currencies are unavailable; select a currency below to view exact single-currency totals without improper cross-currency addition.
          </span>
        </div>
      )}

      {/* 6-Card Financial Metrics Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* Card 1: Gross Settled Inflows */}
        <div className="p-4 rounded-xl bg-surface-container-lowest/80 backdrop-blur-md border border-outline-variant/20 relative overflow-hidden group hover:border-emerald-500/30 transition-all shadow-md">
          <div className="flex items-center justify-between text-on-surface-variant mb-2 text-xs">
            <span className="font-semibold text-on-surface">Gross Settled Inflows</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <span className="material-symbols-outlined text-sm">trending_up</span>
            </div>
          </div>
          <div className="font-numeric-metric text-xl lg:text-2xl font-bold text-on-surface tracking-tight">
            {kpis.isMultiCurrency ? (
              <span className="text-xs font-normal text-amber-400">Multi-Currency</span>
            ) : (
              `${kpis.currencySymbol}${kpis.grossSettledInflows.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            )}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-on-surface-variant">
            <span className="text-emerald-400 font-medium">{kpis.settledCount} settled</span>
            <span>inflows</span>
          </div>
          <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Card 2: Processing Fees */}
        <div className="p-4 rounded-xl bg-surface-container-lowest/80 backdrop-blur-md border border-outline-variant/20 relative overflow-hidden group hover:border-error/30 transition-all shadow-md">
          <div className="flex items-center justify-between text-on-surface-variant mb-2 text-xs">
            <span className="font-semibold text-on-surface">Processing Fees</span>
            <div className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-error/80">
              <span className="material-symbols-outlined text-sm">price_change</span>
            </div>
          </div>
          <div className="font-numeric-metric text-xl lg:text-2xl font-bold text-error tracking-tight">
            {kpis.isMultiCurrency ? (
              <span className="text-xs font-normal text-amber-400">Multi-Currency</span>
            ) : (
              `-${kpis.currencySymbol}${kpis.processingFees.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            )}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-on-surface-variant">
            <span>On settled payments</span>
          </div>
          <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-error/5 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Card 3: FX Costs */}
        <div className="p-4 rounded-xl bg-surface-container-lowest/80 backdrop-blur-md border border-outline-variant/20 relative overflow-hidden group hover:border-secondary/30 transition-all shadow-md">
          <div className="flex items-center justify-between text-on-surface-variant mb-2 text-xs">
            <span className="font-semibold text-on-surface">FX Costs</span>
            <div className="w-7 h-7 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-sm">currency_exchange</span>
            </div>
          </div>
          <div className="font-numeric-metric text-xl lg:text-2xl font-bold text-on-surface tracking-tight">
            {kpis.isMultiCurrency ? (
              <span className="text-xs font-normal text-amber-400">Multi-Currency</span>
            ) : (
              `-${kpis.currencySymbol}${kpis.fxCosts.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            )}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-on-surface-variant">
            <span>Conversion costs</span>
          </div>
          <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-secondary/10 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Card 4: Refunds & Reversals */}
        <div className="p-4 rounded-xl bg-surface-container-lowest/80 backdrop-blur-md border border-outline-variant/20 relative overflow-hidden group hover:border-amber-400/30 transition-all shadow-md">
          <div className="flex items-center justify-between text-on-surface-variant mb-2 text-xs">
            <span className="font-semibold text-on-surface">Refunds &amp; Reversals</span>
            <div className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-amber-400">
              <span className="material-symbols-outlined text-sm">assignment_return</span>
            </div>
          </div>
          <div className="font-numeric-metric text-xl lg:text-2xl font-bold text-amber-400 tracking-tight">
            {kpis.isMultiCurrency ? (
              <span className="text-xs font-normal text-amber-400">Multi-Currency</span>
            ) : (
              `-${kpis.currencySymbol}${kpis.refundsAndReversals.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            )}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-on-surface-variant">
            <span>{kpis.refundCount} returned or reversed</span>
          </div>
          <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Card 5: Net Cash Received */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-surface-container-high/60 to-surface-container-lowest backdrop-blur-md border border-primary/40 relative overflow-hidden group shadow-md auric-glow">
          <div className="flex items-center justify-between text-primary mb-2 text-xs">
            <span className="font-bold text-primary">Net Cash Received</span>
            <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-sm">account_balance_wallet</span>
            </div>
          </div>
          <div className="font-numeric-metric text-xl lg:text-2xl font-bold text-primary tracking-tight">
            {kpis.isMultiCurrency ? (
              <span className="text-xs font-normal text-amber-400">Multi-Currency</span>
            ) : (
              `${kpis.currencySymbol}${kpis.netCashReceived.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            )}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-on-surface-variant">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Settled - Fees - FX - Refunds</span>
          </div>
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-primary/15 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Card 6: Pending Authorizations */}
        <div className="p-4 rounded-xl bg-surface-container-lowest/80 backdrop-blur-md border border-outline-variant/20 relative overflow-hidden group hover:border-amber-500/30 transition-all shadow-md">
          <div className="flex items-center justify-between text-on-surface-variant mb-2 text-xs">
            <span className="font-semibold text-on-surface">Pending Authorizations</span>
            <div className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-amber-300">
              <span className="material-symbols-outlined text-sm">lock_clock</span>
            </div>
          </div>
          <div className="font-numeric-metric text-xl lg:text-2xl font-bold text-amber-300 tracking-tight">
            {kpis.isMultiCurrency ? (
              <span className="text-xs font-normal text-amber-400">Multi-Currency</span>
            ) : (
              `${kpis.currencySymbol}${kpis.pendingAuthorizations.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            )}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-on-surface-variant">
            <span className="text-amber-300 font-medium">{kpis.authorizedCount} authorized</span>
            <span>(uncaptured)</span>
          </div>
          <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
        </div>
      </section>

      {/* Search, Filter & Export Toolbar */}
      <section className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[300px]">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search transaction hash, invoice ID, client..."
              className="w-full bg-surface-container-high/60 border border-outline-variant/30 rounded-lg pl-9 pr-3 py-1.5 text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary"
            />
          </div>

          {/* Date Range Selector */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-surface-container-high/60 border border-outline-variant/30 rounded-lg px-2.5 py-1.5 text-xs text-on-surface focus:outline-none focus:border-primary"
          >
            <option value="All Time">All Time</option>
            <option value="This Month">This Month</option>
            <option value="This Quarter">This Quarter (Q2 2025)</option>
            <option value="Last Quarter">Last Quarter</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-surface-container-high/60 border border-outline-variant/30 rounded-lg px-2.5 py-1.5 text-xs text-on-surface focus:outline-none focus:border-primary"
          >
            <option value="All">All Types</option>
            <option value="client_settlement">Client Settlement</option>
            <option value="milestone_capture">Milestone Capture</option>
            <option value="milestone_authorization">Milestone Authorization</option>
            <option value="refund">Refund</option>
            <option value="reversal">Reversal</option>
            <option value="payout">Payout</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-surface-container-high/60 border border-outline-variant/30 rounded-lg px-2.5 py-1.5 text-xs text-on-surface focus:outline-none focus:border-primary"
          >
            <option value="All">All Statuses</option>
            <option value="settled">Settled</option>
            <option value="authorized_held">Authorized / Held</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
            <option value="reversed">Reversed</option>
          </select>

          {/* Currency Pills */}
          <div className="flex items-center rounded-lg bg-surface-container-high/60 p-0.5 border border-outline-variant/30 text-xs">
            {["All", "USD", "EUR", "GBP"].map((curr) => (
              <button
                key={curr}
                onClick={() => setCurrencyFilter(curr)}
                className={cn(
                  "px-2.5 py-1 rounded transition-all text-[11px]",
                  currencyFilter === curr
                    ? "bg-surface-container-highest text-primary font-semibold shadow-xs"
                    : "text-on-surface-variant hover:text-on-surface"
                )}
              >
                {curr}
              </button>
            ))}
          </div>
        </div>

        {/* Counter */}
        <span className="text-xs text-on-surface-variant">
          Showing <strong className="text-on-surface">{filteredTransactions.length}</strong> entries
        </span>
      </section>

      {/* Transactions Table */}
      <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-md overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="border-b border-outline-variant/20 text-[11px] font-label-sm text-on-surface-variant uppercase tracking-wider">
              <th className="py-3 px-3">Transaction ID &amp; Hash</th>
              <th className="py-3 px-3">Date &amp; Time</th>
              <th className="py-3 px-3">Description &amp; Client</th>
              <th className="py-3 px-3">Channel &amp; Type</th>
              <th className="py-3 px-3 text-right">Gross</th>
              <th className="py-3 px-3 text-right">Fee &amp; FX</th>
              <th className="py-3 px-3 text-right">Net Amount</th>
              <th className="py-3 px-3 text-center">Status</th>
              <th className="py-3 px-3 text-right">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/15 text-xs">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-on-surface-variant">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <span className="material-symbols-outlined text-4xl text-outline">receipt_long</span>
                    <div className="font-semibold text-sm text-on-surface">No settlement transactions recorded</div>
                    <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
                      Invoices settled via Stripe Connect, PayPal Direct, or SWIFT Wire appear automatically in this cryptographically sealed ledger.
                    </p>
                    <Link
                      href="/invoices"
                      className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-on-primary-fixed text-xs font-semibold shadow hover:brightness-110"
                    >
                      <span className="material-symbols-outlined text-sm">receipt</span>
                      View Active Invoices
                    </Link>
                  </div>
                </td>
              </tr>
            ) : (
              filteredTransactions.map((t) => {
                const isSelected = t.id === selectedTxn?.id;

                return (
                  <tr
                    key={t.id}
                    onClick={() => setSelectedTxn(t)}
                    className={cn(
                      "transition-colors cursor-pointer group",
                      isSelected ? "bg-surface-container-high/60" : "hover:bg-surface-container/40"
                    )}
                  >
                    {/* ID & Hash */}
                    <td className="py-3 px-3">
                      <div className="font-mono text-xs font-semibold text-on-surface">
                        {t.id}
                      </div>
                      <div className="text-[10px] text-on-surface-variant font-mono truncate max-w-[120px]">
                        {t.hash}
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-3 text-on-surface-variant text-xs">
                      {t.timestamp}
                    </td>

                    {/* Description & Client */}
                    <td className="py-3 px-3 max-w-xs">
                      <div className="font-medium text-on-surface text-xs truncate">
                        {t.description}
                      </div>
                      <div className="text-[11px] text-primary flex items-center gap-1.5 mt-0.5">
                        <span>{t.clientName}</span>
                        {(t.linkedInvoiceId || t.linkedMilestoneId) && (
                          <span className="text-[10px] font-mono px-1 rounded bg-surface-container text-on-surface-variant">
                            {t.linkedInvoiceId ? `#${t.linkedInvoiceId}` : `#${t.linkedMilestoneId}`}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Channel & Type */}
                    <td className="py-3 px-3">
                      <span className="text-on-surface font-medium block text-xs">
                        {t.paymentChannel}
                      </span>
                      <span className="text-[10px] text-on-surface-variant capitalize">
                        {t.type.replace("_", " ")}
                      </span>
                    </td>

                    {/* Gross */}
                    <td className="py-3 px-3 text-right font-medium text-on-surface">
                      {t.grossAmount < 0 ? "-" : ""}
                      {t.currencySymbol || "$"}
                      {Math.abs(t.grossAmount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Fee & FX */}
                    <td className="py-3 px-3 text-right text-on-surface-variant">
                      {t.feeAmount > 0 || t.fxCost > 0 ? (
                        <span className="text-error font-medium">
                          -{t.currencySymbol || "$"}{(t.feeAmount + t.fxCost).toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-on-surface-variant/60">{t.currencySymbol || "$"}0.00</span>
                      )}
                    </td>

                    {/* Net Amount */}
                    <td className="py-3 px-3 text-right font-semibold text-primary">
                      {t.netAmount < 0 ? "-" : ""}
                      {t.currencySymbol || "$"}
                      {Math.abs(t.netAmount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 text-center">
                      {renderStatusBadge(t.status)}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTxn(t);
                        }}
                        className="p-1 rounded text-on-surface-variant hover:text-primary transition-colors"
                      >
                        <span className="material-symbols-outlined text-base">visibility</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Transaction Detail Drawer / Modal */}
      {selectedTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedTxn(null)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-surface-container-lowest border border-primary/30 p-6 shadow-2xl space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">receipt_long</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-base font-semibold text-on-surface">
                    Transaction Inspection
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-primary font-mono">{selectedTxn.id}</span>
                    {renderStatusBadge(selectedTxn.status)}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedTxn(null)}
                className="text-on-surface-variant hover:text-on-surface text-sm"
              >
                ✕
              </button>
            </div>

            {/* Financial Breakdown Card */}
            <div className="p-4 rounded-xl bg-surface-container-high/60 border border-outline-variant/30 space-y-2 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-outline-variant/20">
                <span className="text-on-surface-variant font-medium">Description</span>
                <span className="text-on-surface font-semibold text-right max-w-[240px] truncate">
                  {selectedTxn.description}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-on-surface-variant">Client Counterparty</span>
                <span className="text-primary font-medium">{selectedTxn.clientName}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-on-surface-variant">Settlement Rail</span>
                <span className="text-on-surface font-mono">{selectedTxn.paymentChannel}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-on-surface-variant">Timestamp</span>
                <span className="text-on-surface-variant">{selectedTxn.timestamp}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-on-surface-variant">Ledger Hash</span>
                <span className="text-[10px] font-mono text-on-surface-variant">{selectedTxn.hash}</span>
              </div>

              {/* Financial Math */}
              <div className="pt-2 mt-2 border-t border-outline-variant/20 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Gross Amount</span>
                  <span className="text-on-surface font-medium">
                    {selectedTxn.grossAmount < 0 ? "-" : ""}
                    {selectedTxn.currencySymbol || "$"}
                    {Math.abs(selectedTxn.grossAmount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between text-error">
                  <span>Gateway Processing Fee</span>
                  <span>
                    {selectedTxn.feeAmount > 0
                      ? `-${selectedTxn.currencySymbol || "$"}${selectedTxn.feeAmount.toFixed(2)}`
                      : "$0.00"}
                  </span>
                </div>

                {selectedTxn.fxCost > 0 && (
                  <div className="flex justify-between text-secondary">
                    <span>FX Spread / Conversion Cost</span>
                    <span>-{selectedTxn.currencySymbol || "$"}{selectedTxn.fxCost.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between font-bold text-sm text-primary pt-1.5 border-t border-outline-variant/20">
                  <span>
                    {selectedTxn.status === "held" || selectedTxn.status === "authorized"
                      ? "Authorized Pre-Release Amount"
                      : "Net Settled Amount"}
                  </span>
                  <span>
                    {selectedTxn.netAmount < 0 ? "-" : ""}
                    {selectedTxn.currencySymbol || "$"}
                    {Math.abs(selectedTxn.netAmount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {selectedTxn.taxReserveSplitAmount > 0 && selectedTxn.status === "settled" && (
                  <div className="flex justify-between text-[11px] text-emerald-400 pt-1">
                    <span>Autonomous 20% Tax Vault Allocation</span>
                    <span>+{selectedTxn.currencySymbol || "$"}{selectedTxn.taxReserveSplitAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Linked Entity info if available */}
            {(selectedTxn.linkedInvoiceId || selectedTxn.linkedMilestoneId) && (
              <div className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/20 text-xs flex items-center justify-between">
                <span className="text-on-surface-variant">Linked Commercial Entity:</span>
                {selectedTxn.linkedInvoiceId ? (
                  <Link
                    href={`/invoices`}
                    className="text-primary hover:underline font-mono font-semibold"
                  >
                    Invoice #{selectedTxn.linkedInvoiceId}
                  </Link>
                ) : (
                  <Link
                    href={`/milestones`}
                    className="text-secondary hover:underline font-mono font-semibold"
                  >
                    Milestone #{selectedTxn.linkedMilestoneId}
                  </Link>
                )}
              </div>
            )}

            {/* Simulation Guardrail */}
            <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[11px] flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">verified_user</span>
              <span>Deterministic local demo record. Suitable for reconciliation &amp; CSV export.</span>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedTxn(null)}
                className="px-4 py-2 rounded-lg bg-surface-container-high text-primary font-semibold text-xs"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
