import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { updateMilestoneStatus } from "@/services/projectService";
import { MilestoneStatusType } from "@/lib/financialCalculations";
import { z } from "zod";

const updateMilestoneSchema = z.object({
  status: z.enum(["pending", "authorized", "in_review", "captured", "refunded", "cancelled"]),
  userConfirmed: z.boolean().default(true),
  notes: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const result = updateMilestoneSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await updateMilestoneStatus(
      session.userId,
      id,
      result.data.status as MilestoneStatusType,
      result.data.userConfirmed,
      result.data.notes
    );

    return NextResponse.json({ success: true, milestone: updated });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update milestone" },
      { status: 400 }
    );
  }
}
