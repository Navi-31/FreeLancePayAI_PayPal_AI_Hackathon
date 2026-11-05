import React from "react";
import { Invoice } from "@/types/invoice";
import { StatusBadge } from "@/components/ui/StatusBadge";

export interface InvoicePaperPreviewProps {
  invoice: Partial<Invoice>;
  interactive?: boolean;
}

export const InvoicePaperPreview: React.FC<InvoicePaperPreviewProps> = ({ invoice }) => {
  const lineItems = invoice.lineItems || [];
  const subtotal = invoice.subtotal || 0;
  const taxRate = invoice.taxRatePercent || 0;
  const taxAmount = invoice.taxAmount || 0;
  const total = invoice.total || subtotal;

  return (
    <div className="bg-surface-container-lowest/90 backdrop-blur-2xl rounded-xl border border-white/5 p-6 lg:p-8 shadow-2xl relative space-y-6">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start border-b border-outline-variant/30 pb-6 gap-4">
        {/* Issuer / Remit To */}
        <div className="space-y-1">
          <span className="font-label-sm text-[10px] uppercase tracking-wider text-outline block">
            Issuer / Remit To
          </span>
          <h3 className="font-headline-sm text-base lg:text-lg font-semibold text-on-surface">
            Alex Vance Studio
          </h3>
          <p className="font-body-sm text-xs text-on-surface-variant">
            Austin, TX • alex@vance.design
          </p>
          <div className="flex items-center gap-2 font-mono text-[10px] text-outline pt-1">
            <span>Tax ID: XX-XXXX901</span>
            <span>•</span>
            <span>DUNS: 88-109-4412</span>
          </div>
        </div>

        {/* Bill To & Protocol Header */}
        <div className="space-y-1 sm:text-right">
          <span className="font-label-sm text-[10px] uppercase tracking-wider text-outline block">
            Bill To Client
          </span>
          <h4 className="font-headline-sm text-base font-semibold text-primary">
            {invoice.clientName || "Client Identity Pending"}
          </h4>
          <p className="font-body-sm text-xs text-on-surface-variant truncate max-w-xs sm:ml-auto">
            {invoice.clientEmail || "billing@client.com"}
          </p>
          {invoice.clientAddress && (
            <p className="font-body-sm text-[11px] text-on-surface-variant/70">
              {invoice.clientAddress}
            </p>
          )}
        </div>
      </div>

      {/* Protocol Metadata Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-lg bg-surface-container-low/70 border border-outline-variant/20 text-xs">
        <div>
          <span className="font-label-sm text-[10px] text-outline block uppercase tracking-wider">
            Invoice Number
          </span>
          <span className="font-mono font-semibold text-primary">
            #{invoice.id || "FP-8850"}
          </span>
        </div>
        <div>
          <span className="font-label-sm text-[10px] text-outline block uppercase tracking-wider">
            Issue Date
          </span>
          <span className="font-mono text-on-surface">
            {invoice.issueDate || "Today"}
          </span>
        </div>
        <div>
          <span className="font-label-sm text-[10px] text-outline block uppercase tracking-wider">
            Due Date
          </span>
          <span className="font-mono text-on-surface font-medium">
            {invoice.dueDate || "Net-14"}
          </span>
        </div>
        <div>
          <span className="font-label-sm text-[10px] text-outline block uppercase tracking-wider">
            Payment Rail
          </span>
          <span className="font-mono text-secondary">
            {invoice.paymentChannel || "PayPal Direct"}
          </span>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-outline-variant/20 text-outline text-[10px] font-label-sm uppercase tracking-wider">
              <th className="py-2.5 px-3">Description</th>
              <th className="py-2.5 px-3 text-right">Qty / Hrs</th>
              <th className="py-2.5 px-3 text-right">Unit Rate</th>
              <th className="py-2.5 px-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10 text-on-surface">
            {lineItems.length > 0 ? (
              lineItems.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-surface-container/30 transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-medium text-on-surface">
                      {item.description || "Deliverable specification"}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-on-surface-variant">
                    {item.quantity}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-on-surface-variant">
                    ${item.rate.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-medium text-on-surface">
                    ${item.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-6 text-center text-outline italic">
                  No line items specified yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Totals Calculation */}
      <div className="pt-4 border-t border-outline-variant/30 flex flex-col items-end space-y-2 text-xs">
        <div className="flex justify-between w-64 text-on-surface-variant">
          <span>Subtotal:</span>
          <span className="font-mono text-on-surface font-medium">
            ${subtotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {taxRate > 0 && (
          <div className="flex justify-between w-64 text-on-surface-variant">
            <span>Tax Shield ({taxRate}%):</span>
            <span className="font-mono text-secondary">
              ${taxAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        )}

        <div className="flex justify-between w-64 pt-2 border-t border-outline-variant/20 text-sm">
          <span className="font-semibold text-on-surface">Grand Total:</span>
          <span className="font-numeric-metric font-bold text-primary text-base">
            ${total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Status & Payment Channel Indicator */}
      {invoice.status && (
        <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs">
          <span className="text-[11px] text-outline font-medium">Protocol Status:</span>
          <StatusBadge variant={invoice.status === "paid" ? "paid" : invoice.status === "overdue" ? "overdue" : "viewed"}>
            {invoice.status.toUpperCase()}
          </StatusBadge>
        </div>
      )}
    </div>
  );
};
