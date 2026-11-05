import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { TaxEstimatorClient } from "@/features/tax/TaxEstimatorClient";

export default function TaxSetAsidePage() {
  return (
    <AppLayout
      pageTitle="Tax Set-Aside Intelligence"
      pageSubtitle="TREASURY & FISCAL • Institutional-grade predictive tax isolation, continuous escrow routing, and quarterly statutory timeline management"
    >
      <TaxEstimatorClient />
    </AppLayout>
  );
}
