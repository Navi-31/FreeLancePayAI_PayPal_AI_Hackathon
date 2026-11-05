import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { CopilotClient } from "@/features/ai/CopilotClient";

export default function AiCopilotPage() {
  return (
    <AppLayout
      pageTitle="AI Financial Copilot"
      pageSubtitle="AUTONOMOUS AI • Real-time Business Intelligence Engine"
      userBadge="Private Vault Tier"
    >
      <CopilotClient />
    </AppLayout>
  );
}
