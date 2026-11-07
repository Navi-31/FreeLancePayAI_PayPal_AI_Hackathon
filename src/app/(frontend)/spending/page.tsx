import React from "react";
import { AppLayout } from "@/frontend/components/layout/AppLayout";
import { SpendingClient } from "@/frontend/features/spending/SpendingClient";

export default function SpendingIntelligencePage() {
  return (
    <AppLayout
      pageTitle="Spending Intelligence & Outflows"
      pageSubtitle="TREASURY & FISCAL • Autonomous expense telemetry, runway preservation, and affordability simulation"
    >
      <SpendingClient />
    </AppLayout>
  );
}
