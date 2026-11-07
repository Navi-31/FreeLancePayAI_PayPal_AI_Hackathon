import { prisma, Prisma } from "@/backend/db/db";
import {
  calculateInvoiceTotals,
  calculateLineItemAmount,
  isValidInvoiceTransition,
  InvoiceStatusType,
} from "@/shared/financialCalculations";
import { recordAuditLog } from "./auditService";
import { invalidateDashboardMetricsCache } from "./dashboardService";
import { invalidateAiInsightsCache } from "./aiService";

export interface CreateInvoiceInput {
  code?: string;
  clientId?: string;
  clientName: string;
  clientEmail: string;
  clientAddress?: string;
  projectTitle: string;
  issueDate: string | Date;
  dueDate: string | Date;
  poReference?: string;
  paymentChannel?: string;
  currency?: string;
  currencySymbol?: string;
  taxRatePercent?: number;
  notes?: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    rate: number;
  }>;
}

export async function listInvoices(
  userId: string,
  options?: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }
) {
  const where: Prisma.InvoiceWhereInput = {
    userId,
    ...(options?.status && options.status !== "all" ? { status: options.status } : {}),
    ...(options?.search
      ? {
          OR: [
            { code: { contains: options.search, mode: "insensitive" } },
            { clientName: { contains: options.search, mode: "insensitive" } },
            { projectTitle: { contains: options.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [invoices, totalCount] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: { lineItems: true },
      orderBy: { createdAt: "desc" },
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0,
    }),
    prisma.invoice.count({ where }),
  ]);

  return { invoices, totalCount };
}

export async function getInvoiceById(userId: string, invoiceId: string) {
  return prisma.invoice.findFirst({
    where: {
      userId,
      OR: [{ id: invoiceId }, { code: invoiceId }],
    },
    include: {
      lineItems: true,
      client: true,
      transactions: true,
      reminders: true,
    },
  });
}

export async function createInvoice(userId: string, input: CreateInvoiceInput) {
  // Authoritative calculations
  const taxRate = input.taxRatePercent ?? 0;
  const totals = calculateInvoiceTotals(input.lineItems, taxRate);

  // Generate unique invoice code if not provided
  const invoiceCode =
    input.code || `FP-${Math.floor(1000 + Math.random() * 9000)}`;

  const calculatedLineItems = input.lineItems.map((item) => ({
    description: item.description,
    quantity: new Prisma.Decimal(item.quantity),
    rate: new Prisma.Decimal(item.rate),
    amount: new Prisma.Decimal(calculateLineItemAmount(item.quantity, item.rate)),
  }));

  // Perform inside database transaction
  const invoice = await prisma.$transaction(async (tx) => {
    const created = await tx.invoice.create({
      data: {
        userId,
        code: invoiceCode,
        clientId: input.clientId,
        clientName: input.clientName,
        clientEmail: input.clientEmail,
        clientAddress: input.clientAddress,
        projectTitle: input.projectTitle,
        issueDate: new Date(input.issueDate),
        dueDate: new Date(input.dueDate),
        poReference: input.poReference,
        paymentChannel: input.paymentChannel || "PayPal Direct",
        currency: input.currency || "USD",
        currencySymbol: input.currencySymbol || "$",
        subtotal: new Prisma.Decimal(totals.subtotal),
        taxRatePercent: new Prisma.Decimal(taxRate),
        taxAmount: new Prisma.Decimal(totals.taxAmount),
        total: new Prisma.Decimal(totals.total),
        notes: input.notes,
        status: "draft",
        lineItems: {
          create: calculatedLineItems,
        },
      },
      include: {
        lineItems: true,
      },
    });

    return created;
  });

  await recordAuditLog({
    userId,
    action: "invoice_created",
    entityType: "Invoice",
    entityId: invoice.id,
    details: { code: invoice.code, total: totals.total },
  });

  invalidateDashboardMetricsCache(userId);
  invalidateAiInsightsCache(userId);

  return invoice;
}

export async function updateInvoiceStatus(
  userId: string,
  invoiceId: string,
  newStatus: InvoiceStatusType
) {
  const existing = await prisma.invoice.findFirst({
    where: {
      userId,
      OR: [{ id: invoiceId }, { code: invoiceId }],
    },
  });

  if (!existing) {
    throw new Error("Invoice not found or unauthorized");
  }

  if (!isValidInvoiceTransition(existing.status as InvoiceStatusType, newStatus)) {
    throw new Error(`Invalid status transition from ${existing.status} to ${newStatus}`);
  }

  const updated = await prisma.invoice.update({
    where: { id: existing.id },
    data: {
      status: newStatus,
      ...(newStatus === "paid" ? { paidAt: new Date() } : {}),
    },
    include: { lineItems: true },
  });

  await recordAuditLog({
    userId,
    action: "invoice_status_changed",
    entityType: "Invoice",
    entityId: updated.id,
    details: { fromStatus: existing.status, toStatus: newStatus },
  });

  invalidateDashboardMetricsCache(userId);
  invalidateAiInsightsCache(userId);

  return updated;
}

export async function deleteInvoice(userId: string, invoiceId: string) {
  const existing = await prisma.invoice.findFirst({
    where: {
      userId,
      OR: [{ id: invoiceId }, { code: invoiceId }],
    },
  });

  if (!existing) {
    throw new Error("Invoice not found or unauthorized");
  }

  await prisma.invoice.delete({
    where: { id: existing.id },
  });

  await recordAuditLog({
    userId,
    action: "invoice_deleted",
    entityType: "Invoice",
    entityId: existing.id,
    details: { code: existing.code },
  });

  return { success: true };
}
