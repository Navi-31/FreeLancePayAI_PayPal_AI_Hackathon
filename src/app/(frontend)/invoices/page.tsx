import React from "react";
import { AppLayout } from "@/frontend/components/layout/AppLayout";
import { InvoicesClient } from "@/frontend/features/invoices/InvoicesClient";

export default function InvoicesPage() {
  return (
    <AppLayout
      pageTitle="Invoices"
      pageSubtitle="Client Invoices (Receivables) • Track money clients owe you"
    >
      <InvoicesClient />
    </AppLayout>
  );
}
