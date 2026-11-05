import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { SubscriptionsClient } from "@/features/subscriptions/SubscriptionsClient";

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
