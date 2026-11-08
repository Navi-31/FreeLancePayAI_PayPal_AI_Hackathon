import React from "react";
import { AppLayout } from "@/frontend/components/layout/AppLayout";
import { TransactionsClient } from "@/frontend/features/payments/transactions/TransactionsClient";

export default function TransactionsPage() {
  return (
    <AppLayout
      pageTitle="Transactions Ledger"
      pageSubtitle="Reconciled Settlement Registry • Track settled client payments, fees, and authorizations"
      userBadge="Verified Ledger"
    >
      <TransactionsClient />
    </AppLayout>
  );
}
