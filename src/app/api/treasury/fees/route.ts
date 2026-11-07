import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/backend/auth/auth";
import { computeFeeAndCurrencyScenarios } from "@/backend/services/financialIntelligence";

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const amountParam = searchParams.get("amount");
  const grossAmount = amountParam ? parseFloat(amountParam) : 2500.0;

  const feeIntelligence = computeFeeAndCurrencyScenarios(Number.isFinite(grossAmount) ? grossAmount : 2500.0);

  return NextResponse.json({
    success: true,
    data: feeIntelligence,
  });
}
