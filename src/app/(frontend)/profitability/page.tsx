import React from "react";
import { AppLayout } from "@/frontend/components/layout/AppLayout";
import { ProfitabilityClient } from "@/frontend/features/profitability/ProfitabilityClient";

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
