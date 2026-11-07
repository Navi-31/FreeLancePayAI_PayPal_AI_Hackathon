import React from "react";
import { AppLayout } from "@/frontend/components/layout/AppLayout";
import { NegotiatorClient } from "@/frontend/features/ai/NegotiatorClient";

export default function AiPaymentNegotiatorPage() {
  return (
    <AppLayout
      pageTitle="AI Payment Negotiator"
      pageSubtitle="AUTONOMOUS AI • Algorithmic Dispute Resolution"
      userBadge="Private Vault Tier"
    >
      <NegotiatorClient />
    </AppLayout>
  );
}
