import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/backend/auth/auth";
import { createAndSendPayPalInvoiceRecord } from "@/backend/services/paypalService";
import { z } from "zod";

const sendInvoiceSchema = z.object({
  invoiceId: z.string(),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = sendInvoiceSchema.parse(body);

    const result = await createAndSendPayPalInvoiceRecord(session.userId, validated.invoiceId);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to send invoice via PayPal";
    console.error("PayPal send invoice error:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
