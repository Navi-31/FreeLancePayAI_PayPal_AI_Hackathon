import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ScannerClient } from "@/features/scanner/ScannerClient";

export default function DocumentScannerPage() {
  return (
    <AppLayout
      pageTitle="AI Document Intelligence Scanner"
      pageSubtitle="UTILITY ENGINE • Transform project contracts, SOWs, and agreements into verified PayPal invoice drafts"
    >
      <ScannerClient />
    </AppLayout>
  );
}
