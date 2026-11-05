import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { InvoicesClient } from "@/features/invoices/InvoicesClient";

export default function InvoicesPage() {
  return (
    <AppLayout
      pageTitle="Invoices"
      pageSubtitle="CORE PROTOCOL • Autonomous Wealth Engine"
    >
      <InvoicesClient />
    </AppLayout>
  );
}
