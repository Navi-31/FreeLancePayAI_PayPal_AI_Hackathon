import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/backend/auth/auth";
import { syncPayPalInvoiceStatus } from "@/backend/services/paypalService";
import { z } from "zod";

const syncInvoiceSchema = z.object({
  invoiceId: z.string(),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = syncInvoiceSchema.parse(body);

    const result = await syncPayPalInvoiceStatus(session.userId, validated.invoiceId);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to sync PayPal invoice";
    console.error("PayPal sync invoice error:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
