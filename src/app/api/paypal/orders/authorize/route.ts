import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/backend/auth/auth";
import { authorizeMilestonePayment } from "@/backend/services/paypalService";
import { z } from "zod";

const authorizeOrderSchema = z.object({
  milestoneId: z.string(),
  orderId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = authorizeOrderSchema.parse(body);

    const result = await authorizeMilestonePayment(
      session.userId,
      validated.milestoneId,
      validated.orderId
    );

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to authorize milestone payment";
    console.error("PayPal authorize error:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
