import React from "react";
import { AppLayout } from "@/frontend/components/layout/AppLayout";
import { TransactionsClient } from "@/frontend/features/payments/transactions/TransactionsClient";

export default function TransactionsPage() {
  return (
    <AppLayout
      pageTitle="Transactions Ledger"
      pageSubtitle="CORE PROTOCOL • Autonomous Real-time Settlement Registry"
      userBadge="Private Vault Tier"
    >
      <TransactionsClient />
    </AppLayout>
  );
}
