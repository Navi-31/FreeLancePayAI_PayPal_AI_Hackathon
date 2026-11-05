import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProfitabilityClient } from "@/features/profitability/ProfitabilityClient";

export default function ProjectProfitabilityPage() {
  return (
    <AppLayout
      pageTitle="Project Profitability Intelligence"
      pageSubtitle="TREASURY & FISCAL • Effective hourly yield, cost leakage auditing, and contract margin realization"
    >
      <ProfitabilityClient />
    </AppLayout>
  );
}
