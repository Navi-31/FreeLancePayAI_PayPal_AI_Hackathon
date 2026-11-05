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
    // Match either exact ID or without '#' or with '#'
    const cleanId = invoiceId.replace(/^#/, "");
    const match = list.find((i) => i.id === cleanId || i.id === invoiceId);
    setInvoice(match || null);
    setLoading(false);
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
