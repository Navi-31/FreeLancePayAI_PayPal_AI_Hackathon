import { NextRequest, NextResponse } from "next/server";
import { env } from "@/backend/validation/env";
import { processPendingJobs } from "@/backend/services/jobService";

function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const xCronSecret = request.headers.get("x-cron-secret");

  const expectedSecret = env.CRON_SECRET;
  if (!expectedSecret) return false;

  if (xCronSecret && xCronSecret === expectedSecret) {
    return true;
  }

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    return token === expectedSecret;
  }

  return false;
}

export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized: Invalid or missing CRON_SECRET" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const limit = typeof body.limit === "number" ? body.limit : 15;
    const workerId = typeof body.workerId === "string" ? body.workerId : `cron_${Date.now()}`;

    const summary = await processPendingJobs({ limit, workerId });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary,
    });
  } catch (error) {
    console.error("Cron job runner error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to execute cron job batch" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized: Invalid or missing CRON_SECRET" }, { status: 401 });
  }

  try {
    const summary = await processPendingJobs({ limit: 15 });
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary,
    });
  } catch (error) {
    console.error("Cron job runner error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to execute cron job batch" },
      { status: 500 }
    );
  }
}
