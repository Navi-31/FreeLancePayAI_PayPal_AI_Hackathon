import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { listExpenses, createExpense } from "@/services/spendingService";
import { z } from "zod";

const createExpenseSchema = z.object({
  merchant: z.string().min(1, "Merchant is required"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  date: z.string(),
  method: z.string().min(1, "Method is required"),
  isRecurring: z.boolean().default(false),
  amount: z.number().positive("Amount must be positive"),
  currency: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || undefined;
  const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 50;
  const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!, 10) : 0;

  try {
    const data = await listExpenses(session.userId, { category, limit, offset });
    return NextResponse.json(data);
  } catch (error) {
    console.error("List expenses error:", error);
    return NextResponse.json({ error: "Failed to list expenses" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = createExpenseSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const expense = await createExpense(session.userId, result.data);
    return NextResponse.json({ success: true, expense }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to record expense" },
      { status: 500 }
    );
  }
}
