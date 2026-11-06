import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { computeCashflowForecastScenarios } from "@/lib/financialIntelligence";
import { roundToTwoDecimals } from "@/lib/financialCalculations";

export async function GET() {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [invoices, expenses, subscriptions, transactions] = await Promise.all([
      prisma.invoice.findMany({ where: { userId: session.userId } }),
      prisma.expense.findMany({ where: { userId: session.userId } }),
      prisma.subscription.findMany({ where: { userId: session.userId } }),
      prisma.transaction.findMany({ where: { userId: session.userId, status: "settled" } }),
    ]);

    const totalExpenses = expenses.reduce((acc, e) => acc + Number(e.amount), 0);
    const netSettled = transactions.reduce((acc, t) => acc + Number(t.netAmount), 0);
    const calculatedLiquidity = roundToTwoDecimals(Math.max(0, netSettled - totalExpenses));
    const liquidBalance = calculatedLiquidity > 0 ? calculatedLiquidity : 42880.5;

    const forecast = computeCashflowForecastScenarios(liquidBalance, invoices, expenses, subscriptions);

    return NextResponse.json({
      success: true,
      authenticated: true,
      data: forecast,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to calculate forecast scenarios";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
