import React from "react";
import Link from "next/link";
import { Invoice, InvoiceStatus } from "@/shared/types/invoice";
import { StatusBadge, StatusVariant } from "@/frontend/components/ui/StatusBadge";

export interface InvoiceTableProps {
  invoices: Invoice[];
  onStatusChange?: (id: string, newStatus: InvoiceStatus) => void;
}

export const InvoiceTable: React.FC<InvoiceTableProps> = ({ invoices }) => {
  const mapStatusToVariant = (status: string): StatusVariant => {
    switch (status) {
      case "paid":
        return "paid";
      case "viewed":
        return "viewed";
      case "overdue":
        return "overdue";
      case "sent":
        return "neutral";
      case "draft":
        return "neutral";
      default:
        return "neutral";
    }
  };

  const formatStatusLabel = (status: string): string => {
    switch (status) {
      case "paid":
        return "Collected";
      case "viewed":
        return "Viewed by Client";
      case "overdue":
        return "Overdue";
      case "sent":
        return "Sent (Pending)";
      case "draft":
        return "Draft";
      default:
        return status;
    }
  };

  if (invoices.length === 0) {
    return (
      <div className="rounded-xl bg-surface-container-lowest/80 border border-outline-variant/20 p-12 text-center space-y-4">
        <span className="material-symbols-outlined text-4xl text-outline" data-icon="search_off">
          search_off
        </span>
        <h4 className="font-headline-sm text-base text-on-surface font-semibold">
          No matching invoices found
        </h4>
        <p className="font-body-sm text-xs text-on-surface-variant max-w-sm mx-auto">
          No active invoices matched your filter, or your account ledger is currently empty.
        </p>
        <div className="pt-2">
          <Link
            href="/invoices/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-on-primary-fixed text-xs font-semibold shadow hover:brightness-110 transition-all"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            <span>Create Your First Invoice</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden bg-surface-container-lowest/90 backdrop-blur-xl border border-white/5 shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-surface-container text-on-surface-variant font-label-sm border-b border-outline-variant/20 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3.5 px-5 font-semibold">Invoice ID</th>
              <th className="py-3.5 px-5 font-semibold">Client &amp; Project</th>
              <th className="py-3.5 px-5 font-semibold text-right">Amount to Collect</th>
              <th className="py-3.5 px-5 font-semibold">Payment Rail</th>
              <th className="py-3.5 px-5 font-semibold">Payment Status</th>
              <th className="py-3.5 px-5 font-semibold">Payment Risk</th>
              <th className="py-3.5 px-5 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10 text-on-surface">
            {invoices.map((inv) => (
              <tr
                key={inv.id}
                className="hover:bg-surface-container-high/40 transition-colors group"
              >
                {/* Invoice ID & Direction */}
                <td className="py-4 px-5">
                  <div className="flex flex-col gap-1.5">
                    <Link
                      href={`/invoices/${inv.id}`}
                      className="font-mono font-medium text-primary hover:underline flex items-center gap-1.5"
                    >
                      <span>#{inv.id}</span>
                    </Link>
                    <div>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 whitespace-nowrap">
                        <span className="material-symbols-outlined text-[12px] leading-none">arrow_downward</span>
                        <span>RECEIVABLE — Client owes you</span>
                      </span>
                    </div>
                  </div>
                </td>

                {/* Client & Project */}
                <td className="py-4 px-5">
                  <div className="font-medium text-on-surface group-hover:text-primary transition-colors">
                    {inv.clientName}
                  </div>
                  <div className="text-[11px] text-on-surface-variant truncate max-w-xs">
                    {inv.projectTitle}
                  </div>
                </td>

                {/* Amount */}
                <td className="py-4 px-5 font-mono font-semibold text-right text-sm">
                  ${inv.total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>

                {/* Channel Rail */}
                <td className="py-4 px-5">
                  <span className="px-2 py-0.5 rounded bg-surface-container-high border border-outline-variant/40 text-on-surface text-[10px] font-mono">
                    {inv.paymentChannel}
                  </span>
                </td>

                {/* Status */}
                <td className="py-4 px-5">
                  <StatusBadge
                    variant={mapStatusToVariant(inv.status)}
                    pulse={inv.status === "viewed" || inv.status === "overdue"}
                  >
                    {formatStatusLabel(inv.status)}
                  </StatusBadge>
                </td>

                {/* AI Risk Score */}
                <td className="py-4 px-5">
                  <div className="flex items-center gap-1.5 text-xs">
                    {inv.aiRiskScore === "High" && (
                      <span className="text-error font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-error" />
                        <span>High Risk</span>
                      </span>
                    )}
                    {inv.aiRiskScore === "Moderate" && (
                      <span className="text-amber-400 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <span>Moderate</span>
                      </span>
                    )}
                    {inv.aiRiskScore === "Low" && (
                      <span className="text-emerald-400 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>Low Risk</span>
                      </span>
                    )}
                    {!inv.aiRiskScore && (
                      <span className="text-outline font-mono text-[10px]">Normal</span>
                    )}
                  </div>
                </td>

                {/* Action Link */}
                <td className="py-4 px-5 text-right">
                  <Link
                    href={`/invoices/${inv.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant/30 text-on-surface hover:text-primary hover:border-primary/40 transition-all text-xs font-medium"
                  >
                    <span>Inspect</span>
                    <span className="material-symbols-outlined text-sm leading-none" data-icon="chevron_right">
                      chevron_right
                    </span>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
