import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { NegotiatorClient } from "@/features/ai/NegotiatorClient";

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
