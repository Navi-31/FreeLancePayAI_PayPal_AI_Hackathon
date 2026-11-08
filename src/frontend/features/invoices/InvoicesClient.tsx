"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Invoice, InvoiceStatus } from "@/shared/types/invoice";
import { loadInvoicesFromStorage, fetchInvoicesWithFallback } from "./invoiceStore";
import { InvoiceKpiCards } from "./InvoiceKpiCards";
import { InvoiceFilterBar } from "./InvoiceFilterBar";
import { InvoiceTable } from "./InvoiceTable";
import { AuricButton } from "@/frontend/components/ui/AuricButton";

export const InvoicesClient: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [activeStatus, setActiveStatus] = useState<"all" | InvoiceStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "amount-desc" | "amount-asc">("date-desc");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setInvoices(loadInvoicesFromStorage());
    fetchInvoicesWithFallback().then((live) => {
      if (live && live.length > 0) setInvoices(live);
    });
  }, []);

  // Compute status counts
  const statusCounts = useMemo(() => {
    const counts: Record<"all" | InvoiceStatus, number> = {
      all: invoices.length,
      draft: 0,
      sent: 0,
      viewed: 0,
      paid: 0,
      overdue: 0,
    };
    invoices.forEach((inv) => {
      if (counts[inv.status] !== undefined) {
        counts[inv.status]++;
      }
    });
    return counts;
  }, [invoices]);

  // Filter and sort invoices
  const filteredInvoices = useMemo(() => {
    return invoices
      .filter((inv) => {
        // Status filter
        if (activeStatus !== "all" && inv.status !== activeStatus) {
          return false;
        }
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchClient = inv.clientName.toLowerCase().includes(q);
          const matchProject = inv.projectTitle.toLowerCase().includes(q);
          const matchId = inv.id.toLowerCase().includes(q);
          if (!matchClient && !matchProject && !matchId) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "date-desc") {
          return new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime();
        }
        if (sortBy === "date-asc") {
          return new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime();
        }
        if (sortBy === "amount-desc") {
          return b.total - a.total;
        }
        if (sortBy === "amount-asc") {
          return a.total - b.total;
        }
        return 0;
      });
  }, [invoices, activeStatus, searchQuery, sortBy]);

  // Export CSV Handler
  const handleExportCsv = () => {
    const headers = ["Invoice ID", "Client", "Project", "Amount", "Currency", "Status", "Issue Date", "Due Date"];
    const rows = filteredInvoices.map((i) => [
      i.id,
      `"${i.clientName.replace(/"/g, '""')}"`,
      `"${i.projectTitle.replace(/"/g, '""')}"`,
      i.total,
      i.currency,
      i.status,
      i.issueDate,
      i.dueDate,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `invoices_export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToastMessage(`Exported ${filteredInvoices.length} invoices to CSV.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Batch Remind Handler
  const handleBatchRemind = () => {
    const overdueCount = invoices.filter((i) => i.status === "overdue" || i.status === "viewed").length;
    setToastMessage(`AI Batch Remind: Dispatched follow-up reminder notices to ${overdueCount} pending clients.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-3 rounded-lg bg-surface-container-high border border-primary/30 text-primary text-xs flex items-center justify-between auric-glow">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base">check_circle</span>
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-outline hover:text-on-surface">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="font-headline-lg text-xl lg:text-2xl font-semibold tracking-tight text-on-surface">
              Client Invoices
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-label-sm font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Receivables (Money Owed to You)
            </span>
          </div>
          <p className="font-body-md text-xs lg:text-sm text-on-surface-variant max-w-2xl">
            Outgoing invoices issued to your clients. Track amounts to collect, payment status, and automated client follow-ups.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Autonomous Telemetry Widget */}
          <div className="hidden sm:flex items-center gap-2.5 bg-surface-container-lowest/80 px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-on-surface-variant text-[11px]">Payment Direction:</span>
            <span className="font-semibold text-emerald-400 font-mono text-[11px]">Client Receivables</span>
          </div>

          <Link href="/invoices/new">
            <AuricButton size="md" icon="add">
              Create Invoice
            </AuricButton>
          </Link>
        </div>
      </div>

      {/* TOP SUMMARY KPI CARDS */}
      <InvoiceKpiCards invoices={invoices} />

      {/* FILTER & ACTION BAR */}
      <InvoiceFilterBar
        activeStatus={activeStatus}
        onStatusChange={setActiveStatus}
        statusCounts={statusCounts}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onExportCsv={handleExportCsv}
        onBatchRemind={handleBatchRemind}
      />

      {/* MAIN INVOICE LEDGER TABLE */}
      <InvoiceTable invoices={filteredInvoices} />
    </div>
  );
};
