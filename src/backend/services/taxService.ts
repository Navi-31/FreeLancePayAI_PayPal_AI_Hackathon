import { prisma } from "@/backend/db/db";
import { Prisma } from "@prisma/client";
import { recordAuditLog } from "./auditService";

export interface TaxEstimateUpdateInput {
  jurisdiction?: string;
  entityType?: string;
  taxRatio?: number;
  deductibleOffset?: number;
  vaultSetAside?: number;
  quarter?: string;
}

export async function getTaxEstimate(userId: string) {
  let estimate = await prisma.taxEstimate.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  if (!estimate) {
    // Generate default if not present
    estimate = await prisma.taxEstimate.create({
      data: {
        userId,
        jurisdiction: "US-CA",
        entityType: "LLC",
        taxRatio: new Prisma.Decimal(25.0),
        grossInflows: new Prisma.Decimal(142650.0),
        deductibleOffset: new Prisma.Decimal(24250.0),
        taxableBase: new Prisma.Decimal(118400.0),
        suggestedReserve: new Prisma.Decimal(29600.0),
        vaultSetAside: new Prisma.Decimal(28500.0),
        quarter: "Q4-2025",
      },
    });
  }

  return estimate;
}

export async function updateTaxEstimate(userId: string, input: TaxEstimateUpdateInput) {
  const current = await getTaxEstimate(userId);

  const ratio = input.taxRatio ?? Number(current.taxRatio);
  const deductible = input.deductibleOffset ?? Number(current.deductibleOffset);
  const gross = Number(current.grossInflows);
  const taxableBase = Math.max(0, gross - deductible);
  const suggestedReserve = Math.round(((taxableBase * ratio) / 100) * 100) / 100;
  const vaultSetAside = input.vaultSetAside !== undefined ? input.vaultSetAside : Number(current.vaultSetAside);

  const updated = await prisma.taxEstimate.update({
    where: { id: current.id },
    data: {
      ...(input.jurisdiction ? { jurisdiction: input.jurisdiction } : {}),
      ...(input.entityType ? { entityType: input.entityType } : {}),
      taxRatio: new Prisma.Decimal(ratio),
      deductibleOffset: new Prisma.Decimal(deductible),
      taxableBase: new Prisma.Decimal(taxableBase),
      suggestedReserve: new Prisma.Decimal(suggestedReserve),
      vaultSetAside: new Prisma.Decimal(vaultSetAside),
      ...(input.quarter ? { quarter: input.quarter } : {}),
    },
  });

  await recordAuditLog({
    userId,
    action: "tax_estimate_recalculated",
    entityType: "TaxEstimate",
    entityId: updated.id,
    details: { ratio, deductible, suggestedReserve, vaultSetAside },
  });

  return updated;
}
