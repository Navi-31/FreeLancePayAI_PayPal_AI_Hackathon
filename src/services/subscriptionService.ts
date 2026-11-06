import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { recordAuditLog } from "./auditService";

export interface CreateSubscriptionInput {
  name: string;
  subTitle: string;
  category: string;
  costMonthly: number;
  currency?: string;
  lastActive: string;
  usageScore?: number;
  usageStatus?: string;
  recommendation?: string;
  nextRenewal?: string | Date;
  dueCategory?: string;
  initials?: string;
}

export async function listSubscriptions(userId: string) {
  return prisma.subscription.findMany({
    where: { userId },
    orderBy: { costMonthly: "desc" },
  });
}

export async function createSubscription(userId: string, input: CreateSubscriptionInput) {
  const sub = await prisma.subscription.create({
    data: {
      userId,
      name: input.name,
      subTitle: input.subTitle,
      category: input.category,
      costMonthly: new Prisma.Decimal(input.costMonthly),
      currency: input.currency || "USD",
      lastActive: input.lastActive,
      usageScore: input.usageScore ?? 50,
      usageStatus: input.usageStatus || "High",
      recommendation: input.recommendation || "Keep Active",
      nextRenewal: input.nextRenewal ? new Date(input.nextRenewal) : null,
      dueCategory: input.dueCategory || "30d",
      initials: input.initials || input.name.substring(0, 2),
    },
  });

  await recordAuditLog({
    userId,
    action: "subscription_created",
    entityType: "Subscription",
    entityId: sub.id,
    details: { name: sub.name, costMonthly: input.costMonthly },
  });

  return sub;
}

export async function updateSubscription(
  userId: string,
  id: string,
  input: Partial<CreateSubscriptionInput>
) {
  const existing = await prisma.subscription.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    throw new Error("Subscription not found or unauthorized");
  }

  const updated = await prisma.subscription.update({
    where: { id: existing.id },
    data: {
      ...(input.name ? { name: input.name } : {}),
      ...(input.recommendation ? { recommendation: input.recommendation } : {}),
      ...(input.costMonthly !== undefined ? { costMonthly: new Prisma.Decimal(input.costMonthly) } : {}),
      ...(input.usageStatus ? { usageStatus: input.usageStatus } : {}),
    },
  });

  await recordAuditLog({
    userId,
    action: "subscription_updated",
    entityType: "Subscription",
    entityId: updated.id,
  });

  return updated;
}
