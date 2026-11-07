import { NextRequest, NextResponse } from "next/server";
import { handlePayPalWebhook } from "@/backend/services/paypalService";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const headers: Record<string, string> = {};

    request.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    const result = await handlePayPalWebhook(rawBody, headers);
    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Webhook processing failed";
    console.error("PayPal webhook error:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
