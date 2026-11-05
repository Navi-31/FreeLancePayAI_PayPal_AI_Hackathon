import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { RescueClient } from "@/features/ai/RescueClient";

export default function AiCashflowRescuePage() {
  return (
    <AppLayout
      pageTitle="AI Cashflow Rescue"
      pageSubtitle="AUTONOMOUS AI • Proactive Liquidity Sentinel"
      userBadge="Private Vault Tier"
    >
      <RescueClient />
    </AppLayout>
  );
}
