import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { seedDemoDataForUser } from "@/services/demoSeedService";
import { recordAuditLog } from "@/services/auditService";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    let body: { reset?: boolean } = {};
    try {
      body = await request.json();
    } catch {
      // Body is optional
    }

    if (!session) {
      // Return signal for client to seed local demo storage
      return NextResponse.json({
        success: true,
        mode: "local_demo",
        message: "Local demo state ready to be seeded in client storage.",
      });
    }

    const result = await seedDemoDataForUser(session.userId, Boolean(body.reset));

    await recordAuditLog({
      userId: session.userId,
      action: body.reset ? "demo_data_reset" : "demo_data_seeded",
      entityType: "System",
      details: result.counts,
    });

    return NextResponse.json({
      ...result,
      mode: "neon_database",
    });
  } catch (error) {
    console.error("Demo seed error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to seed demo data" },
      { status: 500 }
    );
  }
}
