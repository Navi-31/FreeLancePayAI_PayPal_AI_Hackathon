import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { SettingsClient } from "@/features/settings/SettingsClient";

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
