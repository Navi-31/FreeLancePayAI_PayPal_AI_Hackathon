import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ClientDossierClient } from "@/features/clients/ClientDossierClient";

export default function DynamicClientDossierPage() {
  return (
    <AppLayout
      pageTitle="Client Memory Dossier"
      pageSubtitle="AUTONOMOUS AI • Counterparty contract history, payment patterns, and strategic playbook"
    >
      <ClientDossierClient />
    </AppLayout>
  );
}
