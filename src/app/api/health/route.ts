import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { env, isLiveDatabaseConfigured } from "@/lib/env";
import { getActiveAiProvider } from "@/lib/ai/aiProvider";
import { getActiveEmailProvider } from "@/lib/email/emailProvider";

export async function GET() {
  const startTime = Date.now();
  let dbStatus = "disconnected";
  let dbLatencyMs: number | null = null;

  // 1. Check Neon PostgreSQL Database Connectivity
  if (isLiveDatabaseConfigured()) {
    try {
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      dbLatencyMs = Date.now() - dbStart;
      dbStatus = "connected";
    } catch {
      dbStatus = "error";
    }
  } else {
    dbStatus = "unconfigured_demo";
  }

  // 2. Check AI Provider
  const ai = getActiveAiProvider();

  // 3. Check Email Provider
  const email = getActiveEmailProvider();

  // 4. Check PayPal
  const paypalConfigured = Boolean(
    env.PAYPAL_CLIENT_ID &&
      !env.PAYPAL_CLIENT_ID.startsWith("placeholder") &&
      env.PAYPAL_CLIENT_SECRET &&
      !env.PAYPAL_CLIENT_SECRET.startsWith("placeholder")
  );

  const healthy = dbStatus === "connected" || dbStatus === "unconfigured_demo";

  return NextResponse.json(
    {
      status: healthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: env.NODE_ENV,
      services: {
        database: {
          status: dbStatus,
          latencyMs: dbLatencyMs,
          engine: "Neon PostgreSQL",
        },
        ai: {
          provider: ai.provider,
          model: ai.model,
          isConfigured: ai.isConfigured,
        },
        email: {
          provider: email.provider,
          isConfigured: email.isConfigured,
        },
        paypal: {
          environment: env.PAYPAL_ENVIRONMENT,
          isConfigured: paypalConfigured,
        },
        backgroundJobs: {
          status: "active",
          schedulerEndpoint: "/api/cron/process-jobs",
        },
      },
      responseTimeMs: Date.now() - startTime,
    },
    { status: healthy ? 200 : 503 }
  );
}
