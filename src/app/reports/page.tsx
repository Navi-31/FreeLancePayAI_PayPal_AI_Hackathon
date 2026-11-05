import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ReportsClient } from "@/features/reports/ReportsClient";

export default function ReportsAndAnalyticsPage() {
  return (
    <AppLayout
      pageTitle="Financial Reports & CPA Analytics"
      pageSubtitle="UTILITY ENGINE • Generate verified CPA-ready statements, tax reserve dossiers, client profitability audits, and liquidity ledgers"
    >
      <ReportsClient />
    </AppLayout>
  );
}
