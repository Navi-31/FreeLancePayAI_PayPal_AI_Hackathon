import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import {
  listReminders,
  updateReminderTone,
  simulateSendReminder,
} from "@/services/reminderService";
import { z } from "zod";

const updateToneSchema = z.object({
  id: z.string().min(1),
  action: z.enum(["update_tone", "simulate_send"]),
  tone: z.enum(["polite", "firm", "final"]).optional(),
  notes: z.string().optional(),
  userApproved: z.boolean().default(true),
});

export async function GET() {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const reminders = await listReminders(session.userId);
    return NextResponse.json({ reminders });
  } catch (error) {
    console.error("List reminders error:", error);
    return NextResponse.json({ error: "Failed to list reminders" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = updateToneSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    if (result.data.action === "update_tone") {
      if (!result.data.tone) {
        return NextResponse.json({ error: "Tone is required" }, { status: 400 });
      }
      const updated = await updateReminderTone(
        session.userId,
        result.data.id,
        result.data.tone,
        result.data.userApproved,
        result.data.notes
      );
      return NextResponse.json({ success: true, reminder: updated });
    } else {
      const dispatched = await simulateSendReminder(
        session.userId,
        result.data.id,
        result.data.userApproved
      );
      return NextResponse.json({ success: true, reminder: dispatched });
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update reminder" },
      { status: 400 }
    );
  }
}
