import React from "react";
import { AppLayout } from "@/frontend/components/layout/AppLayout";
import { SimulatorClient } from "@/frontend/features/ai/SimulatorClient";

export default function SimulatorPage() {
  return (
    <AppLayout
      pageTitle="What-If Financial Simulator"
      pageSubtitle="AUTONOMOUS AI • Interactive Financial Sandbox"
      userBadge="Private Vault Tier"
    >
      <SimulatorClient />
    </AppLayout>
  );
}
