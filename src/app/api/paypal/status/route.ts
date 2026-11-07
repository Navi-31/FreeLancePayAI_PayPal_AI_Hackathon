import { NextResponse } from "next/server";
import { getPayPalIntegrationStatus } from "@/backend/services/paypalService";

export async function GET() {
  try {
    const status = await getPayPalIntegrationStatus();
    return NextResponse.json(status);
  } catch (error) {
    console.error("PayPal status error:", error);
    return NextResponse.json({ error: "Failed to fetch PayPal status" }, { status: 500 });
  }
}
