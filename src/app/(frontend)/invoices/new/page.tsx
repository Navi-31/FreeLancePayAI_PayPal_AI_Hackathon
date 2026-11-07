import React from "react";
import { AppLayout } from "@/frontend/components/layout/AppLayout";
import { InvoiceForm } from "@/frontend/features/invoices/InvoiceForm";

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
