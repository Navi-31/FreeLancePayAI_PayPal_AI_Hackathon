import React from "react";
import { AppLayout } from "@/frontend/components/layout/AppLayout";
import { ClientsClient } from "@/frontend/features/clients/ClientsClient";

export default function ClientIntelligencePage() {
  return (
    <AppLayout
      pageTitle="Client Intelligence & Risk Radar"
      pageSubtitle="AUTONOMOUS AI • Counterparty risk matrix, predictive settlement latency, and behavioral analytics"
    >
      <ClientsClient />
    </AppLayout>
  );
}
