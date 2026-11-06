import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { recordAuditLog } from "./auditService";

export interface CreateExpenseInput {
  merchant: string;
  description: string;
  category: string;
  date: string | Date;
  method: string;
  isRecurring?: boolean;
  amount: number;
  currency?: string;
}

export async function listExpenses(
  userId: string,
  options?: {
    category?: string;
    limit?: number;
    offset?: number;
  }
) {
  const where: Prisma.ExpenseWhereInput = {
    userId,
    ...(options?.category && options.category !== "All" ? { category: options.category } : {}),
  };

  const [expenses, totalCount] = await Promise.all([
    prisma.expense.findMany({
      where,
      orderBy: { date: "desc" },
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0,
    }),
    prisma.expense.count({ where }),
  ]);

  return { expenses, totalCount };
}

export async function createExpense(userId: string, input: CreateExpenseInput) {
  const expense = await prisma.expense.create({
    data: {
      userId,
      merchant: input.merchant,
      description: input.description,
      category: input.category,
      date: new Date(input.date),
      method: input.method,
      isRecurring: input.isRecurring ?? false,
      amount: new Prisma.Decimal(input.amount),
      currency: input.currency || "USD",
    },
  });

  await recordAuditLog({
    userId,
    action: "expense_recorded",
    entityType: "Expense",
    entityId: expense.id,
    details: { merchant: expense.merchant, amount: input.amount },
  });

  return expense;
}
