import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/backend/auth/auth";
import { captureInvoicePayment } from "@/backend/services/paypalService";
import { z } from "zod";

const captureOrderSchema = z.object({
  invoiceId: z.string(),
  orderId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = captureOrderSchema.parse(body);

    const result = await captureInvoicePayment(
      session.userId,
      validated.invoiceId,
      validated.orderId
    );

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to capture PayPal payment";
    console.error("PayPal capture error:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
