import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { generateNegotiationProposal } from "@/services/aiService";
import { z } from "zod";

const negotiatorRequestSchema = z.object({
  invoiceId: z.string(),
  strategy: z.enum(["split_installments", "prompt_discount", "waive_surcharge"]),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = negotiatorRequestSchema.parse(body);

    const result = await generateNegotiationProposal(
      session.userId,
      validated.invoiceId,
      validated.strategy
    );
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate negotiation proposal";
    console.error("AI Negotiator error:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
