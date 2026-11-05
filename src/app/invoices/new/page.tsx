import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { InvoiceForm } from "@/features/invoices/InvoiceForm";

export default function CreateInvoicePage() {
  return (
    <AppLayout
      pageTitle="Create Invoice"
      pageSubtitle="CORE PROTOCOL • Autonomous Wealth Engine"
    >
      <InvoiceForm />
    </AppLayout>
  );
}
