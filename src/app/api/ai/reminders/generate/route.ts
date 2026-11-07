import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/backend/auth/auth";
import { generateReminderDraft } from "@/backend/services/aiService";
import { z } from "zod";

const reminderRequestSchema = z.object({
  invoiceId: z.string(),
  tone: z.enum(["polite", "firm", "formal", "executive"]).optional(),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = reminderRequestSchema.parse(body);

    const result = await generateReminderDraft(
      session.userId,
      validated.invoiceId,
      validated.tone
    );
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate reminder";
    console.error("AI Reminder error:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
