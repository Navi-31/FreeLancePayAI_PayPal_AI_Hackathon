import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { recordAuditLog } from "./auditService";

export interface UpdateSettingsInput {
  baseCurrency?: string;
  defaultTerms?: string;
  taxRoutingEnabled?: boolean;
  lateFeeEnabled?: boolean;
  recoveryThreshold?: number;
  paypalMerchantConnected?: boolean;
  stripeConnected?: boolean;
  autonomousShieldActive?: boolean;
}

export async function getFinancialSettings(userId: string) {
  let settings = await prisma.financialSettings.findUnique({
    where: { userId },
  });

  if (!settings) {
    settings = await prisma.financialSettings.create({
      data: {
        userId,
        baseCurrency: "USD",
        defaultTerms: "Net-14",
        taxRoutingEnabled: true,
        lateFeeEnabled: true,
        recoveryThreshold: new Prisma.Decimal(6.0),
        paypalMerchantConnected: true,
        stripeConnected: true,
        autonomousShieldActive: true,
      },
    });
  }

  return settings;
}

export async function updateFinancialSettings(userId: string, input: UpdateSettingsInput) {
  const current = await getFinancialSettings(userId);

  const updated = await prisma.financialSettings.update({
    where: { id: current.id },
    data: {
      ...(input.baseCurrency ? { baseCurrency: input.baseCurrency } : {}),
      ...(input.defaultTerms ? { defaultTerms: input.defaultTerms } : {}),
      ...(input.taxRoutingEnabled !== undefined ? { taxRoutingEnabled: input.taxRoutingEnabled } : {}),
      ...(input.lateFeeEnabled !== undefined ? { lateFeeEnabled: input.lateFeeEnabled } : {}),
      ...(input.recoveryThreshold !== undefined ? { recoveryThreshold: new Prisma.Decimal(input.recoveryThreshold) } : {}),
      ...(input.paypalMerchantConnected !== undefined ? { paypalMerchantConnected: input.paypalMerchantConnected } : {}),
      ...(input.stripeConnected !== undefined ? { stripeConnected: input.stripeConnected } : {}),
      ...(input.autonomousShieldActive !== undefined ? { autonomousShieldActive: input.autonomousShieldActive } : {}),
    },
  });

  await recordAuditLog({
    userId,
    action: "financial_settings_updated",
    entityType: "FinancialSettings",
    entityId: updated.id,
    details: input as Record<string, unknown>,
  });

  return updated;
}
