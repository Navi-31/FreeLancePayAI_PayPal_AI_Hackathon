import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/backend/auth/auth";
import {
  createInvoicePaymentOrder,
  createMilestoneAuthorizationOrder,
} from "@/backend/services/paypalService";
import { z } from "zod";

const createOrderSchema = z.object({
  invoiceId: z.string().optional(),
  milestoneId: z.string().optional(),
  returnUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = createOrderSchema.parse(body);

    if (!validated.invoiceId && !validated.milestoneId) {
      return NextResponse.json(
        { error: "Either invoiceId or milestoneId must be provided" },
        { status: 400 }
      );
    }

    if (validated.invoiceId) {
      const order = await createInvoicePaymentOrder(
        session.userId,
        validated.invoiceId,
        validated.returnUrl,
        validated.cancelUrl
      );
      return NextResponse.json(order);
    } else if (validated.milestoneId) {
      const order = await createMilestoneAuthorizationOrder(
        session.userId,
        validated.milestoneId,
        validated.returnUrl,
        validated.cancelUrl
      );
      return NextResponse.json(order);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create PayPal order";
    console.error("PayPal create order error:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
