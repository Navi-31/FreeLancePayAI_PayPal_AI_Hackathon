import React from "react";
import { AppLayout } from "@/frontend/components/layout/AppLayout";
import { SubscriptionsClient } from "@/frontend/features/subscriptions/SubscriptionsClient";

export default function SubscriptionManagerPage() {
  return (
    <AppLayout
      pageTitle="Subscription Intelligence & SaaS Audit"
      pageSubtitle="TREASURY & FISCAL • Autonomous recurring software audit, license utilization, and automated single-user downgrade savings"
    >
      <SubscriptionsClient />
    </AppLayout>
  );
}
