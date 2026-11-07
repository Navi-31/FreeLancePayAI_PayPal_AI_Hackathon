import { prisma, Prisma } from "@/backend/db/db";
import {
  isValidMilestoneTransition,
  MilestoneStatusType,
  calculateTransactionNet,
  calculateTaxReserveAllocation,
} from "@/shared/financialCalculations";
import { recordAuditLog } from "./auditService";

export interface CreateMilestoneInput {
  code?: string;
  title: string;
  description: string;
  amount: number;
  dueDate: string | Date;
}

export interface CreateProjectInput {
  clientId: string;
  code?: string;
  escrowId?: string;
  title: string;
  description?: string;
  currency?: string;
  currencySymbol?: string;
  milestones: CreateMilestoneInput[];
}

export async function listProjects(userId: string) {
  return prisma.project.findMany({
    where: { userId },
    include: {
      client: true,
      milestones: {
        orderBy: { dueDate: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getProjectById(userId: string, projectId: string) {
  return prisma.project.findFirst({
    where: {
      userId,
      OR: [{ id: projectId }, { code: projectId }],
    },
    include: {
      client: true,
      milestones: {
        include: {
          history: {
            orderBy: { timestamp: "desc" },
          },
        },
        orderBy: { dueDate: "asc" },
      },
    },
  });
}

export async function createProject(userId: string, input: CreateProjectInput) {
  const code = input.code || `PRJ-${Math.floor(1000 + Math.random() * 9000)}`;
  const escrowId = input.escrowId || `#ESC-${Math.floor(1000 + Math.random() * 9000)}`;

  let totalAmount = 0;
  const milestonesToCreate = input.milestones.map((ms, idx) => {
    totalAmount += ms.amount;
    return {
      code: ms.code || `MS-${idx + 101}`,
      title: ms.title,
      description: ms.description,
      amount: new Prisma.Decimal(ms.amount),
      dueDate: new Date(ms.dueDate),
      status: "pending",
    };
  });

  const project = await prisma.$transaction(async (tx) => {
    return tx.project.create({
      data: {
        userId,
        clientId: input.clientId,
        code,
        escrowId,
        title: input.title,
        description: input.description,
        totalAmount: new Prisma.Decimal(totalAmount),
        currency: input.currency || "USD",
        currencySymbol: input.currencySymbol || "$",
        milestones: {
          create: milestonesToCreate,
        },
      },
      include: {
        milestones: true,
      },
    });
  });

  await recordAuditLog({
    userId,
    action: "project_created",
    entityType: "Project",
    entityId: project.id,
    details: { code: project.code, totalAmount },
  });

  return project;
}

export async function updateMilestoneStatus(
  userId: string,
  milestoneId: string,
  newStatus: MilestoneStatusType,
  userConfirmed: boolean = true,
  notes?: string
) {
  // Verify milestone ownership via project.userId
  const milestone = await prisma.milestone.findFirst({
    where: {
      OR: [{ id: milestoneId }, { code: milestoneId }],
      project: { userId },
    },
    include: {
      project: {
        include: { client: true },
      },
    },
  });

  if (!milestone) {
    throw new Error("Milestone not found or unauthorized");
  }

  const currentStatus = milestone.status as MilestoneStatusType;
  if (!isValidMilestoneTransition(currentStatus, newStatus)) {
    throw new Error(`Invalid milestone status transition from ${currentStatus} to ${newStatus}`);
  }

  const result = await prisma.$transaction(async (tx) => {
    // 1. Update milestone status
    const updatedMs = await tx.milestone.update({
      where: { id: milestone.id },
      data: {
        status: newStatus,
        ...(newStatus === "authorized" ? { authorizedAt: new Date() } : {}),
        ...(newStatus === "captured" ? { capturedAt: new Date() } : {}),
        ...(newStatus === "refunded" ? { refundedAt: new Date() } : {}),
      },
    });

    // 2. Append to milestone history
    await tx.milestoneHistory.create({
      data: {
        milestoneId: milestone.id,
        action: `Status transitioned to ${newStatus}`,
        fromStatus: currentStatus,
        toStatus: newStatus,
        userConfirmed,
        notes,
      },
    });

    // 3. If milestone is captured, atomically create settlement transaction and tax shield allocation
    if (newStatus === "captured" && currentStatus !== "captured") {
      const gross = Number(milestone.amount);
      const fee = Number(new Prisma.Decimal(gross * 0.029).toFixed(2)); // Standard 2.9% fee
      const net = calculateTransactionNet(gross, fee, 0);
      const taxReserve = calculateTaxReserveAllocation(gross, 20);

      const txCode = `TXN-${Math.floor(10000 + Math.random() * 90000)}`;
      const hash = `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 6)}`;

      await tx.transaction.create({
        data: {
          code: txCode,
          userId,
          hash,
          description: `Milestone ${milestone.code} Escrow Release: ${milestone.title}`,
          clientName: milestone.project.client.name,
          type: "escrow_capture",
          status: "settled",
          currency: milestone.project.currency,
          currencySymbol: milestone.project.currencySymbol,
          grossAmount: new Prisma.Decimal(gross),
          feeAmount: new Prisma.Decimal(fee),
          netAmount: new Prisma.Decimal(net),
          taxReserveSplitAmount: new Prisma.Decimal(taxReserve),
          paymentChannel: "Stripe Connect",
          linkedMilestoneId: milestone.id,
          idempotencyKey: `milestone_capture_${milestone.id}`,
        },
      });
    }

    return updatedMs;
  });

  await recordAuditLog({
    userId,
    action: "milestone_status_updated",
    entityType: "Milestone",
    entityId: milestone.id,
    details: { fromStatus: currentStatus, toStatus: newStatus, userConfirmed },
  });

  return result;
}
