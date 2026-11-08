import { NextResponse } from "next/server";
import { getLiveExchangeRates } from "@/backend/services/currencyService";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getLiveExchangeRates();
    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        base: "USD",
        rates: { USD: 1.0, EUR: 0.8958, INR: 94.11 },
        lastUpdated: new Date().toISOString(),
        error: "Failed to load live rates",
      },
      { status: 200 }
    );
  }
}
