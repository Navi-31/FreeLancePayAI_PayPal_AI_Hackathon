import { prisma, Prisma } from "@/backend/db/db";
import {
  calculateTransactionNet,
  calculateTaxReserveAllocation,
} from "@/shared/financialCalculations";
import { recordAuditLog } from "./auditService";

export interface CreateTransactionInput {
  code?: string;
  description: string;
  clientName: string;
  type: string;
  status?: string;
  currency?: string;
  currencySymbol?: string;
  grossAmount: number;
  feeAmount?: number;
  fxCost?: number;
  paymentChannel: string;
  linkedInvoiceId?: string;
  linkedMilestoneId?: string;
  notes?: string;
  idempotencyKey?: string;
}

export async function listTransactions(
  userId: string,
  options?: {
    type?: string;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }
) {
  const where: Prisma.TransactionWhereInput = {
    userId,
    ...(options?.type && options.type !== "all" ? { type: options.type } : {}),
    ...(options?.status && options.status !== "all" ? { status: options.status } : {}),
    ...(options?.search
      ? {
          OR: [
            { code: { contains: options.search, mode: "insensitive" } },
            { description: { contains: options.search, mode: "insensitive" } },
            { clientName: { contains: options.search, mode: "insensitive" } },
            { hash: { contains: options.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [transactions, totalCount] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0,
      include: {
        linkedInvoice: true,
        linkedMilestone: true,
      },
    }),
    prisma.transaction.count({ where }),
  ]);

  return { transactions, totalCount };
}

export async function getTransactionById(userId: string, transactionId: string) {
  return prisma.transaction.findFirst({
    where: {
      userId,
      OR: [{ id: transactionId }, { code: transactionId }],
    },
    include: {
      linkedInvoice: true,
      linkedMilestone: true,
    },
  });
}

export async function createTransaction(userId: string, input: CreateTransactionInput) {
  // Check idempotency to prevent duplicate charges/settlements
  if (input.idempotencyKey) {
    const existing = await prisma.transaction.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });
    if (existing) {
      if (existing.userId !== userId) {
        throw new Error("Unauthorized access to transaction key");
      }
      return existing;
    }
  }

  const gross = input.grossAmount;
  const fee = input.feeAmount ?? 0;
  const fx = input.fxCost ?? 0;
  const net = calculateTransactionNet(gross, fee, fx);
  const taxSplit = calculateTaxReserveAllocation(gross, 20);

  const code = input.code || `TXN-${Math.floor(10000 + Math.random() * 90000)}`;
  const hash = `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 6)}`;

  const transaction = await prisma.transaction.create({
    data: {
      userId,
      code,
      hash,
      description: input.description,
      clientName: input.clientName,
      type: input.type,
      status: input.status || "settled",
      currency: input.currency || "USD",
      currencySymbol: input.currencySymbol || "$",
      grossAmount: new Prisma.Decimal(gross),
      feeAmount: new Prisma.Decimal(fee),
      fxCost: new Prisma.Decimal(fx),
      netAmount: new Prisma.Decimal(net),
      taxReserveSplitAmount: new Prisma.Decimal(taxSplit),
      paymentChannel: input.paymentChannel,
      linkedInvoiceId: input.linkedInvoiceId,
      linkedMilestoneId: input.linkedMilestoneId,
      notes: input.notes,
      idempotencyKey: input.idempotencyKey,
    },
  });

  await recordAuditLog({
    userId,
    action: "transaction_recorded",
    entityType: "Transaction",
    entityId: transaction.id,
    details: { code: transaction.code, netAmount: net, grossAmount: gross },
  });

  return transaction;
}
