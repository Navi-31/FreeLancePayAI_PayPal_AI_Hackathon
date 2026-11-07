import React from "react";
import { AppLayout } from "@/frontend/components/layout/AppLayout";
import { SettingsClient } from "@/frontend/features/settings/SettingsClient";

export default function SettingsAndIntegrationsPage() {
  return (
    <AppLayout
      pageTitle="Workspace Settings & Integrations"
      pageSubtitle="UTILITY ENGINE • Configure autonomous AI guardrails, payment gateway rails, tax shielding, and security policies"
    >
      <SettingsClient />
    </AppLayout>
  );
}
