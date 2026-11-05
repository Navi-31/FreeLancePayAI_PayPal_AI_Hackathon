import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ClientsClient } from "@/features/clients/ClientsClient";

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
