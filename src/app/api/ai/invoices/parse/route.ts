import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/backend/auth/auth";
import { parseInvoicePrompt } from "@/backend/services/aiService";
import { z } from "zod";

const parseRequestSchema = z.object({
  prompt: z.string().min(1, "Instruction cannot be empty").max(3000),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = parseRequestSchema.parse(body);

    const result = await parseInvoicePrompt(session.userId, validated.prompt);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to parse invoice instruction";
    console.error("AI Invoice parse error:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
