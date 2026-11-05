import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { RemindersClient } from "@/features/payments/reminders/RemindersClient";

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
