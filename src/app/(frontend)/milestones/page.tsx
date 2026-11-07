import React from "react";
import { AppLayout } from "@/frontend/components/layout/AppLayout";
import { MilestonesClient } from "@/frontend/features/payments/milestones/MilestonesClient";

export default function MilestonePaymentsPage() {
  return (
    <AppLayout
      pageTitle="Milestone Payments"
      pageSubtitle="CORE PROTOCOL • Milestone Authorization & Capture Engine"
      userBadge="Private Vault Tier"
    >
      <MilestonesClient />
    </AppLayout>
  );
}
