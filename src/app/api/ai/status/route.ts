import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { getActiveAiProvider } from "@/lib/ai/aiProvider";

export async function GET() {
  const session = await getServerSession();
  const active = getActiveAiProvider();

  return NextResponse.json({
    activeProvider: active.provider,
    model: active.model,
    isConfigured: active.isConfigured,
    isAuthenticated: Boolean(session),
    capabilities: [
      "financial_copilot",
      "invoice_nl_parser",
      "reminder_generator",
      "payment_negotiator",
      "document_scanner",
      "cashflow_explanations",
    ],
  });
}
