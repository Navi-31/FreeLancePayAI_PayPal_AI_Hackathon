import { NextResponse } from "next/server";
import { getServerSession } from "@/backend/auth/auth";
import { getActiveAiProvider } from "@/backend/integrations/gemini/aiProvider";

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
