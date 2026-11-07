import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/backend/auth/auth";
import { generateCopilotResponse } from "@/backend/services/aiService";
import { z } from "zod";

const copilotRequestSchema = z.object({
  prompt: z.string().min(1, "Prompt cannot be empty").max(4000),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = copilotRequestSchema.parse(body);

    const result = await generateCopilotResponse(session.userId, validated.prompt);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate copilot response";
    console.error("AI Copilot error:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
