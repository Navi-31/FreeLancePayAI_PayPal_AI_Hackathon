"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Invoice } from "@/types/invoice";
import { loadInvoicesFromStorage } from "./invoiceStore";
import { InvoiceDetailsView } from "./InvoiceDetailsView";
import { AuricButton } from "@/components/ui/AuricButton";
import { GlassPanel } from "@/components/glass/GlassPanel";

export interface InvoiceDetailsClientProps {
  invoiceId: string;
}

export const InvoiceDetailsClient: React.FC<InvoiceDetailsClientProps> = ({ invoiceId }) => {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const list = loadInvoicesFromStorage();
    const cleanId = invoiceId.replace(/^#/, "");
    const match = list.find((i) => i.id === cleanId || i.id === invoiceId);
    if (match) {
      setInvoice(match);
      setLoading(false);
    }

    // Attempt server sync
    fetch(`/api/invoices/${encodeURIComponent(cleanId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.invoice) {
          const inv = data.invoice;
          setInvoice({
            id: inv.code || inv.id,
            clientName: inv.clientName,
            clientEmail: inv.clientEmail,
            clientAddress: inv.clientAddress || "",
            projectTitle: inv.projectTitle,
            issueDate: typeof inv.issueDate === "string" ? inv.issueDate.split("T")[0] : "2025-10-10",
            dueDate: typeof inv.dueDate === "string" ? inv.dueDate.split("T")[0] : "2025-10-24",
            poReference: inv.poReference || "",
            status: inv.status,
            paymentChannel: inv.paymentChannel || "PayPal Direct",
            currency: inv.currency || "USD",
            currencySymbol: inv.currencySymbol || "$",
            lineItems: Array.isArray(inv.lineItems)
              ? inv.lineItems.map((li: Record<string, unknown>) => ({
                  id: String(li.id),
                  description: String(li.description),
                  quantity: Number(li.quantity),
                  rate: Number(li.rate),
                  amount: Number(li.amount),
                }))
              : [],
            subtotal: Number(inv.subtotal),
            taxRatePercent: Number(inv.taxRatePercent || 0),
            taxAmount: Number(inv.taxAmount || 0),
            total: Number(inv.total),
            aiRiskScore: inv.aiRiskScore || "Low",
            aiTelemetryNote: inv.aiTelemetryNote || "",
            viewCount: Number(inv.viewCount || 0),
            notes: inv.notes || "",
          });
        }
      })
      .catch(() => {
        // Fallback remains active
      })
      .finally(() => setLoading(false));
  }, [invoiceId]);

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <span className="material-symbols-outlined text-4xl text-primary animate-spin">
          refresh
        </span>
        <p className="text-xs text-on-surface-variant font-mono">
          Loading invoice #{invoiceId}...
        </p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="max-w-xl mx-auto py-16 space-y-6 text-center">
        <GlassPanel elevation={2} className="p-8 space-y-4">
          <span className="material-symbols-outlined text-5xl text-amber-400">
            search_off
          </span>
          <h2 className="font-headline-md text-lg font-semibold text-on-surface">
            Invoice #{invoiceId} Not Found
          </h2>
          <p className="text-xs text-on-surface-variant max-w-sm mx-auto leading-relaxed">
            This invoice protocol record could not be found in your local ledger. It may have been archived or removed.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link href="/invoices">
              <AuricButton size="sm" icon="payments">
                Return to Invoices
              </AuricButton>
            </Link>
            <Link
              href="/invoices/new"
              className="px-3.5 py-1.5 rounded-lg bg-surface-container border border-outline-variant/30 text-on-surface hover:text-primary text-xs font-medium transition-colors"
            >
              + Create New Invoice
            </Link>
          </div>
        </GlassPanel>
      </div>
    );
  }

  return <InvoiceDetailsView initialInvoice={invoice} />;
};
