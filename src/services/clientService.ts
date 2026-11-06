import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { recordAuditLog } from "./auditService";

export interface CreateClientInput {
  code?: string;
  name: string;
  location?: string;
  industry?: string;
  contactName: string;
  contactRole?: string;
  contactEmail: string;
  riskTier?: string;
  reliabilityScore?: number;
  lifetimeRevenue?: number;
  outstandingBalance?: number;
  avgSettlementLag?: string;
  disputeHistory?: string;
  preferredRails?: string;
  notes?: string;
  playbookWhatWorks?: string;
  playbookWhatFails?: string;
}

export async function listClients(
  userId: string,
  options?: {
    search?: string;
    riskTier?: string;
    limit?: number;
    offset?: number;
  }
) {
  const where: Prisma.ClientWhereInput = {
    userId,
    ...(options?.riskTier ? { riskTier: options.riskTier } : {}),
    ...(options?.search
      ? {
          OR: [
            { name: { contains: options.search, mode: "insensitive" } },
            { code: { contains: options.search, mode: "insensitive" } },
            { contactName: { contains: options.search, mode: "insensitive" } },
            { contactEmail: { contains: options.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [clients, totalCount] = await Promise.all([
    prisma.client.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0,
      include: {
        _count: {
          select: { invoices: true, projects: true },
        },
      },
    }),
    prisma.client.count({ where }),
  ]);

  return { clients, totalCount };
}

export async function getClientById(userId: string, clientId: string) {
  return prisma.client.findFirst({
    where: {
      userId,
      OR: [{ id: clientId }, { code: clientId }],
    },
    include: {
      invoices: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      projects: {
        include: {
          milestones: true,
        },
      },
      paymentHistories: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });
}

export async function createClient(userId: string, input: CreateClientInput) {
  const code = input.code || `CLI-${Math.floor(1000 + Math.random() * 9000)}`;

  const client = await prisma.client.create({
    data: {
      userId,
      code,
      name: input.name,
      location: input.location || "Remote",
      industry: input.industry || "General",
      contactName: input.contactName,
      contactRole: input.contactRole || "Billing Contact",
      contactEmail: input.contactEmail,
      riskTier: input.riskTier || "High Reliability",
      reliabilityScore: input.reliabilityScore ?? 90,
      lifetimeRevenue: new Prisma.Decimal(input.lifetimeRevenue ?? 0),
      outstandingBalance: new Prisma.Decimal(input.outstandingBalance ?? 0),
      avgSettlementLag: input.avgSettlementLag || "+0.0 Days",
      disputeHistory: input.disputeHistory || "0 Formal Disputes",
      preferredRails: input.preferredRails || "PayPal Business Direct (Net-14)",
      notes: input.notes,
      playbookWhatWorks: input.playbookWhatWorks,
      playbookWhatFails: input.playbookWhatFails,
    },
  });

  await recordAuditLog({
    userId,
    action: "client_created",
    entityType: "Client",
    entityId: client.id,
    details: { name: client.name, code: client.code },
  });

  return client;
}

export async function updateClient(
  userId: string,
  clientId: string,
  input: Partial<CreateClientInput>
) {
  const existing = await prisma.client.findFirst({
    where: {
      userId,
      OR: [{ id: clientId }, { code: clientId }],
    },
  });

  if (!existing) {
    throw new Error("Client not found or unauthorized");
  }

  const updated = await prisma.client.update({
    where: { id: existing.id },
    data: {
      ...(input.name ? { name: input.name } : {}),
      ...(input.location ? { location: input.location } : {}),
      ...(input.industry ? { industry: input.industry } : {}),
      ...(input.contactName ? { contactName: input.contactName } : {}),
      ...(input.contactRole ? { contactRole: input.contactRole } : {}),
      ...(input.contactEmail ? { contactEmail: input.contactEmail } : {}),
      ...(input.riskTier ? { riskTier: input.riskTier } : {}),
      ...(input.reliabilityScore !== undefined ? { reliabilityScore: input.reliabilityScore } : {}),
      ...(input.lifetimeRevenue !== undefined ? { lifetimeRevenue: new Prisma.Decimal(input.lifetimeRevenue) } : {}),
      ...(input.outstandingBalance !== undefined ? { outstandingBalance: new Prisma.Decimal(input.outstandingBalance) } : {}),
      ...(input.avgSettlementLag ? { avgSettlementLag: input.avgSettlementLag } : {}),
      ...(input.disputeHistory ? { disputeHistory: input.disputeHistory } : {}),
      ...(input.preferredRails ? { preferredRails: input.preferredRails } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      ...(input.playbookWhatWorks !== undefined ? { playbookWhatWorks: input.playbookWhatWorks } : {}),
      ...(input.playbookWhatFails !== undefined ? { playbookWhatFails: input.playbookWhatFails } : {}),
    },
  });

  await recordAuditLog({
    userId,
    action: "client_updated",
    entityType: "Client",
    entityId: updated.id,
  });

  return updated;
}

export async function deleteClient(userId: string, clientId: string) {
  const existing = await prisma.client.findFirst({
    where: {
      userId,
      OR: [{ id: clientId }, { code: clientId }],
    },
  });

  if (!existing) {
    throw new Error("Client not found or unauthorized");
  }

  await prisma.client.delete({
    where: { id: existing.id },
  });

  await recordAuditLog({
    userId,
    action: "client_deleted",
    entityType: "Client",
    entityId: existing.id,
    details: { code: existing.code, name: existing.name },
  });

  return { success: true };
}

/**
 * Calculates empirical payment reliability intelligence for a client.
 * Uses computeClientReliability from financialIntelligence module.
 */
export async function getClientReliability(userId: string, clientId: string) {
  const client = await prisma.client.findFirst({
    where: {
      userId,
      OR: [{ id: clientId }, { code: clientId }],
    },
    include: {
      invoices: {
        select: {
          status: true,
          dueDate: true,
          paidAt: true,
          total: true,
        },
      },
      paymentHistories: {
        select: {
          status: true,
          lagDays: true,
          settledAt: true,
          amount: true,
        },
      },
    },
  });

  if (!client) {
    throw new Error("Client not found or unauthorized");
  }

  const { computeClientReliability } = await import("@/lib/financialIntelligence");
  return computeClientReliability(client);
}
