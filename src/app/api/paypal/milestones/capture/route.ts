import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/backend/auth/auth";
import { captureMilestonePayment } from "@/backend/services/paypalService";
import { z } from "zod";

const captureMilestoneSchema = z.object({
  milestoneId: z.string(),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = captureMilestoneSchema.parse(body);

    const result = await captureMilestonePayment(session.userId, validated.milestoneId);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to capture milestone payment";
    console.error("PayPal milestone capture error:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
