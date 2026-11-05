import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { InvoiceDetailsClient } from "@/features/invoices/InvoiceDetailsClient";

export default async function InvoiceDetailsRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AppLayout
      pageTitle={`Invoice #${id}`}
      pageSubtitle="CORE PROTOCOL • Autonomous Wealth Engine"
    >
      <InvoiceDetailsClient invoiceId={id} />
    </AppLayout>
  );
}
