import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { getClientReliability } from "@/services/clientService";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const reliability = await getClientReliability(session.userId, id);
    return NextResponse.json({ success: true, reliability });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to calculate client reliability";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
