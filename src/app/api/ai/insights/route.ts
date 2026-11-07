import { NextResponse } from "next/server";
import { getServerSession } from "@/backend/auth/auth";
import { explainFinancialMetrics } from "@/backend/services/aiService";

export async function GET() {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await explainFinancialMetrics(session.userId);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch financial insights";
    console.error("AI Insights error:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
