import React from "react";
import { AppLayout } from "@/frontend/components/layout/AppLayout";
import { ClientDossierClient } from "@/frontend/features/clients/ClientDossierClient";

export default function ClientMemoryDossierPage() {
  return (
    <AppLayout
      pageTitle="Client Memory Dossier"
      pageSubtitle="AUTONOMOUS AI • Counterparty contract history, payment patterns, and strategic playbook"
    >
      <React.Suspense fallback={<div className="p-8 text-neutral-400 font-mono text-sm">Loading client dossier...</div>}>
        <ClientDossierClient />
      </React.Suspense>
    </AppLayout>
  );
}
