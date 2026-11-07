import React from "react";
import { AppLayout } from "@/frontend/components/layout/AppLayout";
import { ForecastClient } from "@/frontend/features/forecast/ForecastClient";

export default function CashflowForecastPage() {
  return (
    <AppLayout
      pageTitle="Cashflow Forecast & Runway Trajectory"
      pageSubtitle="TREASURY & FISCAL • Predictive Bayesian runway modeling, upcoming event ledgers, and milestone trajectory simulation"
    >
      <ForecastClient />
    </AppLayout>
  );
}
