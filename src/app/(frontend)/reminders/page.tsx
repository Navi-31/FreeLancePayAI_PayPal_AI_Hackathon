import React from "react";
import { AppLayout } from "@/frontend/components/layout/AppLayout";
import { RemindersClient } from "@/frontend/features/payments/reminders/RemindersClient";

export default function PaymentRemindersPage() {
  return (
    <AppLayout
      pageTitle="Payment Reminders"
      pageSubtitle="CORE PROTOCOL • Autonomous Collection Copilot"
      userBadge="Private Vault Tier"
    >
      <RemindersClient />
    </AppLayout>
  );
}
