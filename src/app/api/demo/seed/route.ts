import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/backend/auth/auth";
import { seedDemoDataForUser, DEMO_SYNTHETIC_MARKER } from "@/backend/services/demoSeedService";
import { recordAuditLog } from "@/backend/services/auditService";
import { z } from "zod";

const seedRequestSchema = z
  .object({
    reset: z.boolean().optional(),
    confirm: z.boolean().optional(),
  })
  .strict();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    let body: { reset?: boolean; confirm?: boolean } = {};

    try {
      const raw = await request.json();
      const parsed = seedRequestSchema.safeParse(raw);
      if (parsed.success) {
        body = parsed.data;
      }
    } catch {
      // Body is optional; default to standard seed
    }

    if (!session) {
      // Return signal for client to seed local demo storage in offline/unauthenticated mode
      return NextResponse.json({
        success: true,
        mode: "local_demo",
        message: "Local demo state ready to be seeded in client storage.",
      });
    }

    const isReset = Boolean(body.reset);
    const result = await seedDemoDataForUser(session.userId, isReset);

    await recordAuditLog({
      userId: session.userId,
      action: isReset ? "demo_data_reset" : "demo_data_seeded",
      entityType: "System",
      details: {
        ...result.counts,
        resetTargetedOnly: true,
        persistentMarker: DEMO_SYNTHETIC_MARKER,
        preservedGenuineUserData: true,
      },
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
