import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { listEmailDeliveries } from "@/services/emailService";

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const workflow = searchParams.get("workflow") || undefined;
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const deliveries = await listEmailDeliveries(session.userId, {
      workflow,
      limit,
      offset,
    });

    return NextResponse.json({ deliveries });
  } catch (error) {
    console.error("List email deliveries error:", error);
    return NextResponse.json({ error: "Failed to list email deliveries" }, { status: 500 });
  }
}
