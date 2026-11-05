"use client";

import React from "react";
import { InvoiceStatus } from "@/types/invoice";
import { cn } from "@/lib/utils";

export interface InvoiceFilterBarProps {
  activeStatus: "all" | InvoiceStatus;
  onStatusChange: (status: "all" | InvoiceStatus) => void;
  statusCounts: Record<"all" | InvoiceStatus, number>;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  sortBy: "date-desc" | "date-asc" | "amount-desc" | "amount-asc";
  onSortChange: (sort: "date-desc" | "date-asc" | "amount-desc" | "amount-asc") => void;
  onExportCsv: () => void;
  onBatchRemind: () => void;
}

export const InvoiceFilterBar: React.FC<InvoiceFilterBarProps> = ({
  activeStatus,
  onStatusChange,
  statusCounts,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  onExportCsv,
  onBatchRemind,
}) => {
  const tabs: Array<{ id: "all" | InvoiceStatus; label: string }> = [
    { id: "all", label: "All" },
    { id: "draft", label: "Draft" },
    { id: "sent", label: "Sent" },
    { id: "viewed", label: "Viewed" },
    { id: "paid", label: "Paid" },
    { id: "overdue", label: "Overdue" },
  ];

  return (
    <div className="rounded-xl bg-surface-container-lowest/90 backdrop-blur-xl p-3 border border-white/5 space-y-3">
      {/* Row 1: Status Tab Pills & Secondary Action Triggers */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Status Tab Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          {tabs.map((tab) => {
            const count = statusCounts[tab.id] || 0;
            const active = activeStatus === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onStatusChange(tab.id)}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg font-label-md text-xs font-semibold shrink-0 transition-all duration-150",
                  active
                    ? "bg-surface-container-high text-primary border border-primary/30 shadow-xs"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container/60"
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "ml-1.5 font-mono text-[11px]",
                    active ? "opacity-90" : "opacity-60",
                    tab.id === "viewed" && "text-secondary",
                    tab.id === "paid" && "text-emerald-400",
                    tab.id === "overdue" && "text-error"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Action Triggers: Export CSV & AI Batch Remind */}
        <div className="flex items-center gap-2 self-end lg:self-auto shrink-0">
          <button
            onClick={onExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-white/5 text-on-surface font-label-md text-xs transition-colors"
          >
            <span className="material-symbols-outlined text-base leading-none" data-icon="file_download">
              file_download
            </span>
            <span>Export CSV</span>
          </button>

          <button
            onClick={onBatchRemind}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-secondary-container via-surface-container-high to-surface-container border border-secondary/40 text-secondary hover:text-white font-label-md text-xs font-semibold transition-all violet-glow active:scale-[0.98]"
          >
            <span
              className="material-symbols-outlined text-base leading-none"
              data-icon="auto_awesome"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              auto_awesome
            </span>
            <span>AI Batch Remind</span>
          </button>
        </div>
      </div>

      {/* Row 2: Search Input and Filter Dropdowns */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2 border-t border-outline-variant/15">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {/* Inline Search */}
          <div className="relative min-w-[220px] flex-1 max-w-sm">
            <span
              className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-base pointer-events-none"
              data-icon="search"
            >
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by client, invoice # or project..."
              className="w-full bg-[#101016] border border-outline-variant/30 rounded-lg pl-8 pr-3 py-1.5 text-xs text-on-surface placeholder:text-outline focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
            <span className="text-[11px] font-medium text-outline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as "date-desc" | "date-asc" | "amount-desc" | "amount-asc")}
              className="bg-[#101016] border border-outline-variant/30 rounded-lg px-2.5 py-1.5 text-xs text-on-surface focus:outline-none focus:border-primary/50"
            >
              <option value="date-desc">Newest Issue Date</option>
              <option value="date-asc">Oldest Issue Date</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
            </select>
          </div>
        </div>

        <span className="text-[11px] text-on-surface-variant/70 font-mono">
          Showing matching filtered results
        </span>
      </div>
    </div>
  );
};
