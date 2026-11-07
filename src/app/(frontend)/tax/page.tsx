import React from "react";
import { AppLayout } from "@/frontend/components/layout/AppLayout";
import { TaxEstimatorClient } from "@/frontend/features/tax/TaxEstimatorClient";

export default function TaxSetAsidePage() {
  return (
    <AppLayout
      pageTitle="Tax Set-Aside Intelligence"
      pageSubtitle="TREASURY & FISCAL • Institutional-grade predictive tax isolation, continuous tax reserve routing, and quarterly statutory timeline management"
    >
      <TaxEstimatorClient />
    </AppLayout>
  );
}
