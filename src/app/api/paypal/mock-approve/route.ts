import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");
  const customId = searchParams.get("customId");

  // Redirect back to invoice with success query param for automated or manual capture
  const redirectUrl = new URL(`/invoices/${customId || ""}`, request.url);
  redirectUrl.searchParams.set("paypal_sandbox_approved", "true");
  if (orderId) redirectUrl.searchParams.set("orderId", orderId);

  return NextResponse.redirect(redirectUrl);
}
