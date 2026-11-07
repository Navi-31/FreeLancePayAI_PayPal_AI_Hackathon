import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/backend/auth/auth";
import { listTransactions, createTransaction } from "@/backend/services/transactionService";
import { z } from "zod";

const createTransactionSchema = z.object({
  code: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  clientName: z.string().min(1, "Client name is required"),
  type: z.string().min(1, "Transaction type is required"),
  status: z.string().optional(),
  currency: z.string().optional(),
  currencySymbol: z.string().optional(),
  grossAmount: z.number().positive("Gross amount must be positive"),
  feeAmount: z.number().min(0).optional(),
  fxCost: z.number().min(0).optional(),
  paymentChannel: z.string().min(1, "Payment channel is required"),
  linkedInvoiceId: z.string().optional(),
  linkedMilestoneId: z.string().optional(),
  notes: z.string().optional(),
  idempotencyKey: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || undefined;
  const status = searchParams.get("status") || undefined;
  const search = searchParams.get("search") || undefined;
  const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 50;
  const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!, 10) : 0;

  try {
    const data = await listTransactions(session.userId, { type, status, search, limit, offset });
    return NextResponse.json(data);
  } catch (error) {
    console.error("List transactions error:", error);
    return NextResponse.json({ error: "Failed to list transactions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = createTransactionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const tx = await createTransaction(session.userId, result.data);
    return NextResponse.json({ success: true, transaction: tx }, { status: 201 });
  } catch (error) {
    console.error("Create transaction error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to record transaction" },
      { status: 500 }
    );
  }
}
