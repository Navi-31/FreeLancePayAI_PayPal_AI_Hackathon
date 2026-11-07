import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/backend/auth/auth";
import { getTaxEstimate, updateTaxEstimate } from "@/backend/services/taxService";

export async function GET() {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const estimate = await getTaxEstimate(session.userId);
    return NextResponse.json({ estimate });
  } catch (error) {
    console.error("Get tax estimate error:", error);
    return NextResponse.json({ error: "Failed to fetch tax estimate" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const updated = await updateTaxEstimate(session.userId, body);
    return NextResponse.json({ success: true, estimate: updated });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update tax estimate" },
      { status: 400 }
    );
  }
}
