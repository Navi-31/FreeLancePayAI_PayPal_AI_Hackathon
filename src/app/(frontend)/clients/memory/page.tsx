import React from "react";
import { AppLayout } from "@/frontend/components/layout/AppLayout";
import { ClientDossierClient } from "@/frontend/features/clients/ClientDossierClient";

export default function ClientMemoryDossierPage() {
  return (
    <AppLayout
      pageTitle="Client Memory Dossier"
      pageSubtitle="AUTONOMOUS AI • Counterparty contract history, payment patterns, and strategic playbook"
    >
      <ClientDossierClient />
    </AppLayout>
  );
}
