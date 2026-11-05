import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ForecastClient } from "@/features/forecast/ForecastClient";

export default function CashflowForecastPage() {
  return (
    <AppLayout
      pageTitle="Cashflow Forecast & Runway Trajectory"
      pageSubtitle="TREASURY & FISCAL • Predictive Bayesian runway modeling, upcoming event ledgers, and escrow trajectory simulation"
    >
      <ForecastClient />
    </AppLayout>
  );
}
