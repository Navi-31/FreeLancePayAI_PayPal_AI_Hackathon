import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { refundPayment } from "@/services/paypalService";
import { z } from "zod";

const refundSchema = z.object({
  invoiceId: z.string().optional(),
  milestoneId: z.string().optional(),
  transactionId: z.string().optional(),
  amount: z.number().positive("Refund amount must be positive").optional(),
  reason: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = refundSchema.parse(body);

    const result = await refundPayment(session.userId, validated);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to process PayPal refund";
    console.error("PayPal refund error:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
