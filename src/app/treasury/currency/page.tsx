import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { CurrencyIntelligenceClient } from "@/features/treasury/CurrencyIntelligenceClient";

export default function FeeAndCurrencyPage() {
  return (
    <AppLayout
      pageTitle="Fee & Currency Intelligence"
      pageSubtitle="TREASURY & FISCAL • Gateway processing friction, interchange drag, and cross-border FX slippage audit"
    >
      <CurrencyIntelligenceClient />
    </AppLayout>
  );
}
